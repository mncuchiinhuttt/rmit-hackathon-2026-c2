# Project rules

## Scope and source of truth

- Project: RMIT Hackathon 2026, Challenge 2 / Tide UNLOCKED.
- Official brief: https://tide.org/unlocked/; local reference: `docs/challenge-2-brief.md`.
- Implementation plan: `plans/20261022-1026-challenge-2-tidecloak-app/plan.md`.
- Product direction: Hostless Hui, a savings-circle prototype with governed disclosure of encrypted release packages.
- Build only the requested slice. Do not execute every plan phase when asked for one task.
- Current code uses Next.js App Router + React 19 under Bun, Tailwind v4 and shadcn/Radix. Distinguish installed code from unverified live Tide capabilities.
- Correctness first, then maintainability. Apply YAGNI, KISS and DRY.
- Treat unexpected changes as the user's work; preserve them.

## Runtime and dependencies

- Bun is REQUIRED as runtime and package manager. Commit `bun.lock`.
- Use `bun install`, `bun run <script>` and `bun test`; no npm, yarn or pnpm lockfiles.
- When a framework CLI would launch Node, use `bun run --bun <script>` or `bunx --bun <tool>`.
- Do not silently fall back to Node when Bun compatibility fails; report the actual failure.
- Application commands: `bun run dev`, `bun run build`, `bun run start`; acceptance checks: `bun run typecheck`, `bun run lint`, `bun test`.
- The user approved the Next.js Tide-scaffold cutover in the full cook plan. Do not introduce another framework or auth migration without a new requirement.
- Inspect `package.json`, existing configuration and the lockfile before adding dependencies.
- Review dependency provenance, compatibility and installation scripts before allowing them to run.
- Install only packages required by the current slice. Prefer built-in Web/Bun APIs.
- Do not run generated bootstrap or installation scripts without reading their side effects.

## Structure and code quality

- Use kebab-case for new project files, except framework-required names and `AGENTS.md`.
- Keep authored code modules under 200 lines; split by responsibility, not arbitrary line ranges.
- Use TypeScript and explicit domain types. Avoid `any` and unchecked external JSON casts.
- Separate UI, domain logic, Tide integration, persistence and API authorization.
- Organize by feature under `src/features/auth`, `circle`, `releases`, `governance` and `escrow`.
- Keep each feature's types, UI, client hooks and server services together; route files are thin adapters.
- Cross-feature imports use explicit feature contracts, not another feature's private persistence internals.
- `src/components/ui` contains shared shadcn primitives only; `src/lib` is genuinely shared infrastructure.
- Do not add generic factories, repositories or dependency-injection containers merely to claim scalability.
- Reuse established project patterns. Do not create a second design system or auth stack.
- Do not introduce generic repositories, event buses, queues or microservices for this prototype.
- Keep changes focused. No unrelated cleanup or dependency upgrades.
- Remove superseded code and callers during a cutover; no dead aliases or compatibility shims.
- Do not submit stubs, fake success responses, unfinished handlers or silent mock fallbacks.
- Explicit exception authorized by the user: `HUI_AUTH_MODE=simulated` may simulate sign-in, roles and access checks in the main app. Keep it visibly labelled and isolated from real APIs; no fake tokens or claims of real Tide/ORK enforcement. Missing mode defaults to `tide`; invalid mode fails. See `docs/tidecloak-integration-plan.md`.
- User-requested SQLite persistence for simulation lives at `data/simulation.sqlite` (optional `HUI_SIMULATION_DB_PATH`). Keep DB/WAL/SHM files ignored. Use separate localhost-only simulation APIs, opaque HttpOnly sample sessions and server-authoritative transactions; never accept actor overrides on actions or use these cookies on real Tide APIs. Only Operator may explicitly confirm shared fixture reset. `/demo` remains throwaway/in-memory.
- Comments explain invariants or non-obvious decisions, not what the next line says.

## Required UI components: shadcn/ui

