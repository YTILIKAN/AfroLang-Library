import { afterEach, describe, expect, it, vi } from "vitest";
import { filterDatasets, getDataset, getLanguageOverview, searchDatasets } from "./catalog";
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
  it("appelle la surface publique v1 avec la langue demandée et retourne le JSON parsé", async () => {
    const fetchMock = stubJsonResponse(sampleSearchResponse);

    const result = await searchDatasets("yoruba");

    expect(calledUrl(fetchMock)).toBe(`${API_URL}/api/v1/datasets/search?language=yoruba`);
    expect(result).toEqual(sampleSearchResponse);
  });

  it("encode le paramètre de langue dans l'URL", async () => {
    const fetchMock = stubJsonResponse(sampleSearchResponse);

    await searchDatasets("Yorùbá");

    expect(calledUrl(fetchMock)).toBe(
      `${API_URL}/api/v1/datasets/search?language=Yor%C3%B9b%C3%A1`,
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

  it("n'envoie aucun en-tête d'authentification sur la consultation publique (AD-10)", async () => {
    const fetchMock = stubJsonResponse(sampleSearchResponse);

    await searchDatasets("yoruba");

    const headers = (fetchMock.mock.calls[0][1] as RequestInit).headers as Headers;
    expect(headers.has("Authorization")).toBe(false);
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
      `${API_URL}/api/v1/datasets/filter?source=huggingface&data_format=audio`,
    );
    expect(result).toEqual(sampleFilterResponse);
  });

  it("combine langue, source, tâche et format quand ils sont tous fournis (FR-12)", async () => {
    const fetchMock = stubJsonResponse(sampleFilterResponse);

    await filterDatasets({
      language: "swahili",
      source: "kaggle",
      task: "asr",
      data_format: "text",
    });

    expect(calledUrl(fetchMock)).toBe(
      `${API_URL}/api/v1/datasets/filter?language=swahili&source=kaggle&task=asr&data_format=text`,
    );
  });

  it("ignore les filtres vides ou faits d'espaces", async () => {
    const fetchMock = stubJsonResponse(sampleFilterResponse);

    await filterDatasets({ language: "  swahili  ", source: "   ", task: "" });

    expect(calledUrl(fetchMock)).toBe(`${API_URL}/api/v1/datasets/filter?language=swahili`);
  });

  it("rejette sans requête réseau quand aucun filtre n'est actif", async () => {
    const fetchMock = stubJsonResponse(sampleFilterResponse);

    await expect(filterDatasets({ language: "   " })).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
    });
    expect(fetchMock).not.toHaveBeenCalled();
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

describe("getDataset", () => {
  it("appelle la fiche par identifiant (Story 1.12)", async () => {
    const dataset = buildDataset({ id: 42 });
    const fetchMock = stubJsonResponse(dataset);

    const result = await getDataset(42);

    expect(calledUrl(fetchMock)).toBe(`${API_URL}/api/v1/datasets/42`);
    expect(result).toEqual(dataset);
  });

  it("remonte une ApiError 404 pour un identifiant absent de l'index", async () => {
    stubErrorResponse(404, "Dataset introuvable");

    await expect(getDataset(999)).rejects.toMatchObject({
      name: "ApiError",
      status: 404,
    });
  });
});

describe("getLanguageOverview", () => {
  it("appelle l'endpoint d'agrégation avec la langue demandée", async () => {
    const overview = buildLanguageOverview();
    const fetchMock = stubJsonResponse(overview);

    const result = await getLanguageOverview("yoruba");

    expect(calledUrl(fetchMock)).toBe(`${API_URL}/api/v1/languages/overview?language=yoruba`);
    expect(result).toEqual(overview);
  });

  it("encode le paramètre de langue dans l'URL", async () => {
    const fetchMock = stubJsonResponse(buildLanguageOverview());

    await getLanguageOverview("Yorùbá");

    expect(calledUrl(fetchMock)).toBe(
      `${API_URL}/api/v1/languages/overview?language=Yor%C3%B9b%C3%A1`,
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
