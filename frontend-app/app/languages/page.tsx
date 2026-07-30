import Link from "next/link";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { LanguageSearchForm } from "@/components/catalog/LanguageSearchForm";
import { cardElevated, pageShell, sectionGap, tagClass } from "@/components/ui/styles";

const FEATURED_LANGUAGES = [
  { label: "Yoruba", slug: "Yoruba" },
  { label: "Wolof", slug: "wol" },
  { label: "Swahili", slug: "Swahili" },
];

export default function LanguagesIndexPage() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <main className={`${pageShell} ${sectionGap} flex-1 pt-12`}>
        <div className="max-w-3xl space-y-4">
          <p className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-graphite">
            Catalogue public
          </p>
          <h1 className="text-[36px] font-medium leading-[1.11] tracking-[0.012em] text-ink-black">
            Explorer par langue
          </h1>
          <p className="font-serif text-sm leading-relaxed text-slate">
            Vue d&apos;ensemble : compteurs, tâches NLP couvertes et liste des datasets (FR-14, Story 2.5).
          </p>
        </div>

        <div className={`mt-10 max-w-xl ${cardElevated}`}>
          <LanguageSearchForm mode="overview" submitLabel="Voir la page" compact />
        </div>

        <section className="mt-12 space-y-4">
          <p className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-slate">
            Langues du bouchon
          </p>
          <ul className="flex flex-wrap gap-2">
            {FEATURED_LANGUAGES.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/languages/${encodeURIComponent(item.slug)}`}
                  className={`${tagClass} px-3 py-2 hover:border-ink-black`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </main>

      <SiteFooter />
    </div>
  );
}
