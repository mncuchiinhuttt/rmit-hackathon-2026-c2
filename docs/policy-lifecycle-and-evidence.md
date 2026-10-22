# Policy lifecycle and evidence boundary

## Product rule

The normal flow is contribution → receiving turn → reader request → independent steward review → recipient opens and redeems. Minh receives demo cycles 1 and 3; Bao receives cycle 4. A member's earlier access never implies access to another cycle. Operating the app grants no reader or voting rights by itself.

An explicitly approved extra reader may see the sample code, including Operator after a group decision. Only the scheduled recipient may redeem. This is a deliberate permission decision by the group, not an operator self-grant or a claim that the host can never read under any circumstances.

## Simulated decisions

SQLite schema v2 stores proposals, votes, reader grants and policy version/expiry. Proposals contain proposer, cycle, requested change, target reader, base version, approvals and pending/committed/superseded status.

- `grant`: pending and one approval confer no access. Two distinct stewards commit the exact reader/cycle grant. A proposer cannot approve their own change.
- `renew`: two independent approvals extend the same cycle for 48 hours. Active reader grants survive ordinary renewal. Readers cleared by revocation are not restored; they need new grants.
- `revoke`: two independent approvals disable future opens/redemptions and clear this cycle's reader grants.
- Committing a change advances the policy version and supersedes other pending proposals for the old version. The server does not silently rebase an old proposal onto new scope.
- Expiry is checked at the server's current time on each open/redeem. At the exact expiry boundary access is denied. Grant approval cannot commit against an expired or revoked policy.

These are sample identities and local rules. Two stewards here is not a measurement of Tide quorum. A copied or already displayed code cannot be recalled. The UI closes its own opened view on account/cycle changes or refresh; this does not erase another person's copy.

## Real Tide read-policy renewal

The former UI/API contradiction is removed. Before sealing, the app signs/stores the required write and read policies. After sealing, the client requests a fresh signature only for an expired read policy through the existing Tide enclave/admin-policy flow.

The server requires a verified steward session and validates the incoming policy structure/vendor/expiry. A sealed-record replacement must have an existing expired read policy and preserve its record, subject and read-only access. The write policy, beneficiary, ciphertext and redemption hash remain unchanged. Current read policies cannot be overwritten. Renewal is recorded as `policy_read_renewed` in the audit history.

The API's parser checks signature presence, not the cryptographic validity of those signature bytes. ORK use still performs that verification. This application has not yet demonstrated live renewal or measured the realm's actual signing threshold.

Tide MCP `@tideorg/mcp` 1.9.33 was consulted through `tide_scenario(name: relationship-attestation)` on 2026-10-22. Its guidance says expiry ends use, re-grant extends it, and deleting a stored policy cannot revoke retained copies. Role/group removal depends on updated credentials; removing `_tide_decryptor` affects all of that user's records. Our real path uses a per-cycle role and must measure propagation before claiming revocation. The MCP's reported same-record policy interoperability on its test stack is not evidence for this app's deployed network.

## Step 5: live acceptance still required

Current Windows checkout has no `data/tidecloak.json`; credentialed live acceptance is blocked before the app can initialize its real provider. Existing historical realm/enrollment observations are not substituted for a current successful run.

Record these observations with redacted artifacts when Tide setup is ready:

| Proof | Evidence required |
|---|---|
| Separate identities | Distinct enrolled users and steward keys; actual token/role readback without exposing credentials |
| Encryption boundary | Signed policy and ciphertext fingerprints; browser encryption/decryption, no uploaded plaintext |
| Positive/negative access | Correct reader and wrong reader use the exact same ciphertext and signed read policy; distinguish API/session/network failure from an ORK refusal |
| Quorum and commit | First approval result, each additional distinct approval, observed threshold, committed entitlement and refreshed claims; acceptance/2xx alone is insufficient |
| Single-admin bypass | One admin attempts self-grant and creates an alternate policy for its own subject or another role; test retained ciphertext directly with that policy, beyond the app's UI/API restrictions |
| Expiry and renewal | Old policy denied at expiry; governed same-scope renewal opens the unchanged ciphertext; changed-scope/write-policy replacements remain rejected |
| Revocation | Remove the per-cycle role through governed change, record commit and credential refresh/propagation time, retry retained policy/ciphertext with old and fresh credentials; retain the copied-code limitation |

Do not mark these rows passed from SQLite tests. Publication and video remain separately controlled by the user.
