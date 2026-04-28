import { useSyncExternalStore } from "react";
import { resolveDemoData } from "../data/demoData";

const API_BASE = import.meta.env.VITE_API_BASE_URL ?? "/api";
const REQUEST_TIMEOUT_MS = 5000;

export interface ApiResponse<T> {
  data: T;
  isFallback: boolean;
}

export interface BackendStatusSnapshot {
  mode: "checking" | "connected" | "fallback";
  updated_at: string | null;
}

let backendStatus: BackendStatusSnapshot = {
  mode: "checking",
  updated_at: null
};

const listeners = new Set<() => void>();

function notifyStatus(mode: BackendStatusSnapshot["mode"]) {
  if (backendStatus.mode === mode) {
    return;
  }

  backendStatus = {
    mode,
    updated_at: new Date().toISOString()
  };
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function getSnapshot() {
  return backendStatus;
}

function getServerSnapshot() {
  return backendStatus;
}

async function readPayload<T>(response: Response): Promise<T | null> {
  const textReader = (response as Response & { text?: () => Promise<string> }).text;
  if (typeof textReader === "function") {
    const text = await textReader.call(response);
    if (!text) {
      return null;
    }
    return JSON.parse(text) as T;
  }

  const jsonReader = (response as Response & { json?: () => Promise<T> }).json;
  if (typeof jsonReader === "function") {
    return (await jsonReader.call(response)) as T;
  }

  return null;
}

function normalizeError(caught: unknown): Error {
  if (caught instanceof Error) {
    if (caught.name === "AbortError") {
      return new Error("Request timed out after 5 seconds.");
    }
    return caught;
  }

  return new Error("Unknown request error.");
}

function parseBody(body: BodyInit | null | undefined): unknown {
  if (typeof body !== "string") {
    return undefined;
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    return body;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<ApiResponse<T>> {
  const method = init?.method?.toUpperCase() ?? "GET";
  const controller = new AbortController();
  const timeoutId = window.setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE}${path}`, {
      headers: {
        "Content-Type": "application/json",
        ...(init?.headers ?? {})
      },
      ...init,
      signal: controller.signal
    });
    const payload = await readPayload<T | { detail?: string }>(response);

    if (!response.ok) {
      throw new Error(
        (payload as { detail?: string } | null)?.detail ??
          `Request failed with status ${response.status}.`
      );
    }

    notifyStatus("connected");
    console.info(`[api] ${method} ${path} resolved from live backend.`);
    return {
      data: payload as T,
      isFallback: false
    };
  } catch (caught) {
    const requestError = normalizeError(caught);
    console.error(`[api] ${method} ${path} failed; switching to demo fallback mode.`, requestError);

    try {
      const fallbackData = resolveDemoData<T>({
        path,
        method,
        body: parseBody(init?.body)
      });
      notifyStatus("fallback");
      console.warn(`[api] ${method} ${path} resolved from demo fallback data.`);
      return {
        data: fallbackData,
        isFallback: true
      };
    } catch {
      throw requestError;
    }
  } finally {
    window.clearTimeout(timeoutId);
  }
}

export function apiGet<T>(path: string): Promise<ApiResponse<T>> {
  return request<T>(path);
}

export function apiPost<T, TBody>(path: string, body: TBody): Promise<ApiResponse<T>> {
  return request<T>(path, {
    method: "POST",
    body: JSON.stringify(body)
  });
}

export function useBackendStatus() {
  return useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
}
