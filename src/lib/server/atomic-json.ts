import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, stat, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { ApiError } from "@/lib/server/api-errors";

const DATA_DIR = join(process.cwd(), "data");
const DATA_FILE = join(DATA_DIR, "hostless-hui.json");
const MAX_FILE_BYTES = 1024 * 1024;

declare global {
  var __huiAtomicWriteTail: Promise<void> | undefined;
}

function unavailable(): ApiError {
  return new ApiError(503, "data_store_unavailable", "Release data is unavailable.");
}

async function load<T>(initial: () => T, parse: (value: unknown) => T): Promise<T> {
  try {
    const info = await stat(DATA_FILE);
    if (info.size > MAX_FILE_BYTES) throw unavailable();
    const text = await readFile(DATA_FILE, "utf8");
    let raw: unknown;
    try {
      raw = JSON.parse(text) as unknown;
    } catch {
      throw unavailable();
    }
    return parse(raw);
  } catch (error) {
    if (error instanceof ApiError) throw error;
    if (typeof error === "object" && error !== null && "code" in error && error.code === "ENOENT") return initial();
    throw unavailable();
  }
}

export function readAtomicJson<T>(initial: () => T, parse: (value: unknown) => T): Promise<T> {
  return load(initial, parse);
}

export async function updateAtomicJson<T, R>(
  initial: () => T,
  parse: (value: unknown) => T,
  mutate: (current: T) => { next: T; result: R },
): Promise<R> {
  const prior = globalThis.__huiAtomicWriteTail ?? Promise.resolve();
  const gate = Promise.withResolvers<void>();
  globalThis.__huiAtomicWriteTail = gate.promise;
  await prior;
  try {
    const current = await load(initial, parse);
    const { next, result } = mutate(current);
    const tempFile = join(DATA_DIR, `.hostless-hui.${process.pid}.${randomUUID()}.tmp`);
    try {
      await mkdir(DATA_DIR, { recursive: true, mode: 0o700 });
      await writeFile(tempFile, JSON.stringify(next), { encoding: "utf8", flag: "wx", mode: 0o600 });
      await rename(tempFile, DATA_FILE);
    } catch {
      await unlink(tempFile).catch(() => undefined);
      throw unavailable();
    }
    return result;
  } finally {
    gate.resolve();
  }
}
