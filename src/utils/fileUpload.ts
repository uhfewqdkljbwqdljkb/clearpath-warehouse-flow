import { supabase } from '@/integrations/supabase/client';

export const validateFile = (file: File, maxSizeMB: number = 10, allowedTypes: string[] = ['application/pdf']): { valid: boolean; error?: string } => {
  // Check file type
  if (!allowedTypes.includes(file.type)) {
    return {
      valid: false,
      error: `Invalid file type. Only ${allowedTypes.join(', ')} files are allowed.`
    };
  }

  // Check file size
  const maxSizeBytes = maxSizeMB * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    return {
      valid: false,
      error: `File size exceeds ${maxSizeMB}MB limit.`
    };
  }

  return { valid: true };
};

export const generateUniqueFilename = (originalFilename: string): string => {
  const timestamp = Date.now();
  const randomString = Math.random().toString(36).substring(2, 15);
  const extension = originalFilename.split('.').pop();
  return `${timestamp}-${randomString}.${extension}`;
};

export const uploadContractDocument = async (
  file: File,
  companyId: string
): Promise<{ success: boolean; url?: string; error?: string }> => {
  try {
    // Validate file
    const validation = validateFile(file);
    if (!validation.valid) {
      return { success: false, error: validation.error };
    }

    // Generate unique filename
    const uniqueFilename = generateUniqueFilename(file.name);
    const filePath = `${companyId}/${uniqueFilename}`;

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('contract-documents')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      });

    if (error) {
      console.error('Upload error:', error);
      return { success: false, error: error.message };
    }

    // Get the public URL (or signed URL for private buckets)
    const { data: { publicUrl } } = supabase.storage
      .from('contract-documents')
      .getPublicUrl(filePath);

    return { success: true, url: publicUrl };
  } catch (error: any) {
    console.error('Upload error:', error);
    return { success: false, error: error.message || 'Failed to upload file' };
  }
};
