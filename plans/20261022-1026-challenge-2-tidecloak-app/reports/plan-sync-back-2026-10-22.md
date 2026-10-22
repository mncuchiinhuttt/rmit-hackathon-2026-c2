# Plan sync-back — 2026-10-22

## Purpose and status

The root plan remains `in-progress`; no phase or submission is marked complete solely because code exists. Original event-time gates are historical, not active requirements. This report reconciles plan status with current implementation and parent-reported verification. This sync-back itself ran no tests, builds, lint, formatters, commit/push, publication or form action.

## Phase status crosswalk

| Phase | Recorded completion | Still unresolved |
|---|---|---|
| 00 — idea/story/human gates | Four-person team and group name confirmed; licence email and Terms acceptance were supplied for provisioning, with private consent details kept private. README five-prompt overview finalized at 249 words. | Five human account links; primary/backup form submitter; form submission/confirmation. Story claims about live quorum, ORK refusal and release remain unverified. |
| 01 — Tide realm/enrollment | `hui-rmit26`, `hui-rmit26-client`, free-tier licence and baseline IGA in FirstAdmin verified; five aliases/role setup prepared; private adapter exists. | Latest `bun run tide:sync` at 12:57 exited 0 but found 0/5 linked. First-admin activation, distinct steward keys, remaining admin grants and measured quorum are not established. |
| 02 — app foundation | Bun 1.4 / Next 16.4.2 / React 19.3.1 feature-first implementation; old Bun starter retained at `starter-bun`. Final post-cleanup typecheck/lint/build passed and `bun test` passed with 15 tests, 7 files, 43 expectations. Production startup and route/relay checks passed as recorded. | No credentialed sign-in or authenticated protected success. Real sign-in navigation reached ORK, but no credentials were entered; one Keycloak iframe request aborted and a URL wait helper timed out. |
| 03 — sealed payout proof | Release, policy, governance and synthetic escrow paths exist. Actual approved-history response parsed as 269 records (244,463 bytes); inspected grant request mapped from its `ROLE_ID` to `payout-c4`, was `DENIED` with authorization count 0 / threshold 1 in `firstAdmin`, and applied no entitlement. | G3 unmet. This bootstrap schema/read-model inspection is not human quorum. No live RelationshipAttestation signing, successful encryption/decryption, ORK denial/refusal or release-to-redeem flow is proven. Alternate-policy/master experiments remain unperformed. |
| 04 — product UI | Production unauthenticated workspace inspected at 1280×900 and 375×812 with reduced motion; no horizontal overflow; first Tab showed visible focus ring. Refreshed login-only screenshots were visually inspected. | No protected-state session or authenticated screenshot. Responsive/login evidence does not prove live authorization. |
| 05 — hardening/docs/review | Final command batch passed; production smoke and docs/README reconciliation completed. README overview is 249 words. Both scoped source reviews passed without remaining issues. Production audit reported 0 vulnerabilities across 92 packages. | Secret/Git-history review, private commit/push and clean-checkout build remain pending; repository is private. Full development audit still reports one unpatched high-severity `braces@3.0.3` finding. |
| 06 — video/submission | Script/checklist exist; final README overview is 249 words; unauthenticated login screenshots refreshed. | No final `demo.mp4`, full-flow recording, public repository or form confirmation. |

## Verification and review evidence

The latest post-cleanup batch is recorded in `governance-verification-2026-10-22.md` and `production-smoke-2026-10-22.md`: `bun run typecheck`, `bun run lint`, `bun test` (15 tests across 7 files, 43 expectations) and `bun run build` all exited 0. The final build had no outer-workspace warning. Production `bun run start` was ready in 156 ms. Production dependency audit reported zero vulnerabilities across 92 packages; the full development audit still has the unpatched `braces@3.0.3` advisory.

