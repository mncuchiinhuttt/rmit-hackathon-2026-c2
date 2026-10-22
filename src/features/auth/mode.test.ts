import { expect, test } from "bun:test";
import { resolveAuthMode } from "./mode";

test("simulation requires explicit configuration; missing mode retains real Tide", () => {
  expect(resolveAuthMode(undefined)).toBe("tide");
  expect(resolveAuthMode("tide")).toBe("tide");
  expect(resolveAuthMode("simulated")).toBe("simulated");
});

test("unknown or empty authentication mode fails closed instead of enabling simulation", () => {
  for (const value of ["", "demo", "TIDE", "true"]) {
    expect(() => resolveAuthMode(value)).toThrow("HUI_AUTH_MODE");
  }
});
