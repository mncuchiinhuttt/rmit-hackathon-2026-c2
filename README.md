# RMIT Hackathon 2026 - Challenge 2

RMIT Hackathon Challenge 2 project using the [Bun](https://bun.sh) runtime and React 19, with a separately provisioned [TideCloak](https://docs.tide.org/get-started/) development realm.

Status: the Bun + React starter runs; realm `hui-rmit26`, its app client and free-tier Tide licence are provisioned and verified. The application integration, user enrollment, IGA quorum and product UI are not implemented yet. See [setup evidence](docs/setup-tidecloak.md), [project rules](AGENTS.md) and the [challenge brief](docs/challenge-2-brief.md). shadcn/ui is required for future UI work but is not installed yet.

## Run

```sh
bun install
bun run dev      # http://localhost:3000, hot reload
bun run build    # static bundle in dist/
bun run start    # production server
```

## TideCloak setup

Use [docs/setup-tidecloak.md](docs/setup-tidecloak.md). Provisioning and verification run under Bun:

```sh
bun run tide:provision
bun run tide:verify
```

Both commands require the ignored local `.env`; `.env.example` contains empty credential and consent fields. Do not commit local licence responses, credentials or adapter exports.
