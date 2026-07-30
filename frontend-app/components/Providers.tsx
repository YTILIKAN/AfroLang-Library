"use client";

import { AuthProvider } from "@/components/auth/AuthProvider";

export function AppProviders({ children }: { children: React.ReactNode }) {
  return <AuthProvider>{children}</AuthProvider>;
}
