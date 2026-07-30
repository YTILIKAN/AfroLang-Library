import Link from "next/link";

import { tagClass } from "@/components/ui/styles";
import { displayValue, isUnknown } from "@/lib/format";
import { DatasetSummary } from "@/lib/types";

interface DatasetCardProps {
  dataset: DatasetSummary;
}

export function DatasetCard({ dataset }: DatasetCardProps) {
  const tasks =
    dataset.tasks.length > 0
      ? dataset.tasks.map((task) => task.label).join(", ")
      : displayValue(null);

  return (
    <article className="border-t border-hairline pt-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-2">
          <Link
            href={`/datasets/${dataset.id}`}
            className="font-serif text-lg font-medium text-ink-black hover:text-schematic-blue"
          >
            {dataset.title}
          </Link>
          <p className="font-serif text-sm leading-relaxed text-slate line-clamp-2">
            {displayValue(dataset.description)}
          </p>
        </div>
        <span className={tagClass}>{dataset.provenance}</span>
      </div>

      <dl className="mt-4 grid gap-2 sm:grid-cols-2">
        <div>
          <dt className="font-mono-ui text-[10px] uppercase tracking-[0.015em] text-slate">Langue</dt>
          <dd className="font-serif text-sm text-ink-black">
            {dataset.language.name} ({dataset.language.code})
          </dd>
        </div>
        <div>
          <dt className="font-mono-ui text-[10px] uppercase tracking-[0.015em] text-slate">Tâches</dt>
          <dd className="font-serif text-sm text-ink-black">{tasks}</dd>
        </div>
        <div>
          <dt className="font-mono-ui text-[10px] uppercase tracking-[0.015em] text-slate">Format</dt>
          <dd className={`font-serif text-sm ${isUnknown(dataset.data_format) ? "text-slate" : "text-ink-black"}`}>
            {displayValue(dataset.data_format)}
          </dd>
        </div>
        <div>
          <dt className="font-mono-ui text-[10px] uppercase tracking-[0.015em] text-slate">Taille</dt>
          <dd className={`font-serif text-sm ${isUnknown(dataset.size) ? "text-slate" : "text-ink-black"}`}>
            {displayValue(dataset.size)}
          </dd>
        </div>
      </dl>

      <div className="mt-4 flex flex-wrap gap-3">
        <Link
          href={`/datasets/${dataset.id}`}
          className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-schematic-blue hover:underline"
        >
          Voir la fiche →
        </Link>
        <a
          href={dataset.source_url}
          target="_blank"
          rel="noopener noreferrer"
          className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-graphite hover:text-ink-black"
        >
          Source externe ↗
        </a>
      </div>
    </article>
  );
}
