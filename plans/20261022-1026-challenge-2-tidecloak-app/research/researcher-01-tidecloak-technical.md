# TideCloak technical feasibility — Bun + React 19

Research date: 2026-10-22. Sources are official Tide/Bun docs, opened local HTTP GETs, and published npm tarballs extracted under `/tmp`. Vendor security properties below are claims made by Tide docs, not independent cryptographic validation.

## Verified facts

| Claim | Source |
|---|---|
| TideCloak is Keycloak-based and keeps the IAM signing key outside the server: the Fabric's independent ORKs hold fragments and make threshold operations without reconstructing the whole key. | [S1] |
| SWE is the browser-side coordinator; BYOiD blinds credentials, verifies Fabric responses, and establishes an ephemeral session key. Tide docs say no password hashes are stored and admins cannot reset/impersonate users unilaterally. | [S1][S2] |
| The JS/React encryption surface is tag-scoped; required roles are `_tide_<tag>.selfencrypt` and `_tide_<tag>.selfdecrypt`. Docs describe decryption at the edge and no server-held plaintext/keys. | [S3][S5][S7] |
| With one `tide-realm-admin`, QEA is `firstAdmin` with threshold 1; adding a second switches to `multiAdmin`. Required quorum is `max(1, floor(0.7 × N admins))`: 2 admins→1 approval; 3→2; 4→2. | [S4] |
| IGA governs sensitive user/role/client writes; captured writes can return `202` + CR id. Current Admin API Reference documents approval over REST; console review/approval also uses the enclave. | [S10][S11] |
| Forseti is Fabric-enforced programmable policy, written as C# `IAccessPolicy` contracts; the IGA API can store contracts (max 1,048,576 chars). | [S10][S12] |
| `@tidecloak/react@0.14.33` has React peer `>=18`; it depends on `@tidecloak/js ^0.14.33`. The JS package depends on `heimdall-tide` and `@tideorg/js`; published ESM has no matched `node:`/Node-builtin imports in the inspected files. | [`package.json:39-54`][S8] |
| JS E2EE input accepts string or `Uint8Array`; returns ordered array of string/`Uint8Array`. No payload cap was stated in inspected docs/types. | [`IAMService.d.ts:329-351`][S8][S5][S7] |
| Official server verifier is `@tidecloak/verify` (0.14.33 exists; dependency `jose ^5.3.0`). Its docs say it checks issuer, `azp`, signature, and optional roles; QEA-enabled tokens use EdDSA, while non-IGA RS256 tokens are rejected by the default accepted algorithm set. | [S13][S14] |
| Local discovery GET returned issuer `http://localhost:8080/realms/myrealm` and JWKS URI `http://localhost:8080/realms/myrealm/protocol/openid-connect/certs`. It lists EdDSA among supported ID-token algorithms; this does not prove this realm's active access-token algorithm or IGA status. | [S15] |
| Local GET to `/realms/myrealm/public/get-tide-config?clientId=myclient` returned `homeOrkUrl: https://ork1.tideprotocol.com`. Local console adapter config GET returned 404; unauthenticated Admin REST GETs for realm, clients, roles, users and IdPs returned 401. | [S16] |
| `@tidecloak/js@0.14.33` has a `postinstall` that copies `silent-check-sso.html` into an existing consumer `public/` directory. Bun does not run arbitrary lifecycle scripts by default; trusted dependencies control them. | [`package.json:27-42`, `postinstall.cjs:1-35`][S8][S17] |

## SDK cheat-sheet (verified signatures only)

**React `@tidecloak/react@0.14.33`**

