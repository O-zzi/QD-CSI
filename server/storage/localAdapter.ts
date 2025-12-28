import { promises as fs } from 'fs';
import * as fsSync from 'fs';
import path from 'path';
import { logger } from '../logger';
import { IStorageProvider, StorageUploadResult, StorageDeleteResult, UploadOptions } from './types';

export class LocalStorageAdapter implements IStorageProvider {
  name: 'local' = 'local';
  private uploadDir: string;
  private baseUrl: string;
  private isWritable: boolean = false;
  
  constructor() {
    const envUploadDir = process.env.LOCAL_UPLOAD_DIR || 'uploads';
    this.uploadDir = path.isAbsolute(envUploadDir) 
      ? envUploadDir 
      : path.join(process.cwd(), envUploadDir);
    this.baseUrl = process.env.LOCAL_STORAGE_BASE_URL || '/uploads';
    
    // Test if directory is writable on initialization
    try {
      if (!fsSync.existsSync(this.uploadDir)) {
        fsSync.mkdirSync(this.uploadDir, { recursive: true });
      }
      const testFile = path.join(this.uploadDir, '.write-test');
      fsSync.writeFileSync(testFile, 'test');
      fsSync.unlinkSync(testFile);
      this.isWritable = true;
      logger.info(`Local storage adapter initialized: uploadDir=${this.uploadDir}, baseUrl=${this.baseUrl}, writable=true`);
    } catch (error) {
      this.isWritable = false;
      logger.warn(`Local storage not writable at ${this.uploadDir}:`, error);
    }
  }
  
  isConfigured(): boolean {
    return this.isWritable;
  }
  
  async ensureUploadDir(): Promise<void> {
    try {
      await fs.mkdir(this.uploadDir, { recursive: true });
      logger.info(`Upload directory ensured: ${this.uploadDir}`);
    } catch (error) {
      logger.error(`Failed to create upload directory ${this.uploadDir}:`, error);
      throw error;
    }
  }
  
  async upload(buffer: Buffer, filename: string, options?: UploadOptions): Promise<StorageUploadResult> {
    const folder = options?.folder || '';
    
    try {
      const targetDir = folder 
        ? path.join(this.uploadDir, folder)
        : this.uploadDir;
      
      logger.info(`Attempting to create directory: ${targetDir}`);
      await fs.mkdir(targetDir, { recursive: true });
      
      const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
      const uniqueFilename = `${Date.now()}-${sanitizedFilename}`;
      const filePath = path.join(targetDir, uniqueFilename);
      
      logger.info(`Writing file to: ${filePath} (size: ${buffer.length} bytes)`);
      await fs.writeFile(filePath, buffer);
      
      const relativePath = folder 
        ? `${folder}/${uniqueFilename}`
        : uniqueFilename;
      
      const publicUrl = `${this.baseUrl}/${relativePath}`;
      
      logger.info(`Successfully uploaded to local storage: ${filePath} -> ${publicUrl}`);
      
      return {
        success: true,
        url: publicUrl,
        provider: 'local'
      };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      const errorCode = (error as any)?.code || 'UNKNOWN';
      logger.error(`Local storage upload failed [${errorCode}]: ${errorMessage}`, { 
        folder, 
        filename, 
        uploadDir: this.uploadDir,
        error 
      });
      return {
        success: false,
        url: null,
        provider: 'local',
        error: `${errorCode}: ${errorMessage}`
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
