import Link from "next/link";

import { tagClass, tagTerracotta } from "@/components/ui/styles";
import { displayValue } from "@/lib/format";
import { DatasetSummary } from "@/lib/types";

interface DatasetRowProps {
  dataset: DatasetSummary;
}

export function DatasetRow({ dataset }: DatasetRowProps) {
  const tasks =
    dataset.tasks.length > 0 ? dataset.tasks.map((task) => task.label).join(", ") : displayValue(null);
  const provenanceTag = dataset.provenance === "contribué" ? tagTerracotta : tagClass;

  return (
    <article className="group grid gap-3 border-b border-hairline px-4 py-4 transition last:border-b-0 hover:bg-savanna/30 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-center">
      <div className="min-w-0 space-y-1">
        <Link
          href={`/datasets/${dataset.id}`}
          className="font-serif text-sm font-medium text-ink-black hover:text-indigo-deep"
        >
          {dataset.title}
        </Link>
        <p className="flex flex-wrap items-center gap-x-2 gap-y-1 font-mono-ui text-[10px] uppercase tracking-wide text-slate">
          <span>{dataset.language.name}</span>
          <span aria-hidden>·</span>
          <span>{dataset.source.name}</span>
          <span aria-hidden>·</span>
          <span>{displayValue(dataset.data_format)}</span>
          <span aria-hidden>·</span>
          <span>{tasks}</span>
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 sm:justify-end">
        <span className={provenanceTag}>{dataset.provenance}</span>
        <Link
          href={`/datasets/${dataset.id}`}
          className="font-mono-ui text-[10px] uppercase tracking-wide text-indigo-deep opacity-0 transition group-hover:opacity-100"
        >
          Fiche →
        </Link>
      </div>
    </article>
  );
}

export function DatasetList({ datasets }: { datasets: DatasetSummary[] }) {
  return (
    <div className="overflow-hidden rounded-sm border border-hairline bg-pure-white">
      {datasets.map((dataset) => (
        <DatasetRow key={dataset.id} dataset={dataset} />
      ))}
    </div>
  );
}
