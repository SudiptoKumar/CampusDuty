import { useState, useRef } from 'react';
import { Camera, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { ImageCropperDialog } from '@/components/shared/ImageCropperDialog';
import type { Database } from '@/integrations/supabase/types';

type Profile = Database['public']['Tables']['profiles']['Row'];

interface Props {
  profile: Profile;
  onNext: () => void;
}

export function WelcomeStep({ profile, onNext }: Props) {
  const { uploadAvatar, isUploading } = useAvatarUpload();
  const fileRef = useRef<HTMLInputElement>(null);
  const [cropSrc, setCropSrc] = useState<string | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setCropSrc(url);
    e.target.value = '';
  };

  const handleCropComplete = async (blob: Blob) => {
    await uploadAvatar(blob);
    setCropSrc(null);
  };

  return (
    <div className="text-center">
      <div className="text-4xl mb-3">👋</div>
      <h2 className="text-2xl font-bold mb-1">
        Welcome, {profile.name}!
      </h2>
      <p className="text-muted-foreground text-sm mb-8">
        Let's set up your profile in just a few steps
      </p>

      {/* Avatar upload */}
      <div className="flex flex-col items-center gap-4 mb-8">
        <div className="relative">
          <Avatar className="w-28 h-28 border-4 border-primary/20">
            <AvatarImage src={profile.avatar_url || undefined} />
            <AvatarFallback className="text-3xl bg-muted">
              <User className="w-10 h-10 text-muted-foreground" />
            </AvatarFallback>
          </Avatar>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={isUploading}
            className="absolute bottom-0 right-0 w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-transform"
          >
            <Camera className="w-5 h-5 text-primary-foreground" />
          </button>
        </div>
        <p className="text-xs text-muted-foreground">Tap to add a profile photo</p>
      </div>

      <input
        ref={fileRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFileChange}
      />

      <ImageCropperDialog
        open={!!cropSrc}
        onOpenChange={(open) => !open && setCropSrc(null)}
        imageSrc={cropSrc || ''}
        onCropComplete={handleCropComplete}
      />

      <Button 
        onClick={onNext} 
        className="w-full h-12 rounded-xl text-base font-semibold"
        style={{ 
          background: 'linear-gradient(135deg, hsl(var(--primary)) 0%, hsl(var(--accent-lavender)) 100%)',
        }}
      >
        Continue
      </Button>
    </div>
  );
}
