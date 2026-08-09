import Link from "next/link";

interface AdminNavProps {
  active: "datasets" | "accounts";
}

export function AdminNav({ active }: AdminNavProps) {
  const linkClass = (section: AdminNavProps["active"]) =>
    section === active
      ? "rounded-sm bg-ink-black px-3 py-2 font-mono-ui text-[11px] font-medium uppercase tracking-[0.015em] text-cream-paper"
      : "rounded-sm border border-hairline px-3 py-2 font-mono-ui text-[11px] font-medium uppercase tracking-[0.015em] text-graphite transition hover:border-ink-black hover:text-ink-black";

  return (
    <nav className="flex flex-wrap gap-2">
      <Link href="/admin/datasets" className={linkClass("datasets")}>
        Datasets
      </Link>
      <Link href="/admin/accounts" className={linkClass("accounts")}>
        Comptes
      </Link>
    </nav>
  );
}
