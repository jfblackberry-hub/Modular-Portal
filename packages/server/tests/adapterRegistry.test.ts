import assert from 'node:assert/strict';
import { afterEach, test } from 'node:test';

import type { RegisteredAdapter } from '../src/adapters/adapter.js';
import {
  clear,
  discover,
  get,
  list,
  register
} from '../src/adapters/adapterRegistry.js';

function createAdapter(
  key: string,
  capabilities?: RegisteredAdapter['capabilities']
): RegisteredAdapter {
  return {
    key,
    capabilities,
    validateConfig(config) {
      return config;
    },
    healthCheck() {
      return {
        ok: true
      };
    },
    sync() {
      return {
        ok: true,
        recordsProcessed: 1
      };
    }
  };
}

afterEach(() => {
  clear();
});

test('adapters can register and be resolved by key', () => {
  const adapter = register(createAdapter('acme'));

  assert.equal(adapter.key, 'acme');
  assert.equal(get('acme')?.key, 'acme');
});

test('registry enforces unique adapter keys', () => {
  register(createAdapter('duplicate'));

  assert.throws(
    () => register(createAdapter('duplicate')),
    /already registered/
  );
});

test('registry lists adapters with capabilities', () => {
  register(createAdapter('zeta', { healthCheck: true, sync: false }));
  register(createAdapter('alpha'));

  const adapters = list();

  assert.deepEqual(
    adapters.map((adapter) => ({
      key: adapter.key,
      capabilities: adapter.capabilities
    })),
    [
      {
        key: 'alpha',
        capabilities: {
          healthCheck: true,
          sync: true
        }
      },
      {
        key: 'zeta',
        capabilities: {
          healthCheck: true,
          sync: false
        }
      }
    ]
  );
});

test('dynamic discovery registers adapters from loader functions', async () => {
  const discovered = await discover([
    async () => ({
      default: createAdapter('claims-feed')
    }),
    async () => ({
      adapter: createAdapter('eligibility')
    })
  ]);

  assert.equal(discovered.length, 2);
  assert.equal(get('claims-feed')?.key, 'claims-feed');
  assert.equal(get('eligibility')?.key, 'eligibility');
});
