import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { GraduationCap, Heart, MessageCircle, BadgeCheck, Sparkles, FileText, Image as ImageIcon, Download } from 'lucide-react';
import { MarkdownContent } from './components/MarkdownContent';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '@/features/auth/AuthProvider';
import { toast } from 'sonner';
import { LiquidEffectAnimation } from '@/components/ui/liquid-effect-animation';

interface PublicPost {
  id: string;
  user_id: string;
  content: string;
  created_at: string;
  is_pinned: boolean;
  faculty: string;
  semester: number;
  tags: string[];
  attachments: any;
  share_slug: string;
  author_name: string;
  author_username: string;
  author_avatar_url: string;
  author_role: string;
  author_headline: string;
  reaction_count: number;
  comment_count: number;
}

function usePublicPost(slug: string | undefined) {
  return useQuery({
    queryKey: ['public-post', slug],
    queryFn: async () => {
      if (!slug) return null;
      const { data, error } = await supabase.rpc('get_public_post_by_slug', { _slug: slug });
      if (error) throw error;
      if (!data || data.length === 0) return null;
      return data[0] as unknown as PublicPost;
    },
    enabled: !!slug,
    staleTime: 1000 * 60 * 5,
  });
}

const handleDownload = async (url: string, filename: string) => {
  try {
    const response = await fetch(url);
    const blob = await response.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = blobUrl;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(blobUrl);
  } catch {
    toast.error('Download failed');
  }
};

