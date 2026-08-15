import {
  DatasetDetail,
  DatasetFilterParams,
  DatasetFilterResponse,
  DatasetSearchResponse,
  LanguageOverviewResponse,
} from "../types";
import { ApiError, apiRequest } from "./client";

/** Surface publique stable de l'API de consultation (`/catalog/*` en est l'alias interne). */
const CATALOG_PREFIX = "/api/v1";

/** Lecture publique de l'index : jamais mise en cache, jamais authentifiée (AD-3, AD-10). */
const READ_ONLY = { cache: "no-store" } as const;

export function searchDatasets(language: string): Promise<DatasetSearchResponse> {
  const query = new URLSearchParams({ language });
  return apiRequest<DatasetSearchResponse>(
    `${CATALOG_PREFIX}/datasets/search?${query.toString()}`,
    READ_ONLY,
  );
}

export function filterDatasets(params: DatasetFilterParams): Promise<DatasetFilterResponse> {
  const query = new URLSearchParams();
  if (params.language?.trim()) {
    query.set("language", params.language.trim());
  }
  if (params.source?.trim()) {
    query.set("source", params.source.trim());
  }
  if (params.task?.trim()) {
    query.set("task", params.task.trim());
  }
  if (params.data_format?.trim()) {
    query.set("data_format", params.data_format.trim());
  }

  if ([...query.keys()].length === 0) {
    return Promise.reject(
      new ApiError("Au moins un filtre requis : langue, source, tâche ou format.", 400),
    );
  }

  return apiRequest<DatasetFilterResponse>(
    `${CATALOG_PREFIX}/datasets/filter?${query.toString()}`,
    READ_ONLY,
  );
}

export function getDataset(id: number): Promise<DatasetDetail> {
  return apiRequest<DatasetDetail>(`${CATALOG_PREFIX}/datasets/${id}`, READ_ONLY);
}

/** Datasets et compteurs d'une langue (FR-14). */
export function getLanguageOverview(language: string): Promise<LanguageOverviewResponse> {
  const query = new URLSearchParams({ language });
  return apiRequest<LanguageOverviewResponse>(
    `${CATALOG_PREFIX}/languages/overview?${query.toString()}`,
    READ_ONLY,
  );
}
