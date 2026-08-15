import Link from "next/link";

import { ActiveFilterTags } from "@/components/catalog/ActiveFilterTags";
import { DatasetList } from "@/components/catalog/DatasetRow";
import { DatasetFilterForm } from "@/components/catalog/DatasetFilterForm";
import { CatalogNav } from "@/components/layout/CatalogNav";
import {
  EmptyState,
  ErrorBanner,
  ResultSummary,
  WorkflowHeader,
  WorkflowShell,
} from "@/components/layout/WorkflowShell";
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
    <WorkflowShell sidebar={<CatalogNav />}>
      <div className="space-y-8">
        <WorkflowHeader
          eyebrow="Catalogue"
          title="Filtrer les datasets"
          description="Combinez langue, source, tâche NLP et format — logique ET."
        />

        <div className="rounded-sm border border-hairline bg-pure-white p-5">
          <DatasetFilterForm defaults={filterParams} />
        </div>

        {!active ? (
          <EmptyState message="Choisissez au moins un critère pour affiner les résultats." />
        ) : error ? (
          <ErrorBanner message={error} />
        ) : result ? (
          <section className="space-y-4">
            <div className="space-y-3 border-b border-hairline pb-4">
              <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-slate">Filtres actifs</p>
              <ActiveFilterTags filters={result.filters} />
            </div>
            <ResultSummary label="Correspondances" count={result.total} />
            {result.datasets.length === 0 ? (
              <EmptyState message="Aucun dataset ne satisfait tous les filtres sélectionnés." />
            ) : (
              <DatasetList datasets={result.datasets} />
            )}
          </section>
        ) : null}
      </div>
    </WorkflowShell>
  );
}
