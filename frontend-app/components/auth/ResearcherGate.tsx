"use client";

import Link from "next/link";
import { ReactNode } from "react";

import { ResearcherLoginForm } from "@/components/auth/AuthForms";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { btnGhost, cardElevated } from "@/components/ui/styles";
import { Account } from "@/lib/types";

interface ResearcherGateProps {
  children: (account: Account, onLogout: () => void) => ReactNode;
}

export function ResearcherGate({ children }: ResearcherGateProps) {
  const { account, loading, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  if (loading) {
    return (
      <div className="flex min-h-full flex-col">
        <SiteHeader />
        <div className="flex flex-1 items-center justify-center py-24">
          <p className="font-mono-ui text-[11px] uppercase tracking-[0.015em] text-slate">
            Vérification de la session…
          </p>
        </div>
      </div>
    );
  }

  if (account && account.is_active) {
    return (
      <div className="flex min-h-full flex-col">
        <SiteHeader />
        {children(account, handleLogout)}
      </div>
    );
  }

  if (account && !account.is_active) {
    return (
      <div className="flex min-h-full flex-col">
        <SiteHeader />
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <h2 className="text-[26px] font-medium leading-[1.23] text-ink-black">Compte désactivé</h2>
          <p className="mt-3 font-serif text-sm leading-relaxed text-slate">
            Contactez un administrateur pour réactiver votre accès.
          </p>
          <button type="button" onClick={() => void handleLogout()} className={`mt-6 ${btnGhost}`}>
            Se déconnecter
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <div className="mx-auto flex w-full max-w-md flex-col gap-6 px-6 py-16">
        <ResearcherLoginForm />
        <div className={`text-center ${cardElevated}`}>
          <p className="font-serif text-sm text-slate">Nouveau sur AfroLang-Library ?</p>
          <Link href="/auth/register" className={`mt-4 inline-flex ${btnGhost}`}>
            Créer un compte chercheur
          </Link>
        </div>
      </div>
    </div>
  );
}
