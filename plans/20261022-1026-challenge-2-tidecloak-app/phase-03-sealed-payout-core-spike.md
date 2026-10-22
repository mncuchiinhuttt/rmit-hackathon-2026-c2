# Phase 03: Sealed payout core and live proof

## Context links

- `.cache/raziel/scenarios/relationship-attestation--scenario.md` (private mirror)
- `research/researcher-03-raziel-capabilities-and-scenarios.md` §3–§4, §8
- `reports/red-team-review.md`
- Verification: `reports/governance-verification-2026-10-22.md`

## Overview

- Priority: P1 · Status: feature source paths and governance read model implemented; G3 unmet.
- No successful live policy signing, encryption or decryption flow has been exercised. Do not present planned proof steps as demo results.

## Intended security model

The proposed release sequence uses a record-specific `RelationshipAttestation` policy, a cycle-specific winner role, IGA approval and synthetic escrow redemption. Stewards should approve without reading; the winner should read only after governed access; the host should see ciphertext only. These behaviors remain unproven. Never use master-admin credentials in app runtime.

The actual IGA threshold, policy-signing requirements and master-admin behavior are unknown. A quorum, if verified, would authorize access to a package; it would not validate package contents or cause a real transfer. Do not claim “two of three” before a live request proves a first approval remains pending and a later distinct steward approval commits.

## Current implementation paths

- Client release helpers: `src/features/releases/client/{relationship.ts,release-actions.ts}`.
- Release validation and persistence: `src/features/releases/server/{policy-validation.ts,release-service.ts,persistence.ts,record-id.ts}`.
- Governance reads and projection: `src/features/governance/server/{governance-service.ts,change-request-view.ts}`.
- Synthetic escrow: `src/features/escrow/server/redeem-service.ts`; test: `redeem-service.test.ts`.
- Thin API routes: `src/app/api/{policies,payouts,governance,admin-policy,escrow/redeem}/route.ts`.
- No `/spike` page is present in the current source tree.

The final governance regression suite tests exact `ROLE_ID`-to-cycle projection, pending/approved snapshot merging, fail-closed malformed role/vote inputs, and a bounded 1 MiB upstream read while preserving the public 64 KiB body cap. These are parser and service-boundary tests, not Tide encryption or authorization proof.

## Observed governance smoke (limited)

Parent-reported live response inspection is recorded in `reports/governance-verification-2026-10-22.md`: the approved-history endpoint returned 269 records (244,463 bytes), parsed within the explicit 1 MiB limit. The inspected grant request's actual `ROLE_ID` row mapped to `payout-c4`; its status was `DENIED`, authorization count 0, threshold 1 in `firstAdmin`. No entitlement was applied. The proposed grant targeted unlinked Minh and was not a human steward quorum request. This is bootstrap schema/read-model evidence only—not human multi-admin quorum, an enrolled-user API request, ORK refusal or payout proof.

## Proof matrix

End-user proof remains unobserved because there are 0/5 linked accounts and no credentialed Tide flow.

| # | Intended actor/action | Required result | Observed status |
|---|---|---|---|
| 1 | Host/operator reads a release record | Ciphertext only | Not observed live. |
| 2 | Steward attempts decrypt using valid policy | ORK refusal | Not observed. |
| 3 | Winner attempts decrypt before release | ORK refusal | Not observed. |
| 4 | Bootstrap grant request for `hui-c4-winner` targeting unlinked Minh is inspected | Denied; no entitlement applied | Observed in `firstAdmin`; not human approval/quorum. |
| 5 | First distinct steward approves a live CR | Remains uncommitted | Not observed. |
| 6 | Second distinct steward approves | CR committed; actual threshold recorded | Not observed. |
| 7 | Winner refreshes token and decrypts after grant | Correct plaintext in client | Not observed. |
| 8 | Approving stewards attempt decrypt | ORK refusal | Not observed. |
| 9 | Winner redeems with matching synthetic code and identity | Mock redemption only | Service logic and synthetic tests exist; no live release flow. |
| 10 | Prior-cycle winner attempts next-cycle decrypt | ORK refusal | Not observed. |

## Current checklist

- [x] Feature source paths for release, policy validation, governance and synthetic escrow are present.
- [x] Governance projection and stream-limit regressions passed in the final batch (15 tests, 43 expectations across 7 files).
- [x] Approved-history payload parsing and the `payout-c4` denied/unapplied bootstrap grant inspection recorded with limits.
- [ ] G1.5 RelationshipAttestation probe and enclave signing; blocked on human enrollment/admin activation.
- [ ] Live signed policy, successful encryption/decryption, ORK refusal matrix and authorized redemption; no live success path observed.
- [ ] Distinct-steward quorum and role propagation; not measured.
- [ ] Alternate-policy and master-admin experiments; unobserved and not to be represented as findings.
- [ ] G3 continuous proof sequence and footage; not achieved.

## Acceptance boundary and security

Policy signing in multi-admin mode, exact role/subject behavior, two-role grants, role propagation and master-admin bypass behavior remain unknown. G3 requires a live proof matrix, an observed actual quorum and correct behavior on another cycle. The source implementation, a denied bootstrap request, and synthetic tests cannot close this gate.

Do not store plaintext or dokens server-side or in persistent browser storage. Escrow is synthetic; its code-generating partner may know the code. Any future narrative must state the authentic-client assumption, quorum collusion risk and propagation/revocation limits.
