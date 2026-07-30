"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { AdminNav } from "@/components/admin/AdminNav";
import {
  createAdminDataset,
  deleteAdminDataset,
  listAdminDatasets,
  updateAdminDataset,
} from "@/lib/api/accounts";
import { ApiError } from "@/lib/api/client";
import {
  AdminDatasetCreateInput,
  DatasetSummary,
  Provenance,
} from "@/lib/types";

const PROVENANCE_OPTIONS: Provenance[] = ["synchronisé", "contribué", "manuel"];

const EMPTY_FORM: AdminDatasetCreateInput = {
  title: "",
  source_url: "",
  language: "",
  task: "",
  provenance: "manuel",
  source_slug: "manual",
  description: "",
  data_format: "text",
};

interface DatasetAdminPanelProps {
  onLogout: () => void;
  adminName: string;
}

export function DatasetAdminPanel({ onLogout, adminName }: DatasetAdminPanelProps) {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState<AdminDatasetCreateInput>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);

  const isEditing = editingId !== null;

  const sortedDatasets = useMemo(
    () => [...datasets].sort((a, b) => a.title.localeCompare(b.title, "fr")),
    [datasets],
  );

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setLoading(true);
      setError(null);
      try {
        const response = await listAdminDatasets();
        if (!cancelled) {
          setDatasets(response.datasets);
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

  async function refreshDatasets() {
    setLoading(true);
    setError(null);
    try {
      const response = await listAdminDatasets();
      setDatasets(response.datasets);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }

  function openCreateForm() {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEditForm(dataset: DatasetSummary) {
    setEditingId(dataset.id);
    setForm({
      title: dataset.title,
      source_url: dataset.source_url,
      language: dataset.language.code,
      task: dataset.tasks[0]?.code ?? "inconnu",
      provenance: dataset.provenance,
      source_slug: dataset.source.slug,
      description: dataset.description === "inconnu" ? "" : dataset.description,
      data_format: dataset.data_format === "inconnu" ? "" : dataset.data_format,
      size: dataset.size === "inconnu" ? "" : dataset.size,
    });
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditingId(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (isEditing && editingId !== null) {
        await updateAdminDataset(editingId, form);
      } else {
        await createAdminDataset(form);
      }
      closeForm();
      await refreshDatasets();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Enregistrement impossible");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(dataset: DatasetSummary) {
    const confirmed = window.confirm(`Supprimer « ${dataset.title} » ?`);
    if (!confirmed) {
      return;
    }

    setError(null);
    try {
      await deleteAdminDataset(dataset.id);
      await refreshDatasets();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Suppression impossible");
    }
  }

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6 px-4 py-8">
      <header className="flex flex-col gap-4 border-b border-zinc-200 pb-6">
        <AdminNav active="datasets" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">Administration</p>
          <h1 className="text-2xl font-semibold text-zinc-900">Datasets de l&apos;index</h1>
          <p className="mt-1 text-sm text-zinc-600">
            Connecté en tant que {adminName} — CRUD global (FR-19, Story 4.3).
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={openCreateForm}
            className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800"
          >
            Ajouter un dataset
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
        <form onSubmit={handleSubmit} className="grid gap-4 rounded-xl border border-zinc-200 bg-zinc-50 p-5">
          <h2 className="text-lg font-semibold text-zinc-900">
            {isEditing ? "Modifier le dataset" : "Nouveau dataset"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-medium">Titre</span>
              <input
                required
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-medium">Lien source (source_url)</span>
              <input
                required
                type="url"
                value={form.source_url}
                onChange={(event) => setForm({ ...form, source_url: event.target.value })}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium">Langue (code ou alias)</span>
              <input
                required
                value={form.language}
                onChange={(event) => setForm({ ...form, language: event.target.value })}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium">Tâche NLP</span>
              <input
                required
                value={form.task}
                onChange={(event) => setForm({ ...form, task: event.target.value })}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium">Provenance</span>
              <select
                value={form.provenance}
                onChange={(event) => setForm({ ...form, provenance: event.target.value as Provenance })}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              >
                {PROVENANCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-1 text-sm">
              <span className="font-medium">Format</span>
              <input
                value={form.data_format ?? ""}
                onChange={(event) => setForm({ ...form, data_format: event.target.value })}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>

            <label className="space-y-1 text-sm sm:col-span-2">
              <span className="font-medium">Description</span>
              <textarea
                rows={3}
                value={form.description ?? ""}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
            </label>
          </div>

          <div className="flex gap-2">
            <button
              type="submit"
              disabled={saving}
              className="rounded-lg bg-emerald-700 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-800 disabled:opacity-60"
            >
              {saving ? "Enregistrement…" : isEditing ? "Mettre à jour" : "Créer"}
            </button>
            <button
              type="button"
              onClick={closeForm}
              className="rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-white"
            >
              Annuler
            </button>
          </div>
        </form>
      ) : null}

      <section className="overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-sm">
        {loading ? (
          <p className="p-6 text-sm text-zinc-600">Chargement des datasets…</p>
        ) : sortedDatasets.length === 0 ? (
          <p className="p-6 text-sm text-zinc-600">Aucun dataset dans l&apos;index.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 text-xs uppercase tracking-wide text-zinc-600">
                <tr>
                  <th className="px-4 py-3">Titre</th>
                  <th className="px-4 py-3">Langue</th>
                  <th className="px-4 py-3">Tâches</th>
                  <th className="px-4 py-3">Provenance</th>
                  <th className="px-4 py-3">Source</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedDatasets.map((dataset) => (
                  <tr key={dataset.id} className="border-b border-zinc-100 last:border-none">
                    <td className="px-4 py-3 font-medium text-zinc-900">{dataset.title}</td>
                    <td className="px-4 py-3 text-zinc-700">
                      {dataset.language.name} ({dataset.language.code})
                    </td>
                    <td className="px-4 py-3 text-zinc-700">
                      {dataset.tasks.map((task) => task.label).join(", ") || "inconnu"}
                    </td>
                    <td className="px-4 py-3">
                      <span className="rounded-full bg-zinc-100 px-2 py-1 text-xs font-medium text-zinc-700">
                        {dataset.provenance}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={dataset.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-emerald-700 hover:underline"
                      >
                        Ouvrir
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          onClick={() => openEditForm(dataset)}
                          className="rounded-md border border-zinc-300 px-2 py-1 text-xs font-medium hover:bg-zinc-50"
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(dataset)}
                          className="rounded-md border border-red-200 px-2 py-1 text-xs font-medium text-red-700 hover:bg-red-50"
                        >
                          Supprimer
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <p className="text-xs text-zinc-500">
        {sortedDatasets.length} dataset{sortedDatasets.length > 1 ? "s" : ""} — API{" "}
        <code className="rounded bg-zinc-100 px-1">/accounts/admin/datasets</code>
      </p>
    </div>
  );
}
