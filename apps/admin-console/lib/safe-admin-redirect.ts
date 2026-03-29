/**
 * Post-login redirect contract (admin console)
 * -------------------------------------------
 * Accepts only same-origin-style relative paths that resolve under `/admin`
 * (including query string and hash). Rejects absolute URLs, protocol-relative
 * URLs (`//host/...`), `javascript:`, `data:`, `vbscript:`, backslashes, NULs,
 * and paths that normalize outside `/admin` (e.g. `/admin/../login`).
 * Candidate strings are URI-decoded up to four rounds, then validated.
 * Invalid input yields `undefined` from {@link parseSafeAdminPostLoginRedirect},
 * or the configured fallback from {@link sanitizeAdminPostLoginRedirect}
 * (default `/admin`).
 *
 * For portal handoff responses, {@link sanitizeSameOriginRelativeRedirect}
 * constrains the target to the same origin as the given `baseUrl` (typically the
 * portal handoff endpoint); invalid values fall back to `defaultRelativePath`.
 */

const DEFAULT_ADMIN_POST_LOGIN_REDIRECT = '/admin';
const REDIRECT_PARSE_BASE = 'https://admin-post-login.redirect.invalid';
const BASE_ORIGIN = new URL(REDIRECT_PARSE_BASE).origin;

const MAX_DECODE_ROUNDS = 4;

function decodeRedirectCandidate(raw: string): string | null {
  let current = raw;
  for (let i = 0; i < MAX_DECODE_ROUNDS; i += 1) {
    try {
      const next = decodeURIComponent(current);
      if (next === current) {
        break;
      }
      current = next;
    } catch {
      return null;
    }
  }
  return current;
}

function collapsePathDots(pathname: string): string {
  const segments = pathname.split('/').filter((segment) => segment.length > 0 && segment !== '.');
  const stack: string[] = [];
  for (const segment of segments) {
    if (segment === '..') {
      stack.pop();
    } else {
      stack.push(segment);
    }
  }
  return `/${stack.join('/')}`;
}

function isAllowedAdminPathname(normalizedPathname: string): boolean {
  return normalizedPathname === '/admin' || normalizedPathname.startsWith('/admin/');
}

function unsafeSchemePrefix(decoded: string): boolean {
  const lower = decoded.toLowerCase();
  return (
    lower.startsWith('http://') ||
    lower.startsWith('https://') ||
    lower.startsWith('//') ||
    lower.startsWith('javascript:') ||
    lower.startsWith('data:') ||
    lower.startsWith('vbscript:')
  );
}

export function parseSafeAdminPostLoginRedirect(
  raw: string | null | undefined
): string | undefined {
  if (raw == null || typeof raw !== 'string') {
    return undefined;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return undefined;
  }

  const decoded = decodeRedirectCandidate(trimmed);
  if (decoded == null) {
    return undefined;
  }

  if (decoded.includes('\0') || decoded.includes('\\')) {
    return undefined;
  }

  if (unsafeSchemePrefix(decoded)) {
    return undefined;
  }

  let url: URL;
  try {
    url = new URL(decoded, REDIRECT_PARSE_BASE);
  } catch {
    return undefined;
  }

  if (url.origin !== BASE_ORIGIN) {
    return undefined;
  }

  const normalizedPath = collapsePathDots(url.pathname);
  if (!isAllowedAdminPathname(normalizedPath)) {
    return undefined;
  }

  const out = `${normalizedPath}${url.search}${url.hash}`;
  return out.length > 0 ? out : undefined;
}

export function sanitizeAdminPostLoginRedirect(
  raw: string | null | undefined,
  options?: { fallback?: string }
): string {
  const fallback = options?.fallback ?? DEFAULT_ADMIN_POST_LOGIN_REDIRECT;
  return parseSafeAdminPostLoginRedirect(raw) ?? fallback;
}

export function sanitizeSameOriginRelativeRedirect(
  raw: string | null | undefined,
  baseUrl: string,
  defaultRelativePath: string
): string {
  if (raw == null || typeof raw !== 'string') {
    return defaultRelativePath;
  }

  const trimmed = raw.trim();
  if (!trimmed) {
    return defaultRelativePath;
  }

  const decoded = decodeRedirectCandidate(trimmed);
  if (decoded == null) {
    return defaultRelativePath;
  }

  if (decoded.includes('\0') || decoded.includes('\\')) {
    return defaultRelativePath;
  }

  if (unsafeSchemePrefix(decoded)) {
    return defaultRelativePath;
  }

  let origin: string;
  try {
    origin = new URL(baseUrl).origin;
  } catch {
    return defaultRelativePath;
  }

  let url: URL;
  try {
    url = new URL(decoded, baseUrl);
  } catch {
    return defaultRelativePath;
  }

  if (url.origin !== origin) {
    return defaultRelativePath;
  }

  const normalizedPath = collapsePathDots(url.pathname);
  if (!normalizedPath.startsWith('/')) {
    return defaultRelativePath;
  }

  const combined = `${normalizedPath}${url.search}${url.hash}`;
  return combined.length > 0 ? combined : defaultRelativePath;
}

export { DEFAULT_ADMIN_POST_LOGIN_REDIRECT };
