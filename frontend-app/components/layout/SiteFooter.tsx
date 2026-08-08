import Link from "next/link";



import { KenteBand } from "@/components/ui/KenteBand";



const FOOTER_COLUMNS: {

  title: string;

  links: { label: string; href: string; external?: boolean }[];

}[] = [

  {

    title: "Catalogue",

    links: [

      { label: "Recherche", href: "/search" },

      { label: "Filtrage", href: "/filter" },

      { label: "Langues", href: "/languages" },

      {

        label: "API REST",

        href: `${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"}/api/v1`,

        external: true,

      },

    ],

  },

  {

    title: "Contribution",

    links: [

      { label: "Espace chercheur", href: "/contribute" },

      { label: "Soumettre un dataset", href: "/contribute/submit" },

      { label: "Mes contributions", href: "/contribute/mine" },

    ],

  },

  {

    title: "Administration",

    links: [

      { label: "Datasets", href: "/admin/datasets" },

      { label: "Comptes", href: "/admin/accounts" },

    ],

  },

];



export function SiteFooter() {

  return (

    <>

      <section className="footer-dither relative flex min-h-[200px] flex-col items-center justify-center gap-6 px-6 py-14">

        <KenteBand className="absolute inset-x-0 top-0 w-full" />

        <p className="max-w-md text-center font-display text-xl font-medium leading-snug tracking-[0.02em] text-cream-paper">

          Préserver et partager les ressources linguistiques du continent

        </p>

        <div className="inline-flex overflow-hidden rounded-sm border border-graphite/50 bg-ink-black/80">

          <span className="px-4 py-2 font-mono-ui text-[11px] font-medium uppercase tracking-[0.015em] text-ochre">

            Index

          </span>

          <span className="border-l border-graphite/50 px-4 py-2 font-mono-ui text-[11px] font-medium uppercase tracking-[0.015em] text-slate">

            Métadonnées

          </span>

          <span className="border-l border-graphite/50 px-4 py-2 font-mono-ui text-[11px] font-medium uppercase tracking-[0.015em] text-forest">

            Open

          </span>

        </div>

      </section>



      <footer className="pattern-mudcloth px-6 pb-16 pt-12">

        <div className="mx-auto grid max-w-[1200px] gap-12 md:grid-cols-2 lg:grid-cols-4">

          {FOOTER_COLUMNS.map((column) => (

            <div key={column.title}>

              <h3 className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-terracotta">

                {column.title}

              </h3>

              <ul className="mt-4 space-y-1.5">

                {column.links.map((link) => (

                  <li key={link.label}>

                    {link.external ? (

                      <a

                        href={link.href}

                        target="_blank"

                        rel="noopener noreferrer"

                        className="font-serif text-[13px] leading-relaxed text-ink-black hover:text-indigo-deep"

                      >

                        {link.label}

                      </a>

                    ) : (

                      <Link

                        href={link.href}

                        className="font-serif text-[13px] leading-relaxed text-ink-black hover:text-indigo-deep"

                      >

                        {link.label}

                      </Link>

                    )}

                  </li>

                ))}

              </ul>

            </div>

          ))}

          <div>

            <h3 className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-terracotta">

              Statut

            </h3>

            <p className="mt-4 flex items-center gap-2 font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-ink-black">

              <span className="inline-block h-2 w-2 rounded-full bg-forest shadow-[0_0_0_2px_rgb(61_107_53/0.25)]" />

              Système opérationnel

            </p>

            <p className="mt-6 font-serif text-[13px] leading-relaxed text-slate">

              AfroLang-Library · Y&apos;TILiKAN

            </p>

            <p className="mt-2 font-mono-ui text-[10px] uppercase tracking-[0.1em] text-graphite">

              NLP · Afrique · Open data

            </p>

          </div>

        </div>

      </footer>

    </>

  );

}


