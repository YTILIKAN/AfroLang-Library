import { LanguageOverviewResponse } from "@/lib/types";

function Counter({ value, label }: { value: number; label: string }) {
  return (
    <div className="rounded-xl border border-zinc-200 bg-white px-5 py-4">
      <p className="text-3xl font-semibold text-emerald-700">{value}</p>
      <p className="mt-1 text-sm text-zinc-600">{label}</p>
    </div>
  );
}

export function LanguageOverview({ overview }: { overview: LanguageOverviewResponse }) {
  const { language, language_query, language_code, stats } = overview;
  const isKnown = language !== null;
  const title = isKnown ? language.name : language_query;

  return (
    <section className="flex flex-col gap-4">
      <header className="space-y-1">
        <h2 className="text-2xl font-semibold text-zinc-900">{title}</h2>
        {isKnown ? (
          <p className="text-sm text-zinc-600">
            <span className="font-mono">{language_code}</span> · {language.family} ·{" "}
            {language.region}
          </p>
        ) : (
          <p className="text-sm text-amber-700">
            Cette langue n&apos;est pas reconnue dans l&apos;index : aucun code ISO 639-3 ne
            correspond à « {language_query} ».
          </p>
        )}
      </header>

      <div className="grid grid-cols-2 gap-4 sm:max-w-md">
        <Counter value={stats.dataset_count} label={stats.dataset_count > 1 ? "datasets" : "dataset"} />
        <Counter
          value={stats.task_count}
          label={stats.task_count > 1 ? "tâches couvertes" : "tâche couverte"}
        />
      </div>

      <div>
        <h3 className="text-sm font-medium text-zinc-700">Tâches NLP couvertes</h3>
        {stats.tasks_covered.length > 0 ? (
          <ul className="mt-2 flex flex-wrap gap-2">
            {stats.tasks_covered.map((task) => (
              <li
                key={task.code}
                className="rounded-full bg-emerald-50 px-3 py-1 text-sm text-emerald-800"
              >
                {task.label}
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-2 text-sm text-zinc-600">Aucune tâche renseignée pour cette langue.</p>
        )}
      </div>
    </section>
  );
}
