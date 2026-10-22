import { expect, test } from "bun:test";
import type { StoredPolicy } from "../types";
import { assertPolicyReplacement } from "./policy-lifecycle";

const read: StoredPolicy = { recordId: "payout-c1", access: "read", subject: { type: "Role", id: "hui-c1-winner" }, policyB64: "fixture", expiresAt: 100, createdAt: "fixture" };
test("sealed policy renewal accepts expired same-scope reads, never changes write or reader scope", () => {
  expect(() => assertPolicyReplacement(read, { ...read, expiresAt: 200 }, true, 100)).not.toThrow();
  expect(() => assertPolicyReplacement(read, { ...read, expiresAt: 200 }, true, 99)).toThrow("current policy");
  expect(() => assertPolicyReplacement(read, { ...read, subject: { type: "Role", id: "operator" } }, true, 100)).toThrow("preserve");
  expect(() => assertPolicyReplacement({ ...read, access: "write" }, { ...read, access: "write" }, true, 100)).toThrow("only an expired read");
  expect(() => assertPolicyReplacement(undefined, read, true, 100)).toThrow("only an expired read");
});
