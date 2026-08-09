import { notFound } from "next/navigation";

import { SiteFooter } from "@/components/layout/SiteFooter";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { DatasetDetailView } from "@/components/catalog/DatasetDetailView";
import { pageShell, sectionGap } from "@/components/ui/styles";
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
    <div className="flex min-h-full flex-col">
      <SiteHeader />

      <main className={`${pageShell} ${sectionGap} flex-1 pt-12`}>
        <DatasetDetailView dataset={dataset} />
      </main>

      <SiteFooter />
    </div>
  );
}
