# Raziel build path: TideCloak + Bun

**Research date:** 2026-10-22. **Scope:** macOS arm64, Bun 1.4, existing Bun + React 19 starter; TideCloak already running at `http://localhost:8080`. No TideCloak writes performed. `[UNVERIFIED]` = not confirmed; `[INFERENCE]` = estimate/recommendation.

## 1. Recommendation and quickest route

**Choose A: `tide_scaffold` → `nextjs-e2ee-vault`, run with Bun.** The template already has Tide login/callback, E2EE vault, protected API, local-JWKS JWT verification, DPoP proof verification, relay asset/rewrite/CSP, and sample route. Existing repo is a generic Bun.serve + React starter; Vite/React scaffold is explicitly client-only (no protected backend); C would require manual auth plus additional E2EE work. (`.cache/raziel/scaffold/nextjs-e2ee-vault.md` lines 22-31, 124-141; `scaffold/react-vite-internal-dashboard.md` lines 22-31, 124-133; `playbooks/add-auth-nextjs-fresh.md` lines 19-41, 63-95; repo `package.json` lines 6-18, `src/index.ts` lines 1-39.)

| Path | Assessment for this team |
|---|---|
| **A. E2EE Next scaffold under Bun — recommended** | Full example; `next dev --webpack`; Tide package pinned `0.14.17`. Do not run its Docker init; manually bootstrap current server (§2). `[UNVERIFIED]` Bun 1.4 + Next 16/Tide webpack alias runtime compatibility. (`scaffold/nextjs-e2ee-vault.md` lines 24-42, 80-110; `templates/templates/nextjs-e2ee-vault/package.json` lines 5-20.) |
| **B. Custom Bun.serve + React 19 + `@tidecloak/react`** | Best stack fit, but Vite scaffold has no protected backend; would hand-build JWT+DPoP, API role checks, E2EE, callback/assets/CSP. `[INFERENCE]` more integration risk inside 6h. (`scaffold/react-vite-internal-dashboard.md` lines 22-31; `templates/templates/react-vite-internal-dashboard/src/main.tsx` lines 1-16.) |
| **C. Fresh Next Quickstart** | `add-auth-nextjs-fresh` covers auth/DPoP, assumes Node 18+ and npm/yarn/pnpm, and not E2EE vault. Separate upstream “Quickstart” artifact is **[UNVERIFIED]** in local mirror; comparison uses this playbook. (`playbooks/add-auth-nextjs-fresh.md` lines 19-41, 63-95; `setup-forseti-e2ee.md` lines 80-115.) |

Copy only to a new empty subdirectory. Keep the Bun starter intact. (`scaffold/nextjs-e2ee-vault.md` lines 44-57.)

```bash
cd /Users/vominhlong/rmit-hackathon-2026-c2
PACK="$PWD/.cache/raziel/templates"; APP="$PWD/apps/unlocked"
mkdir -p "$APP"; cp -R "$PACK/templates/nextjs-e2ee-vault/." "$APP/"; cd "$APP"
bun -e 'const p=await Bun.file("package.json").json();p.name="unlocked-demo";await Bun.write("package.json",JSON.stringify(p,null,2)+"\n")'
cp .env.example .env
# Edit ignored .env: password from owner; real TIDE_LICENSE_EMAIL; TIDE_TERMS_ACCEPTED=yes only after explicit consent to https://tide.org/legal.
```

**Do not run `bun run init` or `bash scripts/init-tidecloak.sh`:** script stops/removes Docker container and clears shared H2; instead use §2 HTTP-only steps. Then `bun install && bun run dev`; template already sets `next dev --webpack`. (`templates/templates/shared/bootstrap-tidecloak.sh` lines 185-251; `scaffold/nextjs-e2ee-vault.md` lines 98-110; template `package.json` lines 5-16.)

**10-minute Bun go/no-go:** after adapter export, run `bun install && bun run dev`; confirm localhost startup, provider initialization, `/auth/redirect`, DPoP path returns 200 + headers/hash, then one browser login + protected API. If provider/webpack or DPoP fails, stop feature work and use Bun server + packaged verifier only if team can implement it quickly. This is a test plan, not a run. `[UNVERIFIED]` Pack documents Node/Next, not Bun runtime. (`canon/version-policy.md` lines 37-45, 49-68; template `next.config.ts` lines 4-21.)

