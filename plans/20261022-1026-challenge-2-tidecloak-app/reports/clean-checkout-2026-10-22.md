# Credential-free source export — 2026-10-22

## Reproducibility procedure

Exported committed source with `git archive` into a new `/tmp/hui-clean-*` directory. No populated `.env`, private Tide adapter, application data store, enrollment cache or live credentials were copied. This is a Git-tracked source export, not a claim of a network `git clone`.

At implementation commit `bf2951c`, `bun install --frozen-lockfile --ignore-scripts` installed 398 packages and `bun run build` exited 0 without a Tide adapter. The persistent Bun SDK patch was part of the frozen manifest/lockfile. The cold build reported the normal absence of a build cache and Next telemetry notice.

## Failing-before/passing-after test isolation

A subsequent `bun test` in that credential-free directory exposed 13 passes and two failures: the policy-validation tests tried to read the real local adapter. Their synthetic vendor also differed from the configured live vendor, allowing some old rejection assertions to pass before reaching the intended tag/role checks.

Commit `485006a` fixes only the test fixtures. Each policy scenario now runs the real validator in an isolated child process with a temporary adapter containing a freshly generated public EdDSA key and matching synthetic vendor. It exercises an accepted scoped structure as well as rejected bytes, cycle tags, role parameters, vendor and expiry boundaries. The fixture does not verify a real Tide policy signature; ORK authenticity remains a separate live acceptance gate. No application auth/config fallback or production validator relaxation was added.

Re-exported committed source at `485006a` over the credential-free directory; the dependency lockfile was unchanged. Final commands there:

| Command | Observed result |
|---|---|
| `bun run typecheck` | Exit 0 |
| `bun run lint` | Exit 0; no diagnostics |
| `bun test` | Exit 0; 15 pass, 0 fail, 39 expectations across 7 files |
| `bun run build` | Exit 0; optimized production output generated |

## Actual missing-setup runtime

Started the credential-free production build on loopback port 3001, ready in 127 ms. A real browser at 375 × 812 displayed **Secure setup needs attention** and **Check setup again**, with no horizontal overflow. `GET /api/config` returned 503 with code `SETUP_REQUIRED` and generic **Local Tide configuration is not ready**. No session or private circle data was displayed. No fake configuration or data was supplied. The runtime surface is unchanged by the subsequent test-only fixture repair.

The temporary service was stopped, its managed browser tab closed, and its generated source/dependency/build directory removed after verification. The configured production app on port 3000 remains available.

## Delivery and outstanding acceptance

Implementation commit `bf2951c` and fixture fix `485006a` were pushed to private `origin/main`; `starter-bun` was also pushed. README/docs-only evidence reconciliation is recorded separately. The repository was not made public. Human enrollment remains 0/5; no human quorum, live policy signing, ORK release round trip, authenticated screenshot, final video or submission is inferred from these checks.
