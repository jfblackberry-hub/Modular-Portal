import assert from 'node:assert/strict';
import test from 'node:test';

import { GET } from '../app/liveness/route';

test('admin liveness route returns ok during normal runtime checks', async () => {
  const response = await GET();

  assert.equal(response.status, 200);
  const payload = (await response.json()) as {
    service: string;
    status: string;
    checks: {
      process: {
        uptimeSeconds: number;
      };
    };
  };

  assert.equal(payload.service, 'admin-console');
  assert.equal(payload.status, 'ok');
  assert.equal(typeof payload.checks.process.uptimeSeconds, 'number');
});