- Use shadcn/ui for standard interactive UI. Do not hand-build equivalents beside it.
- Before UI work, inspect `components.json`, existing components, Tailwind and the `cn()` helper.
- If shadcn/ui is absent, configure it for the actual framework in the UI task; do not pretend it exists.
- Use reviewed official shadcn registry components and the primitives shipped with them.
- Add only the components needed by the current screen; do not import the entire registry.
- Typical components: Button, Input, Label, Card, Dialog, AlertDialog, Sheet, Tabs, Table, Select,
  DropdownMenu, Badge, Alert, Skeleton, Tooltip, Separator and Progress.
- Compose product-specific pieces from these primitives, e.g. SealedCard and ProofPanel.
- Use Dialog/AlertDialog for dialogs; do not build a modal with click handlers on a `div`.
- Keep component variants, focus handling, keyboard behavior and ARIA semantics intact.
- Centralize colors/radii in CSS variables and Tailwind tokens; customize components consistently.
- Avoid scattered one-off overrides, duplicate Button implementations and broad CSS selectors.

## Visual direction: deliberate, not generic AI-template UI

- NO emoji in code, UI text, markup, logs, documentation headings or visual indicators.
- Use Lucide SVG icons or custom vector SVGs. No Unicode pictograms as icon substitutes.
- No Sparkles/robot decorations, fake AI badges, decorative chatbots or AI marketing filler.
- No generic AI-template composition: repeated feature bento grids, oversized hero copy,
  purple-blue aurora backgrounds, floating orbs, gradient text and identical glossy cards.
- Do not invent AI features. Do not disguise mocked decisions as model or network output.
- This style rule does not authorize false authorship claims or concealment of required AI disclosures.
- Lead with the user's task: cycle, recipient, sealed package, approval and disclosure.
- One main action per view. Supporting controls must be visually quieter.
- Do not add marketing sections, statistics, testimonials or decorative widgets without a product need.
- Use real domain labels. No lorem ipsum, "revolutionary", "seamless" or generic generated copy.
- Default UI copy is English for judges; Vietnamese is an explicit additional scope, not automatic.

## Color, gradients and surfaces

- Default direction: deep obsidian dark UI with restrained atmospheric light and limited glass.
- No pure-black page canvas. Suggested surfaces: `#090a0f`, `#0d0f17`, `#141827`.
- Suggested text hierarchy: `#eef1f8`, `#aab3c8`, `#8b94ab`; verify on the actual surface.
- Use one primary action treatment. Suggested primary: off-white fill with dark text.
- Reserve emerald for approved/unsealed, amber for pending/sealed and rose for denied/error.
- Status always includes a label or icon; color alone must not carry meaning.
- Gradients are OPTIONAL and controlled, not a default decoration on every element.
- At most two static radial glows behind the shell; keep opacity around 8-12% and out of reading areas.
- Do not use gradient-filled tables, form fields, every card or every button.
- No animated mesh, full-page aurora, rainbow accents or gradient body text.
- Use glass only where background content makes it meaningful: header or one to three hero panels.
- Never apply backdrop blur to every row in a scrolling list; provide an opaque fallback.
- Hairline card borders may be subtle. Input boundaries and focus indicators must remain recognizable.
- Test contrast after compositing glass and gradients, not only against a nominal solid color.

## Typography, layout and motion

- Prefer one sans family plus one monospace family for ciphertext and technical values.
- Geist Sans/Mono are the planned direction; reuse installed fonts before adding packages.
- Use clear weight/size hierarchy, readable body text and tabular numerals for amounts/counts.
- Keep spacing on a consistent 4px scale and use a small, shared radius scale.
- Avoid excessive pill shapes, huge corner radii and equal-weight cards for unrelated content.
- Main layout: a product view beside a compact proof panel; stack them on narrow screens.
- Check desktop at 1280px and mobile at 375px. No horizontal page overflow.
- Use semantic tables for tabular data; allow localized table scrolling when necessary.
- Motion explains a state transition; it must not run merely to attract attention.
- Prefer short opacity/transform transitions with `cubic-bezier(0.16, 1, 0.3, 1)`.
- No continuous button pulses, unnecessary parallax, particle effects or animated security theater.
- Respect `prefers-reduced-motion`; functionality must not depend on animation.

