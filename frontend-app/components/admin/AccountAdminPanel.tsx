"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { ErrorBanner, WorkflowHeader } from "@/components/layout/WorkflowShell";
import {
  btnDark,
  btnGhost,
  btnOrange,
  inputClass,
  labelMono,
  panelClass,
  selectClass,
  tableCellClass,
  tableHeadClass,
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
    <AdminShell
      active="accounts"
      adminName={adminName}
      onLogout={onLogout}
      actions={
        <button type="button" onClick={() => setFormOpen((open) => !open)} className={btnOrange}>
          {formOpen ? "Fermer" : "Créer un compte"}
        </button>
      }
    >
      <WorkflowHeader
        eyebrow="Administration"
        title="Comptes utilisateurs"
        description="Création, attribution de rôles et activation des comptes."
      />

      {error ? <ErrorBanner message={error} /> : null}

      {formOpen ? (
        <form onSubmit={handleCreate} className={`grid gap-4 p-5 sm:grid-cols-2 ${panelClass}`}>
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

      <section className={`overflow-hidden ${panelClass}`}>
        {loading ? (
          <p className="p-4 font-serif text-sm text-slate">Chargement…</p>
        ) : sortedAccounts.length === 0 ? (
          <p className="p-4 font-serif text-sm text-slate">Aucun compte enregistré.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className={tableHeadClass}>
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
                      {account.is_super_admin ? (
                        <span className={`ml-2 ${tagClass}`}>super admin</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 font-serif text-sm text-graphite">{account.email}</td>
                    <td className="px-4 py-3">
                      <select
                        value={account.role}
                        onChange={(event) =>
                          void handleRoleChange(account, event.target.value as AccountRole)
                        }
                        disabled={account.is_super_admin === true}
                        className={`${selectClass} disabled:cursor-not-allowed`}
                        aria-label={`Rôle de ${account.display_name}`}
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
                        disabled={
                          account.is_super_admin === true ||
                          (account.id === currentAccountId && account.is_active)
                        }
                        className={`${btnGhost} disabled:cursor-not-allowed`}
                        aria-label={`${account.is_active ? "Désactiver" : "Réactiver"} ${account.display_name}`}
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

      <p className="font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate">
        {sortedAccounts.length} compte{sortedAccounts.length > 1 ? "s" : ""}
      </p>
    </AdminShell>
  );
}
