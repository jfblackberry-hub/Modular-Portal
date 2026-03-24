export type StoragePutInput = Buffer | Uint8Array;

export type StoragePutOptions = {
  contentType?: string;
};

export type StorageListItem = {
  key: string;
  publicUrl: string | null;
  sizeBytes?: number;
};

export type StorageHealthStatus = 'fail' | 'not_configured' | 'pass';

export type StorageHealthResult = {
  details?: Record<string, unknown>;
  error?: string;
  status: StorageHealthStatus;
};

export interface StorageService {
  delete(key: string): Promise<void>;
  get(key: string): Promise<Buffer>;
  getPublicUrl(key: string): string | null;
  getProviderName(): 'local' | 's3';
  getRootDescriptor(): string;
  healthCheck(): Promise<StorageHealthResult>;
  list?(prefix: string): Promise<StorageListItem[]>;
  put(key: string, data: StoragePutInput, options?: StoragePutOptions): Promise<{
    key: string;
    publicUrl: string | null;
  }>;
}
