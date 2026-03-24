import assert from 'node:assert/strict';
import { mkdtemp, readFile } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';

import {
  prepareNextArtifacts,
  resolveNextArtifactPaths
} from './ensure-next-types.mjs';

test('prepareNextArtifacts resets the requested Next artifact directory and recreates stable type placeholders', async () => {
  const tempRoot = await mkdtemp(path.join(os.tmpdir(), 'modular-portal-next-'));
  const appName = 'fixture-app';
  const appRoot = path.join(tempRoot, 'apps', appName);

  await prepareNextArtifacts({
    appName,
    mode: 'build',
    repoRoot: tempRoot
  });

  const paths = resolveNextArtifactPaths({
    appName,
    repoRoot: tempRoot
  });
  const placeholder = await readFile(paths.placeholderPath, 'utf8');

  assert.equal(paths.appDirectory, appRoot);
  assert.equal(placeholder, 'export {};\n');
});
