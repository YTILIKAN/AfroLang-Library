import Link from "next/link";

import { DatasetSummary } from "@/lib/types";

interface IndexPreviewStripProps {
  datasets: DatasetSummary[];
}

function formatLine(dataset: DatasetSummary): string {
  const tasks = dataset.tasks.map((task) => task.code).join(", ") || "—";
  const size = dataset.size && dataset.size !== "inconnu" ? dataset.size : "—";
  return `${dataset.language.code}  ${dataset.external_id}  ${tasks}  ${dataset.data_format}  ${size}  ${dataset.source.slug}`;
}

export function IndexPreviewStrip({ datasets }: IndexPreviewStripProps) {
  if (datasets.length === 0) {
    return null;
  }

  return (
    <section
      className="index-preview border-y border-ink-black/20 bg-ink-black"
      aria-label="Aperçu de l'index"
    >
      <div className="mx-auto flex max-w-[1200px] flex-col gap-0 sm:flex-row sm:items-stretch">
        <div className="flex shrink-0 items-center border-b border-white/10 px-6 py-3 sm:border-b-0 sm:border-r sm:py-4">
          <p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.14em] text-ochre/90">
            Index
          </p>
        </div>
        <ul className="min-w-0 flex-1 divide-y divide-white/[0.06]">
          {datasets.map((dataset) => (
            <li key={dataset.id} className="group flex items-center gap-4 px-6 py-2.5 transition hover:bg-white/[0.03]">
              <Link
                href={`/datasets/${dataset.id}`}
                className="min-w-0 flex-1 truncate font-mono-ui text-[11px] leading-relaxed text-savanna/80 transition group-hover:text-cream-paper"
              >
                {formatLine(dataset)}
              </Link>
              <span className="hidden shrink-0 font-mono-ui text-[10px] uppercase tracking-wide text-slate/60 sm:inline">
                {dataset.provenance}
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
