"use client";

import Link from "next/link";

import { ResearcherGate } from "@/components/auth/ResearcherGate";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { btnDark, btnGhost, pageShell, sectionGap, tagClass, accentBar, headingDisplay } from "@/components/ui/styles";
import { Account } from "@/lib/types";

function ContributeHub({ account, onLogout }: { account: Account; onLogout: () => void }) {
  return (
    <>
      <main className={`${pageShell} ${sectionGap} flex-1 pt-12`}>
        <div className="max-w-3xl space-y-4">
          <div className={accentBar} aria-hidden />
          <p className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-terracotta">
            Espace chercheur
          </p>
          <h1 className={headingDisplay}>Contribuer à l&apos;index</h1>
          <p className="font-serif text-sm leading-relaxed text-slate">
            Connecté en tant que {account.display_name} ({account.role}) — soumission et gestion de vos
            datasets (Stories 3.5–3.6).
          </p>
          <span className={tagClass}>{account.email}</span>
        </div>

        <div className="mt-12 grid gap-8 md:grid-cols-2">
          <article className="border-t border-hairline pt-6">
            <h2 className="font-mono-ui text-sm font-medium uppercase tracking-[0.012em] text-ink-black">
              Soumettre un dataset
            </h2>
            <p className="mt-3 font-serif text-sm leading-relaxed text-slate">
              Référencer un dataset avec métadonnées et lien source (FR-17).
            </p>
            <Link href="/contribute/submit" className={`mt-4 inline-flex ${btnDark}`}>
              Ouvrir le formulaire
            </Link>
          </article>

          <article className="border-t border-hairline pt-6">
            <h2 className="font-mono-ui text-sm font-medium uppercase tracking-[0.012em] text-ink-black">
              Mes datasets
            </h2>
            <p className="mt-3 font-serif text-sm leading-relaxed text-slate">
              Voir, modifier ou retirer vos propres contributions (FR-18).
            </p>
            <Link href="/contribute/mine" className={`mt-4 inline-flex ${btnGhost}`}>
              Voir mes soumissions
            </Link>
          </article>
        </div>

        <button type="button" onClick={onLogout} className={`mt-16 ${btnGhost}`}>
          Se déconnecter
        </button>
      </main>
      <SiteFooter />
    </>
  );
}

export default function ContributePage() {
  return (
    <ResearcherGate>
      {(account, onLogout) => <ContributeHub account={account} onLogout={onLogout} />}
    </ResearcherGate>
  );
}
