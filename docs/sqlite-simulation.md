# SQLite-backed development mode

Use this mode to run the app without a working Tide instance. It is an explicit development choice, not an automatic fallback when real authentication fails. Accounts are fictional and freely selectable; do not deploy it as real authentication or store confidential/financial data.

## Run

Keep `HUI_AUTH_MODE=simulated` in local `.env`. Optionally set `HUI_SIMULATION_DB_PATH=data/simulation.sqlite` (the default). Preserve any existing private `.env`; do not overwrite it with the example. Run the app using Bun:

```sh
bun run dev
```

Open http://localhost:3000/. The DB directory and schema are created lazily on the first simulation API request. Initial fixtures are inserted once, not on every startup. `bun run build` followed by `bun run start` uses the same file by default. No extra runtime dependency or external database service was added: this uses Bun's built-in [SQLite driver](https://bun.sh/docs/runtime/sqlite).

## Stored data

| Table | Contents |
|---|---|
| `simulation_cycles` | Recipient, seal/redemption state and policy version/expiry/revocation for cycles 1, 3 and 4 |
| `simulation_approvals` | Committed recipient approvals per cycle |
| `simulation_readers` | Reader grants applied by committed changes |
| `simulation_changes` / `simulation_change_votes` | Proposer, requested scope, independent votes and pending/committed/superseded history |
| `simulation_events` | Latest 50 sample events, including denied attempts |
| `simulation_sessions` | SHA-256 hashes of opaque sample-session tokens, actor and expiry |

Schema version 2 is tracked with `PRAGMA user_version`. Migration preserves existing sessions, redemption and events. A legacy cycle 4 changes to Bao only while still unsealed; a previously sealed legacy turn keeps its recorded recipient. New/reset fixtures assign Minh to cycles 1/3 and Bao to cycle 4. Mutations use immediate transactions and prepared parameters; WAL and a busy timeout support local readers/writers. Foreign keys and unique vote constraints apply.

## Sessions and access

`/api/simulation` is separate from real Tide APIs and is available only in explicit simulated mode on a localhost URL. POST requires the same Origin; cross-site requests fail. A sample sign-in selects an allowed fictional identity, rotates an opaque 8-hour session and sets an HttpOnly/SameSite=Strict cookie. The server resolves the actor from that session, not from approval/open/redeem bodies. Signing out revokes that token without resetting shared state.

Bao seals. A reader proposes access for a specific cycle; two distinct stewards other than the proposer must approve before it commits. One vote changes no entitlement. The scheduled recipient alone may redeem once. Operator and stewards have no default read access, but the group can explicitly grant a reader access without transferring payout ownership. Only Operator may reset shared fixtures; its dialog describes the effect on all browsers. Sessions and real Tide data survive reset.

Renewal and revocation use the same proposal/vote workflow. Expiry/revocation denies future opens and redemption; renewal never restores readers cleared by revocation. See [policy lifecycle and live evidence](policy-lifecycle-and-evidence.md) for the exact rules and copied-code limits.

Use separate browser profiles for simultaneous different identities. Tabs in one profile share the sample-session cookie, so signing in/out affects them together. Refresh data or reload retrieves current state; there is no live push subscription. Reload/server restart preserves DB data and an unexpired session; opened package contents are not persisted in browser storage.

`/demo` remains the separate throwaway, in-memory role-switching preview. It does not call the simulation API or modify SQLite. Switching to `HUI_AUTH_MODE=tide` and restarting disables `/api/simulation`; existing JWT/DPoP guards remain in force, and the DB is left untouched. There is no silent in-memory fallback if SQLite fails: the UI surfaces the error and offers refresh.

## Storage and limits

Keep the DB, `-wal` and `-shm` sidecars private and out of Git (ignored under `data/`). For backup, stop the app and preserve the database together with any remaining sidecars. Do not delete the database to reset it; use the explicitly confirmed demo reset. Do not point this path at a Tide ledger/adapter.

This is a single-machine Bun app with durable local disk, not an ephemeral/serverless deployment. Development binds to loopback; do not expose sample account selection publicly. Anyone with local file access or the ability to choose another sample account can act as that identity. SQLite stores fictional state, not ORK ciphertext guarantees, real user passwords, real plaintext release packages, dokens or custody funds. Existing Tide JSON persistence is intentionally not migrated or overwritten.
