# Demo and submission checklist

## Human prerequisites

- [ ] Current Windows adapter exported to `data/tidecloak.json`; currently absent.
- [ ] Five prepared accounts linked to Tide identities using the private local invitation page.
- [ ] The three steward accounts hold three distinct Tide identities.
- [ ] First admin activated only after linking; remaining steward grants and related admin policy approved in the enclave.
- [ ] Effective quorum measured: first distinct approval pending, second commits (or record the actual threshold).
- [ ] RelationshipAttestation policy signing/encryption/decryption exercised on this ORK network.
- [ ] Alternate-policy and master-admin experiments documented; claims narrowed to what was observed.
- [ ] An expired read policy is re-signed under the observed admin policy/quorum and opens unchanged ciphertext; role revocation tested with retained policy/ciphertext before and after credential refresh.

## Actual product proof

- [ ] Escrow signs in and seals a fresh record; no plaintext uploaded to the application server.
- [ ] The same signed read policy/ciphertext reaches authorized and unauthorized test sessions.
- [ ] ORK denial distinguished from missing policy, expired session, API refusal and transport failure.
- [ ] Beneficiary refreshes its session, decrypts and redeems once; wrong user/code/reuse fail.
- [ ] Steward remains unable to read after approving; prior-cycle entitlement does not imply next-cycle access.
- [ ] One complete successful run recorded before further polishing.

## Release hygiene

- [x] Latest Windows typecheck, lint, meaningful tests and production build pass (41 tests / 202 expectations across 14 files).
- [x] Unauthenticated production page checked at 1280px and 375px; keyboard/focus/reduced motion inspected.
- [x] README project overview answers five official prompts in at most 300 words.
- [ ] Demo MP4 under 100 MB: see `demo/hyperframes/REVIEW.md` for export verification and playback limits.
- [x] Staged files and full reachable Git history received the bounded private-data pattern/path review; see the repository-hygiene report.
- [ ] Repository made public only at the user-authorized time and after the secret review. Deferred by the user; current PRIVATE visibility verified.
- [ ] Group name and team emails copied from private local configuration, not published in code/docs.
- [ ] Google Form submitted with the public repository URL; confirmation saved privately.

## Offline preview (not live Tide acceptance)

- [x] Explicitly labelled /demo works without a Tide adapter or account.
- [x] Browser checks cover demo denial, two distinct approvals, recipient open/redeem, escrow sealing and reset.
- [x] Demo state remains local; protected live APIs still reject unauthenticated requests.

## SQLite product and governance demonstration

- [x] Five-step group flow, current recipient, role-specific action guidance and a compact member/receiving schedule are visible.
- [x] Minh receives cycles 1/3; Bao receives cycle 4. Tests deny cross-cycle inherited access.
- [x] Operator open denied before a proposal and after one vote; two distinct steward votes commit the requested grant. Browser observed the committed reader open while redemption stayed limited to Bao.
- [x] Request display includes proposer, scope, votes and pending/committed state. Old-version proposals become superseded; a proposer cannot vote on their own request.
- [x] Expiry, governed renewal, revocation, SQL persistence and same-scope sealed read-policy replacement have meaningful tests. Copied/viewed codes are explicitly outside revocation guarantees.
- [x] Schema v2 migration preserves sessions and historic redemption; a sealed legacy turn keeps its old recipient. Private backup was taken before runtime migration.
- [ ] Live Tide evidence rows above remain open; selectable SQLite identities do not satisfy them. See `docs/policy-lifecycle-and-evidence.md`.
