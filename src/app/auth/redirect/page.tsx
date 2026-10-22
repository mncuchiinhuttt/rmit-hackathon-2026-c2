import { redirect } from "next/navigation";
import { BrowserAuthRedirect } from "@/features/auth/components/browser-auth-redirect";
import { readAuthMode } from "@/features/auth/server/auth-mode";

export default function AuthRedirectPage() {
  if (readAuthMode() === "simulated") redirect("/");
  return <BrowserAuthRedirect />;
}
