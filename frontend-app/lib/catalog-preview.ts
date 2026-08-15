import { API_URL } from "./config";
import { DatasetSummary, LanguageOverviewResponse } from "./types";

const PREVIEW_LANGUAGES = ["Yoruba", "Wolof", "Swahili"] as const;

export interface CatalogPreview {
  datasets: DatasetSummary[];
  languageCount: number;
  taskCodes: string[];
  sourceSlugs: string[];
}

export async function loadCatalogPreview(): Promise<CatalogPreview> {
  const overviews = await Promise.all(
    PREVIEW_LANGUAGES.map(async (language) => {
      try {
        const response = await fetch(
          `${API_URL}/api/v1/languages/overview?${new URLSearchParams({ language })}`,
          { next: { revalidate: 120 } },
        );
        if (!response.ok) {
          return null;
        }
        return (await response.json()) as LanguageOverviewResponse;
      } catch {
        return null;
      }
    }),
  );

  const datasetMap = new Map<number, DatasetSummary>();
  const taskCodes = new Set<string>();
  const sourceSlugs = new Set<string>();
  let languageCount = 0;

  for (const overview of overviews) {
    if (!overview || overview.stats.dataset_count === 0) {
      continue;
    }
    languageCount += 1;
    for (const dataset of overview.datasets) {
      datasetMap.set(dataset.id, dataset);
      sourceSlugs.add(dataset.source.slug);
      for (const task of dataset.tasks) {
        taskCodes.add(task.code);
      }
    }
  }

  return {
    datasets: [...datasetMap.values()],
    languageCount,
    taskCodes: [...taskCodes],
    sourceSlugs: [...sourceSlugs],
  };
}
