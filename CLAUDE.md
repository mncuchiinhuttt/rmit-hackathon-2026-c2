# Hostless Hui

Read `AGENTS.md` first. It is the canonical engineering, feature architecture, UI and security policy.

## Actual application stack

- Next.js App Router + React 19, running under Bun. Use `bun run dev`, `bun run build`, `bun run start`.
- Tailwind v4 with shadcn/Radix primitives and locally bundled Geist fonts.
- Feature modules under `src/features/{auth,circle,releases,governance,escrow}`.
- Thin API routes under `src/app/api`; shared infrastructure only under `src/lib`.
- TideCloak runs in Apple `container` at localhost:8080. Do not reset/delete realms or containers.
- Never use master-admin credentials in application request handling.

## Evidence and verification

- `bun run typecheck`, `bun run lint`, `bun test`, `bun run build`.
- Exercise changed UI/API paths against the actual running app; no auth bypass for demo screenshots.
- Use the exact local adapter `data/tidecloak.json`; raw setup responses and enrollment links stay in ignored `.cache/`.
- Read `docs/setup-tidecloak.md` and the current plan before any bootstrap/IGA mutation.
- Enrollment and quorum approvals require humans using distinct Tide identities. Do not fake approvals or signatures.
- Synthetic money/escrow is intentional; crypto/auth enforcement must be real and claims must match observations.
