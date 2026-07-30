"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { AdminNav } from "@/components/admin/AdminNav";
import {
  createAdminAccount,
  listAdminAccounts,
  updateAdminAccount,
} from "@/lib/api/accounts";
import { ApiError } from "@/lib/api/client";
import { Account, AccountRole, AdminAccountCreateInput } from "@/lib/types";

const ROLE_OPTIONS: AccountRole[] = ["chercheur", "admin"];

const EMPTY_FORM: AdminAccountCreateInput = {
  email: "",
  password: "",
  display_name: "",
  role: "chercheur",
};

interface AccountAdminPanelProps {
  onLogout: () => void;
  adminName: string;
  currentAccountId: number;
}

export function AccountAdminPanel({ onLogout, adminName, currentAccountId }: AccountAdminPanelProps) {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] = useState<AdminAccountCreateInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const sortedAccounts = useMemo(
    () => [...accounts].sort((a, b) => a.display_name.localeCompare(b.display_name, "fr")),
    [accounts],
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        const response = await listAdminAccounts();
        if (!cancelled) {
          setAccounts(response.accounts);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : "Chargement impossible");
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

  async function refreshAccounts() {
    setLoading(true);
    setError(null);
    try {
      const response = await listAdminAccounts();
      setAccounts(response.accounts);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }

  async function handleCreate(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await createAdminAccount(form);
      setForm(EMPTY_FORM);
      setFormOpen(false);
      await refreshAccounts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Création impossible");
    } finally {
      setSaving(false);
    }
  }

  async function handleToggleActive(account: Account) {
    if (account.id === currentAccountId && account.is_active) {
      setError("Vous ne pouvez pas désactiver votre propre compte");
      return;
    }

    setError(null);
    try {
      await updateAdminAccount(account.id, { is_active: !account.is_active });
      await refreshAccounts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Mise à jour impossible");
    }
  }

  async function handleRoleChange(account: Account, role: AccountRole) {
    setError(null);
    try {
      await updateAdminAccount(account.id, { role });
      await refreshAccounts();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Mise à jour impossible");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-4 border-b border-zinc-200 pb-6">
        <AdminNav active="accounts" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">Administration</p>
            <h1 className="text-2xl font-semibold text-zinc-900">Comptes utilisateurs</h1>
            <p className="mt-1 text-sm text-zinc-600">
              Connecté en tant que {adminName} — gestion des rôles (FR-20, Story 4.4).
            </p>
          </div>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setFormOpen((open) => !open)}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
            >
              {formOpen ? "Fermer le formulaire" : "Créer un compte"}
            </button>
            <button
              type="button"
              onClick={onLogout}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
            >
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>
      ) : null}

      {formOpen ? (
        <form onSubmit={handleCreate} className="grid gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-5 sm:grid-cols-2">
          <h2 className="text-lg font-semibold text-zinc-900 sm:col-span-2">Nouveau compte</h2>

          <label className="space-y-1 text-sm">
            <span className="font-medium">E-mail</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Mot de passe</span>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Nom affiché</span>
            <input
              required
              value={form.display_name}
              onChange={(event) => setForm({ ...form, display_name: event.target.value })}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="font-medium">Rôle</span>
            <select
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value as AccountRole })}
              className="w-full rounded-lg border border-zinc-300 px-3 py-2"
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <div className="sm:col-span-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {saving ? "Création…" : "Créer le compte"}
            </button>
          </div>
        </form>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-zinc-600">Chargement des comptes…</p>
        ) : sortedAccounts.length === 0 ? (
          <p className="p-6 text-sm text-zinc-600">Aucun compte enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600">
                <tr>
                  <th className="px-4 py-3">Nom</th>
                  <th className="px-4 py-3">E-mail</th>
                  <th className="px-4 py-3">Rôle</th>
                  <th className="px-4 py-3">Statut</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAccounts.map((account) => (
                  <tr key={account.id} className="border-b border-zinc-100 last:border-none">
                    <td className="px-4 py-3 font-medium text-zinc-900">{account.display_name}</td>
                    <td className="px-4 py-3 text-zinc-700">{account.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={account.role}
                        onChange={(event) =>
                          void handleRoleChange(account, event.target.value as AccountRole)
                        }
                        className="rounded-md border border-zinc-300 px-2 py-1 text-sm"
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`rounded-full px-2 py-1 text-xs font-medium ${
                          account.is_active
                            ? "bg-emerald-100 text-emerald-800"
                            : "bg-zinc-200 text-zinc-700"
                        }`}
                      >
                        {account.is_active ? "Actif" : "Désactivé"}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(account)}
                        disabled={account.id === currentAccountId && account.is_active}
                        className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        {account.is_active ? "Désactiver" : "Réactiver"}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-zinc-500">
        {sortedAccounts.length} compte{sortedAccounts.length > 1 ? "s" : ""} — API{" "}
        <code className="rounded bg-zinc-100 px-1">/accounts/admin/accounts</code>
      </p>
    </div>
  );
}
