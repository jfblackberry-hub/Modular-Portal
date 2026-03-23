import path from 'node:path';

import { loadStorageConfig } from '@payer-portal/config';

import { LocalStorageAdapter } from './localStorageAdapter.js';
import { S3StorageAdapter } from './s3StorageAdapter.js';
import type { StorageService } from './types.js';

type StorageProfile = 'backup' | 'default' | 'public-assets';

function resolveRootDir(profile: StorageProfile, storageConfig: ReturnType<typeof loadStorageConfig>) {
  switch (profile) {
    case 'public-assets':
      return path.resolve(process.cwd(), storageConfig.localPublicAssetDir);
    case 'backup':
      return path.resolve(process.cwd(), storageConfig.localBackupDir);
    case 'default':
    default:
      return path.resolve(process.cwd(), storageConfig.localStorageDir);
  }
}

function resolvePublicBasePath(profile: StorageProfile, storageConfig: ReturnType<typeof loadStorageConfig>) {
  if (profile !== 'public-assets') {
    return undefined;
  }

  return storageConfig.localPublicAssetBasePath;
}

function resolvePrefix(profile: StorageProfile) {
  switch (profile) {
    case 'public-assets':
      return 'public-assets';
    case 'backup':
      return 'backups';
    case 'default':
    default:
      return undefined;
  }
}

export function createStorageService(profile: StorageProfile = 'default'): StorageService {
  const storageConfig = loadStorageConfig();

  if (storageConfig.provider === 's3') {
    return new S3StorageAdapter({
      bucket: storageConfig.bucket,
      region: storageConfig.region,
      publicBaseUrl:
        profile === 'public-assets' && storageConfig.bucket && storageConfig.region
          ? `https://${storageConfig.bucket}.s3.${storageConfig.region}.amazonaws.com/${resolvePrefix(profile) ?? ''}`.replace(/\/+$/, '')
          : undefined
    });
  }

  return new LocalStorageAdapter({
    rootDir: resolveRootDir(profile, storageConfig),
    publicBasePath: resolvePublicBasePath(profile, storageConfig)
  });
}

let defaultStorageService: StorageService | null = null;
let publicAssetStorageService: StorageService | null = null;
let backupStorageService: StorageService | null = null;

export function getStorageService() {
  defaultStorageService ??= createStorageService('default');
  return defaultStorageService;
}

export function getPublicAssetStorageService() {
  publicAssetStorageService ??= createStorageService('public-assets');
  return publicAssetStorageService;
}

export function getBackupStorageService() {
  backupStorageService ??= createStorageService('backup');
  return backupStorageService;
}
