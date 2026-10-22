import { expect, test } from "bun:test";
import { ApiError } from "@/lib/server/api-errors";
import { parseChangeRequests } from "@/features/governance/server/change-request-view";

const roles = [
  { id: "synthetic-role-c1", name: "hui-c1-winner" },
  { id: "synthetic-role-c3", name: "hui-c3-winner" },
  { id: "synthetic-role-c4", name: "hui-c4-winner" },
  { id: "synthetic-role-unrelated", name: "hui-c2-winner" },
];

type GrantRow = { ROLE_ID: string; USER_ID: string };

function grantRequest(id: string, rows: GrantRow[], overrides: Record<string, unknown> = {}) {
  return {
    id,
    status: "PENDING",
    actionType: "GRANT_ROLES",
    entityType: "USER",
    entityId: "synthetic-user-uuid",
    rows,
    authorizationCount: 0,
    threshold: 1,
    readyToCommit: false,
    authorizers: [],
    ...overrides,
  };
}

function expectReadFailure(operation: () => unknown): void {
  let error: unknown;
  try {
    operation();
  } catch (caught) {
    error = caught;
  }
  expect(error).toBeInstanceOf(ApiError);
  expect(error).toMatchObject({ status: 502, code: "tide_read_failed" });
}

test("projects a user-targeted role grant row and preserves its vote state", () => {
  const result = parseChangeRequests([
    grantRequest("synthetic-cr-1", [{ ROLE_ID: "synthetic-role-c3", USER_ID: "synthetic-user-uuid" }], {
      authorizationCount: 2,
      threshold: 3,
      readyToCommit: false,
      authorizers: [{ username: "admin", timestamp: 1_761_100_000_000 }, { username: "steward", timestamp: 1_761_100_000_001 }],
    }),
  ], roles);

  expect(result).toEqual([{
    id: "synthetic-cr-1",
    status: "PENDING",
    actionType: "GRANT_ROLES",
    authorizationCount: 2,
    threshold: 3,
    readyToCommit: false,
    authorizers: ["admin", "steward"],
    recordIds: ["payout-c3"],
  }]);
});

test("projects multiple mapped roles to distinct cycles and ignores unrelated rows", () => {
  const result = parseChangeRequests([
    grantRequest("synthetic-cr-multi", [
      { ROLE_ID: "synthetic-role-c1", USER_ID: "synthetic-user-uuid" },
      { ROLE_ID: "synthetic-role-c3", USER_ID: "synthetic-user-uuid" },
      { ROLE_ID: "synthetic-role-unrelated", USER_ID: "synthetic-user-uuid" },
      { ROLE_ID: "synthetic-role-c3", USER_ID: "synthetic-user-uuid" },
      { ROLE_ID: "synthetic-role-c4", USER_ID: "synthetic-user-uuid" },
    ]),
  ], roles);

  expect(result[0]?.recordIds).toEqual(["payout-c1", "payout-c3", "payout-c4"]);
});

test("does not infer payout cycles from entityId or a direct recordId", () => {
  const result = parseChangeRequests([
    {
      ...grantRequest("synthetic-cr-unrelated", [{ ROLE_ID: "synthetic-role-unrelated", USER_ID: "synthetic-user-uuid" }]),
      entityId: "payout-c1",
      recordId: "payout-c3",
    },
  ], roles);

  expect(result).toEqual([]);
});

test("uses the approved snapshot when the same change request appears after pending", () => {
  const pending = grantRequest("synthetic-cr-snapshot", [{ ROLE_ID: "synthetic-role-c1", USER_ID: "synthetic-user-uuid" }], {
    authorizationCount: 1,
    threshold: 2,
    authorizers: [{ username: "admin", timestamp: 1_761_100_000_000 }],
  });
  const approved = grantRequest("synthetic-cr-snapshot", [{ ROLE_ID: "synthetic-role-c4", USER_ID: "synthetic-user-uuid" }], {
    status: "APPROVED",
    authorizationCount: 2,
    threshold: 2,
    readyToCommit: true,
    authorizers: [{ username: "admin", timestamp: 1_761_100_000_000 }, { username: "steward", timestamp: 1_761_100_000_001 }],
  });

  expect(parseChangeRequests([pending, approved], roles)).toEqual([{
    id: "synthetic-cr-snapshot",
    status: "APPROVED",
    actionType: "GRANT_ROLES",
    authorizationCount: 2,
    threshold: 2,
    readyToCommit: true,
    authorizers: ["admin", "steward"],
    recordIds: ["payout-c4"],
  }]);
});

test("fails closed for malformed relevant counters and an incomplete or malformed role catalog", () => {
  const row = [{ ROLE_ID: "synthetic-role-c1", USER_ID: "synthetic-user-uuid" }];
  expectReadFailure(() => parseChangeRequests([grantRequest("synthetic-cr-fraction", row, { authorizationCount: 1.5 })], roles));
  expectReadFailure(() => parseChangeRequests([grantRequest("synthetic-cr-threshold", row, { threshold: 0 })], roles));
  expectReadFailure(() => parseChangeRequests([], roles.filter((role) => role.id !== "synthetic-role-c4")));
  expectReadFailure(() => parseChangeRequests([], [...roles, { id: "synthetic-malformed-role" }]));
});
