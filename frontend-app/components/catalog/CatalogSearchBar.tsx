"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { btnDark, inputClass, labelMono } from "@/components/ui/styles";

interface CatalogSearchBarProps {
  defaultQuery?: string;
  label?: string;
  placeholder?: string;
  submitLabel?: string;
}

/** Entrée compacte vers `/catalog` — page d'accueil et écrans sans formulaire complet. */
export function CatalogSearchBar({
  defaultQuery = "",
  label = "Rechercher",
  placeholder = "Langue, tâche, titre — Yoruba, ASR, corpus…",
  submitLabel = "Explorer",
}: CatalogSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/catalog?q=${encodeURIComponent(trimmed)}` : "/catalog");
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row sm:items-end">
      <label className="min-w-0 flex-1 space-y-2">
        <span className={labelMono}>{label}</span>
        <input
          type="search"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
      </label>
      <button type="submit" className={`${btnDark} sm:shrink-0`}>
        {submitLabel}
      </button>
    </form>
  );
}
