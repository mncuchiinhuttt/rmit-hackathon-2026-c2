[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

Current demo: SQLite-backed sample workflow with explicitly simulated TideCloak identities/roles, enabled through local configuration. Real Tide authentication/E2EE acceptance remains incomplete; see the [SQLite setup](docs/sqlite-simulation.md) and [integration plan](docs/tidecloak-integration-plan.md).

**Two-minute demo:** [Watch or download the MP4](demo/video.mp4) · [English captions](demo/video-en.srt) · [Rebuild the HyperFrames video](demo/hyperframes/README.md). Four sections: The possibility, The constraint, The prototype, What changes. Actual app captures and supplied ElevenLabs narration; simulated governance is labelled throughout.

## Project overview

Hostless Hui is a prototype for rotating savings circles that separates cycle-release approval from plaintext access.

### 1. Vision & originality

Each synthetic cycle has a release package and a different recipient entitlement. Stewards approve disclosure; the recipient alone redeems. The intended Tide design encrypts these packages outside server custody. Authority rotates with the cycle rather than accumulating in a permanent host.

### 2. Trust constraint insight

A host operator may read records or change backend permissions. Hostless Hui explores Tide identities, signed policies and ORK-mediated decryption to separate approval from reading. This is not theft-proof: authentic browser code and an honest quorum remain assumptions.

### 3. Value & impact

The demo models what savings groups might inspect: who can approve disclosure and which recipient receives each release. Accounts, contributions and escrow are synthetic; this is neither a financial service nor proof against theft.

### 4. Why TideCloak matters

Protected routes verify Tide JWTs and DPoP; release code includes the Tide SDK and RelationshipAttestation handling. Live policy signing, shared encryption/decryption and quorum approvals have not been accepted. Measure quorum at the enclave, not from a local counter or prepared-account total.

### 5. Prototype & storytelling

The Next.js/Bun app demonstrates rotating recipients, Operator denial, pending proposals, two independent simulated approvals, read-versus-redeem separation and governed expiry/renewal/revocation. SQLite preserves decisions. The two-minute demo shows actual app states and explicitly distinguishes the simulation from the implemented but unverified live Tide integration. Full enrollment, distinct steward keys, IGA activation and live cryptographic acceptance remain gates.

## Run locally

Requirements for the temporary simulation: Bun 1.4+. Copy `.env.example` to `.env` only for a new checkout; preserve an existing private `.env` and add `HUI_AUTH_MODE=simulated` instead. No Tide server or account is needed in this explicit mode. Real Tide mode additionally requires the [private setup](docs/setup-tidecloak.md).

```sh
bun install --ignore-scripts
bun run dev
```

The development server binds to `127.0.0.1` at `http://localhost:3000`. Do not run provisioning or the bootstrap-only preparation command as routine startup; the setup guide explains their gates and how to preserve an existing `.env`.

### Simulated sign-in and access checks

With `HUI_AUTH_MODE=simulated`, open http://localhost:3000/ and choose a fictional account. The main app uses a server-side sample session and saves cycles, approvals, redemption and events in `data/simulation.sqlite`. Bun supplies the SQLite driver; no additional DB server is needed. Data and sessions survive reloads/restarts. This is not real authentication, encryption or a Tide/ORK decision; real protected APIs still require verified Tide credentials.

The workspace explains the five-step savings-circle flow, each account's next action and the receiving schedule. Minh receives cycles 1/3; Bao receives cycle 4. On fresh fixtures, Minh must request cycle 3 access before Hanh and Tuan can approve it. Pending and one vote grant nothing; the second independent vote commits access. A proposer cannot approve their own request.

For the main demonstration: Bao seals cycle 4, Operator tries to open (denied), then proposes reader access for itself. The request stays pending until two stewards approve. Operator can then read that cycle, while only Bao can redeem. Earlier-cycle access does not carry over. Governed renewal and revocation are under Manage access lifetime; technical claims are under Evidence details. See [lifecycle rules and live proof still required](docs/policy-lifecycle-and-evidence.md).

Sign-out clears opened contents, not saved changes. Refresh data reads updates from other browsers. Only Operator can confirm a shared fixture reset. Schema v2 preserves historical redemption/events and leaves an already sealed legacy recipient unchanged.

Set `HUI_AUTH_MODE=tide` and restart to use the preserved real integration. An absent mode defaults to Tide, never simulation; an invalid mode fails. See the [Tide MCP integration plan and role matrix](docs/tidecloak-integration-plan.md). Live cryptographic acceptance remains unverified.

### Preview without Tide

Open http://localhost:3000/demo to try the existing product UI without a Tide server, adapter or account.
The setup error screen also links to this page. The demo is explicitly labelled and keeps fictional
data only in memory; its roles, approvals, opening and redemption are local simulations, not Tide
authentication, encryption or network decisions. Protected APIs still require a verified Tide session.

Cycle 3 starts sealed: try opening as Minh before approval, switch to Hanh and approve once, switch
to Mai and approve again, then return to Minh to open and redeem the sample release. Cycle 4 starts
unsealed so Bao can try sealing. Reset demo or reload to restore the samples.

### Human enrollment and governance

1. `bun run tide:prepare` is a one-time bootstrap command that only runs while the realm remains in `firstAdmin` mode. It creates five Keycloak accounts, exports the ignored adapter to `data/tidecloak.json`, and writes private enrollment links to `.cache/tide-enrollment.html`. Do not rerun it after first-admin mode ends.
2. Each account owner opens their own link from that local file in a separate browser profile and completes Tide enrollment. The invitation is bound to the app client and returns to `http://localhost:3000/`, not the admin console. Passwords stay with their owners.
3. Run `bun run tide:sync` afterward. The latest observed result is 1/5 linked (`hanh`); do not reopen that account's used invitation.
4. `bun run tide:activate` is hard-gated: all five accounts must have Tide identity keys, and the three stewards must have distinct keys. It will refuse activation until then.
5. After first-steward activation, sign in at `http://localhost:8080/realms/hui-rmit26/tide-console/`; stewards must approve the remaining admin grants and related admin-policy regeneration.
6. Measure actual quorum behavior, then exercise signed release policies and authorized/unauthorized use of the same ciphertext and policy. These live acceptance steps have not yet been completed.

To refresh invitations only, run `bun run tide:enroll`; do not rerun the realm bootstrap. This preserves linked identities and writes links only for unlinked accounts. If a stale broker callback displays 500 after linking, close it and start **Sign in with Tide** from the app. See the [callback recovery notes](docs/setup-tidecloak.md#callback-error-after-linking).

The governance payload smoke parsed an actual 269-record approved-history response (244,463 bytes) and mapped a created, inspected, then denied `c4` change request to `payout-c4` with 0/1 approved. This verifies history mapping only: “Approved” is not current entitlement, and the smoke is not an enrolled-user or quorum test.

Role propagation can take up to 120 seconds. The app offers credential refresh and never substitutes a fake success when Tide is unavailable.

### Verify

```sh
bun run typecheck
bun run lint
bun test
bun run build
bun run tide:verify
```

The governance update passed all 41 tests across 14 files with 202 expectations, including persistence, migration, cross-cycle denial, independent proposal votes, expiry, renewal, revocation, single-use redemption, same-origin enforcement and scoped sealed read-policy replacement. Typecheck, lint and production build passed. Isolated subprocess fixtures use directory junctions on Windows and directory symlinks on other platforms. A restricted OS sandbox may need permission to access temporary fixtures; the passing Windows suite was run outside that sandbox. `tide:verify` is for real Tide setup, not a requirement or success claim for simulation.

The earlier credential-free source export passed 15 tests across seven files with 39 expectations. Its initial two policy-fixture failures were repaired with isolated matching-vendor adapters without weakening production validation. See the [clean-checkout report](plans/20261022-1026-challenge-2-tidecloak-app/reports/clean-checkout-2026-10-22.md).

Production browser smoke at 1280x900 and 375x812 had no horizontal overflow; public config returned 200 and unauthenticated circle returned 401. Sign-in reached the ORK without credentials. One Keycloak iframe abort and URL-wait timeout occurred; details are in the [production smoke report](plans/20261022-1026-challenge-2-tidecloak-app/reports/production-smoke-2026-10-22.md). A checkout without private configuration builds successfully and shows an explicit setup error rather than fake data.

Production audit found no vulnerabilities across 92 packages; the full audit still reports the dev-only `braces` advisory detailed in the architecture note. The four remaining enrollments, quorum, policy signing and shared decryption remain unverified.

## Structure

- `src/features/{auth,circle,releases,governance,escrow,demo}`: feature-owned types, client actions, services, product components and isolated simulation.
- `src/app/api`: thin route adapters; `src/components/ui`: shadcn/Radix primitives.
- `scripts/tide`: guarded bootstrap only; never used as application runtime authority.
- [Architecture and limits](docs/system-architecture.md), [project rules](AGENTS.md), [implementation plan](plans/20261022-1026-challenge-2-tidecloak-app/plan.md).
- [Demo video](demo/video.mp4), [demo script](demo/script.md), [HyperFrames source](demo/hyperframes/README.md) and [acceptance checklist](demo/checklist.md).

## Security and scope

Keep `.env`, `data/tidecloak.json`, the local JSON data store, raw licence/key responses and invitation files out of Git.
Do not publish team emails, tokens, invite links or bootstrap credentials in screenshots or video.
The Windows TideCloak container uses a named data volume; the earlier original environment had no host data mount. Preserve both existing realm and volume state; never recreate or wipe them to retry.

The prototype does not implement real escrow, payment custody, custom Forseti deployment or instant per-record revocation.
Policy authenticity is enforced by the ORKs when used; the application validates stored policy structure and expected scope.
Tide master-realm recovery and alternate-policy behavior must be measured before stronger claims are made.
