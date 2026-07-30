"use client";

import { ReactNode, useEffect, useState } from "react";

import { LoginForm } from "@/components/auth/LoginForm";
import { fetchMe, logout as apiLogout } from "@/lib/api/accounts";
import { ApiError } from "@/lib/api/client";
import { clearStoredToken, getStoredToken } from "@/lib/auth-storage";
import { Account } from "@/lib/types";

interface AdminGateProps {
  children: (account: Account, onLogout: () => void) => ReactNode;
}

export function AdminGate({ children }: AdminGateProps) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);
  const [forbidden, setForbidden] = useState(false);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      const token = getStoredToken();
      if (!token) {
        if (!cancelled) {
          setAccount(null);
          setForbidden(false);
          setLoading(false);
        }
        return;
      }

      try {
        const me = await fetchMe();
        if (cancelled) {
          return;
        }
        if (me.role !== "admin") {
          setForbidden(true);
          setAccount(null);
        } else {
          setForbidden(false);
          setAccount(me);
        }
      } catch (err) {
        if (cancelled) {
          return;
        }
        clearStoredToken();
        setAccount(null);
        setForbidden(false);
        if (err instanceof ApiError && err.status === 403) {
          setForbidden(true);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleLogout() {
    try {
      await apiLogout();
    } catch {
      // Jeton déjà invalide — on nettoie localement.
    }
    clearStoredToken();
    setAccount(null);
    setForbidden(false);
  }

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center text-sm text-zinc-600">
        Vérification de la session…
      </div>
    );
  }

  if (forbidden) {
    return (
      <div className="mx-auto max-w-lg rounded-xl border border-amber-200 bg-amber-50 p-6 text-center">
        <h2 className="text-lg font-semibold text-amber-900">Accès refusé</h2>
        <p className="mt-2 text-sm text-amber-800">
          Cette interface est réservée aux administrateurs (AD-14).
        </p>
        <button
          type="button"
          onClick={handleLogout}
          className="mt-4 rounded-lg border border-amber-300 px-4 py-2 text-sm font-medium text-amber-900 hover:bg-amber-100"
        >
          Se déconnecter
        </button>
      </div>
    );
  }

  if (!account) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center px-4">
        <LoginForm
          onSuccess={(loggedIn) => {
            if (loggedIn.role !== "admin") {
              setForbidden(true);
              clearStoredToken();
              return;
            }
            setAccount(loggedIn);
          }}
        />
      </div>
    );
  }

  return <>{children(account, handleLogout)}</>;
}
