"use client";

import Link from "next/link";
import { ReactNode, useState } from "react";

import { AdminLoginForm } from "@/components/auth/AuthForms";
import { useAuth } from "@/components/auth/AuthProvider";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { btnDark, btnGhost } from "@/components/ui/styles";
import { clearStoredToken } from "@/lib/auth-storage";
import { Account } from "@/lib/types";

interface AdminGateProps {
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

export function AdminGate({ children }: AdminGateProps) {
  const { account, loading, logout, setAccount } = useAuth();
  const [loginRejected, setLoginRejected] = useState(false);

  const researcherBlocked = account !== null && account.role !== "admin";
  const showForbidden = researcherBlocked || loginRejected;

  async function handleLogout() {
    await logout();
    setLoginRejected(false);
  }

  function handleAdminSuccess(loggedIn: Account) {
    if (loggedIn.role !== "admin") {
      setLoginRejected(true);
      clearStoredToken();
      setAccount(null);
      return;
    }
    setLoginRejected(false);
  }

  if (account?.role === "admin") {
    return <>{children(account, handleLogout)}</>;
  }

  return (
    <GateFrame>
      {loading ? (
        <div className="flex flex-1 items-center justify-center py-24">
          <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-slate">Vérification…</p>
        </div>
      ) : showForbidden ? (
        <div className="mx-auto max-w-lg px-6 py-24 text-center">
          <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-graphite">Accès refusé</p>
          <h2 className="mt-2 font-display text-xl font-medium text-ink-black">Réservé aux administrateurs</h2>
          <p className="mt-3 font-serif text-sm text-slate">Votre compte chercheur ne peut pas accéder à cette interface.</p>
          <div className="mt-6 flex flex-wrap justify-center gap-2">
            <Link href="/contribute" className={btnDark}>
              Espace contribution
            </Link>
            <button type="button" onClick={() => void handleLogout()} className={btnGhost}>
              Se déconnecter
            </button>
          </div>
        </div>
      ) : (
        <div className="flex flex-1 items-center justify-center px-6 py-16">
          <AdminLoginForm onSuccess={handleAdminSuccess} />
        </div>
      )}
    </GateFrame>
  );
}
