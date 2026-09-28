import { motion } from 'framer-motion';
import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/features/auth';
import { usePermission } from '@/hooks/usePermission';
import { useAchievements } from '@/hooks/useAchievements';
import { useTasks } from '@/hooks/useTasks';
import { useClassroomPosts, useBookmarks } from '@/hooks/useClassroomPosts';
import { MarkdownContent } from '@/features/classroom/components/MarkdownContent';
import { PostCard } from '@/features/classroom/components/PostCard';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Edit, Share2, Mail, Droplets, GraduationCap, BookOpen,
  Hash, Instagram, Linkedin, Github, Twitter, Shield, Crown, UserCircle,
  Lightbulb, Quote, CheckCircle, Flame, Award, Eye, EyeOff, Calendar,
  Heart, MessageSquare, ThumbsUp, User, Bookmark, FileText
} from 'lucide-react';
import { useState } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { ProfileEditSheet } from './components/ProfileEditSheet';
import { ProfileShareSheet } from './components/ProfileShareSheet';
import { EmptyState } from '@/components/shared';
import { LiquidEffectAnimation } from '@/components/ui/liquid-effect-animation';

interface SocialLinks {
  instagram?: string;
  linkedin?: string;
  github?: string;
  twitter?: string;
}

const SOCIAL_PLATFORMS = [
  { key: 'instagram', icon: Instagram, label: 'Instagram', url: (u: string) => `https://instagram.com/${u}`, color: 'hover:text-pink-500 hover:bg-pink-500/10' },
  { key: 'linkedin', icon: Linkedin, label: 'LinkedIn', url: (u: string) => u.includes('linkedin.com') ? u : `https://linkedin.com/in/${u}`, color: 'hover:text-blue-500 hover:bg-blue-500/10' },
  { key: 'github', icon: Github, label: 'GitHub', url: (u: string) => `https://github.com/${u}`, color: 'hover:text-foreground hover:bg-foreground/10' },
  { key: 'twitter', icon: Twitter, label: 'X', url: (u: string) => `https://x.com/${u}`, color: 'hover:text-sky-500 hover:bg-sky-500/10' },
];

type ProfileTab = 'about' | 'posts' | 'bookmarks';

