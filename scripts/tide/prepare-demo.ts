import { adminApi, clientName, drainFirstAdmin, jsonWrite, realmName, savePrivate, serverUrl } from './admin-client';
import { refreshEnrollmentLinks } from './enrollment-links';

interface User { id: string; username: string; attributes?: Record<string, string[]> }
interface Role { id: string; name: string }
interface Client { id: string; clientId: string }
interface Execution { providerId: string; id: string; authenticationConfig?: string }
if (process.env.TIDE_TERMS_ACCEPTED !== 'yes' || !process.env.TIDE_LICENSE_EMAIL) {
  throw new Error('Explicit licence consent and email must be present');
}
const authorizers = await adminApi<{ type: string }[]>('/iga/authorizers');
if (!Array.isArray(authorizers) || authorizers.some(authorizer => authorizer.type !== 'firstAdmin')) {
  throw new Error('Realm has left first-admin bootstrap mode; use the Tide console');
}

const executions = await adminApi<Execution[]>('/authentication/flows/first%20broker%20login/executions');
const review = executions.find(execution => execution.providerId === 'idp-review-profile');
if (review) {
  const config = { alias: 'review profile config', config: { 'update.profile.on.first.login': 'off' } };
  if (review.authenticationConfig) {
    await adminApi(`/authentication/config/${review.authenticationConfig}`, jsonWrite('PUT', config));
  } else {
    await adminApi(`/authentication/executions/${review.id}/config`, jsonWrite('POST', config));
  }
}
const representation = await adminApi<Record<string, unknown>>('');
await adminApi('', jsonWrite('PUT', {
  ...representation, attributes: { ...(representation.attributes as Record<string, string> ?? {}), 'iga.attestor': 'tide' },
}));
const iga = await adminApi<{ enabled: boolean }>('/tide-admin/iga-status');
if (!iga.enabled) {
  const result = await adminApi<{ enabled: boolean }>('/tide-admin/toggle-iga', {
    method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({ isIGAEnabled: 'true' }),
  });
  if (result.enabled !== true) throw new Error('IGA did not report enabled=true');
}
await drainFirstAdmin();
console.log('IGA enabled; baseline bootstrap changes applied');

for (const number of [1, 3, 4]) {
  const name = `hui-c${number}-winner`;
  const roles = await adminApi<Role[]>('/roles');
  if (!roles.some(role => role.name === name)) {
    await adminApi('/roles', jsonWrite('POST', { name, description: `Read access for synthetic cycle ${number}` }));
    await drainFirstAdmin();
  }
}

// Tide supplies a cryptographic identity, not an email; do not invent addresses for demo users.
const profile = await adminApi<{ attributes: Record<string, unknown>[]; [key: string]: unknown }>('/users/profile');
const attributes = profile.attributes.map(attribute => {
  if (attribute.name !== 'email') return attribute;
  const optional = { ...attribute };
  delete optional.required;
  return optional;
});
await adminApi('/users/profile', jsonWrite('PUT', { ...profile, attributes }));
await drainFirstAdmin();
const verifiedProfile = await adminApi<{ attributes: Record<string, unknown>[] }>('/users/profile');
if (verifiedProfile.attributes.find(attribute => attribute.name === 'email')?.required) {
  throw new Error('Email is still required; refusing to create placeholder addresses');
}

const prepared: Record<string, User & { tideUserKey?: string }> = {};
for (const username of ['hanh', 'tuan', 'mai', 'minh', 'bao']) {
  let users = await adminApi<User[]>(`/users?username=${username}&exact=true`);
  if (!users.length) {
    const user: Record<string, unknown> = {
      username, enabled: true, emailVerified: false, attributes: { tideInvitable: ['true'] },
    };
    if (username === 'hanh') user.email = process.env.TIDE_LICENSE_EMAIL;
    await adminApi('/users', jsonWrite('POST', user));
    await drainFirstAdmin();
    users = await adminApi<User[]>(`/users?username=${username}&exact=true`);
  }
  const user = users[0];
  if (!user?.id) throw new Error(`User preparation failed for ${username}`);
  prepared[username] = { id: user.id, username, tideUserKey: user.attributes?.tideUserKey?.[0] };
}
const encryptor = await adminApi<Role>('/roles/_tide_encryptor');
const assigned = await adminApi<Role[]>(`/users/${prepared.bao.id}/role-mappings/realm`);
if (!assigned.some(role => role.name === encryptor.name)) {
  await adminApi(`/users/${prepared.bao.id}/role-mappings/realm`, jsonWrite('POST', [encryptor]));
  await drainFirstAdmin();
}
await savePrivate('.cache/tide-demo-users.json', JSON.stringify(prepared, null, 2));

const idp = await adminApi<{ config: Record<string, string> }>('/identity-provider/instances/tide');
await adminApi('/identity-provider/instances/tide', jsonWrite('PUT', {
  ...idp, config: { ...idp.config, CustomAdminUIDomain: `${serverUrl}/realms/${realmName}/tide-console/` },
}));
await adminApi('/vendorResources/sign-idp-settings', { method: 'POST' });
await drainFirstAdmin();
const clients = await adminApi<Client[]>(`/clients?clientId=${clientName}`);
if (!clients[0]?.id) throw new Error('App client not found');
const adapter = await adminApi<Record<string, unknown>>(`/vendorResources/get-installations-provider?clientId=${clients[0].id}&providerId=keycloak-oidc-keycloak-json`);
if (!adapter.jwk || !adapter.vendorId || !adapter.homeOrkUrl) throw new Error('Exported adapter lacks required Tide fields');
await savePrivate('data/tidecloak.json', JSON.stringify(adapter, null, 2));

await refreshEnrollmentLinks();
console.log('Five accounts prepared. Private enrollment links: .cache/tide-enrollment.html');
console.log('Public adapter exported. Enrollment and multi-admin quorum are still pending human action.');
