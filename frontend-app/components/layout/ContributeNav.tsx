"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navLinkActiveClass, navLinkIdleClass, panelClass, panelHeaderClass } from "@/components/ui/styles";

const CONTRIBUTE_LINKS = [
  { href: "/contribute", label: "Vue d'ensemble", exact: true },
  { href: "/contribute/submit", label: "Soumettre", exact: false },
  { href: "/contribute/mine", label: "Mes datasets", exact: false },
] as const;

function isActive(pathname: string, href: string, exact: boolean): boolean {
  if (exact) {
    return pathname === href;
  }
  return pathname.startsWith(href);
}

export function ContributeNav() {
  const pathname = usePathname();

  return (
    <nav className={panelClass} aria-label="Navigation contribution">
      <div className={panelHeaderClass}>
        <p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.12em] text-ink-black">
          Contribution
        </p>
      </div>
      <ol className="space-y-0.5 p-2">
        {CONTRIBUTE_LINKS.map((link, index) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={`flex items-center gap-2 ${isActive(pathname, link.href, link.exact) ? navLinkActiveClass : navLinkIdleClass}`}
            >
              <span className="font-mono-ui text-[9px] tabular-nums text-slate/70">{index + 1}</span>
              {link.label}
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
