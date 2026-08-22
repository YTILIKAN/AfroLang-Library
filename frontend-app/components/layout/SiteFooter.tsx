import Link from "next/link";

const FOOTER_COLUMNS: {
  title: string;
  links: { label: string; href: string; external?: boolean }[];
}[] = [
  {
    title: "Catalogue",
    links: [
      { label: "Recherche", href: "/search" },
      { label: "Filtrage", href: "/filter" },
      { label: "Langues", href: "/languages" },
      {
        label: "API REST",
        href: "/api-docs",
      },
    ],
  },
  {
    title: "Contribution",
    links: [
      { label: "Espace chercheur", href: "/contribute" },
      { label: "Soumettre un dataset", href: "/contribute/submit" },
      { label: "Mes contributions", href: "/contribute/mine" },
    ],
  },
  {
    title: "Compte",
    links: [
      { label: "Connexion", href: "/auth/login" },
      { label: "Inscription chercheur", href: "/auth/register" },
    ],
  },
];

export function SiteFooter() {
  return (
    <footer className="mt-auto border-t border-hairline bg-savanna/40">
      <div
        className={`mx-auto grid max-w-[1200px] gap-10 px-6 py-12 md:grid-cols-2 lg:grid-cols-4`}
      >
        {FOOTER_COLUMNS.map((column) => (
          <div key={column.title}>
            <h3 className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.12em] text-graphite">
              {column.title}
            </h3>
            <ul className="mt-3 space-y-2">
              {column.links.map((link) => (
                <li key={link.label}>
                  {link.external ? (
                    <a
                      href={link.href}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-serif text-sm text-ink-black hover:text-indigo-deep"
                    >
                      {link.label}
                    </a>
                  ) : (
                    <Link
                      href={link.href}
                      className="font-serif text-sm text-ink-black hover:text-indigo-deep"
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
          <h3 className="font-mono-ui text-[10px] font-medium uppercase tracking-[0.12em] text-graphite">
            Projet
          </h3>
          <p className="mt-3 font-serif text-sm text-slate">
            AfroLang-Library · Y&apos;TILiKAN
          </p>
          <p className="mt-4 font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate">
            NLP · langues africaines · open metadata
          </p>
        </div>
      </div>
      <div className="border-t border-hairline">
        <p className="mx-auto max-w-[1200px] px-6 py-4 font-mono-ui text-[10px] uppercase tracking-[0.1em] text-slate">
          © {new Date().getFullYear()} Y&apos;TILiKAN
        </p>
      </div>
    </footer>
  );
}
