"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { FormEvent, useState } from "react";

import { useAuth } from "@/components/auth/AuthProvider";
import {
  btnOrange,
  inputClass,
  labelMono,
  panelClass,
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
    <form onSubmit={handleSubmit} className={`mx-auto w-full max-w-md space-y-5 p-6 ${panelClass}`}>
      <div className="border-b border-hairline pb-4">
        <p className={labelMono}>Administration</p>
        <h2 className="mt-1 font-display text-xl font-medium text-ink-black">Connexion admin</h2>
        <p className="mt-2 font-serif text-sm text-slate">Accès réservé aux comptes administrateurs.</p>
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

export function ResearcherLoginForm({ redirectTo }: ResearcherLoginFormProps) {
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
      // Sans destination explicite, un admin va dans sa console plutôt que dans
      // l'espace contribution, qui ne montre que les fonctions chercheur.
      router.push(
        redirectTo ?? (response.account.role === "admin" ? "/admin/datasets" : "/contribute"),
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Connexion impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`mx-auto w-full max-w-md space-y-5 p-6 ${panelClass}`}>
      <div className="border-b border-hairline pb-4">
        <p className={labelMono}>Contribution</p>
        <h2 className="mt-1 font-display text-xl font-medium text-ink-black">Connexion</h2>
        <p className="mt-2 font-serif text-sm text-slate">Connectez-vous pour contribuer des datasets à l&apos;index.</p>
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
