import { spawnSync } from 'node:child_process';

const DEFAULT_ORIGINS = {
  portal: process.env.PORTAL_PUBLIC_ORIGIN ?? 'http://127.0.0.1:3000',
  admin: process.env.ADMIN_CONSOLE_PUBLIC_ORIGIN ?? 'http://127.0.0.1:3003',
  api: process.env.API_PUBLIC_ORIGIN ?? 'http://127.0.0.1:3002'
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isReachable(url) {
  try {
    const response = await fetch(url, {
      redirect: 'manual',
      cache: 'no-store'
    });

    return response.status > 0;
  } catch {
    return false;
  }
}

export async function isLocalStackHealthy() {
  const checks = await Promise.all([
    isReachable(`${DEFAULT_ORIGINS.portal}/liveness`),
    isReachable(`${DEFAULT_ORIGINS.admin}/liveness`),
    isReachable(`${DEFAULT_ORIGINS.api}/liveness`)
  ]);

  return checks.every(Boolean);
}

export async function ensureLocalStack() {
  const alreadyRunning = await isLocalStackHealthy();

  if (alreadyRunning) {
    return {
      startedByHarness: false,
      origins: DEFAULT_ORIGINS
    };
  }

  const result = spawnSync('pnpm', ['services:start'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env
  });

  if (result.status !== 0) {
    throw new Error('Unable to start local services for smoke/integration tests.');
  }

  for (let attempt = 0; attempt < 10; attempt += 1) {
    if (await isLocalStackHealthy()) {
      return {
        startedByHarness: true,
        origins: DEFAULT_ORIGINS
      };
    }

    await sleep(1000);
  }

  throw new Error('Local services did not become healthy in time.');
}

export function stopLocalStackIfStarted(startedByHarness) {
  if (!startedByHarness) {
    return;
  }

  const result = spawnSync('pnpm', ['services:stop'], {
    cwd: process.cwd(),
    stdio: 'inherit',
    env: process.env
  });

  if (result.status !== 0) {
    throw new Error('Failed to stop local services after tests.');
  }
}

export async function expectHttpStatus(url, expectedStatuses, options = {}) {
  const response = await fetch(url, {
    redirect: 'manual',
    cache: 'no-store',
    ...options
  });

  if (!expectedStatuses.includes(response.status)) {
    const body = await response.text().catch(() => '');
    throw new Error(
      `Expected ${url} to return one of [${expectedStatuses.join(', ')}], got ${response.status}. Body: ${body.slice(0, 400)}`
    );
  }

  return response;
}

export class CookieJar {
  #cookies = new Map();

  absorb(response) {
    const setCookies =
      typeof response.headers.getSetCookie === 'function'
        ? response.headers.getSetCookie()
        : [];

    for (const cookie of setCookies) {
      const [pair, ...attributes] = cookie.split(';').map((part) => part.trim());
      const [name, ...valueParts] = pair.split('=');
      const value = valueParts.join('=');
      const maxAgeAttribute = attributes.find((attribute) =>
        attribute.toLowerCase().startsWith('max-age=')
      );

      if (!name) {
        continue;
      }

      if (maxAgeAttribute && maxAgeAttribute.toLowerCase() === 'max-age=0') {
        this.#cookies.delete(name);
        continue;
      }

      this.#cookies.set(name, value);
    }
  }

  header() {
    return Array.from(this.#cookies.entries())
      .map(([name, value]) => `${name}=${value}`)
      .join('; ');
  }

  has(name) {
    return this.#cookies.has(name);
  }
}

export function printCheck(name, detail) {
  console.log(`PASS ${name}: ${detail}`);
}
