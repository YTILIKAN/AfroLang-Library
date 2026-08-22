import { getServerApiUrl } from "./config";
import { DatasetListResponse, DatasetSummary, LanguageOverviewResponse } from "./types";

const FALLBACK_SOURCES = [
  "huggingface",
  "github",
  "kaggle",
  "zenodo",
  "mozilla-data-collective",
  "aclanthology",
  "arxiv",
  "mendeley-data",
  "doaj",
] as const;

const FALLBACK_LANGUAGES = ["Yoruba", "Wolof", "Swahili", "Hausa", "Amharique"] as const;

export interface CatalogPreview {
  datasets: DatasetSummary[];
  total: number;
  languageCount: number;
  taskCodes: string[];
  sourceSlugs: string[];
  loadError: boolean;
}

function aggregateStats(datasets: DatasetSummary[]) {
  const languageCodes = new Set<string>();
  const taskCodes = new Set<string>();
  const sourceSlugs = new Set<string>();

  for (const dataset of datasets) {
    languageCodes.add(dataset.language.code);
    sourceSlugs.add(dataset.source.slug);
    for (const task of dataset.tasks) {
      taskCodes.add(task.code);
    }
  }

  return {
    languageCount: languageCodes.size,
    taskCodes: [...taskCodes],
    sourceSlugs: [...sourceSlugs],
  };
}

async function fetchJson<T>(url: string): Promise<T | null> {
  try {
    const response = await fetch(url, { next: { revalidate: 60 } });
    if (!response.ok) {
      return null;
    }
    return (await response.json()) as T;
  } catch {
    return null;
  }
}

async function loadViaListEndpoint(limit: number): Promise<CatalogPreview | null> {
  const payload = await fetchJson<DatasetListResponse>(
    `${getServerApiUrl()}/api/v1/datasets?${new URLSearchParams({
      limit: String(limit),
      offset: "0",
    })}`,
  );

  if (!payload) {
    return null;
  }

  const stats = aggregateStats(payload.datasets);
  return {
    datasets: payload.datasets,
    total: payload.total,
    ...stats,
    loadError: false,
  };
}

/** Repli pour les backends sans GET /api/v1/datasets (agrégation par source + langues). */
async function loadViaLegacyFilters(): Promise<CatalogPreview> {
  const datasetMap = new Map<number, DatasetSummary>();

  const sourceResponses = await Promise.all(
    FALLBACK_SOURCES.map((source) =>
      fetchJson<{ datasets: DatasetSummary[] }>(
        `${getServerApiUrl()}/api/v1/datasets/filter?${new URLSearchParams({ source })}`,
      ),
    ),
  );

  for (const response of sourceResponses) {
    for (const dataset of response?.datasets ?? []) {
      datasetMap.set(dataset.id, dataset);
    }
  }

  const overviewResponses = await Promise.all(
    FALLBACK_LANGUAGES.map((language) =>
      fetchJson<LanguageOverviewResponse>(
        `${getServerApiUrl()}/api/v1/languages/overview?${new URLSearchParams({ language })}`,
      ),
    ),
  );

  for (const overview of overviewResponses) {
    for (const dataset of overview?.datasets ?? []) {
      datasetMap.set(dataset.id, dataset);
    }
  }

  const datasets = [...datasetMap.values()];
  const stats = aggregateStats(datasets);

  return {
    datasets,
    total: datasets.length,
    ...stats,
    loadError: false,
  };
}

/** Charge l'index complet pour l'accueil public (sans authentification). */
export async function loadCatalogPreview(limit = 500): Promise<CatalogPreview> {
  const primary = await loadViaListEndpoint(limit);
  if (primary) {
    return primary;
  }

  try {
    return await loadViaLegacyFilters();
  } catch {
    return {
      datasets: [],
      total: 0,
      languageCount: 0,
      taskCodes: [],
      sourceSlugs: [],
      loadError: true,
    };
  }
}
