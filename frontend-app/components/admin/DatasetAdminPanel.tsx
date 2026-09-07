"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

import { AdminShell } from "@/components/layout/AdminShell";
import { ErrorBanner, WorkflowHeader } from "@/components/layout/WorkflowShell";
import { LanguageField } from "@/components/ui/LanguageField";
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
  AdminDatasetUpdateInput,
  DatasetSummary,
  Provenance,
} from "@/lib/types";

const PROVENANCE_OPTIONS: Provenance[] = ["synchronisé", "contribué", "manuel"];

/** Sentinelle de métadonnée absente, commune à tout l'index (FR-8, Story 1.7). */
const UNKNOWN = "inconnu";

/** Champs texte facultatifs du contrat admin datasets (Story 4.1). */
const OPTIONAL_FIELDS = ["description", "data_format", "size", "license_name"] as const;

interface AdminDatasetForm {
  title: string;
  source_url: string;
  language: string;
  task: string;
  provenance: Provenance;
  source_slug: string;
  description: string;
  data_format: string;
  size: string;
  license_name: string;
}

const EMPTY_FORM: AdminDatasetForm = {
  title: "",
  source_url: "",
  language: "",
  task: "",
  provenance: "manuel",
  source_slug: "manual",
  description: "",
  data_format: "",
  size: "",
  license_name: "",
};

/** Une métadonnée absente est stockée « inconnu » ; le formulaire l'affiche vide. */
function displayValue(value: string | null | undefined): string {
  return !value || value === UNKNOWN ? "" : value;
}

function formFromDataset(dataset: DatasetSummary): AdminDatasetForm {
  return {
    title: dataset.title,
    source_url: dataset.source_url,
    language: dataset.language.code,
    task: dataset.tasks[0]?.code ?? "",
    provenance: dataset.provenance,
    source_slug: dataset.source.slug,
    description: displayValue(dataset.description),
    data_format: displayValue(dataset.data_format),
    size: displayValue(dataset.size),
    license_name: displayValue(dataset.license?.name),
  };
}

function buildCreateInput(form: AdminDatasetForm): AdminDatasetCreateInput {
  const input: AdminDatasetCreateInput = {
    title: form.title.trim(),
    source_url: form.source_url.trim(),
    language: form.language.trim(),
    task: form.task.trim(),
    provenance: form.provenance,
    source_slug: form.source_slug.trim() || "manual",
  };

  for (const field of OPTIONAL_FIELDS) {
    const value = form[field].trim();
    if (value) {
      input[field] = value;
    }
  }

  return input;
}

/**
 * PATCH ne transporte que ce que l'admin a réellement modifié : un champ laissé tel quel
 * n'est pas envoyé, sinon le serveur écraserait la valeur existante — y compris les tâches
 * secondaires, remplacées dès que `task` est fourni (contrat 4.1).
 */
function buildUpdateInput(form: AdminDatasetForm, original: DatasetSummary): AdminDatasetUpdateInput {
  const base = formFromDataset(original);
  const patch: AdminDatasetUpdateInput = {};

  if (form.title.trim() !== base.title) {
    patch.title = form.title.trim();
  }
  if (form.source_url.trim() !== base.source_url) {
    patch.source_url = form.source_url.trim();
  }
  if (form.language.trim() !== base.language) {
    patch.language = form.language.trim();
  }
  if (form.task.trim() !== base.task) {
    patch.task = form.task.trim();
  }
  if (form.provenance !== base.provenance) {
    patch.provenance = form.provenance;
  }
  if (form.source_slug.trim() !== base.source_slug) {
    patch.source_slug = form.source_slug.trim();
  }

  for (const field of OPTIONAL_FIELDS) {
    const value = form[field].trim();
    if (value === base[field]) {
      continue;
    }
    // Champ vidé volontairement : on repose la sentinelle plutôt qu'une chaîne vide.
    patch[field] = value || UNKNOWN;
  }

  return patch;
}

function matchesQuery(dataset: DatasetSummary, query: string): boolean {
  const haystack = [
    dataset.title,
    dataset.language.name,
    dataset.language.code,
    dataset.source.name,
    dataset.source.slug,
    dataset.provenance,
  ]
    .join(" ")
    .toLowerCase();
  return haystack.includes(query);
}

interface DatasetAdminPanelProps {
  onLogout: () => void;
  adminName: string;
}

