# Project changelog

## 2026-10-22

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
