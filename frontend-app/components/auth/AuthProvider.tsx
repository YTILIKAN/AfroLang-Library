"use client";

import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from "react";

import { fetchMe, logout as apiLogout } from "@/lib/api/accounts";
import { clearStoredToken, getStoredToken } from "@/lib/auth-storage";
import { Account } from "@/lib/types";

interface AuthContextValue {
  account: Account | null;
  loading: boolean;
  setAccount: (account: Account | null) => void;
  refreshSession: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [account, setAccount] = useState<Account | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshSession = useCallback(async () => {
    const token = getStoredToken();
    if (!token) {
      setAccount(null);
      return;
    }
    try {
      setAccount(await fetchMe());
    } catch {
      clearStoredToken();
      setAccount(null);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function init() {
      await refreshSession();
      if (!cancelled) {
        setLoading(false);
      }
    }

    void init();
    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  const logout = useCallback(async () => {
    try {
      await apiLogout();
    } catch {
      // Jeton déjà invalide.
    }
    clearStoredToken();
    setAccount(null);
  }, []);

  const value = useMemo(
    () => ({ account, loading, setAccount, refreshSession, logout }),
    [account, loading, refreshSession, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth doit être utilisé dans AuthProvider");
  }
  return context;
}
