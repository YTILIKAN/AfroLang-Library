import Link from "next/link";

import { DatasetList } from "@/components/catalog/DatasetRow";
import { EmptyState, WorkflowHeader } from "@/components/layout/WorkflowShell";
import { tagClass } from "@/components/ui/styles";
import { LanguageOverviewResponse } from "@/lib/types";

interface LanguageOverviewViewProps {
  overview: LanguageOverviewResponse;
}

export function LanguageOverviewView({ overview }: LanguageOverviewViewProps) {
  const { language, stats } = overview;
  const isKnown = overview.language_code !== "inconnu" && language !== null;

  return (
    <div className="space-y-8">
      <WorkflowHeader
        eyebrow={`Langue · ${overview.language_query}`}
        title={isKnown && language ? language.name : "Langue non reconnue"}
        description={
          isKnown && language
            ? [
                language.code,
                language.family !== "inconnu" ? language.family : null,
                language.region !== "inconnu" ? language.region : null,
              ]
                .filter(Boolean)
                .join(" · ")
            : `Aucune entrée pour « ${overview.language_query} ».`
        }
        actions={
          isKnown && language ? (
            <>
              <Link href={`/search?language=${encodeURIComponent(language.code)}`} className={tagClass}>
                Recherche
              </Link>
              <Link href={`/filter?language=${encodeURIComponent(language.name)}`} className={tagClass}>
                Filtrer
              </Link>
            </>
          ) : undefined
        }
      />

      {isKnown ? (
        <dl className="grid grid-cols-3 gap-4 border-y border-hairline py-5">
          <div>
            <dt className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-slate">Datasets</dt>
            <dd className="mt-1 font-display text-xl tabular-nums text-ink-black">{stats.dataset_count}</dd>
          </div>
          <div>
            <dt className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-slate">Tâches</dt>
            <dd className="mt-1 font-display text-xl tabular-nums text-ink-black">{stats.task_count}</dd>
          </div>
          <div>
            <dt className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-slate">Couverture</dt>
            <dd className="mt-2 flex flex-wrap gap-1">
              {stats.tasks_covered.length > 0 ? (
                stats.tasks_covered.map((task) => (
                  <span key={task.code} className={tagClass}>
                    {task.label}
                  </span>
                ))
              ) : (
                <span className="font-serif text-sm text-slate">—</span>
              )}
            </dd>
          </div>
        </dl>
      ) : null}

      {overview.datasets.length > 0 ? (
        <section className="space-y-4">
          <h2 className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.12em] text-ink-black">
            Datasets référencés
          </h2>
          <DatasetList datasets={overview.datasets} />
        </section>
      ) : isKnown ? (
        <EmptyState message="Aucun dataset indexé pour cette langue." />
      ) : null}
    </div>
  );
}
