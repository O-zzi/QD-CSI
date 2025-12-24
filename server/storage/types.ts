export interface StorageUploadResult {
  success: boolean;
  url: string | null;
  provider: 'supabase' | 'hostinger' | 'local';
  error?: string;
}

export interface StorageDeleteResult {
  success: boolean;
  provider: 'supabase' | 'hostinger' | 'local';
  error?: string;
}

export interface StorageProviderConfig {
  name: 'supabase' | 'hostinger' | 'local';
  enabled: boolean;
  priority: number;
}

export interface UploadOptions {
  bucket?: string;
  contentType?: string;
  folder?: string;
}

export interface IStorageProvider {
  name: 'supabase' | 'hostinger' | 'local';
  isConfigured(): boolean;
  upload(buffer: Buffer, filename: string, options?: UploadOptions): Promise<StorageUploadResult>;
  delete(fileUrl: string, bucket?: string): Promise<StorageDeleteResult>;
  getPublicUrl(path: string, bucket?: string): string;
}

export interface MirroredUploadResult {
  success: boolean;
  urls: {
    supabase?: string | null;
    hostinger?: string | null;
    local?: string | null;
  };
  primaryUrl: string | null;
  errors: string[];
}

export interface MirroredDeleteResult {
  success: boolean;
  deletedFrom: ('supabase' | 'hostinger' | 'local')[];
  errors: string[];
}