export function ProfilePage() {
  const [editSheetOpen, setEditSheetOpen] = useState(false);
  const [shareSheetOpen, setShareSheetOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<ProfileTab>('about');
  const { user } = useAuth();
  const { data: profile, isLoading } = useProfile();
  const { isAdmin, isCR } = usePermission('cr');
  const { data: achievements } = useAchievements();
  const { data: tasks } = useTasks();
  const { data: posts } = useClassroomPosts();
  const { data: bookmarks } = useBookmarks();

  if (isLoading) return <ProfilePageSkeleton />;
  if (!profile) return null;

  const initials = profile.name?.split(' ').map(n => n[0]).join('').slice(0, 2) || 'U';
  const socialLinks = (profile.social_links || {}) as SocialLinks;
  const activeSocials = SOCIAL_PLATFORMS.filter(p => socialLinks[p.key as keyof SocialLinks]);
  const skills = (profile as any).skills as string[] | null;
  const headline = (profile as any).headline as string | null;

  const role = isAdmin ? 'Admin' : isCR ? 'Class Representative' : 'Student';
  const roleBadgeVariant = isAdmin ? 'destructive' : isCR ? 'default' : 'secondary';
  const RoleIcon = isAdmin ? Shield : isCR ? Crown : UserCircle;
  const hasUsername = profile.username && profile.username.length >= 3;

  const completedTasks = tasks?.filter(t => t.is_completed).length || 0;
  const badgeCount = achievements?.length || 0;

  const hasAcademicInfo = profile.faculty || profile.semester || profile.class_id || profile.reg_number;
  const hasContactInfo = profile.email || profile.blood_group;

  // User's own posts
  const myPosts = posts?.filter(p => p.user_id === user?.id) || [];
  // Bookmarked posts
  const bookmarkedPostIds = new Set(bookmarks?.map(b => b.post_id) || []);
  const bookmarkedPosts = posts?.filter(p => bookmarkedPostIds.has(p.id)) || [];

  const latestPost = myPosts[0];

  const tabs: { id: ProfileTab; label: string; icon: React.ElementType; count?: number }[] = [
    { id: 'about', label: 'About', icon: User },
    { id: 'posts', label: 'Posts', icon: FileText, count: myPosts.length },
    { id: 'bookmarks', label: 'Saved', icon: Bookmark, count: bookmarkedPosts.length },
  ];

  return (
    <div className="pb-24">
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
        <div className="relative w-24 h-24">
          <Avatar className="w-24 h-24 border-4 border-background shadow-lg">
            <AvatarImage src={profile.avatar_url || undefined} alt={profile.name} />
            <AvatarFallback className="text-xl font-bold bg-primary/10 text-primary">{initials}</AvatarFallback>
          </Avatar>
        </div>

        <div className="flex items-center gap-2.5 flex-wrap">
          <h1 className="text-2xl font-bold tracking-tight">{profile.name}</h1>
          <Badge variant={roleBadgeVariant} className="text-[10px] gap-1">
            <RoleIcon className="w-3 h-3" />
            {role}
          </Badge>
        </div>

        {profile.username && (
          <div className="text-sm font-medium text-primary/80">@{profile.username}</div>
        )}

        {headline && (
          <p className="text-sm text-foreground">{headline}</p>
        )}

        {!hasUsername && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            ⚠️ Set a username (min 3 chars) to enable sharing
          </p>
        )}

        <div className="flex items-center gap-2">
          <Button className="rounded-full gap-1.5 text-xs font-medium px-8 h-10" onClick={() => setEditSheetOpen(true)}>
            <Edit className="w-3.5 h-3.5" /> Edit Profile
          </Button>
          <Button variant="outline" className="rounded-full gap-1.5 text-xs font-medium px-8 h-10" onClick={() => setShareSheetOpen(true)} disabled={!hasUsername}>
            <Share2 className="w-3.5 h-3.5" /> Share
          </Button>
        </div>
      </motion.div>

      {/* Tab Navigation */}
      <div className="mx-4 md:mx-6 mt-5 flex border-b border-border">
        {tabs.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex-1 py-3 text-sm font-semibold text-center relative transition-colors flex items-center justify-center gap-1.5 ${
              activeTab === tab.id ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
            }`}
          >
            <tab.icon className="w-4 h-4" />
            {tab.label}
            {tab.count !== undefined && tab.count > 0 && (
              <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted">{tab.count}</span>
            )}
            {activeTab === tab.id && (
              <motion.div layoutId="profile-tab" className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-[3px] rounded-full bg-primary" />
            )}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="px-4 md:px-6 mt-4 space-y-4 max-w-2xl">
        {activeTab === 'about' && (
          <>
            {headline && (
              <SectionCard title="Headline" icon={Lightbulb} delay={0.05}>
                <p className="text-sm text-foreground leading-relaxed">{headline}</p>
              </SectionCard>
            )}

            {profile.bio && (
              <SectionCard title="About" icon={User} delay={0.07}>
                <p className="text-sm text-muted-foreground leading-relaxed">{profile.bio}</p>
              </SectionCard>
            )}

            {skills && skills.length > 0 && (
              <SectionCard title="Top Skills" icon={Lightbulb} delay={0.1}>
                <div className="flex flex-wrap gap-2">
                  {skills.map((skill, i) => (
                    <span key={i} className="px-3 py-1 rounded-full text-xs font-medium bg-muted/60 text-foreground border border-border">{skill}</span>
                  ))}
                </div>
              </SectionCard>
            )}

            {hasAcademicInfo && (
              <SectionCard title="Academic Information" icon={GraduationCap} delay={0.15}>
                <div className="grid grid-cols-2 gap-4">
                  {profile.faculty && <InfoItem label="Faculty" value={profile.faculty} />}
                  {profile.semester && <InfoItem label="Semester" value={`${profile.semester}`} />}
                  {profile.class_id && <InfoItem label="Class ID" value={profile.class_id} privacy={!profile.show_class_id} />}
                  {profile.reg_number && <InfoItem label="Reg Number" value={profile.reg_number} privacy={!profile.show_reg_number} />}
                </div>
              </SectionCard>
            )}

            {hasContactInfo && (
              <SectionCard title="Personal Information" icon={Heart} delay={0.2}>
                <div className="space-y-3">
                  {profile.blood_group && (
                    <div className="flex items-center gap-3 text-sm">
                      <Droplets className="w-4 h-4 text-destructive/70" />
                      <span>Blood Group: <strong>{profile.blood_group}</strong></span>
                    </div>
                  )}
                  {profile.email && (
                    <div className="flex items-center gap-3 text-sm">
                      <Mail className="w-4 h-4 text-muted-foreground" />
                      <span>{profile.email}</span>
                      {!profile.show_email && (
                        <Badge variant="outline" className="text-[9px] gap-0.5">
                          <EyeOff className="w-2.5 h-2.5" /> Private
                        </Badge>
                      )}
                    </div>
                  )}
                </div>
              </SectionCard>
            )}

            {activeSocials.length > 0 && (
              <SectionCard title="Social Links" icon={Share2} delay={0.25}>
                <div className="flex flex-wrap gap-2">
                  {activeSocials.map((platform) => {
                    const Icon = platform.icon;
                    const username = socialLinks[platform.key as keyof SocialLinks];
                    return (
                      <a key={platform.key} href={platform.url(username!)} target="_blank" rel="noopener noreferrer"
                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium bg-muted/40 text-muted-foreground transition-all border border-transparent hover:border-primary/20 ${platform.color}`}>
                        <Icon className="w-3.5 h-3.5" />
                        <span>{platform.label}</span>
                      </a>
                    );
                  })}
                </div>
              </SectionCard>
            )}

            {latestPost && (
              <SectionCard title="Featured Activity" icon={MessageSquare} delay={0.3}>
                <div className="rounded-lg bg-muted/30 p-4 space-y-3">
                  <div className="flex items-center gap-2 text-xs">
                    <span className="text-destructive font-semibold">Post</span>
                    <span className="text-muted-foreground">·</span>
                    <span className="text-muted-foreground">{formatDistanceToNow(new Date(latestPost.created_at), { addSuffix: true })}</span>
                  </div>
                  <div className="text-sm text-foreground line-clamp-3">
                    <MarkdownContent content={latestPost.content} />
                  </div>
                </div>
              </SectionCard>
            )}

            {/* Private Stats */}
            <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="rounded-xl border border-border p-5 space-y-4">
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Eye className="w-3.5 h-3.5" />
                <span className="font-medium">Private to you</span>
              </div>
              <div className="grid grid-cols-3 gap-3">
                <div className="text-center p-3 rounded-xl bg-muted/30">
                  <CheckCircle className="w-5 h-5 mx-auto text-emerald-500 mb-1" />
                  <p className="text-lg font-bold">{completedTasks}</p>
                  <p className="text-[10px] text-muted-foreground">Tasks Done</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/30">
                  <Flame className="w-5 h-5 mx-auto text-orange-500 mb-1" />
                  <p className="text-lg font-bold">{profile.visit_streak}</p>
                  <p className="text-[10px] text-muted-foreground">Day Streak</p>
                </div>
                <div className="text-center p-3 rounded-xl bg-muted/30">
                  <Award className="w-5 h-5 mx-auto text-amber-500 mb-1" />
                  <p className="text-lg font-bold">{badgeCount}</p>
                  <p className="text-[10px] text-muted-foreground">Badges</p>
                </div>
              </div>
            </motion.div>

            {/* Member Since */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.4 }} className="flex items-center justify-center gap-2 text-xs text-muted-foreground py-2">
              <Calendar className="w-3.5 h-3.5 text-primary/60" />
              <span>Member since {new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
            </motion.div>
          </>
        )}

        {activeTab === 'posts' && (
          <div className="space-y-3">
            {myPosts.length === 0 ? (
              <EmptyState
                icon={<FileText className="h-12 w-12 text-muted-foreground" />}
                title="No posts yet"
                description="Your classroom posts will appear here."
              />
            ) : (
              myPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </div>
        )}

        {activeTab === 'bookmarks' && (
          <div className="space-y-3">
            {bookmarkedPosts.length === 0 ? (
              <EmptyState
                icon={<Bookmark className="h-12 w-12 text-muted-foreground" />}
                title="No bookmarks"
                description="Posts you bookmark will appear here."
              />
            ) : (
              bookmarkedPosts.map(post => (
                <PostCard key={post.id} post={post} />
              ))
            )}
          </div>
        )}
      </div>

      <ProfileEditSheet open={editSheetOpen} onOpenChange={setEditSheetOpen} />
      <ProfileShareSheet open={shareSheetOpen} onOpenChange={setShareSheetOpen} />
    </div>
  );
}

