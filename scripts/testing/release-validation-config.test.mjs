import assert from 'node:assert/strict';
import test from 'node:test';

import {
  isLocalDevReleaseValidation,
  resolveReleaseOrigins
} from './release-validation-config.mjs';

test('release validation defaults to local origins in local-dev mode', () => {
  const origins = resolveReleaseOrigins({});

  assert.deepEqual(origins, {
    portal: 'http://127.0.0.1:3000',
    admin: 'http://127.0.0.1:3003',
    api: 'http://127.0.0.1:3002'
  });
});

test('release validation fails fast when required origins are missing outside local-dev mode', () => {
  assert.equal(
    isLocalDevReleaseValidation({
      CI: 'true'
    }),
    false
  );

  assert.throws(
    () =>
      resolveReleaseOrigins({
        CI: 'true'
      }),
    /Release validation requires explicit public origins outside local-dev mode/i
  );
});

test('release validation rejects loopback origins outside local-dev mode', () => {
  assert.throws(
    () =>
      resolveReleaseOrigins({
        CI: 'true',
        PORTAL_PUBLIC_ORIGIN: 'http://127.0.0.1:3000',
        ADMIN_CONSOLE_PUBLIC_ORIGIN: 'https://admin.example.com',
        API_PUBLIC_ORIGIN: 'https://api.example.com'
      }),
    /cannot use localhost or loopback origins/i
  );
});
