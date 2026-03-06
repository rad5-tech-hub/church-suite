/// <reference types="vite/client" />
// ─── Real API Client ─────────────────────────────────────────
// Centralized HTTP client for the Church Suite backend API
// Base URL is read from the VITE_API_BASE_URL environment variable.

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://testchurch.bookbank.com.ng';

// ─── Token Management ───────────────────────────────────────
// Access token is persisted in sessionStorage so it survives page refreshes
// within the same browser tab. sessionStorage is automatically cleared when
// the tab/window is closed, limiting exposure.
// Falls back to silent refresh via httpOnly cookie if no stored token exists.

const TOKEN_KEY = 'churchset_access_token';
const TENANT_KEY = 'churchset_tenant_id';

let _accessToken: string | null = (() => {
  try { return sessionStorage.getItem(TOKEN_KEY); } catch { return null; }
})();

export function getAccessToken(): string | null {
  return _accessToken;
}

export function setAccessToken(token: string | null) {
  _accessToken = token;
  try {
    if (token) sessionStorage.setItem(TOKEN_KEY, token);
    else sessionStorage.removeItem(TOKEN_KEY);
  } catch { /* ignore */ }
}

export function getTenantId(): string | null {
  try { return sessionStorage.getItem(TENANT_KEY); } catch { return null; }
}

export function setTenantId(id: string | null) {
  try {
    if (id) sessionStorage.setItem(TENANT_KEY, id);
    else sessionStorage.removeItem(TENANT_KEY);
  } catch { /* ignore */ }
}

// ─── Core Fetch Wrapper ─────────────────────────────────────

export interface ApiError {
  message: string;
  errors?: string[];
  code?: number;
  details?: any;
}

export class ApiRequestError extends Error {
  status: number;
  body: ApiError;

  constructor(status: number, body: ApiError) {
    super(body.message || `API error ${status}`);
    this.name = 'ApiRequestError';
    this.status = status;
    this.body = body;
  }
}

/**
 * Decode a JWT payload on the client without signature verification.
 * Safe to use only for reading non-sensitive claims (tenantId, etc.).
 */
export function decodeJwtClaims(token: string): Record<string, any> {
  try {
    const b64 = token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/');
    return JSON.parse(atob(b64));
  } catch {
    return {};
  }
}

/**
 * Core fetch wrapper for the real backend API.
 * Automatically attaches Bearer token and x-tenant-id headers.
 */
export async function apiFetch<T = any>(
  path: string,
  options?: RequestInit & { skipAuth?: boolean }
): Promise<T> {
  const url = `${API_BASE_URL}${path}`;
  const token = getAccessToken();
  const tenantId = getTenantId();
  const method = (options?.method ?? 'GET').toUpperCase();
  const t0 = performance.now();

  // ── Auth guard: reject requests that require auth but have no token ─────
  if (!token && !options?.skipAuth) {
    if (import.meta.env.DEV) {
      console.warn(`[API] Blocked ${method} ${path} — no access token available`);
    }
    throw new ApiRequestError(401, {
      message: 'Not authenticated. Please log in first.',
      code: 401,
    });
  }

  const headers: Record<string, string> = {
    ...(options?.headers as Record<string, string> || {}),
  };

  // Don't set Content-Type for FormData (browser sets it with boundary)
  if (!(options?.body instanceof FormData)) {
    headers['Content-Type'] = headers['Content-Type'] || 'application/json';
  }

  if (token && !options?.skipAuth) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  if (tenantId) {
    headers['x-tenant-id'] = tenantId;
  }

  // ── Dev logging: request ────────────────────────────────────────────────
  if (import.meta.env.DEV) {
    const logBody = options?.body instanceof FormData
      ? '[FormData]'
      : options?.body
        ? (() => { try { return JSON.parse(options.body as string); } catch { return options.body; } })()
        : undefined;
    console.groupCollapsed(`%c➤ ${method} ${path}`, 'color:#6366f1;font-weight:bold');
    console.log('URL:', url);
    if (logBody !== undefined) console.log('Body:', logBody);
    console.log('Headers:', { ...headers, Authorization: headers.Authorization ? '***' : undefined });
    console.groupEnd();
  }

  const res = await fetch(url, {
    ...options,
    headers,
    credentials: 'include', // for cookies (refresh token)
  });

  const elapsed = Math.round(performance.now() - t0);

  // Handle file downloads (Excel exports etc.)
  const contentType = res.headers.get('content-type') || '';
  if (contentType.includes('application/vnd') || contentType.includes('application/octet-stream')) {
    if (import.meta.env.DEV) {
      console.log(`%c◀ ${method} ${path} → ${res.status} (${elapsed}ms) [blob]`, res.ok ? 'color:#22c55e' : 'color:#ef4444');
    }
    if (!res.ok) {
      throw new ApiRequestError(res.status, { message: `Download failed: ${res.status}` });
    }
    return res.blob() as unknown as T;
  }

  // Parse JSON response
  let body: any;
  try {
    body = await res.json();
  } catch {
    if (import.meta.env.DEV) {
      console.log(`%c◀ ${method} ${path} → ${res.status} (${elapsed}ms) [no JSON body]`, res.ok ? 'color:#22c55e' : 'color:#ef4444');
    }
    if (!res.ok) {
      throw new ApiRequestError(res.status, { message: `API error ${res.status}` });
    }
    return {} as T;
  }

  // ── Dev logging: response ───────────────────────────────────────────────
  if (import.meta.env.DEV) {
    const color = res.ok ? '#22c55e' : '#ef4444';
    console.groupCollapsed(`%c◀ ${method} ${path} → ${res.status} (${elapsed}ms)`, `color:${color};font-weight:bold`);
    console.log('Response body:', body);
    console.groupEnd();
  }

  if (!res.ok) {
    // ── Subscription-required handling ──────────────────────────────────────
    if (body?.requiresSubscription === true) {
      if (import.meta.env.DEV) {
        console.warn(`[API] requiresSubscription=true for ${method} ${path}`);
      }
      const reqMethod = method;
      if (reqMethod === 'GET') {
        return [] as unknown as T;
      }
      if (body?.accessToken) {
        _accessToken = body.accessToken;
        const claims = decodeJwtClaims(body.accessToken);
        if (claims.tenantId) {
          try { sessionStorage.setItem(TENANT_KEY, claims.tenantId); } catch { /* ignore */ }
        }
        return body as T;
      }
    }
    // ── Generic error handling ───────────────────────────────────────────────
    const error: ApiError = {
      message: body?.error?.message || body?.message || `API error ${res.status}`,
      errors: body?.errors,
      code: body?.error?.code || res.status,
      details: body?.error?.details,
    };
    if (import.meta.env.DEV) {
      console.error(`[API ERROR] ${method} ${path} →`, error);
    }
    throw new ApiRequestError(res.status, error);
  }

  return body as T;
}

/** Returns the configured API base URL. */
export function getApiBaseUrl(): string { return API_BASE_URL; }

/**
 * Helper to build query string from an object
 */
export function buildQuery(params: Record<string, string | number | boolean | undefined | null>): string {
  const entries = Object.entries(params).filter(([, v]) => v != null && v !== '');
  if (entries.length === 0) return '';
  return '?' + entries.map(([k, v]) => `${encodeURIComponent(k)}=${encodeURIComponent(String(v))}`).join('&');
}
