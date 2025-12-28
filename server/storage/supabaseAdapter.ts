import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { logger } from '../logger';
import { IStorageProvider, StorageUploadResult, StorageDeleteResult, UploadOptions } from './types';

export class SupabaseStorageAdapter implements IStorageProvider {
  name: 'supabase' = 'supabase';
  private client: SupabaseClient | null = null;
  private supabaseUrl: string | undefined;
  
  constructor() {
    this.supabaseUrl = process.env.SUPABASE_URL;
    // Support both SUPABASE_SERVICE_KEY and SUPABASE_SERVICE_ROLE_KEY for flexibility
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (this.supabaseUrl && supabaseServiceKey) {
      this.client = createClient(this.supabaseUrl, supabaseServiceKey);
      logger.info('Supabase storage adapter initialized successfully');
    } else {
      logger.warn('Supabase storage not configured - missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
    }
  }
  
  isConfigured(): boolean {
    return this.client !== null;
  }
  
  async upload(buffer: Buffer, filename: string, options?: UploadOptions): Promise<StorageUploadResult> {
    if (!this.client) {
      return {
        success: false,
        url: null,
        provider: 'supabase',
        error: 'Supabase not configured'
      };
    }
    
    const bucket = options?.bucket || 'uploads';
    const contentType = options?.contentType || 'application/octet-stream';
    const folder = options?.folder || '';
    
    try {
      await this.ensureBucketExists(bucket);
      
      const filePath = folder 
        ? `${folder}/${Date.now()}-${filename}`
        : `${Date.now()}-${filename}`;
      
      const { data, error } = await this.client.storage
        .from(bucket)
        .upload(filePath, buffer, {
          contentType,
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) {
        logger.error('Supabase upload error:', error);
        return {
          success: false,
          url: null,
          provider: 'supabase',
          error: error.message
        };
      }
      
      const publicUrl = this.getPublicUrl(data.path, bucket);
      
      logger.info(`Successfully uploaded to Supabase: ${filePath}`);
      
      return {
        success: true,
        url: publicUrl,
        provider: 'supabase'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Supabase upload exception:', error);
      return {
        success: false,
        url: null,
        provider: 'supabase',
        error: errorMessage
      };
    }
  }
  
  async delete(fileUrl: string, bucket: string = 'uploads'): Promise<StorageDeleteResult> {
    if (!this.client) {
      return {
        success: false,
        provider: 'supabase',
        error: 'Supabase not configured'
      };
    }
    
    if (!fileUrl.includes('supabase')) {
      return {
        success: false,
        provider: 'supabase',
        error: 'Not a Supabase URL'
      };
    }
    
    try {
      const url = new URL(fileUrl);
      const pathParts = url.pathname.split('/');
      const bucketIndex = pathParts.indexOf('object') + 2;
      const filePath = pathParts.slice(bucketIndex + 1).join('/');
      
      if (!filePath) {
        return {
          success: false,
          provider: 'supabase',
          error: 'Could not extract file path from URL'
        };
      }
      
      const { error } = await this.client.storage
        .from(bucket)
        .remove([filePath]);
      
      if (error) {
        logger.error('Supabase delete error:', error);
        return {
          success: false,
          provider: 'supabase',
          error: error.message
        };
      }
      
      logger.info(`Successfully deleted from Supabase: ${filePath}`);
      
      return {
        success: true,
        provider: 'supabase'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Supabase delete exception:', error);
      return {
        success: false,
        provider: 'supabase',
        error: errorMessage
      };
    }
  }
  
  getPublicUrl(path: string, bucket: string = 'uploads'): string {
    if (!this.client || !this.supabaseUrl) {
      return '';
    }
    
    const { data } = this.client.storage
      .from(bucket)
      .getPublicUrl(path);
    
    return data.publicUrl;
  }
  
  private async ensureBucketExists(bucketName: string): Promise<boolean> {
    if (!this.client) {
      return false;
    }
    
    try {
      const { data: buckets } = await this.client.storage.listBuckets();
      const bucketExists = buckets?.some(b => b.name === bucketName);
      
      if (!bucketExists) {
        const { error } = await this.client.storage.createBucket(bucketName, {
          public: true,
          fileSizeLimit: 10485760
        });
        
        if (error && !error.message.includes('already exists')) {
          logger.error('Failed to create Supabase bucket:', error);
          return false;
        }
      }
      
      return true;
    } catch (error) {
      logger.error('Supabase bucket check/creation failed:', error);
      return false;
    }
  }
}
