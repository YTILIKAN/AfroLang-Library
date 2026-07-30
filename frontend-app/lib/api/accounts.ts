import {
  Account,
  AdminAccountCreateInput,
  AdminAccountUpdateInput,
  AdminAccountsListResponse,
  AdminDatasetCreateInput,
  AdminDatasetListResponse,
  AdminDatasetUpdateInput,
  DatasetDetail,
  TokenResponse,
} from "../types";
import { apiRequest } from "./client";

export function login(email: string, password: string): Promise<TokenResponse> {
  return apiRequest<TokenResponse>("/accounts/auth/login", {
    method: "POST",
    body: { email, password },
  });
}

export function logout(): Promise<void> {
  return apiRequest<void>("/accounts/auth/logout", {
    method: "POST",
    auth: true,
  });
}

export function fetchMe(): Promise<Account> {
  return apiRequest<Account>("/accounts/me", { auth: true });
}

export function listAdminDatasets(): Promise<AdminDatasetListResponse> {
  return apiRequest<AdminDatasetListResponse>("/accounts/admin/datasets", { auth: true });
}

export function getAdminDataset(id: number): Promise<DatasetDetail> {
  return apiRequest<DatasetDetail>(`/accounts/admin/datasets/${id}`, { auth: true });
}

export function createAdminDataset(input: AdminDatasetCreateInput): Promise<DatasetDetail> {
  return apiRequest<DatasetDetail>("/accounts/admin/datasets", {
    method: "POST",
    auth: true,
    body: input,
  });
}

export function updateAdminDataset(id: number, input: AdminDatasetUpdateInput): Promise<DatasetDetail> {
  return apiRequest<DatasetDetail>(`/accounts/admin/datasets/${id}`, {
    method: "PATCH",
    auth: true,
    body: input,
  });
}

export function deleteAdminDataset(id: number): Promise<{ detail: string }> {
  return apiRequest<{ detail: string }>(`/accounts/admin/datasets/${id}`, {
    method: "DELETE",
    auth: true,
  });
}

export function listAdminAccounts(): Promise<AdminAccountsListResponse> {
  return apiRequest<AdminAccountsListResponse>("/accounts/admin/accounts", { auth: true });
}

export function getAdminAccount(id: number): Promise<Account> {
  return apiRequest<Account>(`/accounts/admin/accounts/${id}`, { auth: true });
}

export function createAdminAccount(input: AdminAccountCreateInput): Promise<Account> {
  return apiRequest<Account>("/accounts/admin/accounts", {
    method: "POST",
    auth: true,
    body: input,
  });
}

export function updateAdminAccount(id: number, input: AdminAccountUpdateInput): Promise<Account> {
  return apiRequest<Account>(`/accounts/admin/accounts/${id}`, {
    method: "PATCH",
    auth: true,
    body: input,
  });
}
