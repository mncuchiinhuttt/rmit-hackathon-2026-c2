import type { Database } from "bun:sqlite";
import { createHash, randomBytes } from "node:crypto";
import type { DemoRole } from "../model";

export const SESSION_COOKIE = "hui_simulation";
const SESSION_SECONDS = 8 * 60 * 60;
function tokenHash(token: string) { return createHash("sha256").update(token).digest("hex"); }

export function sessionActor(database: Database, token: string | undefined): DemoRole | null {
  if (!token || !/^[a-f0-9]{64}$/.test(token)) return null;
  return database.query<{ actor: DemoRole }, [string, number]>(
    "SELECT actor FROM simulation_sessions WHERE token_hash=? AND expires_at>?",
  ).get(tokenHash(token), Math.floor(Date.now() / 1000))?.actor ?? null;
}

export function deleteSession(database: Database, token: string | undefined): void {
  if (token) database.query("DELETE FROM simulation_sessions WHERE token_hash=?").run(tokenHash(token));
}

export function createSession(database: Database, actor: DemoRole, oldToken?: string): string {
  return database.transaction(() => {
    deleteSession(database, oldToken);
    database.query("DELETE FROM simulation_sessions WHERE expires_at<=?").run(Math.floor(Date.now() / 1000));
    const token = randomBytes(32).toString("hex");
    database.query("INSERT INTO simulation_sessions VALUES (?, ?, ?)").run(tokenHash(token), actor, Math.floor(Date.now() / 1000) + SESSION_SECONDS);
    return token;
  }).immediate();
}

export function sessionCookie(token: string, secure: boolean): string {
  return `${SESSION_COOKIE}=${token}; Path=/api/simulation; HttpOnly; SameSite=Strict; Max-Age=${token ? SESSION_SECONDS : 0}${secure ? "; Secure" : ""}`;
}
