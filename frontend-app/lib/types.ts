export type AccountRole = "chercheur" | "admin";

export type Provenance = "synchronisé" | "contribué" | "manuel";

export interface Account {
  id: number;
  email: string;
  display_name: string;
  role: AccountRole;
  is_active: boolean;
  created_at: string;
}

export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_at: string;
  account: Account;
}

export interface LanguageInfo {
  code: string;
  name: string;
  family: string;
  region: string;
}

export interface TaskInfo {
  code: string;
  label: string;
}

export interface SourceInfo {
  slug: string;
  name: string;
  base_url: string;
}

export interface LicenseInfo {
  name: string;
  spdx_id: string | null;
  url: string;
}

export interface DatasetSummary {
  id: number;
  external_id: string;
  title: string;
  description: string;
  language: LanguageInfo;
  language_raw: string;
  source: SourceInfo;
  license: LicenseInfo | null;
  provenance: Provenance;
  data_format: string;
  size: string;
  source_url: string;
  tasks: TaskInfo[];
  published_at: string | null;
}

export interface DatasetDetail extends DatasetSummary {
  created_at: string;
  updated_at: string;
}

/** Réponse de GET /api/v1/datasets — index complet. */
export interface DatasetListResponse {
  total: number;
  limit: number;
  offset: number;
  datasets: DatasetSummary[];
}

/** Réponse de GET /api/v1/datasets/search (Story 1.11). */
export interface DatasetSearchResponse {
  language_query: string;
  language_code: string;
  total: number;
  datasets: DatasetSummary[];
}

/** Filtres appliqués après normalisation côté serveur (Story 2.1). */
export interface AppliedFilters {
  q: string | null;
  language: string | null;
  language_code: string | null;
  source: string | null;
  task: string | null;
  task_code: string | null;
  data_format: string | null;
}

/** Réponse de GET /api/v1/datasets/filter (Story 2.1). */
export interface DatasetFilterResponse {
  filters: AppliedFilters;
  total: number;
  datasets: DatasetSummary[];
}

export interface DatasetFilterParams {
  /** Recherche plein texte sur titre, description et langue. */
  q?: string;
  language?: string;
  source?: string;
  task?: string;
  data_format?: string;
}

/** Compteurs basiques pour une langue (FR-14). */
export interface LanguageAggregationStats {
  dataset_count: number;
  task_count: number;
  tasks_covered: TaskInfo[];
}

/** Réponse de GET /api/v1/languages/overview (Story 2.2). */
export interface LanguageOverviewResponse {
  language_query: string;
  language_code: string;
  language: LanguageInfo | null;
  stats: LanguageAggregationStats;
  datasets: DatasetSummary[];
}

export interface RegisterInput {
  email: string;
  password: string;
  display_name: string;
}

export interface SubmitDatasetInput {
  title: string;
  source_url: string;
  language: string;
  task: string;
  description?: string;
  license_name?: string;
  data_format?: string;
  size?: string;
  /** Source sans API publique : l'entrée reçoit l'origine `manuel` (FR-5). */
  manual_source?: boolean;
}

export type SubmitDatasetResult = DatasetDetail;

export interface MyDatasetsResponse {
  total: number;
  datasets: DatasetSummary[];
}

export interface UpdateMyDatasetInput {
  title?: string;
}

export interface AdminDatasetListResponse {
  total: number;
  datasets: DatasetSummary[];
}

export interface AdminDatasetCreateInput {
  title: string;
  source_url: string;
  language: string;
  task: string;
  provenance?: Provenance;
  source_slug?: string;
  source_name?: string;
  description?: string;
  data_format?: string;
  size?: string;
  license_name?: string;
  external_id?: string;
}

export interface AdminDatasetUpdateInput {
  title?: string;
  source_url?: string;
  language?: string;
  task?: string;
  provenance?: Provenance;
  source_slug?: string;
  source_name?: string;
  description?: string;
  data_format?: string;
  size?: string;
  license_name?: string;
}

export interface AdminAccountsListResponse {
  total: number;
  accounts: Account[];
}

export interface AdminAccountCreateInput {
  email: string;
  password: string;
  display_name: string;
  role?: AccountRole;
}

export interface AdminAccountUpdateInput {
  display_name?: string;
  role?: AccountRole;
  is_active?: boolean;
}
