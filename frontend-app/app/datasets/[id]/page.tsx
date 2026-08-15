import { notFound } from "next/navigation";

import { DatasetDetailView } from "@/components/catalog/DatasetDetailView";
import { CatalogNav } from "@/components/layout/CatalogNav";
import { WorkflowShell } from "@/components/layout/WorkflowShell";
import { getDataset } from "@/lib/api/catalog";
import { ApiError } from "@/lib/api/client";

interface DatasetPageProps {
  params: Promise<{ id: string }>;
}

export default async function DatasetPage({ params }: DatasetPageProps) {
  const { id } = await params;
  const datasetId = Number.parseInt(id, 10);

  if (!Number.isFinite(datasetId) || datasetId <= 0) {
    notFound();
  }

  let dataset;
  try {
    dataset = await getDataset(datasetId);
  } catch (err) {
    if (err instanceof ApiError && err.status === 404) {
      notFound();
    }
    throw err;
  }

  return (
    <WorkflowShell sidebar={<CatalogNav />}>
      <DatasetDetailView dataset={dataset} />
    </WorkflowShell>
  );
}
