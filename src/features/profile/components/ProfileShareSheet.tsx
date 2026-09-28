import { QRCodeSVG } from 'qrcode.react';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Copy, Check, ExternalLink, QrCode, Share2, Settings } from 'lucide-react';
import { Instagram, Linkedin, Twitter, Github, Globe, Facebook } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

interface ProfileShareSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ProfileShareSheet({ open, onOpenChange }: ProfileShareSheetProps) {
  const { data: profile } = useProfile();
  const [copied, setCopied] = useState(false);

  if (!profile?.username) return null;

  const publicUrl = `${window.location.origin}/u/${profile.username}`;
  const initials = profile.name?.split(' ').map((n: string) => n[0]).join('').slice(0, 2) || 'U';
  const skills = Array.isArray(profile.skills) ? (profile.skills as string[]).slice(0, 4) : [];
  const socialLinks = profile.social_links as Record<string, string> | null;
  const handleCopy = async () => {
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    toast.success('Link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.name}'s Profile`,
          text: `Check out ${profile.name}'s profile on Campus Duty!`,
          url: publicUrl,
        });
      } catch {
        // Share cancelled
      }
    } else {
      handleCopy();
    }
  };

  const handleOpenProfile = () => {
    window.open(publicUrl, '_blank');
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="bottom" className="h-auto max-h-[85vh] rounded-t-2xl overflow-y-auto">
        <SheetHeader className="pb-4">
          <SheetTitle className="flex items-center gap-2">
            <Share2 className="w-5 h-5 text-primary" />
            Share Your Profile
          </SheetTitle>
          <SheetDescription>
            Anyone with this link can view your public profile
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-5 pb-8">
          {/* Public Profile Preview Card */}
          <div className="rounded-2xl border border-border overflow-hidden bg-card">
            {/* Decorative banner with dot pattern */}
            <div 
              className="h-24 relative"
              style={{ 
                background: 'linear-gradient(135deg, hsl(var(--primary) / 0.15), hsl(var(--primary) / 0.08))',
                backgroundImage: 'radial-gradient(circle, hsl(var(--primary) / 0.2) 1px, transparent 1px)',
                backgroundSize: '12px 12px',
              }}
            />

            {/* Avatar overlapping banner */}
            <div className="px-5 -mt-10 relative">
              <div className="p-1 rounded-full bg-card shadow-lg inline-block">
                <Avatar className="w-20 h-20 border-2 border-card">
                  <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
                  <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
                </Avatar>
              </div>
            </div>

            <div className="px-5 pb-5 pt-3 space-y-2">
              {/* Name */}
              <h3 className="text-xl font-bold tracking-tight">{profile.name}</h3>
              
              {/* Username */}
              <p className="text-sm font-medium text-primary/80">@{profile.username}</p>
              
              {/* Headline */}
              {profile.headline && (
                <p className="text-sm text-muted-foreground">{profile.headline}</p>
              )}

              {/* Social links icons */}
              {socialLinks && Object.keys(socialLinks).some(k => socialLinks[k]) && (
                <div className="flex items-center gap-2 pt-1">
                  {socialLinks.instagram && (
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <Instagram className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  {socialLinks.linkedin && (
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <Linkedin className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  {socialLinks.twitter && (
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <Twitter className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  {socialLinks.github && (
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <Github className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  {socialLinks.facebook && (
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <Facebook className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                  {socialLinks.website && (
                    <div className="w-9 h-9 rounded-full bg-muted flex items-center justify-center">
                      <Globe className="w-4 h-4 text-muted-foreground" />
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* QR Code */}
          <div className="flex flex-col items-center gap-3">
            <div className="p-3 bg-white rounded-xl shadow-sm border border-border">
              <QRCodeSVG
                value={publicUrl}
                size={120}
                bgColor="white"
                fgColor="black"
                level="M"
                includeMargin={false}
              />
            </div>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <QrCode className="w-3.5 h-3.5" />
              <span>Scan to view profile</span>
            </div>
          </div>

          {/* Link Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Profile Link</label>
            <div className="flex gap-2">
              <Input
                value={publicUrl}
                readOnly
                className="font-mono text-sm"
              />
              <Button
                variant="outline"
                size="icon"
                onClick={handleCopy}
                className="shrink-0"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-green-500" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </Button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1 gap-2 rounded-full"
              onClick={handleOpenProfile}
            >
              <ExternalLink className="w-4 h-4" />
              Preview
            </Button>
            <Button
              className="flex-1 gap-2 rounded-full"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4" />
              Share
            </Button>
          </div>

          {/* Privacy Note */}
          <div className="p-3 rounded-lg bg-muted/50 flex items-start gap-3">
            <Settings className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" />
            <div className="text-xs text-muted-foreground">
              <p className="font-medium text-foreground mb-1">Privacy Controls</p>
              <p>
                Only information you've marked as visible in your privacy settings will be shown on your public profile.
              </p>
            </div>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
