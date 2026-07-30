import Link from "next/link";

import { DatasetCard } from "@/components/catalog/DatasetCard";
import { tagClass } from "@/components/ui/styles";
import { LanguageOverviewResponse } from "@/lib/types";

interface LanguageOverviewViewProps {
  overview: LanguageOverviewResponse;
}

export function LanguageOverviewView({ overview }: LanguageOverviewViewProps) {
  const { language, stats } = overview;
  const isKnown = overview.language_code !== "inconnu" && language !== null;

  return (
    <div className="space-y-12">
      <header className="space-y-6 border-b border-hairline pb-8">
        <Link
          href="/languages"
          className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-slate hover:text-ink-black"
        >
          ← Toutes les langues
        </Link>

        <div className="max-w-3xl space-y-3">
          <p className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-graphite">
            Page langue · {overview.language_query}
          </p>
          {isKnown && language ? (
            <>
              <h1 className="text-[36px] font-medium leading-[1.11] tracking-[0.012em] text-ink-black">
                {language.name}
              </h1>
              <p className="font-serif text-[26px] font-normal leading-[1.23] text-ink-black">
                Code <span className="font-medium">{language.code}</span>
                {language.family !== "inconnu" ? (
                  <> · {language.family}</>
                ) : null}
              </p>
              {language.region !== "inconnu" ? (
                <p className="font-serif text-sm leading-relaxed text-slate">{language.region}</p>
              ) : null}
            </>
          ) : (
            <>
              <h1 className="text-[36px] font-medium leading-[1.11] tracking-[0.012em] text-ink-black">
                Langue non reconnue
              </h1>
              <p className="font-serif text-sm leading-relaxed text-slate">
                Aucune entrée dans l&apos;index pour « {overview.language_query} ».
              </p>
            </>
          )}
        </div>

        {isKnown ? (
          <dl className="grid gap-6 sm:grid-cols-3">
            <div className="border-t border-hairline pt-4">
              <dt className="font-mono-ui text-[10px] uppercase tracking-[0.015em] text-slate">Datasets</dt>
              <dd className="mt-1 font-serif text-[26px] font-medium leading-[1.23] text-ink-black">
                {stats.dataset_count}
              </dd>
            </div>
            <div className="border-t border-hairline pt-4">
              <dt className="font-mono-ui text-[10px] uppercase tracking-[0.015em] text-slate">Tâches couvertes</dt>
              <dd className="mt-1 font-serif text-[26px] font-medium leading-[1.23] text-ink-black">
                {stats.task_count}
              </dd>
            </div>
            <div className="border-t border-hairline pt-4 sm:col-span-1">
              <dt className="font-mono-ui text-[10px] uppercase tracking-[0.015em] text-slate">Disponibilité</dt>
              <dd className="mt-2 flex flex-wrap gap-2">
                {stats.tasks_covered.length > 0 ? (
                  stats.tasks_covered.map((task) => (
                    <span key={task.code} className={tagClass}>
                      {task.label}
                    </span>
                  ))
                ) : (
                  <span className="font-serif text-sm text-slate">Aucune tâche référencée</span>
                )}
              </dd>
            </div>
          </dl>
        ) : null}
      </header>

      {overview.datasets.length > 0 ? (
        <section className="space-y-8">
          <h2 className="font-mono-ui text-sm font-medium uppercase tracking-[0.012em] text-ink-black">
            Datasets référencés
          </h2>
          <div className="grid gap-10">
            {overview.datasets.map((dataset) => (
              <DatasetCard key={dataset.id} dataset={dataset} />
            ))}
          </div>
        </section>
      ) : isKnown ? (
        <p className="font-serif text-sm text-slate">Aucun dataset indexé pour cette langue.</p>
      ) : null}

      {isKnown && language ? (
        <div className="flex flex-wrap gap-2 border-t border-hairline pt-8">
          <Link
            href={`/search?language=${encodeURIComponent(language.code)}`}
            className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-schematic-blue hover:underline"
          >
            Recherche simple →
          </Link>
          <Link
            href={`/filter?language=${encodeURIComponent(language.name)}`}
            className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-graphite hover:text-ink-black"
          >
            Filtrer cette langue →
          </Link>
        </div>
      ) : null}
    </div>
  );
}
