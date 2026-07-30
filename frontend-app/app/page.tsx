import Link from "next/link";

import { HeroDataPanel } from "@/components/layout/HeroDataPanel";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LanguageSearchForm } from "@/components/catalog/LanguageSearchForm";
import { btnDark, btnGhost, pageShell, sectionGap } from "@/components/ui/styles";

const FEATURES = [
  {
    title: "Catalogue public",
    body: "Recherche et filtrage des métadonnées via l'API REST v1 — langues, tâches NLP, provenance.",
  },
  {
    title: "Administration",
    body: "CRUD des datasets et gestion des comptes chercheurs et administrateurs, authentifiés.",
  },
  {
    title: "Provenance",
    body: "Distinction synchronisé, contribué et manuel pour tracer l'origine de chaque entrée.",
  },
  {
    title: "Contrat API",
    body: "Schémas stables documentés dans OpenAPI — intégration directe pour vos pipelines.",
  },
];

export default function Home() {
  return (
    <div className="flex flex-1 flex-col">
      <SiteHeader />

      <section className={`${pageShell} ${sectionGap} pt-12`}>
        <div className="max-w-3xl space-y-4">
          <h1 className="text-[36px] font-medium leading-[1.11] tracking-[0.012em] text-ink-black">
            Index des datasets de langues africaines
          </h1>
          <p className="text-[26px] font-normal leading-[1.23] tracking-[0.012em] text-ink-black">
            Consultation publique et administration authentifiée —{" "}
            <span className="text-signal-orange">un seul index</span>.
          </p>
        </div>

        <div className="mt-10 max-w-xl">
          <LanguageSearchForm compact />
        </div>
      </section>

      <HeroDataPanel />

      <section className={`${pageShell} ${sectionGap}`}>
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map((feature) => (
            <article key={feature.title} className="border-t border-hairline pt-6">
              <h2 className="font-mono-ui text-sm font-medium uppercase tracking-[0.012em] text-ink-black">
                {feature.title}
              </h2>
              <p className="mt-3 font-serif text-sm leading-relaxed text-slate">{feature.body}</p>
            </article>
          ))}
        </div>

        <div className="mt-16 flex flex-wrap gap-2">
          <Link href="/search" className={btnDark}>
            Rechercher
          </Link>
          <Link href="/languages" className={btnGhost}>
            Langues
          </Link>
          <Link href="/filter" className={btnGhost}>
            Filtrer
          </Link>
          <Link href="/admin/datasets" className={btnGhost}>
            Administration
          </Link>
          <a
            href={`${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className={btnGhost}
          >
            Documentation API
          </a>
        </div>
      </section>

      <SiteFooter />
    </div>
  );
}
