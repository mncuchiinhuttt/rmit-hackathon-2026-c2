export const dynamic = "force-dynamic";
import { getCircle } from "@/features/circle/server/circle-service";
import { withRealmRole } from "@/features/auth/server/with-auth";

export const GET = withRealmRole("appUser", (_request, auth) => getCircle(auth));
