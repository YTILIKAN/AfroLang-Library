"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";

import {
  btnDark,
  btnGhost,
  cardElevated,
  inputClass,
  labelMono,
  selectClass,
} from "@/components/ui/styles";
import { submitDataset } from "@/lib/api/accounts";
import { ApiError } from "@/lib/api/client";
import { SubmitDatasetInput, SubmitDatasetResult } from "@/lib/types";

const TASK_OPTIONS = [
  { value: "asr", label: "ASR" },
  { value: "nmt", label: "Traduction (NMT)" },
  { value: "classification", label: "Classification" },
  { value: "ner", label: "NER" },
  { value: "tts", label: "TTS" },
  { value: "summarization", label: "Résumé" },
];

const FORMAT_OPTIONS = [
  { value: "", label: "—" },
  { value: "text", label: "Texte" },
  { value: "audio", label: "Audio" },
  { value: "tabular", label: "Tabulaire" },
];

const EMPTY_FORM: SubmitDatasetInput = {
  title: "",
  source_url: "",
  language: "",
  task: "asr",
  description: "",
  license_name: "",
  data_format: "",
  size: "",
};

interface SubmitDatasetFormProps {
  onSuccess?: (result: SubmitDatasetResult) => void;
}

export function SubmitDatasetForm({ onSuccess }: SubmitDatasetFormProps) {
  const [form, setForm] = useState<SubmitDatasetInput>(EMPTY_FORM);
  const [noPublicApi, setNoPublicApi] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<SubmitDatasetResult | null>(null);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // Une source sans API publique passe par le même endpoint : c'est le serveur qui lui
    // donne l'origine `manuel` à partir de ce drapeau (FR-5, AD-15).
    const payload: SubmitDatasetInput = {
      title: form.title.trim(),
      source_url: form.source_url.trim(),
      language: form.language.trim(),
      task: form.task,
      manual_source: noPublicApi,
    };

    if (form.description?.trim()) payload.description = form.description.trim();
    if (form.license_name?.trim()) payload.license_name = form.license_name.trim();
    if (form.data_format?.trim()) payload.data_format = form.data_format.trim();
    if (form.size?.trim()) payload.size = form.size.trim();

    try {
      const result = await submitDataset(payload);
      setSuccess(result);
      setForm(EMPTY_FORM);
      setNoPublicApi(false);
      onSuccess?.(result);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Soumission impossible");
    } finally {
      setLoading(false);
    }
  }

  if (success) {
    return (
      <div className={`max-w-xl space-y-4 ${cardElevated}`}>
        <p className={labelMono}>Soumission enregistrée</p>
        <h2 className="text-[26px] font-medium leading-[1.23] text-ink-black">{success.title}</h2>
        <p className="font-serif text-sm leading-relaxed text-slate">
          Dataset #{success.id} — provenance {success.provenance}. Visible dans l&apos;index après
          traitement (bouchon : liste « mes datasets »).
        </p>
        <div className="flex flex-wrap gap-2">
          <Link href="/contribute/mine" className={btnDark}>
            Mes datasets
          </Link>
          <button
            type="button"
            onClick={() => setSuccess(null)}
            className={btnGhost}
          >
            Nouvelle soumission
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className={`max-w-2xl space-y-6 ${cardElevated}`}>
      <div>
        <p className={labelMono}>Contribution</p>
        <h2 className="mt-2 text-[26px] font-medium leading-[1.23] text-ink-black">Soumettre un dataset</h2>
        <p className="mt-2 font-serif text-sm leading-relaxed text-slate">
          Métadonnées + lien source — provenance rattachée à votre compte (FR-17, Story 3.5).
        </p>
      </div>

      <label className="block space-y-2">
        <span className={labelMono}>Titre</span>
        <input
          required
          value={form.title}
          onChange={(e) => setForm({ ...form, title: e.target.value })}
          className={inputClass}
        />
      </label>

      <label className="block space-y-2">
        <span className={labelMono}>URL source</span>
        <input
          required
          type="url"
          value={form.source_url}
          onChange={(e) => setForm({ ...form, source_url: e.target.value })}
          placeholder="https://…"
          className={inputClass}
        />
        <span className="font-serif text-[13px] text-slate">
          Page web, dépôt Git ou lien direct — y compris sources sans API (FR-5).
        </span>
      </label>

      <label className="flex items-start gap-3">
        <input
          type="checkbox"
          checked={noPublicApi}
          onChange={(e) => setNoPublicApi(e.target.checked)}
          className="mt-1 h-4 w-4 rounded-sm border-hairline"
        />
        <span className="font-serif text-sm leading-relaxed text-slate">
          Source sans API publique (référencement manuel)
        </span>
      </label>

      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2">
          <span className={labelMono}>Langue</span>
          <input
            required
            value={form.language}
            onChange={(e) => setForm({ ...form, language: e.target.value })}
            placeholder="twi, Yoruba…"
            className={inputClass}
          />
        </label>

        <label className="space-y-2">
          <span className={labelMono}>Tâche NLP</span>
          <select
            required
            value={form.task}
            onChange={(e) => setForm({ ...form, task: e.target.value })}
            className={`${inputClass} ${selectClass}`}
          >
            {TASK_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className={labelMono}>Licence</span>
          <input
            value={form.license_name ?? ""}
            onChange={(e) => setForm({ ...form, license_name: e.target.value })}
            placeholder="CC BY 4.0"
            className={inputClass}
          />
        </label>

        <label className="space-y-2">
          <span className={labelMono}>Format</span>
          <select
            value={form.data_format ?? ""}
            onChange={(e) => setForm({ ...form, data_format: e.target.value })}
            className={`${inputClass} ${selectClass}`}
          >
            {FORMAT_OPTIONS.map((option) => (
              <option key={option.value || "any"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 sm:col-span-2">
          <span className={labelMono}>Taille</span>
          <input
            value={form.size ?? ""}
            onChange={(e) => setForm({ ...form, size: e.target.value })}
            placeholder="500 MB"
            className={inputClass}
          />
        </label>

        <label className="space-y-2 sm:col-span-2">
          <span className={labelMono}>Description</span>
          <textarea
            rows={3}
            value={form.description ?? ""}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            className={inputClass}
          />
        </label>
      </div>

      {error ? (
        <p className="border border-hairline bg-fog px-3 py-2 font-serif text-sm text-ink-black">{error}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="submit" disabled={loading} className={btnDark}>
          {loading ? "Envoi…" : "Soumettre"}
        </button>
        <Link href="/contribute" className={btnGhost}>
          Annuler
        </Link>
      </div>
    </form>
  );
}
