import { adminApi, savePrivate } from './admin-client';

interface User { id: string; username: string; attributes?: Record<string, string[]> }
const names = ['hanh', 'tuan', 'mai', 'minh', 'bao'] as const;
const mapping: Record<string, { id: string; username: string; tideUserKey?: string }> = {};
for (const username of names) {
  const users = await adminApi<User[]>(`/users?username=${username}&exact=true`);
  const user = users.find(user => user.username === username);
  if (!user?.id) throw new Error(`Prepared account ${username} is missing`);
  const tideUserKey = user.attributes?.tideUserKey?.[0];
  mapping[username] = { id: user.id, username, ...(tideUserKey ? { tideUserKey } : {}) };
}
await savePrivate('.cache/tide-demo-users.json', JSON.stringify(mapping, null, 2));
for (const user of Object.values(mapping)) {
  console.log(`${user.username}: ${user.tideUserKey ? 'linked' : 'waiting for human enrollment'}`);
}
const stewardKeys = ['hanh', 'tuan', 'mai'].map(name => mapping[name].tideUserKey).filter(Boolean);
if (stewardKeys.length === 3 && new Set(stewardKeys).size !== 3) {
  throw new Error('Stewards must link three distinct Tide identities; browser profiles alone do not prove a quorum');
}
console.log(`Linked accounts: ${Object.values(mapping).filter(user => user.tideUserKey).length}/${names.length}`);
