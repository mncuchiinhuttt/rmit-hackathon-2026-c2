# Project changelog

## 2026-10-22

### SQLite-backed simulation

- Added Bun-native SQLite persistence for fictional cycles, distinct approvals, single-use redemption, latest 50 events and hashed sample sessions. Schema versioning, foreign keys, WAL and immediate transactions are in place; no dependency or DB service was added.
- The main app now uses separate localhost-only `/api/simulation` handlers with same-origin POST checks, input limits, opaque HttpOnly/SameSite sample cookies and server-resolved actors. Real Tide JWT/DPoP APIs remain unchanged and reject sample cookies.
- Reload and an actual production restart preserved sample state/session; independent HTTP sessions shared approvals. Browser checks exercised steward denial, recipient open/redeem persistence, responsive views and reset-dialog cancel. Only Operator can confirm a shared reset; the actual working demo DB was not reset during browser verification.
- Kept `/demo` in memory. Added [SQLite setup and limits](sqlite-simulation.md), ignored DB/sidecars and explicit persistence/error/reset copy. Tide mode does not silently fall back to SQLite.
- Verification: 31 tests passed across 11 files with 142 expectations; typecheck, lint and production build passed. Readback after an actual server restart preserved the sample session and approval. DB/WAL/SHM ignore checks passed; repo remains private, with no push/publication requested in this change.

### Explicit TideCloak simulation

- Added explicit `HUI_AUTH_MODE=simulated` for the main app: fictional account sign-in/sign-out, selected-cycle role display and role/access enforcement. No Tide credentials, fake tokens or real encryption are used.
- Consulted Tide MCP 1.9.33 for scenario/playbook planning and the RelationshipAttestation role/policy matrix; documented the mapping and live replacement in `tidecloak-integration-plan.md`.
- Kept the real provider, browser callback and JWT/DPoP API guards intact. Missing mode retains real Tide, invalid mode fails, and simulated callbacks return to the app.
- Added signed-out action denials, capability/cycle-role checks and mode-selection tests. All 22 tests across nine files passed with 93 expectations.
- Typecheck, lint and production build passed. Production browser checks covered sealing, distinct account approvals, recipient access/redemption, Escape/focus and sign-out clearing; desktop/mobile had no horizontal overflow. The same build in real Tide mode retained its setup error instead of falling back. See the [simulation verification](../plans/20261022-1026-challenge-2-tidecloak-app/reports/simulated-tidecloak-2026-10-22.md).
- Existing `/demo` remains an instant role-switch preview. Main-mode sign-out clears opened content but retains local approvals until reset/reload. No live Tide gate, video or public publication is claimed complete.

### Windows test compatibility

- Changed the three isolated auth, replay and policy fixture setups to use directory junctions on Windows, preserving directory symlinks on macOS/Linux. Test assertions and production authorization code are unchanged.
- All 18 tests across eight files now pass on Windows, with 61 expectations. Typecheck, lint and production build also passed; tests and build required execution outside the restrictive OS sandbox.
- Confirmed repository visibility is PRIVATE. Video recording and publication are deferred at the user's request; no submission form was sent.

### Offline product preview

- Added explicit /demo mode with fictional in-memory data and role switching, reusing the product workspace, release card, events and redemption dialog.
- Demo approvals and access decisions are labelled local simulations; the page skips Tide provider initialization and makes no protected API calls.
- The live setup error screen links to the preview. Live authentication and protected API guards remain in place.
- Added checks for distinct demo approvers, per-cycle scope, role separation, single-use redemption and reset behavior.
- Verified the demo denial, two-person approval, recipient open/redeem, escrow sealing and reset in the browser; desktop/mobile views had no horizontal overflow. Typecheck, lint and production build passed. The three new demo tests passed; the full Windows run had 14 passes and four existing symlink-permission failures.

### Infrastructure and Tide realm

- Created and verified realm `hui-rmit26` and client `hui-rmit26-client` on the existing local TideCloak server; the free-tier licence and vendor-key expiry were verified through live API responses.
- Preserved `myrealm`; no paid checkout or container recreation occurred. Container DNS was corrected using the Wi-Fi-provided resolver; the one-time recovery removed only empty partial resources and is not a reset procedure.
- Added Bun provisioning/verification scripts and the reviewed realm template. Bootstrap credentials, personal email/consent details, raw responses and recovery backups remain private.
- Prepared five Keycloak demo accounts; the latest sync now reports 1/5 linked (`hanh`). The vendor user-count API separately reported 0 during bootstrap; it is not the live linked-account count.
- `bun run tide:prepare` generated private local enrollment material and the ignored adapter. Invitation links are not included in tracked files.

