const DEFAULT_API_URL = "http://127.0.0.1:8000";

/** URL directe du backend (SSR, rewrites Next.js, liens docs). */
export function getServerApiUrl(): string {
  return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? DEFAULT_API_URL;
}

/** Base URL pour les appels fetch (proxy same-origin côté navigateur). */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return "/api-backend";
  }
  return getServerApiUrl();
}

/** @deprecated Préférer getServerApiUrl() ou getApiBaseUrl(). */
export const API_URL = getServerApiUrl();

export const AUTH_TOKEN_KEY = "aflang_auth_token";