## 2. HTTP-only bootstrap against existing Apple-container server

**Leave pre-imported `myrealm`; create `unlocked-rmit26` from full `realm.json.template`.** Start playbook says not to name the app realm `myrealm`; reused image realm's app/client readiness is not established by the pack. Monolithic script refuses if any non-master realm exists, then would Docker-wipe H2. Do not execute it. No server restart/env/port change for this local flow: `TIDECLOAK_URL=http://localhost:8080`, app origin `http://localhost:3000`; do not set `KC_HOSTNAME` or ORK/threshold/payer overrides. (`playbooks/start-tidecloak-dev.md` lines 41-53; `canon/tidecloak-bootstrap.md` lines 130-151, 161-187; `templates/shared/bootstrap-tidecloak.sh` lines 185-251.)

**Human-only, before realm creation:** ask for a real licence email and show `https://tide.org/legal`; wait for that human's explicit acceptance. Terms are not an API field. Later, the admin invite link must be opened/completed in a human browser. AP-90. (`scaffold/nextjs-e2ee-vault.md` lines 1-19; `canon/tidecloak-bootstrap.md` lines 191-242; `initialize-admin-and-link-account.md` lines 146-176.)

In one shell from `apps/unlocked`; password/email/consent are from ignored `.env`. All commands below are instructions only; they were not executed.

```bash
set -a; . ./.env; set +a
: "${KC_BOOTSTRAP_ADMIN_PASSWORD:?set in ignored .env}"; : "${TIDE_LICENSE_EMAIL:?human-provided email required}"
[ "${TIDE_TERMS_ACCEPTED:-}" = yes ] || { echo 'Human has not accepted https://tide.org/legal' >&2; exit 2; }
export KC_BOOTSTRAP_ADMIN_USERNAME="${KC_BOOTSTRAP_ADMIN_USERNAME:-admin}" TIDECLOAK_URL=http://localhost:8080
export REALM_NAME=unlocked-rmit26 CLIENT_NAME=unlocked-rmit26-client CLIENT_APP_URL=http://localhost:3000
export ADMIN_EMAIL="$TIDE_LICENSE_EMAIL" ADAPTER_OUTPUT="$PWD/data/tidecloak.json"; mkdir -p data
get_token() { curl -fsS -X POST "$TIDECLOAK_URL/realms/master/protocol/openid-connect/token" -H 'Content-Type: application/x-www-form-urlencoded' --data-urlencode "username=$KC_BOOTSTRAP_ADMIN_USERNAME" --data-urlencode "password=$KC_BOOTSTRAP_ADMIN_PASSWORD" -d 'grant_type=password&client_id=admin-cli' | jq -er '.access_token'; }
```

**1. Import full realm template (scripted).** Use new realm name; `jq walk` avoids GNU-only macOS `sed -i` syntax. (`bootstrap-realm-from-template.md` lines 84-105.)

```bash
TMP_REALM="$(mktemp)"
jq --arg r "$REALM_NAME" --arg c "$CLIENT_NAME" --arg o "$CLIENT_APP_URL" 'walk(if type=="string" then gsub("REALM_NAME";$r)|gsub("CLIENT_NAME";$c)|gsub("CLIENT_APP_URL";$o) else . end)' "$PACK/templates/shared/realm.json.template" > "$TMP_REALM"
curl -fsS -X POST "$TIDECLOAK_URL/admin/realms" -H "Authorization: Bearer $(get_token)" -H 'Content-Type: application/json' --data-binary "@$TMP_REALM"; rm -f "$TMP_REALM"
```

**2. License + Tide setup (scripted HTTP; human supplied email/terms).** Must be form-urlencoded. Reject `NEED_PAYMENT`, 303 or non-2xx; HTTP 200 alone is not proof of license. (`bootstrap-realm-from-template.md` lines 107-144, 225-233; `canon/tidecloak-endpoints.md` lines 103-124; T-10.)

```bash
B="$(mktemp)"; CODE="$(curl -sS -o "$B" -w '%{http_code}' -X POST "$TIDECLOAK_URL/admin/realms/$REALM_NAME/vendorResources/setUpTideRealm" -H "Authorization: Bearer $(get_token)" -H 'Content-Type: application/x-www-form-urlencoded' --data-urlencode "email=$TIDE_LICENSE_EMAIL" --data-urlencode 'isRagnarokEnabled=true')"
cat "$B"; case "$CODE" in 2??) ;; *) echo "setUpTideRealm HTTP $CODE" >&2; exit 1 ;; esac; grep -q NEED_PAYMENT "$B" && exit 1; rm -f "$B"
```

