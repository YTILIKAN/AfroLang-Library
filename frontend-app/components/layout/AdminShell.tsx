"use client";

import Link from "next/link";

import { AdminNav } from "@/components/admin/AdminNav";
import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { pageShell, workflowGrid } from "@/components/ui/styles";

interface AdminShellProps {
  active: "datasets" | "accounts";
  adminName: string;
  onLogout: () => void;
  children: React.ReactNode;
  actions?: React.ReactNode;
}

export function AdminShell({ active, adminName, onLogout, children, actions }: AdminShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <div className={`${pageShell} flex-1 py-8 lg:py-10`}>
        <div className={workflowGrid}>
          <aside className="space-y-4">
            <div className="rounded-sm border border-hairline bg-pure-white">
              <div className="border-b border-hairline px-4 py-3">
                <p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.12em] text-ink-black">
                  Administration
                </p>
                <p className="mt-1 truncate font-serif text-xs text-slate">{adminName}</p>
              </div>
              <div className="p-2">
                <AdminNav active={active} layout="vertical" />
              </div>
              <div className="space-y-1 border-t border-hairline p-2">
                <Link href="/" className="block px-3 py-2 font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate hover:text-ink-black">
                  ← Catalogue public
                </Link>
                <button
                  type="button"
                  onClick={onLogout}
                  className="block w-full px-3 py-2 text-left font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate hover:text-ink-black"
                >
                  Déconnexion
                </button>
              </div>
            </div>
          </aside>
          <div className="min-w-0 space-y-6">
            {actions ? <div className="flex flex-wrap justify-end gap-2">{actions}</div> : null}
            {children}
          </div>
        </div>
      </div>
      <SiteFooter />
    </div>
  );
}
