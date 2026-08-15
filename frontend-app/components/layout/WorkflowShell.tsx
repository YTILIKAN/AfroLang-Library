import { ReactNode } from "react";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { pageShell, workflowGrid } from "@/components/ui/styles";

interface WorkflowShellProps {
  children: ReactNode;
  sidebar?: ReactNode;
}

export function WorkflowShell({ children, sidebar }: WorkflowShellProps) {
  return (
    <div className="flex min-h-full flex-col">
      <SiteHeader />
      <div className={`${pageShell} flex-1 py-8 lg:py-10`}>
        {sidebar ? (
          <div className={workflowGrid}>
            <aside className="space-y-6">{sidebar}</aside>
            <div className="min-w-0">{children}</div>
          </div>
        ) : (
          children
        )}
      </div>
      <SiteFooter />
    </div>
  );
}

interface WorkflowHeaderProps {
  eyebrow: string;
  title: string;
  description?: string;
  actions?: ReactNode;
}

export function WorkflowHeader({ eyebrow, title, description, actions }: WorkflowHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b border-hairline pb-6 sm:flex-row sm:items-start sm:justify-between">
      <div className="max-w-2xl space-y-2">
        <p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.14em] text-graphite">
          {eyebrow}
        </p>
        <h1 className="font-display text-[1.75rem] font-medium leading-[1.15] tracking-[-0.01em] text-ink-black sm:text-[2rem]">
          {title}
        </h1>
        {description ? <p className="font-serif text-sm leading-relaxed text-slate">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 flex-wrap gap-2">{actions}</div> : null}
    </header>
  );
}

export function ErrorBanner({ message }: { message: string }) {
  return (
    <div className="border border-kente-red/20 bg-kente-red/5 px-4 py-3 font-serif text-sm text-ink-black">
      {message}
    </div>
  );
}

export function EmptyState({ message, action }: { message: string; action?: ReactNode }) {
  return (
    <div className="border border-dashed border-hairline px-6 py-10 text-center">
      <p className="font-serif text-sm text-slate">{message}</p>
      {action ? <div className="mt-4">{action}</div> : null}
    </div>
  );
}

export function ResultSummary({ label, count }: { label: string; count: number }) {
  return (
    <div className="flex items-baseline justify-between border-b border-hairline py-4">
      <p className="font-mono-ui text-[10px] uppercase tracking-[0.12em] text-slate">{label}</p>
      <p className="font-display text-xl tabular-nums text-ink-black">
        {count}
        <span className="ml-1 font-serif text-sm font-normal text-slate">
          résultat{count > 1 ? "s" : ""}
        </span>
      </p>
    </div>
  );
}
