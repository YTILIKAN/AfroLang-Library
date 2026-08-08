"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  btnOrange,
  cardElevated,
  inputClass,
  labelMono,
} from "@/components/ui/styles";
import { login } from "@/lib/api/accounts";
import { ApiError } from "@/lib/api/client";
import { setStoredToken } from "@/lib/auth-storage";
import { Account } from "@/lib/types";

interface AdminLoginFormProps {
  onSuccess?: (account: Account) => void;
}

export function AdminLoginForm({ onSuccess }: AdminLoginFormProps) {
  const { setAccount } = useAuth();
  const [email, setEmail] = useState("admin@afriland.org");
  const [password, setPassword] = useState("admin123");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await login(email, password);
      setStoredToken(response.access_token);
      setAccount(response.account);
      onSuccess?.(response.account);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`mx-auto w-full max-w-md space-y-6 ${cardElevated}`}>
      <div>
        <p className={labelMono}>Administration</p>
        <h2 className="mt-2 text-[26px] font-medium leading-[1.23] tracking-[0.012em] text-ink-black">
          Connexion admin
        </h2>
        <p className="mt-2 font-serif text-sm leading-relaxed text-slate">
          Accès réservé aux comptes administrateurs (Story 4.3).
        </p>
      </div>

      <label className="block space-y-2">
        <span className={labelMono}>E-mail</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </label>

      <label className="block space-y-2">
        <span className={labelMono}>Mot de passe</span>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </label>

      {error ? (
        <p className="border border-hairline bg-fog px-3 py-2 font-serif text-sm text-ink-black">{error}</p>
      ) : null}

      <button type="submit" disabled={loading} className={`w-full ${btnOrange}`}>
        {loading ? "Connexion…" : "Se connecter"}
      </button>

      <p className="text-center font-serif text-sm text-slate">
        Chercheur ?{" "}
        <Link href="/auth/login" className="text-schematic-blue hover:underline">
          Connexion publique
        </Link>
      </p>
    </form>
  );
}

interface ResearcherLoginFormProps {
  redirectTo?: string;
}

export function ResearcherLoginForm({ redirectTo = "/contribute" }: ResearcherLoginFormProps) {
  const router = useRouter();
  const { setAccount } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      const response = await login(email, password);
      if (!response.account.is_active) {
        setError("Ce compte est désactivé.");
        return;
      }
      setStoredToken(response.access_token);
      setAccount(response.account);
      router.push(redirectTo);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`mx-auto w-full max-w-md space-y-6 ${cardElevated}`}>
      <div>
        <p className={labelMono}>Contribution</p>
        <h2 className="mt-2 text-[26px] font-medium leading-[1.23] tracking-[0.012em] text-ink-black">
          Connexion
        </h2>
        <p className="mt-2 font-serif text-sm leading-relaxed text-slate">
          Connectez-vous pour contribuer des datasets à l&apos;index (FR-16, Story 3.4).
        </p>
      </div>

      <label className="block space-y-2">
        <span className={labelMono}>E-mail</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </label>

      <label className="block space-y-2">
        <span className={labelMono}>Mot de passe</span>
        <input
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </label>

      {error ? (
        <p className="border border-hairline bg-fog px-3 py-2 font-serif text-sm text-ink-black">{error}</p>
      ) : null}

      <button type="submit" disabled={loading} className={`w-full ${btnOrange}`}>
        {loading ? "Connexion…" : "Se connecter"}
      </button>

      <p className="text-center font-serif text-sm text-slate">
        Pas encore de compte ?{" "}
        <Link href="/auth/register" className="text-schematic-blue hover:underline">
          Créer un compte
        </Link>
      </p>
    </form>
  );
}
