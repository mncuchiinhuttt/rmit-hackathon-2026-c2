"use client";

import dynamic from "next/dynamic";

// The real callback requires browser PKCE state and a mounted Tide provider.
const BrowserAuthCallback = dynamic(() => import("./auth-callback"), {
  ssr: false,
  loading: () => <p role="status" className="p-6 text-sm text-muted-foreground">Completing Tide sign-in...</p>,
});

export function BrowserAuthRedirect() {
  return <BrowserAuthCallback />;
}
