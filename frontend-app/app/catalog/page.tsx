import Link from "next/link";

import { ActiveFilterTags } from "@/components/catalog/ActiveFilterTags";
import { CatalogExplorerForm } from "@/components/catalog/CatalogExplorerForm";
import { DatasetList } from "@/components/catalog/DatasetRow";
import { languageOverviewPath } from "@/components/catalog/language-links";
import { CatalogNav } from "@/components/layout/CatalogNav";
import {
  EmptyState,
  ErrorBanner,
  ResultSummary,
  WorkflowHeader,
  WorkflowShell,
} from "@/components/layout/WorkflowShell";
import { tagClass } from "@/components/ui/styles";
import { filterDatasets, listDatasets } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";
import { DatasetFilterParams, DatasetSummary } from "@/lib/types";

/** Taille de la page par défaut lorsqu'aucun critère n'est posé. */
const INDEX_PAGE_SIZE = 100;

interface CatalogPageProps {
  searchParams: Promise<{
    q?: string;
    language?: string;
    source?: string;
    task?: string;
    data_format?: string;
  }>;
}

function parseParams(raw: Awaited<CatalogPageProps["searchParams"]>): DatasetFilterParams {
  const params: DatasetFilterParams = {};
  if (raw.q?.trim()) params.q = raw.q.trim();
  if (raw.language?.trim()) params.language = raw.language.trim();
  if (raw.source?.trim()) params.source = raw.source.trim();
  if (raw.task?.trim()) params.task = raw.task.trim();
  if (raw.data_format?.trim()) params.data_format = raw.data_format.trim();
  return params;
}

export default async function CatalogPage({ searchParams }: CatalogPageProps) {
  const params = parseParams(await searchParams);
  const hasCriteria = Object.keys(params).length > 0;

  let error: string | null = null;
  let datasets: DatasetSummary[] = [];
  let total = 0;
  let filters: Awaited<ReturnType<typeof filterDatasets>>["filters"] | null = null;

  try {
    if (hasCriteria) {
      const result = await filterDatasets(params);
      datasets = result.datasets;
      total = result.total;
      filters = result.filters;
    } else {
      const result = await listDatasets(INDEX_PAGE_SIZE);
      datasets = result.datasets;
      total = result.total;
    }
  } catch (err) {
    error = err instanceof ApiError ? err.message : "Consultation du catalogue impossible";
  }

  const languageCode = filters?.language_code;
  const knownLanguage = Boolean(languageCode && languageCode !== "inconnu");

  return (
    <WorkflowShell sidebar={<CatalogNav />}>
      <div className="space-y-8">
        <WorkflowHeader
          eyebrow="Catalogue"
          title="Explorer les datasets"
          description="Une recherche plein texte et quatre facettes — langue, source, tâche NLP et format."
        />

        <div className="rounded-sm border border-hairline bg-pure-white p-5">
          <CatalogExplorerForm defaults={params} />
        </div>

        {error ? (
          <ErrorBanner message={error} />
        ) : (
          <section className="space-y-4">
            {filters ? (
              <div className="space-y-3 border-b border-hairline pb-4">
                <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-slate">
                  Critères actifs
                </p>
                <ActiveFilterTags filters={filters} />
                {knownLanguage && languageCode ? (
                  <Link href={languageOverviewPath(languageCode)} className={tagClass}>
                    Fiche langue →
                  </Link>
                ) : null}
              </div>
            ) : null}

            <ResultSummary
              label={hasCriteria ? "Correspondances" : "Index complet"}
              count={total}
            />

            {datasets.length === 0 ? (
              <EmptyState
                message={
                  hasCriteria
                    ? "Aucun dataset ne satisfait tous les critères."
                    : "L'index ne contient encore aucun dataset."
                }
              />
            ) : (
              <>
                <DatasetList datasets={datasets} />
                {total > datasets.length ? (
                  <p className="font-serif text-sm text-slate">
                    {datasets.length} datasets affichés sur {total} — affinez la recherche pour
                    cibler les résultats.
                  </p>
                ) : null}
              </>
            )}
          </section>
        )}
      </div>
    </WorkflowShell>
  );
}