export function PublicPostPage() {
  const { slug } = useParams<{ username: string; slug: string }>();
  const { data: post, isLoading, error } = usePublicPost(slug);
  const { user } = useAuth();

  if (isLoading) return <PostSkeleton />;
  if (error || !post) return <PostNotFound />;

  const initials = post.author_name?.charAt(0) || '?';
  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: false })
    .replace('about ', '').replace(' minutes', 'm').replace(' minute', 'm')
    .replace(' hours', 'h').replace(' hour', 'h').replace(' days', 'd').replace(' day', 'd')
    .replace(' months', 'mo').replace(' month', 'mo').replace('less than a m', '1m');

  const attachments = Array.isArray(post.attachments) ? post.attachments : [];
  const imageAttachments = attachments.filter((att: any) => att.type?.startsWith('image/'));
  const docAttachments = attachments.filter((att: any) => !att.type?.startsWith('image/'));

  return (
    <div className="min-h-screen bg-background">
      {/* Header with liquid */}
      <header className="sticky top-0 z-50 border-b border-border/50 overflow-hidden">
        <div className="absolute inset-0">
          <LiquidEffectAnimation metalness={0.85} roughness={0.2} displacementScale={2} />
          <div className="absolute inset-0 bg-background/80 backdrop-blur-xl" />
        </div>
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between relative z-10">
          <Link to="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <div className="w-8 h-8 rounded-xl bg-primary/10 flex items-center justify-center">
              <GraduationCap className="w-5 h-5 text-primary" />
            </div>
            <span className="font-semibold text-sm">Campus Duty</span>
          </Link>
          {!user && (
            <Link to="/login"><Button variant="ghost" size="sm" className="rounded-full text-xs">Login</Button></Link>
          )}
        </div>
      </header>

      <main className="max-w-2xl mx-auto p-4">
        {/* Post Card */}
        <motion.article
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl border border-border bg-card overflow-hidden"
        >
          {/* Author header */}
          <div className="px-4 pt-3 pb-2 flex gap-3 items-start">
            <Link to={post.author_username ? `/u/${post.author_username}` : '#'} className="shrink-0 mt-0.5">
              <Avatar className="h-10 w-10 hover:opacity-80 transition-opacity">
                <AvatarImage src={post.author_avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-semibold">{initials}</AvatarFallback>
              </Avatar>
            </Link>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1 flex-wrap">
                <Link to={post.author_username ? `/u/${post.author_username}` : '#'} className="font-bold text-[15px] leading-5 hover:underline truncate max-w-[140px]">
                  {post.author_name}
                </Link>
                {post.author_role === 'cr' && <BadgeCheck className="h-4 w-4 text-primary shrink-0" />}
                {post.author_username && (
                  <span className="text-muted-foreground text-[13px] truncate max-w-[100px]">· @{post.author_username}</span>
                )}
                <span className="text-muted-foreground text-[13px] shrink-0">· {timeAgo}</span>
              </div>
              {post.author_headline && (
                <p className="text-muted-foreground text-[12px] leading-tight truncate mt-0.5">{post.author_headline}</p>
              )}
            </div>
          </div>

          {/* Content - full bleed */}
          <div className="px-4 pb-3 text-[15px] leading-relaxed">
            <MarkdownContent content={post.content} />
          </div>

          {/* Tags */}
          {post.tags && post.tags.length > 0 && (
            <div className="px-4 pb-3 flex flex-wrap gap-1.5">
              {post.tags.map(tag => (
                <span key={tag} className="text-[11px] px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium">{tag}</span>
              ))}
            </div>
          )}

          {/* Image attachments - inline previews */}
          {imageAttachments.length > 0 && (
            <div className="px-4 pb-3 space-y-2">
              {imageAttachments.map((att: any, i: number) => (
                <img key={i} src={att.url} alt={att.name || 'Attachment'} className="w-full rounded-lg object-cover max-h-[400px]" loading="lazy" />
              ))}
            </div>
          )}

          {/* Document attachments - previews + download */}
          {docAttachments.length > 0 && (
            <div className="px-4 pb-3 space-y-2">
              {docAttachments.map((att: any, i: number) => {
                const isPdf = att.type === 'application/pdf';
                const isDocx = att.type?.includes('word') || att.name?.match(/\.docx?$/i);
                const isPreviewable = isPdf || isDocx;

                return (
                  <div key={i} className="rounded-lg border border-border overflow-hidden">
                    {isPreviewable && (
                      <iframe
                        src={`https://docs.google.com/gview?url=${encodeURIComponent(att.url)}&embedded=true`}
                        className="w-full h-[300px] border-0"
                        title={att.name}
                      />
                    )}
                    <button
                      onClick={() => handleDownload(att.url, att.name)}
                      className="w-full flex items-center gap-2 px-3 py-2.5 bg-muted hover:bg-muted/80 text-sm transition-colors"
                    >
                      <FileText className="w-4 h-4 text-primary shrink-0" />
                      <span className="truncate flex-1 text-left">{att.name}</span>
                      <Download className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    </button>
                  </div>
                );
              })}
            </div>
          )}

          {/* Read-only stats */}
          <div className="px-4 pb-3 flex items-center gap-4 text-muted-foreground text-xs">
            <span className="flex items-center gap-1">
              <Heart className="h-4 w-4" /> {post.reaction_count}
            </span>
            <span className="flex items-center gap-1">
              <MessageCircle className="h-4 w-4" /> {post.comment_count}
            </span>
          </div>
        </motion.article>

        {/* CTA for non-users */}
        {!user && (
          <motion.div initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="mt-6 rounded-xl border border-border p-6 text-center space-y-3">
            <div className="flex justify-center">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center"><GraduationCap className="w-6 h-6 text-primary" /></div>
            </div>
            <div className="space-y-1">
              <h3 className="text-base font-bold">Join Campus Duty</h3>
              <p className="text-xs text-muted-foreground">Sign up to interact with posts and connect with classmates</p>
            </div>
            <div className="flex gap-3 justify-center">
              <Link to="/signup"><Button size="sm" className="gap-2 rounded-full"><Sparkles className="w-3.5 h-3.5" />Get Started</Button></Link>
              <Link to="/login"><Button variant="outline" size="sm" className="rounded-full">Sign in</Button></Link>
            </div>
          </motion.div>
        )}
      </main>

      {/* Footer */}
      <footer className="pt-4 pb-8 px-4">
        <div className="max-w-2xl mx-auto flex flex-col items-center gap-3">
          <div className="w-full h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <Link to="/" className="flex items-center gap-2.5 text-muted-foreground hover:text-foreground transition-colors group">
            <div className="w-7 h-7 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors"><GraduationCap className="w-4 h-4 text-primary" /></div>
            <span className="text-sm font-medium">Campus Duty</span>
          </Link>
          <p className="text-xs text-muted-foreground/70">Your academic companion • Made with ❤️ for students</p>
        </div>
      </footer>
    </div>
  );
}

function PostNotFound() {
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
          <div className="w-24 h-24 mx-auto rounded-full bg-muted/50 flex items-center justify-center"><MessageCircle className="w-12 h-12 text-muted-foreground" /></div>
          <h1 className="text-2xl font-bold">Post Not Found</h1>
          <p className="text-muted-foreground max-w-xs mx-auto">This post may have been deleted or is not publicly available.</p>
          <Link to="/signup"><Button className="gap-2 mt-4 rounded-full"><GraduationCap className="w-4 h-4" />Join Campus Duty</Button></Link>
        </motion.div>
      </main>
    </div>
  );
}

function PostSkeleton() {
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 backdrop-blur-xl bg-background/80 border-b border-border/50">
        <div className="max-w-2xl mx-auto px-4 h-14 flex items-center justify-between"><Skeleton className="h-8 w-32" /><Skeleton className="h-8 w-16 rounded-full" /></div>
      </header>
      <main className="max-w-2xl mx-auto p-4">
        <div className="rounded-xl border border-border bg-card p-4 flex gap-3">
          <Skeleton className="h-10 w-10 rounded-full shrink-0" />
          <div className="flex-1 space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
          </div>
        </div>
      </main>
    </div>
  );
}

export default PublicPostPage;
