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
import { login, register } from "@/lib/api/accounts";
import { ApiError } from "@/lib/api/client";
import { setStoredToken } from "@/lib/auth-storage";

export function RegisterForm() {
  const router = useRouter();
  const { setAccount } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setLoading(true);

    try {
      await register({ email, password, display_name: displayName });
      const session = await login(email, password);
      setStoredToken(session.access_token);
      setAccount(session.account);
      router.push("/contribute");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Inscription impossible");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className={`mx-auto w-full max-w-md space-y-5 p-6 ${panelClass}`}>
      <div className="border-b border-hairline pb-4">
        <p className={labelMono}>Contribution</p>
        <h2 className="mt-1 font-display text-xl font-medium text-ink-black">Créer un compte</h2>
        <p className="mt-2 font-serif text-sm text-slate">
          Compte chercheur — la consultation publique reste accessible sans inscription.
        </p>
      </div>

      <label className="block space-y-2">
        <span className={labelMono}>Nom affiché</span>
        <input
          required
          value={displayName}
          onChange={(e) => setDisplayName(e.target.value)}
          className={inputClass}
        />
      </label>

      <label className="block space-y-2">
        <span className={labelMono}>E-mail</span>
        <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className={inputClass} />
      </label>

      <label className="block space-y-2">
        <span className={labelMono}>Mot de passe</span>
        <input
          type="password"
          required
          minLength={8}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className={inputClass}
        />
      </label>

      {error ? (
        <p className="border border-hairline bg-fog px-3 py-2 font-serif text-sm text-ink-black">{error}</p>
      ) : null}

      <button type="submit" disabled={loading} className={`w-full ${btnOrange}`}>
        {loading ? "Création…" : "Créer le compte"}
      </button>

      <p className="text-center font-serif text-sm text-slate">
        Déjà inscrit ?{" "}
        <Link href="/auth/login" className="text-schematic-blue hover:underline">
          Se connecter
        </Link>
      </p>
    </form>
  );
}
