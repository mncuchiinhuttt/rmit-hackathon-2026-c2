"use client";

import { IAMService } from "@tidecloak/js";
import { apiGet, apiPost } from "@/lib/client/tide-api";
import type { CircleMember } from "@/features/auth/types";
import type { OpenedRelease, ReleaseArtifact, StoredPolicy } from "@/features/releases/types";
import { signRelationshipPolicy, encryptForRecord, decryptForRecord } from "./relationship";

export async function createPolicies(recordId: string): Promise<void> {
  const [artifact, members, admin] = await Promise.all([
    apiGet<ReleaseArtifact>(`/api/payouts?recordId=${encodeURIComponent(recordId)}`),
    apiGet<CircleMember[]>('/api/members'),
    apiGet<{ policyB64: string }>('/api/admin-policy'),
  ]);
  const escrow = members.find(member => member.username === 'bao');
  if (!escrow?.tideUserKey) throw new Error('The escrow account must finish Tide enrollment before policies can be signed');
  const config: unknown = IAMService.getConfig();
  if (!config || typeof config !== 'object' || !('vendorId' in config) || typeof config.vendorId !== 'string' || !config.vendorId) throw new Error('The adapter has no Tide vendor identifier');
  const adminBytes = Uint8Array.from(atob(admin.policyB64), character => character.charCodeAt(0));
  const expiresAt = Math.floor(Date.now() / 1000) + 48 * 60 * 60;
  const accessLevels: Array<'read' | 'write'> = artifact.cycle.sealed ? ['read'] : ['write', 'read'];
  for (const access of accessLevels) {
    const existing: StoredPolicy | null = access === 'write' ? artifact.writePolicy : artifact.readPolicy;
    if (existing && existing.expiresAt > Date.now() / 1000) continue;
    const subject = access === 'write'
      ? { type: 'User' as const, id: escrow.tideUserKey }
      : { type: 'Role' as const, id: artifact.cycle.releaseRole };
    const policyB64 = await signRelationshipPolicy({ vendorId: config.vendorId, subject, recordId, access, expiry: expiresAt }, adminBytes);
    await apiPost('/api/policies', { recordId, access, subject, policyB64, expiresAt });
  }
}

export async function sealRelease(recordId: string): Promise<void> {
  const artifact = await apiGet<ReleaseArtifact>(`/api/payouts?recordId=${encodeURIComponent(recordId)}`);
  if (artifact.ciphertext) throw new Error('This cycle is already sealed; choose an unused cycle');
  if (!artifact.writePolicy) throw new Error('A steward must sign the escrow write policy first');
  const code = Array.from(crypto.getRandomValues(new Uint8Array(24)), byte => byte.toString(16).padStart(2, '0')).join('');
  const release: OpenedRelease = {
    cycle: artifact.cycle.number,
    beneficiary: artifact.cycle.beneficiaryUsername,
    amountVnd: artifact.cycle.amountVnd,
    code,
  };
  const ciphertext = await encryptForRecord(JSON.stringify(release), recordId, artifact.writePolicy.policyB64);
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(code));
  const codeHash = Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, '0')).join('');
  await apiPost('/api/payouts', { recordId, ciphertext, codeHash });
}

export async function openRelease(artifact: ReleaseArtifact): Promise<OpenedRelease> {
  if (!artifact.ciphertext || !artifact.readPolicy) throw new Error('The sealed record and signed read policy must exist first');
  // Do not pre-reject a missing role here: the point of this action is a real ORK decision.
  const plaintext = await decryptForRecord(artifact.ciphertext, artifact.cycle.recordId, artifact.readPolicy.policyB64);
  const decoded: unknown = JSON.parse(plaintext);
  if (!decoded || typeof decoded !== 'object' || !('cycle' in decoded) || !('beneficiary' in decoded) ||
      !('amountVnd' in decoded) || !('code' in decoded) || decoded.cycle !== artifact.cycle.number ||
      decoded.beneficiary !== artifact.cycle.beneficiaryUsername || decoded.amountVnd !== artifact.cycle.amountVnd ||
      typeof decoded.code !== 'string' || !/^[a-f0-9]{48}$/.test(decoded.code)) {
    throw new Error('The opened package does not match this synthetic cycle');
  }
  return { cycle: decoded.cycle, beneficiary: decoded.beneficiary, amountVnd: decoded.amountVnd, code: decoded.code };
}

export async function redeemRelease(recordId: string, code: string): Promise<void> {
  await apiPost('/api/escrow/redeem', { recordId, code });
}

export async function refreshCredentials(): Promise<void> {
  if (!IAMService.isLoggedIn()) throw new Error('Sign in before refreshing your Tide session');
  const refreshed = await IAMService.forceUpdateToken();
  if (!refreshed) throw new Error('Tide could not refresh this session; sign in again');
}
