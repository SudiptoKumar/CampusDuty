import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useState } from 'react';
import { 
  User, GraduationCap, BookOpen, Hash, Mail, Droplets,
  Instagram, Linkedin, Github, Twitter, Quote,
  Calendar, Sparkles, BadgeCheck, Lightbulb, ArrowLeft, MessageCircle
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/features/auth/AuthProvider';
import { LiquidEffectAnimation } from '@/components/ui/liquid-effect-animation';
import { MessageSheet } from '@/features/marketplace/components/MessageSheet';

interface PublicProfile {
  user_id: string;
  name: string;
  username: string;
  avatar_url: string | null;
  bio: string | null;
  social_links: Record<string, string> | null;
  faculty: string | null;
  semester: number | null;
  email: string | null;
  class_id: string | null;
  reg_number: string | null;
  blood_group: string | null;
  created_at: string;
  role: string;
  headline: string | null;
  
  skills: string[] | null;
}

const SOCIAL_PLATFORMS = [
  { key: 'instagram', icon: Instagram, label: 'Instagram', url: (u: string) => `https://instagram.com/${u}`, color: 'hover:text-pink-500 hover:bg-pink-500/10' },
  { key: 'linkedin', icon: Linkedin, label: 'LinkedIn', url: (u: string) => u.includes('linkedin.com') ? u : `https://linkedin.com/in/${u}`, color: 'hover:text-blue-500 hover:bg-blue-500/10' },
  { key: 'github', icon: Github, label: 'GitHub', url: (u: string) => `https://github.com/${u}`, color: 'hover:text-foreground hover:bg-foreground/10' },
  { key: 'twitter', icon: Twitter, label: 'X', url: (u: string) => `https://x.com/${u}`, color: 'hover:text-sky-500 hover:bg-sky-500/10' },
];

const ROLE_LABELS: Record<string, string> = {
  student: 'Student',
  cr: 'Class Representative',
  admin: 'Admin',
};

function usePublicProfile(username: string | undefined) {
  return useQuery({
    queryKey: ['public-profile', username],
    queryFn: async () => {
      if (!username) return null;
      const { data, error } = await supabase.rpc('get_public_profile_by_username', { _username: username });
      if (error) throw error;
      if (!data || data.length === 0) return null;
      return data[0] as unknown as PublicProfile;
    },
    enabled: !!username,
    staleTime: 1000 * 60 * 5,
  });
}

export function PublicProfilePage() {
  const { username } = useParams<{ username: string }>();
  const { data: profile, isLoading, error } = usePublicProfile(username);
  const { user } = useAuth();
  const navigate = useNavigate();
  const [chatOpen, setChatOpen] = useState(false);
  const isAuthenticated = !!user;
  const isOwnProfile = user && profile && user.id === profile.user_id;

  if (isLoading) return <PublicProfileSkeleton />;
  if (error || !profile) return <ProfileNotFound username={username} />;

  const initials = profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U';
  const socialLinks = profile.social_links || {};
  const activeSocials = SOCIAL_PLATFORMS.filter(p => socialLinks[p.key]);
  const hasAcademicInfo = profile.faculty || profile.semester || profile.class_id || profile.reg_number;
  const hasContactInfo = profile.email || profile.blood_group;
  const skills = profile.skills || [];

  const stagger = {
    container: { animate: { transition: { staggerChildren: 0.08 } } },
    item: { initial: { opacity: 0, y: 12 }, animate: { opacity: 1, y: 0, transition: { duration: 0.4 } } },
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold text-sm">Campus Duty</span>
          </Link>
          {isAuthenticated ? (
            <Button variant="ghost" size="sm" className="rounded-full text-xs gap-1" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-3.5 h-3.5" /> Back
            </Button>
          ) : (
            <Link to="/login"><Button variant="ghost" size="sm" className="rounded-full text-xs">Login</Button></Link>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto">
        {/* Liquid Banner */}
        <div className="mx-4 md:mx-6 mt-4">
          <div className="h-[120px] rounded-2xl overflow-hidden relative">
            <LiquidEffectAnimation metalness={0.8} roughness={0.2} displacementScale={4} />
            <div className="absolute inset-0 bg-gradient-to-b from-transparent to-background/60" />
          </div>
        </div>

        {/* Header Section */}
        <motion.div
          className="px-4 md:px-6 -mt-12 space-y-4"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          {/* Avatar */}
          <div className="relative w-24 h-24">
            <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
              <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
              <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
            </Avatar>
          </div>

          {/* Name + Message button */}
          <div className="flex items-center justify-between gap-3">
            <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
            {isAuthenticated && !isOwnProfile && (
              <Button variant="outline" size="sm" className="rounded-full gap-1.5 shrink-0" onClick={() => setChatOpen(true)}>
                <MessageCircle className="w-3.5 h-3.5" /> Message
              </Button>
            )}
          </div>

          {/* Username */}
          <div className="text-sm font-medium text-primary/80">
            @{profile.username}
          </div>

          {/* Headline */}
          {profile.headline && (
            <p className="text-sm text-foreground">{profile.headline}</p>
          )}

          {/* Social links */}
          {activeSocials.length > 0 && (
            <div className="flex gap-1.5">
              {activeSocials.map((platform) => {
                const Icon = platform.icon;
                return (
                  <a key={platform.key} href={platform.url(socialLinks[platform.key])} target="_blank" rel="noopener noreferrer"
                    className={cn('w-9 h-9 rounded-full bg-muted/50 flex items-center justify-center text-muted-foreground transition-all border border-border hover:border-primary/20', platform.color)}>
                    <Icon className="w-4 h-4" />
                  </a>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* Divider */}
        <div className="mx-4 md:mx-6 my-6 h-px bg-border/60" />

        {/* Content Sections */}
        <motion.div className="px-4 md:px-6 space-y-4" variants={stagger.container} initial="initial" animate="animate">
          {/* About */}
          {profile.bio && (
            <ResumeSection icon={Quote} title="About" variants={stagger.item}>
              <p className="text-sm text-muted-foreground leading-relaxed whitespace-pre-line">{profile.bio}</p>
            </ResumeSection>
          )}

          {/* Academic Info */}
          {hasAcademicInfo && (
            <ResumeSection icon={GraduationCap} title="Academic Information" variants={stagger.item}>
              <div className="grid grid-cols-2 gap-4">
                {profile.faculty && <ResumeInfoItem icon={BookOpen} label="Faculty" value={profile.faculty} />}
                {profile.semester && <ResumeInfoItem icon={GraduationCap} label="Semester" value={`${profile.semester}`} />}
                {profile.class_id && <ResumeInfoItem icon={Hash} label="Class ID" value={profile.class_id} />}
                {profile.reg_number && <ResumeInfoItem icon={Hash} label="Reg No." value={profile.reg_number} />}
              </div>
            </ResumeSection>
          )}

          {/* Skills */}
          {skills.length > 0 && (
            <ResumeSection icon={Lightbulb} title="Skills & Interests" variants={stagger.item}>
              <div className="flex flex-wrap gap-2">
                {skills.map((skill, i) => (
                  <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-muted/60 text-foreground border border-border">
                    {skill}
                  </span>
                ))}
              </div>
            </ResumeSection>
          )}

          {/* Contact */}
          {hasContactInfo && (
            <ResumeSection icon={User} title="Contact & Personal" variants={stagger.item}>
              <div className="space-y-3">
                {profile.email && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center"><Mail className="w-4 h-4 text-muted-foreground" /></div>
                    <span className="text-muted-foreground">{profile.email}</span>
                  </div>
                )}
                {profile.blood_group && (
                  <div className="flex items-center gap-3 text-sm">
                    <div className="w-8 h-8 rounded-lg bg-destructive/10 flex items-center justify-center"><Droplets className="w-4 h-4 text-destructive" /></div>
                    <span>Blood Group: <strong className="text-foreground">{profile.blood_group}</strong></span>
                  </div>
                )}
              </div>
            </ResumeSection>
          )}
        </motion.div>

        {/* Member Since */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-6 mt-4 px-4">
          <Calendar className="w-3.5 h-3.5 text-primary/60" />
          <span>Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
          <span className="text-border">•</span>
          <span className="flex items-center gap-1"><BadgeCheck className="w-3.5 h-3.5 text-primary/60" />Verified</span>
        </motion.div>

        {/* Join CTA - only for unauthenticated users */}
        {!isAuthenticated && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}
            className="mx-4 md:mx-6 rounded-xl border border-border p-6 text-center space-y-3 mb-4">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><GraduationCap className="w-6 h-6 text-primary" /></div>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold">Join Campus Duty</h3>
              <p className="text-xs text-muted-foreground">Sign up to organize your academic life</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Link to="/signup"><Button size="sm" className="gap-2 rounded-full"><Sparkles className="w-3.5 h-3.5" />Get Started</Button></Link>
              <Link to="/login"><Button variant="outline" size="sm" className="rounded-full">Sign in</Button></Link>
            </div>
          </motion.div>
        )}

        {/* Footer */}
        <footer className="pt-4 pb-8 px-4">
          <div className="flex flex-col items-center gap-3">
            <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
            <Link to="/" className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors group">
              <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"><GraduationCap className="w-4 h-4 text-primary" /></div>
              <span className="text-sm font-medium">Campus Duty</span>
            </Link>
            <p className="text-xs text-muted-foreground/70">Your academic companion • Made with ❤️ for students</p>
          </div>
        </footer>
      </main>

      {/* Direct message sheet for logged-in users */}
      {isAuthenticated && !isOwnProfile && profile && (
        <MessageSheet
          open={chatOpen}
          onOpenChange={setChatOpen}
          otherUserId={profile.user_id}
          otherUserName={profile.name}
          contextType="classroom"
        />
      )}
    </div>
  );
}

/* ─── Resume Section ─────────────────────────────── */
function ResumeSection({ icon: Icon, title, children, variants }: { icon: React.ElementType; title: string; children: React.ReactNode; variants?: any }) {
  return (
    <motion.div variants={variants} className="rounded-xl border border-border p-5 space-y-4">
      <h3 className="font-semibold text-base flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center"><Icon className="w-4 h-4 text-primary" /></div>
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

/* ─── Resume Info Item ─────────────────────────────── */
function ResumeInfoItem({ icon: Icon, label, value }: { icon: any; label: string; value: string }) {
  return (
    <div className="flex items-start gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-muted/50 flex items-center justify-center shrink-0 mt-0.5"><Icon className="w-3.5 h-3.5 text-muted-foreground" /></div>
      <div>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">{label}</p>
        <p className="text-sm font-semibold">{value}</p>
      </div>
    </div>
  );
}

/* ─── Not Found ────────────────────────────────────── */
function ProfileNotFound({ username }: { username?: string }) {
  return (
    <div className="min-h-screen bg-background flex flex-col">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/" className="flex items-center gap-2"><div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center"><GraduationCap className="w-5 h-5 text-primary" /></div><span className="font-semibold text-sm">Campus Duty</span></Link>
          <Link to="/login"><Button variant="ghost" size="sm" className="rounded-full">Login</Button></Link>
        </div>
      </header>
      <main className="flex-1 flex items-center justify-center p-8">
        <motion.div className="text-center space-y-4" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="w-24 h-24 mx-auto rounded-full bg-muted/50 flex items-center justify-center"><User className="w-12 h-12 text-muted-foreground" /></div>
          <h1 className="text-2xl font-bold">Profile Not Found</h1>
          <p className="text-muted-foreground max-w-xs mx-auto">{username ? `No user found with username "${username}"` : 'This profile does not exist'}</p>
          <Link to="/signup"><Button className="gap-2 mt-4 rounded-full"><GraduationCap className="w-4 h-4" />Join Campus Duty</Button></Link>
        </motion.div>
      </main>
    </div>
  );
}

/* ─── Skeleton ─────────────────────────────────────── */
function PublicProfileSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between"><Skeleton className="h-8 w-32" /><Skeleton className="h-8 w-16 rounded-full" /></div>
      </header>
      <main className="max-w-2xl mx-auto">
        <div className="mx-4 mt-4">
          <Skeleton className="h-[120px] rounded-2xl" />
        </div>
        <div className="px-4 -mt-12 space-y-4">
          <Skeleton className="w-24 h-24 rounded-full" />
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-4 w-32" />
        </div>
        <div className="px-4 mt-6 space-y-4">
          <Skeleton className="h-24 rounded-xl" />
          <Skeleton className="h-28 rounded-xl" />
          <Skeleton className="h-20 rounded-xl" />
        </div>
      </main>
    </div>
  );
}

export default PublicProfilePage;
