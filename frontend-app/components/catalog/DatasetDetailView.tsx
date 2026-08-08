import Link from "next/link";

import { btnOrange, cardElevated, tagClass } from "@/components/ui/styles";
import { displayValue, isUnknown } from "@/lib/format";
import { DatasetDetail } from "@/lib/types";

interface DatasetDetailViewProps {
  dataset: DatasetDetail;
}

function MetaRow({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="border-t border-hairline py-4 first:border-t-0 first:pt-0">
      <dt className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.015em] text-slate">{label}</dt>
      <dd className={`mt-1 font-serif text-sm leading-relaxed ${muted ? "text-slate" : "text-ink-black"}`}>
        {value}
      </dd>
    </div>
  );
}

export function DatasetDetailView({ dataset }: DatasetDetailViewProps) {
  const tasks =
    dataset.tasks.length > 0
      ? dataset.tasks.map((task) => `${task.label} (${task.code})`).join(", ")
      : displayValue(null);

  const licenseLabel = dataset.license
    ? displayValue(dataset.license.name)
    : displayValue(null);

  return (
    <div className="space-y-8">
      <header className="space-y-4">
        <Link
          href="/search"
          className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-slate hover:text-ink-black"
        >
          ← Retour à la recherche
        </Link>
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-3xl space-y-3">
            <p className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-graphite">
              Fiche dataset · #{dataset.id}
            </p>
            <h1 className="text-[36px] font-medium leading-[1.11] tracking-[0.012em] text-ink-black">
              {dataset.title}
            </h1>
            <p className="font-serif text-base leading-relaxed text-slate">{displayValue(dataset.description)}</p>
          </div>
          <span className={tagClass}>{dataset.provenance}</span>
        </div>
      </header>

      <div className={`grid gap-8 lg:grid-cols-[1fr_320px] ${cardElevated}`}>
        <dl>
          <MetaRow
            label="Langue"
            value={`${dataset.language.name} (${dataset.language.code})`}
          />
          {!isUnknown(dataset.language_raw) ? (
            <MetaRow label="Libellé source" value={dataset.language_raw} muted />
          ) : null}
          <MetaRow label="Tâches NLP" value={tasks} muted={isUnknown(tasks)} />
          <MetaRow
            label="Format"
            value={displayValue(dataset.data_format)}
            muted={isUnknown(dataset.data_format)}
          />
          <MetaRow label="Taille" value={displayValue(dataset.size)} muted={isUnknown(dataset.size)} />
          <MetaRow label="Licence" value={licenseLabel} muted={isUnknown(licenseLabel)} />
          <MetaRow label="Source" value={`${dataset.source.name} (${dataset.source.slug})`} />
          <MetaRow label="Identifiant externe" value={displayValue(dataset.external_id)} />
        </dl>

        <aside className="space-y-6 border-t border-hairline pt-6 lg:border-t-0 lg:border-l lg:pl-8 lg:pt-0">
          <div>
            <p className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-graphite">
              Accès
            </p>
            <a
              href={dataset.source_url}
              target="_blank"
              rel="noopener noreferrer"
              className={`mt-3 inline-flex w-full justify-center ${btnOrange}`}
            >
              Ouvrir sur la source
            </a>
          </div>

          <div className="space-y-2 font-serif text-[13px] leading-relaxed text-slate">
            {dataset.published_at ? <p>Publié : {formatDate(dataset.published_at)}</p> : null}
            <p>Indexé : {formatDate(dataset.created_at)}</p>
            <p>Mis à jour : {formatDate(dataset.updated_at)}</p>
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
