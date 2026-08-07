import { DatasetCard } from "@/components/DatasetCard";
import { DatasetSummary } from "@/lib/types";

export function DatasetResultList({
  total,
  datasets,
}: {
  total: number;
  datasets: DatasetSummary[];
}) {
  if (total === 0) {
    return (
      <p className="rounded-xl border border-zinc-200 bg-white p-5 text-sm text-zinc-600">
        Aucun dataset ne correspond à ces critères.
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-sm font-medium text-zinc-700">
        {total} {total > 1 ? "datasets" : "dataset"}
      </p>
      <ul className="flex flex-col gap-4">
        {datasets.map((dataset) => (
          <li key={dataset.id}>
            <DatasetCard dataset={dataset} />
          </li>
        ))}
      </ul>
    </div>
  );
}
