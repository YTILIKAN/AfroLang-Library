"use client";

import Link from "next/link";
import { FormEvent, useEffect, useState } from "react";

import { WorkflowHeader } from "@/components/layout/WorkflowShell";
import {
  btnDark,
  btnGhostDanger,
  btnOrange,
  inputClass,
  panelClass,
  tableCellClass,
  tableHeadClass,
  tagClass,
} from "@/components/ui/styles";
import { deleteMyDataset, listMyDatasets, updateMyDataset } from "@/lib/api/accounts";
import { ApiError } from "@/lib/api/client";
import { DatasetSummary } from "@/lib/types";

export function MyDatasetsPanel() {
  const [datasets, setDatasets] = useState<DatasetSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState("");
  const [saving, setSaving] = useState(false);

  async function reload() {
    setLoading(true);
    setError(null);
    try {
      const response = await listMyDatasets();
      setDatasets(response.datasets);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Chargement impossible");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    let cancelled = false;

    async function init() {
      setError(null);
      try {
        const response = await listMyDatasets();
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

  function startEdit(dataset: DatasetSummary) {
    setEditingId(dataset.id);
    setEditTitle(dataset.title);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditTitle("");
  }

  async function handleSave(event: FormEvent, datasetId: number) {
    event.preventDefault();
    setSaving(true);
    setError(null);
    try {
      await updateMyDataset(datasetId, { title: editTitle.trim() });
      cancelEdit();
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Mise à jour impossible");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete(dataset: DatasetSummary) {
    const confirmed = window.confirm(`Retirer « ${dataset.title} » de vos contributions ?`);
    if (!confirmed) {
      return;
    }
    setError(null);
    try {
      await deleteMyDataset(dataset.id);
      if (editingId === dataset.id) {
        cancelEdit();
      }
      await reload();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Suppression impossible");
    }
  }

  return (
    <div className="space-y-6">
      <WorkflowHeader
        eyebrow="Contribution"
        title="Mes datasets"
        description="Uniquement vos soumissions — modification et retrait."
        actions={
          <Link href="/contribute/submit" className={btnOrange}>
            Nouvelle soumission
          </Link>
        }
      />

      {error ? (
        <div className="border border-kente-red/20 bg-kente-red/5 px-4 py-3 font-serif text-sm">{error}</div>
      ) : null}

      <section className={`overflow-hidden ${panelClass}`}>
        {loading ? (
          <p className="font-serif text-sm text-slate">Chargement…</p>
        ) : datasets.length === 0 ? (
          <div className="space-y-4">
            <p className="font-serif text-sm text-slate">Aucune contribution pour le moment.</p>
            <Link href="/contribute/submit" className={`inline-flex ${btnDark}`}>
              Soumettre un dataset
            </Link>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left">
              <thead className={tableHeadClass}>
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
                {datasets.map((dataset) => (
                  <tr key={dataset.id} className="border-b border-hairline last:border-none align-top">
                    <td className="px-4 py-3">
                      {editingId === dataset.id ? (
                        <form
                          onSubmit={(event) => void handleSave(event, dataset.id)}
                          className="flex min-w-[12rem] flex-col gap-2"
                        >
                          <input
                            required
                            value={editTitle}
                            onChange={(event) => setEditTitle(event.target.value)}
                            className={inputClass}
                          />
                          <div className="flex gap-2">
                            <button type="submit" disabled={saving} className={btnGhostDanger}>
                              {saving ? "…" : "Enregistrer"}
                            </button>
                            <button type="button" onClick={cancelEdit} className={btnGhostDanger}>
                              Annuler
                            </button>
                          </div>
                        </form>
                      ) : (
                        <span className="font-serif text-sm font-medium text-ink-black">{dataset.title}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 font-serif text-sm text-graphite">{dataset.language.code}</td>
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
                        <button
                          type="button"
                          onClick={() => startEdit(dataset)}
                          disabled={editingId !== null && editingId !== dataset.id}
                          className={btnGhostDanger}
                        >
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

      {!loading && datasets.length > 0 ? (
        <p className="font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate">
          {datasets.length} contribution{datasets.length > 1 ? "s" : ""}
        </p>
      ) : null}
    </div>
  );
}
