import Link from "next/link";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { DatasetCard } from "@/components/catalog/DatasetCard";
import { LanguageSearchForm, languageOverviewPath } from "@/components/catalog/LanguageSearchForm";
import { pageShell, sectionGap } from "@/components/ui/styles";
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
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <main className={`${pageShell} ${sectionGap} flex-1 pt-12`}>
        <div className="max-w-3xl space-y-4">
          <p className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-graphite">
            Catalogue public
          </p>
          <h1 className="text-[36px] font-medium leading-[1.11] tracking-[0.012em] text-ink-black">
            Recherche par langue
          </h1>
          <p className="font-serif text-sm leading-relaxed text-slate">
            Code ISO 639-3 ou alias — Yoruba, yor, Wolof, Swahili… (FR-11, Story 1.12).
          </p>
          <Link
            href="/filter"
            className="inline-block font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-schematic-blue hover:underline"
          >
            Filtrer par source, tâche ou format →
          </Link>
        </div>

        <div className="mt-10 max-w-xl">
          <LanguageSearchForm defaultLanguage={query} compact />
        </div>

        {!query ? (
          <p className="mt-12 font-serif text-sm text-slate">
            Saisissez une langue pour afficher les datasets correspondants.
          </p>
        ) : error ? (
          <div className="mt-12 border border-hairline bg-fog px-4 py-3 font-serif text-sm text-ink-black">
            {error}
          </div>
        ) : result ? (
          <section className="mt-12 space-y-8">
            <div className="border-b border-hairline pb-6">
              <p className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-slate">
                Requête · {result.language_query}
              </p>
              <p className="mt-2 font-serif text-[26px] font-normal leading-[1.23] text-ink-black">
                {result.total} dataset{result.total > 1 ? "s" : ""}{" "}
                {result.language_code !== "inconnu" ? (
                  <>
                    pour <span className="font-medium">{result.language_code}</span>
                  </>
                ) : (
                  <>— langue non reconnue</>
                )}
              </p>
              {result.language_code !== "inconnu" ? (
                <Link
                  href={languageOverviewPath(result.language_query)}
                  className="mt-3 inline-block font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-schematic-blue hover:underline"
                >
                  Page langue →
                </Link>
              ) : null}
            </div>

            {result.datasets.length === 0 ? (
              <p className="font-serif text-sm text-slate">Aucun dataset pour cette langue.</p>
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
