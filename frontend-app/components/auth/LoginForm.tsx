"use client";

import { FormEvent, useState } from "react";

import { login } from "@/lib/api/accounts";
import { ApiError } from "@/lib/api/client";
import { setStoredToken } from "@/lib/auth-storage";
import { Account } from "@/lib/types";

interface LoginFormProps {
  onSuccess: (account: Account) => void;
}

export function LoginForm({ onSuccess }: LoginFormProps) {
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
      onSuccess(response.account);
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError("Connexion impossible");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto w-full max-w-md space-y-4 rounded-xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-zinc-900">Connexion administrateur</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Accès réservé aux comptes Admin (Story 4.3 — contrat API 4.1).
        </p>
      </div>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-zinc-700">E-mail</span>
        <input
          type="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-emerald-600"
        />
      </label>

      <label className="block space-y-1 text-sm">
        <span className="font-medium text-zinc-700">Mot de passe</span>
        <input
          type="password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="w-full rounded-lg border border-zinc-300 px-3 py-2 outline-none focus:border-emerald-600"
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={loading}
        className="w-full rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-800 disabled:opacity-60"
      >
        {loading ? "Connexion…" : "Se connecter"}
      </button>
    </form>
  );
}
