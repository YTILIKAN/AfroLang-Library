import { getApiBaseUrl } from "../config";
import { getStoredToken } from "../auth-storage";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

interface RequestOptions extends Omit<RequestInit, "body"> {
  body?: unknown;
  auth?: boolean;
}

function formatApiError(payload: unknown, fallback: string): string {
  if (typeof payload === "object" && payload !== null && "detail" in payload) {
    const { detail } = payload as { detail?: unknown };
    if (typeof detail === "string") {
      return detail;
    }
    if (Array.isArray(detail) && detail.length > 0) {
      const first = detail[0] as { msg?: string };
      if (typeof first?.msg === "string") {
        return first.msg;
      }
    }
  }
  return fallback;
}

export async function apiRequest<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { body, auth = false, headers, ...rest } = options;
  const requestHeaders = new Headers(headers);

  if (body !== undefined) {
    requestHeaders.set("Content-Type", "application/json");
  }

  if (auth) {
    const token = getStoredToken();
    if (token) {
      requestHeaders.set("Authorization", `Bearer ${token}`);
    }
  }

  const baseUrl = getApiBaseUrl();
  let response: Response;

  try {
    response = await fetch(`${baseUrl}${path}`, {
      ...rest,
      headers: requestHeaders,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    });
  } catch {
    throw new ApiError(
      `Impossible de joindre l'API (${baseUrl}). Vérifiez que le backend tourne et que API_URL est configuré.`,
      0,
    );
  }

  if (response.status === 204) {
    return undefined as T;
  }

  const raw = await response.text();
  let payload: unknown = {};
  if (raw) {
    try {
      payload = JSON.parse(raw);
    } catch {
      payload = { detail: raw };
    }
  }

  if (!response.ok) {
    const detail = formatApiError(payload, `Erreur API (${response.status})`);
    throw new ApiError(detail, response.status);
  }

  return payload as T;
}
