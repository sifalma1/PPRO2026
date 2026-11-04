/**
 * Generic Fetch Client with robust error handling, typed responses,
 * and automatic Bearer token authorization header attachment.
 */
import { ApiResponse } from "../types";

export class ApiError extends Error {
  public statusCode?: number;
  public details?: unknown;

  constructor(message: string, statusCode?: number, details?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.details = details;
  }
}

function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("akademie_admin_token");
  if (token) {
    return {
      Authorization: `Bearer ${token}`,
      "x-admin-token": token,
    };
  }
  return {};
}

export async function request<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  let data: ApiResponse<T>;
  try {
    data = await response.json();
  } catch (err) {
    throw new ApiError(
      `Neplatná odpověď serveru (${response.status} ${response.statusText})`,
      response.status
    );
  }

  if (!response.ok || !data.success) {
    const errorMsg =
      data.error || data.message || `Chyba požadavku: ${response.status} ${response.statusText}`;
    throw new ApiError(errorMsg, response.status, data);
  }

  return data.data as T;
}

export async function requestRaw<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<ApiResponse<T>> {
  const headers: HeadersInit = {
    "Content-Type": "application/json",
    Accept: "application/json",
    ...getAuthHeaders(),
    ...options.headers,
  };

  const response = await fetch(endpoint, {
    ...options,
    headers,
  });

  let data: ApiResponse<T>;
  try {
    data = await response.json();
  } catch (err) {
    throw new ApiError(
      `Neplatná odpověď serveru (${response.status} ${response.statusText})`,
      response.status
    );
  }

  if (!response.ok || !data.success) {
    const errorMsg =
      data.error || data.message || `Chyba požadavku: ${response.status} ${response.statusText}`;
    throw new ApiError(errorMsg, response.status, data);
  }

  return data;
}
