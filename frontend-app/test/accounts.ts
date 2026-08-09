import { Account, DatasetSummary } from "@/lib/types";
import { buildDataset } from "./fixtures";

export function buildAccount(overrides: Partial<Account> = {}): Account {
  return {
    id: 1,
    email: "kofi@example.com",
    display_name: "Kofi",
    role: "chercheur",
    is_active: true,
    created_at: "2026-01-15T00:00:00Z",
    ...overrides,
  };
}

/** Contribution telle que renvoyée par `/accounts/datasets/mine` (Story 3.6). */
export function buildContribution(overrides: Partial<DatasetSummary> = {}): DatasetSummary {
  return buildDataset({
    id: 9001,
    title: "Corpus Twi",
    provenance: "contribué",
    source: { slug: "contribution", name: "Contribution", base_url: "" },
    ...overrides,
  });
}
