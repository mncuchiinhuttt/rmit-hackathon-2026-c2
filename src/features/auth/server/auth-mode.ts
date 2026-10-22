import "server-only";
import { resolveAuthMode } from "../mode";

export function readAuthMode() {
  return resolveAuthMode(process.env.HUI_AUTH_MODE);
}
