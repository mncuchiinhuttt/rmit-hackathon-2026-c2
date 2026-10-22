import type { Metadata } from "next";
import { connection } from "next/server";
import { readAuthMode } from "@/features/auth/server/auth-mode";
import { Providers } from "./providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "Hostless Hui — authority that rotates",
  description: "A synthetic savings circle with Tide-governed access to encrypted release packages.",
  robots: { index: false, follow: false },
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  await connection();
  return (
    <html lang="en">
      <body><Providers mode={readAuthMode()}>{children}</Providers></body>
    </html>
  );
}
