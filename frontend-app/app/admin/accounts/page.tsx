"use client";

import { AccountAdminPanel } from "@/components/admin/AccountAdminPanel";
import { AdminGate } from "@/components/auth/AdminGate";

export default function AdminAccountsPage() {
  return (
    <AdminGate>
      {(account, onLogout) => (
        <AccountAdminPanel
          adminName={account.display_name}
          currentAccountId={account.id}
          onLogout={onLogout}
        />
      )}
    </AdminGate>
  );
}
