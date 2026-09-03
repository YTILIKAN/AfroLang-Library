import Link from "next/link";

import { DatasetCard } from "@/components/catalog/DatasetCard";
import { btnDark, pageShell } from "@/components/ui/styles";
import { DatasetSummary } from "@/lib/types";

/** Fiches montrées en aperçu sur l'accueil — l'index complet vit sur `/catalog`. */
export const HOME_PREVIEW_SIZE = 6;

interface HomeCatalogSectionProps {
  datasets: DatasetSummary[];
  total: number;
  loadError: boolean;
  loading?: boolean;
}

/**
 * Aperçu du catalogue sur l'accueil : six fiches, puis un renvoi vers `/catalog`.
 *
 * L'accueil ne déroule plus l'index par paliers — c'était un doublon de l'explorateur, seul
 * écran à porter la recherche plein texte et les quatre facettes.
 */
export function HomeCatalogSection({ datasets, total, loadError, loading = false }: HomeCatalogSectionProps) {
  const preview = datasets.slice(0, HOME_PREVIEW_SIZE);
  const remaining = Math.max(total - preview.length, 0);

  return (
    <section className="border-t border-hairline bg-savanna/30" aria-labelledby="catalog-heading">
      <div className="kente-band kente-band-md" aria-hidden />
      <div className={`${pageShell} py-12 lg:py-16`}>
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

        {loadError ? (
          <div className="mt-10 rounded-sm border border-terracotta/30 bg-pure-white p-6">
            <p className="font-display text-lg text-ink-black">Catalogue momentanément indisponible</p>
            <p className="mt-2 font-serif text-sm text-slate">
              L&apos;API backend ne répond pas. Vérifiez que{" "}
              <code className="font-mono-ui text-[11px]">NEXT_PUBLIC_API_URL</code> pointe vers{" "}
              <code className="font-mono-ui text-[11px]">https://afrilang-api.up.railway.app</code>.
            </p>
          </div>
        ) : loading ? (
          <div className="mt-10 rounded-sm border border-hairline bg-pure-white p-8 text-center">
            <p className="font-display text-lg text-ink-black">Chargement du catalogue…</p>
            <p className="mt-2 font-serif text-sm text-slate">Récupération des datasets depuis l&apos;index public.</p>
          </div>
        ) : preview.length === 0 ? (
          <div className="mt-10 rounded-sm border border-hairline bg-pure-white p-8 text-center">
            <p className="font-display text-lg text-ink-black">Aucun dataset pour le moment</p>
            <p className="mt-2 font-serif text-sm text-slate">
              L&apos;index sera alimenté dès que des ressources seront enregistrées en base.
            </p>
          </div>
        ) : (
          <>
            <ul id="catalog-list" className="mt-10 grid gap-8 lg:grid-cols-2">
              {preview.map((dataset) => (
                <li key={dataset.id}>
                  <DatasetCard dataset={dataset} />
                </li>
              ))}
            </ul>

            <div className="mt-10 flex flex-col items-center gap-2">
              <Link href="/catalog" className={btnDark}>
                {remaining > 0 ? `Lire plus (${remaining})` : "Explorer le catalogue"}
              </Link>
              <p className="font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate">
                {remaining > 0
                  ? `Encore ${remaining} dataset${remaining > 1 ? "s" : ""} dans le catalogue complet`
                  : "Recherche plein texte et facettes sur la page catalogue"}
              </p>
            </div>
          </>
        )}
      </div>
    </section>
  );
}
