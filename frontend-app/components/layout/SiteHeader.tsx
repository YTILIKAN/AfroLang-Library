"use client";



import Link from "next/link";

import { usePathname } from "next/navigation";



import { useAuth } from "@/components/auth/AuthProvider";

import { AfriLandLogo } from "@/components/layout/AfriLandLogo";

import { KenteBand } from "@/components/ui/KenteBand";

import { btnDark, btnGhost, btnOrange } from "@/components/ui/styles";



const NAV = [

  { href: "/search", label: "Recherche" },

  { href: "/filter", label: "Filtres" },

  { href: "/languages", label: "Langues" },

  { href: "/contribute", label: "Contribuer", auth: true },

  { href: `${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"}/docs`, label: "API", external: true },

];



const ADMIN_NAV = [

  { href: "/admin/datasets", label: "Datasets" },

  { href: "/admin/accounts", label: "Comptes" },

];



export function SiteHeader() {

  const pathname = usePathname();

  const { account, loading, logout } = useAuth();

  const isAdminRoute = pathname.startsWith("/admin");



  return (

    <header className="sticky top-0 z-50 border-b border-hairline bg-cream-paper/95 backdrop-blur-sm">

      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-6 px-6 py-4">

        <AfriLandLogo />



        <nav className="hidden items-center gap-8 lg:flex">

          {NAV.map((item) => {

            if (item.auth && !account) {

              return null;

            }

            const isActive = !item.external && pathname.startsWith(item.href);

            const linkClass = `font-mono-ui text-[11px] font-medium uppercase tracking-[0.015em] transition ${

              isActive ? "text-terracotta" : "text-slate hover:text-ink-black"

            }`;



            return item.external ? (

              <a key={item.href} href={item.href} target="_blank" rel="noopener noreferrer" className={linkClass}>

                {item.label}

              </a>

            ) : (

              <Link key={item.href} href={item.href} className={linkClass}>

                {item.label}

              </Link>

            );

          })}

          {account?.role === "admin" || isAdminRoute

            ? ADMIN_NAV.map((item) => {

                const isActive = pathname.startsWith(item.href);

                return (

                  <Link

                    key={item.href}

                    href={item.href}

                    className={`font-mono-ui text-[11px] font-medium uppercase tracking-[0.015em] transition ${

                      isActive ? "text-terracotta" : "text-slate hover:text-ink-black"

                    }`}

                  >

                    {item.label}

                  </Link>

                );

              })

            : null}

        </nav>



        <div className="flex items-center gap-2">

          {loading ? (

            <span className="font-mono-ui text-[10px] uppercase tracking-[0.015em] text-slate">…</span>

          ) : account ? (

            <>

              <span className="hidden font-mono-ui text-[10px] uppercase tracking-[0.015em] text-graphite sm:inline">

                {account.display_name}

              </span>

              {account.role === "admin" ? (

                <Link href="/admin/datasets" className={btnDark}>

                  Admin

                </Link>

              ) : null}

              <Link href="/contribute" className={btnGhost}>

                Contribuer

              </Link>

              <button type="button" onClick={() => void logout()} className={btnGhost}>

                Déconnexion

              </button>

            </>

          ) : (

            <>

              <Link href="/admin/datasets" className={btnDark}>

                Admin

              </Link>

              <Link href="/auth/login" className={btnOrange}>

                Connexion

              </Link>

            </>

          )}

        </div>

      </div>

      <KenteBand />

    </header>

  );

}


