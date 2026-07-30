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

export interface DatasetSummary {
  id: number;
  external_id: string;
  title: string;
  description: string;
  language: LanguageInfo;
  language_raw: string;
  source: { slug: string; name: string; base_url: string };
  license: { name: string; spdx_id: string | null; url: string } | null;
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
  description?: string;
  data_format?: string;
  size?: string;
  external_id?: string;
}

export interface AdminDatasetUpdateInput {
  title?: string;
  source_url?: string;
  language?: string;
  task?: string;
  provenance?: Provenance;
  description?: string;
  data_format?: string;
  size?: string;
}
