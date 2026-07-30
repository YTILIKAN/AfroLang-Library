"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { AdminNav } from "@/components/admin/AdminNav";
import {
  btnDark,
  btnGhost,
  btnOrange,
  cardElevated,
  inputClass,
  labelMono,
  pageShell,
  selectClass,
  tagClass,
} from "@/components/ui/styles";
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
    <div className={`${pageShell} flex flex-col gap-8 py-10`}>
      <header className="flex flex-col gap-6 border-b border-hairline pb-8">
        <AdminNav active="accounts" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={labelMono}>Administration</p>
            <h1 className="mt-2 text-[36px] font-medium leading-[1.11] tracking-[0.012em] text-ink-black">
              Comptes utilisateurs
            </h1>
            <p className="mt-2 font-serif text-sm leading-relaxed text-slate">
              Connecté en tant que {adminName} — gestion des rôles (FR-20, Story 4.4).
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={() => setFormOpen((open) => !open)} className={btnOrange}>
              {formOpen ? "Fermer le formulaire" : "Créer un compte"}
            </button>
            <button type="button" onClick={onLogout} className={btnGhost}>
              Déconnexion
            </button>
          </div>
        </div>
      </header>

      {error ? (
        <div className="border border-hairline bg-fog px-4 py-3 font-serif text-sm text-ink-black">{error}</div>
      ) : null}

      {formOpen ? (
        <form onSubmit={handleCreate} className={`grid gap-4 sm:grid-cols-2 ${cardElevated}`}>
          <h2 className="font-mono-ui text-sm font-medium uppercase tracking-[0.012em] text-ink-black sm:col-span-2">
            Nouveau compte
          </h2>

          <label className="space-y-2">
            <span className={labelMono}>E-mail</span>
            <input
              type="email"
              required
              value={form.email}
              onChange={(event) => setForm({ ...form, email: event.target.value })}
              className={inputClass}
            />
          </label>

          <label className="space-y-2">
            <span className={labelMono}>Mot de passe</span>
            <input
              type="password"
              required
              minLength={8}
              value={form.password}
              onChange={(event) => setForm({ ...form, password: event.target.value })}
              className={inputClass}
            />
          </label>

          <label className="space-y-2">
            <span className={labelMono}>Nom affiché</span>
            <input
              required
              value={form.display_name}
              onChange={(event) => setForm({ ...form, display_name: event.target.value })}
              className={inputClass}
            />
          </label>

          <label className="space-y-2">
            <span className={labelMono}>Rôle</span>
            <select
              value={form.role}
              onChange={(event) => setForm({ ...form, role: event.target.value as AccountRole })}
              className={`${inputClass} ${selectClass}`}
            >
              {ROLE_OPTIONS.map((role) => (
                <option key={role} value={role}>
                  {role}
                </option>
              ))}
            </select>
          </label>

          <div className="sm:col-span-2">
            <button type="submit" disabled={saving} className={btnDark}>
              {saving ? "Création…" : "Créer le compte"}
            </button>
          </div>
        </form>
      ) : null}

      <section className={`overflow-hidden ${cardElevated}`}>
        {loading ? (
          <p className="font-serif text-sm text-slate">Chargement des comptes…</p>
        ) : sortedAccounts.length === 0 ? (
          <p className="font-serif text-sm text-slate">Aucun compte enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-hairline font-mono-ui text-[10px] uppercase tracking-[0.015em] text-slate">
                <tr>
                  <th className="px-4 py-3 font-medium">Nom</th>
                  <th className="px-4 py-3 font-medium">E-mail</th>
                  <th className="px-4 py-3 font-medium">Rôle</th>
                  <th className="px-4 py-3 font-medium">Statut</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedAccounts.map((account) => (
                  <tr key={account.id} className="border-b border-hairline last:border-none">
                    <td className="px-4 py-3 font-serif text-sm font-medium text-ink-black">
                      {account.display_name}
                    </td>
                    <td className="px-4 py-3 font-serif text-sm text-graphite">{account.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={account.role}
                        onChange={(event) =>
                          void handleRoleChange(account, event.target.value as AccountRole)
                        }
                        className={selectClass}
                      >
                        {ROLE_OPTIONS.map((role) => (
                          <option key={role} value={role}>
                            {role}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={tagClass}>{account.is_active ? "Actif" : "Désactivé"}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <button
                        type="button"
                        onClick={() => void handleToggleActive(account)}
                        disabled={account.id === currentAccountId && account.is_active}
                        className={`${btnGhost} disabled:cursor-not-allowed`}
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

      <p className="font-mono-ui text-[10px] uppercase tracking-[0.015em] text-slate">
        {sortedAccounts.length} compte{sortedAccounts.length > 1 ? "s" : ""} — API /accounts/admin/accounts
      </p>
    </div>
  );
}
