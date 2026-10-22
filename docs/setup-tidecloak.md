# TideCloak development realm setup

## Verified state

Observed on 2026-10-22 against the running local TideCloak 26.7.5 server:

| Check | Result |
|---|---|
| Runtime | Apple `container`, container `mytidecloak`, native arm64 |
| Host endpoint | `http://localhost:8080`, published only on `127.0.0.1` |
| App realm | `hui-rmit26` exists |
| Public app client | `hui-rmit26-client` exists; development origin `http://localhost:3000` |
| Tide identity provider | Enabled |
| Tide vendor key | Active key material and certificate present |
| Free-tier licence | Active, expires `2026-11-22T04:38:53Z` |
| Vendor key expiry | `2026-11-29T04:38:49Z` |
| Keycloak realm user accounts | 5 prepared (`hanh`, `tuan`, `mai`, `minh`, `bao`) |
| Linked Tide identities | 0/5, per the latest `bun run tide:sync` |
| Tide vendor user-count API | Reports 0; this vendor-side count is not the Keycloak realm `/users` count or the Tide-link count |
| Existing `myrealm` | Unchanged in the before/after API comparison |

The realm contains five prepared Keycloak accounts, but none had a linked Tide identity key in the
latest sync. The separate vendor user-count API reports zero and must not be used to infer that the
Keycloak realm has zero accounts. Realm creation and licensing do not prove human enrollment, IGA
quorum, live policy signing, encryption/decryption or end-to-end demo acceptance. No paid checkout
was followed. The user supplied the licence email and explicitly accepted Tide's Terms before
provisioning; the email itself is deliberately absent from tracked files.

## Reproducible commands

Requires Bun 1.4+ and a running local TideCloak development server. The provisioning command does
not start, stop, remove or recreate containers. It never deletes an existing realm or enables IGA.
Do not use a generated Docker initializer or manually wipe/reinitialize TideCloak as a retry.

For a fresh checkout, install dependencies and create a private `.env` without overwriting an
existing one:

```sh
bun install --ignore-scripts
cp -n .env.example .env
chmod 600 .env
```

Fill the ignored `.env` with your own bootstrap admin credentials and real licence-manager email.
Set `TIDE_TERMS_ACCEPTED=yes` only after that person explicitly accepts https://tide.org/legal.
`cp -n` does not overwrite a populated `.env`; keep the existing file if it is already present.
Never commit `.env`.

For a realm that has not yet been provisioned, run:

```sh
bun run tide:provision
bun run tide:verify
```

`provision-realm.ts` imports the reviewed `realm.json.template` with the app's realm, client and
origin. It uses the master token only for bootstrap, then sends a form-encoded free-tier request to
`POST /admin/realms/{realm}/vendorResources/setUpTideRealm`.

Existing realm configuration is preserved. Active vendor keys are not reissued or rotated.
A partial Tide setup fails explicitly rather than attempting a destructive reset.
Any paid checkout redirect or `NEED_PAYMENT` response is an error, not successful activation.

Verification reads the licence details, checks both licence and vendor-key expiry, checks the
Tide IdP and key component, confirms the app client and OIDC issuer, and compares `myrealm`
before/after. A response code of 200 alone is not considered proof of an active licence.

Private API responses and recovery backups are stored under ignored `.cache/` with owner-only
permissions. Public command output contains only non-secret verification fields.

### First-admin preparation and human enrollment

Run `bun run tide:prepare` once, and only while the realm's IGA authorizers are in `firstAdmin`
bootstrap mode. The command enables the baseline IGA configuration, prepares five Keycloak
accounts, exports the public adapter to ignored `data/tidecloak.json`, and writes private
enrollment links to `.cache/tide-enrollment.html`. It refuses to run outside first-admin mode;
do not rerun it after that mode ends.

Each account owner must open their own local enrollment link in a separate browser profile and
complete Tide enrollment without sharing their password. Then run:

```sh
bun run tide:sync
```

This refreshes the local private mapping from the Keycloak `tideUserKey` attributes. It does not
perform enrollment. The latest observed result is 0/5 linked.

