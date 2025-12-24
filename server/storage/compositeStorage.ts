import { logger } from '../logger';
import { 
  IStorageProvider, 
  MirroredUploadResult, 
  MirroredDeleteResult,
  UploadOptions 
} from './types';
import { SupabaseStorageAdapter } from './supabaseAdapter';
import { HostingerStorageAdapter } from './hostingerAdapter';
import { LocalStorageAdapter } from './localAdapter';

export type StorageMode = 'mirrored' | 'supabase-primary' | 'hostinger-primary' | 'local-only';

export class CompositeStorageService {
  private supabase: SupabaseStorageAdapter;
  private hostinger: HostingerStorageAdapter;
  private local: LocalStorageAdapter;
  private mode: StorageMode;
  
  constructor(mode?: StorageMode) {
    this.supabase = new SupabaseStorageAdapter();
    this.hostinger = new HostingerStorageAdapter();
    this.local = new LocalStorageAdapter();
    
    this.mode = mode || (process.env.STORAGE_MODE as StorageMode) || 'mirrored';
    
    logger.info(`Composite Storage Service initialized in "${this.mode}" mode`);
    logger.info(`Storage providers status:
      - Supabase: ${this.supabase.isConfigured() ? 'configured' : 'not configured'}
      - Hostinger: ${this.hostinger.isConfigured() ? 'configured' : 'not configured'}
      - Local: always available`);
  }
  
  async upload(buffer: Buffer, filename: string, options?: UploadOptions): Promise<MirroredUploadResult> {
    const errors: string[] = [];
    const urls: MirroredUploadResult['urls'] = {};
    
    switch (this.mode) {
      case 'mirrored':
        return this.mirroredUpload(buffer, filename, options);
        
      case 'supabase-primary':
        return this.primaryFallbackUpload(buffer, filename, 'supabase', options);
        
      case 'hostinger-primary':
        return this.primaryFallbackUpload(buffer, filename, 'hostinger', options);
        
      case 'local-only':
        const localResult = await this.local.upload(buffer, filename, options);
        return {
          success: localResult.success,
          urls: { local: localResult.url },
          primaryUrl: localResult.url,
          errors: localResult.error ? [localResult.error] : []
        };
        
      default:
        return this.mirroredUpload(buffer, filename, options);
    }
  }
  
  private async mirroredUpload(
    buffer: Buffer, 
    filename: string, 
    options?: UploadOptions
  ): Promise<MirroredUploadResult> {
    const errors: string[] = [];
    const urls: MirroredUploadResult['urls'] = {};
    
    const uploadPromises: Promise<void>[] = [];
    
    if (this.supabase.isConfigured()) {
      uploadPromises.push(
        this.supabase.upload(buffer, filename, options).then(result => {
          urls.supabase = result.url;
          if (!result.success && result.error) {
            errors.push(`Supabase: ${result.error}`);
          }
        })
      );
    }
    
    if (this.hostinger.isConfigured()) {
      uploadPromises.push(
        this.hostinger.upload(buffer, filename, options).then(result => {
          urls.hostinger = result.url;
          if (!result.success && result.error) {
            errors.push(`Hostinger: ${result.error}`);
          }
        })
      );
    }
    
    uploadPromises.push(
      this.local.upload(buffer, filename, options).then(result => {
        urls.local = result.url;
        if (!result.success && result.error) {
          errors.push(`Local: ${result.error}`);
        }
      })
    );
    
    await Promise.all(uploadPromises);
    
    const primaryUrl = urls.supabase || urls.hostinger || urls.local || null;
    const hasAtLeastOneSuccess = urls.supabase || urls.hostinger || urls.local;
    
    if (hasAtLeastOneSuccess) {
      logger.info(`Mirrored upload completed for ${filename}:
        - Supabase: ${urls.supabase ? 'success' : 'skipped/failed'}
        - Hostinger: ${urls.hostinger ? 'success' : 'skipped/failed'}
        - Local: ${urls.local ? 'success' : 'failed'}`);
    }
    
    return {
      success: !!hasAtLeastOneSuccess,
      urls,
      primaryUrl,
      errors
    };
  }
  
