import { adminApi, drainFirstAdmin, jsonWrite } from './admin-client';

interface User { id: string; username: string; attributes?: Record<string, string[]> }
interface Role { id: string; name: string }
interface ChangeRequest { id: string; actionType: string; readyToCommit: boolean }
const stewards: User[] = [];
for (const name of ['hanh', 'tuan', 'mai', 'minh', 'bao']) {
  const users = await adminApi<User[]>(`/users?username=${name}&exact=true`);
  const user = users[0];
  if (!user?.id || !user.attributes?.tideUserKey?.[0]) {
    throw new Error(`Complete human enrollment for ${name} before activating governance`);
  }
  if (['hanh', 'tuan', 'mai'].includes(name)) stewards.push(user);
}
if (new Set(stewards.map(user => user.attributes!.tideUserKey[0])).size !== 3) {
  throw new Error('Three distinct steward Tide identities are required');
}
const clients = await adminApi<{ id: string }[]>('/clients?clientId=realm-management');
const client = clients[0];
if (!client?.id) throw new Error('realm-management client missing');
const role = await adminApi<Role>(`/clients/${client.id}/roles/tide-realm-admin`);
const assigned = await adminApi<Role[]>(`/users/${stewards[0].id}/role-mappings/clients/${client.id}`);
if (assigned.some(value => value.name === role.name)) {
  console.log('First steward already has the admin role. Continue in the Tide console; no automatic approvals performed.');
  process.exit(0);
}
await drainFirstAdmin();
await adminApi(`/users/${stewards[0].id}/role-mappings/clients/${client.id}`, jsonWrite('POST', [role]));
const pending = await adminApi<ChangeRequest[]>('/iga/change-requests?status=PENDING');
if (pending.length !== 1 || pending[0].actionType !== 'GRANT_ROLES') {
  throw new Error('Unexpected governance queue; inspect and approve the first-admin grant in the console');
}
const request = pending[0];
await adminApi(`/iga/change-requests/${request.id}/authorize`, jsonWrite('POST', {}));
const remaining = await adminApi<ChangeRequest[]>('/iga/change-requests?status=PENDING');
if (remaining.some(value => value.id === request.id && value.readyToCommit)) {
  await adminApi(`/iga/change-requests/${request.id}/commit`, { method: 'POST' });
}
const activeRoles = await adminApi<Role[]>(`/users/${stewards[0].id}/role-mappings/clients/${client.id}`);
if (!activeRoles.some(value => value.name === role.name)) throw new Error('First-admin grant has not committed');
console.log('First steward role committed. Human enclave approval is required for subsequent governed operations.');
console.log('Sign in as hanh in the Tide console; propose/approve admin grants for tuan and mai, then commit related admin-policy regeneration.');
