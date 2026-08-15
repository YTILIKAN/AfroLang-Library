"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { btnDark, btnGhost, inputClass, labelMono, selectClass } from "@/components/ui/styles";
import { DatasetFilterParams } from "@/lib/types";

/**
 * Slugs de source connus de l'index : les deux connecteurs (Stories 1.4 et 1.5) et les deux
 * origines de contribution posées par `contributor_service` — `contribution` pour une source
 * dotée d'une API, `manual` pour une source qui n'en a pas (FR-5, Story 3.2).
 */
const SOURCE_OPTIONS = [
  { value: "", label: "—" },
  { value: "huggingface", label: "Hugging Face" },
  { value: "kaggle", label: "Kaggle" },
  { value: "contribution", label: "Contribution" },
  { value: "manual", label: "Manuel" },
];

const TASK_OPTIONS = [
  { value: "", label: "—" },
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
  { value: "inconnu", label: "Inconnu" },
];

interface DatasetFilterFormProps {
  defaults?: DatasetFilterParams;
}

export function DatasetFilterForm({ defaults = {} }: DatasetFilterFormProps) {
  const router = useRouter();
  const [language, setLanguage] = useState(defaults.language ?? "");
  const [source, setSource] = useState(defaults.source ?? "");
  const [task, setTask] = useState(defaults.task ?? "");
  const [dataFormat, setDataFormat] = useState(defaults.data_format ?? "");
  const [validationError, setValidationError] = useState<string | null>(null);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const params: DatasetFilterParams = {};
    const trimmedLanguage = language.trim();
    const trimmedSource = source.trim();
    const trimmedTask = task.trim();
    const trimmedFormat = dataFormat.trim();

    if (trimmedLanguage) params.language = trimmedLanguage;
    if (trimmedSource) params.source = trimmedSource;
    if (trimmedTask) params.task = trimmedTask;
    if (trimmedFormat) params.data_format = trimmedFormat;

    if (Object.keys(params).length === 0) {
      setValidationError("Au moins un filtre requis : langue, source, tâche ou format.");
      return;
    }

    setValidationError(null);
    const query = new URLSearchParams(params as Record<string, string>);
    router.push(`/filter?${query.toString()}`);
  }

  function handleReset() {
    setLanguage("");
    setSource("");
    setTask("");
    setDataFormat("");
    setValidationError(null);
    router.push("/filter");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <label className="space-y-2 sm:col-span-2">
          <span className={labelMono}>Langue</span>
          <input
            type="search"
            value={language}
            onChange={(event) => setLanguage(event.target.value)}
            placeholder="Swahili, yor, Wolof…"
            className={inputClass}
          />
        </label>

        <label className="space-y-2">
          <span className={labelMono}>Source</span>
          <select
            value={source}
            onChange={(event) => setSource(event.target.value)}
            className={`${inputClass} ${selectClass}`}
          >
            {SOURCE_OPTIONS.map((option) => (
              <option key={option.value || "any"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2">
          <span className={labelMono}>Tâche NLP</span>
          <select value={task} onChange={(event) => setTask(event.target.value)} className={`${inputClass} ${selectClass}`}>
            {TASK_OPTIONS.map((option) => (
              <option key={option.value || "any"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label className="space-y-2 sm:col-span-2">
          <span className={labelMono}>Format de données</span>
          <select
            value={dataFormat}
            onChange={(event) => setDataFormat(event.target.value)}
            className={`${inputClass} ${selectClass}`}
          >
            {FORMAT_OPTIONS.map((option) => (
              <option key={option.value || "any"} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>
      </div>

      {validationError ? (
        <p className="border border-hairline bg-fog px-3 py-2 font-serif text-sm text-ink-black">{validationError}</p>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="submit" className={btnDark}>
          Appliquer les filtres
        </button>
        <button type="button" onClick={handleReset} className={btnGhost}>
          Réinitialiser
        </button>
      </div>
    </form>
  );
}
