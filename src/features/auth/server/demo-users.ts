import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ApiError } from "@/lib/server/api-errors";

export interface DemoUserMapping {
  id: string;
  tideUserKey?: string;
}

type DemoUsers = Readonly<Record<string, DemoUserMapping>>;

function readUsers(): DemoUsers {
  try {
    const path = join(process.cwd(), ".cache", "tide-demo-users.json");
    const raw: unknown = JSON.parse(readFileSync(path, "utf8"));
    if (typeof raw !== "object" || raw === null || Array.isArray(raw)) throw new Error();
    const users: Record<string, DemoUserMapping> = {};
    for (const [username, value] of Object.entries(raw)) {
      if (!/^[a-z0-9._-]{1,64}$/.test(username) || typeof value !== "object" || value === null || Array.isArray(value)) throw new Error();
      const entry = value as Record<string, unknown>;
      if (typeof entry.id !== "string" || entry.id.length < 1 || entry.id.length > 256) throw new Error();
      if (entry.tideUserKey !== undefined && (typeof entry.tideUserKey !== "string" || entry.tideUserKey.length < 1 || entry.tideUserKey.length > 4096)) throw new Error();
      users[username] = {
        id: entry.id,
        ...(typeof entry.tideUserKey === "string" ? { tideUserKey: entry.tideUserKey } : {}),
      };
    }
    if (Object.keys(users).length === 0) throw new Error();
    return users;
  } catch {
    throw new ApiError(503, "demo_users_unavailable", "The private demo user mapping is unavailable.");
  }
}

export function resolveDemoUser(username: string, sub: string, tokenKey: unknown): DemoUserMapping & { username: string; tideUserKey: string } {
  const user = readUsers()[username];
  if (!user || user.id !== sub) {
    throw new ApiError(403, "circle_member_required", "This account is not a mapped circle member.");
  }
  if (typeof tokenKey !== "string" || tokenKey.length === 0 || (user.tideUserKey && user.tideUserKey !== tokenKey)) {
    throw new ApiError(503, "demo_identity_unavailable", "The Tide identity mapping is incomplete.");
  }
  return { username, id: user.id, tideUserKey: user.tideUserKey ?? tokenKey };
}

export function getMappedDemoUser(username: string): DemoUserMapping {
  const user = readUsers()[username];
  if (!user) throw new ApiError(503, "demo_identity_unavailable", "A required demo identity is not mapped.");
  return user;
}

export function listMappedDemoUsers(): Array<{ username: string; id: string; tideUserKey: string }> {
  const users = readUsers();
  return Object.entries(users).map(([username, user]) => {
    if (!user.tideUserKey) {
      throw new ApiError(503, "demo_identity_unavailable", "A required Tide user key is not mapped.");
    }
    return { username, id: user.id, tideUserKey: user.tideUserKey };
  });
}
