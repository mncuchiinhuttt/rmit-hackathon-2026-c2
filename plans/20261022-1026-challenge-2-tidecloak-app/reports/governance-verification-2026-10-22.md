# Governance Verification — 2026-10-22

## Parser and reader contracts

`parseChangeRequests(requests, roles)` builds a mapping from each named release role ID to its payout-cycle record ID, then projects only recognized `rows[].ROLE_ID` values. It does not derive records from `entityId` or a direct `recordId`; duplicate cycle rows collapse to one record ID. Requests without a recognized role row are omitted. For requests that do project, malformed vote counters, authorizers, or an incomplete/malformed role catalog fail closed with `ApiError(502, "tide_read_failed", ...)`. A repeated change-request ID is last-snapshot-wins.

`readJsonStream(body, headers, maxBytes)` enforces its supplied limit while streaming. Omitting `maxBytes` preserves the public 64 KiB default. Governance reads explicitly supply a 1 MiB limit.

## Regression coverage

Added `tests/governance-projection.test.ts` with synthetic role/user/request IDs and real-shaped `GRANT_ROLES` user-targeted rows. The cases verify:

- Projection from role IDs to the correct payout cycle while preserving actual authorization count, threshold, readiness, and authorizer usernames.
- Multiple role rows map to multiple cycles, duplicate cycle rows collapse, and unrelated roles do not project.
- Misleading `entityId` and direct `recordId` values do not cause an unrelated role request to project.
- An approved snapshot supplied after a pending snapshot replaces that request's status, vote state, authorizers, and cycle records.
- Malformed relevant authorization counters and thresholds, an incomplete cycle-role catalog, and a malformed role-catalog entry fail closed.

Extended `tests/request-body.test.ts` without changing its existing public 64 KiB exact-boundary or rejection cases. The new case accepts a valid synthetic 900-record grant-response JSON body larger than 240 KiB and smaller than 1 MiB with the explicit limit, then rejects a valid JSON stream over 1 MiB with `413 payload_too_large`. No live credentials or Tide payloads are used in fixtures.

## Final verification

Ran the requested single final batch: `bun run typecheck && bun run lint && bun test && bun run build`.

| Command | Exit | Result |
|---|---:|---|
| `bun run typecheck` | 0 | Passed. |
| `bun run lint` | 0 | Passed. |
| `bun test` | 0 | 15 tests across 7 files; 43 expectations; 0 failures (134 ms). |
| `bun run build` | 0 | Passed optimized Next.js webpack build, TypeScript, static page generation, and build tracing. Next.js warned that it ignored `/Users/vominhlong/pnpm-workspace.yaml` because it is outside the repository; build completed successfully. |

## Runtime evidence and limits

Parent-reported runtime smoke used real Tide responses: the approved-history endpoint returned 269 records (244,463 bytes), which parsed under the explicit 1 MiB limit; the inspection change request's actual role row mapped to `payout-c4` and showed `DENIED`, authorization count 0, threshold 1 (`firstAdmin`). No entitlement was applied. The observed pending-plus-approved snapshot had zero cycle-role changes. This is bootstrap schema/read-model evidence only—not human multi-admin quorum, authorized app API/end-user, ORK-encryption, or live payout proof. The regression tests are synthetic and do not establish those runtime properties.