### Enrollment callback recovery

- Medium-impact onboarding defect: invitations omitted app client/return URI, leading a newly linked member into the admin console; logs then showed licence 403 and a stale-session broker 500. `hanh` remained linked.
- Added `bun run tide:enroll` and reused it from preparation: explicit app-bound return, checked action-token metadata, private links only for unlinked accounts, no relinking or role/realm reset.
- Actual smoke verified four app-bound invitations and entry through **Link Account** to the Tide ORK. Human completion of a fresh invitation's final callback remains unverified. The vendor stale-session handler was not patched.

### Application and UI

- Replaced the initial Bun starter with a feature-first Next.js 16.4.2 App Router application using Bun 1.4, React 19.3.1 and Tailwind CSS 4.
- Installed and used shadcn/Radix UI primitives; product UI, client actions, services and types are organized under auth, circle, releases, governance and escrow features, with thin API route adapters.
- Public config returned 200, an unauthenticated protected circle request returned 401, and browser navigation reached the real Tide sign-in/ORK form without entering credentials.
- The final UI probe reported no issues at 375px. At 1280px its only flag was the intentionally retained keyboard focus ring, required by project accessibility rules.

### Tide governance history

- Implemented the actual Tide change-request shape: `entityId` is a user UUID; each row carries `ROLE_ID` and `USER_ID`. The read model fetches pending/approved requests and roles with the caller token, then maps exact role UUID/name to one or more cycle `recordIds[]`.
- UI status now says Tide approval history; “Approved” does not claim current role entitlement.
- Payload smoke parsed a 269-record approved history (244,463 bytes) under the 1 MiB upstream cap while public inputs remain capped at 64 KiB. A harmless `c4` proposal was created, inspected, then denied without authorization; its denied change request mapped to `payout-c4`, 0/1 approved.
- This confirms history parsing/mapping only. It does not prove end-user enrollment, steward quorum or a live release.

### Verification and security

- The final credential-free source export passed typecheck, lint, production build and 15 tests across seven files with 39 expectations. Its initial two policy-test failures exposed a private-adapter dependency and a vendor-mismatch false-positive path; isolated matching-vendor fixtures now exercise accepted structure and specific rejection boundaries. See the [clean-checkout report](../plans/20261022-1026-challenge-2-tidecloak-app/reports/clean-checkout-2026-10-22.md).
- Production browser smoke at 1280x900 and 375x812 had no horizontal overflow; public config returned 200, unauthenticated circle returned 401 with `no-store`, and the reviewed relay returned 200. Sign-in reached the ORK with no credentials entered. One Keycloak iframe `ERR_ABORTED` and URL-wait timeout were observed; see `../plans/20261022-1026-challenge-2-tidecloak-app/reports/production-smoke-2026-10-22.md`. No claim of zero browser errors.
- A later unused-import fix passed targeted ESLint.
- Review fixes include DPoP replay-JTI retention through `iat` plus allowed skew, fresh demo-user mapping after `tide:sync`, a logout epoch that blocks late plaintext reopening, and dialog focus restoration. The replay-TTL scenario failed before and passed after its fix.
- A committed, persistent Bun patch for pinned `@tidecloak/js@0.14.33` covers ESM and CJS, disables optional JavaScript-readable `kcToken` persistence by clearing the legacy cookie, and preserves front-channel login, DPoP and E2EE. SDK cookie smoke passed on both bundles; keep the patch while this version is pinned.
- After removing accidental root Playwright, `bun audit --production` exited 0 with no vulnerabilities across 92 packages. The full audit still reports the unpatched dev-only `braces@3.0.3` advisory described in `system-architecture.md`.
- Built from Git-tracked source without `.env` or a Tide adapter; actual production runtime returned configuration 503 and an explicit setup screen, never fake private data.
- Completed the bounded staged/history private-data review and pushed the implementation, fixture repair and `starter-bun` tag to the private repository. Public publication remains separate.

### Remaining acceptance and submission gates

- Human enrollment of all five accounts, distinct steward identities, first-admin activation, remaining admin grants and admin-policy regeneration remain pending.
- No actual quorum, successful enclave-signed policy, shared encryption/decryption, alternate-policy/master-recovery experiment or authenticated protected-state screenshot is verified.
- Money movement and escrow are synthetic. No real payment custody or theft-proof guarantee is claimed.
- Login screenshots were refreshed from the actual production workspace; no protected-state screenshots or final demo video are claimed as verified.
- The repository remains private. Public publication, external form submission and final submission confirmation have not occurred.