**3. Stamp attestor, enable IGA once, drain baseline CRs.** Read state before calling `toggle-iga` (may be a flip); assert `enabled:true`. FirstAdmin bootstrap uses per-id `authorize`, then `commit` only ready requests; avoid invalid `CREATE`/`DELETE` filters. (`bootstrap-tidecloak.sh` lines 363-405; `tidecloak-endpoints.md` lines 126-136; `setup-iga-admin-panel.md` lines 63-80, 94-114; GAP-065.)

```bash
R="$(curl -fsS "$TIDECLOAK_URL/admin/realms/$REALM_NAME" -H "Authorization: Bearer $(get_token)")"
printf '%s' "$R" | jq '.attributes=((.attributes // {}) + {"iga.attestor":"tide"})' > /tmp/r.json
curl -fsS -X PUT "$TIDECLOAK_URL/admin/realms/$REALM_NAME" -H "Authorization: Bearer $(get_token)" -H 'Content-Type: application/json' --data-binary @/tmp/r.json; rm -f /tmp/r.json
IGA="$(curl -fsS "$TIDECLOAK_URL/admin/realms/$REALM_NAME" -H "Authorization: Bearer $(get_token)" | jq -r '.attributes.isIGAEnabled // "false"' | tr '[:upper:]' '[:lower:]')"
if [ "$IGA" != true ]; then OUT="$(curl -fsS -X POST "$TIDECLOAK_URL/admin/realms/$REALM_NAME/tide-admin/toggle-iga" -H "Authorization: Bearer $(get_token)" -H 'Content-Type: application/x-www-form-urlencoded' --data-urlencode 'isIGAEnabled=true')"; printf '%s' "$OUT" | grep -q '"enabled":true' || exit 1; fi
approve_all_pending() {
 ids="$(curl -fsS "$TIDECLOAK_URL/admin/realms/$REALM_NAME/iga/change-requests?status=PENDING" -H "Authorization: Bearer $(get_token)" | jq -r '.[]|select(.actionType|IN("DISABLE_IGA","DELETE_REALM","OFFBOARD_REALM")|not)|.id')"
 for id in $ids; do curl -fsS -X POST "$TIDECLOAK_URL/admin/realms/$REALM_NAME/iga/change-requests/$id/authorize" -H "Authorization: Bearer $(get_token)" -H 'Content-Type: application/json' -d '{}' >/dev/null; done
 for pass in 1 2 3 4 5; do ready="$(curl -fsS "$TIDECLOAK_URL/admin/realms/$REALM_NAME/iga/change-requests?status=PENDING" -H "Authorization: Bearer $(get_token)" | jq -r '.[]|select(.actionType|IN("DISABLE_IGA","DELETE_REALM","OFFBOARD_REALM")|not)|select(.readyToCommit==true)|.id')"; [ -z "$ready" ] && break; for id in $ready; do curl -fsS -X POST "$TIDECLOAK_URL/admin/realms/$REALM_NAME/iga/change-requests/$id/commit" -H "Authorization: Bearer $(get_token)" >/dev/null; done; done
}
sleep 2; approve_all_pending
```

**4. Create admin, commit, invite; human enrolls.** `tide-realm-admin` is `realm-management` client role; bootstrap grants it last. (`initialize-admin-and-link-account.md` lines 66-103, 105-164; bootstrap script lines 407-486, 515-545.)

