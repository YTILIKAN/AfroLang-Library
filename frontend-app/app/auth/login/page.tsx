"use client";

import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

import { ResearcherLoginForm } from "@/components/auth/AuthForms";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { pageShell, sectionGap } from "@/components/ui/styles";

function LoginContent() {
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirect") ?? "/contribute";

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <main className={`${pageShell} flex flex-1 items-center justify-center py-16`}>
        <ResearcherLoginForm redirectTo={redirectTo} />
      </main>
      <SiteFooter />
    </div>
  );
}

export default function AuthLoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-full flex-col">
          <SiteHeader />
          <main className={`${pageShell} ${sectionGap} flex-1 pt-12`}>
            <p className="font-serif text-sm text-slate">Chargement…</p>
          </main>
        </div>
      }
    >
      <LoginContent />
    </Suspense>
  );
}