## Accessibility and state handling

- Keep native semantics, visible labels, correct heading order and a visible keyboard focus ring.
- Icon-only controls need accessible names. Decorative SVGs use `aria-hidden`.
- Dialogs trap focus correctly, close with Escape when appropriate and restore focus to the trigger.
- Announce async results through a suitable live region without repeatedly interrupting readers.
- Meet WCAG AA text contrast: 4.5:1 body text, 3:1 large text; test control/focus contrast too.
- Support loading, empty, error, denied, pending, propagating, committed and unsealed states.
- Explain the possible 120-second Tide role propagation delay; never invent instant approval.
- Disable duplicate submissions while pending. Surface recoverable errors without swallowing failures.
- Design the ORK refusal as meaningful feedback, not an unexplained generic toast.

## TideCloak and cryptographic boundaries

- Consult current Tide documentation/Raziel guidance before writing Tide-specific code.
- Never invent API names, policy formats, roles, signing behavior or encryption fallbacks.
- App realm: `hui-rmit26`; client: `hui-rmit26-client`; development origin: `http://localhost:3000`.
- Preserve `master`, `myrealm` and existing container state. Never wipe H2 or delete a realm to retry.
- Local TideCloak runs under Apple `container` as `mytidecloak`, bound to `127.0.0.1:8080`.
- Realm creation/licensing does NOT prove user enrollment, IGA quorum or working E2EE.
- Licence email and explicit Terms acceptance must come from the user; no paid checkout without approval.
- Master-admin credentials are bootstrap-only. Never embed them in the app or approval proxy.
- IGA `2xx` can mean accepted, not applied. Read back committed state and actual token claims.
- State the observed quorum, not a formula assumed from administrator count.
- RelationshipAttestation grants are admin-signed, not ordinary data-owner sharing.
- Exactly one record-id tag per RelationshipAttestation item. Do not confuse self-encryption with sharing.
- Plaintext and dokens must not be stored server-side or in browser persistent storage.
- Verify protected APIs server-side: signature, issuer, client, expiry, role and DPoP where enabled.
- Preserve the reviewed DPoP relay asset and verify its hash/routes; do not rewrite it casually.
- UI visibility is not authorization. Prove denials reach the intended enforcement layer.
- Never call a mocked escrow transfer a real payment or claim encrypted data solves financial custody.
- Document authentic-client assumptions, colluding quorum risk and revocation/propagation limits.

## Secrets, repository safety and delivery

- Keep `.env`, licence details, invite links, admin credentials and `data/tidecloak.json` local/ignored.
- Never put team emails, tokens or private setup responses in public plans, screenshots or video.
- Use `.env.example` for variable names only; no real credentials or affirmative consent defaults.
- Bind development servers to loopback. Do not expose default dev credentials on event Wi-Fi.
- Validate external input and size limits; render text through React escaping, not raw HTML injection.
- Do not log passwords, bearer tokens, dokens, invite URLs or plaintext release packages.
- Before publication, review tracked files AND Git history; `.gitignore` does not remove earlier leaks.
- Do not change repository visibility before the user's authorized time and the secret review.
- Commit focused conventional messages, with no AI attribution. Never force-push shared main.
- After changes, run the changed path and observe it; compilation alone is not behavioral proof.
- Add permanent tests only for plausible consumer-visible behavior; no mock echoes or source-text tests.
- For UI work, open the actual page and inspect desktop/mobile states, keyboard behavior and screenshots.
- Review code before commit. Update relevant setup docs, changelog and plan checkboxes from evidence.
- Preserve human-only gates: enrollment, Terms acceptance and external form submission permission.
- Claim only what was executed and observed. Separate planned, configured, verified and blocked states.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
