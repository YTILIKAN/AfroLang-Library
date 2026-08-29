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

interface CatalogExplorerFormProps {
  defaults?: DatasetFilterParams;
}

/**
 * Formulaire unique du catalogue : une recherche plein texte et quatre facettes.
 *
 * Il remplace les anciens écrans `/search`, `/filter` et `/languages` — trois formulaires
 * qui interrogeaient le même index, dont deux sur le seul champ « langue ».
 */
export function CatalogExplorerForm({ defaults = {} }: CatalogExplorerFormProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaults.q ?? "");
  const [language, setLanguage] = useState(defaults.language ?? "");
  const [source, setSource] = useState(defaults.source ?? "");
  const [task, setTask] = useState(defaults.task ?? "");
  const [dataFormat, setDataFormat] = useState(defaults.data_format ?? "");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();

    const params: DatasetFilterParams = {};
    if (query.trim()) params.q = query.trim();
    if (language.trim()) params.language = language.trim();
    if (source.trim()) params.source = source.trim();
    if (task.trim()) params.task = task.trim();
    if (dataFormat.trim()) params.data_format = dataFormat.trim();

    // Aucun critère n'est plus une erreur : `/catalog` sans paramètre affiche l'index complet.
    const search = new URLSearchParams(params as Record<string, string>).toString();
    router.push(search ? `/catalog?${search}` : "/catalog");
  }

  function handleReset() {
    setQuery("");
    setLanguage("");
    setSource("");
    setTask("");
    setDataFormat("");
    router.push("/catalog");
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-5">
      <label className="block space-y-2">
        <span className={labelMono}>Rechercher</span>
        <div className="flex flex-col gap-3 sm:flex-row">
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Titre, description, langue — corpus ASR, Yoruba, traduction…"
            className={`${inputClass} min-w-0 flex-1`}
          />
          <button type="submit" className={`${btnDark} sm:shrink-0`}>
            Rechercher
          </button>
        </div>
      </label>

      <div className="space-y-4 border-t border-hairline pt-5">
        <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-slate">
          Affiner — les critères se cumulent
        </p>

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="space-y-2 sm:col-span-2">
            <span className={labelMono}>Langue</span>
            <input
              type="search"
              value={language}
              onChange={(event) => setLanguage(event.target.value)}
              placeholder="Swahili, yor, Wolof — code ISO 639-3 ou alias"
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
            <select
              value={task}
              onChange={(event) => setTask(event.target.value)}
              className={`${inputClass} ${selectClass}`}
            >
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

        <div className="flex flex-wrap gap-2">
          <button type="submit" className={btnDark}>
            Appliquer
          </button>
          <button type="button" onClick={handleReset} className={btnGhost}>
            Réinitialiser
          </button>
        </div>
      </div>
    </form>
  );
}
