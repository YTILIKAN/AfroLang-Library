import Link from "next/link";

import { DatasetResultList } from "@/components/DatasetResultList";
import { FilterControls } from "@/components/FilterControls";
import { fetchDatasetResults } from "@/lib/api/catalog";
import { readParam, type SearchParams } from "@/lib/search-params";

export const metadata = {
  title: "Rechercher un dataset — AfroLang-Library",
};

export default async function RecherchePage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const language = readParam(params, "language");
  const source = readParam(params, "source");
  const task = readParam(params, "task");
  const dataFormat = readParam(params, "data_format");
  const hasCriteria = Boolean(language || source || task || dataFormat);

  const results = await fetchDatasetResults({
    language,
    source,
    task,
    data_format: dataFormat,
  });

  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
        <header className="space-y-2">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">
            AfroLang-Library
          </p>
          <h1 className="text-3xl font-semibold text-zinc-900">Rechercher un dataset</h1>
          <p className="text-zinc-600">
            Recherchez par langue, puis affinez par source, tâche NLP et format.
          </p>
        </header>

        <form method="get" className="flex flex-col gap-4 rounded-xl border border-zinc-200 bg-white p-5">
          <div className="flex flex-col gap-2 sm:flex-row">
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
              Rechercher
            </button>
          </div>
          <FilterControls source={source} task={task} dataFormat={dataFormat} />
        </form>

        {hasCriteria ? (
          <DatasetResultList total={results.total} datasets={results.datasets} />
        ) : (
          <p className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
            Entrez une langue ou choisissez un filtre pour afficher les datasets disponibles.
          </p>
        )}

        <Link href="/langues" className="text-sm font-medium text-emerald-700 hover:underline">
          Explorer la disponibilité par langue
        </Link>
      </main>
    </div>
  );
}
