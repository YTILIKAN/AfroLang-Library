import Link from "next/link";

import { btnOrange, panelClass, tagClass } from "@/components/ui/styles";
import { displayValue, isUnknown } from "@/lib/format";
import { DatasetDetail } from "@/lib/types";

interface DatasetDetailViewProps {
  dataset: DatasetDetail;
}

function MetaRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="grid gap-1 border-b border-hairline py-3 last:border-b-0 sm:grid-cols-[140px_1fr] sm:gap-4">
      <dt className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-slate">{label}</dt>
      <dd className={`font-serif text-sm leading-relaxed ${muted ? "text-slate" : "text-ink-black"}`}>{value}</dd>
    </div>
  );
}

export function DatasetDetailView({ dataset }: DatasetDetailViewProps) {
  const tasks =
    dataset.tasks.length > 0
      ? dataset.tasks.map((task) => `${task.label} (${task.code})`).join(", ")
      : displayValue(null);

  const licenseLabel = dataset.license ? displayValue(dataset.license.name) : displayValue(null);

  return (
    <div className="space-y-8">
      <header className="space-y-4 border-b border-hairline pb-6">
        <Link
          href="/catalog"
          className="font-mono-ui text-[10px] uppercase tracking-wide text-slate hover:text-ink-black"
        >
          ← Catalogue
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl space-y-2">
            <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-graphite">
              Dataset #{dataset.id}
            </p>
            <h1 className="font-display text-[1.75rem] font-medium leading-[1.15] tracking-[-0.01em] text-ink-black sm:text-[2rem]">
              {dataset.title}
            </h1>
            <p className="font-serif text-sm leading-relaxed text-slate">{displayValue(dataset.description)}</p>
          </div>
          <span className={tagClass}>{dataset.provenance}</span>
        </div>
      </header>

      <div className="grid gap-6 lg:grid-cols-[1fr_260px]">
        <dl className={`${panelClass} px-4 py-2`}>
          <MetaRow label="Langue" value={`${dataset.language.name} (${dataset.language.code})`} />
          {!isUnknown(dataset.language_raw) ? (
            <MetaRow label="Libellé source" value={dataset.language_raw} muted />
          ) : null}
          <MetaRow label="Tâches NLP" value={tasks} muted={isUnknown(tasks)} />
          <MetaRow label="Format" value={displayValue(dataset.data_format)} muted={isUnknown(dataset.data_format)} />
          <MetaRow label="Taille" value={displayValue(dataset.size)} muted={isUnknown(dataset.size)} />
          <MetaRow label="Licence" value={licenseLabel} muted={isUnknown(licenseLabel)} />
          <MetaRow label="Source" value={`${dataset.source.name} (${dataset.source.slug})`} />
          <MetaRow label="ID externe" value={displayValue(dataset.external_id)} />
        </dl>

        <aside className={`${panelClass} space-y-5 p-4`}>
          <div>
            <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-graphite">Accès</p>
            <a
              href={dataset.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-3 inline-flex w-full justify-center ${btnOrange}`}
            >
              Source externe ↗
            </a>
          </div>
          <div className="space-y-1 border-t border-hairline pt-4 font-mono-ui text-[10px] uppercase tracking-wide text-slate">
            {dataset.published_at ? <p>Publié · {formatDate(dataset.published_at)}</p> : null}
            <p>Indexé · {formatDate(dataset.created_at)}</p>
            <p>Màj · {formatDate(dataset.updated_at)}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}

function formatDate(iso: string): string {
  try {
    return new Intl.DateTimeFormat("fr-FR", {
      dateStyle: "medium",
      timeZone: "UTC",
    }).format(new Date(iso));
  } catch {
    return iso;
  }
}
