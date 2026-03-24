import fs from 'node:fs/promises';
import path from 'node:path';

import type {
  StorageHealthResult,
  StorageListItem,
  StoragePutInput,
  StoragePutOptions,
  StorageService
} from './types.js';

type LocalStorageAdapterOptions = {
  publicBasePath?: string;
  rootDir: string;
};

function normalizeKey(key: string) {
  const normalized = key.trim().replace(/^\/+/, '');

  if (!normalized) {
    throw new Error('Storage key is required');
  }

  return normalized;
}

async function listFilesRecursive(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const files = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);

      if (entry.isDirectory()) {
        return listFilesRecursive(fullPath);
      }

      return [fullPath];
    })
  );

  return files.flat();
}

export class LocalStorageAdapter implements StorageService {
  constructor(private readonly options: LocalStorageAdapterOptions) {}

  private resolveFilePath(key: string) {
    const normalizedKey = normalizeKey(key);
    const rootDir = path.resolve(this.options.rootDir);
    const filePath = path.resolve(rootDir, normalizedKey);

    if (!filePath.startsWith(`${rootDir}${path.sep}`) && filePath !== rootDir) {
      throw new Error('Storage key must stay within the storage root');
    }

    return {
      filePath,
      key: normalizedKey,
      rootDir
    };
  }

  async get(key: string) {
    const { filePath } = this.resolveFilePath(key);
    return fs.readFile(filePath);
  }

  async put(key: string, data: StoragePutInput, _options: StoragePutOptions = {}) {
    const { filePath, key: normalizedKey } = this.resolveFilePath(key);
    await fs.mkdir(path.dirname(filePath), { recursive: true });
    await fs.writeFile(filePath, Buffer.from(data));

    return {
      key: normalizedKey,
      publicUrl: this.getPublicUrl(normalizedKey)
    };
  }

  async delete(key: string) {
    const { filePath } = this.resolveFilePath(key);
    await fs.rm(filePath, { force: true });
  }

  getPublicUrl(key: string) {
    if (!this.options.publicBasePath) {
      return null;
    }

    return `${this.options.publicBasePath.replace(/\/+$/, '')}/${normalizeKey(key)}`;
  }

  async list(prefix: string) {
    const normalizedPrefix = prefix.trim().replace(/^\/+/, '');
    const rootDir = path.resolve(this.options.rootDir);
    const prefixDir = normalizedPrefix
      ? path.resolve(rootDir, normalizedPrefix)
      : rootDir;

    try {
      const stats = await fs.stat(prefixDir);

      if (!stats.isDirectory()) {
        return [] as StorageListItem[];
      }
    } catch (error) {
      if (error instanceof Error && 'code' in error && error.code === 'ENOENT') {
        return [] as StorageListItem[];
      }

      throw error;
    }

    const files = await listFilesRecursive(prefixDir);

    return Promise.all(
      files.map(async (filePath) => {
        const stats = await fs.stat(filePath);
        const key = path.relative(rootDir, filePath).split(path.sep).join('/');

        return {
          key,
          publicUrl: this.getPublicUrl(key),
          sizeBytes: stats.size
        } satisfies StorageListItem;
      })
    );
  }

  async healthCheck(): Promise<StorageHealthResult> {
    const rootDir = path.resolve(this.options.rootDir);
    const parentDir = path.dirname(rootDir);

    try {
      await fs.access(parentDir);

      return {
        status: 'pass',
        details: {
          provider: 'local',
          rootDir
        }
      };
    } catch (error) {
      return {
        status: 'fail',
        error: error instanceof Error ? error.message : 'Local storage unavailable',
        details: {
          provider: 'local',
          rootDir
        }
      };
    }
  }

  getProviderName() {
    return 'local' as const;
  }

  getRootDescriptor() {
    return path.resolve(this.options.rootDir);
  }
}
