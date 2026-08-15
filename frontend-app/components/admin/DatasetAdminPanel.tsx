"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { ErrorBanner, WorkflowHeader } from "@/components/layout/WorkflowShell";
import {
  btnDark,
  btnGhost,
  btnGhostDanger,
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
    <AdminShell
      active="datasets"
      adminName={adminName}
      onLogout={onLogout}
      actions={
        <button type="button" onClick={openCreateForm} className={btnOrange}>
          Ajouter un dataset
        </button>
      }
    >
      <WorkflowHeader
        eyebrow="Administration"
        title="Datasets de l'index"
        description="CRUD global sur toutes les entrées du catalogue."
      />

      {error ? <ErrorBanner message={error} /> : null}

      {formOpen ? (
        <form onSubmit={handleSubmit} className={`grid gap-4 p-5 ${panelClass}`}>
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

      <section className={`overflow-hidden ${panelClass}`}>
        {loading ? (
          <p className="p-4 font-serif text-sm text-slate">Chargement…</p>
        ) : sortedDatasets.length === 0 ? (
          <p className="p-4 font-serif text-sm text-slate">Aucun dataset dans l&apos;index.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className={tableHeadClass}>
                <tr>
                  <th className={`${tableCellClass} font-mono-ui text-[10px] font-medium uppercase text-slate`}>Titre</th>
                  <th className={`${tableCellClass} font-mono-ui text-[10px] font-medium uppercase text-slate`}>Langue</th>
                  <th className={`${tableCellClass} font-mono-ui text-[10px] font-medium uppercase text-slate`}>Tâches</th>
                  <th className={`${tableCellClass} font-mono-ui text-[10px] font-medium uppercase text-slate`}>Provenance</th>
                  <th className={`${tableCellClass} font-mono-ui text-[10px] font-medium uppercase text-slate`}>Source</th>
                  <th className={`${tableCellClass} text-right font-mono-ui text-[10px] font-medium uppercase text-slate`}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedDatasets.map((dataset) => (
                  <tr key={dataset.id} className="border-b border-hairline last:border-none">
                    <td className={`${tableCellClass} font-medium`}>{dataset.title}</td>
                    <td className={`${tableCellClass} text-graphite`}>
                      {dataset.language.name} ({dataset.language.code})
                    </td>
                    <td className={`${tableCellClass} text-graphite`}>
                      {dataset.tasks.map((task) => task.label).join(", ") || "inconnu"}
                    </td>
                    <td className={tableCellClass}>
                      <span className={tagClass}>{dataset.provenance}</span>
                    </td>
                    <td className={tableCellClass}>
                      <a
                        href={dataset.source_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-mono-ui text-[11px] uppercase tracking-[0.012em] text-schematic-blue hover:underline"
                      >
                        Ouvrir
                      </a>
                    </td>
                    <td className={`${tableCellClass} text-right`}>
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

      <p className="font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate">
        {sortedDatasets.length} entrée{sortedDatasets.length > 1 ? "s" : ""}
      </p>
    </AdminShell>
  );
}
