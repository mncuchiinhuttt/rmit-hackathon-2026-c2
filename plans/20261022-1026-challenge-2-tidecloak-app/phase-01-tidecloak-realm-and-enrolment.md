# Phase 01: TideCloak realm, enrollment and quorum

## Context links

- `research/researcher-04-raziel-build-path.md` §2, §8; `research/researcher-01-tidecloak-technical.md`
- Tide setup record: `../../docs/setup-tidecloak.md`
- Private adapter and enrollment material must remain outside tracked documentation.

## Overview

- Priority: P1 · Status: realm/client/licence and baseline configuration verified; human enrollment and quorum blocked.
- Existing local TideCloak realm: `hui-rmit26`; client: `hui-rmit26-client`; keep `myrealm` unchanged.

## Observed state

| Item | Status |
|---|---|
| Realm, app client and free-tier licence | Verified by live API; existing realm preserved. |
| Baseline IGA | Enabled in FirstAdmin. This does not prove multi-admin activation or quorum. |
| Prepared users and roles | Five aliases `hanh`, `tuan`, `mai`, `minh`, `bao` and read/write/winner role setup are prepared. |
| Invite generation | Generated privately and opened for the user; no invite URL or email is recorded here. |
| Enrollment synchronization | Latest `bun run tide:sync` at 12:57 returned exit 0 and reported 0/5 linked. A successful command exit is not enrollment. |
| Adapter | A private adapter exists; do not copy its content or credentials into the plan. |
| Live admin/quorum proof | No first-admin activation, distinct steward keys, remaining admin grants, measured quorum or successful policy flow is verified. |

## Required safety invariants

- Do not run `bootstrap-tidecloak.sh`, `init-tidecloak.sh`, `container rm`, or any destructive realm reset. The existing container has no host data mount.
- Use master-admin credentials only for bootstrap/provisioning; never in app runtime or approval routes.
- A 2xx IGA response may be accepted but not applied. Read back committed state and token claims before claiming a grant.
- Do not infer a threshold from the number of prepared administrators. Quorum is measured only by a live CR whose first approval is observed pending and later approval is observed committed.
- `RelationshipAttestation` signing is an admin-signed policy action, not ordinary member sharing.

## Current checklist

- [x] `hui-rmit26`, client and licence verified; `myrealm` preserved.
- [x] Baseline IGA enabled in FirstAdmin.
- [x] Five user aliases and read/write/winner role setup prepared.
- [x] Private adapter available.
- [x] `bun run tide:sync` executed; latest observed result at 12:57 was 0/5 linked.
- [ ] Five human accounts linked and enrollment confirmed; blocked on invitees completing the private enrollment flow.
- [ ] First-admin activation with a linked human administrator; blocked on enrollment.
- [ ] Distinct steward keys and remaining admin grants; blocked on linked human stewards and governed approvals.
- [ ] Actual quorum measured (at least two); no qualifying live change request has been exercised.
- [ ] Live enclave approval, policy signature or role-claim readback; not exercised.

## Acceptance boundary

Realm provisioning is complete, but G1 is not. The required `tideUserKey` links, committed state, active admin identities and observed threshold are absent. No successful live sign-in, IGA approval, policy signing or ORK encryption/decryption is evidenced by this phase.

## Privacy and recovery

Keep `.env`, license details, user emails, invite links, master credentials, private adapter and raw Tide responses local/ignored. Do not use dummy consent, reset the realm, or attempt paid checkout. A platform setup response or prepared account does not substitute for human enrollment.
