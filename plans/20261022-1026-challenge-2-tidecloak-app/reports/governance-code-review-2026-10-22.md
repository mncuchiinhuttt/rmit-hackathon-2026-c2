# Hostless Hui — governance projection correction review

Requested repository report: `plans/20261022-1026-challenge-2-tidecloak-app/reports/governance-code-review-2026-10-22.md`.

## Findings

**Scoped pass: no concrete consumer-visible correctness or security regressions found in the governance projection correction and its affected consumers.**

Overall correctness: **correct**. Confidence: **0.96**.

## Scope and method

Read the full current context of `src/features/governance/server/change-request-view.ts`, `governance-service.ts`, governance `types.ts`, `components/proof-panel.tsx`, `components/change-request-card.tsx`, and `src/lib/server/request-body.ts`. Followed the projected snapshot through `/api/governance`, `use-circle.ts`, `circle-workspace.tsx`, and the proof/card consumers. Traced the shared body reader through all located public mutation callers and their route adapters, and traced the upstream credential through JWT/DPoP verification, `AuthContext`, and the Tide configuration loader.

The ordinary tracked `git diff` and path-specific history did not contain these application files. Read their no-index add-file diffs and current source; the supplied correction description and observed schema evidence define this review's scope. No unrelated whole-app re-audit was performed.

## Acceptance evidence from source inspection

| Area | Evidence and disposition |
| --- | --- |
| Role UUID-to-cycle mapping | `change-request-view.ts:10-31` builds a map from exact role names returned by the roles read to role IDs, using `CYCLE_NUMBERS`/`cycleMetadata`. Only matching `rows[].ROLE_ID` values produce payout record IDs; `entityId`, user IDs, and ad hoc serialized-string matching are not used. Missing seeded role coverage rejects the read rather than fabricating a count. |
| Multi-cycle requests and consuming dispatch | `recordIds` accumulates every matching cycle in a `Set`; `ChangeRequestView.recordIds` carries the array through the API and circle state. `proof-panel.tsx:48` selects with `recordIds.includes(recordId)`, and `proof-panel.tsx:123` forwards each selected request to `ChangeRequestCard`. A multi-cycle request is therefore not confined to its first matching row. |
| Pending/approved merge | `governance-service.ts:65-72` concatenates pending before approved. `change-request-view.ts:37-60` uses request ID as the map key and replaces an earlier snapshot with a later one, so an ID present in both lists is displayed once using its approved snapshot. The two upstream reads are not an atomic snapshot, and the UI does not claim they are; no missing record is converted into zero approvals. |
| Unknown versus observed zero | Relevant requests require nonnegative safe-integer `authorizationCount`, positive safe-integer `threshold`, boolean readiness, and the observed authorizer-object shape (`change-request-view.ts:42-48`). There is no default count or inferred threshold. The proof panel explicitly distinguishes unavailable/non-steward/empty responses from an actual zero count (`proof-panel.tsx:108-133`); the card renders real zero values when supplied. |
| Caller identity and authorization | `/api/governance` and `/api/admin-policy` require the `realm-management` / `tide-realm-admin` client role. `withAuth` verifies the request token and DPoP before constructing `AuthContext`; the service also checks steward status. All new Tide reads receive that same `auth.accessToken`, not bootstrap or master credentials. The configuration loader restricts the realm/client and validates the upstream URL. The service performs GET reads only. |
| Bounded upstream versus public request limits | Only `readTideJson` supplies the explicit 1 MiB cap (`governance-service.ts:35`). `MAX_BODY_BYTES` remains 64 KiB, `readJsonBody` still omits the override (`request-body.ts:3-5,59-60`), and policy storage, payout sealing, and escrow redemption all call `readJsonBody`. Both declared and streamed byte lengths remain checked. The public mutation cap is not increased. |
| API data handling and filtering | Upstream status errors, fetch failures, invalid media/JSON/UTF-8, over-limit streams, malformed role lists, and invalid relevant request fields fail without synthesizing data. Unrelated role records are omitted. The response is a deliberate field projection, not a raw upstream object; UI strings use React text rendering, and the API boundary supplies no-store/security headers. |
| History versus present entitlement | The section is explicitly “Tide approval history,” and its list describes pending/approved changes for the selected cycle role (`proof-panel.tsx:104,122`). `change-request-card.tsx:8,17-18` labels approved requests “Approved” before considering readiness. No governance consumer grants access or derives the beneficiary's current entitlement from an historical approved request. The role-propagation/ORK-enforcement explanation remains visible. |

## Security and verification boundary

This is a read-only source review, not authorized runtime verification. No source files were edited, no Tide calls or mutations were made, and no tests, builds, linters, formatters, or smoke checks were run by this reviewer. Previously reported verification results were not rerun or represented as verification of this correction.

The supplied actual `GRANT_ROLES` / `USER` response, `ROLE_ID` rows, authorizer objects, threshold 1, and approved bootstrap history are schema evidence only. They do **not** demonstrate human multiadmin identity, a real multiadmin quorum, policy enforcement, ORK encryption/decryption, or current user entitlement.

**Live acceptance remains gated at 0/5 human Tide enrollments.** Human enrollment, distinct steward identities, the effective live quorum, and same-policy/same-ciphertext ORK denial plus authorized decrypt/redeem evidence remain unproven by this review.
