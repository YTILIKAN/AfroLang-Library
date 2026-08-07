import { DatasetSummary } from "@/lib/types";

const UNKNOWN = "inconnu";

function formatTasks(tasks: DatasetSummary["tasks"]): string {
  return tasks.length > 0 ? tasks.map((task) => task.label).join(", ") : UNKNOWN;
}

export function DatasetCard({ dataset }: { dataset: DatasetSummary }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 transition hover:border-emerald-300">
      <h3 className="text-lg font-semibold text-zinc-900">
        <a
          href={dataset.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-emerald-700 hover:underline"
        >
          {dataset.title}
        </a>
      </h3>
      <p className="mt-1 text-sm text-zinc-600">{dataset.source.name}</p>
      <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1 text-sm text-zinc-600">
        <dt className="font-medium text-zinc-500">Langue</dt>
        <dd>{dataset.language.name}</dd>
        <dt className="font-medium text-zinc-500">Tâche</dt>
        <dd>{formatTasks(dataset.tasks)}</dd>
        <dt className="font-medium text-zinc-500">Taille</dt>
        <dd>{dataset.size || UNKNOWN}</dd>
        <dt className="font-medium text-zinc-500">Licence</dt>
        <dd>{dataset.license?.name ?? UNKNOWN}</dd>
      </dl>
    </article>
  );
}
