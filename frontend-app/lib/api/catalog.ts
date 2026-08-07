import {
  DatasetFilterResponse,
  DatasetSearchResponse,
  DatasetSummary,
  LanguageOverviewResponse,
} from "../types";
import { apiRequest } from "./client";

/** Lecture publique de l'index : jamais mise en cache, jamais authentifiée (AD-3, AD-10). */
const READ_ONLY = { cache: "no-store" } as const;

export interface DatasetFilterParams {
  language?: string;
  source?: string;
  task?: string;
  data_format?: string;
}

export function searchDatasets(language: string): Promise<DatasetSearchResponse> {
  const params = new URLSearchParams({ language });
  return apiRequest<DatasetSearchResponse>(`/catalog/datasets/search?${params}`, READ_ONLY);
}

export function filterDatasets(filters: DatasetFilterParams): Promise<DatasetFilterResponse> {
  const params = new URLSearchParams();
  const { language, source, task, data_format } = filters;
  if (language) params.set("language", language);
  if (source) params.set("source", source);
  if (task) params.set("task", task);
  if (data_format) params.set("data_format", data_format);

  return apiRequest<DatasetFilterResponse>(`/catalog/datasets/filter?${params}`, READ_ONLY);
}

/** Datasets et compteurs d'une langue (FR-14). */
export function getLanguageOverview(language: string): Promise<LanguageOverviewResponse> {
  const params = new URLSearchParams({ language });
  return apiRequest<LanguageOverviewResponse>(
    `/catalog/languages/overview?${params}`,
    READ_ONLY,
  );
}

export interface DatasetResults {
  total: number;
  datasets: DatasetSummary[];
}

/**
 * Résultats affichés par l'interface pour un jeu de critères.
 * Langue seule : recherche par langue (FR-11) ; dès qu'un filtre s'y ajoute : filtrage (FR-12).
 */
export async function fetchDatasetResults(filters: DatasetFilterParams): Promise<DatasetResults> {
  const { language, source, task, data_format } = filters;
  const hasFilter = Boolean(source || task || data_format);

  if (!language && !hasFilter) {
    return { total: 0, datasets: [] };
  }

  const response =
    language && !hasFilter ? await searchDatasets(language) : await filterDatasets(filters);

  return { total: response.total, datasets: response.datasets };
}
