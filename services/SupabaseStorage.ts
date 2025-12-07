import { createClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

// Supabase configuration from environment variables
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || 'https://wmzrwablpeueiaokhrqt.supabase.co';
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6IndtenJ3YWJscGV1ZWlhb2tocnF0Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzI5NTY5ODAsImV4cCI6MjA0ODUzMjk4MH0.KSHCqIRB2f9Fd-AxKyrzSRpC8l1wGIxPxXg7H_EpPhQ';

if (!SUPABASE_ANON_KEY || SUPABASE_ANON_KEY === '') {
  console.warn('⚠️ SUPABASE_ANON_KEY not configured in app.config.js extra');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY || 'placeholder-key');

interface UploadResult {
  success: boolean;
  url?: string;
  error?: string;
}

class SupabaseStorage {
  /**
   * Upload resume/document to Supabase Storage
   * @param fileUri - Local file URI from DocumentPicker
   * @param groomerId - Groomer ID for unique filename
   * @param fileName - Original filename
   */
  async uploadResume(
    fileUri: string, 
    groomerId: number, 
    fileName: string
  ): Promise<UploadResult> {
    try {
      console.log('📤 Starting resume upload to Supabase...');
      console.log('   File URI:', fileUri);
      console.log('   Groomer ID:', groomerId);
      console.log('   File Name:', fileName);

      // Read file as base64
      const fileData = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64',
      });

      // Convert base64 to blob
      const response = await fetch(`data:application/octet-stream;base64,${fileData}`);
      const blob = await response.blob();

      // Generate unique filename
      const timestamp = Date.now();
      const extension = fileName.split('.').pop() || 'pdf';
      const uniqueFileName = `resumes/${groomerId}_${timestamp}.${extension}`;

      console.log('📝 Uploading to path:', uniqueFileName);

      // Upload to Supabase Storage bucket
      const { data, error } = await supabase.storage
        .from('groomer-documents') // Bucket name - create this in Supabase dashboard
        .upload(uniqueFileName, blob, {
          contentType: this.getContentType(extension),
          cacheControl: '3600',
          upsert: false, // Don't overwrite existing files
        });

      if (error) {
        console.error('❌ Supabase upload error:', error);
        throw error;
      }

      // Get public URL
      const { data: publicUrlData } = supabase.storage
        .from('groomer-documents')
        .getPublicUrl(uniqueFileName);

      const publicUrl = publicUrlData.publicUrl;

      console.log('✅ Resume uploaded successfully!');
      console.log('   Public URL:', publicUrl);

      return {
        success: true,
        url: publicUrl,
      };
    } catch (error: any) {
      console.error('❌ Resume upload failed:', error);
      return {
        success: false,
        error: error.message || 'Failed to upload resume',
      };
    }
  }

  /**
   * Upload identity document or driving license to Supabase Storage
   * @param fileUri - Local file URI from DocumentPicker
   * @param groomerId - Groomer ID for unique filename
   * @param fileName - Original filename
   * @param documentType - Type of document: 'identity' or 'license'
   */
  async uploadDocument(
    fileUri: string, 
    groomerId: number, 
    fileName: string,
    documentType: 'identity' | 'license'
  ): Promise<UploadResult> {
    try {
      console.log(`📤 Starting ${documentType} document upload to Supabase...`);
      console.log('   File URI:', fileUri);
      console.log('   Groomer ID:', groomerId);
      console.log('   File Name:', fileName);

      // Read file as base64
      const fileData = await FileSystem.readAsStringAsync(fileUri, {
        encoding: 'base64',
      });

      // Convert base64 to blob
      const response = await fetch(`data:application/octet-stream;base64,${fileData}`);
      const blob = await response.blob();

      // Generate unique filename
      const timestamp = Date.now();
      const extension = fileName.split('.').pop() || 'jpg';
      const uniqueFileName = `${documentType}_${groomerId}_${timestamp}.${extension}`;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from('groomer-documents')
        .upload(`${documentType}s/${uniqueFileName}`, blob, {
          contentType: this.getContentType(extension),
          upsert: true, // Replace existing file if same name
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('groomer-documents')
        .getPublicUrl(`${documentType}s/${uniqueFileName}`);

      console.log(`✅ ${documentType} document uploaded successfully:`, publicUrl);

      return {
        success: true,
        url: publicUrl,
      };
    } catch (error: any) {
      console.error(`❌ ${documentType} document upload failed:`, error);
      return {
        success: false,
        error: error.message || `Failed to upload ${documentType} document`,
      };
    }
  }

  /**
   * Delete resume from Supabase Storage
   */
  async deleteResume(fileUrl: string): Promise<boolean> {
    try {
      // Extract filename from URL
      const filename = fileUrl.split('/').pop();
      if (!filename) return false;

      const { error } = await supabase.storage
        .from('groomer-documents')
        .remove([`resumes/${filename}`]);

      if (error) throw error;
      
      console.log('✅ Resume deleted:', filename);
      return true;
    } catch (error) {
      console.error('❌ Failed to delete resume:', error);
      return false;
    }
  }

  /**
   * Get content type based on file extension
   */
  private getContentType(extension: string): string {
    const contentTypes: { [key: string]: string } = {
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
    };
    return contentTypes[extension.toLowerCase()] || 'application/octet-stream';
  }

  /**
   * Check if Storage bucket exists and is accessible
   */
  async testConnection(): Promise<boolean> {
    try {
      const { data, error } = await supabase.storage
        .from('groomer-documents')
        .list('', { limit: 1 });

      if (error) {
        console.error('❌ Supabase Storage connection failed:', error);
        return false;
      }

      console.log('✅ Supabase Storage connected successfully');
      return true;
    } catch (error) {
      console.error('❌ Supabase Storage test failed:', error);
      return false;
    }
  }
}

export default new SupabaseStorage();