- `TideCloakContextProvider(props): React.JSX.Element`; props include `children`, optional `config`, `configUrl` (default `/adapter.json`), `authMode?: 'native'|'hybrid'`, `adapter`, and auth callbacks. Undefined `authMode` is standard browser/front-channel mode. `useTideCloak()` aliases `useTideCloakContext()` and returns `TideCloakContextValue`. [`TideCloakContextProvider.d.ts:77-130`, `index.d.ts:12-15`][S8]
- Hook methods: `login(): Promise<void>`, `logout(): Promise<void>`, `getToken(): Promise<string|null>`, `refreshToken(): Promise<boolean>`, `forceRefreshToken(): Promise<boolean>`, `hasRealmRole(role:string): boolean`, `hasClientRole(role:string, resource?:string): boolean`, `getValueFromToken(key:string): any`, `getValueFromIdToken(key:string): any`. [`TideCloakContextProvider.d.ts:33-46`][S8]
- Hook encryption declarations are broad: `doEncrypt(data:any, decryptionPolicy?:Uint8Array):Promise<any>` and `doDecrypt(data:any, decryptionPolicy?:Uint8Array):Promise<any>`. Use JS SDK's stricter item shapes below. [`TideCloakContextProvider.d.ts:45-46`][S8]
- Docs' minimal call: `doEncrypt([{data:'...',tags:['message']}])`; decrypt with `doDecrypt([{encrypted: encrypted[0],tags:['message']}])`. Output order preserved. Roles must be on the user's access token. [S5]

**JavaScript `@tidecloak/js@0.14.33`**

- Import singleton: `import { IAMService } from '@tidecloak/js'`. `initIAM(config:Object, onReady?:Function):Promise<boolean>`; `isLoggedIn():boolean`; `doLogin(returnUrl?:string):void|Promise<void>`; `doLogout():Promise<void>`. [`src/index.d.ts:1-4`, `src/IAMService.d.ts:191,240,327,423`][S8]
- Token helpers: `getToken():Promise<string|null>`; `getIDToken():string|null`; `getTokenExp():number`; `getName():string`; `getValueFromToken(key:string):any`; both `getValueFromIDToken(key:string):any` and casing alias `getValueFromIdToken(key:string):any`; `hasRealmRole(role:string):boolean`; `hasClientRole(role:string, client?:string):boolean`; `updateIAMToken():Promise<boolean>`; `forceUpdateToken():Promise<boolean>`. [`IAMService.d.ts:247-319`][S8]
- E2EE exact types: `doEncrypt(items:{data:string|Uint8Array;tags:string[]}[], decryption_policy?:Uint8Array):Promise<(string|Uint8Array)[]>`; `doDecrypt(items:{encrypted:string|Uint8Array;tags:string[]}[], decryption_policy?:Uint8Array):Promise<(string|Uint8Array)[]>`. `data` is string/bytes, results align with inputs. [`IAMService.d.ts:329-351`][S8]
- No high-level `IAMService.sign()` is declared. Lower-level `TideCloak.executeSignRequest(request:Uint8Array, waitForAll?:boolean):Promise<any[]>` exists; it takes a Tide request, not a generic private-key signing call. React exposes `executeTideRequest`, not `executeSignRequest`. [`lib/tidecloak.d.ts:290-324`, React context declaration:60-62][S8]
- Docs show default redirect `${window.location.origin}/auth/redirect`; `silentCheckSsoRedirectUri` defaults from base/redirect. Provide `public/silent-check-sso.html` containing `parent.postMessage(location.href, location.origin)`. A real `/auth/redirect` route must exist. [S5][S7][`silent-check-sso.html:1`][S8]
- The JS reference docs type `initIAM` as `Promise<void>` and `doLogout` as `void`; the 0.14.33 published declarations say `Promise<boolean>` and `Promise<void>`. Use the downloaded package declarations for this version; docs/package disagree. [S7][`IAMService.d.ts:191,423`][S8]

## Minimal integration recipe

**Five-hour target [INFERENCE]:** ship one “sealed note” vertical slice: sign in; encrypt one small `message` string; Bun stores only ciphertext keyed by verified user `sub`; authorized read returns ciphertext for browser decryption. Avoid files, DPoP, custom Forseti, and a custom admin UI. Parallel split: (A) check realm/client/roles + enrollment, (B) React login/redirect, (C) Bun verifier + ciphertext endpoint, (D) second-user test + demo story/video. Timebox [INFERENCE]: 0–45m realm/enrollment check; 45–135m login + callback; 135–225m E2EE + API; 225–300m integration, second-user test, record required video. OIDC verifier returns token claims, including `sub` when present. [S13][S15]

