# Phase 02: App foundation on Bun

## Context links

- `research/researcher-04-raziel-build-path.md` §1, §3–§4
- Current repo rules: `../../AGENTS.md`
- Verification evidence: `reports/verification-tests-2026-10-22.md`

## Overview

- Priority: P1 · Status: code cutover and feature-first app implemented; live Tide authentication acceptance remains unproven.
- Runtime and package manager: Bun 1.4.0. Actual framework: Next 16.4.2, React 19.3.1, Tailwind 4.3.3. The old Bun starter is retained at tag `starter-bun`.
- Local shadcn/Radix primitives, Geist and Lucide are present; the actual app is not the planned flat vault scaffold.

## Actual architecture

Product features are under `src/features/{auth,circle,releases,governance,escrow}`. Route adapters are under `src/app/api`; shared infrastructure is under `src/lib`. UI components are feature-local, while `src/components/ui` holds shared primitives.

Auth verification paths include `src/features/auth/server/{with-auth.ts,verify-tide-jwt.ts,verify-dpop.ts,identity.ts}`. Existing route paths include `/api/config`, `/api/circle`, `/api/governance`, `/api/admin-policy`, `/api/policies`, `/api/payouts`, `/api/escrow/redeem` and `/api/members`. This is the current source layout; do not reintroduce the planned `src/lib/auth`, generic vault route or flat Bun starter paths.

## Verification evidence

| Check | Observed result | Limit |
|---|---|---|
| Final post-cleanup `bun run typecheck` | Exit 0. | Does not prove live Tide auth. |
| Final post-cleanup `bun run lint` | Exit 0. | Does not prove live Tide auth. |
| Final post-cleanup `bun test` | Exit 0; 15 tests across 7 files, 43 expectations, 0 failures. | Synthetic fixtures do not establish human or live E2EE behavior. |
| Final post-cleanup `bun run build` | Exit 0; no outer-workspace warning. | Build does not prove protected runtime behavior. |
| Production `bun run start` | Next ready on loopback in 156 ms. | Only unauthenticated public surface exercised. |
| `GET /api/config` / unauthenticated `GET /api/circle` | 200 / 401 with `Cache-Control: no-store`. | Public config and expected denial only; no protected success. |
| `GET /tide_dpop/auth` | 200; 9,120 bytes; SHA-256 `9d7844b938f0a2565fa910d3d30e9b8797cbfd6e0b73d59d804169a089aea757`. | Relay asset integrity/CSP checked; not an authenticated sign-in. |
| Real sign-in navigation | Click reached `ork1.tideprotocol.com`, title “Tide”, with sign-in form visible. | No credentials entered. One Keycloak iframe request aborted and a URL wait timed out; later destination inspection confirmed the sign-in page. |
| Earlier isolated `tests/auth-crypto-boundary.test.ts` | Exit 0; 1 test / 2 expectations; targeted ESLint passed. | Ephemeral EdDSA issuer and ES256 DPoP keys, synthetic claims; not a Tide issuer or enrolled user. |

The isolated crypto test observed valid fixture requests as 200; replay, missing DPoP, Bearer scheme, wrong `htu`, wrong `azp` and expired token as 401; a realm-role/other-client role spoof as 403. Production smoke observed no `kcToken` cookie on the app origin; this unauthenticated check does not replace the separate SDK cookie-setter test. Full output and limits are in `reports/production-smoke-2026-10-22.md` and `reports/governance-verification-2026-10-22.md`.
## Current checklist

- [x] Old starter cut over; preserved at tag `starter-bun`.
- [x] Next/React/Bun implementation, Tailwind, shared UI primitives and feature-first routes present.
- [x] Server auth/DPoP/JWT boundaries and protected routes implemented.
- [x] Latest post-review typecheck, lint, full test batch (15 tests / 43 expectations) and build passed as recorded.
- [ ] Complete a real Tide sign-in with an enrolled human; blocked on 0/5 linked accounts.
- [ ] Observe an authenticated protected success (200) alongside intended 401/403 on the live app; not observed.
- [ ] Treat G2 as unachieved until live account proof exists.

## Security boundary

No master-admin credential is used in app runtime. The crypto test generates ephemeral keys and synthetic claims in a child process. No live token, doken, plaintext release, invite URL or private adapter material is represented by those tests. UI visibility does not replace server authorization.

## Scope note

The implementation is already feature-first; do not revert to the planned generic vault scaffold or create a second auth/store architecture. This phase records implementation and evidence; it does not assert the still-unobserved Tide identity flow.
