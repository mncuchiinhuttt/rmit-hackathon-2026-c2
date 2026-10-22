export const dynamic = "force-dynamic";
import { withAuth } from "@/features/auth/server/with-auth";
import { redeemEscrow } from "@/features/escrow/server/redeem-service";

export const POST = withAuth(redeemEscrow);
