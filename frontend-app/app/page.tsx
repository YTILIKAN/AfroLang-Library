import Link from "next/link";

import { API_URL } from "@/lib/config";

const PRIMARY_LINK_CLASS =
  "inline-flex items-center justify-center rounded-lg bg-emerald-700 px-5 py-3 text-sm font-medium text-white transition hover:bg-emerald-800";

const SECONDARY_LINK_CLASS =
  "inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-100";

export default function Home() {
  return (
    <div className="flex flex-1 flex-col bg-zinc-50">
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col justify-center gap-8 px-6 py-16">
        <div className="space-y-3">
          <p className="text-sm font-medium uppercase tracking-wide text-emerald-700">AfroLang-Library</p>
          <h1 className="text-3xl font-semibold text-zinc-900">Index des datasets de langues africaines</h1>
          <p className="text-lg leading-8 text-zinc-600">
            Consultation publique et administration authentifiée de l&apos;index.
          </p>
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Link href="/recherche" className={PRIMARY_LINK_CLASS}>
            Rechercher un dataset
          </Link>
          <Link href="/langues" className={PRIMARY_LINK_CLASS}>
            Explorer par langue
          </Link>
          <a
            href={`${API_URL}/docs`}
            target="_blank"
            rel="noopener noreferrer"
            className={SECONDARY_LINK_CLASS}
          >
            Documentation API
          </a>
        </div>

        <div className="space-y-3 border-t border-zinc-200 pt-6">
          <h2 className="text-sm font-medium uppercase tracking-wide text-zinc-500">
            Espace authentifié
          </h2>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Link href="/admin/datasets" className={SECONDARY_LINK_CLASS}>
              Administration des datasets
            </Link>
            <Link href="/admin/accounts" className={SECONDARY_LINK_CLASS}>
              Gestion des comptes
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
