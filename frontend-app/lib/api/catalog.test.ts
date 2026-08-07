import { afterEach, describe, expect, it, vi } from "vitest";
import {
  fetchDatasetResults,
  filterDatasets,
  getLanguageOverview,
  searchDatasets,
} from "./catalog";
import { ApiError } from "./client";
import type { DatasetFilterResponse, DatasetSearchResponse } from "../types";
import { buildDataset, buildLanguageOverview } from "@/test/fixtures";

const API_URL = "http://127.0.0.1:8000";

function stubJsonResponse(payload: unknown) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    status: 200,
    json: () => Promise.resolve(payload),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function stubErrorResponse(status: number, detail: string) {
  const fetchMock = vi.fn().mockResolvedValue({
    ok: false,
    status,
    json: () => Promise.resolve({ detail }),
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function calledUrl(fetchMock: ReturnType<typeof vi.fn>): string {
  return fetchMock.mock.calls[0][0] as string;
}

const sampleSearchResponse: DatasetSearchResponse = {
  language_query: "yoruba",
  language_code: "yor",
  total: 1,
  datasets: [buildDataset()],
};

afterEach(() => {
  vi.unstubAllGlobals();
});

describe("searchDatasets", () => {
  it("appelle l'API catalog avec la langue demandée et retourne le JSON parsé", async () => {
    const fetchMock = stubJsonResponse(sampleSearchResponse);

    const result = await searchDatasets("yoruba");

    expect(calledUrl(fetchMock)).toBe(`${API_URL}/catalog/datasets/search?language=yoruba`);
    expect(result).toEqual(sampleSearchResponse);
  });

  it("encode le paramètre de langue dans l'URL", async () => {
    const fetchMock = stubJsonResponse(sampleSearchResponse);

    await searchDatasets("Yorùbá");

    expect(calledUrl(fetchMock)).toBe(
      `${API_URL}/catalog/datasets/search?language=Yor%C3%B9b%C3%A1`,
    );
  });

  it("ne met pas la réponse en cache pour refléter l'index à jour", async () => {
    const fetchMock = stubJsonResponse(sampleSearchResponse);

    await searchDatasets("yoruba");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("remonte une ApiError portant le statut quand la réponse n'est pas ok", async () => {
    stubErrorResponse(500, "Erreur interne");

    await expect(searchDatasets("yoruba")).rejects.toMatchObject({
      name: "ApiError",
      status: 500,
      message: "Erreur interne",
    });
    await expect(searchDatasets("yoruba")).rejects.toBeInstanceOf(ApiError);
  });
});

const sampleFilterResponse: DatasetFilterResponse = {
  filters: {
    language: "Swahili",
    language_code: "swh",
    source: null,
    task: "ASR",
    task_code: "asr",
    data_format: null,
  },
  total: 0,
  datasets: [],
};

describe("filterDatasets", () => {
  it("n'envoie que les filtres fournis", async () => {
    const fetchMock = stubJsonResponse(sampleFilterResponse);

    const result = await filterDatasets({ source: "huggingface", data_format: "audio" });

    expect(calledUrl(fetchMock)).toBe(
      `${API_URL}/catalog/datasets/filter?source=huggingface&data_format=audio`,
    );
    expect(result).toEqual(sampleFilterResponse);
  });

  it("combine langue, source, tâche et format quand ils sont tous fournis", async () => {
    const fetchMock = stubJsonResponse(sampleFilterResponse);

    await filterDatasets({
      language: "swahili",
      source: "kaggle",
      task: "asr",
      data_format: "text",
    });

    expect(calledUrl(fetchMock)).toBe(
      `${API_URL}/catalog/datasets/filter?language=swahili&source=kaggle&task=asr&data_format=text`,
    );
  });

  it("remonte une ApiError portant le statut quand la réponse n'est pas ok", async () => {
    stubErrorResponse(400, "Au moins un filtre requis");

    await expect(filterDatasets({ task: "asr" })).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      message: "Au moins un filtre requis",
    });
  });
});

describe("fetchDatasetResults", () => {
  it("interroge la recherche par langue quand la langue est le seul critère", async () => {
    const fetchMock = stubJsonResponse(sampleSearchResponse);

    const result = await fetchDatasetResults({ language: "yoruba" });

    expect(calledUrl(fetchMock)).toBe(`${API_URL}/catalog/datasets/search?language=yoruba`);
    expect(result).toEqual({ total: 1, datasets: sampleSearchResponse.datasets });
  });

  it("bascule sur le filtrage dès qu'un filtre accompagne la langue", async () => {
    const fetchMock = stubJsonResponse(sampleFilterResponse);

    await fetchDatasetResults({ language: "swahili", task: "asr" });

    expect(calledUrl(fetchMock)).toBe(
      `${API_URL}/catalog/datasets/filter?language=swahili&task=asr`,
    );
  });

  it.each([
    ["source", { source: "kaggle" }, "source=kaggle"],
    ["tâche", { task: "asr" }, "task=asr"],
    ["format", { data_format: "audio" }, "data_format=audio"],
  ])("interroge le filtrage avec le filtre %s seul, sans langue", async (_label, filters, query) => {
    const fetchMock = stubJsonResponse(sampleFilterResponse);

    await fetchDatasetResults(filters);

    expect(calledUrl(fetchMock)).toBe(`${API_URL}/catalog/datasets/filter?${query}`);
  });

  it("combine tous les filtres actifs dans une seule requête (FR-12)", async () => {
    const fetchMock = stubJsonResponse(sampleFilterResponse);

    await fetchDatasetResults({
      language: "swahili",
      source: "kaggle",
      task: "asr",
      data_format: "text",
    });

    expect(calledUrl(fetchMock)).toBe(
      `${API_URL}/catalog/datasets/filter?language=swahili&source=kaggle&task=asr&data_format=text`,
    );
  });

  it("expose le total et les datasets de la réponse de filtrage", async () => {
    const datasets = [buildDataset({ id: 7 }), buildDataset({ id: 8 })];
    stubJsonResponse({ ...sampleFilterResponse, total: 2, datasets });

    const result = await fetchDatasetResults({ source: "huggingface" });

    expect(result).toEqual({ total: 2, datasets });
  });

  it("ne lance aucune requête quand aucun critère n'est fourni", async () => {
    const fetchMock = stubJsonResponse(sampleFilterResponse);

    const result = await fetchDatasetResults({});

    expect(fetchMock).not.toHaveBeenCalled();
    expect(result).toEqual({ total: 0, datasets: [] });
  });
});

describe("getLanguageOverview", () => {
  it("appelle l'endpoint d'agrégation avec la langue demandée", async () => {
    const overview = buildLanguageOverview();
    const fetchMock = stubJsonResponse(overview);

    const result = await getLanguageOverview("yoruba");

    expect(calledUrl(fetchMock)).toBe(`${API_URL}/catalog/languages/overview?language=yoruba`);
    expect(result).toEqual(overview);
  });

  it("encode le paramètre de langue dans l'URL", async () => {
    const fetchMock = stubJsonResponse(buildLanguageOverview());

    await getLanguageOverview("Yorùbá");

    expect(calledUrl(fetchMock)).toBe(
      `${API_URL}/catalog/languages/overview?language=Yor%C3%B9b%C3%A1`,
    );
  });

  it("ne met pas la réponse en cache", async () => {
    const fetchMock = stubJsonResponse(buildLanguageOverview());

    await getLanguageOverview("yoruba");

    expect(fetchMock).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({ cache: "no-store" }),
    );
  });

  it("remonte une ApiError portant le statut quand la réponse n'est pas ok", async () => {
    stubErrorResponse(500, "Erreur interne");

    await expect(getLanguageOverview("yoruba")).rejects.toMatchObject({
      name: "ApiError",
      status: 500,
    });
  });
});
