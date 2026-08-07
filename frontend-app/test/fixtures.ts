import { DatasetSummary, LanguageOverviewResponse } from "@/lib/types";

/** Fiche de référence, calquée sur le bouchon backend (`catalog/stub.py`). */
export function buildDataset(overrides: Partial<DatasetSummary> = {}): DatasetSummary {
  return {
    id: 1,
    external_id: "masakhane/yoruba-asr",
    title: "Yoruba ASR Corpus",
    description: "Corpus de reconnaissance vocale en yoruba",
    language: { code: "yor", name: "Yoruba", family: "Niger-Congo", region: "Afrique de l'Ouest" },
    language_raw: "Yorùbá",
    source: { slug: "huggingface", name: "Hugging Face", base_url: "https://huggingface.co" },
    license: {
      name: "CC BY 4.0",
      spdx_id: "CC-BY-4.0",
      url: "https://creativecommons.org/licenses/by/4.0/",
    },
    provenance: "synchronisé",
    data_format: "audio",
    size: "2.5 GB",
    source_url: "https://huggingface.co/datasets/masakhane/yoruba-asr",
    tasks: [{ code: "asr", label: "ASR" }],
    published_at: "2024-03-15T00:00:00Z",
    ...overrides,
  };
}

export function buildLanguageOverview(
  overrides: Partial<LanguageOverviewResponse> = {},
): LanguageOverviewResponse {
  const datasets = overrides.datasets ?? [buildDataset()];
  return {
    language_query: "yoruba",
    language_code: "yor",
    language: { code: "yor", name: "Yoruba", family: "Niger-Congo", region: "Afrique de l'Ouest" },
    stats: {
      dataset_count: datasets.length,
      task_count: 1,
      tasks_covered: [{ code: "asr", label: "ASR" }],
    },
    ...overrides,
    datasets,
  };
}
