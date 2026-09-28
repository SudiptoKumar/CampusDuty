import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { BadgeCheck, Instagram, Linkedin, Github, Twitter, MessageCircle, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { MessageSheet } from '@/features/marketplace/components/MessageSheet';
import { useAuth } from '@/features/auth';
import type { AppRole } from '@/hooks/usePermission';

interface SocialLinks {
  instagram?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
}

interface PublicProfile {
  name: string;
  username: string | null;
  avatar_url: string | null;
  bio: string | null;
  headline: string | null;
  social_links: SocialLinks | null;
  faculty: string | null;
  semester: number | null;
  role: AppRole;
}

interface UserProfileSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  userId: string | null;
}

const SOCIAL_PLATFORMS = [
  { key: 'instagram', label: 'Instagram', icon: Instagram, getUrl: (v: string) => `https://instagram.com/${v.replace('@', '')}` },
  { key: 'linkedin', label: 'LinkedIn', icon: Linkedin, getUrl: (v: string) => v.startsWith('http') ? v : `https://linkedin.com/in/${v}` },
  { key: 'github', label: 'GitHub', icon: Github, getUrl: (v: string) => `https://github.com/${v}` },
  { key: 'twitter', label: 'X', icon: Twitter, getUrl: (v: string) => `https://x.com/${v.replace('@', '')}` },
] as const;

export function UserProfileSheet({ open, onOpenChange, userId }: UserProfileSheetProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => {
    if (open && userId) fetchProfile(userId);
    else if (!open) setProfile(null);
  }, [open, userId]);

  const fetchProfile = async (uid: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.rpc('get_public_profiles', { _user_ids: [uid] });
      if (error) { console.error('Failed to fetch profile:', error); return; }
      if (data && data.length > 0) {
        const p = data[0];
        setProfile({
          name: p.name || 'Unknown',
          username: p.username,
          avatar_url: p.avatar_url,
          bio: p.bio,
          headline: (p as any).headline || null,
          social_links: p.social_links as SocialLinks | null,
          faculty: p.faculty as string | null,
          semester: p.semester as number | null,
          role: (p.role as AppRole) || 'student',
        });
      }
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    } finally { setIsLoading(false); }
  };

  const handleViewProfile = () => {
    onOpenChange(false);
    if (userId === user?.id) {
      navigate('/profile');
    } else if (profile?.username) {
      navigate(`/u/${profile.username}`);
    }
  };

  const initials = profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || '?';
  const socialLinks = profile?.social_links || {};
  const hasSocialLinks = Object.values(socialLinks).some(v => !!v);
  const isOwnProfile = userId === user?.id;

  return (
    <>
      <Sheet open={open} onOpenChange={onOpenChange}>
        <SheetContent side="bottom" className="h-auto max-h-[80vh] rounded-t-2xl">
          <SheetHeader className="sr-only"><SheetTitle>Profile</SheetTitle></SheetHeader>
          
          {isLoading ? (
            <div className="flex items-center gap-4 py-6 px-2">
              <Skeleton className="h-16 w-16 rounded-full shrink-0" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-5 w-32" />
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-3 w-48" />
              </div>
            </div>
          ) : profile ? (
            <div className="py-4 px-2 space-y-4">
              {/* Top row: avatar + info */}
              <div className="flex items-start gap-4">
                <Avatar className="h-16 w-16 border-2 border-border shrink-0">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
                  <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5">
                    <h2 className="text-lg font-bold truncate">{profile.name}</h2>
                    {profile.role === 'cr' && <BadgeCheck className="h-5 w-5 text-primary shrink-0" />}
                  </div>
                  {profile.username && (
                    <p className="text-sm text-muted-foreground">@{profile.username}</p>
                  )}
                  {profile.headline && (
                    <p className="text-xs text-foreground/80 mt-0.5 line-clamp-2">{profile.headline}</p>
                  )}
                  {(profile.faculty || profile.semester) && (
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {[profile.faculty, profile.semester ? `Sem ${profile.semester}` : null].filter(Boolean).join(' · ')}
                    </p>
                  )}
                </div>
              </div>

              {/* Bio */}
              {profile.bio && (
                <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
              )}

              {/* Social links */}
              {hasSocialLinks && (
                <div className="flex gap-2">
                  {SOCIAL_PLATFORMS.map(platform => {
                    const value = socialLinks[platform.key as keyof SocialLinks];
                    if (!value) return null;
                    const Icon = platform.icon;
                    return (
                      <Button key={platform.key} variant="outline" size="icon" className="h-9 w-9 rounded-lg"
                        onClick={() => window.open(platform.getUrl(value), '_blank', 'noopener,noreferrer')}>
                        <Icon className="h-4 w-4" />
                      </Button>
                    );
                  })}
                </div>
              )}

              {/* Action buttons */}
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  className="flex-1 gap-2 rounded-full"
                  onClick={handleViewProfile}
                >
                  <ExternalLink className="h-4 w-4" />
                  View Profile
                </Button>
                {!isOwnProfile && userId && (
                  <Button variant="outline" className="flex-1 gap-2 rounded-full" onClick={() => setChatOpen(true)}>
                    <MessageCircle className="h-4 w-4" /> Message
                  </Button>
                )}
              </div>

              {!hasSocialLinks && !profile.bio && !profile.headline && (
                <p className="text-sm text-muted-foreground italic text-center">No additional info shared</p>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center py-8">
              <p className="text-muted-foreground">Profile not found</p>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* Chat sheet */}
      {userId && profile && (
        <MessageSheet
          open={chatOpen}
          onOpenChange={setChatOpen}
          otherUserId={userId}
          otherUserName={profile.name}
          contextType="classroom"
        />
      )}
    </>
  );
}