1. **Use the app client, not the admin console client.** Obtain/download that app's `tidecloak.json`. React provider accepts `config={adapter}`; otherwise it fetches `/adapter.json`. [S5][S8]
2. **Match origin settings.** For Bun at `http://localhost:3000`, allow that web origin and redirect URIs including `http://localhost:3000/auth/redirect` (plus app paths); `realm.json` in the initializer already has `localhost:3000`, wildcard, silent SSO and redirect entries. React docs' Vite example uses `5173`, so don't copy it unchanged. [`realm.json:45-63`][S9][S5]
3. **Serve silent SSO + redirect.** Ensure `/silent-check-sso.html` is served from `public/`; implement `/auth/redirect` and route back after `authenticated`/`isInitializing` settle. [S5][S6][S8]
4. **Wrap React 19 app** with `<TideCloakContextProvider config={adapter}>`. Package's peer range admits React 19 (`>=18`). `useTideCloak()` supplies login/logout, roles, claims, token and E2EE calls. [`package.json:39-54`, provider declaration][S8]
5. **Run SDK E2EE from the UI** (e.g. tag `message`): `const [cipher] = await doEncrypt([{data:text,tags:['message']}]);`; send the returned value to Bun and persist it as ciphertext. On read, return it to the browser for `doDecrypt([{encrypted:cipher,tags:['message']}])`. The SDK API is called in the browser; Tide docs describe Fabric threshold operations and plaintext at the user's edge, not a local-only JS cipher. Exact initial `doEncrypt` wire path is undocumented [UNVERIFIED]. Grant each user `_tide_message.selfencrypt` and `.selfdecrypt`. [S1][S3][S5][S9]
6. **Verify API bearer tokens.** Client gets `const token = await IAMService.getToken()` (or hook `getToken()`), sends `Authorization: Bearer ${token}`. On Bun, call `verifyTideCloakToken(adapter, token, ['appUser'])`; reject null before returning protected data. [S6][S8][S13]
7. **Use the Next.js files as patterns only.** The template `proxy.ts` uses `createTideCloakProxy` and protects `/protected` with `offline_access`; its API route accepts Bearer and verifies that same broad role. Its DPoP route uses Node `fs`/`path` and emits CSP + `Allow-CSP-From`; it is opt-in plumbing, not a Bun verifier. Template is Next 16 + React 19 + `@tidecloak/nextjs ^0.13.11`; `.env.example` is empty and `tidecloak.json` starts `{}` until init. For a real app, replace `offline_access` with the actual role (e.g. `appUser`). [S20]


```ts
// Bun API shape; package use in Bun is not exercised here.
import { verifyTideCloakToken } from '@tidecloak/verify';
import adapter from './tidecloak.json';

Bun.serve({ port: 3000, async fetch(req) {
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : '';
  const user = token && await verifyTideCloakToken(adapter, token, ['appUser']);
  if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });
  return Response.json({ sub: user.sub });
}});
```

- Local JWKS URL: `http://localhost:8080/realms/myrealm/protocol/openid-connect/certs`; official verifier can fetch remote JWKS using adapter's `auth-server-url` + `realm` or use `config.jwk.keys`. Do not decode JWT and trust claims without signature verification. [S13][S15]
- **DPoP:** leave `useDPoP` unset for the five-hour minimum. If enabled, tokens are `typ: DPoP` + `cnf.jkt`; bearer-only API is insufficient. Must use `IAMService.secureFetch`, validate DPoP proof server-side, and serve `/tide_dpop/iss/<issuer-hex>/aud/<client-hex>/tide_dpop_auth.html` from the app origin with required CSP and `Allow-CSP-From: *`. [S18][S6]

## Provisioning recipe (exact API calls)

The published initializer gets a master token with `POST /realms/master/protocol/openid-connect/token` (`grant_type=password`, `client_id=admin-cli`), then sends bearer-authenticated Admin REST requests. This is dev bootstrap code, not a production pattern. [`tcinit.sh:145-177`][S9]