```bash
U="$(jq -n --arg e "$ADMIN_EMAIL" '{username:"admin",email:$e,firstName:"Admin",lastName:"User",enabled:true,emailVerified:false,attributes:{tideInvitable:["true"]}}')"
curl -fsS -X POST "$TIDECLOAK_URL/admin/realms/$REALM_NAME/users" -H "Authorization: Bearer $(get_token)" -H 'Content-Type: application/json' --data-binary "$U"; sleep 2; approve_all_pending
USER_ID="$(curl -fsS "$TIDECLOAK_URL/admin/realms/$REALM_NAME/users?username=admin" -H "Authorization: Bearer $(get_token)" | jq -er '.[0].id')"
INVITE="$(curl -fsS -X POST "$TIDECLOAK_URL/admin/realms/$REALM_NAME/tideAdminResources/get-required-action-link?userId=$USER_ID&lifespan=43200" -H "Authorization: Bearer $(get_token)" -H 'Content-Type: application/json' -d '["link-tide-account-action"]')"; printf '%s\n' "$INVITE"
# HUMAN opens URL above and completes link. Poll up to 5 minutes:
for i in {1..60}; do KEY="$(curl -fsS "$TIDECLOAK_URL/admin/realms/$REALM_NAME/users?username=admin" -H "Authorization: Bearer $(get_token)" | jq -r '.[0].attributes.tideUserKey[0] // empty')"; [ -n "$KEY" ] && break; sleep 5; done
[ -n "$KEY" ] || { echo 'Linking incomplete; issue a fresh invite' >&2; exit 1; }
```

**5. Drain link changes, set/sign IdP, grant admin role LAST.** Latest bootstrap sets `CustomAdminUIDomain` to Tide console URL. **[UNVERIFIED]** `canon/tidecloak-bootstrap.md` lines 261-265 records an unresolved disagreement about app origin vs console origin; use the script's value once and test the enclave popup. (`bootstrap-tidecloak.sh` lines 488-545; `tidecloak-endpoints.md` lines 138-144.)

```bash
sleep 2; approve_all_pending; D="$TIDECLOAK_URL/realms/$REALM_NAME/tide-console/"
I="$(curl -fsS "$TIDECLOAK_URL/admin/realms/$REALM_NAME/identity-provider/instances/tide" -H "Authorization: Bearer $(get_token)")"
printf '%s' "$I" | jq --arg d "$D" '.config.CustomAdminUIDomain=$d' > /tmp/i.json
curl -fsS -X PUT "$TIDECLOAK_URL/admin/realms/$REALM_NAME/identity-provider/instances/tide" -H "Authorization: Bearer $(get_token)" -H 'Content-Type: application/json' --data-binary @/tmp/i.json; rm -f /tmp/i.json
curl -fsS -X POST "$TIDECLOAK_URL/admin/realms/$REALM_NAME/vendorResources/sign-idp-settings" -H "Authorization: Bearer $(get_token)"
RM="$(curl -fsS "$TIDECLOAK_URL/admin/realms/$REALM_NAME/clients?clientId=realm-management" -H "Authorization: Bearer $(get_token)" | jq -er '.[0].id')"
ROLE="$(curl -fsS "$TIDECLOAK_URL/admin/realms/$REALM_NAME/clients/$RM/roles/tide-realm-admin" -H "Authorization: Bearer $(get_token)")"
curl -fsS -X POST "$TIDECLOAK_URL/admin/realms/$REALM_NAME/users/$USER_ID/role-mappings/clients/$RM" -H "Authorization: Bearer $(get_token)" -H 'Content-Type: application/json' --data-binary "[$ROLE]"
sleep 2; approve_all_pending   # commits grant; firstAdmin -> multiAdmin one-way flip
```

After final grant, no server-driven governed writes. Use Tide Console for runtime approvals. (Admin ordering: `initialize-admin-and-link-account.md` lines 105-114, 226-244; bootstrap script lines 430-545.)

**6. Export Tide adapter (GET).** Use client UUID, vendor export endpoint, not standard Keycloak installation path. Verify `jwk`, `vendorId`, `homeOrkUrl`, and matching `client-origin-auth-*`; re-sign/re-export after origin changes. (`initialize-admin-and-link-account.md` lines 246-274; `tidecloak-endpoints.md` lines 34-41; `adapters/AGENTS.md` lines 33-36; AP-13/T-11.)

```bash
CLIENT_UUID="$(curl -fsS "$TIDECLOAK_URL/admin/realms/$REALM_NAME/clients?clientId=$CLIENT_NAME" -H "Authorization: Bearer $(get_token)" | jq -er '.[0].id')"
curl -fsS "$TIDECLOAK_URL/admin/realms/$REALM_NAME/vendorResources/get-installations-provider?clientId=$CLIENT_UUID&providerId=keycloak-oidc-keycloak-json" -H "Authorization: Bearer $(get_token)" > "$ADAPTER_OUTPUT"
jq '{realm,resource,jwkKeys:(.jwk.keys|length),vendorId,homeOrkUrl,clientOriginAuth:(with_entries(select(.key|startswith("client-origin-auth-"))))}' "$ADAPTER_OUTPUT"
```

