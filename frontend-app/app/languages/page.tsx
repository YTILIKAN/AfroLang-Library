import Link from "next/link";

import { LanguageSearchForm } from "@/components/catalog/LanguageSearchForm";
import { CatalogNav } from "@/components/layout/CatalogNav";
import { WorkflowHeader, WorkflowShell } from "@/components/layout/WorkflowShell";
import { tagClass } from "@/components/ui/styles";

const FEATURED_LANGUAGES = [
  { label: "Yoruba", slug: "Yoruba" },
  { label: "Wolof", slug: "wol" },
  { label: "Swahili", slug: "Swahili" },
];

export default function LanguagesIndexPage() {
  return (
    <WorkflowShell sidebar={<CatalogNav />}>
      <div className="space-y-8">
        <WorkflowHeader
          eyebrow="Catalogue"
          title="Explorer par langue"
          description="Compteurs, tâches NLP couvertes et liste des datasets par langue."
        />

        <div className="rounded-sm border border-hairline bg-pure-white p-4">
          <LanguageSearchForm mode="overview" submitLabel="Ouvrir" compact />
        </div>

        <section className="space-y-3">
          <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-slate">Indexées</p>
          <ul className="flex flex-wrap gap-2">
            {FEATURED_LANGUAGES.map((item) => (
              <li key={item.slug}>
                <Link
                  href={`/languages/${encodeURIComponent(item.slug)}`}
                  className={`${tagClass} px-3 py-2 hover:border-graphite`}
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </WorkflowShell>
  );
}
