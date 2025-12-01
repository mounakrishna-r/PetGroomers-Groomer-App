import { createClient } from '@supabase/supabase-js';
import * as FileSystem from 'expo-file-system';
import Constants from 'expo-constants';

// Supabase configuration from environment variables
const SUPABASE_URL = Constants.expoConfig?.extra?.supabaseUrl || 'https://wmzrwablpeueiaokhrqt.supabase.co';
const SUPABASE_ANON_KEY = Constants.expoConfig?.extra?.supabaseAnonKey || '';

if (!SUPABASE_ANON_KEY) {
  console.error('⚠️ SUPABASE_ANON_KEY not found in environment variables');
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

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
