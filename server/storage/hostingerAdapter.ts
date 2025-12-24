import { logger } from '../logger';
import { IStorageProvider, StorageUploadResult, StorageDeleteResult, UploadOptions } from './types';

export class HostingerStorageAdapter implements IStorageProvider {
  name: 'hostinger' = 'hostinger';
  private baseUrl: string | undefined;
  private apiKey: string | undefined;
  private apiEndpoint: string | undefined;
  
  constructor() {
    this.baseUrl = process.env.HOSTINGER_STORAGE_URL;
    this.apiKey = process.env.HOSTINGER_API_KEY;
    this.apiEndpoint = process.env.HOSTINGER_API_ENDPOINT;
  }
  
  isConfigured(): boolean {
    return !!(this.baseUrl && this.apiKey && this.apiEndpoint);
  }
  
  async upload(buffer: Buffer, filename: string, options?: UploadOptions): Promise<StorageUploadResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        url: null,
        provider: 'hostinger',
        error: 'Hostinger storage not configured. Please provide HOSTINGER_STORAGE_URL, HOSTINGER_API_KEY, and HOSTINGER_API_ENDPOINT environment variables.'
      };
    }
    
    const folder = options?.folder || 'uploads';
    const contentType = options?.contentType || 'application/octet-stream';
    
    try {
      const filePath = `${folder}/${Date.now()}-${filename}`;
      
      const formData = new FormData();
      formData.append('file', new Blob([buffer], { type: contentType }), filename);
      formData.append('path', filePath);
      
      const response = await fetch(`${this.apiEndpoint}/upload`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
        },
        body: formData
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Hostinger upload error:', errorText);
        return {
          success: false,
          url: null,
          provider: 'hostinger',
          error: `HTTP ${response.status}: ${errorText}`
        };
      }
      
      const result = await response.json();
      const publicUrl = result.url || `${this.baseUrl}/${filePath}`;
      
      logger.info(`Successfully uploaded to Hostinger: ${filePath}`);
      
      return {
        success: true,
        url: publicUrl,
        provider: 'hostinger'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Hostinger upload exception:', error);
      return {
        success: false,
        url: null,
        provider: 'hostinger',
        error: errorMessage
      };
    }
  }
  
  async delete(fileUrl: string): Promise<StorageDeleteResult> {
    if (!this.isConfigured()) {
      return {
        success: false,
        provider: 'hostinger',
        error: 'Hostinger storage not configured'
      };
    }
    
    if (!this.baseUrl || !fileUrl.includes(this.baseUrl)) {
      return {
        success: false,
        provider: 'hostinger',
        error: 'Not a Hostinger URL'
      };
    }
    
    try {
      const filePath = fileUrl.replace(`${this.baseUrl}/`, '');
      
      const response = await fetch(`${this.apiEndpoint}/delete`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ path: filePath })
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        logger.error('Hostinger delete error:', errorText);
        return {
          success: false,
          provider: 'hostinger',
          error: `HTTP ${response.status}: ${errorText}`
        };
      }
      
      logger.info(`Successfully deleted from Hostinger: ${filePath}`);
      
      return {
        success: true,
        provider: 'hostinger'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Hostinger delete exception:', error);
      return {
        success: false,
        provider: 'hostinger',
        error: errorMessage
      };
    }
  }
  
  getPublicUrl(path: string): string {
    if (!this.baseUrl) {
      return '';
    }
    return `${this.baseUrl}/${path}`;
  }
}
