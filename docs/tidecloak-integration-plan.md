# TideCloak integration and temporary simulation

## Current scope

At the user's request, the main app can simulate TideCloak sign-in, roles and access checks while live setup is unavailable. This is an explicit development mode, not a fallback on Tide errors or evidence of completed Tide acceptance. No real account credentials are collected.

Planning consulted the official Tide MCP at `https://mcp.tide.org/mcp`, server `@tideorg/mcp` version `1.9.33`, on 2026-10-22: `tide_choose_scenario`, `tide_choose_playbook` and `tide_scenario_roles(name: relationship-attestation)`. The scenario chooser returned multiple matches; we resolved the storage/sharing requirement to built-in `RelationshipAttestation:1`, not real-time communication, portable signatures or a new Forseti contract.

MCP guidance distinguishes a capability role from a matching record policy: neither alone permits encryption/decryption. Stewardship is the `tide-realm-admin` **client role on `realm-management`**, not a realm role. API authorization is separate from contract enforcement.

## Role and access mapping

Every fictional account has simulated `_tide_enabled` and `appUser`. Extra roles below describe the selected cycle, not an actual JWT or all-cycle token snapshot.

| Account | Intended Tide roles | Simulated operations |
|---|---|---|
| Minh | Realm `_tide_decryptor`; `hui-cN-winner` after a committed reader grant | Receives cycles 1/3; no automatic access to Bao's turn |
| Hanh, Tuan, Mai | Client `realm-management:tide-realm-admin` | Review others' proposals; no default reader access or beneficiary rights |
| Bao | Realm `_tide_encryptor`; matching write policy; `_tide_decryptor` plus cycle role for its receiving turn | Seal packages; receive cycle 4 only after a committed reader grant |
| Operator | No default reader, encryption or steward capability | May propose access; cannot self-approve. A group-approved reader grant permits opening, never another member's redemption |
| Signed out | No simulated session | No workspace or release operations |

Two distinct stewards is the local demo rule, not a measured Tide quorum. A proposer cannot approve their own request. Fresh fixtures start cycle 1 approved for Minh, cycle 3 sealed for Minh without a grant, and cycle 4 unsealed for Bao. Existing sealed records retain their historic recipient during schema migration. Requests, votes, policy lifecycle and sessions persist in SQLite; sign-out clears opened contents. See [SQLite mode](sqlite-simulation.md) and [policy lifecycle](policy-lifecycle-and-evidence.md).

## Boundaries and live replacement

| Boundary | Temporary implementation | Existing real Tide path / remaining verification |
|---|---|---|
| Session and route entry | `SqliteDemoPage` requires a server-side sample session at `/` | `TideCloakProvider`, browser callback and `useTideSession`; complete credentialed enrollment/login |
| Roles | Server-resolved fictional identity and selected-cycle role projection | Verified JWT claims; preserve realm/client distinction; refresh after propagation |
| Access checks | SQLite service applies `reduceDemo` transactionally and rejects signed-out/wrong-role/duplicate/cross-cycle attempts | `withAuth` / realm/client guards verify real JWT and DPoP server-side; no simulated identity is accepted |
| Approval | Explicit grant/renew/revoke proposal; two independent votes change pending to committed; stale proposals become superseded | IGA/admin policy and current entitlement readback; measure actual quorum and propagation |
| Package storage/open | Clearly marked `DEMO_ONLY` text and sample release code | Enclave-signed RelationshipAttestation policies plus ORK encryption/decryption; verify same-policy denials and authorized reads |
| Redemption | SQLite transaction records one use of a sample code, no funds move | Existing synthetic escrow service with server authorization and atomic redemption; never real payment custody |

Simulation initializes no Tide provider, issues no Tide JWT/DPoP proof and calls only its separate `/api/simulation` endpoint. The real APIs remain real in **both modes**; sample-session cookies do not satisfy their guards. SQLite API checks enforce the sample workflow server-side, but anyone can select another fictional identity. They establish neither real identity assurance nor Tide confidentiality/network enforcement.

## Run and switch modes

Set `HUI_AUTH_MODE=simulated` in local `.env`, then run the normal Bun app. `.env.example` includes that explicit choice for this temporary development phase. If the variable is absent, the app defaults to real `tide`; invalid values fail rather than silently enabling simulation.

On fresh fixtures at `/`, Minh first requests cycle 3 access; Hanh and Tuan independently approve the request. Minh can then open/redeem. For the operator demonstration, Bao seals cycle 4; Operator tries to open (denied), proposes access (pending), and tries again after the first steward vote (still denied). The second independent vote commits that specific grant. Operator may then read, while only Bao may redeem. Minh's earlier cycle access does not open cycle 4. `/demo` remains a simpler, in-memory preview; the full governance story runs at `/`.

To return to real integration, set `HUI_AUTH_MODE=tide` and restart the server after completing the [private Tide setup](setup-tidecloak.md). No code rewrite or mock-token bypass is needed. Missing adapter/network errors remain errors. `/auth/redirect` returns to `/` in simulation and mounts the existing browser-only Tide callback only in real mode.

Still unverified: live vendor-key finalization on this Windows instance, remaining enrollment, distinct real steward keys, measured quorum, signed policies, ORK encryption/decryption and propagation/revocation behavior. The simulation does not close those gates or establish organiser acceptance. Repository publication, video and external submission remain deferred by the user.
