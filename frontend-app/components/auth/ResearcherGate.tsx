"use client";

import Link from "next/link";
import { ReactNode } from "react";

import { ResearcherLoginForm } from "@/components/auth/AuthForms";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { btnGhost, panelClass } from "@/components/ui/styles";
import { Account } from "@/lib/types";

interface ResearcherGateProps {
  children: (account: Account, onLogout: () => void) => ReactNode;
}

function GateFrame({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <div className="flex flex-1 flex-col">{children}</div>
      <SiteFooter />
    </div>
  );
}

export function ResearcherGate({ children }: ResearcherGateProps) {
  const { account, loading, logout } = useAuth();

  async function handleLogout() {
    await logout();
  }

  if (loading) {
    return (
      <GateFrame>
        <div className="flex flex-1 items-center justify-center py-24">
          <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-slate">Vérification…</p>
        </div>
      </GateFrame>
    );
  }

  if (account && account.is_active) {
    return <>{children(account, handleLogout)}</>;
  }

  if (account && !account.is_active) {
    return (
      <GateFrame>
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <h2 className="font-display text-xl font-medium text-ink-black">Compte désactivé</h2>
          <p className="mt-3 font-serif text-sm text-slate">Contactez un administrateur pour réactiver votre accès.</p>
          <button type="button" onClick={() => void handleLogout()} className={`mt-6 ${btnGhost}`}>
            Se déconnecter
          </button>
        </div>
      </GateFrame>
    );
  }

  return (
    <GateFrame>
      <div className="mx-auto flex w-full max-w-md flex-col gap-4 px-6 py-16">
        <ResearcherLoginForm />
      </div>
    </GateFrame>
  );
}
