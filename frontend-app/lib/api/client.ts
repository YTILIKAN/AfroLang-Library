import { API_URL } from "../config";
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

  const response = await fetch(`${API_URL}${path}`, {
    ...rest,
    headers: requestHeaders,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (response.status === 204) {
    return undefined as T;
  }

  const payload = await response.json().catch(() => ({}));

  if (!response.ok) {
    const detail = typeof payload.detail === "string" ? payload.detail : "Erreur API";
    throw new ApiError(detail, response.status);
  }

  return payload as T;
}
