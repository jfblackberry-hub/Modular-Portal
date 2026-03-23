import { mkdir, rm, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const scriptDirectory = path.dirname(fileURLToPath(import.meta.url));
const defaultRepoRoot = path.resolve(scriptDirectory, '..');

function parseArgs(argv) {
  const [appName, ...rest] = argv;
  const options = {
    appName,
    mode: 'typecheck',
    repoRoot: defaultRepoRoot
  };

  for (let index = 0; index < rest.length; index += 1) {
    const value = rest[index];

    if (value === '--mode') {
      options.mode = rest[index + 1] ?? options.mode;
      index += 1;
      continue;
    }

    if (value === '--repo-root') {
      options.repoRoot = path.resolve(rest[index + 1] ?? options.repoRoot);
      index += 1;
    }
  }

  return options;
}

export function resolveNextArtifactPaths(input) {
  const appDirectory = path.join(input.repoRoot, 'apps', input.appName);
  return {
    appDirectory,
    buildDirectory: path.join(appDirectory, '.next'),
    devDirectory: path.join(appDirectory, '.next-dev'),
    typeDirectory: path.join(appDirectory, '.next', 'types'),
    devTypeDirectory: path.join(appDirectory, '.next-dev', 'types'),
    placeholderPath: path.join(appDirectory, '.next', 'types', 'placeholder.ts'),
    cacheLifePath: path.join(appDirectory, '.next', 'types', 'cache-life.d.ts'),
    routesPath: path.join(appDirectory, '.next', 'types', 'routes.d.ts'),
    validatorPath: path.join(appDirectory, '.next', 'types', 'validator.ts'),
    tsBuildInfoPath: path.join(appDirectory, 'tsconfig.tsbuildinfo')
  };
}

export async function prepareNextArtifacts(input) {
  const paths = resolveNextArtifactPaths(input);

  if (input.mode === 'dev') {
    await rm(paths.devDirectory, {
      force: true,
      recursive: true
    });
  }

  if (input.mode === 'build') {
    await rm(paths.buildDirectory, {
      force: true,
      recursive: true
    });
    await rm(paths.devDirectory, {
      force: true,
      recursive: true
    });
  }

  if (input.mode === 'typecheck') {
    await rm(paths.buildDirectory, {
      force: true,
      recursive: true
    });
    await rm(paths.devDirectory, {
      force: true,
      recursive: true
    });
    await rm(paths.tsBuildInfoPath, {
      force: true
    });
  }

  await mkdir(paths.typeDirectory, { recursive: true });
  await writeFile(paths.placeholderPath, 'export {};\n', 'utf8');
  await writeFile(paths.cacheLifePath, 'export {};\n', 'utf8');
  await writeFile(paths.routesPath, 'export {};\n', 'utf8');
  await writeFile(paths.validatorPath, 'export {};\n', 'utf8');

  return paths;
}

async function main() {
  const options = parseArgs(process.argv.slice(2));

  if (!options.appName) {
    console.error(
      'Usage: node scripts/ensure-next-types.mjs <app-name> [--mode dev|build|typecheck]'
    );
    process.exit(1);
  }

  await prepareNextArtifacts(options);
}

if (import.meta.url === `file://${process.argv[1]}`) {
  await main();
}
