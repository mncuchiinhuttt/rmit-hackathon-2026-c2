# Production smoke — 2026-10-22

## Final source/dependency batch

After removing the throwaway Playwright dependency and pinning Next output tracing to this project root, `bun run typecheck && bun run lint && bun test && bun run build` exited 0. Tests: 15 pass, 0 fail, 43 expectations across 7 files. The final build emitted no outer-workspace warning. Production dependency audit: no vulnerabilities across 92 packages. The full development dependency audit still has the unpatched `braces@3.0.3` advisory; it is not clean.

## Actual production surface

Started `bun run start` on loopback port 3000; Next reported ready in 156 ms. Opened the real page with a managed Chromium browser, without mocked authentication or data.

- Desktop viewport 1280 × 900: document width 1280; no horizontal overflow. First Tab focuses **Sign in with Tide** with a visible focus ring.
- Mobile viewport 375 × 812 with reduced motion: document width 375; no horizontal overflow. Both full-page screenshots were captured and visually inspected.
- Public-safe screenshots refreshed at `demo/screenshots/login-desktop.png` and `demo/screenshots/login-mobile.png`; they show only the unauthenticated workspace.
- `GET /api/config`: 200. Unauthenticated `GET /api/circle`: 401 with `Cache-Control: no-store`.
- Rewritten `GET /tide_dpop/auth`: 200, 9120 bytes, SHA-256 `9d7844b938f0a2565fa910d3d30e9b8797cbfd6e0b73d59d804169a089aea757`. CSP was `default-src 'self'; script-src 'unsafe-inline'; frame-ancestors https:`. No `X-Frame-Options` header blocks the HTTPS enclave relay.
- No `kcToken` cookie was present on the application origin. This unauthenticated observation does not replace the separate exercised SDK cookie-setter check.
- Clicking the real sign-in button navigated to `ork1.tideprotocol.com`, title **Tide**, with visible **Sign in**, **Forgot password?** and **Verification pop-up follows** copy. No credentials were entered. Private URL query values were not recorded.

## Observations and limits

The browser recorded an aborted Keycloak login-status iframe initialization request during initial setup. The product still reached its unauthenticated workspace and real Tide sign-in destination; this is not a claim of a console-error-free or authenticated flow. A URL wait helper timed out even though subsequent sanitized destination inspection showed the ORK sign-in surface; sign-in navigation is evidenced by the actual destination, not by that wait.

The latest `bun run tide:sync` still reported 0/5 linked identities. No authenticated protected-state screenshot, human quorum, live policy signing, ORK encryption/decryption/refusal or successful release redemption was exercised. No final demo video or submission was produced from these limited checks.
