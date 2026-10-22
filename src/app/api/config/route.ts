import { loadTideConfig, publicTideConfig } from "@/features/auth/server/tide-config";

export const dynamic = "force-dynamic";

export function GET() {
  try {
    return Response.json(publicTideConfig(loadTideConfig()), {
      headers: { "Cache-Control": "no-store", "X-Content-Type-Options": "nosniff" },
    });
  } catch {
    return Response.json({ error: "Local Tide configuration is not ready", code: "SETUP_REQUIRED" }, {
      status: 503, headers: { "Cache-Control": "no-store" },
    });
  }
}
