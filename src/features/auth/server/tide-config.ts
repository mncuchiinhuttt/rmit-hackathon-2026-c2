import { readFileSync } from "node:fs";
import { join } from "node:path";
import type { JSONWebKeySet } from "jose";
import { ApiError } from "@/lib/server/api-errors";
import { isRecord } from "@/lib/server/guards";

const EXPECTED_REALM = "hui-rmit26";
const EXPECTED_CLIENT = "hui-rmit26-client";
const LOOPBACK_HOSTS: Record<string, true> = { localhost: true, "127.0.0.1": true, "[::1]": true };

export interface TidecloakConfig {
  realm: string;
  "auth-server-url": string;
  resource: string;
  jwk: JSONWebKeySet;
  vendorId: string;
  homeOrkUrl: string;
  "ssl-required"?: string;
  "public-client"?: boolean;
  "confidential-port"?: number;
  clientOriginAuth: Readonly<Record<string, string>>;
}

let cachedConfig: TidecloakConfig | null = null;

function requiredString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0 && value.length <= 4096;
}

function publicJwks(value: unknown): JSONWebKeySet {
  if (!isRecord(value) || !Array.isArray(value.keys) || value.keys.length === 0) throw new Error();
  const keys: unknown[] = value.keys;
  const publicFields = ["kty", "crv", "alg", "use", "key_ops", "kid", "x", "y", "n", "e"] as const;
  const cleaned = keys.map((item) => {
    if (!isRecord(item) || item.kty !== "OKP" || item.crv !== "Ed25519" || !requiredString(item.x)) throw new Error();
    if (item.alg !== undefined && item.alg !== "EdDSA") throw new Error();
    const key: Record<string, unknown> = {};
    for (const field of publicFields) {
      const candidate = item[field];
      if (candidate === undefined) continue;
      if (field === "key_ops") {
        if (!Array.isArray(candidate) || !candidate.every((entry) => typeof entry === "string")) throw new Error();
      } else if (typeof candidate !== "string") {
        throw new Error();
      }
      key[field] = candidate;
    }
    return key;
  });
  return { keys: cleaned } as unknown as JSONWebKeySet;
}

function parseAdapter(value: unknown): TidecloakConfig {
  if (!isRecord(value) || value.realm !== EXPECTED_REALM || value.resource !== EXPECTED_CLIENT) throw new Error();
  if (!requiredString(value["auth-server-url"]) || !requiredString(value.vendorId) || !requiredString(value.homeOrkUrl)) throw new Error();
  const authUrl = new URL(value["auth-server-url"]);
  const orkUrl = new URL(value.homeOrkUrl);
  const localHttp = authUrl.protocol === "http:" && Object.hasOwn(LOOPBACK_HOSTS, authUrl.hostname);
  if (!(authUrl.protocol === "https:" || localHttp) || authUrl.username || authUrl.password || authUrl.search || authUrl.hash) throw new Error();
  if (orkUrl.protocol !== "https:" || orkUrl.username || orkUrl.password || orkUrl.search || orkUrl.hash) throw new Error();
  if (value["ssl-required"] !== undefined && typeof value["ssl-required"] !== "string") throw new Error();
  if (value["public-client"] !== undefined && typeof value["public-client"] !== "boolean") throw new Error();
  if (value["confidential-port"] !== undefined && (typeof value["confidential-port"] !== "number" || !Number.isSafeInteger(value["confidential-port"]))) throw new Error();

  const clientOriginAuth: Record<string, string> = {};
  for (const [key, signature] of Object.entries(value)) {
    if (!key.startsWith("client-origin-auth-")) continue;
    const origin = key.slice("client-origin-auth-".length);
    if (!requiredString(signature) || signature.length > 16_384) throw new Error();
    const parsedOrigin = new URL(origin);
    if (!(parsedOrigin.protocol === "https:" || (parsedOrigin.protocol === "http:" && Object.hasOwn(LOOPBACK_HOSTS, parsedOrigin.hostname))) || parsedOrigin.origin !== origin) throw new Error();
    clientOriginAuth[key] = signature;
  }
  if (Object.keys(clientOriginAuth).length === 0) throw new Error();

  return {
    realm: EXPECTED_REALM,
    "auth-server-url": authUrl.toString().replace(/\/$/, ""),
    resource: EXPECTED_CLIENT,
    jwk: publicJwks(value.jwk),
    vendorId: value.vendorId,
    homeOrkUrl: orkUrl.toString().replace(/\/$/, ""),
    ...(typeof value["ssl-required"] === "string" ? { "ssl-required": value["ssl-required"] } : {}),
    ...(typeof value["public-client"] === "boolean" ? { "public-client": value["public-client"] } : {}),
    ...(typeof value["confidential-port"] === "number" ? { "confidential-port": value["confidential-port"] } : {}),
    clientOriginAuth,
  };
}

export function loadTideConfig(): TidecloakConfig {
  if (cachedConfig) return cachedConfig;
  try {
    const adapterPath = join(process.cwd(), "data", "tidecloak.json");
    cachedConfig = parseAdapter(JSON.parse(readFileSync(adapterPath, "utf8")) as unknown);
    return cachedConfig;
  } catch {
    throw new ApiError(503, "tide_config_unavailable", "Tide adapter configuration is unavailable.");
  }
}

export function publicTideConfig(config: TidecloakConfig): Record<string, unknown> {
  const result: Record<string, unknown> = {
    realm: config.realm,
    "auth-server-url": config["auth-server-url"],
    resource: config.resource,
    jwk: config.jwk,
    vendorId: config.vendorId,
    homeOrkUrl: config.homeOrkUrl,
    ...config.clientOriginAuth,
  };
  if (config["ssl-required"] !== undefined) result["ssl-required"] = config["ssl-required"];
  if (config["public-client"] !== undefined) result["public-client"] = config["public-client"];
  if (config["confidential-port"] !== undefined) result["confidential-port"] = config["confidential-port"];
  return result;
}
