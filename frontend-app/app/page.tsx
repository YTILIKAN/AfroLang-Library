import Link from "next/link";



import { HeroDataPanel } from "@/components/layout/HeroDataPanel";

import { SiteFooter } from "@/components/layout/SiteFooter";

import { SiteHeader } from "@/components/layout/SiteHeader";

import { LanguageSearchForm } from "@/components/catalog/LanguageSearchForm";

import { accentBar, btnDark, btnGhost, headingDisplay, headingLead, pageShell, sectionGap } from "@/components/ui/styles";



const FEATURES = [

  {

    title: "Catalogue public",

    body: "Recherche et filtrage des métadonnées via l'API REST v1 — langues, tâches NLP, provenance.",

    accent: "from-indigo-deep to-terracotta",

  },

  {

    title: "Administration",

    body: "CRUD des datasets et gestion des comptes chercheurs et administrateurs, authentifiés.",

    accent: "from-ochre to-kente-red",

  },

  {

    title: "Provenance",

    body: "Distinction synchronisé, contribué et manuel pour tracer l'origine de chaque entrée.",

    accent: "from-forest to-indigo-deep",

  },

  {

    title: "Contrat API",

    body: "Schémas stables documentés dans OpenAPI — intégration directe pour vos pipelines.",

    accent: "from-terracotta to-ochre",

  },

];



export default function Home() {

  return (

    <div className="flex flex-1 flex-col">

      <SiteHeader />



      <section className={`${pageShell} ${sectionGap} pt-12 pattern-weave`}>

        <div className="max-w-3xl space-y-5">

          <div className={accentBar} aria-hidden />

          <p className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.14em] text-terracotta">

            AfroLang-Library · Y&apos;TILiKAN

          </p>

          <h1 className={headingDisplay}>Index des datasets de langues africaines</h1>

          <p className={headingLead}>

            Consultation publique et administration authentifiée —{" "}

            <span className="text-terracotta">un seul index</span> pour le continent.

          </p>

        </div>



        <div className="mt-10 max-w-xl rounded-sm border border-hairline bg-pure-white/80 p-5 shadow-[var(--shadow-card)] backdrop-blur-sm">

          <LanguageSearchForm compact />

        </div>

      </section>



      <HeroDataPanel />



      <section className={`${pageShell} ${sectionGap}`}>

        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-4">

          {FEATURES.map((feature) => (

            <article key={feature.title} className="group border-t-2 border-hairline pt-6 transition hover:border-terracotta/40">

              <div

                className={`mb-4 h-0.5 w-8 bg-gradient-to-r ${feature.accent} opacity-70 transition group-hover:w-12 group-hover:opacity-100`}

                aria-hidden

              />

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

          <Link href="/contribute" className={btnGhost}>

            Contribuer

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


