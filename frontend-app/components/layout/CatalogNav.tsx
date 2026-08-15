"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { navLinkActiveClass, navLinkIdleClass, panelClass, panelHeaderClass } from "@/components/ui/styles";

const CATALOG_LINKS = [
  { href: "/search", label: "Recherche", match: (path: string) => path.startsWith("/search") || path.startsWith("/datasets/") },
  { href: "/filter", label: "Filtres", match: (path: string) => path.startsWith("/filter") },
  { href: "/languages", label: "Langues", match: (path: string) => path.startsWith("/languages") },
] as const;

const QUICK_LANGUAGES = [
  { label: "Yoruba", href: "/languages/Yoruba" },
  { label: "Wolof", href: "/languages/wol" },
  { label: "Swahili", href: "/languages/Swahili" },
];

export function CatalogNav() {
  const pathname = usePathname();

  return (
    <nav className={panelClass} aria-label="Navigation catalogue">
      <div className={panelHeaderClass}>
        <p className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.12em] text-ink-black">
          Catalogue
        </p>
      </div>
      <ul className="space-y-0.5 p-2">
        {CATALOG_LINKS.map((link) => (
          <li key={link.href}>
            <Link
              href={link.href}
              className={link.match(pathname) ? navLinkActiveClass : navLinkIdleClass}
            >
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
      <div className="border-t border-hairline p-3">
        <p className="font-mono-ui text-[9px] uppercase tracking-[0.12em] text-slate">Raccourcis</p>
        <ul className="mt-2 space-y-1">
          {QUICK_LANGUAGES.map((lang) => (
            <li key={lang.href}>
              <Link
                href={lang.href}
                className="font-serif text-sm text-ink-black hover:text-indigo-deep"
              >
                {lang.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
