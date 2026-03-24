import type {
  StorageHealthResult,
  StoragePutInput,
  StoragePutOptions,
  StorageService
} from './types.js';

type S3StorageAdapterOptions = {
  bucket?: string;
  publicBaseUrl?: string;
  region?: string;
};

function normalizeKey(key: string) {
  const normalized = key.trim().replace(/^\/+/, '');

  if (!normalized) {
    throw new Error('Storage key is required');
  }

  return normalized;
}

function getS3PublicBaseUrl(options: S3StorageAdapterOptions) {
  if (options.publicBaseUrl) {
    return options.publicBaseUrl.replace(/\/+$/, '');
  }

  if (!options.bucket || !options.region) {
    return null;
  }

  return `https://${options.bucket}.s3.${options.region}.amazonaws.com`;
}

export class S3StorageAdapter implements StorageService {
  constructor(private readonly options: S3StorageAdapterOptions) {}

  private notImplemented(message: string): never {
    throw new Error(message);
  }

  async get(_key: string) {
    return this.notImplemented('S3 storage adapter is not wired to an SDK yet.');
  }

  async put(
    key: string,
    _data: StoragePutInput,
    _options: StoragePutOptions = {}
  ) {
    const normalizedKey = normalizeKey(key);

    return this.notImplemented(
      `S3 storage adapter is not wired to an SDK yet. Unable to write ${normalizedKey}.`
    );
  }

  async delete(key: string) {
    const normalizedKey = normalizeKey(key);

    return this.notImplemented(
      `S3 storage adapter is not wired to an SDK yet. Unable to delete ${normalizedKey}.`
    );
  }

  getPublicUrl(key: string) {
    const baseUrl = getS3PublicBaseUrl(this.options);

    if (!baseUrl) {
      return null;
    }

    return `${baseUrl}/${normalizeKey(key)}`;
  }

  async list(_prefix: string) {
    return this.notImplemented('S3 storage adapter is not wired to an SDK yet.');
  }

  async healthCheck(): Promise<StorageHealthResult> {
    if (!this.options.bucket || !this.options.region) {
      return {
        status: 'not_configured',
        error: 'S3 bucket and region must be configured when STORAGE_PROVIDER=s3.',
        details: {
          provider: 's3',
          bucket: this.options.bucket ?? null,
          region: this.options.region ?? null
        }
      };
    }

    return {
      status: 'not_configured',
      error: 'S3 storage adapter configuration is present, but SDK wiring is still pending.',
      details: {
        provider: 's3',
        bucket: this.options.bucket,
        region: this.options.region,
        sdk: 'stub'
      }
    };
  }

  getProviderName() {
    return 's3' as const;
  }

  getRootDescriptor() {
    return this.options.bucket
      ? `s3://${this.options.bucket}`
      : 's3://<unconfigured>';
  }
}
