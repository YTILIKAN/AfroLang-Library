import Link from "next/link";

import { DatasetResultList } from "@/components/DatasetResultList";
import { LanguageOverview } from "@/components/LanguageOverview";
import { getLanguageOverview } from "@/lib/api/catalog";
import { readParam, type SearchParams } from "@/lib/search-params";

export const metadata = {
  title: "Disponibilité par langue — AfroLang-Library",
};

export default async function LanguesPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const language = readParam(params, "language");
  const overview = language ? await getLanguageOverview(language) : null;

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            AfroLang-Library
          </p>
          <h1 className="text-3xl font-semibold text-zinc-900">Disponibilité par langue</h1>
          <p className="text-zinc-600">
            Les ressources référencées pour une langue, avec ses compteurs et les tâches NLP
            couvertes.
          </p>
        </header>

        <form method="get" className="flex flex-col gap-2 rounded-xl border border-zinc-200 bg-white p-5 sm:flex-row">
          <label htmlFor="language" className="sr-only">
            Langue
          </label>
          <input
            id="language"
            name="language"
            type="text"
            defaultValue={language ?? ""}
            placeholder="ex. yoruba, wolof, swahili"
            className="flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm text-zinc-800 focus:border-emerald-600 focus:outline-none"
          />
          <button
            type="submit"
            className="inline-flex items-center justify-center rounded-lg bg-emerald-700 px-5 py-2 text-sm font-medium text-white transition hover:bg-emerald-800"
          >
            Voir la langue
          </button>
        </form>

        {overview ? (
          <>
            <LanguageOverview overview={overview} />
            <DatasetResultList
              total={overview.stats.dataset_count}
              datasets={overview.datasets}
            />
          </>
        ) : (
          <p className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
            Entrez une langue pour voir l&apos;état de sa disponibilité dans l&apos;index.
          </p>
        )}

        <Link href="/recherche" className="text-sm font-medium text-emerald-700 hover:underline">
          Revenir à la recherche filtrée
        </Link>
      </main>
    </div>
  );
}
