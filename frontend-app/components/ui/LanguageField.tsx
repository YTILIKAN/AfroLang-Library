"use client";

import { useEffect, useId, useState } from "react";

import { inputClass, labelMono } from "@/components/ui/styles";
import { listLanguages } from "@/lib/api/catalog";
import { SupportedLanguage } from "@/lib/types";

/**
 * Vocabulaire de langues servi par `GET /api/v1/languages` (FR-11).
 *
 * Un échec de chargement ne bloque pas la saisie : la liste reste vide et le champ se
 * comporte comme une saisie libre, que le serveur valide de toute façon.
 */
export function useSupportedLanguages(): SupportedLanguage[] {
  const [languages, setLanguages] = useState<SupportedLanguage[]>([]);

  useEffect(() => {
    let active = true;
    listLanguages()
      .then((response) => {
        if (active) setLanguages(response.languages);
      })
      .catch(() => {
        if (active) setLanguages([]);
      });
    return () => {
      active = false;
    };
  }, []);

  return languages;
}

interface LanguageFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  className?: string;
}

/**
 * Champ langue à liste de suggestions : les langues couvertes sont proposées, mais une
 * langue pas encore indexée reste saisissable via son code ISO 639-3. L'aide énonce ce
 * format, seule information qu'un contributeur ne peut pas deviner ; elle est repliée
 * derrière l'icône du libellé pour ne pas alourdir le formulaire.
 */
export function LanguageField({
  label,
  value,
  onChange,
  required,
  className = "space-y-2",
}: LanguageFieldProps) {
  const languages = useSupportedLanguages();
  const [hintOpen, setHintOpen] = useState(false);
  const inputId = useId();
  const listId = useId();
  const hintId = useId();

  return (
    <div className={className}>
      <div className="flex items-center gap-2">
        <label htmlFor={inputId} className={labelMono}>
          {label}
        </label>
        <button
          type="button"
          onClick={() => setHintOpen((open) => !open)}
          aria-expanded={hintOpen}
          aria-controls={hintId}
          aria-label="Aide sur la saisie de la langue"
          className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-hairline font-mono-ui text-[10px] leading-none text-graphite transition hover:border-terracotta hover:text-terracotta"
        >
          <span aria-hidden="true">?</span>
        </button>
      </div>
      <input
        id={inputId}
        list={listId}
        required={required}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder="yor, wol, swh…"
        className={inputClass}
      />
      <datalist id={listId}>
        {languages.map((language) => (
          <option key={language.code} value={language.code}>
            {language.name}
          </option>
        ))}
      </datalist>
      {hintOpen ? (
        <p id={hintId} className="font-serif text-[13px] text-slate">
          Pour une langue absente de la liste, saisissez son code ISO 639-3 à 3 lettres.
        </p>
      ) : null}
    </div>
  );
}
