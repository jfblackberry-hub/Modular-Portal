import fs from 'node:fs/promises';
import path from 'node:path';

const defaultStorageDirectory = path.resolve(
  process.cwd(),
  process.env.LOCAL_STORAGE_DIR ?? process.env.STORAGE_DIR ?? 'storage'
);

export type StorageOptions = {
  storageDir?: string;
};

function resolveStorageDirectory(options: StorageOptions = {}) {
  return path.resolve(options.storageDir ?? defaultStorageDirectory);
}

function resolveFilePath(key: string, options: StorageOptions = {}) {
  const normalizedKey = key.trim().replace(/^\/+/, '');

  if (!normalizedKey) {
    throw new Error('Storage key is required');
  }

  const storageDir = resolveStorageDirectory(options);
  const filePath = path.resolve(storageDir, normalizedKey);

  if (!filePath.startsWith(`${storageDir}${path.sep}`) && filePath !== storageDir) {
    throw new Error('Storage key must stay within the storage directory');
  }

  return {
    filePath,
    storageDir
  };
}

export async function saveFile(
  buffer: Buffer | Uint8Array,
  key: string,
  options: StorageOptions = {}
) {
  const { filePath } = resolveFilePath(key, options);
  await fs.mkdir(path.dirname(filePath), { recursive: true });
  await fs.writeFile(filePath, buffer);

  return filePath;
}

export async function readFile(key: string, options: StorageOptions = {}) {
  const { filePath } = resolveFilePath(key, options);
  return fs.readFile(filePath);
}

export function getStorageDirectory(options: StorageOptions = {}) {
  return resolveStorageDirectory(options);
}
