import { access, mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';

const [, , rawName] = process.argv;

if (!rawName) {
  console.error('Usage: pnpm create-plugin <name>');
  process.exit(1);
}

const pluginId = rawName
  .trim()
  .toLowerCase()
  .replace(/[^a-z0-9]+/g, '-')
  .replace(/^-+|-+$/g, '');

if (!pluginId) {
  console.error('Plugin name must contain letters or numbers.');
  process.exit(1);
}

const pluginName = pluginId
  .split('-')
  .filter(Boolean)
  .map((segment) => segment[0].toUpperCase() + segment.slice(1))
  .join(' ');

const pluginDirectory = path.resolve('plugins', pluginId);

try {
  await access(pluginDirectory);
  console.error(`Plugin directory already exists: plugins/${pluginId}`);
  process.exit(1);
} catch {
  // Directory does not exist yet, continue.
}

function packageJsonTemplate() {
  return JSON.stringify(
    {
      name: `@payer-portal/plugin-${pluginId}`,
      version: '0.1.0',
      private: true,
      type: 'module',
      main: './dist/index.js',
      types: './dist/index.d.ts',
      exports: {
        '.': {
          types: './dist/index.d.ts',
          default: './dist/index.js'
        }
      },
      dependencies: {
        '@payer-portal/plugin-sdk': 'workspace:*'
      },
      scripts: {
        build: 'tsc -p tsconfig.json',
        lint: 'tsc --noEmit',
        typecheck: 'tsc --noEmit',
        test: `node -e "console.log('No tests configured for @payer-portal/plugin-${pluginId}')"`
      }
    },
    null,
    2
  );
}

function tsconfigTemplate() {
  return JSON.stringify(
    {
      extends: '../../tsconfig.json',
      compilerOptions: {
        rootDir: '.',
        outDir: 'dist',
        declaration: true,
        declarationMap: true,
        noEmit: false
      },
      include: ['index.ts', 'manifest.ts', 'routes.ts', 'pages/**/*.ts', 'components/**/*.ts'],
      exclude: ['dist', 'node_modules']
    },
    null,
    2
  );
}

function manifestTemplate() {
  return `import type { PluginManifest } from '@payer-portal/plugin-sdk';

import { routes } from './routes.js';

export const manifest: PluginManifest = {
  id: '${pluginId}',
  name: '${pluginName}',
  version: '0.1.0',
  routes,
  navigation: [
    {
      label: '${pluginName}',
      href: '/${pluginId}'
    }
  ],
  requiredPermissions: []
};
`;
}

function routesTemplate() {
  return `import type { PluginRoute } from '@payer-portal/plugin-sdk';

export const routes: PluginRoute[] = [
  {
    path: '/${pluginId}',
    label: '${pluginName} Home'
  }
];
`;
}

function indexTemplate() {
  return `export { manifest } from './manifest.js';
export { routes } from './routes.js';
export * from './pages/index.js';
export * from './components/index.js';
`;
}

function pagesTemplate() {
  return `export const pageRegistry = [
  {
    path: '/${pluginId}',
    file: 'app/${pluginId}/page.tsx'
  }
];
`;
}

function componentsTemplate() {
  return `export const componentRegistry = [
  {
    name: '${pluginName}Shell',
    file: 'components/${pluginId}-shell.tsx'
  }
];
`;
}

await mkdir(path.join(pluginDirectory, 'pages'), { recursive: true });
await mkdir(path.join(pluginDirectory, 'components'), { recursive: true });

await writeFile(path.join(pluginDirectory, 'package.json'), packageJsonTemplate());
await writeFile(path.join(pluginDirectory, 'tsconfig.json'), tsconfigTemplate());
await writeFile(path.join(pluginDirectory, 'index.ts'), indexTemplate());
await writeFile(path.join(pluginDirectory, 'manifest.ts'), manifestTemplate());
await writeFile(path.join(pluginDirectory, 'routes.ts'), routesTemplate());
await writeFile(path.join(pluginDirectory, 'pages', 'index.ts'), pagesTemplate());
await writeFile(
  path.join(pluginDirectory, 'components', 'index.ts'),
  componentsTemplate()
);

console.log(`Created plugin skeleton at plugins/${pluginId}`);
console.log('Next step: run `pnpm install` to link the new workspace package.');