`bun run tide:activate` is a hard gate: all five prepared users must have Tide identity keys, and
the three steward keys must be distinct. It will refuse activation before these conditions hold.
When eligible, the guarded bootstrap flow commits the first steward grant. Then sign in to the
realm console at `http://localhost:8080/realms/hui-rmit26/tide-console/` and have stewards approve
the remaining admin grants and related admin-policy regeneration. Measure the actual approval
threshold there; no quorum or governed release flow is currently verified.

## Network issue encountered and resolved

The first setup request returned HTTP 500. Container logs showed:

```text
[Midgard] InitializeWallet failed: Unknown socket error (ork1.tideprotocol.com:443)
```

Host access to the ORK worked, but `getent ahostsv4 ork1.tideprotocol.com` failed inside the container.
The default container DNS gateway and public DNS resolvers failed on this network. The DNS server
provided by the Wi-Fi DHCP lease resolved the ORK from inside the container.
Only the container's resolver was changed; host DNS, Tailscale, firewall and routes were not changed.

On macOS, identify the current Wi-Fi DNS rather than hard-coding a campus address:

```sh
ipconfig getoption en0 domain_name_server
```

For a **new** container, pass the effective DNS with `container run --dns <reachable-dns> ...`.
For an existing container, diagnose its resolver before changing it. A restart may regenerate
`/etc/resolv.conf`; verify ORK resolution after restarting or changing networks.

The failed first request had left an empty Tide IdP/key component, and a blind retry produced a
duplicate-IdP error. During that initial setup only, the newly created empty partial resources
were backed up privately and removed after verifying there were no app users or active/pending
keys. The realm, app client, `master` and `myrealm` were preserved. This is a historical account
of a one-time recovery, not a reset procedure: do not manually remove resources, wipe H2 or
reinitialize the container as a retry. The setup then succeeded.

## Security and scope

- Keep `.env`, emails, admin credentials, invite URLs and raw key/licence responses out of Git.
- `.cache/` and `data/tidecloak.json` are ignored; check Git history before publishing.
- `mytidecloak` currently has no host data mount. Stop/start preserves its filesystem;
  removing/replacing the container loses its local H2 state. Do not run `container rm` as a retry.
- Loopback HTTP is a development-only exception. A deployed service needs HTTPS and proper secrets management.
- The app must never use the bootstrap master password for runtime approval or authorization.
- Do not mark enrollment, IGA or quorum complete until those paths are exercised separately.

## Verification performed

- `bun run tide:verify`: all reported checks passed; licence and vendor key were unexpired.
- Re-running `bun run tide:provision` preserved the existing realm and active key without reissuing the licence.
- Preflight rejected missing Terms acceptance, a reserved realm name and a non-loopback server before any realm/licence request.
- Latest `bun run tide:sync` reported 0/5 linked accounts; `tide:activate` prerequisites are therefore unmet and governance activation remains pending.
- The final post-cleanup batch passed typecheck, lint, production build and 15 tests across seven files with 43 expectations; all exited 0 without the earlier outer-pnpm-workspace warning. See `../plans/20261022-1026-challenge-2-tidecloak-app/reports/governance-verification-2026-10-22.md`.
- Production browser smoke at 1280x900 and 375x812 had no horizontal overflow. Public config returned 200, unauthenticated circle returned 401 with `no-store`, and the reviewed relay returned 200. Sign-in reached the ORK; no credentials were entered. One Keycloak iframe `ERR_ABORTED` and URL-wait timeout were observed, as documented in `../plans/20261022-1026-challenge-2-tidecloak-app/reports/production-smoke-2026-10-22.md`.
- After removal of accidental root Playwright, `bun audit --production` exited 0 with no vulnerabilities across 92 packages. The full audit remains non-clean due to the unpatched dev-only `braces@3.0.3` advisory described in `system-architecture.md`.
- No human enrollment, steward grants, quorum measurement, live policy signing or shared encryption/decryption was observed.

## Sources

- Tide Admin API: https://docs.tide.org/API/Admin%20API%20Reference
- Licensing guide: https://docs.tide.org/Admin/license
- Tide Agent Pack: https://tide.org/tide-agent-pack.md
- Realm template source: https://mcp.tide.org/pack/templates.tgz (`templates/shared/realm.json.template`).
