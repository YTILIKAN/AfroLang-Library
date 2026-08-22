const LOCAL_API_URL = "http://127.0.0.1:8000";
const PRODUCTION_API_URL = "https://afrilang-api.up.railway.app";

function normalizeUrl(url: string): string {
  return url.replace(/\/$/, "");
}

function resolveConfiguredApiUrl(): string {
  if (process.env.NEXT_PUBLIC_API_URL) {
    return process.env.NEXT_PUBLIC_API_URL;
  }
  if (process.env.API_URL) {
    return process.env.API_URL;
  }
  if (process.env.NODE_ENV === "production") {
    return PRODUCTION_API_URL;
  }
  return LOCAL_API_URL;
}

/** URL directe du backend (SSR, rewrites Next.js, liens docs). */
export function getServerApiUrl(): string {
  return normalizeUrl(resolveConfiguredApiUrl());
}

/**
 * Base URL pour les appels fetch.
 * - Navigateur : NEXT_PUBLIC_API_URL si défini, sinon proxy local /api-backend
 * - Serveur (SSR) : API_URL / NEXT_PUBLIC_API_URL
 */
export function getApiBaseUrl(): string {
  const publicUrl = process.env.NEXT_PUBLIC_API_URL;
  if (typeof window !== "undefined") {
    if (publicUrl) {
      return normalizeUrl(publicUrl);
    }
    return "/api-backend";
  }
  return getServerApiUrl();
}

/** @deprecated Préférer getServerApiUrl() ou getApiBaseUrl(). */
export const API_URL = getServerApiUrl();

export const AUTH_TOKEN_KEY = "aflang_auth_token";
