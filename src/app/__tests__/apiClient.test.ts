import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
  decodeJwtClaims,
  buildQuery,
  ApiRequestError,
  getAccessToken,
  setAccessToken,
  getTenantId,
  setTenantId,
  AUTH_SESSION_EXPIRED_EVENT,
} from '../apiClient';

// ─── decodeJwtClaims ────────────────────────────────────────────

function makeJwt(payload: Record<string, unknown>): string {
  const header = btoa(JSON.stringify({ alg: 'HS256', typ: 'JWT' }));
  const body = btoa(JSON.stringify(payload)).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  return `${header}.${body}.fakesig`;
}

describe('decodeJwtClaims', () => {
  it('decodes a well-formed JWT payload', () => {
    const claims = { sub: 'user-1', tenantId: 'church-abc', exp: 9999999999 };
    const token = makeJwt(claims);
    const result = decodeJwtClaims(token);
    expect(result.sub).toBe('user-1');
    expect(result.tenantId).toBe('church-abc');
  });

  it('returns empty object for malformed token', () => {
    expect(decodeJwtClaims('not.a.token')).toEqual({});
    expect(decodeJwtClaims('')).toEqual({});
    expect(decodeJwtClaims('onlyone')).toEqual({});
  });

  it('handles URL-safe base64 characters', () => {
    // Craft a payload that would produce + and / in standard base64
    const claims = { data: 'somethingwithspecialchars>>??' };
    const token = makeJwt(claims);
    const result = decodeJwtClaims(token);
    expect(result).toHaveProperty('data');
  });
});

// ─── buildQuery ─────────────────────────────────────────────────

describe('buildQuery', () => {
  it('returns empty string for empty params', () => {
    expect(buildQuery({})).toBe('');
  });

  it('returns empty string when all values are null/undefined/empty', () => {
    expect(buildQuery({ a: null, b: undefined, c: '' })).toBe('');
  });

  it('builds a query string with a single param', () => {
    expect(buildQuery({ page: 1 })).toBe('?page=1');
  });

  it('builds a query string with multiple params', () => {
    const qs = buildQuery({ page: 1, limit: 20, search: 'hello' });
    expect(qs).toContain('page=1');
    expect(qs).toContain('limit=20');
    expect(qs).toContain('search=hello');
    expect(qs.startsWith('?')).toBe(true);
  });

  it('URL-encodes special characters', () => {
    const qs = buildQuery({ q: 'hello world' });
    expect(qs).toContain('hello%20world');
  });

  it('includes boolean values', () => {
    expect(buildQuery({ active: true })).toBe('?active=true');
    expect(buildQuery({ active: false })).toBe('?active=false');
  });

  it('omits null and undefined values but keeps 0 and false', () => {
    const qs = buildQuery({ a: 0, b: false, c: null, d: undefined });
    expect(qs).toContain('a=0');
    expect(qs).toContain('b=false');
    expect(qs).not.toContain('c=');
    expect(qs).not.toContain('d=');
  });
});

// ─── ApiRequestError ────────────────────────────────────────────

describe('ApiRequestError', () => {
  it('is an instance of Error', () => {
    const err = new ApiRequestError(404, { message: 'Not found' });
    expect(err).toBeInstanceOf(Error);
  });

  it('stores status and body', () => {
    const body = { message: 'Unauthorized', code: 401 };
    const err = new ApiRequestError(401, body);
    expect(err.status).toBe(401);
    expect(err.body).toEqual(body);
  });

  it('sets message from body.message', () => {
    const err = new ApiRequestError(500, { message: 'Internal server error' });
    expect(err.message).toBe('Internal server error');
  });

  it('falls back to generic message when body.message is missing', () => {
    const err = new ApiRequestError(503, {} as any);
    expect(err.message).toContain('503');
  });

  it('has name ApiRequestError', () => {
    const err = new ApiRequestError(400, { message: 'Bad request' });
    expect(err.name).toBe('ApiRequestError');
  });
});

// ─── Token management ───────────────────────────────────────────

describe('setAccessToken / getAccessToken', () => {
  beforeEach(() => {
    // reset to clean state
    setAccessToken(null);
  });

  it('stores and retrieves a token', () => {
    setAccessToken('my-token-123');
    expect(getAccessToken()).toBe('my-token-123');
  });

  it('clears the token when set to null', () => {
    setAccessToken('my-token-123');
    setAccessToken(null);
    expect(getAccessToken()).toBeNull();
  });
});

describe('setTenantId / getTenantId', () => {
  beforeEach(() => {
    setTenantId(null);
  });

  it('stores and retrieves a tenant id', () => {
    setTenantId('tenant-abc');
    expect(getTenantId()).toBe('tenant-abc');
  });

  it('clears the tenant id when set to null', () => {
    setTenantId('tenant-abc');
    setTenantId(null);
    expect(getTenantId()).toBeNull();
  });
});

// ─── AUTH_SESSION_EXPIRED_EVENT ─────────────────────────────────

describe('AUTH_SESSION_EXPIRED_EVENT constant', () => {
  it('is a non-empty string', () => {
    expect(typeof AUTH_SESSION_EXPIRED_EVENT).toBe('string');
    expect(AUTH_SESSION_EXPIRED_EVENT.length).toBeGreaterThan(0);
  });
});
