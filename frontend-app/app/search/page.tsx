import Link from "next/link";

import { DatasetList } from "@/components/catalog/DatasetRow";
import { languageOverviewPath } from "@/components/catalog/language-links";
import { LanguageSearchForm } from "@/components/catalog/LanguageSearchForm";
import { CatalogNav } from "@/components/layout/CatalogNav";
import {
  EmptyState,
  ErrorBanner,
  ResultSummary,
  WorkflowHeader,
  WorkflowShell,
} from "@/components/layout/WorkflowShell";
import { searchDatasets } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";

interface SearchPageProps {
  searchParams: Promise<{ language?: string }>;
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { language } = await searchParams;
  const query = language?.trim() ?? "";

  let error: string | null = null;
  let result: Awaited<ReturnType<typeof searchDatasets>> | null = null;

  if (query) {
    try {
      result = await searchDatasets(query);
    } catch (err) {
      error = err instanceof ApiError ? err.message : "Recherche impossible";
    }
  }

  return (
    <WorkflowShell sidebar={<CatalogNav />}>
      <div className="space-y-8">
        <WorkflowHeader
          eyebrow="Catalogue"
          title="Recherche par langue"
          description="Code ISO 639-3 ou alias — Yoruba, yor, Wolof, Swahili…"
        />

        <div className="rounded-sm border border-hairline bg-pure-white p-4">
          <LanguageSearchForm defaultLanguage={query} compact />
        </div>

        {!query ? (
          <EmptyState message="Saisissez une langue pour afficher les datasets correspondants." />
        ) : error ? (
          <ErrorBanner message={error} />
        ) : result ? (
          <section className="space-y-4">
            <ResultSummary
              label={`Requête · ${result.language_query}${result.language_code !== "inconnu" ? ` (${result.language_code})` : ""}`}
              count={result.total}
            />
            {result.language_code !== "inconnu" ? (
              <Link
                href={languageOverviewPath(result.language_query)}
                className="inline-block font-mono-ui text-[10px] uppercase tracking-wide text-indigo-deep hover:text-terracotta"
              >
                Vue langue →
              </Link>
            ) : null}
            {result.datasets.length === 0 ? (
              <EmptyState message="Aucun dataset pour cette langue." />
            ) : (
              <DatasetList datasets={result.datasets} />
            )}
          </section>
        ) : null}
      </div>
    </WorkflowShell>
  );
}