### Human/scripted timing and failure symptoms

Durations are **[INFERENCE]** except `setUpTideRealm` measured ~7s by bootstrap note and UX guidance 10–15s. (`bootstrap-tidecloak.sh` lines 337-361; `ux-states.md` lines 66-85.)

| Step | Who / minutes | Failure symptom |
|---|---|---|
| Licence email + T&C | Human, 1–3 | Stop if missing (AP-90). |
| Realm import + Tide setup | HTTP script, 1–2 | Existing realm/placeholder error; `NEED_PAYMENT`, 303, wrong form (T-10). |
| IGA + baseline CR drain | Script, 1–3 | Toggle called twice; unresolved CRs block users/roles (GAP-065, T-10b). |
| Create admin + issue invite | Script, <1 | User query null until CR committed (T-10b). |
| Browser account link | **Human**, 1–5 | No `tideUserKey`; reissue direct link, don't use SMTP email flow (T-07). |
| Sign IdP + final role/flip + adapter | Script, 1–3 + popup check | Popup issue: investigate unresolved CustomAdminUIDomain; missing adapter fields: T-11. |
| Bun install/start | Script, 2–5 | 10-minute Bun gate above. |

## 3. Static assets, headers and CORS in Bun

| Path | Requirement | Custom Bun.serve mapping |
|---|---|---|
| `public/tide_dpop_auth.html` | Copy byte-exact; SHA-256 **`9d7844b938f0a2565fa910d3d30e9b8797cbfd6e0b73d59d804169a089aea757`** (9,120 bytes); don't retype. (`templates/scripts/check-dpop-asset.sh` lines 25-37; AP-62/GAP-068.) | `/tide_dpop/iss/:iss/aud/:aud/tide_dpop_auth.html` → `new Response(Bun.file('./public/tide_dpop_auth.html'), {headers})`. Bun parameter routes supported (Bun routing docs URL below). |
| DPoP route headers | Only relay route: `Content-Security-Policy: default-src 'self'; script-src 'unsafe-inline'` + `Allow-CSP-From: *`; deep path must not 404. (`next.config.ts` lines 35-59; `add-auth-nextjs-fresh.md` lines 241-282.) | Set these headers on the route's Response. |
| `public/silent-check-sso.html` | Keep file; it posts its URL to parent for silent refresh, not login callback. (`templates/templates/nextjs-e2ee-vault/public/silent-check-sso.html` line 1; `redirect-handler.md` lines 252-254.) | `"/silent-check-sso.html": () => new Response(Bun.file('./public/silent-check-sso.html'))`. |
| `/auth/redirect` | Real route with active `useAuthCallback`; missing route/provider breaks login. (`redirect-handler.md` lines 7-23, 102-158; template redirect page lines 1-43.) | SPA fallback serves `index` at `/auth/redirect`; React root must process `code`/`error` (Vite template `App.tsx` lines 13-29). |
| `tidecloak.json` | Next server config at `data/tidecloak.json`; custom SPA config at `public/tidecloak.json`. (`canon/invariants.md` I-05, lines 195-245; Vite `src/main.tsx` lines 1-16.) | SPA route `"/tidecloak.json": () => new Response(Bun.file('./public/tidecloak.json'))`; never expose admin password. |
| CSP | Main app `frame-src 'self' *`; E2EE may require ORK `connect-src` and enclave `script-src 'unsafe-inline'`. (`canon/invariants.md` I-06, lines 251-269; GAP-028.) | Add CSP to app HTML responses. Bun imported `index.html` is `HTMLBundle`, not a regular Response; use local reverse proxy or explicit built-HTML Response plus asset routes. `[UNVERIFIED]` Don't assume `new Response(index)` preserves bundles. (Bun server docs: `https://bun.com/docs/runtime/http/server#html-imports`; repo `src/index.ts` lines 1-8.) |
| CORS/origin | Client `webOrigins` must be exact app origin; adapter needs matching `client-origin-auth-*`. Same-origin app→API requires no permissive CORS. (`realm.json.template` lines 29-47; `tidecloak-endpoints.md` lines 34-41; `adapters/AGENTS.md` lines 33-36.) | Keep same-origin; if separated, allow exact frontend origin, then update client origin, re-sign and export again. Never wildcard CORS. |

