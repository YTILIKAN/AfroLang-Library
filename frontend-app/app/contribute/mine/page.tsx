"use client";

import { ResearcherGate } from "@/components/auth/ResearcherGate";
import { ContributeNav } from "@/components/layout/ContributeNav";
import { WorkflowShell } from "@/components/layout/WorkflowShell";
import { MyDatasetsPanel } from "@/components/contribute/MyDatasetsPanel";

export default function ContributeMinePage() {
  return (
    <ResearcherGate>
      {() => (
        <WorkflowShell sidebar={<ContributeNav />}>
          <MyDatasetsPanel />
        </WorkflowShell>
      )}
    </ResearcherGate>
  );
}
