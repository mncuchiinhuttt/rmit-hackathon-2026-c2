"use client";

import { useAuthCallback } from "@tidecloak/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";

export default function AuthCallback() {
  const router = useRouter();
  const { isProcessing, isSuccess, error } = useAuthCallback({
    onSuccess: returnUrl => {
      const safePath = typeof returnUrl === 'string' && returnUrl.startsWith('/') &&
        !returnUrl.startsWith('//') && !returnUrl.includes('\\') ? returnUrl : '/';
      router.replace(safePath);
    },
    onError: () => router.replace('/'),
    onMissingVerifierRedirectTo: '/',
  });
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    if (!params.has('code') && !params.has('error')) router.replace('/');
  }, [router]);
  return (
    <section className="mx-auto flex min-h-[100dvh] max-w-lg flex-col justify-center gap-4 px-6">
      <h1 className="text-xl font-semibold">{error ? 'Sign-in needs attention' : 'Completing Tide sign-in'}</h1>
      <p role={error ? 'alert' : 'status'} className="text-sm text-muted-foreground">
        {error ? 'Tide could not complete this session. Return to the circle and try signing in again.' : isProcessing || !isSuccess ? 'Verifying your browser-bound session.' : 'Returning to your circle.'}
      </p>
      {error && <Link href="/" className="w-fit underline underline-offset-4">Return to circle</Link>}
    </section>
  );
}
