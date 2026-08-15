import Link from "next/link";

import { IndexPreviewStrip } from "@/components/home/IndexPreviewStrip";
import { LanguageSearchForm } from "@/components/catalog/LanguageSearchForm";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { btnDark, btnGhost, pageShell } from "@/components/ui/styles";
import { loadCatalogPreview } from "@/lib/catalog-preview";

const QUICK_LANGUAGES = [
  { label: "Yoruba", href: "/languages/Yoruba" },
  { label: "Wolof", href: "/languages/wol" },
  { label: "Swahili", href: "/languages/Swahili" },
];

const CAPABILITIES = [
  {
    title: "Catalogue",
    description: "Recherche par langue, filtrage combiné et fiches métadonnées avec lien source.",
    href: "/search",
  },
  {
    title: "API REST v1",
    description: "Schémas stables en lecture seule — intégration directe dans vos pipelines.",
    href: `${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"}/docs`,
    external: true,
  },
  {
    title: "Contribution",
    description: "Les chercheurs référencent leurs datasets avec traçabilité de provenance.",
    href: "/contribute",
  },
  {
    title: "Administration",
    description: "CRUD global des entrées et gestion des comptes, réservé aux administrateurs.",
    href: "/admin/datasets",
  },
];

export default async function Home() {
  const preview = await loadCatalogPreview();

  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <section className="border-b border-hairline">
        <div className={`${pageShell} grid gap-12 py-14 lg:grid-cols-[1fr_380px] lg:gap-16 lg:py-20`}>
          <div className="max-w-xl space-y-6">
            <p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.16em] text-graphite">
              Y&apos;TILiKAN · AfroLang-Library
            </p>
            <h1 className="font-display text-[2rem] font-medium leading-[1.12] tracking-[-0.01em] text-ink-black sm:text-[2.5rem]">
              Index des datasets de langues africaines
            </h1>
            <p className="font-serif text-base leading-relaxed text-slate">
              Référence unifiée des métadonnées NLP — langues, tâches, sources et provenance.
              Consultation publique, contribution chercheur et administration authentifiée.
            </p>

            {preview.datasets.length > 0 ? (
              <dl className="flex flex-wrap gap-x-8 gap-y-3 border-t border-hairline pt-6">
                <div>
                  <dt className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-slate">Datasets</dt>
                  <dd className="mt-0.5 font-display text-xl tabular-nums text-ink-black">{preview.datasets.length}</dd>
                </div>
                <div>
                  <dt className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-slate">Langues</dt>
                  <dd className="mt-0.5 font-display text-xl tabular-nums text-ink-black">{preview.languageCount}</dd>
                </div>
                <div>
                  <dt className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-slate">Tâches</dt>
                  <dd className="mt-0.5 font-display text-xl tabular-nums text-ink-black">{preview.taskCodes.length}</dd>
                </div>
                <div>
                  <dt className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-slate">Sources</dt>
                  <dd className="mt-0.5 font-display text-xl tabular-nums text-ink-black">{preview.sourceSlugs.length}</dd>
                </div>
              </dl>
            ) : null}
          </div>

          <div className="space-y-5 lg:pt-1">
            <div className="rounded-sm border border-hairline bg-pure-white p-5">
              <p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.12em] text-graphite">
                Rechercher une langue
              </p>
              <div className="mt-4">
                <LanguageSearchForm compact mode="overview" submitLabel="Explorer" />
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {QUICK_LANGUAGES.map((lang) => (
                <Link
                  key={lang.href}
                  href={lang.href}
                  className="rounded-sm border border-hairline bg-pure-white px-3 py-1.5 font-mono-ui text-[10px] uppercase tracking-[0.08em] text-ink-black transition hover:border-graphite"
                >
                  {lang.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      </section>

      <IndexPreviewStrip datasets={preview.datasets} />

      <section className={`${pageShell} py-14 lg:py-16`}>
        <div className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.12em] text-ink-black">
              Parcourir
            </h2>
            <p className="mt-2 font-serif text-sm text-slate">Accès direct aux vues du catalogue.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/search" className={btnDark}>
              Rechercher
            </Link>
            <Link href="/filter" className={btnGhost}>
              Filtrer
            </Link>
            <Link href="/languages" className={btnGhost}>
              Langues
            </Link>
          </div>
        </div>

        <ul className="mt-10 divide-y divide-hairline border-y border-hairline">
          {CAPABILITIES.map((item) => (
            <li key={item.title} className="grid gap-2 py-5 sm:grid-cols-[140px_1fr_auto] sm:items-baseline sm:gap-8">
              <span className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.08em] text-terracotta">
                {item.title}
              </span>
              <p className="font-serif text-sm leading-relaxed text-slate">{item.description}</p>
              {"external" in item && item.external ? (
                <a
                  href={item.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-mono-ui text-[10px] uppercase tracking-wide text-indigo-deep hover:text-ink-black sm:text-right"
                >
                  Ouvrir ↗
                </a>
              ) : (
                <Link
                  href={item.href}
                  className="font-mono-ui text-[10px] uppercase tracking-wide text-indigo-deep hover:text-ink-black sm:text-right"
                >
                  Accéder →
                </Link>
              )}
            </li>
          ))}
        </ul>
      </section>

      <SiteFooter />
    </div>
  );
}
