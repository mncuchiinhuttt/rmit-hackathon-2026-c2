# Challenge 2 showcase landscape and buildable ideas

Research checked: 2026-10-22. Scores and idea feasibility are reasoned judgments, not an official rubric.

## Sample repo summary

- **FairEnrol** demonstrates course enrolment/waitlists and fairness exceptions: requests carry public reasons, panel members vote, and an audit list records demo events. [S2][S3]
- The fairness story is “no single person can move the line”; registrar override attempts are logged as blocked. [S2]
- `App.jsx` calls `useTideCloak()` and uses `login`, `logout`, `authenticated`, `isInitializing`, `isLoading`, `initError`, `hasRealmRole`, and `getValueFromToken`. [S2]
- It does **not** call `doEncrypt` / `doDecrypt`, server token verification, or Tide guard components in `App.jsx`; its 2-of-3 approval and role switcher are explicitly local simulations, not Tide-enforced authorization. [S2]
- `seed.json` is synthetic sample students/courses; package manifest lists React 19, `@tidecloak/react` `^0.14.33`, and Vite scripts. [S3][S4]
- GitHub’s `public/` listing contains `silent-check-sso.html` only. [S5]
- README has placeholder prompts under all five numbered sections; its badge link includes `utm_campaign=unlocked`, but provides no filled-in case or named campaign explanation. [S1]
- Section mapping (interpretation): vision=fair enrolment; trust=single-person queue power; value=students get fair access; Tide=real login/roles contrasted with simulated quorum; prototype=interactive queue/exception/audit story. The README itself leaves these prompts blank. [S1][S2][INFERENCE]

## Precedents and rubric search

- **Found:** the supplied FairEnrol sample repo and its five section headings. README presents guiding prompts, not a public point scale, weights, official winner list, or completed judging rubric. [S1]
- Its linked badge has `utm_campaign=unlocked`; exact-phrase and TideCloak showcase searches did not surface a separate official “Unlocked” campaign, Tide hackathon winner page, or public Challenge 2 scoring/winners page. Search-result absence is not proof none exist (private/unindexed entries remain possible). [S1][INFERENCE]
- Searches included exact phrases `"Trust constraint insight"`, `"Vision & originality"`, TideCloak hackathon/showcase/“Unlocked”, and targeted `site:devpost.com` / `site:lablab.ai` queries. No separate entry or rubric was found in those results.

## Tide capabilities: advertised vs verified

Short ad quotes below are from Tide’s product page; SDK / whitepaper columns qualify what an app can actually demonstrate.

| Headline | Tide advertises | What docs let a developer do / boundary |
|---|---|---|
| BYOiD identity & passwordless option | “Users can never be impersonated.” [S6] | BYOiD docs describe blinded credentials, threshold verification, ZK proofs, and no stored password hashes; React integration exposes ordinary `login()` via the hook. Passwordless is described as a separate Tide 2FA/Authenticator App path, not as a special React `login()` switch. Treat passwordless as **not a 5-hour baseline** unless that app flow is already configured and working. [S8][S11][S13] |
| Tamper-proof authorization / access | “Every seal is a proof that validation was successfully completed in an incorruptible process.” [S6] | React exposes `hasRealmRole` / `hasClientRole`, token-claim helpers, and authenticated guards; docs also show backend token verification using `@tidecloak/verify` in a Node/Express example. A client-side UI check alone is not server authorization; Bun backend verification compatibility is **[UNVERIFIED]**. [S8][S9][S12] |
| Quorum-enforced governance | “No more ‘god-mode’.” [S6] | QEA documents quorum-governed IAM changes (roles, groups, permissions, JWT-signing changes), approvals, and audit logs. It is **not** a generic app-level vote/approval API for custom spending, queue, or case decisions. With one realm admin threshold is 1; multi-admin mode requires additional `tide-realm-admin` holders. [S10] |
| Hermetic / tag-based E2EE | “only the legitimate client can access the data” [S6] | React provides `doEncrypt([{data,tags}])` and `doDecrypt([{encrypted,tags}])`; values are strings or `Uint8Array`. Access requires `_tide_<tag>.selfencrypt` / `_tide_<tag>.selfdecrypt` roles. Whitepaper says cleartext resolves in the browser; developer still must assign roles, protect app logic, and avoid exposing plaintext elsewhere. [S9][S12][S13] |
| Comprehensive IAM / “cyber immunity” | “Add auth to your app and get built-in cyber immunity.” [S6] | Standard OIDC/OAuth, role management, sessions, and admin features are documented. “Cyber immunity” / “breaches inconsequential” is a broad marketed outcome, **not an app API or proof that a prototype/business backend is immune**; docs’ architecture claim assumes a threshold of honest Fabric nodes and correct application integration. [S6][S7][S12][S13][INFERENCE] |

