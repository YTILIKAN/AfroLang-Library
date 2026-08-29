import Link from "next/link";

import { CatalogSearchBar } from "@/components/catalog/CatalogSearchBar";
import {
  HomeCatalogGrid,
  HomeCatalogStats,
  HomePublicCatalogProvider,
} from "@/components/home/HomePublicCatalog";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { btnDark, btnGhost, pageShell } from "@/components/ui/styles";

export const dynamic = "force-dynamic";

const QUICK_LANGUAGES = [
  { label: "Yoruba", href: "/languages/Yoruba" },
  { label: "Wolof", href: "/languages/wol" },
  { label: "Swahili", href: "/languages/Swahili" },
  { label: "Haoussa", href: "/languages/Hausa" },
  { label: "Amharique", href: "/languages/amh" },
];

const CAPABILITIES = [
  {
    title: "Catalogue",
    description:
      "Chercher en plein texte puis affiner par langue, source, tâche NLP et format.",
    href: "/catalog",
  },
  {
    title: "API REST v1",
    description: "Schémas stables en lecture seule — intégration directe dans vos pipelines.",
    href: "/api-docs",
  },
];

export default function Home() {
  return (
    <HomePublicCatalogProvider>
    <div className="flex min-h-full flex-col">
      <div className="kente-band" aria-hidden />
      <SiteHeader />

      <section className="border-b border-hairline pattern-weave">
        <div className={`${pageShell} grid gap-12 py-14 lg:grid-cols-[1fr_360px] lg:gap-16 lg:py-20`}>
          <div className="max-w-2xl space-y-6">
            <p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.16em] text-graphite">
              Y&apos;TILiKAN · AfroLang-Library
            </p>
            <h1 className="font-display text-[2.125rem] font-medium leading-[1.1] tracking-[-0.02em] text-ink-black sm:text-[2.75rem]">
              Datasets de langues africaines, accessibles dès l&apos;ouverture
            </h1>
            <p className="font-serif text-base leading-relaxed text-slate sm:text-lg">
              Référence unifiée des métadonnées NLP — langues, tâches, sources et provenance.
              Parcourez l&apos;index sans créer de compte.
            </p>

            <HomeCatalogStats />
          </div>

          <div className="space-y-5 lg:pt-2">
            <div className="rounded-sm border border-hairline bg-pure-white p-5 shadow-[var(--shadow-card)]">
              <p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.12em] text-graphite">
                Rechercher un dataset
              </p>
              <div className="mt-4">
                <CatalogSearchBar />
              </div>
            </div>
            <div>
              <p className="mb-2 font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate">Fiches langue</p>
              <div className="flex flex-wrap gap-2">
                {QUICK_LANGUAGES.map((lang) => (
                  <Link
                    key={lang.href}
                    href={lang.href}
                    className="rounded-sm border border-hairline bg-pure-white px-3 py-1.5 font-mono-ui text-[10px] uppercase tracking-[0.08em] text-ink-black transition hover:border-terracotta/50 hover:bg-savanna"
                  >
                    {lang.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      <HomeCatalogGrid />

      <section className={`${pageShell} py-14 lg:py-16`}>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.12em] text-ink-black">
              Aller plus loin
            </h2>
            <p className="mt-2 font-serif text-sm text-slate">Autres vues et intégrations.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link href="/auth/login" className={btnGhost}>
              Connexion chercheur
            </Link>
            <Link href="/contribute" className={btnDark}>
              Contribuer
            </Link>
          </div>
        </div>

        <ul className="mt-10 divide-y divide-hairline border-y border-hairline">
          {CAPABILITIES.map((item) => (
            <li key={item.title} className="grid gap-2 py-5 sm:grid-cols-[120px_1fr_auto] sm:items-baseline sm:gap-8">
              <span className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.08em] text-terracotta">
                {item.title}
              </span>
              <p className="font-serif text-sm leading-relaxed text-slate">{item.description}</p>
              <Link
                href={item.href}
                className="font-mono-ui text-[10px] uppercase tracking-wide text-indigo-deep hover:text-ink-black sm:text-right"
              >
                Accéder →
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <SiteFooter />
    </div>
    </HomePublicCatalogProvider>
  );
}
