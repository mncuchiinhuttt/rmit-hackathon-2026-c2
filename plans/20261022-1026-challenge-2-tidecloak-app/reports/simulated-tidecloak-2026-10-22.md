# Explicit TideCloak simulation verification

Date: 2026-10-22. Scope: user-requested temporary sign-in, role and access simulation, not live Tide acceptance.

## Executed checks

- `bun run typecheck`, `bun run lint`, `bun run build`: exit 0. Production build includes request-time mode selection.
- `bun test`: 22 passed, 0 failed, nine files, 93 expectations. Existing real JWT/DPoP, replay, policy and escrow assertions remain intact. Windows isolated tests ran outside the restrictive OS sandbox.
- Production server on loopback port 3000, explicit `HUI_AUTH_MODE=simulated`: main route 200, initial sample sign-in; no real Tide provider initialization.
- Browser: Minh denied on unapproved cycle; distinct Hanh/Tuan approvals recorded; Tuan and Operator denied even after approval; Minh opened. Production recheck used Hanh/Mai approvals, and Minh received selected-cycle `hui-c3-winner` projection and opened cycle 3.
- Production: Bao sealed cycle 4; Minh still denied there without that cycle's approvals. Minh opened pre-approved cycle 1 and redeemed; code disappeared, Escape closed the Radix dialog and restored focus to the open button. Sign-out removed the workspace and opened code. Reset restored the fixtures.
- Missing credentials: `/api/circle`, `/api/governance`, `/api/members` each returned 401 with `Cache-Control: no-store` in simulation. `/auth/redirect` returned 307 to `/`.
- Same build, separate temporary process with `HUI_AUTH_MODE=tide` on loopback port 3317: main page rendered the real setup path, then browser displayed `Secure setup needs attention` for missing private configuration, not sample accounts. Its `/demo` preview still worked. The temporary server was stopped; no Tide provisioning was attempted.
- Desktop 1280x900 and mobile 375x812: sign-in and signed-in workspace inspected. Document scroll widths were no greater than viewport widths; account controls and role labels fit. Production simulation tab recorded no console errors during the exercised paths. Temporary browser/server navigation failures during restart are not app-auth success claims.
- `git diff --check` passed. All changed authored code modules remain below 200 lines. GitHub visibility readback remained `PRIVATE`. No video, public exposure or form submission occurred.

## Scoped UI review

Review was performed inline, not by an independent subagent. This is a local extension of the incumbent app, not a new identity or whole-app design audit. Impeccable informed explicit simulation labels, account explanations, accessible selected states, responsive role wrapping and focused desktop/mobile verification. Its mechanical detector returned `[]` on the new sign-in/header and modified demo page.

- Persistence: existing CSS tokens, Geist fonts, Lucide icons and shadcn primitives retained. Missing PRODUCT.md/DESIGN.md predates this scoped extension; no global identity was invented or rewritten.
- Fidelity: account selection, sign-out, simulation notice and selected-cycle roles match the requested workflow. TYPE matches incumbent Geist; MATERIAL remains real UI components without invented imagery; GROUND remains the existing obsidian palette.
- Ceiling: unchanged product workspace retained; no unrelated visual redesign or motion work.
- Material fixes: account-switch instructions were corrected to describe sign-out/sign-in in the main simulation. No further material issues were observed within this scope.
- Keep: explicit simulation boundary and the existing real JWT/DPoP API enforcement. Existing workspace eyebrow styles were not promoted into new design rules or cleaned up out of scope.

Disposition: ship at the scoped simulation/UI-check level, not live Tide security acceptance. Local screenshots are under ignored `.cache/simulation-review/`: `sign-in-desktop.jpg`, `sign-in-mobile.jpg`, `workspace-desktop.jpg`, `workspace-mobile.jpg`.

## Still open

Live realm/vendor-key finalization, enrollment, actual steward quorum, signed RelationshipAttestation policies, ORK encryption/decryption and role propagation/revocation remain unverified. Local identities and package contents are fully inspectable/manipulable fixtures; simulated checks provide no cryptographic guarantee.
