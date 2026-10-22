import type { JWTPayload } from "jose";
import { ApiError } from "@/lib/server/api-errors";
import type { SessionView } from "@/features/auth/types";
import { resolveDemoUser } from "@/features/auth/server/demo-users";

export interface AuthContext {
  accessToken: string;
  claims: JWTPayload;
  session: SessionView;
}

function roleList(value: unknown): string[] {
  if (typeof value !== "object" || value === null || Array.isArray(value)) return [];
  const roles = (value as Record<string, unknown>).roles;
  return Array.isArray(roles) ? roles.filter((role): role is string => typeof role === "string") : [];
}

export function hasRealmRole(claims: JWTPayload, role: string): boolean {
  return roleList(claims.realm_access).includes(role);
}

export function hasClientRole(claims: JWTPayload, clientId: string, role: string): boolean {
  const resources = claims.resource_access;
  if (typeof resources !== "object" || resources === null || Array.isArray(resources)) return false;
  return roleList((resources as Record<string, unknown>)[clientId]).includes(role);
}

export function resolveAuthContext(accessToken: string, claims: JWTPayload): AuthContext {
  const sub = claims.sub;
  const username = claims.preferred_username;
  if (typeof sub !== "string" || sub.length === 0 || typeof username !== "string" || username.length === 0) {
    throw new ApiError(401, "unauthorized", "Authentication failed.");
  }

  const mapped = resolveDemoUser(username, sub, claims.tideuserkey);
  const realmRoles = roleList(claims.realm_access);
  const session: SessionView = {
    sub,
    username,
    tideUserKey: mapped.tideUserKey,
    realmRoles,
    isSteward: hasClientRole(claims, "realm-management", "tide-realm-admin"),
    canEncrypt: realmRoles.includes("_tide_encryptor"),
    canDecrypt: realmRoles.includes("_tide_decryptor"),
  };
  return { accessToken, claims, session };
}
