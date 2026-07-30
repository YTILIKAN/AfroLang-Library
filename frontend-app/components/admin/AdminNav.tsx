import Link from "next/link";

interface AdminNavProps {
  active: "datasets" | "accounts";
}

export function AdminNav({ active }: AdminNavProps) {
  const linkClass = (section: AdminNavProps["active"]) =>
    section === active
      ? "rounded-lg bg-emerald-700 px-3 py-2 text-sm font-medium text-white"
      : "rounded-lg border border-zinc-300 px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50";

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
