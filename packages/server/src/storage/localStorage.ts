import { getStorageService } from './service.js';

export type StorageOptions = {
  storageDir?: string;
};

export async function saveFile(
  buffer: Buffer | Uint8Array,
  key: string,
  _options: StorageOptions = {}
) {
  return getStorageService().put(key, buffer);
}

export async function readFile(key: string, _options: StorageOptions = {}) {
  return getStorageService().get(key);
}

export function getStorageDirectory(_options: StorageOptions = {}) {
  return getStorageService().getRootDescriptor();
}
