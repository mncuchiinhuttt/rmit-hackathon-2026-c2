# Verification Report — 2026-10-22 — Hostless Hui Server Boundaries

## Scope and test isolation

Added six deterministic test files:
- `src/features/auth/server/identity.test.ts` — realm-role vs exact-client-role claim distinction.
- `src/features/releases/server/policy-validation.test.ts` — malformed policy bytes, wrong `assignmentId` record tag, malformed role parameters, expiry bounds/mismatch, and unprivileged policy-storage denial.
- `src/features/escrow/server/redeem-service.test.ts` — synthetic beneficiary/roles/code; wrong beneficiary, missing release role, wrong code, concurrent single-use redemption, and corrupt-store failure.
- `tests/request-body.test.ts` — exact 64 KiB JSON boundary, unsupported media type, declared-size rejection, and streamed-size rejection.
- `tests/auth-crypto-boundary.test.ts` — real `withRealmRole` / `withClientRole` wrappers and real JWT/DPoP verification using ephemeral EdDSA issuer and ES256 proof keys.
- `tests/dpop-replay-retention.test.ts` — actual `verifyDpop` + `MemoryJtiStore` with a signed future-`iat` proof and isolated child clock.

Integration tests execute in child Bun processes with unique temporary working directories and clean up in `finally`. Auth wrapper fixtures contain only an ephemeral public JWK, synthetic `vendorId`, origin-signature placeholder, and synthetic username mapping; the issuer and DPoP private keys are generated in the child and never written. The replay test uses a signed ES256 proof and actual `MemoryJtiStore`; after first acceptance it advances child `Date.now()` by 305 seconds, beyond the old `now + skew` receipt expiry but still within the proof's `iat` validity window, then confirms replay rejection. No shared test-process clock, real adapter, enrollment, or live credential is used.

The auth-wrapper test observed valid sender-bound realm-role and client-role requests succeed (200). Replay, missing proof, Bearer scheme, wrong `htu`, wrong `azp`, and expired access token were denied (401); a `tide-realm-admin` realm/other-client role spoof was denied by `withClientRole` (403), without reaching the handler. The future-`iat` proof was accepted once and replayed proof rejected with `DpopError: DPoP proof jti already used — replay.`

## Final verification

The first full batch before parent implementation fixes found typecheck/lint errors; those were fixed. The final full batch was run once after adding both crypto regression tests:

| Command / smoke | Exit / status | Result |
|---|---:|---|
| `bun run typecheck` | 0 | Passed. |
| `bun run lint` | 0 | Passed with one warning for an unused `mkdir` import in `dpop-replay-retention.test.ts`; that import was removed afterward and targeted ESLint passed with no diagnostics. |
| `bun test` | 0 | Passed: 9 tests across 6 files, 26 expectations, 0 failures (130 ms). |
| `bun run build` | 0 | Passed: optimized webpack compilation, TypeScript, page generation, and build tracing. |
| `bun run --bun eslint tests/dpop-replay-retention.test.ts` after import cleanup | 0 | Passed; no diagnostics. |
| `GET http://localhost:3000/api/circle` without credentials | 401 | Expected unauthenticated denial. |
| `GET http://localhost:3000/api/config` | 200 | Public config endpoint available; response body was not printed. |

The full-batch output is preserved in `artifact://217`; the initial pre-fix diagnostics are in `artifact://195`. The parent development service was not restarted or stopped. The only post-batch edit was removing the unused test import; no test or implementation behavior changed. The full suite/build were not rerun after this cleanup.

## Security audit status provided by parent

Not run by this worker. Parent reports production audit `0/94`; the full development-tools audit has one remaining high finding, `braces` (no patch available), so that audit is not clean. Do not present the development-tools audit as passing.

## Build and adapter limits

The successful build reported `Environments: .env`. `src/app/api/config/route.ts` declares `dynamic = "force-dynamic"` and invokes `loadTideConfig()` only inside `GET`; the build produced dynamic `/api/config` output and reported no adapter-specific failure. **[INFERENCE]** This supports runtime loading rather than requiring adapter configuration during compilation. A separate source-copy build with `.env` and adapter files absent was not run; clean no-adapter compilation was not independently proved.

## Evidence limits

The JWT/DPoP tests exercise app verification with ephemeral synthetic keys/claims, not a live Tide issuer or enrolled account. No human enrollment, IGA quorum, ORK enforcement, E2EE release, or live financial transfer was exercised. Valid release-policy acceptance was not tested because that path reads local adapter configuration; rejection tests stop before adapter loading. The policy-storage denial test passes a synthetic `AuthContext` directly and does not test or bypass API authentication. Live smoke proves only unauthenticated `/api/circle` denial and `/api/config` availability. Synthetic identities, keys, tokens, ciphertext, codes, and escrow are test fixtures only.
