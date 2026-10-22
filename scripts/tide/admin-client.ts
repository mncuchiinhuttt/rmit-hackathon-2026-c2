import { chmod, mkdir, writeFile } from "node:fs/promises";

export const realmName = process.env.TIDE_REALM ?? "hui-rmit26";
export const clientName = process.env.TIDE_CLIENT_ID ?? "hui-rmit26-client";
export const serverUrl = process.env.TIDECLOAK_URL ?? "http://localhost:8080";
if (!['localhost', '127.0.0.1'].includes(new URL(serverUrl).hostname) ||
    !/^[a-z][a-z0-9-]+$/.test(realmName) || ['master', 'myrealm'].includes(realmName)) {
  throw new Error("Bootstrap is restricted to the local application realm");
}
let token = "";
let expiresAt = 0;

async function authenticate() {
  const username = process.env.KC_BOOTSTRAP_ADMIN_USERNAME;
  const password = process.env.KC_BOOTSTRAP_ADMIN_PASSWORD;
  if (!username || !password) throw new Error("Bootstrap credentials missing in .env");
  const response = await fetch(`${serverUrl}/realms/master/protocol/openid-connect/token`, {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30_000),
    body: new URLSearchParams({ username, password, grant_type: 'password', client_id: 'admin-cli' }),
  });
  if (!response.ok) throw new Error(`Bootstrap authentication HTTP ${response.status}`);
  const result = await response.json();
  if (typeof result.access_token !== 'string') throw new Error("Missing bootstrap token");
  token = result.access_token;
  expiresAt = Date.now() + Math.max(1, result.expires_in - 10) * 1000;
}

export async function adminApi<T = unknown>(path: string, init: RequestInit = {}): Promise<T> {
  if (Date.now() >= expiresAt) await authenticate();
  const response = await fetch(`${serverUrl}/admin/realms/${realmName}${path}`, {
    ...init, headers: { Authorization: `Bearer ${token}`, ...init.headers },
    redirect: 'manual', signal: AbortSignal.timeout(120_000),
  });
  if (!response.ok) throw new Error(`Bootstrap ${init.method ?? 'GET'} ${path.split('?')[0]} HTTP ${response.status}`);
  const text = await response.text();
  if (!text) return undefined as T;
  try { return JSON.parse(text) as T; } catch { return text as T; }
}

export function jsonWrite(method: string, body: unknown): RequestInit {
  return { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) };
}

export async function savePrivate(path: string, content: string) {
  const directory = path.slice(0, path.lastIndexOf('/'));
  await mkdir(directory, { recursive: true, mode: 0o700 });
  await writeFile(path, content, { mode: 0o600 });
  await chmod(path, 0o600);
}

interface ChangeRequest { id: string; actionType: string; readyToCommit: boolean }
export async function drainFirstAdmin() {
  const authorizers = await adminApi<{ type: string }[]>('/iga/authorizers');
  if (!Array.isArray(authorizers) || authorizers.some(authorizer => authorizer.type !== 'firstAdmin')) {
    throw new Error("Refusing automatic approvals outside the first-admin bootstrap mode");
  }
  const forbidden: Record<string, true> = { DISABLE_IGA: true, DELETE_REALM: true, OFFBOARD_REALM: true };
  for (let pass = 0; pass < 8; pass++) {
    const pending = await adminApi<ChangeRequest[]>('/iga/change-requests?status=PENDING');
    if (!Array.isArray(pending)) throw new Error("Unexpected change-request response");
    if (!pending.length) return;
    if (pending.some(request => forbidden[request.actionType])) {
      throw new Error("Destructive change request present; refusing automatic bootstrap approval");
    }
    for (const request of pending) {
      await adminApi(`/iga/change-requests/${encodeURIComponent(request.id)}/authorize`, jsonWrite('POST', {}));
    }
    const ready = await adminApi<ChangeRequest[]>('/iga/change-requests?status=PENDING');
    for (const request of ready.filter(request => request.readyToCommit)) {
      await adminApi(`/iga/change-requests/${encodeURIComponent(request.id)}/commit`, { method: 'POST' });
    }
  }
  throw new Error("Bootstrap changes remain pending; inspect the Tide console");
}
