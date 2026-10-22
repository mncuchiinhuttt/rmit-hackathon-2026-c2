# Phase 04: Product UI

## Context links

- `../../AGENTS.md` (shadcn/ui, keyboard focus, accessibility and visual constraints)
- Production browser evidence: `reports/production-smoke-2026-10-22.md`
- Current product paths: `src/features/*/components/`, `src/app/`, `src/components/ui/`

## Overview

- Priority: P1 · Status: feature UI implemented; the production unauthenticated workspace is responsively verified. Protected product states remain unverified.
- Current design uses Tailwind 4, Geist and Lucide with local shadcn/Radix primitives. Do not describe a planned scaffold as current.

## Product intent

Lead with the circle, cycle, recipient and sealed release; show proof as supporting context rather than a generic access-control dashboard. The intended product states include sealed, refused, pending, propagating, committed, opened and synthetic redemption. Their presence in code or design does not prove a live Tide state.

## Actual paths and production evidence

| Surface | Current path/evidence | Status |
|---|---|---|
| Main app and theme | `src/app/page.tsx`, `src/app/globals.css`, `src/app/layout.tsx` | Implemented and opened in production browser. |
| Circle | `src/features/circle/components/` | Implemented; protected data state not verified with an enrolled account. |
| Release and open dialog | `src/features/releases/components/` | Implemented; live ORK refusal/decryption not exercised. |
| Governance proof | `src/features/governance/components/` | Implemented; live human CR/quorum state not verified. |
| Synthetic redemption | `src/features/escrow/components/` | Implemented; no live release-to-redeem demonstration. |
| Shared primitives | `src/components/ui/` | Local shadcn/Radix components present. |
| Desktop browser | 1280×900; document width 1280, no horizontal overflow. First Tab focused “Sign in with Tide” with visible focus ring. | Production unauthenticated workspace inspected. |
| Mobile browser | 375×812 with reduced motion; document width 375, no horizontal overflow. | Production unauthenticated workspace inspected. |
| Screenshots | `demo/screenshots/login-desktop.png`, `login-mobile.png` | Refreshed and visually inspected; show only the unauthenticated workspace. No protected state. |
| Earlier UI probe | 375px no issues; 1280px only intentional keyboard-focus-ring flag. | Preserve required focus indicator; production browser separately confirmed visible keyboard focus. |

## Current checklist

- [x] Feature-first product UI and shared primitives are present.
- [x] Production desktop/mobile surface inspected; no horizontal overflow in observed viewports.
- [x] Keyboard focus ring visible on the sign-in control; mobile check included reduced motion.
- [x] Unauthenticated desktop/mobile screenshots refreshed and visually inspected.
- [ ] Authenticated/protected screenshots; awaiting an actual app sign-in with a linked human (`hanh` linked; total 1/5).
- [ ] Live ORK refusal, proposal/approval, unseal and redemption states captured; not exercised.
- [ ] Accessibility/contrast acceptance beyond the recorded browser observations independently verified; not evidenced.

## Acceptance boundary

The observed production browser state is unauthenticated; there is no verified protected-state session or screenshot. Do not use seeded UI appearance, code presence or responsive screenshots as proof of authorization, ORK enforcement, quorum or E2EE. Real sign-in navigation reached the ORK sign-in form, but no credentials were entered.

## Security and accessibility

Visible/hidden controls are UX only; APIs enforce access. Keep visible keyboard focus, semantic labels and accessible dialog behavior. Never claim that showing a product state means it was authorized by Tide.
