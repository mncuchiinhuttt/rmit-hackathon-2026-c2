# Project changelog

## 2026-10-22

### Infrastructure

- Created development realm `hui-rmit26` and public client `hui-rmit26-client` on the existing TideCloak server.
- Activated the free-tier Tide licence after explicit user consent; verified the licence and vendor-key expiry through live API responses.
- Preserved the existing `myrealm`; no container recreation or paid checkout.
- Resolved container DNS failure using the Wi-Fi-provided resolver; safely recovered only empty resources left by the failed setup.
- Added Bun provisioning/verification commands, the reviewed realm template and an empty `.env.example`.
- Kept private credentials, emails, raw licence/key responses and recovery backups ignored.

### Project rules

- Added `AGENTS.md`: Bun-only workflow, architecture, security, honest Tide claims and verification requirements.
- Required shadcn/ui components for future UI implementation; no generic AI-template visuals or emojis.
- Defined restrained gradients/glass, typography, contrast, accessibility and interaction rules.
- Linked existing agent guidance and implementation phases to the new rules.

### Status

- Realm/licence setup is verified. The app is still the Bun + React starter.
- User enrollment, IGA quorum, E2EE application integration and shadcn/ui installation remain pending.