- **Strongest 5-hour differentiator:** encrypt before persistence, show backend/admin sees ciphertext, then decrypt only in a session whose token has the tag role. This follows the documented SDK surface, but needs tag roles and Tide client config to be provisioned first. [S9][S12][INFERENCE]
- **Local check (GET only):** `myrealm` OIDC discovery returned issuer plus authorization/token endpoints. This verifies reachable OIDC metadata only—not an app client, working login, tag-role configuration, QEA mode, or user accounts. [S14][INFERENCE]
- FairEnrol is useful as a storytelling precedent, but its simulated queue governance must not be presented as a Tide-enforced quorum. [S2]

## Candidate ideas (table + short notes)

All MVP cuts below use synthetic data, a small React UI, Tide login and one real privacy interaction; no RMIT system integration. Five-hour buildability is **[INFERENCE]** for four students. E2EE proposals assume working client config plus tag roles; these are documented prerequisites, not confirmed in `myrealm`. [S9][S14]

| Candidate | One-line concept | Trust constraint | Tide primitives | 60-second wow moment | Build risk |
|---|---|---|---|---|---|
| **1. Campus Signal** | Authenticated students submit a confidential misconduct / safety report in Vietnamese or Khmer; assigned support staff can read it. [INFERENCE] | Reporting often means trusting the same institution/app operator that could expose the allegation; do not promise anonymity. [INFERENCE] | `login`, report-tag `doEncrypt`/`doDecrypt`, role-gated decrypt; optional browser-side translation only after authorized decrypt and reporter review. [S8][S9] | Submit a synthetic Vietnamese report; show stored ciphertext to a registrar/admin view, then decrypt in the support-role session. [INFERENCE] | **M** — role/tag setup and a second test account; drop AI if no approved model is ready. [S9][INFERENCE] |
| **2. Club Ledger** | Club members submit private receipt/note details while publishing only a simple spend total/status. [INFERENCE] | Ordinary dashboard/database access can reveal student names, vendors, or sensitive purchase details. [INFERENCE] | `doEncrypt`/`doDecrypt` with `club-expense` tag and treasurer role; optional QEA only for governed assignment of IAM roles, not expense approvals. [S9][S10] | Treasurer opens a receipt after a viewer sees ciphertext; public ledger still shows the demo total. [INFERENCE] | **M** — fewer screens than Signal, but E2EE role provisioning is still a gate. [S9][INFERENCE] |
| **3. GrantGuard** | Short-form scholarship need statement with protected family/financial details for a committee reviewer. [INFERENCE] | A broad admin/reviewer pool should not automatically read applicant evidence. [INFERENCE] | `doEncrypt`/`doDecrypt` for private fields; applicant/reviewer role checks. [S8][S9] | Applicant submits synthetic details; committee role decrypts, database view remains ciphertext. [INFERENCE] | **M** — keep text-only; uploads, OCR, and AI scoring make five hours risky and are unnecessary. [INFERENCE] |
| **4. CarePass** | Student shares a synthetic accommodation note with a campus support role, not every app operator. [INFERENCE] | Health/accommodation detail is highly sensitive; staff access should be scoped. [INFERENCE] | `doEncrypt`/`doDecrypt` with a support tag; authenticated role checks. [S8][S9] | Show opaque note in admin view; authorized support account decrypts it. [INFERENCE] | **M/H** — simple demo, but medical-data claims raise safety expectations; use synthetic data only. [INFERENCE] |
| **5. Community Bridge** | Low-resource-language community help intake, with a vetted responder receiving the protected message and a reviewed translation. [INFERENCE] | A translator, hosting operator, or shared inbox should not gain automatic access to a vulnerable person’s case. [INFERENCE] | Tag E2EE + responder role; optional AI translation in the authorized client. [S9][INFERENCE] | Show untranslated ciphertext to the host, then authorized responder opens the Vietnamese/Khmer intake. [INFERENCE] | **H** — language/model availability and quality are unknown; secure intake works without AI, but narrows theme breadth. [INFERENCE] |
| **6. PeerPact** | Private peer-loan note and repayment reminder for a student club. [INFERENCE] | Loan details should be visible only to the two parties. [INFERENCE] | Tag E2EE is available, but documented `_tide_<tag>` roles are role-based, not per-record recipient grants; do not claim only two named users can decrypt without a verified design. [S9][INFERENCE] | A role-holder decrypts a sample note while an unprivileged session sees ciphertext. [INFERENCE] | **H** — per-loan consent/recipient scoping is the central trust story, but the verified SDK surface does not establish it. [S9][INFERENCE] |

### Scorecard (subjective 1–5; each score includes its reason)

Axes: **V** Vision & originality; **T** Trust constraint insight; **I** Value & impact; **TC** Why TideCloak matters; **P** Prototype & storytelling. These mirror README section prompts, not an official rubric. [S1][INFERENCE]

