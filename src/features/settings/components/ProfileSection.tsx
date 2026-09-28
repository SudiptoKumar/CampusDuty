import { useRef, useState, useEffect } from 'react';
import { useProfile, useUpdateProfile } from '@/hooks/useProfile';
import { useAvatarUpload } from '@/hooks/useAvatarUpload';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Camera, Loader2, Trash2, Instagram, Linkedin, Github, Twitter } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Lightbulb } from 'lucide-react';

interface SocialLinks {
  instagram?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
}

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, placeholder: 'username' },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, placeholder: 'username or profile URL' },
  { key: 'github', label: 'GitHub', icon: Github, placeholder: 'username' },
  { key: 'twitter', label: 'X (Twitter)', icon: Twitter, placeholder: 'username' },
] as const;

export function ProfileSection() {
  const { data: profile } = useProfile();
  const updateProfile = useUpdateProfile();
  const { uploadAvatar, removeAvatar, isUploading } = useAvatarUpload();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [localBio, setLocalBio] = useState(profile?.bio || '');
  const [localHeadline, setLocalHeadline] = useState((profile as any)?.headline || '');
  
  const [socialLinks, setSocialLinks] = useState<SocialLinks>({});
  
  useEffect(() => {
    if (profile?.bio !== undefined) {
      setLocalBio(profile.bio || '');
    }
    if (profile?.social_links) {
      setSocialLinks(profile.social_links as SocialLinks);
    }
    if ((profile as any)?.headline !== undefined) setLocalHeadline((profile as any).headline || '');
  }, [profile?.bio, profile?.social_links, (profile as any)?.headline]);
  
  if (!profile) return null;
  
  const initials = profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U';
  
  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      await uploadAvatar(file);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };
  
  const handleUpdate = (updates: Record<string, any>) => {
    updateProfile.mutate(updates);
  };
  
  const handleSocialLinkChange = (key: string, value: string) => {
    const newLinks = { ...socialLinks, [key]: value.trim() || undefined };
    // Clean up empty values
    Object.keys(newLinks).forEach(k => {
      if (!newLinks[k as keyof SocialLinks]) delete newLinks[k as keyof SocialLinks];
    });
    setSocialLinks(newLinks);
  };
  
  const handleSocialLinksBlur = () => {
    handleUpdate({ social_links: Object.keys(socialLinks).length > 0 ? socialLinks : null });
  };

  return (
    <section className="space-y-4">
      <h2 className="text-lg font-semibold">Profile</h2>
      <div className="surface-card p-4 space-y-6">
        {/* Avatar Upload */}
        <div className="flex items-center gap-4">
          <div className="relative group">
            <Avatar className="w-20 h-20 border-2 border-border">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">
                {initials}
              </AvatarFallback>
            </Avatar>
            
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className={cn(
                'absolute inset-0 rounded-full flex items-center justify-center',
                'bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity',
                'focus:opacity-100 focus:outline-none focus:ring-2 focus:ring-primary',
                isUploading && 'opacity-100'
              )}
            >
              {isUploading ? (
                <Loader2 className="w-6 h-6 text-white animate-spin" />
              ) : (
                <Camera className="w-6 h-6 text-white" />
              )}
            </button>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="hidden"
            />
          </div>
          
          <div className="flex-1 space-y-1">
            <p className="font-medium">{profile.name}</p>
            <p className="text-sm text-muted-foreground">
              {profile.avatar_url ? 'Tap photo to change' : 'Add a profile photo'}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="text-xs"
              >
                <Camera className="w-3 h-3 mr-1.5" />
                Upload
              </Button>
              {profile.avatar_url && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeAvatar}
                  disabled={isUploading}
                  className="text-xs text-destructive hover:text-destructive"
                >
                  <Trash2 className="w-3 h-3 mr-1.5" />
                  Remove
                </Button>
              )}
            </div>
          </div>
        </div>
        
        {/* Name */}
        <div className="space-y-2">
          <Label htmlFor="userName">Display Name</Label>
          <Input
            id="userName"
            defaultValue={profile.name}
            onBlur={(e) => handleUpdate({ name: e.target.value })}
            placeholder="Enter your name"
            maxLength={50}
          />
        </div>
        
        {/* Username */}
        <div className="space-y-2">
          <Label htmlFor="username">Username</Label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">@</span>
            <Input
              id="username"
              defaultValue={profile.username || ''}
              onBlur={(e) => {
                const value = e.target.value.trim().toLowerCase().replace(/[^a-z0-9_]/g, '');
                handleUpdate({ username: value || null });
                e.target.value = value;
              }}
              placeholder="username"
              className="pl-8"
              maxLength={30}
            />
          </div>
          <p className="text-xs text-muted-foreground">
            Lowercase letters, numbers, and underscores only
          </p>
        </div>
        
        {/* Bio */}
        <div className="space-y-2">
          <Label htmlFor="bio">Bio</Label>
          <Textarea
            id="bio"
            value={localBio}
            onChange={(e) => setLocalBio(e.target.value)}
            onBlur={() => handleUpdate({ bio: localBio || null })}
            placeholder="Tell us about yourself..."
            rows={3}
            maxLength={160}
            className="resize-none"
          />
          <p className="text-xs text-muted-foreground text-right">
            {localBio.length}/160
          </p>
        </div>
        
        {/* Headline */}
        <div className="space-y-2">
          <Label htmlFor="settingsHeadline" className="flex items-center gap-1.5">
            <Lightbulb className="w-3.5 h-3.5" />
            Headline
          </Label>
          <Input
            id="settingsHeadline"
            value={localHeadline}
            onChange={(e) => setLocalHeadline(e.target.value)}
            onBlur={() => handleUpdate({ headline: localHeadline || null })}
            placeholder="e.g. Business Student | Tech Enthusiast"
            maxLength={120}
          />
          <p className="text-xs text-muted-foreground text-right">{localHeadline.length}/120</p>
        </div>
        
        
        {/* Social Links */}
        <div className="space-y-3">
          <Label>Social Links</Label>
          <p className="text-xs text-muted-foreground">
            Add your social profiles to display on your Campus ID card
          </p>
          <div className="space-y-3">
            {SOCIAL_PLATFORMS.map((platform) => {
              const Icon = platform.icon;
              return (
                <div key={platform.key} className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0">
                    <Icon className="w-4 h-4 text-muted-foreground" />
                  </div>
                  <Input
                    value={socialLinks[platform.key as keyof SocialLinks] || ''}
                    onChange={(e) => handleSocialLinkChange(platform.key, e.target.value)}
                    onBlur={handleSocialLinksBlur}
                    placeholder={platform.placeholder}
                    className="flex-1"
                    maxLength={100}
                  />
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
