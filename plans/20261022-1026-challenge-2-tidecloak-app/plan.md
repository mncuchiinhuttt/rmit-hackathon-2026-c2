---
title: "Challenge 2 (Tide UNLOCKED): Hostless Hụi"
description: "Savings-circle prototype: governed disclosure of encrypted release packages; implementation, live evidence and human acceptance are tracked separately."
status: in-progress
priority: P1
branch: main
tags: [feature, frontend, backend, auth, security, experimental]
created: 2026-10-22
---

# Hostless Hụi: a savings circle where no host, platform or single steward can open the payout

## Purpose and evidence rule

The challenge asks for a working TideCloak-backed prototype, public repository, video, README answers and form submission. Original event-time gates have elapsed and are historical, not active acceptance criteria. This sync-back records evidence only; no phase or submission is marked complete solely because code exists.

The product concept remains: each circle cycle has a separate encrypted release package. Stewards may approve governed access, the winner may read after access is granted, and the host/operator should not be able to decrypt. Money, contributions and escrow are synthetic. No live policy signing, encryption or decryption flow has been exercised; these remain intended properties, not demonstrated results.

## Current status by phase

| Phase | Observed state | Acceptance still open |
|---|---|---|
| [0 · Idea and human gates](phase-00-idea-story-and-gates.md) | Four-person team and group name confirmed; private consent/licence details remain private. README overview finalized at 249 words. | Human-to-account links, primary/backup form submitter and form submission. |
| [1 · Tide realm](phase-01-tidecloak-realm-and-enrolment.md) | Realm/client/licence and baseline IGA verified; five aliases prepared; `hanh` linked (1/5). Invitation handoff now explicitly targets the app and preserves linked identities. | Four enrollments, first-admin activation, distinct steward keys, remaining grants and measured quorum are unproven. |
| [2 · App foundation](phase-02-app-foundation-on-bun.md) | Feature-first app implemented. Latest typecheck, lint, 15-test suite and production build passed; production routes, relay asset and unauthenticated browser surface were inspected. | No credentialed Tide sign-in or authenticated protected success; sign-in navigation reached the ORK form without credentials. |
| [3 · Sealed payout core](phase-03-sealed-payout-core-spike.md) | Release, policy, governance and escrow paths exist. Governance-history mapping and a denied, unapplied FirstAdmin grant request were observed. | G3 unmet: no live signed policy, ORK encryption/decryption/refusal, human quorum or redeem flow. |
| [4 · Product UI](phase-04-product-ui-and-approvals.md) | Production login workspace inspected at 1280px and 375px; no horizontal overflow; refreshed unauthenticated login screenshots. | Protected states and authenticated screenshots remain unverified. |
| [5 · Hardening and docs](phase-05-hardening-docs-rehearsal.md) | Credential-free batch passed; docs reconciled; scoped reviews passed; bounded secret/history review completed; implementation and fixture fix pushed privately. | Repository remains private. Full dev audit has one unpatched finding; live Tide acceptance remains human-gated. |
| [6 · Video and submission](phase-06-video-and-submission.md) | Demo script/checklist exist; README overview is 249 words. | No final video, public repository or form confirmation. |

## Stack and implementation

Actual stack: Bun 1.4, Next 16.4.2, React 19.3.1, Tailwind 4.3.3, local shadcn/Radix primitives, Geist and Lucide. The old Bun starter was cut over and retained at tag `starter-bun`. Product code is feature-first under `src/features/{auth,circle,releases,governance,escrow}` with thin `src/app` routes; old flat-starter paths and the planned generic vault route are not current architecture.

The app has no master-admin runtime credential. Repository/config setup, human enrollment, IGA quorum and actual E2EE are separate facts. Escrow and money remain mock. Known limitations include the authentic-client assumption, steward collusion risk, and that quorum would authorize access to a package rather than validate transaction contents or move funds.

## Verification snapshot

The final credential-free source export passed `bun run typecheck`, `bun run lint`, `bun test` (15 tests across 7 files, 39 expectations) and `bun run build`, all exit 0. An initial clean run exposed two policy-fixture failures; matching-vendor isolated adapters repaired the tests without relaxing production validation. Production audit reported 0 vulnerabilities across 92 packages; full audit retains the unpatched `braces@3.0.3` finding. See [clean-checkout proof](reports/clean-checkout-2026-10-22.md) and [production smoke](reports/production-smoke-2026-10-22.md).

Production smoke: `bun run start` was ready in 156 ms; `/api/config` returned 200, unauthenticated `/api/circle` returned 401 with `no-store`, and `/tide_dpop/auth` returned 200 with the expected 9,120-byte asset/hash. Real sign-in navigation reached the ORK sign-in screen, but no credentials were entered. One Keycloak iframe request aborted and a URL wait timed out; neither is concealed as a clean-console claim. These observations do not prove authenticated access or E2EE.

## Unresolved acceptance and human dependencies

- Four invitees remain unlinked; latest sync is 1/5 (`hanh` linked). Fresh app-bound invitation entry reached the ORK; its final human callback is not yet exercised.
- First-admin activation, distinct steward keys, remaining admin grants and an actual quorum are not verified.
- Live policy signing, same-policy/same-ciphertext ORK denial and authorized decryption/redemption, role propagation, and alternate-policy/master experiments remain untested.
- Protected-state screenshots, end-to-end video, authorized public visibility and form confirmation are absent.
- Bounded secret/history review, private implementation push and credential-free build are recorded in the [repository-hygiene](reports/repository-hygiene-2026-10-22.md) and [clean-checkout](reports/clean-checkout-2026-10-22.md) reports. Keep private data out of later media and submission artifacts.

## Phase references

- [Phase 00](phase-00-idea-story-and-gates.md) · [Phase 01](phase-01-tidecloak-realm-and-enrolment.md) · [Phase 02](phase-02-app-foundation-on-bun.md)
- [Phase 03](phase-03-sealed-payout-core-spike.md) · [Phase 04](phase-04-product-ui-and-approvals.md) · [Phase 05](phase-05-hardening-docs-rehearsal.md) · [Phase 06](phase-06-video-and-submission.md)
