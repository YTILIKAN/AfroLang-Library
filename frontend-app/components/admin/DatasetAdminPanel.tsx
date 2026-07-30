"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { AdminNav } from "@/components/admin/AdminNav";
import {
  btnDark,
  btnGhost,
  btnGhostDanger,
  btnOrange,
  cardElevated,
  inputClass,
  labelMono,
  pageShell,
  selectClass,
  tagClass,
} from "@/components/ui/styles";
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
    <div className={`${pageShell} flex flex-col gap-8 py-10`}>
      <header className="flex flex-col gap-6 border-b border-hairline pb-8">
        <AdminNav active="datasets" />
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className={labelMono}>Administration</p>
            <h1 className="mt-2 text-[36px] font-medium leading-[1.11] tracking-[0.012em] text-ink-black">
              Datasets de l&apos;index
            </h1>
            <p className="mt-2 font-serif text-sm leading-relaxed text-slate">
              Connecté en tant que {adminName} — CRUD global (FR-19, Story 4.3).
            </p>
          </div>
          <div className="flex gap-2">
            <button type="button" onClick={openCreateForm} className={btnOrange}>
              Ajouter un dataset
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
        <form onSubmit={handleSubmit} className={`grid gap-4 ${cardElevated}`}>
          <h2 className="font-mono-ui text-sm font-medium uppercase tracking-[0.012em] text-ink-black">
            {isEditing ? "Modifier le dataset" : "Nouveau dataset"}
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 sm:col-span-2">
              <span className={labelMono}>Titre</span>
              <input
                required
                value={form.title}
                onChange={(event) => setForm({ ...form, title: event.target.value })}
                className={inputClass}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className={labelMono}>Lien source (source_url)</span>
              <input
                required
                type="url"
                value={form.source_url}
                onChange={(event) => setForm({ ...form, source_url: event.target.value })}
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelMono}>Langue (code ou alias)</span>
              <input
                required
                value={form.language}
                onChange={(event) => setForm({ ...form, language: event.target.value })}
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelMono}>Tâche NLP</span>
              <input
                required
                value={form.task}
                onChange={(event) => setForm({ ...form, task: event.target.value })}
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelMono}>Provenance</span>
              <select
                value={form.provenance}
                onChange={(event) => setForm({ ...form, provenance: event.target.value as Provenance })}
                className={`${inputClass} ${selectClass}`}
              >
                {PROVENANCE_OPTIONS.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            </label>

            <label className="space-y-2">
              <span className={labelMono}>Format</span>
              <input
                value={form.data_format ?? ""}
                onChange={(event) => setForm({ ...form, data_format: event.target.value })}
                className={inputClass}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className={labelMono}>Description</span>
              <textarea
                rows={3}
                value={form.description ?? ""}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className={inputClass}
              />
            </label>
          </div>

          <div className="flex gap-2">
            <button type="submit" disabled={saving} className={btnDark}>
              {saving ? "Enregistrement…" : isEditing ? "Mettre à jour" : "Créer"}
            </button>
            <button type="button" onClick={closeForm} className={btnGhost}>
              Annuler
            </button>
          </div>
        </form>
      ) : null}

      <section className={`overflow-hidden ${cardElevated}`}>
        {loading ? (
          <p className="font-serif text-sm text-slate">Chargement des datasets…</p>
        ) : sortedDatasets.length === 0 ? (
          <p className="font-serif text-sm text-slate">Aucun dataset dans l&apos;index.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className="border-b border-hairline font-mono-ui text-[10px] uppercase tracking-[0.015em] text-slate">
                <tr>
                  <th className="px-4 py-3 font-medium">Titre</th>
                  <th className="px-4 py-3 font-medium">Langue</th>
                  <th className="px-4 py-3 font-medium">Tâches</th>
                  <th className="px-4 py-3 font-medium">Provenance</th>
                  <th className="px-4 py-3 font-medium">Source</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedDatasets.map((dataset) => (
                  <tr key={dataset.id} className="border-b border-hairline last:border-none">
                    <td className="px-4 py-3 font-serif text-sm font-medium text-ink-black">{dataset.title}</td>
                    <td className="px-4 py-3 font-serif text-sm text-graphite">
                      {dataset.language.name} ({dataset.language.code})
                    </td>
                    <td className="px-4 py-3 font-serif text-sm text-graphite">
                      {dataset.tasks.map((task) => task.label).join(", ") || "inconnu"}
                    </td>
                    <td className="px-4 py-3">
                      <span className={tagClass}>{dataset.provenance}</span>
                    </td>
                    <td className="px-4 py-3">
                      <a
                        href={dataset.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono-ui text-[11px] uppercase tracking-[0.012em] text-schematic-blue hover:underline"
                      >
                        Ouvrir
                      </a>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-2">
                        <button type="button" onClick={() => openEditForm(dataset)} className={btnGhostDanger}>
                          Modifier
                        </button>
                        <button type="button" onClick={() => void handleDelete(dataset)} className={btnGhostDanger}>
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

      <p className="font-mono-ui text-[10px] uppercase tracking-[0.015em] text-slate">
        {sortedDatasets.length} dataset{sortedDatasets.length > 1 ? "s" : ""} — API /accounts/admin/datasets
      </p>
    </div>
  );
}
