import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';

import { publish } from '../../events/eventBus.js';
import type { IntegrationAdapter } from '../integration.js';

type FileAdapterConfig = {
  directoryPath: string;
  tenantId?: string;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function normalizeConfig(config: Record<string, unknown>): FileAdapterConfig {
  const directoryPath =
    typeof config.directoryPath === 'string' ? config.directoryPath.trim() : '';
  const tenantId = typeof config.tenantId === 'string' ? config.tenantId.trim() : undefined;

  if (!directoryPath) {
    throw new Error('directoryPath is required');
  }

  return {
    directoryPath: path.resolve(directoryPath),
    tenantId: tenantId || undefined
  };
}

function parseCsv(content: string) {
  const lines = content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    return [];
  }

  const headers = lines[0]!.split(',').map((header) => header.trim());

  return lines.slice(1).map((line) => {
    const values = line.split(',').map((value) => value.trim());

    return Object.fromEntries(
      headers.map((header, index) => [header, values[index] ?? ''])
    );
  });
}

async function parseFile(filePath: string) {
  const extension = path.extname(filePath).toLowerCase();
  const content = await readFile(filePath, 'utf8');

  if (extension === '.json') {
    const parsed = JSON.parse(content) as unknown;

    if (Array.isArray(parsed)) {
      return parsed.filter(isRecord);
    }

    return isRecord(parsed) ? [parsed] : [];
  }

  if (extension === '.csv') {
    return parseCsv(content);
  }

  return [];
}

export const localFileAdapter: IntegrationAdapter<
  Record<string, unknown>,
  FileAdapterConfig
> = {
  key: 'local-file',
  description: 'File-based integration adapter for SFTP-style drop directories.',
  capabilities: {
    authentication: false,
    fileBased: true,
    healthCheck: true,
    retries: true,
    scheduled: true,
    sync: true
  },
  validateConfig(config) {
    return normalizeConfig(config);
  },
  async healthCheck(config, context) {
    try {
      await readdir(config.directoryPath);
      context.logger.info('File integration health check succeeded', {
        adapterKey: 'local-file',
        directoryPath: config.directoryPath
      });

      return {
        ok: true,
        message: 'Local file directory is accessible'
      };
    } catch (error) {
      return {
        ok: false,
        message: error instanceof Error ? error.message : 'Unable to access directory'
      };
    }
  },
  async sync(config, context) {
    const entries = await readdir(config.directoryPath, {
      withFileTypes: true
    });
    let recordsProcessed = 0;
    let eventsPublished = 0;

    for (const entry of entries) {
      if (!entry.isFile()) {
        continue;
      }

      const filePath = path.join(config.directoryPath, entry.name);
      const records = await parseFile(filePath);

      for (const record of records) {
        recordsProcessed += 1;
        eventsPublished += 1;

        console.log('[connector] parsed record', {
          adapterKey: 'local-file',
          fileName: entry.name,
          record
        });

        context.logger.info('File integration parsed record', {
          adapterKey: 'local-file',
          fileName: entry.name
        });

        await publish('connector.record.imported', {
          id: `${entry.name}:${recordsProcessed}`,
          correlationId: `${entry.name}:${recordsProcessed}`,
          timestamp: new Date(),
          tenantId: config.tenantId ?? null,
          type: 'connector.record.imported',
          payload: {
            adapterKey: 'local-file',
            fileName: entry.name,
            record
          }
        });
      }
    }

    return {
      ok: true,
      message: `Processed ${recordsProcessed} records`,
      eventsPublished,
      metadata: {
        directoryPath: config.directoryPath
      },
      recordsProcessed
    };
  }
};
