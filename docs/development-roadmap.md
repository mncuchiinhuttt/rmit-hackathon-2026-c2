# Development roadmap

| Milestone | State | Evidence / boundary |
|---|---|---|
| Competition brief and implementation plan | Written | `challenge-2-brief.md`; full plan remains in `../plans/20261022-1026-challenge-2-tidecloak-app/plan.md` |
| Framework cutover and feature-first application | Implemented | Next.js 16.4.2, React 19.3.1, Bun 1.4 and Tailwind 4; feature boundaries in `system-architecture.md` |
| shadcn/Radix UI and responsive UI | Implemented; probe complete | 375px probe had no issues; at 1280px only the required keyboard focus ring was flagged |
| Realm, client and free-tier Tide licence | Verified | `setup-tidecloak.md`; live licence/vendor-key checks passed |
| Keycloak demo-account preparation | Verified | Five realm accounts prepared; vendor user-count API separately reported 0 |
| Tide identity enrollment | 1/5 linked; remaining human action | `hanh` linked; fresh app-bound invitations verified for the other four, with linked identities preserved |
| Enrollment handoff recovery | Entry verified; final human callback pending | `tide:enroll` binds app client/return URI; fresh Link Account action reached the ORK; no admin-role workaround or vendor-handler patch |
| First-admin activation and steward grants | Pending human action | `tide:activate` requires five linked accounts and three distinct steward keys; remaining grants/regeneration are not committed |
| IGA quorum, signed policies and shared encryption/decryption | Implemented path; live acceptance pending | No observed quorum, successful signed-policy flow, shared release round trip or alternate-policy test |
| Tide change-request history mapping | Implemented; payload smoke verified | Actual Tide shape mapped `entityId`/role rows to cycle `recordIds[]`; 269 approved records (244,463 bytes) parsed; denied `c4` request mapped to `payout-c4`, 0/1. Approval history is not current entitlement or end-user/quorum proof |
| Automated verification | Windows batch passed | Latest typecheck/lint/build and 18 tests/61 expectations across eight files passed; directory junctions fix isolated fixture linking on Windows without changing assertions or production auth |
| Production dependency audit | Verified | After accidental root Playwright removal, production audit exited 0 with no vulnerabilities across 92 packages |
| Full dependency audit | Outstanding dev-only advisory | `braces@3.0.3` high-severity advisory remains unpatched; full audit is not clean |
| Production browser smoke | Completed with recorded limitation | 1280x900 and 375x812 no horizontal overflow; config 200, unauthenticated circle 401/no-store, relay 200; ORK sign-in reached without credentials. One Keycloak iframe abort and URL-wait timeout recorded in `../plans/20261022-1026-challenge-2-tidecloak-app/reports/production-smoke-2026-10-22.md` |
| Private delivery and reproducible build | Verified | Implementation and fixture fix pushed privately; frozen-lock install/build from Git-tracked source succeeded; missing-adapter runtime failed closed; bounded secret/history review recorded |
| Public repository and challenge submission | Deferred by the user | PRIVATE visibility checked; video/publication postponed and no external form submitted |

The explicit offline /demo flow is browser-tested and uses local fictional data. Current Windows Tide setup is blocked at vendor-key finalization and has no exported adapter; the original realm/licence and 1/5 enrollment evidence above belongs to the earlier environment.

Realm/licence provisioning is one verified slice, not completion of the application or challenge
acceptance. Keep human enrollment, IGA/quorum, live cryptographic behavior and submission states
separate from implemented code paths.
