import Link from "next/link";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { ActiveFilterTags } from "@/components/catalog/ActiveFilterTags";
import { DatasetCard } from "@/components/catalog/DatasetCard";
import { DatasetFilterForm } from "@/components/catalog/DatasetFilterForm";
import { cardElevated, pageShell, sectionGap } from "@/components/ui/styles";
import { filterDatasets } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { DatasetFilterParams } from "@/lib/types";

interface FilterPageProps {
  searchParams: Promise<{
    language?: string;
    source?: string;
    task?: string;
    data_format?: string;
  }>;
}

function parseFilterParams(searchParams: Awaited<FilterPageProps["searchParams"]>): DatasetFilterParams {
  const params: DatasetFilterParams = {};
  if (searchParams.language?.trim()) params.language = searchParams.language.trim();
  if (searchParams.source?.trim()) params.source = searchParams.source.trim();
  if (searchParams.task?.trim()) params.task = searchParams.task.trim();
  if (searchParams.data_format?.trim()) params.data_format = searchParams.data_format.trim();
  return params;
}

function hasActiveFilters(params: DatasetFilterParams): boolean {
  return Boolean(params.language || params.source || params.task || params.data_format);
}

export default async function FilterPage({ searchParams }: FilterPageProps) {
  const rawParams = await searchParams;
  const filterParams = parseFilterParams(rawParams);
  const active = hasActiveFilters(filterParams);

  let error: string | null = null;
  let result: Awaited<ReturnType<typeof filterDatasets>> | null = null;

  if (active) {
    try {
      result = await filterDatasets(filterParams);
    } catch (err) {
      error = err instanceof ApiError ? err.message : "Filtrage impossible";
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <main className={`${pageShell} ${sectionGap} flex-1 pt-12`}>
        <div className="max-w-3xl space-y-4">
          <p className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-graphite">
            Catalogue public
          </p>
          <h1 className="text-[36px] font-medium leading-[1.11] tracking-[0.012em] text-ink-black">
            Filtrer les datasets
          </h1>
          <p className="font-serif text-sm leading-relaxed text-slate">
            Combinez langue, source, tâche NLP et format — logique ET (FR-12, Story 2.4).
          </p>
          <Link
            href="/search"
            className="inline-block font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-schematic-blue hover:underline"
          >
            Recherche simple par langue →
          </Link>
        </div>

        <div className={`mt-10 max-w-2xl ${cardElevated}`}>
          <DatasetFilterForm defaults={filterParams} />
        </div>

        {!active ? (
          <p className="mt-12 font-serif text-sm text-slate">
            Choisissez au moins un critère pour affiner les résultats.
          </p>
        ) : error ? (
          <div className="mt-12 border border-hairline bg-fog px-4 py-3 font-serif text-sm text-ink-black">
            {error}
          </div>
        ) : result ? (
          <section className="mt-12 space-y-8">
            <div className="border-b border-hairline pb-6 space-y-4">
              <p className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.015em] text-slate">
                Filtres actifs
              </p>
              <ActiveFilterTags filters={result.filters} />
              <p className="font-serif text-[26px] font-normal leading-[1.23] text-ink-black">
                {result.total} dataset{result.total > 1 ? "s" : ""} correspondant{result.total > 1 ? "s" : ""}
              </p>
            </div>

            {result.datasets.length === 0 ? (
              <p className="font-serif text-sm text-slate">
                Aucun dataset ne satisfait tous les filtres sélectionnés.
              </p>
            ) : (
              <div className="grid gap-10">
                {result.datasets.map((dataset) => (
                  <DatasetCard key={dataset.id} dataset={dataset} />
                ))}
              </div>
            )}
          </section>
        ) : null}
      </main>

      <SiteFooter />
    </div>
  );
}