  private async primaryFallbackUpload(
    buffer: Buffer, 
    filename: string, 
    primary: 'supabase' | 'hostinger',
    options?: UploadOptions
  ): Promise<MirroredUploadResult> {
    const errors: string[] = [];
    const urls: MirroredUploadResult['urls'] = {};
    
    const primaryProvider = primary === 'supabase' ? this.supabase : this.hostinger;
    const fallbackProvider = primary === 'supabase' ? this.hostinger : this.supabase;
    
    if (primaryProvider.isConfigured()) {
      const result = await primaryProvider.upload(buffer, filename, options);
      if (result.success) {
        urls[primary] = result.url;
        
        const localResult = await this.local.upload(buffer, filename, options);
        urls.local = localResult.url;
        
        return {
          success: true,
          urls,
          primaryUrl: result.url,
          errors
        };
      } else if (result.error) {
        errors.push(`${primary}: ${result.error}`);
      }
    }
    
    const fallbackName = primary === 'supabase' ? 'hostinger' : 'supabase';
    if (fallbackProvider.isConfigured()) {
      const result = await fallbackProvider.upload(buffer, filename, options);
      if (result.success) {
        urls[fallbackName] = result.url;
        
        const localResult = await this.local.upload(buffer, filename, options);
        urls.local = localResult.url;
        
        return {
          success: true,
          urls,
          primaryUrl: result.url,
          errors
        };
      } else if (result.error) {
        errors.push(`${fallbackName}: ${result.error}`);
      }
    }
    
    const localResult = await this.local.upload(buffer, filename, options);
    urls.local = localResult.url;
    
    return {
      success: !!localResult.url,
      urls,
      primaryUrl: localResult.url,
      errors
    };
  }
  
  async delete(fileUrls: { 
    supabase?: string; 
    hostinger?: string; 
    local?: string 
  }): Promise<MirroredDeleteResult> {
    const errors: string[] = [];
    const deletedFrom: ('supabase' | 'hostinger' | 'local')[] = [];
    
    const deletePromises: Promise<void>[] = [];
    
    if (fileUrls.supabase && this.supabase.isConfigured()) {
      deletePromises.push(
        this.supabase.delete(fileUrls.supabase).then(result => {
          if (result.success) {
            deletedFrom.push('supabase');
          } else if (result.error) {
            errors.push(`Supabase: ${result.error}`);
          }
        })
      );
    }
    
    if (fileUrls.hostinger && this.hostinger.isConfigured()) {
      deletePromises.push(
        this.hostinger.delete(fileUrls.hostinger).then(result => {
          if (result.success) {
            deletedFrom.push('hostinger');
          } else if (result.error) {
            errors.push(`Hostinger: ${result.error}`);
          }
        })
      );
    }
    
    if (fileUrls.local) {
      deletePromises.push(
        this.local.delete(fileUrls.local).then(result => {
          if (result.success) {
            deletedFrom.push('local');
          } else if (result.error) {
            errors.push(`Local: ${result.error}`);
          }
        })
      );
    }
    
    await Promise.all(deletePromises);
    
    logger.info(`Mirrored delete completed: deleted from ${deletedFrom.join(', ') || 'none'}`);
    
    return {
      success: deletedFrom.length > 0,
      deletedFrom,
      errors
    };
  }
  
  async deleteByUrl(fileUrl: string): Promise<MirroredDeleteResult> {
    const errors: string[] = [];
    const deletedFrom: ('supabase' | 'hostinger' | 'local')[] = [];
    
    if (fileUrl.includes('supabase') && this.supabase.isConfigured()) {
      const result = await this.supabase.delete(fileUrl);
      if (result.success) {
        deletedFrom.push('supabase');
      } else if (result.error) {
        errors.push(`Supabase: ${result.error}`);
      }
    }
    
    if (process.env.HOSTINGER_STORAGE_URL && fileUrl.includes(process.env.HOSTINGER_STORAGE_URL)) {
      const result = await this.hostinger.delete(fileUrl);
      if (result.success) {
        deletedFrom.push('hostinger');
      } else if (result.error) {
        errors.push(`Hostinger: ${result.error}`);
      }
    }
    
    if (fileUrl.startsWith('/uploads')) {
      const result = await this.local.delete(fileUrl);
      if (result.success) {
        deletedFrom.push('local');
      } else if (result.error) {
        errors.push(`Local: ${result.error}`);
      }
    }
    
    return {
      success: deletedFrom.length > 0,
      deletedFrom,
      errors
    };
  }
  
  getStatus() {
    return {
      mode: this.mode,
      providers: {
        supabase: this.supabase.isConfigured(),
        hostinger: this.hostinger.isConfigured(),
        local: this.local.isConfigured()
      }
    };
  }
}

let storageServiceInstance: CompositeStorageService | null = null;

export function getStorageService(): CompositeStorageService {
  if (!storageServiceInstance) {
    storageServiceInstance = new CompositeStorageService();
  }
  return storageServiceInstance;
}
