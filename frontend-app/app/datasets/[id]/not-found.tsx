import Link from "next/link";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { btnGhost, pageShell, sectionGap } from "@/components/ui/styles";

export default function DatasetNotFound() {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <main className={`${pageShell} ${sectionGap} flex-1 pt-12 text-center`}>
        <p className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-graphite">
          404
        </p>
        <h1 className="mt-3 text-[26px] font-medium leading-[1.23] text-ink-black">Dataset introuvable</h1>
        <p className="mt-3 font-serif text-sm leading-relaxed text-slate">
          Cette fiche n&apos;existe pas dans l&apos;index ou a été retirée.
        </p>
        <Link href="/catalog" className={`mt-8 inline-flex ${btnGhost}`}>
          Nouvelle recherche
        </Link>
      </main>

      <SiteFooter />
    </div>
  );
}
