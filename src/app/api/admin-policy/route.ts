export const dynamic = "force-dynamic";
import { withClientRole } from "@/features/auth/server/with-auth";
import { getAdminPolicy } from "@/features/governance/server/governance-service";

export const GET = withClientRole("realm-management", "tide-realm-admin", (_request, auth) => getAdminPolicy(auth));
