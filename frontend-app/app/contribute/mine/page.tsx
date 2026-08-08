"use client";

import { ResearcherGate } from "@/components/auth/ResearcherGate";
import { MyDatasetsPanel } from "@/components/contribute/MyDatasetsPanel";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { sectionGap } from "@/components/ui/styles";

export default function ContributeMinePage() {
  return (
    <ResearcherGate>
      {() => (
        <>
          <main className={`${sectionGap} flex-1 pt-12`}>
            <MyDatasetsPanel />
          </main>
          <SiteFooter />
        </>
      )}
    </ResearcherGate>
  );
}
