export const dynamic = "force-dynamic";
import { withClientRole, withRealmRole } from "@/features/auth/server/with-auth";
import { getPolicies, storePolicy } from "@/features/releases/server/release-service";

export const GET = withRealmRole("appUser", (request) => getPolicies(request));
export const POST = withClientRole("realm-management", "tide-realm-admin", storePolicy);