| Idea | Scores + one-line rationale |
|---|---|
| Campus Signal | **V5** distinct language-specific reporting; **T5** names operator exposure; **I5** lowers disclosure friction; **TC5** genuine role-tagged E2EE; **P5** visible ciphertext→authorized reading. |
| Club Ledger | **V4** practical student-club niche; **T5** protects identifying receipts; **I4** strengthens accountability; **TC5** real tag encryption, optional QEA role governance; **P5** simple split-view reveal. |
| GrantGuard | **V4** familiar but concrete aid use; **T5** protects need data; **I5** high-stakes access; **TC5** direct tag-role fit; **P3** form demo lacks real committee workflow. |
| CarePass | **V4** useful student handoff; **T5** highly sensitive content; **I5** meaningful accommodation access; **TC5** direct encryption fit; **P3** synthetic note only, limited workflow. |
| Community Bridge | **V5** extends language access beyond campus; **T5** protects vulnerable reports; **I4** meaningful but broader audience; **TC5** real encrypted intake; **P3** translation can distract from working trust flow. |
| PeerPact | **V3** common peer-lending pattern; **T3** per-person secrecy is unresolved; **I4** useful club case; **TC2** SDK roles are not verified per-record ACLs; **P3** ciphertext demo would not prove the key promise. |

## Recommendation

1. **Build Campus Signal** if role/tag setup works immediately. It most clearly answers “what becomes possible when trust is removed?” and gives a short, emotionally legible low-resource-language demo without needing AI. Use authenticated—not anonymous—submissions, synthetic cases, one `support` tag, and two distinct test roles. AI translation is an optional second act only after the encryption path works. [S9][INFERENCE]
2. **Build Club Ledger** if the team wants lower ethical/scope risk and a clean product story. Encrypt receipt narratives/details, publish only a harmless demo total, and show treasurer-only decrypt. If adding quorum, demonstrate only a QEA-governed IAM role change; explicitly say expense approval itself is app policy, not QEA. [S9][S10][INFERENCE]
3. **Why the rest lose:** GrantGuard and CarePass are strong trust stories but can look like generic private forms and need strict synthetic-data framing; Community Bridge’s AI/translation uncertainty risks stealing demo time; PeerPact’s exact two-person access promise is not established by the documented role-tag SDK. [S9][INFERENCE]

## Unknowns

- Whether `myrealm` already has a configured React client, two suitable users, tag-specific `selfencrypt`/`selfdecrypt` roles, and the `silent-check-sso.html`/redirect setup; docs require these roles/configuration, and the GET metadata did not check them. [S9][S14]
- Whether QEA is enabled in `myrealm` and can be shown in multi-admin mode; QEA needs more than one realm admin for quorum beyond threshold 1. [S10][S14]
- Whether the React SDK package imports and runs under the planned Bun + `Bun.serve` HTML-import setup. Sample repo and React tutorial describe Vite; Bun compatibility is **[UNVERIFIED]**. [S4][S9]
- No AI model/API credentials or sanctioned student-data handling configuration were verified; keep AI optional and never send real sensitive cases to a model. **[UNVERIFIED]**
- No official point weights, confirmed challenge rubric beyond the sample’s five prompts, or searchable public winners were found. [S1]

## Sources

- **S1** Sample README (full): <https://raw.githubusercontent.com/truongnguyenxuanvinh/hackathon/main/README.md>
- **S2** Sample app: <https://raw.githubusercontent.com/truongnguyenxuanvinh/hackathon/main/src/App.jsx>
- **S3** Sample seed data: <https://raw.githubusercontent.com/truongnguyenxuanvinh/hackathon/main/src/seed.json>
- **S4** Sample package manifest: <https://raw.githubusercontent.com/truongnguyenxuanvinh/hackathon/main/package.json>
- **S5** Sample public directory listing: <https://api.github.com/repos/truongnguyenxuanvinh/hackathon/contents/public>
- **S6** TideCloak product page: <https://tide.org/tidecloak>
- **S7** TideCloak core concepts: <https://docs.tide.org/Core-Concepts/core-concepts>
- **S8** TideCloak React SDK intro: <https://docs.tide.org/Languages/React/tidecloak-react-intro>
- **S9** React SDK how-to/API examples: <https://docs.tide.org/Languages/React/tidecloak-react-how-to-guide>
- **S10** QEA / Quorum Enforced Governance: <https://docs.tide.org/Core-Concepts/iga-workflow>
- **S11** BYOiD authentication: <https://docs.tide.org/Core-Concepts/byoid>
- **S12** Tide whitepaper, TideCloak integration: <https://tide.org/whitepaper/tidecloak-integration>
- **S13** Tide whitepaper, client architecture: <https://tide.org/whitepaper/client-architecture>
- **S14** Read-only local OIDC metadata: <http://localhost:8080/realms/myrealm/.well-known/openid-configuration>