1. **Create realm + app client + roles in one call:** `POST /admin/realms` with `init/realm.json` as body. For this template `realm=nextjs-test`, client `myclient`, public client, standard flow; realm roles include `appUser`, `_tide_message.selfencrypt`, `_tide_message.selfdecrypt`; default composite grants all three. It is not separate `POST clients`/`POST roles` in this initializer. [`realm.json:1-63`][S9]
2. **Provision Tide/Fabric/IdP/license:** `POST /admin/realms/{realm}/vendorResources/setUpTideRealm`, form `email=...&isRagnarokEnabled=true&skipLicense=false`. Admin API Reference says it provisions Tide IdP/vendor resources, tide-claims scope and free-tier licensing (unless skipped). Script comment says VRK keygen and requires healthy ORKs. [S10][`tcinit.sh:267-286`][S9]
3. **Enable IGA:** `GET /admin/realms/{realm}`, add realm attribute `iga.attestor=tide`, then `PUT /admin/realms/{realm}`; `POST /admin/realms/{realm}/tide-admin/toggle-iga` body `{"enabled":true}`. The current Admin API Reference instead describes this endpoint as a toggle, with form field `isIGAEnabled` informational. [`tcinit.sh:288-332`][S9][S10]
4. **Create initial admin:** `POST /admin/realms/{realm}/users` body sets enabled `admin`, email, and `attributes.tideInvitable=["true"]`; then `GET /admin/realms/{realm}/users?username=admin&exact=true` for user id. [`tcinit.sh:347-383`][S9]
5. **Mint link and enroll:** `POST /admin/realms/{realm}/tideAdminResources/get-required-action-link?userId={id}&lifespan=3600`, body `[`"link-tide-account-action"`]`; returns text link. Script waits until `tideUserKey` and `vuid` appear. API Reference describes it as Tide-aware `execute-actions-email` analogue returning link text, not sending email. [`tcinit.sh:385-437`, Admin API Reference §5][S9][S10]
6. **Sign Tide IdP settings:** `GET /admin/realms/{realm}/identity-provider/instances/tide`, update `config.CustomAdminUIDomain` to realm console origin, `PUT` same path; `POST /admin/realms/{realm}/vendorResources/sign-idp-settings`. [`tcinit.sh:444-473`][S9]
7. **Grant first-admin role:** resolve `realm-management` client UUID and `tide-realm-admin` role; `POST /admin/realms/{realm}/users/{id}/role-mappings/clients/{clientUuid}` with role representation. The bootstrap script drains pending CRs before/after this step. [`tcinit.sh:481-540`][S9]
8. **Get adapter:** resolve app client UUID, then `GET /admin/realms/{realm}/vendorResources/get-installations-provider?clientId={clientUuid}&providerId=keycloak-oidc-keycloak-json` → save response as `tidecloak.json`. [`tcinit.sh:546-566`][S9]
9. **Additional app users:** create via `POST /admin/realms/{realm}/users`; generate same required-action link with their user id and `link-tide-account-action`. Standard user/client/role paths and REST CR endpoints are documented. Whether `tideInvitable` is required for non-admin users is not established by these sources. [S10][S9]
10. **QEA REST approvals:** current Admin API Reference has `POST /iga/change-requests/{id}/approve`; for multi-admin it is two-phase: request model, enclave signing, then submit signed carrier. `POST .../authorize` is legacy single-phase and refuses multiAdmin. Management API page instead describes `/authorize` and `/commit`; the initializer's current code uses `/approve` with `{}` while draining firstAdmin requests. Prefer current console flow for real multiAdmin demo; don't assume old one-phase `{}` works there. [S10][S11][`tcinit.sh:181-211`][S9]

## What a demo user must do at first login (and cost in minutes)

- **Existing-realm license check:** in tide-console open **Advanced → Tide → Licensing** and inspect Current plan. Current Quick Deploy/license docs say wizard-provisioned realms have the free developer tier (up to 100 users); React reference instead says **Request License**. For `myrealm`, license status is unverified; check before building, don't assume paid activation is needed. [S5][S19][S16]
- **First realm admin:** open the required-action link; create a Tide account in the enclave, choose username/password, follow prompts including recovery email; leave the initializer/wizard waiting until link completes. Current Quick Deploy says the realm wizard pre-provisions the free developer license (up to 100 users), and this link is needed before the new admin can use the realm console. [S19]
- **Time:** initializer says enrollment can take “a few minutes”; docs' Quickstart claims the whole setup takes 5 minutes but gives no per-step measurement. Budget ≈5 minutes for one first-admin enrollment, not a guaranteed duration. [S9][S19][INFERENCE]
- **New invited app user:** user receives a one-time link (console says DM/email/SMS), opens it, and follows enclave enrollment/link instructions. No exact end-user duration is published; budget “a few minutes” [INFERENCE], verify before live judging. [S19][S9]
- **Internet:** Quick Deploy assumes internet connectivity; installer fails if ORKs are unreachable. Local observed public Tide config names `https://ork1.tideprotocol.com`. Enrollment/provisioning therefore is not a fully offline local flow. [S19][S9][S16]
- **Public URL:** quickstart uses localhost for server and realm console, and requires no public server hostname when browser and TideCloak are on same machine. If teammates/judges use their own devices, `localhost` points at their own machine; expose a reachable HTTPS origin and register it in the app client. Last sentence is [INFERENCE]. [S19][S9]

