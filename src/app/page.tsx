import { CirclePage } from "@/features/circle/components/circle-page";
import { readAuthMode } from "@/features/auth/server/auth-mode";
import { SqliteDemoPage } from "@/features/demo/components/sqlite-demo-page";

export default function Page() {
  return readAuthMode() === "simulated" ? <SqliteDemoPage /> : <CirclePage />;
}
