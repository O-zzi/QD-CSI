export type {
  StorageUploadResult,
  StorageDeleteResult,
  StorageProviderConfig,
  UploadOptions,
  IStorageProvider,
  MirroredUploadResult,
  MirroredDeleteResult
} from './types';

export { SupabaseStorageAdapter } from './supabaseAdapter';
export { HostingerStorageAdapter } from './hostingerAdapter';
export { LocalStorageAdapter } from './localAdapter';
export { CompositeStorageService, getStorageService } from './compositeStorage';
export type { StorageMode } from './compositeStorage';