## Gotchas and risks ranked

1. **High — live realm contents not verified.** Admin GETs returned 401; the master-token endpoint used by initializer is POST, prohibited by the GET-only research constraint. Console adapter GET returned 404. Do not assume `myrealm` has a usable app client, roles, user, active IGA, license, or DPoP. [S9][S16]
2. **High — first enrollment/Fabric is external dependency.** The real first-admin flow requires external ORK access and can take minutes; do it immediately, not at demo time. [S9][S16][S19]
3. **High — origin/redirect mismatch.** Client must permit the exact Bun origin, `/auth/redirect` must exist, and silent-SSO page must be served. Wizard's prefilled client allows `localhost:8080`; initializer sample app is `localhost:3000`; inspect/update actual client. [S19][S9][S5]
4. **High — approval API docs disagree.** Current Admin API Reference documents enclave-backed `/approve`; broad Management API page still describes `/authorize`/`/commit`; `tcinit.sh` calls `/approve`. For multiAdmin, direct legacy authorization is rejected. [S10][S11][S9]
5. **High — don't run fresh-realm initializer on `myrealm`.** Default script creates `nextjs-test`; existing realm fails unless `ALLOW_EXISTING_REALM=1`, whose own warning says it drains **all** pending requests including unrelated ones. [`tcinit.sh:61-70,243-260`][S9]
6. **Medium — realm setup/IGA API docs differ.** `tcinit.sh` labels `setUpTideRealm` as VRK keygen; current Admin API Reference separately documents `generate-initial-key` for VVK/gVRK/FirstAdmin. The script does not explicitly call that endpoint. It sends `{"enabled":true}` to `toggle-iga`, while the current API reference says that endpoint flips state and takes informational form field `isIGAEnabled`. Verify current server/setup wizard rather than adding calls blindly. [`tcinit.sh:267-286,318-322`][S9][S10]
7. **Medium — Bun postinstall is conditional.** JS SDK's `postinstall.cjs` uses `node:fs`/`node:path` to copy silent-check file; Bun only runs allowed lifecycle scripts. Create the static file manually or explicitly trust the package after review. [S8][S17]
8. **Medium — verification package in Bun is untested.** Tide docs say Node/“any backend”; official package uses `jose`; no opened source/doc explicitly verifies Bun runtime. Run a one-token happy-path check early. [S13][S14][INFERENCE]
9. **Medium — DPoP adds a proof-verification server and origin route.** Skip unless it is the central demo feature; merely verifying JWT signature is not DPoP proof validation. [S18][S6]
10. **Medium — no payload-size guarantee found.** Keep to small text, not files/images; size advice is [INFERENCE]. [S5][S7][S8]
11. **Low — QEA separation-of-duties story needs 3 admins.** Two admins still need only one approval; with three, quorum becomes two. [S4]
12. **Low — sign is not simple `IAMService.sign()`.** The lower-level signing path needs Tide/Forseti request construction (`BaseTideRequest`/Policy:1); don't promise generic signing in a short demo. [S8][S12]

## Unknowns

