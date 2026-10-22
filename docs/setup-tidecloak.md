# TideCloak development realm setup

## Verified state

Observed on 2026-10-22 at 04:40:35 UTC against the running local TideCloak 26.7.5 server:

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
| Realm user accounts | 0 |
| Existing `myrealm` | Unchanged in the before/after API comparison |

Realm creation and licensing are complete. This does **not** mean the webapp, user enrollment,
IGA quorum, policy-based encryption or a demo flow is implemented. No paid checkout was followed.
The user supplied the licence email and explicitly accepted Tide's Terms before provisioning.
The email itself is deliberately absent from tracked files.

## Reproducible commands

Requires Bun and a running local TideCloak development server. The provisioning command does not
start, stop, remove or recreate containers. It never deletes an existing realm or enables IGA.

For a fresh clone only:

```sh
cp .env.example .env
chmod 600 .env
```

Fill the ignored `.env` with your own bootstrap admin credentials and real licence-manager email.
Set `TIDE_TERMS_ACCEPTED=yes` only after that person agrees to https://tide.org/legal.
Do not overwrite a populated `.env` or commit it.

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

The failed first request had left an empty Tide IdP/key component. Retrying the setup endpoint
blindly produced a duplicate-IdP error. Recovery backed up those newly created partial resources
privately, verified no app users or active/pending keys existed, and removed only those empty
resources. The realm, app client, `master` and `myrealm` were preserved. Setup then succeeded.
Do not apply this recovery to an enrolled or licensed realm.

## Security and scope

- Keep `.env`, emails, admin credentials, invite URLs and raw key/licence responses out of Git.
- `.cache/` and `data/tidecloak.json` are ignored; check Git history before publishing.
- `mytidecloak` currently has no host data mount. Stop/start preserves its filesystem;
  removing/replacing the container loses its local H2 state. Do not run `container rm` as a retry.
- Loopback HTTP is a development-only exception. A deployed service needs HTTPS and proper secrets management.
- The app must never use the bootstrap master password for runtime approval or authorization.
- Do not mark enrollment, IGA or quorum complete until those paths are exercised separately.

## Verification performed

- `bun run tide:verify`: all reported checks passed; licence and vendor key unexpired.
- `bun run --bun tsc --noEmit`: passed.
- Re-running `bun run tide:provision` preserved the existing realm and active key without reissuing the licence.
- Preflight rejected missing Terms acceptance, a reserved realm name and a non-loopback server before any realm/licence request.
- `bun run build`: passed.

## Sources

- Tide Admin API: https://docs.tide.org/API/Admin%20API%20Reference
- Licensing guide: https://docs.tide.org/Admin/license
- Tide Agent Pack: https://tide.org/tide-agent-pack.md
- Realm template source: https://mcp.tide.org/pack/templates.tgz (`templates/shared/realm.json.template`).
