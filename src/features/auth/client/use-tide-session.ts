"use client";

import { useTideCloak } from "@tidecloak/nextjs";
import type { TideSessionState } from "@/features/auth/types";

export function useTideSession(): TideSessionState {
  const auth = useTideCloak();
  const claimedName: unknown = auth.getValueFromToken('preferred_username');
  return {
    authenticated: auth.authenticated,
    initializing: auth.isInitializing,
    error: auth.initError?.message ?? null,
    login: auth.login,
    logout: auth.logout,
    username: typeof claimedName === 'string' ? claimedName : auth.authenticated ? 'Circle member' : '',
    isSteward: auth.authenticated && auth.hasClientRole('tide-realm-admin', 'realm-management'),
    canEncrypt: auth.authenticated && auth.hasRealmRole('_tide_encryptor'),
    canDecrypt: auth.authenticated && auth.hasRealmRole('_tide_decryptor'),
  };
}
