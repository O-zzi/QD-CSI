import { createClient } from '@supabase/supabase-js';
import { logger } from './logger';

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

let supabaseClient: ReturnType<typeof createClient> | null = null;

export function getSupabaseClient() {
  if (!supabaseUrl || !supabaseServiceKey) {
    logger.warn('Supabase credentials not configured - file uploads will use local storage');
    return null;
  }
  
  if (!supabaseClient) {
    supabaseClient = createClient(supabaseUrl, supabaseServiceKey);
  }
  
  return supabaseClient;
}

export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseServiceKey);
}

export async function uploadToSupabase(
  buffer: Buffer,
  filename: string,
  bucket: string = 'uploads',
  contentType: string = 'image/jpeg'
): Promise<string | null> {
  const client = getSupabaseClient();
  
  if (!client) {
    return null;
  }
  
  try {
    const filePath = `${Date.now()}-${filename}`;
    
    const { data, error } = await client.storage
      .from(bucket)
      .upload(filePath, buffer, {
        contentType,
        cacheControl: '3600',
        upsert: false
      });
    
    if (error) {
      logger.error('Supabase upload error:', error);
      return null;
    }
    
    const { data: urlData } = client.storage
      .from(bucket)
      .getPublicUrl(data.path);
    
    return urlData.publicUrl;
  } catch (error) {
    logger.error('Supabase upload exception:', error);
    return null;
  }
}

export async function deleteFromSupabase(
  fileUrl: string,
  bucket: string = 'uploads'
): Promise<boolean> {
  const client = getSupabaseClient();
  
  if (!client || !fileUrl.includes('supabase')) {
    return false;
  }
  
  try {
    const urlParts = fileUrl.split('/');
    const filename = urlParts[urlParts.length - 1];
    
    const { error } = await client.storage
      .from(bucket)
      .remove([filename]);
    
    if (error) {
      logger.error('Supabase delete error:', error);
      return false;
    }
    
    return true;
  } catch (error) {
    logger.error('Supabase delete exception:', error);
    return false;
  }
}

export async function ensureBucketExists(bucketName: string = 'uploads'): Promise<boolean> {
  const client = getSupabaseClient();
  
  if (!client) {
    return false;
  }
  
  try {
    const { data: buckets } = await client.storage.listBuckets();
    const bucketExists = buckets?.some(b => b.name === bucketName);
    
    if (!bucketExists) {
      const { error } = await client.storage.createBucket(bucketName, {
        public: true,
        fileSizeLimit: 10485760
      });
      
      if (error && !error.message.includes('already exists')) {
        logger.error('Failed to create bucket:', error);
        return false;
      }
    }
    
    return true;
  } catch (error) {
    logger.error('Bucket check/creation failed:', error);
    return false;
  }
}
