[![Built with TideCloak](https://tide.org/badges/built-with-tidecloak.svg)](https://tide.org/tidecloak?utm_source=github&utm_medium=readme&utm_campaign=unlocked)

Current demo: SQLite-backed sample workflow with explicitly simulated TideCloak identities/roles, enabled through local configuration. Real Tide authentication/E2EE acceptance remains incomplete; see the [SQLite setup](docs/sqlite-simulation.md) and [integration plan](docs/tidecloak-integration-plan.md).

## Project overview

Hostless Hui is a prototype for rotating savings circles that separates cycle-release approval from plaintext access.

### 1. Vision & originality

Each synthetic cycle has an encrypted release package and recipient entitlement. Stewards approve access through Tide; the recipient opens the package. Authority is intended to rotate with the cycle rather than accumulate in a permanent host.

### 2. Trust constraint insight

A host operator may read records or change backend permissions. Hostless Hui explores Tide identities, signed policies and ORK-mediated decryption to separate approval from reading. This is not theft-proof: authentic browser code and an honest quorum remain assumptions.

### 3. Value & impact

The demo models what savings groups might inspect: who can approve disclosure and which recipient receives each release. Accounts, contributions and escrow are synthetic; this is neither a financial service nor proof against theft.

### 4. Why TideCloak matters

Protected routes verify Tide JWTs and DPoP; release code includes the Tide SDK and RelationshipAttestation handling. Live policy signing, shared encryption/decryption and quorum approvals have not been accepted. Measure quorum at the enclave, not from a local counter or prepared-account total.

### 5. Prototype & storytelling

The Next.js/Bun feature-first app, local adapter export, protected API boundary and real Tide sign-in navigation are implemented. Five Keycloak accounts are prepared, but the latest sync found 1/5 Tide-linked identities. Browser smoke reached the ORK sign-in form without credentials being entered. Full enrollment, distinct steward keys, IGA activation, live release acceptance, protected-state screenshots and a final video remain gates.

## Run locally

Requirements for the temporary simulation: Bun 1.4+. Copy `.env.example` to `.env` only for a new checkout; preserve an existing private `.env` and add `HUI_AUTH_MODE=simulated` instead. No Tide server or account is needed in this explicit mode. Real Tide mode additionally requires the [private setup](docs/setup-tidecloak.md).

```sh
bun install --ignore-scripts
bun run dev
```

The development server binds to `127.0.0.1` at `http://localhost:3000`. Do not run provisioning or the bootstrap-only preparation command as routine startup; the setup guide explains their gates and how to preserve an existing `.env`.

### Simulated sign-in and access checks

With `HUI_AUTH_MODE=simulated`, open http://localhost:3000/ and choose a fictional account. The main app uses a server-side sample session and saves cycles, approvals, redemption and events in `data/simulation.sqlite`. Bun supplies the SQLite driver; no additional DB server is needed. Data and sessions survive reloads/restarts. This is not real authentication, encryption or a Tide/ORK decision; real protected APIs still require verified Tide credentials.

On a fresh database, Minh's cycle 3 open is denied. Sign out and sign in as Hanh to approve, then as Tuan to add the second approval. Steward and Operator reads remain denied. Sign back in as Minh to open/redeem. Bao can seal cycle 4. Sign-out clears opened contents, not saved changes. Use Refresh data or reload for updates made in another browser. Only Operator can confirm Reset shared demo; this replaces fictional data for everyone using this server, not real Tide data.

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

The SQLite update passed all 31 tests across 11 files with 142 expectations, including persistence after reopening, separate DB connections, server-side role denials, single-use redemption, session rotation, same-origin enforcement, failed-write rollback and safe rejection of newer schemas. Typecheck, lint and production build passed. Isolated subprocess fixtures use directory junctions on Windows and directory symlinks on other platforms. A restricted OS sandbox may still need permission to access temporary fixtures; the passing Windows suite was run outside that sandbox. `tide:verify` is for real Tide setup, not a requirement or success claim for simulation.

The earlier credential-free source export passed 15 tests across seven files with 39 expectations. Its initial two policy-fixture failures were repaired with isolated matching-vendor adapters without weakening production validation. See the [clean-checkout report](plans/20261022-1026-challenge-2-tidecloak-app/reports/clean-checkout-2026-10-22.md).

Production browser smoke at 1280x900 and 375x812 had no horizontal overflow; public config returned 200 and unauthenticated circle returned 401. Sign-in reached the ORK without credentials. One Keycloak iframe abort and URL-wait timeout occurred; details are in the [production smoke report](plans/20261022-1026-challenge-2-tidecloak-app/reports/production-smoke-2026-10-22.md). A checkout without private configuration builds successfully and shows an explicit setup error rather than fake data.

Production audit found no vulnerabilities across 92 packages; the full audit still reports the dev-only `braces` advisory detailed in the architecture note. The four remaining enrollments, quorum, policy signing and shared decryption remain unverified.

## Structure

- `src/features/{auth,circle,releases,governance,escrow,demo}`: feature-owned types, client actions, services, product components and isolated simulation.
- `src/app/api`: thin route adapters; `src/components/ui`: shadcn/Radix primitives.
- `scripts/tide`: guarded bootstrap only; never used as application runtime authority.
- [Architecture and limits](docs/system-architecture.md), [project rules](AGENTS.md), [implementation plan](plans/20261022-1026-challenge-2-tidecloak-app/plan.md).
- [Demo script](demo/script.md) and [acceptance checklist](demo/checklist.md). A final submission video has not been recorded yet.

## Security and scope

Keep `.env`, `data/tidecloak.json`, the local JSON data store, raw licence/key responses and invitation files out of Git.
Do not publish team emails, tokens, invite links or bootstrap credentials in screenshots or video.
The Windows TideCloak container uses a named data volume; the earlier original environment had no host data mount. Preserve both existing realm and volume state; never recreate or wipe them to retry.

The prototype does not implement real escrow, payment custody, custom Forseti deployment or instant per-record revocation.
Policy authenticity is enforced by the ORKs when used; the application validates stored policy structure and expected scope.
Tide master-realm recovery and alternate-policy behavior must be measured before stronger claims are made.
