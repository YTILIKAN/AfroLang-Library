"use client";

import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

import { btnDark, inputClass, labelMono } from "@/components/ui/styles";

interface CatalogSearchBarProps {
  defaultQuery?: string;
  label?: string;
  placeholder?: string;
  submitLabel?: string;
  /** `compact` tient dans une barre de navigation : libellé masqué, bouton réduit. */
  variant?: "default" | "compact";
}

/** Entrée compacte vers `/catalog` — page d'accueil et écrans sans formulaire complet. */
export function CatalogSearchBar({
  defaultQuery = "",
  label = "Rechercher",
  placeholder = "Langue, tâche, titre — Yoruba, ASR, corpus…",
  submitLabel = "Explorer",
  variant = "default",
}: CatalogSearchBarProps) {
  const router = useRouter();
  const [query, setQuery] = useState(defaultQuery);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/catalog?q=${encodeURIComponent(trimmed)}` : "/catalog");
  }

  if (variant === "compact") {
    return (
      <form onSubmit={handleSubmit} role="search" className="flex items-center gap-2">
        <label className="min-w-0">
          <span className="sr-only">{label}</span>
          <input
            type="search"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder={placeholder}
            className="w-44 rounded-sm border border-hairline bg-pure-white px-3 py-1.5 font-serif text-sm text-ink-black outline-none transition focus:border-terracotta/60 focus:ring-1 focus:ring-terracotta/20 xl:w-56"
          />
        </label>
        <button
          type="submit"
          aria-label={submitLabel}
          className="inline-flex shrink-0 items-center justify-center rounded-sm bg-ink-black px-2.5 py-1.5 font-mono-ui text-[11px] font-medium text-cream-paper transition hover:bg-indigo-deep"
        >
          →
        </button>
      </form>
    );
  }

  return (
    <form onSubmit={handleSubmit} role="search" className="flex flex-col gap-3 sm:flex-row sm:items-end">
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