- [UNVERIFIED] `myrealm`'s client IDs, roles, user records, IdP state, IGA/QEA state, license and active token signing algorithm; admin listing endpoints returned 401 and GET-only rules prevented the required token POST. [S15][S16][S9]
- [UNVERIFIED] Any maximum E2EE payload size; none found in the inspected SDK declarations and docs. [S5][S7][S8]
- [UNVERIFIED] Actual `@tidecloak/verify` execution under the team's Bun version; docs/package sources do not state Bun support. [S13][S14][S17]
- [UNVERIFIED] Whether `tideInvitable` must be set on every non-admin user before generating a link. Initializer sets it for its admin; API reference doesn't document this constraint. [S9][S10]
- [UNVERIFIED] Per-user enrollment duration and exact outbound host allowlist needed for the local Fabric/enclave flow. Sources only say internet/healthy ORKs and “a few minutes.” [S9][S19]
- [UNVERIFIED] Whether local `myrealm` adapter 404 means missing Tide provisioning or merely unsigned console origin; Admin API Reference documents either realm setup/origin signature as relevant to public console config. [S10][S16]

### Source key

- [S1] [TideCloak Core Concepts](https://docs.tide.org/Core-Concepts/core-concepts)
- [S2] [BYOiD](https://docs.tide.org/Core-Concepts/byoid)
- [S3] [Hermetic E2EE](https://docs.tide.org/Core-Concepts/hermetic-e2ee)
- [S4] [Quorum Enforced Governance](https://docs.tide.org/Core-Concepts/iga-workflow)
- [S5] [React reference](https://docs.tide.org/Languages/React/tidecloak-react-reference); [S6] [React how-to](https://docs.tide.org/Languages/React/tidecloak-react-how-to-guide)
- [S7] [JavaScript SDK reference](https://docs.tide.org/Languages/JavaScript/tidecloak-js-reference)
- [S8] `/tmp/tidecloak-react-0.14.33/package/package.json:39-54`; `/tmp/tidecloak-react-0.14.33/package/dist/types/contexts/TideCloakContextProvider.d.ts:15-46,77-130`; `/tmp/tidecloak-js-0.14.33/package/package.json:27-64`; `/tmp/tidecloak-js-0.14.33/package/dist/types/src/index.d.ts:1-15`; `/tmp/tidecloak-js-0.14.33/package/dist/types/src/IAMService.d.ts:191-351,412-423`; `/tmp/tidecloak-js-0.14.33/package/dist/types/lib/tidecloak.d.ts:290-324`; `/tmp/tidecloak-js-0.14.33/package/silent-check-sso.html:1`; `/tmp/tidecloak-js-0.14.33/package/scripts/postinstall.cjs:1-35`
- [S9] `/tmp/tidecloak-create-nextjs-0.14.33/package/init/tcinit.sh:61-70,145-177,181-211,243-332,347-437,444-473,481-566`; `/tmp/tidecloak-create-nextjs-0.14.33/package/init/realm.json:1-63,123-163`
- [S10] [Admin API Reference](https://docs.tide.org/API/Admin%20API%20Reference); [S11] [Management API](https://docs.tide.org/API/Management%20API)
- [S12] [Forseti Engine](https://docs.tide.org/Core-Concepts/forseti-engine)
- [S13] [Verify JWT docs](https://docs.tide.org/Languages/NextJS/VerifyJWT); [S14] [@tidecloak/verify@0.14.33 metadata](https://registry.npmjs.org/@tidecloak/verify/0.14.33)
- [S15] Opened local GET: `http://localhost:8080/realms/myrealm/.well-known/openid-configuration`
- [S16] Opened local GETs: `http://localhost:8080/realms/myrealm/public/get-tide-config?clientId=myclient` (200); `/admin/realms/myrealm`, `/clients`, `/roles`, `/users`, `/identity-provider/instances` (401); `/realms/myrealm/tide-console/tidecloak.json` (404)
- [S17] [Bun lifecycle scripts](https://bun.sh/docs/pm/lifecycle); [Bun Node.js compatibility](https://bun.sh/docs/runtime/nodejs-compat)
- [S18] [DPoP](https://docs.tide.org/Core-Concepts/dpop)
- [S19] [TideCloak Quick Deploy](https://docs.tide.org/Admin/Quick-deploy-test); [Tide License](https://docs.tide.org/Admin/license)
- [S20] `/tmp/tidecloak-create-nextjs-0.14.33/package/template-ts-app/proxy.ts:1-46`; `app/api/protected/route.ts:1-40`; `app/tide_dpop/[...path]/route.ts:1-34`; `package.json:5-25`; `.env.example:1` (empty); `tidecloak.json:1` (`{}`). 
