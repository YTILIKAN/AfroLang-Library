import Link from "next/link";

const FOOTER_COLUMNS: {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}[] = [
  {
    title: "Catalogue",
    links: [
      { label: "Recherche API", href: `${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"}/api/v1`, external: true },
      { label: "Filtrage", href: `${process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:8000"}/docs`, external: true },
    ],
  },
  {
    title: "Administration",
    links: [
      { label: "Datasets", href: "/admin/datasets" },
      { label: "Comptes", href: "/admin/accounts" },
    ],
  },
];

export function SiteFooter() {
  return (
    <>
      <section className="footer-dither relative flex min-h-[220px] items-center justify-center px-6 py-12">
        <div className="inline-flex overflow-hidden rounded-sm border border-graphite bg-ink-black">
          <span className="px-4 py-2 font-mono-ui text-[11px] font-medium uppercase tracking-[0.015em] text-cream-paper">
            Index
          </span>
          <span className="px-4 py-2 font-mono-ui text-[11px] font-medium uppercase tracking-[0.015em] text-slate">
            Métadonnées
          </span>
        </div>
      </section>

      <footer className="bg-cream-paper px-6 pb-16 pt-12">
        <div className="mx-auto grid max-w-[1200px] gap-12 md:grid-cols-3">
          {FOOTER_COLUMNS.map((column) => (
            <div key={column.title}>
              <h3 className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-ink-black">
                {column.title}
              </h3>
              <ul className="mt-4 space-y-1">
                {column.links.map((link) => (
                  <li key={link.label}>
                    {link.external ? (
                      <a
                        href={link.href}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-serif text-[13px] leading-relaxed text-ink-black hover:text-schematic-blue"
                      >
                        {link.label}
                      </a>
                    ) : (
                      <Link
                        href={link.href}
                        className="font-serif text-[13px] leading-relaxed text-ink-black hover:text-schematic-blue"
                      >
                        {link.label}
                      </Link>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          ))}
          <div>
            <h3 className="font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-ink-black">
              Statut
            </h3>
            <p className="mt-4 flex items-center gap-2 font-mono-ui text-[11px] font-medium uppercase tracking-[0.012em] text-ink-black">
              <span className="inline-block h-2 w-2 rounded-full bg-schematic-blue" />
              Système opérationnel
            </p>
            <p className="mt-6 font-serif text-[13px] leading-relaxed text-slate">
              AfroLang-Library · Y&apos;TILiKAN
            </p>
          </div>
        </div>
      </footer>
    </>
  );
}
