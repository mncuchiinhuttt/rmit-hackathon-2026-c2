# Two-minute demo script

## Current simulated product rehearsal

This path is explicitly simulated. Use the main `/` workspace with SQLite and say so on screen. The delivered edited walkthrough is [video.mp4](video.mp4), with the exact narration in [voiceover-en.txt](voiceover-en.txt) and [Vietnamese translation](voiceover-vi.md). It follows the four required chapters at 0, 25, 50 and 100 seconds and ends at 120 seconds.

1. Show the group flow, the receiving schedule and “What you can do.” Minh's turn is separate from Bao's cycle 4.
2. On a fresh cycle 4, Bao seals the package. Sign in as Operator and attempt opening: denied.
3. Operator proposes reader access for itself. Show proposer, target, cycle and Pending · not applied. Opening is still denied.
4. Hanh approves once. Show 1/2 and another denied Operator attempt. Tuan approves independently; the request becomes Committed · applied.
5. Operator can now open the group-authorized sample package. It cannot vote or redeem Bao's turn. An approving steward still has no reader access by default.
6. Demonstrate the recipient's own request/approval flow and check that Minh's earlier access cannot open Bao's cycle. Use Manage access lifetime for governed renewal/revocation and explain that already copied codes cannot be recalled.
7. Open Evidence details: local checks and saved state are demonstrated; live Tide identity, ORK, actual quorum and alternate-policy proof remain pending.

Existing working fixtures may already contain approvals or redemption. Inspect them first; only use Operator's confirmed shared reset when a new fixture run is intended.

## Target live recording

This script describes the target recording, not completed verification. Record only operations that
actually work. Do not create simulated approvals, credentials, ORK refusals or fake successful decryptions.
Use the current observed threshold; say "two of three" only after one distinct approval stays pending
and the second distinct approval commits.

| Time | Actual screen | Narration |
|---|---|---|
| 0:00–0:15 | Circle workspace | "A hui is a rotating savings circle. Today members trust one host with too much authority. We are exploring a circle where release access rotates instead of accumulating." |
| 0:15–0:30 | Cycle recipient and synthetic label | "Each cycle has a sealed release package. A synthetic escrow represents the payment rail. Tide protects access to the package, not custody of real money." |
| 0:30–0:50 | Real ciphertext/proof panel | "Our application stores ciphertext. The escrow account sealed this record. No application database password is an encryption key." |
| 0:50–1:05 | Real unauthorized open attempt | "This steward may approve access, but cannot read the package. This is the network's actual decision, not a hidden button or a frontend role switch." |
| 1:05–1:25 | Tide Console with real approvals | "The first approval is insufficient. A second independent steward approves in the Tide enclave. The governed role change commits." |
| 1:25–1:45 | Beneficiary refresh, open, mock redeem | "After the new entitlement reaches the beneficiary's session, Minh can decrypt and redeem the synthetic package. He can read, but cannot approve his own entitlement." |
| 1:45–2:00 | Scope/limits and next cycle | "Authority is scoped to each cycle. Money and escrow are mocked; authentication and cryptographic decisions must be real. We assume authentic browser code and an honest required quorum." |

## Recording rules

- Never show `.env`, licence email, invite URLs, bearer tokens, admin credentials or personal tabs.
- Record the first successful live run immediately and preserve it as fallback footage.
- Track which seeded cycle has been used; granting a role consumes its original pre-release state.
- If cutting a propagation wait, label the cut with the actual elapsed time.
- Save a playable H.264/AAC `.mp4` in the repository under 100 MB; aim for approximately 120 seconds.
- If enrollment or ORK policy setup remains blocked, do not publish this as a successful full-flow demo.