Production observations: `/api/config` returned 200; unauthenticated `/api/circle` returned 401 with `Cache-Control: no-store`; `/tide_dpop/auth` returned 200, 9,120 bytes and the expected SHA-256 `9d7844b938f0a2565fa910d3d30e9b8797cbfd6e0b73d59d804169a089aea757`, with the observed CSP and no blocking `X-Frame-Options`. No `kcToken` cookie appeared on the app origin in this unauthenticated observation. The browser reached the ORK sign-in form without credentials. One Keycloak iframe initialization request aborted, and a URL wait helper timed out even though later inspection confirmed the destination; this is not a console-error-free or authenticated-flow claim.

`code-review-2026-10-22.md` reports the five original scoped findings addressed, no remaining issues (confidence 0.98). `governance-code-review-2026-10-22.md` reports no scoped issues (confidence 0.96). Both are scoped source reviews, not broad security audits or live Tide proof.

## Planned-to-actual source mapping

| Earlier plan path/pattern | Current implementation | Mapping caveat |
|---|---|---|
| Flat Bun starter (`src/index.ts`, `src/App.tsx`, `src/frontend.tsx`, etc.) | Replaced by Next app; starter preserved at Git tag `starter-bun`. | Old files are not current callers or architecture. |
| `src/lib/auth/*` | `src/features/auth/server/{with-auth.ts,verify-tide-jwt.ts,verify-dpop.ts,identity.ts,tide-config.ts}` plus auth client/components. | Auth is feature-local; do not recreate the old shared auth directory. |
| Planned vault API and `src/app/api/{payouts,policies,escrow}/route.ts` | Thin adapters under `src/app/api`: `config`, `circle`, `governance`, `admin-policy`, `policies`, `payouts`, `escrow/redeem`, `members`. | Escrow redemption is nested at `/api/escrow/redeem`; there is no generic `/api/vault` route or `/spike` page. |
| `src/lib/tide/relationship.ts`, planned `seal.ts` / `iga-read.ts` | `src/features/releases/client/{relationship.ts,release-actions.ts}`, release server validation/service/persistence, governance service and projection. | No one-to-one `seal.ts` or `iga-read.ts` module; distributed source paths do not prove live Tide behavior. |
| `src/lib/store/json-store.ts` / `data/store.json` | Shared `src/lib/server/atomic-json.ts` and feature-local persistence/services, including `src/features/releases/server/persistence.ts`. | No exact one-file replacement should be inferred. |
| Planned product components under `src/components/*` | Feature components under `src/features/{circle,releases,governance,escrow}/components/`; shared primitives under `src/components/ui/`. | Feature-local product UI and shared shadcn/Radix primitives are distinct layers. |
| `scripts/tide/lib.sh`, `seed-realm.sh`, shell workflow | TypeScript entrypoints `scripts/tide/{admin-client,provision-realm,prepare-demo,sync-enrollment,activate-first-admin}.ts`; commands declared in `package.json`. | Earlier shell helper/seed plan has no one-to-one file mapping. |
| Planned `public/tide_dpop_auth.html`, `silent-check-sso.html` | Both assets are present under `public/`. | Asset presence and successful relay response do not prove a live authenticated sign-in. |

## What remains human- or live-system-dependent

- Five invitees must complete private enrollment; the latest synchronization is 0/5 linked.
- A linked human must complete first-admin activation. Distinct steward identities/keys and remaining admin grants require the appropriate human enrollment and governed approvals.
- A live, distinct-steward change request must establish the actual quorum, including first approval pending and a later approval committed. No quorum value is verified.
- An enrolled session must authenticate and call a protected API successfully. Actual signed-policy behavior, same-policy/same-ciphertext ORK refusal plus authorized decrypt, propagation and redeem remain untested. Alternate-policy and master-admin experiments also remain unobserved.
- Protected-state screenshots and a full-flow video require the live flow. The refreshed screenshots show only the unauthenticated workspace.
- Secret/history review is not recorded. Commit/push and fresh-clone build remain pending. Repository visibility requires authorized human action after that review; form submission and confirmation require the human submitter.

Keep emails, invite URLs, credentials, tokens, private adapter content and consent details out of this report and public artifacts. No enrollment, G3, final video, publication or form completion is claimed.
