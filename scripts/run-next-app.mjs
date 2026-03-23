#!/usr/bin/env node

import { rm } from 'node:fs/promises';
import { spawn } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const [appName, mode] = process.argv.slice(2);

if (
  (appName !== 'portal-web' && appName !== 'admin-console') ||
  (mode !== 'dev' && mode !== 'start')
) {
  console.error(
    'Usage: node scripts/run-next-app.mjs <portal-web|admin-console> <dev|start>'
  );
  process.exit(1);
}

const configModule = await import('../packages/config/dist/index.js');
const serviceConfig =
  appName === 'portal-web'
    ? configModule.loadPortalWebServiceConfig(process.env)
    : configModule.loadAdminConsoleServiceConfig(process.env);
const port =
  serviceConfig.port ??
  (appName === 'portal-web'
    ? serviceConfig.runtimeModel.ports.portalWeb
    : serviceConfig.runtimeModel.ports.adminConsole);
const host = serviceConfig.host;
const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const appDirectory = path.resolve(scriptDirectory, '..', 'apps', appName);

process.env.APP_NAME ??= appName;
process.env.HOST ??= host;
process.env.PORT ??= String(port);
process.env.NEXT_TELEMETRY_DISABLED ??= '1';
process.env.NEXT_DIST_DIR ??= mode === 'dev' ? '.next-dev' : '.next';

if (mode === 'dev') {
  await rm(path.join(appDirectory, process.env.NEXT_DIST_DIR), {
    force: true,
    recursive: true
  }).catch(() => undefined);
}

const child = spawn(
  process.platform === 'win32' ? 'pnpm.cmd' : 'pnpm',
  ['exec', 'next', mode, '--hostname', host, '--port', String(port)],
  {
    cwd: appDirectory,
    env: process.env,
    stdio: 'inherit'
  }
);

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }

  process.exit(code ?? 0);
});
