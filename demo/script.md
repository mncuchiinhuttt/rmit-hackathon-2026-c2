# Two-minute demo script

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
