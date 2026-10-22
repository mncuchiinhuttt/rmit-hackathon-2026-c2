export const dynamic = "force-dynamic";
import { withRealmRole, withRealmRoles } from "@/features/auth/server/with-auth";
import { getPayout, sealPayout } from "@/features/releases/server/release-service";

export const GET = withRealmRole("appUser", (request) => getPayout(request));
export const POST = withRealmRoles(["appUser", "_tide_encryptor"], sealPayout);
