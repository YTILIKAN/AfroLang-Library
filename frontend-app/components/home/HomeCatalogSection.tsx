"use client";

import Link from "next/link";
import { useState } from "react";

import { DatasetCard } from "@/components/catalog/DatasetCard";
import { btnDark, btnGhost, pageShell } from "@/components/ui/styles";
import { DatasetSummary } from "@/lib/types";

/** Nombre de fiches révélées par palier dans une section du catalogue. */
export const CATALOG_PAGE_SIZE = 10;

interface HomeCatalogSectionProps {
  datasets: DatasetSummary[];
  total: number;
  loadError: boolean;
  loading?: boolean;
}

export function HomeCatalogSection({ datasets, total, loadError, loading = false }: HomeCatalogSectionProps) {
  const [visibleCount, setVisibleCount] = useState(CATALOG_PAGE_SIZE);

  const collapsible = datasets.length > CATALOG_PAGE_SIZE;
  const shownCount = collapsible ? Math.min(visibleCount, datasets.length) : datasets.length;
  const remaining = datasets.length - shownCount;
  const expanded = remaining === 0;
  const nextStep = Math.min(CATALOG_PAGE_SIZE, remaining);

  return (
    <section className="border-t border-hairline bg-savanna/30" aria-labelledby="catalog-heading">
      <div className="kente-band kente-band-md" aria-hidden />
      <div className={`${pageShell} py-12 lg:py-16`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.14em] text-terracotta">
              Catalogue public
            </p>
            <h2 id="catalog-heading" className="font-display text-2xl font-medium tracking-[-0.01em] text-ink-black">
              {total > 0 ? `${total} dataset${total > 1 ? "s" : ""} référencé${total > 1 ? "s" : ""}` : "Index des datasets"}
            </h2>
            <p className="font-serif text-sm leading-relaxed text-slate">
              Consultation libre — métadonnées, langues, tâches NLP et liens vers les sources d&apos;origine.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/search" className={btnGhost}>
              Par langue
            </Link>
            <Link href="/filter" className={btnGhost}>
              Filtrer
            </Link>
          </div>
        </div>

        {loadError ? (
          <div className="mt-10 rounded-sm border border-terracotta/30 bg-pure-white p-6">
            <p className="font-display text-lg text-ink-black">Catalogue momentanément indisponible</p>
            <p className="mt-2 font-serif text-sm text-slate">
              L&apos;API backend ne répond pas. Vérifiez que{" "}
              <code className="font-mono-ui text-[11px]">NEXT_PUBLIC_API_URL</code> pointe vers{" "}
              <code className="font-mono-ui text-[11px]">https://afrilang-api.up.railway.app</code>.
            </p>
          </div>
        ) : loading ? (
          <div className="mt-10 rounded-sm border border-hairline bg-pure-white p-8 text-center">
            <p className="font-display text-lg text-ink-black">Chargement du catalogue…</p>
            <p className="mt-2 font-serif text-sm text-slate">Récupération des datasets depuis l&apos;index public.</p>
          </div>
        ) : datasets.length === 0 ? (
          <div className="mt-10 rounded-sm border border-hairline bg-pure-white p-8 text-center">
            <p className="font-display text-lg text-ink-black">Aucun dataset pour le moment</p>
            <p className="mt-2 font-serif text-sm text-slate">
              L&apos;index sera alimenté dès que des ressources seront enregistrées en base.
            </p>
          </div>
        ) : (
          <>
            {collapsible ? (
              <div className="mt-10 flex flex-wrap items-center justify-between gap-3 rounded-sm border border-hairline bg-pure-white px-4 py-3 shadow-[var(--shadow-subtle)]">
                <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-slate">
                  <span className="tabular-nums text-ink-black">{shownCount}</span> sur{" "}
                  <span className="tabular-nums text-ink-black">{datasets.length}</span> datasets affichés
                </p>
                <button
                  type="button"
                  aria-pressed={expanded}
                  aria-controls="catalog-list"
                  onClick={() => setVisibleCount(expanded ? CATALOG_PAGE_SIZE : datasets.length)}
                  className={btnGhost}
                >
                  {expanded ? "Réduire la liste" : "Tout afficher"}
                </button>
              </div>
            ) : null}

            <ul id="catalog-list" className={`grid gap-8 lg:grid-cols-2 ${collapsible ? "mt-8" : "mt-10"}`}>
              {datasets.slice(0, shownCount).map((dataset) => (
                <li key={dataset.id}>
                  <DatasetCard dataset={dataset} />
                </li>
              ))}
            </ul>

            {remaining > 0 ? (
              <div className="mt-10 flex flex-col items-center gap-2">
                <button
                  type="button"
                  aria-controls="catalog-list"
                  onClick={() => setVisibleCount((current) => current + CATALOG_PAGE_SIZE)}
                  className={btnDark}
                >
                  Lire plus ({nextStep})
                </button>
                <p className="font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate">
                  Encore {remaining} dataset{remaining > 1 ? "s" : ""} à parcourir
                </p>
              </div>
            ) : null}
          </>
        )}
      </div>
    </section>
  );
}
