import { useState } from 'react';
import { motion } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/features/auth';
import { useAchievements, ACHIEVEMENT_DEFINITIONS } from '@/hooks/useAchievements';
import { useTasks } from '@/hooks/useTasks';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { 
  Award, CheckCircle, GraduationCap, Flame, RotateCw,
  Instagram, Linkedin, Github, Twitter
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface SocialLinks {
  instagram?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
}

export function ProfileCard() {
  const [isFlipped, setIsFlipped] = useState(false);
  const { user } = useAuth();
  const { data: profile, isLoading: profileLoading } = useProfile();
  const { data: achievements } = useAchievements();
  const { data: tasks } = useTasks();
  
  const handleFlip = () => setIsFlipped(!isFlipped);
  
  if (profileLoading) {
    return <ProfileCardSkeleton />;
  }
  
  const initials = profile?.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U';
  const completedTasks = tasks?.filter(t => t.is_completed).length || 0;
  const socialLinks = (profile?.social_links || {}) as SocialLinks;
  
  // QR code links to public profile
  const publicUrl = profile?.username 
    ? `${window.location.origin}/u/${profile.username}`
    : window.location.href;
  
  return (
    <div className="w-full max-w-sm mx-auto">
      <div className="perspective-1000">
        <motion.div
          className="relative w-full aspect-[1.586/1] cursor-pointer preserve-3d"
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.6, type: 'spring', stiffness: 100 }}
          onClick={handleFlip}
          style={{ transformStyle: 'preserve-3d' }}
        >
          {/* Front of Card */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden"
            style={{ backfaceVisibility: 'hidden' }}
          >
            <CardFront 
              profile={profile}
              initials={initials}
              email={user?.email}
              qrData={publicUrl}
            />
          </div>
          
          {/* Back of Card */}
          <div 
            className="absolute inset-0 backface-hidden rounded-2xl overflow-hidden"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <CardBack
              profile={profile}
              completedTasks={completedTasks}
              visitStreak={profile?.visit_streak || 0}
              achievements={achievements}
              socialLinks={socialLinks}
            />
          </div>
        </motion.div>
      </div>
      
      {/* Flip hint */}
      <motion.p 
        className="text-center text-xs text-muted-foreground mt-4 flex items-center justify-center gap-1.5"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <RotateCw className="w-3 h-3" />
        Tap to flip
      </motion.p>
    </div>
  );
}

interface CardFrontProps {
  profile: any;
  initials: string;
  email?: string;
  qrData: string;
}

function CardFront({ profile, initials, email, qrData }: CardFrontProps) {
  return (
    <div className="w-full h-full bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-5 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-auto">
        <div>
          <h3 className="text-primary-foreground/80 text-[10px] uppercase tracking-widest font-medium">
            Campus Duty
          </h3>
          <p className="text-primary-foreground text-xs font-semibold">Student Profile</p>
        </div>
        <GraduationCap className="w-8 h-8 text-primary-foreground/30" />
      </div>
      
      {/* Profile Section */}
      <div className="flex items-end justify-between">
        <div className="flex items-center gap-3">
          <Avatar className="w-16 h-16 border-2 border-primary-foreground/30 shadow-lg">
            <AvatarImage src={profile?.avatar_url} alt={profile?.name} />
            <AvatarFallback className="bg-primary-foreground/20 text-primary-foreground text-lg font-bold">
              {initials}
            </AvatarFallback>
          </Avatar>
          <div>
            <h2 className="text-primary-foreground font-bold text-lg leading-tight">
              {profile?.name || 'Student'}
            </h2>
            <p className="text-primary-foreground/70 text-xs">
              {email || 'student@campus.edu'}
            </p>
            {profile?.username && (
              <Badge variant="secondary" className="mt-1 text-[10px] bg-primary-foreground/20 text-primary-foreground border-0">
                @{profile.username}
              </Badge>
            )}
          </div>
        </div>
        
        {/* QR Code */}
        <div className="bg-white p-1.5 rounded-lg shadow-lg">
          <QRCodeSVG 
            value={qrData} 
            size={56}
            bgColor="white"
            fgColor="black"
            level="M"
          />
        </div>
      </div>
    </div>
  );
}

interface CardBackProps {
  profile: any;
  completedTasks: number;
  visitStreak: number;
  achievements: any[] | undefined;
  socialLinks: SocialLinks;
}