export function DatasetAdminPanel({ onLogout, adminName }: DatasetAdminPanelProps) {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [editing, setEditing] = useState<DatasetSummary | null>(null);
  const [form, setForm] = useState<AdminDatasetForm>(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [query, setQuery] = useState("");

  const isEditing = editing !== null;

  const sortedDatasets = useMemo(
    () => [...datasets].sort((a, b) => a.title.localeCompare(b.title, "fr")),
    [datasets],
  );

  const visibleDatasets = useMemo(() => {
    const folded = query.trim().toLowerCase();
    if (!folded) {
      return sortedDatasets;
    }
    return sortedDatasets.filter((dataset) => matchesQuery(dataset, folded));
  }, [sortedDatasets, query]);

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
    setEditing(null);
    setForm(EMPTY_FORM);
    setFormOpen(true);
  }

  function openEditForm(dataset: DatasetSummary) {
    setEditing(dataset);
    setForm(formFromDataset(dataset));
    setFormOpen(true);
  }

  function closeForm() {
    setFormOpen(false);
    setEditing(null);
    setForm(EMPTY_FORM);
  }

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSaving(true);
    setError(null);

    try {
      if (editing !== null) {
        const patch = buildUpdateInput(form, editing);
        if (Object.keys(patch).length > 0) {
          await updateAdminDataset(editing.id, patch);
        }
      } else {
        await createAdminDataset(buildCreateInput(form));
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
        description="Vue global sur toutes les entrées du catalogue."
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

            <LanguageField
              label="Langue (code ou alias)"
              required
              value={form.language}
              onChange={(language) => setForm({ ...form, language })}
            />

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
              <span className={labelMono}>Source (slug)</span>
              <input
                required
                value={form.source_slug}
                onChange={(event) => setForm({ ...form, source_slug: event.target.value })}
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelMono}>Format</span>
              <input
                value={form.data_format}
                onChange={(event) => setForm({ ...form, data_format: event.target.value })}
                className={inputClass}
              />
            </label>

            <label className="space-y-2">
              <span className={labelMono}>Taille</span>
              <input
                value={form.size}
                onChange={(event) => setForm({ ...form, size: event.target.value })}
                className={inputClass}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className={labelMono}>Licence</span>
              <input
                value={form.license_name}
                onChange={(event) => setForm({ ...form, license_name: event.target.value })}
                className={inputClass}
              />
            </label>

            <label className="space-y-2 sm:col-span-2">
              <span className={labelMono}>Description</span>
              <textarea
                rows={3}
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className={inputClass}
              />
            </label>
          </div>

          {editing && editing.tasks.length > 1 ? (
            <p className="font-serif text-sm text-slate">
              Ce dataset porte plusieurs tâches ({editing.tasks.map((task) => task.label).join(", ")}) ;
              modifier le champ « Tâche NLP » les remplacera toutes par la valeur saisie.
            </p>
          ) : null}

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

      <label className="flex flex-col gap-2">
        <span className={labelMono}>Filtrer la liste (titre, langue, source, origine)</span>
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="yoruba, huggingface, manuel…"
          className={`${inputClass} sm:max-w-md`}
        />
      </label>

      <section className={`overflow-hidden ${panelClass}`}>
        {loading ? (
          <p className="p-4 font-serif text-sm text-slate">Chargement…</p>
        ) : sortedDatasets.length === 0 ? (
          <p className="p-4 font-serif text-sm text-slate">Aucun dataset dans l&apos;index.</p>
        ) : visibleDatasets.length === 0 ? (
          <p className="p-4 font-serif text-sm text-slate">Aucun dataset ne correspond au filtre.</p>
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
                {visibleDatasets.map((dataset) => (
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
                        <button
                          type="button"
                          onClick={() => openEditForm(dataset)}
                          className={btnGhostDanger}
                          aria-label={`Modifier ${dataset.title}`}
                        >
                          Modifier
                        </button>
                        <button
                          type="button"
                          onClick={() => void handleDelete(dataset)}
                          className={btnGhostDanger}
                          aria-label={`Supprimer ${dataset.title}`}
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

      <p className="font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate">
        {query.trim()
          ? `${visibleDatasets.length} / ${sortedDatasets.length} datasets`
          : `${sortedDatasets.length} entrée${sortedDatasets.length > 1 ? "s" : ""}`}
      </p>
    </AdminShell>
  );
}
