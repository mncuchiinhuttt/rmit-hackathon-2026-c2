# Hostless Hui — scoped fix re-review

## Current findings

**No remaining concrete issues found in the five requested fixes.** This re-review is limited to those fixes and their source consumers; it is not a new broad audit or a live-flow verification.

## Disposition of the original findings

| Original finding | Status | Source evidence |
|---|---|---|
| Optional JS-readable access-token cookie | Addressed | `package.json` and `bun.lock` register `patches/@tidecloak%2Fjs@0.14.33.patch`. The patch changes both ESM and CJS `_setTokenCookie` implementations to clear the cookie rather than write a token. `src/app/providers.tsx` expires legacy `kcToken` before constructing the SDK provider. Front-channel doken/E2EE and DPoP remain intact. |
| DPoP replay entry expired before accepted proof lifetime | Addressed | `src/features/auth/server/verify-dpop.ts` retains the JTI until `(iat + skew) * 1000`, covering the full accepted timestamp window. |
| Stale enrollment mapping after `tide:sync` | Addressed | `src/features/auth/server/demo-users.ts` no longer has a module cache; each mapping read reloads and validates the small mutable file. |
| Pending decrypt restoring plaintext during sign-out | Addressed | `src/features/circle/components/circle-page.tsx` sets `signingOut.current` and increments `operationEpoch.current` synchronously before clearing plaintext or awaiting logout. Open/redeem continuations and operation completion state check that epoch and sign-out state. `src/features/circle/components/circle-workspace.tsx` also hides the dialog during logout and exposes a busy operation state. |
| Missing focus restoration after programmatic dialog | Addressed | `CircleWorkspace` owns the decrypt-button ref and passes it through `SealedPackage` to the actual button and into `OpenedReleaseDialog`. The dialog's `onCloseAutoFocus` prevents the default null-trigger path, focuses the connected/enabled initiating control, or falls back to the workspace heading with `tabIndex={-1}`. |

## Verdict and readiness

**Scoped correctness verdict: correct. Confidence: 0.98.** No builds, tests, linters, formatters, runtime probes, or smoke checks were run by this reviewer, and no repository source was edited. Parent-reported smoke/regression results were not rerun.

The source findings are closed; this is **not** evidence of a complete live Tide flow. The latest supplied enrollment state remains **0/5 linked**. Live demonstration readiness still requires all five human enrollments, three distinct steward Tide identities, governed steward/admin-policy activation, a measured real quorum, and the same-policy/same-ciphertext ORK denial plus authorized beneficiary decrypt/redeem round trip. Money and escrow remain synthetic.
