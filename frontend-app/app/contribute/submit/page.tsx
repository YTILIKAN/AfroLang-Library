"use client";

import Link from "next/link";

import { ResearcherGate } from "@/components/auth/ResearcherGate";
import { ContributeNav } from "@/components/layout/ContributeNav";
import { WorkflowShell } from "@/components/layout/WorkflowShell";
import { SubmitDatasetForm } from "@/components/contribute/SubmitDatasetForm";

export default function ContributeSubmitPage() {
  return (
    <ResearcherGate>
      {() => (
        <WorkflowShell sidebar={<ContributeNav />}>
          <div className="space-y-6">
            <Link
              href="/contribute"
              className="font-mono-ui text-[10px] uppercase tracking-wide text-slate hover:text-ink-black"
            >
              ← Contribuer
            </Link>
            <SubmitDatasetForm />
          </div>
        </WorkflowShell>
      )}
    </ResearcherGate>
  );
}
