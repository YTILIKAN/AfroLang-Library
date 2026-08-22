"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { LanguageFormMode, buildLanguageHref } from "@/components/catalog/language-links";
import { btnDark, inputClass, labelMono } from "@/components/ui/styles";

interface LanguageSearchFormProps {
  defaultLanguage?: string;
  compact?: boolean;
  mode?: LanguageFormMode;
  submitLabel?: string;
}

export function LanguageSearchForm({
  defaultLanguage = "",
  compact = false,
  mode = "search",
  submitLabel,
}: LanguageSearchFormProps) {
  const router = useRouter();
  const [language, setLanguage] = useState(defaultLanguage);
  const buttonLabel = submitLabel ?? (mode === "overview" ? "Explorer" : "Rechercher");

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = language.trim();
    if (!trimmed) {
      return;
    }
    router.push(buildLanguageHref(mode, trimmed));
  }

  return (
    <form onSubmit={handleSubmit} className={compact ? "flex flex-col gap-3 sm:flex-row sm:items-end" : "space-y-4"}>
      <label className={compact ? "min-w-0 flex-1 space-y-2" : "block space-y-2"}>
        <span className={labelMono}>Langue</span>
        <input
          type="search"
          required
          value={language}
          onChange={(event) => setLanguage(event.target.value)}
          placeholder="Yoruba, wol, Swahili…"
          className={inputClass}
        />
      </label>
      <button type="submit" className={`${btnDark} ${compact ? "sm:shrink-0" : "w-full sm:w-auto"}`}>
        {buttonLabel}
      </button>
    </form>
  );
}
