"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { useAuth } from "@/components/auth/AuthProvider";
import { CatalogSearchBar } from "@/components/catalog/CatalogSearchBar";
import { AfriLandLogo } from "@/components/layout/AfriLandLogo";
import { btnGhost, btnOrange } from "@/components/ui/styles";

const NAV = [
  { href: "/", label: "Accueil" },
  { href: "/catalog", label: "Catalogue" },
  { href: "/contribute", label: "Contribuer", auth: true },
  { href: "/api-docs", label: "API" },
];

const ADMIN_NAV = [
  { href: "/admin/datasets", label: "Datasets" },
  { href: "/admin/accounts", label: "Comptes" },
];

const linkBase =
  "relative font-mono-ui text-[10px] font-medium uppercase tracking-[0.12em] whitespace-nowrap transition";

export function SiteHeader() {
  const pathname = usePathname();
  const { account, loading, logout } = useAuth();
  const isAdmin = account?.role === "admin";
  // Accueil et /catalog portent déjà leur propre champ ; la nav admin est trop
  // dense pour accueillir la recherche sans écraser les liens.
  const showSearch =
    pathname !== "/" && !pathname.startsWith("/catalog") && !isAdmin;

  return (
    <header className="sticky top-0 z-50 border-b border-hairline bg-cream-paper/95 backdrop-blur-sm">
      <div className="mx-auto flex max-w-[1200px] items-center gap-6 px-6 py-3">
        <AfriLandLogo className="shrink-0" />

        <nav className="hidden min-w-0 items-center gap-6 lg:flex">
          {NAV.map((item) => {
            if (item.auth && !account) {
              return null;
            }
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);

            return (
              <Link
                key={item.href}
                href={item.href}
                className={`${linkBase} ${
                  isActive ? "text-ink-black" : "text-slate hover:text-ink-black"
                }`}
              >
                {item.label}
                {isActive ? (
                  <span className="absolute -bottom-3.5 left-0 h-px w-full bg-terracotta" aria-hidden />
                ) : null}
              </Link>
            );
          })}
          {isAdmin ? <span className="h-3 w-px bg-hairline" aria-hidden /> : null}
          {isAdmin
            ? ADMIN_NAV.map((item) => {
                const isActive = pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={`${linkBase} ${
                      isActive
                        ? "text-ink-black"
                        : "text-slate hover:text-ink-black"
                    }`}
                  >
                    {item.label}
                    {isActive ? (
                      <span
                        className="absolute -bottom-3.5 left-0 h-px w-full bg-terracotta"
                        aria-hidden
                      />
                    ) : null}
                  </Link>
                );
              })
            : null}
        </nav>

        {showSearch ? (
          <div className="ml-auto hidden min-w-0 shrink justify-end md:flex">
            <CatalogSearchBar variant="compact" placeholder="Rechercher un dataset…" />
          </div>
        ) : null}

        <div className={`flex shrink-0 items-center gap-3 ${showSearch ? "" : "ml-auto"}`}>
          {loading ? (
            <span className="font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate">
              …
            </span>
          ) : account ? (
            <>
              <span className="hidden font-mono-ui text-[10px] uppercase tracking-[0.1em] text-graphite sm:inline">
                {account.display_name}
              </span>
              <button
                type="button"
                onClick={() => void logout()}
                className={btnGhost}
              >
                Déconnexion
              </button>
            </>
          ) : (
            <Link href="/auth/login" className={btnOrange}>
              Connexion
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