function SectionCard({ title, icon: Icon, children, delay = 0 }: {
  title: string; icon: React.ElementType; children: React.ReactNode; delay?: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }} className="rounded-xl border border-border p-5 space-y-3">
      <h3 className="font-semibold text-base flex items-center gap-2">
        <Icon className="w-4 h-4 text-muted-foreground" />
        {title}
      </h3>
      {children}
    </motion.div>
  );
}

function InfoItem({ label, value, privacy }: { label: string; value: string; privacy?: boolean }) {
  return (
    <div>
      <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium mb-0.5">{label}</p>
      <div className="flex items-center gap-1">
        <p className="text-sm font-semibold">{value}</p>
        {privacy && <EyeOff className="w-3 h-3 text-muted-foreground" />}
      </div>
    </div>
  );
}

function ProfilePageSkeleton() {
  return (
    <div className="pb-24">
      <div className="mx-4 mt-4"><Skeleton className="h-[120px] rounded-2xl" /></div>
      <div className="px-4 -mt-12 space-y-4">
        <Skeleton className="w-24 h-24 rounded-full" />
        <Skeleton className="h-7 w-40" />
        <Skeleton className="h-4 w-32" />
        <div className="flex gap-2">
          <Skeleton className="h-10 w-28 rounded-full" />
          <Skeleton className="h-10 w-20 rounded-full" />
        </div>
      </div>
      <div className="px-4 mt-6 space-y-4">
        <Skeleton className="h-24 rounded-xl" />
        <Skeleton className="h-32 rounded-xl" />
      </div>
    </div>
  );
}

export default ProfilePage;
