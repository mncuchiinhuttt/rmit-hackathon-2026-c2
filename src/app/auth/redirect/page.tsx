"use client";

import dynamic from "next/dynamic";

// The Tide callback reads window/PKCE state and cannot run during server rendering.
const BrowserAuthCallback = dynamic(() => import('@/features/auth/components/auth-callback'), {
  ssr: false,
  loading: () => <p role="status" className="p-6 text-sm text-muted-foreground">Completing Tide sign-in...</p>,
});

export default function AuthRedirectPage() {
  return <BrowserAuthCallback />;
}
