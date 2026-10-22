export type AuthMode = "tide" | "simulated";

export function resolveAuthMode(value: string | undefined): AuthMode {
  if (value === undefined || value === "tide") return "tide";
  if (value === "simulated") return "simulated";
  throw new Error("HUI_AUTH_MODE must be tide or simulated. Authentication mode was not changed.");
}
