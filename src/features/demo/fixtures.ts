import type { SessionView } from "@/features/auth/types";
import { CIRCLE_NAME, CONTRIBUTION_VND, MEMBER_COUNT } from "@/features/circle/model";
import type { CircleSnapshot } from "@/features/circle/types";
import type { ReleaseArtifact, StoredPolicy } from "@/features/releases/types";
import { DEMO_TIME, demoOpenError, isDemoSteward, type DemoCycle, type DemoRole, type DemoState } from "./model";

export function demoSession(actor: DemoRole, cycle: DemoCycle): SessionView {
  return {
    sub: "demo-" + actor, username: actor, tideUserKey: "", realmRoles: [],
    isSteward: isDemoSteward(actor), canEncrypt: actor === "bao",
    canDecrypt: demoOpenError(cycle, actor) === null,
  };
}

export function demoSnapshot(state: DemoState, session: SessionView): CircleSnapshot {
  return {
    name: CIRCLE_NAME, contributionVnd: CONTRIBUTION_VND, memberCount: MEMBER_COUNT,
    synthetic: true, cycles: state.cycles, events: state.events, session,
  };
}

export function demoArtifact(cycle: DemoCycle): ReleaseArtifact {
  const policy = (access: "read" | "write"): StoredPolicy => ({
    recordId: cycle.recordId, access, policyB64: "demo-placeholder-not-a-signed-policy",
    subject: access === "write" ? { type: "User", id: "demo-bao" } : { type: "Role", id: cycle.releaseRole },
    expiresAt: 4_070_908_800, createdAt: DEMO_TIME,
  });
  return {
    cycle, ciphertext: cycle.sealed ? "DEMO_ONLY: " + cycle.recordId : null,
    readPolicy: policy("read"), writePolicy: policy("write"),
  };
}
