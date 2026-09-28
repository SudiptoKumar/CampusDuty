import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useUpdateProfile } from './useProfile';
import { useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';

export function useAvatarUpload() {
  const [isUploading, setIsUploading] = useState(false);
  const updateProfile = useUpdateProfile();
  const queryClient = useQueryClient();

  const uploadAvatar = async (fileOrBlob: File | Blob) => {
    let objectUrl: string | null = null;
    
    try {
      setIsUploading(true);
      console.log('[Avatar Upload] Starting upload, blob size:', fileOrBlob.size);
      
      // Validate file type for File objects
      if (fileOrBlob instanceof File && !fileOrBlob.type.startsWith('image/')) {
        throw new Error('Please select an image file');
      }
      
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      
      console.log('[Avatar Upload] User authenticated:', user.id);
      
      // Blob from ImageCropperDialog is already compressed to <200KB JPEG
      // Skip redundant compression
      const uploadBlob = fileOrBlob;
      console.log('[Avatar Upload] Using blob directly, size:', uploadBlob.size);
      
      // Create unique file path: userId/timestamp.jpg
      const fileName = `${user.id}/${Date.now()}.jpg`;
      console.log('[Avatar Upload] Uploading to:', fileName);
      
      // Upload to storage
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from('avatars')
        .upload(fileName, uploadBlob, {
          contentType: 'image/jpeg',
          cacheControl: '3600',
          upsert: true,
        });
      
      if (uploadError) {
        console.error('[Avatar Upload] Storage upload failed:', uploadError);
        throw uploadError;
      }
      
      console.log('[Avatar Upload] Upload successful:', uploadData);
      
      // Get public URL with cache buster
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(fileName);
      
      // Add cache buster to force refresh
      const urlWithCacheBuster = `${publicUrl}?t=${Date.now()}`;
      console.log('[Avatar Upload] Public URL:', urlWithCacheBuster);
      
      // Update profile with new avatar URL
      await updateProfile.mutateAsync({ avatar_url: urlWithCacheBuster });
      console.log('[Avatar Upload] Profile updated with new avatar URL');
      
      // Force refetch profile to ensure UI updates
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.refetchQueries({ queryKey: ['profile'] });
      
      toast.success('Profile photo updated!');
      return urlWithCacheBuster;
    } catch (error: any) {
      console.error('[Avatar Upload] Error:', error);
      toast.error(error.message || 'Failed to upload photo');
      throw error;
    } finally {
      // Clean up object URL if created
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      setIsUploading(false);
    }
  };

  const removeAvatar = async () => {
    try {
      setIsUploading(true);
      await updateProfile.mutateAsync({ avatar_url: null });
      
      // Force refetch profile
      await queryClient.invalidateQueries({ queryKey: ['profile'] });
      await queryClient.refetchQueries({ queryKey: ['profile'] });
      
      toast.success('Profile photo removed');
    } catch (error: any) {
      console.error('[Avatar Remove] Error:', error);
      toast.error('Failed to remove photo');
    } finally {
      setIsUploading(false);
    }
  };

  return {
    uploadAvatar,
    removeAvatar,
    isUploading,
  };
}
