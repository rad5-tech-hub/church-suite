/**
 * Converts raw API / network error messages into human-readable strings
 * safe to display directly in toasts and UI.
 */
export function friendlyError(err: unknown): string {
  const raw: string =
    err instanceof Error
      ? err.message
      : typeof err === 'string'
      ? err
      : 'An unexpected error occurred.';

  const lower = raw.toLowerCase();

  // ── Auth ─────────────────────────────────────────────────────────────────
  if (lower.includes('jwt expired') || lower.includes('token expired') || lower.includes('session expired'))
    return 'Your session has expired. Please log in again.';
  if (lower.includes('unauthorized') || lower.includes('not authenticated'))
    return 'You are not authorised to perform this action. Please log in.';
  if (lower.includes('forbidden'))
    return "You don't have permission to perform this action.";

  // ── Database / input ─────────────────────────────────────────────────────
  if (lower.includes('invalid input syntax for type uuid'))
    return 'This record cannot be edited — it does not have a valid server reference.';
  if (lower.includes('duplicate') || lower.includes('unique constraint') || lower.includes('already exists'))
    return 'A record with these details already exists.';
  if (lower.includes('foreign key') || lower.includes('violates'))
    return 'This record is linked to other data and cannot be changed.';
  if (lower.includes('not null') || lower.includes('null value'))
    return 'A required field is missing. Please fill in all required fields.';

  // ── Edit window ───────────────────────────────────────────────────────────
  if (lower.includes('edit window') || lower.includes('edit window closed'))
    return raw.replace(/^.*edit window/i, 'Edit window').trim(); // keep the human-readable API text

  // ── Network ───────────────────────────────────────────────────────────────
  if (lower.includes('failed to fetch') || lower.includes('networkerror') || lower.includes('network request failed'))
    return 'Unable to connect. Please check your internet connection and try again.';
  if (lower.includes('timeout') || lower.includes('timed out'))
    return 'The request timed out. Please try again.';

  // ── HTTP status codes ─────────────────────────────────────────────────────
  if (lower.includes('api error 400') || lower === 'bad request')
    return 'The request could not be processed. Please check your input and try again.';
  if (lower.includes('api error 404') || lower.includes('not found'))
    return 'The requested record was not found.';
  if (lower.includes('api error 409') || lower.includes('conflict'))
    return 'This action conflicts with an existing record.';
  if (lower.includes('api error 500') || lower.includes('internal server'))
    return 'A server error occurred. Please try again later.';
  if (lower.includes('api error 503') || lower.includes('service unavailable'))
    return 'The service is temporarily unavailable. Please try again shortly.';

  // ── Fallback: strip "Error:" prefix and stack traces ─────────────────────
  const cleaned = raw
    .replace(/^Error:\s*/i, '')
    .replace(/\n[\s\S]*/g, '') // drop stack trace lines
    .trim();

  return cleaned || 'An unexpected error occurred. Please try again.';
}

/** Returns true if the string is a valid UUID v4 format. */
export function isUuid(id: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id);
}
