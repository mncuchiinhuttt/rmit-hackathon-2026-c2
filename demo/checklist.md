# Demo and submission checklist

## Human prerequisites

- [ ] Five prepared accounts linked to Tide identities using the private local invitation page.
- [ ] The three steward accounts hold three distinct Tide identities.
- [ ] First admin activated only after linking; remaining steward grants and related admin policy approved in the enclave.
- [ ] Effective quorum measured: first distinct approval pending, second commits (or record the actual threshold).
- [ ] RelationshipAttestation policy signing/encryption/decryption exercised on this ORK network.
- [ ] Alternate-policy and master-admin experiments documented; claims narrowed to what was observed.

## Actual product proof

- [ ] Escrow signs in and seals a fresh record; no plaintext uploaded to the application server.
- [ ] The same signed read policy/ciphertext reaches authorized and unauthorized test sessions.
- [ ] ORK denial distinguished from missing policy, expired session, API refusal and transport failure.
- [ ] Beneficiary refreshes its session, decrypts and redeems once; wrong user/code/reuse fail.
- [ ] Steward remains unable to read after approving; prior-cycle entitlement does not imply next-cycle access.
- [ ] One complete successful run recorded before further polishing.

## Release hygiene

- [x] Typecheck, lint, meaningful tests and production build pass (15 tests / 43 expectations).
- [x] Unauthenticated production page checked at 1280px and 375px; keyboard/focus/reduced motion inspected.
- [x] README project overview answers five official prompts in at most 300 words (249 words).
- [ ] Demo video approximately 2 minutes, `.mp4`, under 100 MB, playback verified.
- [x] Staged files and full reachable Git history received the bounded private-data pattern/path review; see the repository-hygiene report.
- [ ] Repository made public only at the user-authorized time and after the secret review.
- [ ] Group name and team emails copied from private local configuration, not published in code/docs.
- [ ] Google Form submitted with the public repository URL; confirmation saved privately.
