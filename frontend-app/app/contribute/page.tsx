"use client";

import Link from "next/link";

import { ResearcherGate } from "@/components/auth/ResearcherGate";
import { ContributeNav } from "@/components/layout/ContributeNav";
import { WorkflowHeader, WorkflowShell } from "@/components/layout/WorkflowShell";
import { btnDark, btnGhost, tagClass } from "@/components/ui/styles";
import { Account } from "@/lib/types";

function ContributeHub({ account, onLogout }: { account: Account; onLogout: () => void }) {
  return (
    <WorkflowShell sidebar={<ContributeNav />}>
      <div className="space-y-8">
        <WorkflowHeader
          eyebrow={account.role === "chercheur" ? "Chercheur" : "Administrateur"}
          title="Contribuer à l'index"
          description={`Connecté en tant que ${account.display_name} — soumettez et gérez vos datasets.`}
          actions={<span className={tagClass}>{account.email}</span>}
        />

        <div className="divide-y divide-hairline border-y border-hairline">
          <article className="grid gap-4 py-6 sm:grid-cols-[160px_1fr_auto] sm:items-center">
            <h2 className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-terracotta">Soumettre</h2>
            <p className="font-serif text-sm text-slate">
              Référencer un dataset avec métadonnées et lien vers la source.
            </p>
            <Link href="/contribute/submit" className={`${btnDark} justify-self-start sm:justify-self-end`}>
              Ouvrir
            </Link>
          </article>
          <article className="grid gap-4 py-6 sm:grid-cols-[160px_1fr_auto] sm:items-center">
            <h2 className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-terracotta">Mes datasets</h2>
            <p className="font-serif text-sm text-slate">Voir, modifier ou retirer vos contributions.</p>
            <Link href="/contribute/mine" className={`${btnGhost} justify-self-start sm:justify-self-end`}>
              Consulter
            </Link>
          </article>
        </div>

        <button type="button" onClick={onLogout} className={btnGhost}>
          Se déconnecter
        </button>
      </div>
    </WorkflowShell>
  );
}

export default function ContributePage() {
  return (
    <ResearcherGate>
      {(account, onLogout) => <ContributeHub account={account} onLogout={onLogout} />}
    </ResearcherGate>
  );
}