Recommended Next template already carries static files/Next headers/rewrites; keep unchanged, and do not add an App Router handler for `/tide_dpop/*`. (`scaffold/nextjs-e2ee-vault.md` lines 124-141; `add-auth-nextjs-fresh.md` lines 255-260.)

## 4. JWT + DPoP on Bun

Recommended Next sample already uses `jose`, `createLocalJWKSet(config.jwk)`, issuer + `azp` + time checks, and `withAuth`/`withRole`; custom Bun API should reuse `templates/dpop-verify/verifyDpop.ts`. UI checks alone are not authorization. (`verify-jwt-server-side.md` lines 107-161, 204-255; template `middleware.ts` lines 8-34; `invariants.md` I-03/I-04.)

**Packages:** Next template has `jose@^6.0.0` + `@tidecloak/nextjs@0.14.17`; custom Bun uses `@tidecloak/react` in browser and `jose` on server. Avoid `@tidecloak/verify`: adapter instructions say CJS/default import; framework matrix says dual exports. `[UNVERIFIED]` no native Node-only dependency identified in local JWKS/DPoP helper, but Bun compatibility is not tested. (`templates/templates/nextjs-e2ee-vault/package.json` lines 11-20; `version-policy.md` lines 25-45; `adapters/AGENTS.md` lines 56-58; `framework-matrix.md` lines 341-349.)

