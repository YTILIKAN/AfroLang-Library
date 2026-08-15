import Link from "next/link";

import { navLinkActiveClass, navLinkIdleClass } from "@/components/ui/styles";

interface AdminNavProps {
  active: "datasets" | "accounts";
  layout?: "horizontal" | "vertical";
}

export function AdminNav({ active, layout = "horizontal" }: AdminNavProps) {
  const linkClass = (section: AdminNavProps["active"]) =>
    section === active ? navLinkActiveClass : navLinkIdleClass;

  const links = (
    <>
      <Link href="/admin/datasets" className={linkClass("datasets")}>
        Datasets
      </Link>
      <Link href="/admin/accounts" className={linkClass("accounts")}>
        Comptes
      </Link>
    </>
  );

  if (layout === "vertical") {
    return <div className="flex flex-col gap-0.5">{links}</div>;
  }

  return <nav className="flex flex-wrap gap-2">{links}</nav>;
}
