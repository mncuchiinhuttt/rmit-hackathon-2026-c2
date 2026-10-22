export const dynamic = "force-dynamic";
import { getMembers } from "@/features/circle/server/circle-service";
import { withClientRole } from "@/features/auth/server/with-auth";

export const GET = withClientRole("realm-management", "tide-realm-admin", getMembers);