Minimal local single-process pattern (copy `verifyDpop.ts` from `.cache/raziel/templates/templates/dpop-verify/`; `index` is Bun's existing `import index from './index.html'`):

```ts
import index from "./index.html";
import { createLocalJWKSet, jwtVerify } from "jose";
import { verifyDpop } from "./verifyDpop";
import config from "./data/tidecloak.json";
if (!config.jwk) throw new Error("Missing adapter jwk; re-export via Tide endpoint");
const JWKS = createLocalJWKSet(config.jwk);
const issuer = `${config["auth-server-url"].replace(/\/+$/, "")}/realms/${config.realm}`;
async function auth(req: Request, role: string) {
  const m = /^DPoP (\S+)$/.exec(req.headers.get("authorization") ?? ""); if (!m) return 401;
  const token=m[1], {payload}=await jwtVerify(token,JWKS,{issuer,algorithms:["EdDSA"]}); // Tide VVK/JWK is EdDSA
  if (payload.azp !== config.resource || typeof payload.exp !== "number" || payload.exp <= Date.now()/1000) return 401;
  await verifyDpop(req,token,payload as {cnf?:{jkt?:string}},{trustForwardedHeaders:false});
  const roles=(payload.realm_access as {roles?:string[]}|undefined)?.roles??[];
  return roles.includes(role) ? payload : 403;
}
Bun.serve({hostname:"127.0.0.1",port:3000,routes:{
  "/api/private":{GET:async req=>{try{const p=await auth(req,"appUser"); if(p===401)return Response.json({error:"Unauthorized"},{status:401}); if(p===403)return Response.json({error:"Forbidden"},{status:403}); return Response.json({ok:true,sub:p.sub},{headers:{"Cache-Control":"no-store"}})}catch{return Response.json({error:"Unauthorized"},{status:401})}}},
  "/tide_dpop/iss/:iss/aud/:aud/tide_dpop_auth.html":()=>new Response(Bun.file("./public/tide_dpop_auth.html"),{headers:{"Content-Security-Policy":"default-src 'self'; script-src 'unsafe-inline'","Allow-CSP-From":"*"}}),
  "/silent-check-sso.html":()=>new Response(Bun.file("./public/silent-check-sso.html")),"/tidecloak.json":()=>new Response(Bun.file("./public/tidecloak.json")),"/auth/redirect":index,"/*":index
}});
```

The helper checks `cnf.jkt`, proof signature/binding, method/URL, `ath`, replay `jti`. Trust forwarded host/proto only behind a proxy you control; in-memory replay store is single-process only. (`templates/dpop-verify/verifyDpop.ts` lines 44-109, 120-207; `verify-jwt-server-side.md` lines 211-255; AP-43/AP-44.)

## 5. E2EE roles, tags, grants and delay

| Mode | Required roles/policy | Provisioning |
|---|---|---|
| Baseline | `appUser`, `_tide_enabled`; template also has `_tide_encryptor` and `_tide_decryptor`; default composite includes `_tide_enabled` + `appUser`. (`templates/shared/realm.json.template` lines 8-21.) | Import template; role/user changes via REST/Admin UI then IGA approve+commit. |
| Private self-encryption | `_tide_<tag>.selfencrypt`, `_tide_<tag>.selfdecrypt`; tagged `doEncrypt`/`doDecrypt`; user-bound, not shareable by merely assigning same role. (`configure-e2ee-roles-and-policies.md` lines 27-44, 48-112; `add-rbac-nextjs.md` lines 130-154.) | Add roles and composite in realm template before import, or create via API and approve CR; re-login/token refresh. |
| Per-record sharing | Built-in `RelationshipAttestation:1`; models `PolicyEnabledEncryption:1` + `PolicyEnabledDecryption:1`; `PRIVATE`; subjects User=`tideuserkey`, Group=full `groups` path, Role=realm/client role; `assignmentId=recordId` and only data tag; `roles` JSON string selects `_tide_encryptor`/`_tide_decryptor`. (`setup-forseti-e2ee.md` lines 22-45; `relationship.ts` lines 25-43, 90-130.) | Realm admin signs each policy in browser enclave; app stores signed policy and serves it only to authorized callers. **Not data-owner self-service** unless owner also holds admin role. (`relationship.ts` lines 133-167; README lines 30-69.) |
| Governance admin | `tide-realm-admin` is `realm-management` client role; admin policy is named `tide-realm-admin`. (`initialize-admin-and-link-account.md` lines 105-114; `setup-forseti-e2ee.md` lines 136-164.) | Grant last in bootstrap; runtime approvals through admin browser/Tide Console, not server proxy (AP-89). |

IGA role changes may take **up to 120s** to appear; re-login or `forceUpdateToken()` for immediate refresh. UX should name delay rather than show false denial. (`configure-e2ee-roles-and-policies.md` lines 100-112; `ux-states.md` lines 66-93.) Relationship contract availability verified on ORK main 2026-10-16 but helper file itself says not run as a whole; confirm network support. Custom Forseti contract upload is done by Tide team, not self-service. (`relationship/README.md` lines 9-19, 84-94; `setup-forseti-e2ee.md` lines 1-10.)

## 6. Raziel MCP

Remote URL `https://mcp.tide.org/mcp`, no auth for MCP-capable clients (official setup: `https://docs.tide.org/ai-agent-pack#quick-start`). Useful tools: `tide_choose_scenario`, `tide_choose_playbook`, `tide_scaffold`, `tide_playbook`, `tide_dpop_asset`, `tide_hosting`, `tide_onboarding`, `tide_doctor`, `tide_scenario_roles`, `tide_scenario_bootstrap`. Use `tide_scaffold(template="nextjs-e2ee-vault",appDir="apps/unlocked")`, then `tide_choose_playbook` with “existing Apple-container TideCloak at localhost:8080; Bun 1.4; do not run Docker; leave myrealm; new app realm; human license/terms/invite”; ask `tide_dpop_asset`/`tide_doctor` for checks. Tool docs/templates: `.cache/raziel/scaffold/nextjs-e2ee-vault.md` lines 32-42, 98-110; `add-auth-nextjs-fresh.md` lines 202-235; `templates/shared/tide-doctor.sh` lines 28-37. `[UNVERIFIED]` current Codex CLI remote MCP support; official docs snapshot describes stdio only.

Best first agent prompts: (1) “Use local Raziel mirror. Choose E2EE vault template under Bun 1.4; do not overwrite starter, use npm/node, or run Docker. TideCloak is running under Apple container at localhost:8080 with myrealm; plan manual HTTP bootstrap and stop for human licence/terms + invite.” (2) “Use built-in RelationshipAttestation:1 for one synthetic record; state grants are admin-signed, not owner self-service; use Tide Console for IGA approval.” (3) “Verify DPoP asset SHA/routes/CSP and implement server-side jose+DPoP; no UI-only authorization.”

Raw JSON-RPC fallback; MCP server source uses stateless Streamable HTTP `POST /mcp` (external code reference: `https://github.com/tide-foundation/raziel-mcp/blob/master/mcp-server/src/http.ts`). Replace example protocol version with what initialize accepts; version below is **[UNVERIFIED]**, not a server pin.

```bash
curl -i -N https://mcp.tide.org/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' \
 --data-binary '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"rmit-curl","version":"1.0"}}}'
curl -sS -N https://mcp.tide.org/mcp -H 'Content-Type: application/json' -H 'Accept: application/json, text/event-stream' -H 'MCP-Protocol-Version: 2025-03-26' \
 --data-binary '{"jsonrpc":"2.0","id":2,"method":"tools/call","params":{"name":"tide_scaffold","arguments":{"template":"nextjs-e2ee-vault","appDir":"apps/unlocked"}}}'
```

Call JSON-RPC `tools/list` first for current schemas; the remote MCP request is not a TideCloak HTTP call. (Official setup URL above; server implementation: `.../mcp-server/src/http.ts`, tool registration `.../src/server.ts`.)

## 7. Six-hour budget and go/no-go

Estimates are **[INFERENCE]**; target one real login, encrypted record, server-side gate, and visible IGA approval, not a custom admin panel.

| Clock | Work/checkpoint | Go/no-go |
|---:|---|---|
| 0:00–0:15 | Human license email/consent; copy template; choose new realm. | No-go without both human answers. |
| 0:15–1:15 | Realm/license/IGA/baseline approvals; admin invite + browser linking. | No-go unless `tideUserKey` appears. |
| 1:15–1:30 | Sign IdP, final admin grant/flip, export adapter. | No-go if required adapter fields or enclave popup fail. |
| 1:30–1:40 | Bun install/start and compatibility test. | No-go if provider/webpack/DPoP route fails. |
| 1:40–3:20 | One synthetic record; E2EE, server role/API gate, ciphertext storage. | Go after real login/encrypt/store/decrypt and protected API checks. |
| 3:20–4:00 | Trigger one IGA change and approve in Tide Console. | No-go if approval is simulated/proxied. |
| 4:00–5:00 | README <=300 words, public repo/secret check, demo story. | No adapter/password/private data committed. |
| 5:00–5:40 | Record 2-minute demo MP4 <100 MB. | Verify playback + size. |
| 5:40–6:00 | Buffer/freeze. | No new features. |

## 8. Ten likely pitfalls and fixes

| # | Pitfall → fix | Source / IDs |
|---:|---|---|
| 1 | Docker init on Apple container would stop/remove/wipe: skip it; HTTP bootstrap only. | `templates/shared/bootstrap-tidecloak.sh` lines 185-251; `tidecloak-bootstrap.md` lines 40-58. |
| 2 | `myrealm` collision/wrong config: leave it, create new realm from full template. | `start-tidecloak-dev.md` lines 41-53; `tidecloak-bootstrap.md` lines 130-140. |
| 3 | License without human email/consent: stop and ask; no placeholders. | AP-90; `tidecloak-bootstrap.md` lines 191-242. |
| 4 | `setUpTideRealm` wrong path/JSON/no email/NEED_PAYMENT: vendor path, form body, check status/body. | T-10; `bootstrap-realm-from-template.md` lines 122-144; `tidecloak-endpoints.md` lines 103-124. |
| 5 | `toggle-iga` double-called/JSON body: read current state; call once form-urlencoded and assert response. | `tidecloak-endpoints.md` lines 126-136; GAP-065. |
| 6 | User/role writes stay pending; stale change-set filter/path: use current `/iga/change-requests`, per-id authorize/commit, approve user before lookup. | T-10b; `setup-iga-admin-panel.md` lines 63-114; GAP-065. |
| 7 | Admin grant too early/proxy approval: grant `tide-realm-admin` last; runtime approval from admin's browser. | AP-89; `initialize-admin-and-link-account.md` lines 105-114; bootstrap script lines 515-545. |
| 8 | Invite SMTP failure/no `tideUserKey`: direct required-action link; human opens and completes it. | T-07; `initialize-admin-and-link-account.md` lines 146-176, 277-285. |
| 9 | Missing Tide adapter fields/origin: vendor export with client UUID; verify `jwk`, `vendorId`, `homeOrkUrl`, `client-origin-auth-*`; sign/re-export on origin change. | AP-13; T-11; `tidecloak-endpoints.md` lines 34-41. |
| 10 | Login hang/blank popup/404/role delay: known DPoP SHA + wildcard route/headers, silent SSO + callback, `frame-src 'self' *`; re-login/wait 120s for role. | AP-62/GAP-068/AP-07/AP-15/GAP-028/T-01/T-04/T-13; `ux-states.md` lines 66-93. |
