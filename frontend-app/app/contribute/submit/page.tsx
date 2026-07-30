"use client";

import Link from "next/link";

import { ResearcherGate } from "@/components/auth/ResearcherGate";
import { SubmitDatasetForm } from "@/components/contribute/SubmitDatasetForm";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { pageShell, sectionGap } from "@/components/ui/styles";

export default function ContributeSubmitPage() {
  return (
    <ResearcherGate>
      {() => (
        <>
          <main className={`${pageShell} ${sectionGap} flex-1 pt-12`}>
            <Link
              href="/contribute"
              className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-slate hover:text-ink-black"
            >
              ← Espace contribution
            </Link>
            <div className="mt-8">
              <SubmitDatasetForm />
            </div>
          </main>
          <SiteFooter />
        </>
      )}
    </ResearcherGate>
  );
}