function CardBack({ 
  profile, 
  completedTasks, 
  visitStreak,
  achievements,
  socialLinks
}: CardBackProps) {
  const unlockedKeys = new Set(achievements?.map(a => a.achievement_key) || []);
  const recentAchievements = ACHIEVEMENT_DEFINITIONS.filter(a => unlockedKeys.has(a.key)).slice(0, 6);
  
  const stats = [
    { label: 'Tasks Done', value: completedTasks, icon: CheckCircle, color: 'text-green-400' },
    { label: 'Visit Streak', value: visitStreak, icon: Flame, color: 'text-orange-400' },
  ];
  
  const socialPlatforms = [
    { key: 'instagram', icon: Instagram, url: (u: string) => `https://instagram.com/${u}` },
    { key: 'linkedin', icon: Linkedin, url: (u: string) => u.includes('linkedin.com') ? u : `https://linkedin.com/in/${u}` },
    { key: 'github', icon: Github, url: (u: string) => `https://github.com/${u}` },
    { key: 'twitter', icon: Twitter, url: (u: string) => `https://x.com/${u}` },
  ];
  
  const activeSocials = socialPlatforms.filter(p => socialLinks[p.key as keyof SocialLinks]);
  
  return (
    <div className="w-full h-full bg-gradient-to-br from-card via-card to-muted/50 border border-border p-4 flex flex-col">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3 mb-3">
        {stats.map((stat) => (
          <div key={stat.label} className="flex items-center gap-2 p-2 rounded-xl bg-muted/30">
            <div className={cn('w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center', stat.color)}>
              <stat.icon className="w-4 h-4" />
            </div>
            <div>
              <p className="text-foreground font-bold text-sm">{stat.value}</p>
              <p className="text-muted-foreground text-[9px]">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>
      
      {/* Achievements */}
      <div className="flex-1 min-h-0">
        <div className="flex items-center gap-1 mb-1.5">
          <Award className="w-3 h-3 text-amber-500" />
          <span className="text-[9px] font-medium text-muted-foreground uppercase tracking-wide">
            Badges ({achievements?.length || 0}/{ACHIEVEMENT_DEFINITIONS.length})
          </span>
        </div>
        
        <div className="flex flex-wrap gap-1.5">
          {recentAchievements.length > 0 ? (
            recentAchievements.map((def) => (
              <motion.div
                key={def.key}
                className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500/20 to-yellow-500/10 flex items-center justify-center"
                whileHover={{ scale: 1.1 }}
                title={`${def.title}: ${def.description}`}
              >
                <span className="text-base">{def.icon}</span>
              </motion.div>
            ))
          ) : (
            <p className="text-muted-foreground text-[10px] italic">No badges yet</p>
          )}
          {achievements && achievements.length > 6 && (
            <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center text-[10px] text-muted-foreground font-medium">
              +{achievements.length - 6}
            </div>
          )}
        </div>
      </div>
      
      {/* Social Links */}
      {activeSocials.length > 0 && (
        <div className="flex items-center gap-2 py-2 border-t border-border/50">
          {activeSocials.map((platform) => {
            const Icon = platform.icon;
            const username = socialLinks[platform.key as keyof SocialLinks];
            return (
              <a
                key={platform.key}
                href={platform.url(username!)}
                target="_blank"
                rel="noopener noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="w-7 h-7 rounded-md bg-muted/50 flex items-center justify-center hover:bg-muted transition-colors"
              >
                <Icon className="w-3.5 h-3.5 text-muted-foreground" />
              </a>
            );
          })}
        </div>
      )}
      
      {/* Footer */}
      <div className={cn("pt-2 border-t border-border/50 flex items-center justify-between", activeSocials.length > 0 && "pt-0 border-t-0")}>
        <p className="text-[8px] text-muted-foreground">
          Member since {new Date(profile?.created_at).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
        </p>
        <div className="flex items-center gap-1">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
          <span className="text-[8px] text-muted-foreground">Active</span>
        </div>
      </div>
    </div>
  );
}

function ProfileCardSkeleton() {
  return (
    <div className="w-full max-w-sm mx-auto aspect-[1.586/1] rounded-2xl overflow-hidden">
      <div className="w-full h-full bg-gradient-to-br from-primary/90 via-primary to-primary/80 p-5 flex flex-col">
        <div className="flex items-center justify-between mb-auto">
          <div className="space-y-1">
            <Skeleton className="h-3 w-20 bg-primary-foreground/20" />
            <Skeleton className="h-4 w-16 bg-primary-foreground/20" />
          </div>
          <Skeleton className="w-8 h-8 rounded bg-primary-foreground/20" />
        </div>
        <div className="flex items-end justify-between">
          <div className="flex items-center gap-3">
            <Skeleton className="w-16 h-16 rounded-full bg-primary-foreground/20" />
            <div className="space-y-1.5">
              <Skeleton className="h-5 w-32 bg-primary-foreground/20" />
              <Skeleton className="h-3 w-24 bg-primary-foreground/20" />
            </div>
          </div>
          <Skeleton className="w-14 h-14 rounded-lg bg-primary-foreground/20" />
        </div>
      </div>
    </div>
  );
}
