import { expect, test } from "bun:test";
import { assertSimulationRequest, parseSimulationCommand } from "./simulation-request";

test("sample commands reject actor spoofing on actions and unsupported input", () => {
  expect(parseSimulationCommand({ type: "sign-in", actor: "hanh" })).toEqual({ type: "sign-in", actor: "hanh" });
  for (const value of [
    { type: "sign-in", actor: "admin" }, { type: "approve", recordId: "payout-c3", actor: "hanh" },
    { type: "open", recordId: "payout-c99" }, { type: "reset", sql: "DELETE" },
    { type: "redeem", recordId: "payout-c1" },
  ]) expect(() => parseSimulationCommand(value)).toThrow();
});

test("simulation API is disabled in real mode and rejects remote or cross-origin requests", () => {
  const saved = process.env.HUI_AUTH_MODE;
  try {
    process.env.HUI_AUTH_MODE = "tide";
    expect(() => assertSimulationRequest(new Request("http://localhost:3000/api/simulation"))).toThrow("not available");
    process.env.HUI_AUTH_MODE = "simulated";
    expect(() => assertSimulationRequest(new Request("https://public.example/api/simulation"))).toThrow("localhost");
    expect(() => assertSimulationRequest(new Request("http://localhost:3000/api/simulation", { method: "POST", headers: { origin: "https://evil.example" } }))).toThrow("own origin");
    expect(() => assertSimulationRequest(new Request("http://localhost:3000/api/simulation", { method: "POST" }))).toThrow("own origin");
    expect(() => assertSimulationRequest(new Request("http://localhost:3000/api/simulation", { method: "POST", headers: { origin: "http://localhost:3000" } }))).not.toThrow();
  } finally {
    if (saved === undefined) delete process.env.HUI_AUTH_MODE;
    else process.env.HUI_AUTH_MODE = saved;
  }
});
