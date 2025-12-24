import { promises as fs } from 'fs';
import path from 'path';
import { logger } from '../logger';
import { IStorageProvider, StorageUploadResult, StorageDeleteResult, UploadOptions } from './types';

export class LocalStorageAdapter implements IStorageProvider {
  name: 'local' = 'local';
  private uploadDir: string;
  private baseUrl: string;
  
  constructor() {
    this.uploadDir = process.env.LOCAL_UPLOAD_DIR || 'uploads';
    this.baseUrl = process.env.LOCAL_STORAGE_BASE_URL || '/uploads';
  }
  
  isConfigured(): boolean {
    return true;
  }
  
  async upload(buffer: Buffer, filename: string, options?: UploadOptions): Promise<StorageUploadResult> {
    const folder = options?.folder || '';
    
    try {
      const targetDir = folder 
        ? path.join(this.uploadDir, folder)
        : this.uploadDir;
      
      await fs.mkdir(targetDir, { recursive: true });
      
      const uniqueFilename = `${Date.now()}-${filename}`;
      const filePath = path.join(targetDir, uniqueFilename);
      
      await fs.writeFile(filePath, buffer);
      
      const relativePath = folder 
        ? `${folder}/${uniqueFilename}`
        : uniqueFilename;
      
      const publicUrl = `${this.baseUrl}/${relativePath}`;
      
      logger.info(`Successfully uploaded to local storage: ${filePath}`);
      
      return {
        success: true,
        url: publicUrl,
        provider: 'local'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Local storage upload exception:', error);
      return {
        success: false,
        url: null,
        provider: 'local',
        error: errorMessage
      };
    }
  }
  
  async delete(fileUrl: string): Promise<StorageDeleteResult> {
    try {
      const relativePath = fileUrl.replace(`${this.baseUrl}/`, '');
      const filePath = path.join(this.uploadDir, relativePath);
      
      await fs.unlink(filePath);
      
      logger.info(`Successfully deleted from local storage: ${filePath}`);
      
      return {
        success: true,
        provider: 'local'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      logger.error('Local storage delete exception:', error);
      return {
        success: false,
        provider: 'local',
        error: errorMessage
      };
    }
  }
  
  getPublicUrl(relativePath: string): string {
    return `${this.baseUrl}/${relativePath}`;
  }
}
