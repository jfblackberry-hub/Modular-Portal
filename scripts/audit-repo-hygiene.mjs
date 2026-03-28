#!/usr/bin/env node

import { execFileSync } from 'node:child_process';
import { readFileSync } from 'node:fs';
import path from 'node:path';

const repoRoot = process.cwd();

const ALLOWED_PATH_PATTERNS = [
  /^deploy\.sh$/,
  /^infra\//,
  /^scripts\/deploy\//,
  /^scripts\/testing\//,
  /^scripts\/start-services\.sh$/,
  /^scripts\/status-services\.sh$/,
  /^scripts\/stop-services\.sh$/,
  /^scripts\/setup-eb-demo-db\.sh$/,
  /^docker-compose\.yml$/,
  /^\.env\.example$/,
  /^theme\/.*\.css$/,
  /^design\/.*\.css$/,
  /^apps\/.*\/tests?\//,
  /^apps\/.*\/public\//,
  /^backups\//,
  /^docs\//,
  /^README\.md$/
];

const ABSOLUTE_PATH_NEEDLES = ['/Users/'];
const TRACKED_BUILD_ARTIFACT_PATTERNS = [
  /^apps\/[^/]+\/\.next\//,
  /^apps\/[^/]+\/\.next-dev\//
];

function git(...args) {
  return execFileSync('git', args, {
    cwd: repoRoot,
    encoding: 'utf8'
  }).trim();
}

function isAllowedPath(filePath) {
  return ALLOWED_PATH_PATTERNS.some((pattern) => pattern.test(filePath));
}

function listTrackedFiles() {
  const output = git('ls-files');
  return output ? output.split('\n') : [];
}

function findTrackedBuildArtifacts(files) {
  return files.filter((file) =>
    TRACKED_BUILD_ARTIFACT_PATTERNS.some((pattern) => pattern.test(file))
  );
}

function findAbsolutePathViolations(files) {
  const violations = [];

  for (const file of files) {
    if (isAllowedPath(file)) {
      continue;
    }

    let content = '';

    try {
      content = readFileSync(path.join(repoRoot, file), 'utf8');
    } catch {
      continue;
    }

    const lines = content.split('\n');
    for (let index = 0; index < lines.length; index += 1) {
      const line = lines[index];
      if (ABSOLUTE_PATH_NEEDLES.some((needle) => line.includes(needle))) {
        violations.push({
          file,
          line: index + 1,
          text: line.trim()
        });
      }
    }
  }

  return violations;
}

function printSection(title, rows) {
  console.error(title);
  for (const row of rows) {
    console.error(`- ${row}`);
  }
}

function main() {
  const trackedFiles = listTrackedFiles();
  const trackedBuildArtifacts = findTrackedBuildArtifacts(trackedFiles);
  const absolutePathViolations = findAbsolutePathViolations(trackedFiles);

  if (trackedBuildArtifacts.length === 0 && absolutePathViolations.length === 0) {
    console.log('Repo hygiene audit passed.');
    return;
  }

  if (trackedBuildArtifacts.length > 0) {
    printSection(
      'Tracked build artifacts detected:',
      trackedBuildArtifacts
    );
  }

  if (absolutePathViolations.length > 0) {
    printSection(
      'Machine-local absolute path references detected in tracked source files:',
      absolutePathViolations.map(
        (item) => `${item.file}:${item.line} ${item.text}`
      )
    );
  }

  process.exit(1);
}

main();
