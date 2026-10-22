import { expect, test } from "bun:test";
import { MAX_BODY_BYTES, readJsonStream } from "@/lib/server/request-body";

async function expectApiError(operation: Promise<unknown>, status: number, code: string): Promise<void> {
  let caught: unknown;
  try {
    await operation;
  } catch (error) {
    caught = error;
  }
  expect(caught).toMatchObject({ status, code });
}

test("accepts a JSON body exactly at the byte limit", async () => {
  const body = JSON.stringify({ value: "x".repeat(MAX_BODY_BYTES - 12) });
  expect(new TextEncoder().encode(body).byteLength).toBe(MAX_BODY_BYTES);

  const parsed = await readJsonStream(new Response(body).body, new Headers({ "content-type": "application/json; charset=utf-8" }));
  expect(parsed).toEqual({ value: "x".repeat(MAX_BODY_BYTES - 12) });
});

test("rejects non-JSON media types and oversized declared or streamed bodies", async () => {
  await expectApiError(
    readJsonStream(new Response("{}").body, new Headers({ "content-type": "text/plain" })),
    415,
    "unsupported_media_type",
  );
  await expectApiError(
    readJsonStream(null, new Headers({ "content-type": "application/json", "content-length": String(MAX_BODY_BYTES + 1) })),
    413,
    "payload_too_large",
  );
  await expectApiError(
    readJsonStream(new Response("x".repeat(MAX_BODY_BYTES + 1)).body, new Headers({ "content-type": "application/json" })),
    413,
    "payload_too_large",
  );
});
test("accepts large upstream change-request JSON under 1 MiB and rejects streamed excess", async () => {
  const maxBytes = 1024 * 1024;
  const requests = Array.from({ length: 900 }, (_, index) => ({
    id: `synthetic-cr-${index}`,
    status: "APPROVED",
    actionType: "GRANT_ROLES",
    entityType: "USER",
    entityId: `synthetic-user-${index}`,
    rows: [{ ROLE_ID: "synthetic-role-c1", USER_ID: `synthetic-user-${index}` }],
    authorizationCount: 1,
    threshold: 1,
    readyToCommit: true,
    authorizers: [{ username: "admin", timestamp: 1_761_100_000_000 + index }],
  }));
  const body = JSON.stringify(requests);
  const bodyBytes = new TextEncoder().encode(body).byteLength;
  expect(bodyBytes).toBeGreaterThan(240 * 1024);
  expect(bodyBytes).toBeLessThan(maxBytes);

  const parsed = await readJsonStream(
    new Response(body).body,
    new Headers({ "content-type": "application/json" }),
    maxBytes,
  );
  expect(parsed).toEqual(requests);

  const oversizedBody = JSON.stringify({ payload: "x".repeat(maxBytes) });
  expect(new TextEncoder().encode(oversizedBody).byteLength).toBeGreaterThan(maxBytes);
  await expectApiError(
    readJsonStream(
      new Response(oversizedBody).body,
      new Headers({ "content-type": "application/json" }),
      maxBytes,
    ),
    413,
    "payload_too_large",
  );
});
