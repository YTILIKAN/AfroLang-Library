"use client";

import { AdminGate } from "@/components/auth/AdminGate";
import { DatasetAdminPanel } from "@/components/admin/DatasetAdminPanel";

export default function AdminDatasetsPage() {
  return (
    <AdminGate>
      {(account, onLogout) => (
        <DatasetAdminPanel adminName={account.display_name} onLogout={onLogout} />
      )}
    </AdminGate>
  );
}
