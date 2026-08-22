import Link from "next/link";

import { DatasetCard } from "@/components/catalog/DatasetCard";
import { btnGhost, pageShell } from "@/components/ui/styles";
import { DatasetSummary } from "@/lib/types";

interface HomeCatalogSectionProps {
  datasets: DatasetSummary[];
  total: number;
  loadError: boolean;
}

export function HomeCatalogSection({ datasets, total, loadError }: HomeCatalogSectionProps) {
  return (
    <section className="border-t border-hairline bg-savanna/30" aria-labelledby="catalog-heading">
      <div className="kente-band kente-band-md" aria-hidden />
      <div className={`${pageShell} py-12 lg:py-16`}>
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div className="max-w-2xl space-y-2">
            <p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.14em] text-terracotta">
              Catalogue public
            </p>
            <h2 id="catalog-heading" className="font-display text-2xl font-medium tracking-[-0.01em] text-ink-black">
              {total > 0 ? `${total} dataset${total > 1 ? "s" : ""} référencé${total > 1 ? "s" : ""}` : "Index des datasets"}
            </h2>
            <p className="font-serif text-sm leading-relaxed text-slate">
              Consultation libre — métadonnées, langues, tâches NLP et liens vers les sources d&apos;origine.
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/search" className={btnGhost}>
              Par langue
            </Link>
            <Link href="/filter" className={btnGhost}>
              Filtrer
            </Link>
          </div>
        </div>

        {loadError ? (
          <div className="mt-10 rounded-sm border border-terracotta/30 bg-pure-white p-6">
            <p className="font-display text-lg text-ink-black">Catalogue momentanément indisponible</p>
            <p className="mt-2 font-serif text-sm text-slate">
              L&apos;API backend ne répond pas. Vérifiez que le service est démarré et que{" "}
              <code className="font-mono-ui text-[11px]">API_URL</code> pointe vers le bon backend.
            </p>
          </div>
        ) : datasets.length === 0 ? (
          <div className="mt-10 rounded-sm border border-hairline bg-pure-white p-8 text-center">
            <p className="font-display text-lg text-ink-black">Aucun dataset pour le moment</p>
            <p className="mt-2 font-serif text-sm text-slate">
              L&apos;index sera alimenté dès que des ressources seront enregistrées en base.
            </p>
          </div>
        ) : (
          <ul className="mt-10 grid gap-8 lg:grid-cols-2">
            {datasets.map((dataset) => (
              <li key={dataset.id}>
                <DatasetCard dataset={dataset} />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
