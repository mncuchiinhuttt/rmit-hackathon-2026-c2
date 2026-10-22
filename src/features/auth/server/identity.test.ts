import { expect, test } from "bun:test";
import type { JWTPayload } from "jose";
import { hasClientRole, hasRealmRole } from "@/features/auth/server/identity";

test("realm roles and exact-client roles stay distinct", () => {
  const claims: JWTPayload = {
    realm_access: { roles: ["hui-c3-winner"] },
    resource_access: {
      "realm-management": { roles: ["tide-realm-admin"] },
      "hui-rmit26-client": { roles: ["hui-c3-winner"] },
    },
  };

  expect(hasRealmRole(claims, "hui-c3-winner")).toBe(true);
  expect(hasRealmRole(claims, "tide-realm-admin")).toBe(false);
  expect(hasClientRole(claims, "realm-management", "tide-realm-admin")).toBe(true);
  expect(hasClientRole(claims, "hui-rmit26-client", "tide-realm-admin")).toBe(false);
  expect(hasClientRole(claims, "another-client", "hui-c3-winner")).toBe(false);
});
