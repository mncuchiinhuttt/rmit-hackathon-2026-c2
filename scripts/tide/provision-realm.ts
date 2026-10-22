import { chmod, mkdir, writeFile } from "node:fs/promises";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}; configure the ignored .env file`);
  return value;
}

const base = new URL(process.env.TIDECLOAK_URL ?? "http://localhost:8080");
if (!['localhost', '127.0.0.1', '[::1]'].includes(base.hostname) ||
    base.username || base.password || base.pathname !== '/' || base.search || base.hash) {
  throw new Error("This development bootstrap requires a loopback server URL");
}
if (process.env.TIDE_TERMS_ACCEPTED !== "yes") {
  throw new Error("The licence manager must explicitly accept https://tide.org/legal first");
}
const email = required("TIDE_LICENSE_EMAIL");
if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) throw new Error("Invalid licence email");
const username = required("KC_BOOTSTRAP_ADMIN_USERNAME");
const password = required("KC_BOOTSTRAP_ADMIN_PASSWORD");
const realm = process.env.TIDE_REALM ?? "hui-rmit26";
const clientId = process.env.TIDE_CLIENT_ID ?? "hui-rmit26-client";
for (const name of [realm, clientId]) {
  if (!/^[a-z][a-z0-9-]{2,63}$/.test(name) || ['master', 'myrealm'].includes(name)) {
    throw new Error("Use a dedicated application realm and client name");
  }
}
const origin = new URL(process.env.TIDE_APP_ORIGIN ?? "http://localhost:3000");
if (!['localhost', '127.0.0.1', '[::1]'].includes(origin.hostname) ||
    origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) {
  throw new Error("This development bootstrap requires a loopback application origin");
}
const realmPath = `/admin/realms/${realm}`;
let token = "";

async function login() {
  const response = await fetch(new URL('/realms/master/protocol/openid-connect/token', base), {
    method: 'POST', redirect: 'error', signal: AbortSignal.timeout(30_000),
    body: new URLSearchParams({ grant_type: 'password', client_id: 'admin-cli', username, password }),
  });
  if (!response.ok) throw new Error(`Bootstrap authentication HTTP ${response.status}`);
  token = (await response.json()).access_token;
  if (!token) throw new Error("Bootstrap token missing");
}

async function request(path: string, init: RequestInit = {}, optional = false) {
  const response = await fetch(new URL(path, base), {
    ...init, redirect: 'manual', signal: AbortSignal.timeout(120_000),
    headers: { Authorization: `Bearer ${token}`, ...init.headers },
  });
  if (optional && response.status === 404) return null;
  if (!response.ok) throw new Error(`${init.method ?? 'GET'} ${path}: HTTP ${response.status}`);
  const text = await response.text();
  if (!text) return null;
  try { return JSON.parse(text); } catch { return text; }
}

async function privateFile(path: string, value: unknown) {
  await writeFile(path, JSON.stringify(value, null, 2) + '\n', { mode: 0o600 });
  await chmod(path, 0o600);
}

await login();
const untouchedBefore = await request('/admin/realms/myrealm');
let realmState = await request(realmPath, {}, true);
if (!realmState) {
  if (process.argv.includes('--verify')) throw new Error("Application realm does not exist");
  const source = await Bun.file(new URL('./realm.json.template', import.meta.url)).text();
  const config = JSON.parse(source.replaceAll('REALM_NAME', realm)
    .replaceAll('CLIENT_NAME', clientId).replaceAll('CLIENT_APP_URL', origin.origin));
  await request('/admin/realms', {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(config),
  });
  realmState = await request(realmPath);
  console.log(`Realm created: ${realm}`);
} else {
  console.log(`Realm already exists: ${realm}; preserving its configuration`);
}

await mkdir('.cache', { recursive: true, mode: 0o700 });
if (!process.argv.includes('--verify')) {
  const keys = await request(`${realmPath}/components`);
  const provider = keys.find((key: { providerId: string }) => key.providerId === 'tide-vendor-key');
  const hasActiveKey = provider?.config?.gVRK?.some(Boolean) &&
    provider?.config?.gVRKCertificate?.some(Boolean);
  const configuredIdps = await request(`${realmPath}/identity-provider/instances`);
  if (!hasActiveKey && (provider || configuredIdps.some((idp: { alias: string }) => idp.alias === 'tide'))) {
    throw new Error("Partial Tide setup detected; inspect server logs before recovery. No existing resources were deleted");
  }
  if (!hasActiveKey) {
    const setup = await request(`${realmPath}/vendorResources/setUpTideRealm`, {
      method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ email, licensingTier: 'free', isRagnarokEnabled: 'true', skipLicense: 'false' }),
    });
    await privateFile('.cache/tide-setup-response.json', setup);
    if (typeof setup === 'string' && setup.includes('NEED_PAYMENT')) {
      throw new Error("Free-tier activation requires attention; no paid checkout was followed");
    }
    console.log('Tide setup returned successfully; checking licence independently');
  } else {
    console.log('Active Tide key material found; not reissuing or rotating the licence');
  }
}

await login();
const licence = await request(`${realmPath}/vendorResources/getLicenseDetails`);
await privateFile('.cache/tide-license-details.json', licence);
const idps = await request(`${realmPath}/identity-provider/instances`);
const components = await request(`${realmPath}/components`);
const clients = await request(`${realmPath}/clients?clientId=${clientId}`);
const discovery = await request(`/realms/${realm}/.well-known/openid-configuration`);
const untouchedAfter = await request('/admin/realms/myrealm');
const nowSeconds = Date.now() / 1000;
if (!licence || !Number.isFinite(licence.expiryDate) || !Number.isFinite(licence.vrkExpiry) ||
    !Number.isFinite(licence.currentUserAcc) || licence.currentUserAcc < 0) {
  throw new Error("Licence API returned an unexpected response; refusing to claim activation");
}
const key = components.find((component: { providerId: string }) => component.providerId === 'tide-vendor-key');
const evidence = {
  checkedAt: new Date().toISOString(), realm, clientId,
  issuer: discovery.issuer,
  clientExists: clients.some((client: { clientId: string }) => client.clientId === clientId),
  tideIdentityProvider: idps.some((idp: { alias: string; enabled: boolean }) => idp.alias === 'tide' && idp.enabled),
  tideKeyProvider: Boolean(key?.config?.gVRK?.some(Boolean) && key?.config?.gVRKCertificate?.some(Boolean)),
  licenceActive: licence.expiryDate > nowSeconds && licence.vrkExpiry > nowSeconds,
  licenceExpiresAt: new Date(licence.expiryDate * 1000).toISOString(),
  vendorKeyExpiresAt: new Date(licence.vrkExpiry * 1000).toISOString(),
  currentUserAccounts: licence.currentUserAcc,
  myrealmUnchanged: JSON.stringify(untouchedBefore) === JSON.stringify(untouchedAfter),
};
await privateFile('.cache/tide-provision-evidence.json', evidence);
console.log(JSON.stringify(evidence, null, 2));
if (!evidence.clientExists || !evidence.tideIdentityProvider || !evidence.tideKeyProvider ||
    !evidence.licenceActive || !evidence.myrealmUnchanged ||
    evidence.issuer !== `${base.origin}/realms/${realm}`) {
  throw new Error("Provisioning verification failed; inspect local .cache evidence without publishing it");
}
console.log('Verified active licence and vendor key; private setup data remains in ignored .cache files');
