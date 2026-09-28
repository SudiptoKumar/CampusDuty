import { useState, useRef, useCallback, useEffect } from 'react';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';
import { toast } from 'sonner';
import { motion, AnimatePresence } from 'framer-motion';
import { Pin, Trash2, BadgeCheck, Edit2, FileText, Download, MoreHorizontal, Bookmark, Share2, Lock, User, Mail, ThumbsUp, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { useAuth } from '@/features/auth';
import { usePermission, type AppRole } from '@/hooks/usePermission';
import { useProfile } from '@/hooks/useProfile';
import {
  usePostReactions, useToggleReaction, usePostComments,
  useDeletePost, useTogglePinPost, useToggleBookmark, useBookmarks,
} from '@/hooks/useClassroomPosts';
import { MarkdownContent } from './MarkdownContent';
import { EditPostSheet } from './EditPostSheet';
import { UserProfileSheet } from './UserProfileSheet';
import { MessageSheet } from '@/features/marketplace/components/MessageSheet';
import { useNavigate } from 'react-router-dom';

const REACTION_EMOJIS = ['👍', '❤️', '🔥', '👏', '💡', '😂'];
const MAX_CONTENT_HEIGHT = 200;

interface PostCardProps {
  post: {
    id: string;
    user_id: string;
    content: string;
    is_pinned: boolean;
    is_published: boolean;
    scheduled_at: string | null;
    created_at: string;
    visibility?: string;
    tags?: string[];
    attachments?: { name: string; url: string; type: string; size: number }[];
    author?: {
      name: string;
      avatar_url: string | null;
      username?: string | null;
      role: AppRole;
      bio?: string | null;
      headline?: string | null;
    };
  };
  onTagClick?: (tag: string) => void;
  forceExpanded?: boolean;
}

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = differenceInSeconds(now, date);

  if (seconds < 60) return 'now';

  const str = formatDistanceToNow(date, { addSuffix: false })
    .replace('about ', '')
    .replace('less than a minute', 'now')
    .replace(' minutes', 'm')
    .replace(' minute', 'm')
    .replace(' hours', 'h')
    .replace(' hour', 'h')
    .replace(' days', 'd')
    .replace(' day', 'd')
    .replace(' months', 'mo')
    .replace(' month', 'mo');
  return str;
}

export function PostCard({ post, onTagClick, forceExpanded = false }: PostCardProps) {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { data: profile } = useProfile();
  const { isCR, isAdmin } = usePermission('student');
  const [isEditing, setIsEditing] = useState(false);
  const [profileUserId, setProfileUserId] = useState<string | null>(null);
  const [chatOpen, setChatOpen] = useState(false);
  const [showReactionPicker, setShowReactionPicker] = useState(false);
  const [isExpanded, setIsExpanded] = useState(forceExpanded);
  const [needsTruncation, setNeedsTruncation] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const longPressTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pickerRef = useRef<HTMLDivElement>(null);

  const { data: reactions = [] } = usePostReactions(post.id);
  const { data: comments = [] } = usePostComments(post.id);
  const { data: bookmarks = [] } = useBookmarks();
  const toggleReaction = useToggleReaction();
  const deletePost = useDeletePost();
  const togglePin = useTogglePinPost();
  const toggleBookmark = useToggleBookmark();

  const isOwnPost = user?.id === post.user_id;
  const canDelete = isOwnPost || isAdmin;
  const canEdit = isOwnPost || isAdmin;
  const canPin = isCR || isAdmin;
  const isBookmarked = bookmarks.some(b => b.post_id === post.id);
  const isPrivate = post.visibility === 'private';

  // Measure content height for truncation
  useEffect(() => {
    if (contentRef.current) {
      setNeedsTruncation(contentRef.current.scrollHeight > MAX_CONTENT_HEIGHT);
    }
  }, [post.content]);

  // Reaction logic
  const userReaction = reactions.find(r => r.user_id === user?.id)?.emoji || null;
  const reactionGroups = reactions.reduce<Record<string, number>>((acc, r) => {
    acc[r.emoji] = (acc[r.emoji] || 0) + 1;
    return acc;
  }, {});
  const totalReactions = reactions.length;

  const handleReact = useCallback((emoji: string) => {
    toggleReaction.mutate({ postId: post.id, emoji });
    setShowReactionPicker(false);
  }, [post.id, toggleReaction]);

  const handleDefaultLike = useCallback(() => {
    handleReact(userReaction || '👍');
  }, [handleReact, userReaction]);

  const handleBookmark = () => toggleBookmark.mutate(post.id);

  // Long press for mobile
  const handleTouchStart = useCallback(() => {
    longPressTimer.current = setTimeout(() => {
      setShowReactionPicker(true);
    }, 500);
  }, []);

  const handleTouchEnd = useCallback(() => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  }, []);

  // Close picker on outside click
  useEffect(() => {
    if (!showReactionPicker) return;
    const handler = (e: MouseEvent | TouchEvent) => {
      if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
        setShowReactionPicker(false);
      }
    };
    document.addEventListener('mousedown', handler);
    document.addEventListener('touchstart', handler);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('touchstart', handler);
    };
  }, [showReactionPicker]);

  const handleShare = async () => {
    const slug = (post as any).share_slug;
    const username = post.author?.username;
    const baseUrl = 'https://campusduty.lovable.app';
    const url = username && slug
      ? `${baseUrl}/u/${username}/p/${slug}`
      : slug ? `${baseUrl}/p/${slug}` : '';
    if (!url) return;
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied!');
    } catch {
      toast.error('Failed to copy link');
    }
  };

  const handleContentClick = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('a') || target.closest('button') || target.closest('iframe') || window.getSelection()?.toString()) return;
    navigate(`/classroom/post/${post.id}`);
  };

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

  const handleViewProfile = () => {
    if (isOwnPost) {
      navigate('/profile');
    } else if (post.author?.username) {
      navigate(`/u/${post.author.username}`);
    } else {
      setProfileUserId(post.user_id);
    }
  };

  const timeAgo = formatTimeAgo(post.created_at);

  const roleLabel = post.author?.role === 'cr' ? 'Class Representative' :
    post.author?.role === 'admin' ? 'Admin' :
    post.author?.role === 'super_admin' ? 'Super Admin' : null;

  const reactionButtonColor = userReaction ? 'text-primary' : 'text-muted-foreground';

  return (
    <motion.article
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-xl border border-border bg-card overflow-hidden"
    >
      {/* Pinned indicator */}
      {post.is_pinned && (
        <div className="px-4 pt-2 flex items-center gap-1.5 text-xs text-muted-foreground">
          <Pin className="h-3 w-3" />
          <span>Pinned post</span>
        </div>
      )}

      {/* ── Header ── */}
      <div className="px-4 pt-3 pb-0 flex items-start gap-3">
        <Popover>
          <PopoverTrigger asChild>
            <button className="shrink-0">
              <Avatar className="h-12 w-12 hover:opacity-80 transition-opacity">
                <AvatarImage src={post.author?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {post.author?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
            </button>
          </PopoverTrigger>
          <PopoverContent className="w-64 p-3" align="start">
            <div className="flex items-start gap-3 mb-3">
              <Avatar className="h-12 w-12 shrink-0">
                <AvatarImage src={post.author?.avatar_url || undefined} />
                <AvatarFallback className="bg-primary/10 text-primary font-semibold">
                  {post.author?.name?.charAt(0) || '?'}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-sm truncate">{post.author?.name}</span>
                  {post.author?.role === 'cr' && <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
                </div>
                {post.author?.username && (
                  <p className="text-xs text-muted-foreground">@{post.author.username}</p>
                )}
                {post.author?.headline && (
                  <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{post.author.headline}</p>
                )}
              </div>
            </div>
            <div className="space-y-1">
              <button onClick={handleViewProfile} className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                <User className="h-4 w-4 text-muted-foreground" /> View Profile
              </button>
              {!isOwnPost && (
                <button onClick={() => setChatOpen(true)} className="flex items-center gap-2 w-full px-3 py-2 text-sm rounded-md hover:bg-muted transition-colors">
                  <Mail className="h-4 w-4 text-muted-foreground" /> Message
                </button>
              )}
            </div>
          </PopoverContent>
        </Popover>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1 flex-wrap text-sm">
            <button onClick={handleViewProfile} className="font-bold hover:underline truncate max-w-[140px]">
              {post.author?.name}
            </button>
            {post.author?.role === 'cr' && <BadgeCheck className="h-3.5 w-3.5 text-primary shrink-0" />}
            {post.author?.username && (
              <>
                <span className="text-muted-foreground">•</span>
                <span className="text-xs text-muted-foreground truncate max-w-[100px]">@{post.author.username}</span>
              </>
            )}
            <span className="text-muted-foreground">•</span>
            <span className="text-xs text-muted-foreground">{timeAgo}</span>
            {isPrivate && <Lock className="h-3 w-3 text-muted-foreground" />}
          </div>
          <p className="text-xs text-muted-foreground truncate leading-tight mt-0.5">
            {post.author?.headline || roleLabel || ''}
          </p>
        </div>

        {/* More menu */}
        {(canEdit || canDelete || canPin) && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="p-1.5 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition-colors shrink-0 -mt-0.5">
                <MoreHorizontal className="h-5 w-5" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-44">
              {canEdit && (
                <DropdownMenuItem onClick={() => setIsEditing(true)}>
                  <Edit2 className="h-4 w-4 mr-2" /> Edit
                </DropdownMenuItem>
              )}
              {canPin && (
                <DropdownMenuItem onClick={() => togglePin.mutate({ postId: post.id, isPinned: post.is_pinned })}>
                  <Pin className="h-4 w-4 mr-2" /> {post.is_pinned ? 'Unpin' : 'Pin'}
                </DropdownMenuItem>
              )}
              {canDelete && (
                <DropdownMenuItem onClick={() => deletePost.mutate(post.id)} className="text-destructive focus:text-destructive">
                  <Trash2 className="h-4 w-4 mr-2" /> Delete
                </DropdownMenuItem>
              )}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </div>

      {/* ── Body with Read More ── */}
      <div className="relative">
        <motion.div
          ref={contentRef}
          animate={{ height: isExpanded || !needsTruncation ? 'auto' : MAX_CONTENT_HEIGHT }}
          transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
          className={`overflow-hidden ${needsTruncation ? 'min-h-[260px]' : ''}`}
        >
          <div
            onClick={handleContentClick}
            className="px-4 pt-4 pb-4 text-[15px] leading-relaxed cursor-pointer [&_pre]:mx-[-1rem] [&_pre]:px-4 [&_pre]:rounded-none [&_img]:mx-[-1rem] [&_img]:w-[calc(100%+2rem)] [&_img]:max-w-none"
          >
            <MarkdownContent content={post.content} />
          </div>
        </motion.div>

        {/* Fade overlay when collapsed */}
        {needsTruncation && !isExpanded && (
          <div
            className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
            style={{ background: 'linear-gradient(to bottom, transparent, hsl(var(--card)))' }}
          />
        )}
      </div>

      {/* See More / Show Less button */}
      {needsTruncation && !forceExpanded && (
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="w-full pb-3 pt-1 flex flex-col items-center justify-center text-xs font-medium text-primary hover:text-primary/80 transition-colors"
        >
          {isExpanded ? (
            <><span>Show Less</span><ChevronUp className="h-4 w-4 mt-0.5" /></>
          ) : (
            <><span>See More</span><ChevronDown className="h-4 w-4 mt-0.5" /></>
          )}
        </button>
      )}

      {/* Tags — always visible above reactions */}
      {post.tags && post.tags.length > 0 && (
        <div className="px-4 pb-2 flex flex-wrap gap-1.5">
          {post.tags.map(tag => (
            <button key={tag} onClick={() => onTagClick?.(tag)}
              className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors">
              {tag}
            </button>
          ))}
        </div>
      )}

      {/* Attachments */}
      {post.attachments && (post.attachments as any[]).length > 0 && (() => {
        const atts = post.attachments as { name: string; url: string; type: string; size: number }[];
        const imageAtts = atts.filter(a => a.type.startsWith('image/'));
        const fileAtts = atts.filter(a => !a.type.startsWith('image/'));
        return (
          <>
            {imageAtts.length > 0 && (
              <div className="px-4 pb-2 space-y-2">
                {imageAtts.map((att, i) => (
                  <div key={i} onClick={() => navigate(`/classroom/post/${post.id}`)} className="block cursor-pointer">
                    <img src={att.url} alt={att.name} className="w-full rounded-xl object-cover max-h-[400px] border border-border" loading="lazy" />
                  </div>
                ))}
              </div>
            )}
             {fileAtts.length > 0 && (
              <div className="px-4 pb-2 space-y-2">
                {fileAtts.map((att, i) => {
                  const isPreviewable = att.type === 'application/pdf' || att.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || att.type === 'application/msword' || att.name.endsWith('.pdf') || att.name.endsWith('.docx') || att.name.endsWith('.doc');
                  return isPreviewable ? (
                    <div key={i} className="rounded-xl border border-border overflow-hidden">
                      <iframe
                        src={`https://docs.google.com/gview?url=${encodeURIComponent(att.url)}&embedded=true`}
                        className="w-full h-[200px]"
                        title={att.name}
                      />
                      <button
                        onClick={() => handleDownload(att.url, att.name)}
                        className="flex items-center gap-1.5 px-3 py-2 text-xs hover:bg-muted transition-colors border-t border-border w-full">
                        <FileText className="w-3.5 h-3.5 text-primary" />
                        <span className="truncate flex-1 text-left">{att.name}</span>
                        <Download className="w-3 h-3 text-muted-foreground" />
                      </button>
                    </div>
                  ) : (
                    <button key={i} onClick={() => handleDownload(att.url, att.name)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-muted hover:bg-muted/80 text-xs transition-colors">
                      <FileText className="w-3.5 h-3.5 text-primary" />
                      <span className="truncate max-w-[140px]">{att.name}</span>
                      <Download className="w-3 h-3 text-muted-foreground" />
                    </button>
                  );
                })}
              </div>
            )}
          </>
        );
      })()}

      {/* ── Stats bar ── */}
      {(totalReactions > 0 || comments.length > 0) && (
        <div className="px-4 py-2 flex items-center justify-between text-xs text-muted-foreground">
          <div className="flex items-center gap-1.5">
            {Object.entries(reactionGroups).map(([emoji, count]) => (
              <span key={emoji} className="flex items-center gap-0.5">
                <span className="text-sm">{emoji}</span>
                <span>{count}</span>
              </span>
            ))}
          </div>
          {comments.length > 0 && (
            <button onClick={() => navigate(`/classroom/post/${post.id}`)} className="hover:underline hover:text-foreground transition-colors">
              {comments.length} comment{comments.length !== 1 ? 's' : ''}
            </button>
          )}
        </div>
      )}

      {/* ── Action bar ── */}
      <Separator />
      <div className="grid grid-cols-4">
        {/* Like button with reaction picker */}
        <div
          className="relative"
          ref={pickerRef}
          onMouseEnter={() => setShowReactionPicker(true)}
          onMouseLeave={() => setShowReactionPicker(false)}
        >
          <AnimatePresence>
            {showReactionPicker && (
              <motion.div
                initial={{ opacity: 0, y: 4, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: 4, scale: 0.95 }}
                transition={{ duration: 0.15 }}
                className="absolute bottom-full left-0 mb-1 flex items-center gap-0.5 bg-card border border-border rounded-full px-2 py-1.5 shadow-lg z-50"
              >
                {REACTION_EMOJIS.map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => handleReact(emoji)}
                    className="text-xl hover:scale-125 transition-transform px-1 py-0.5 rounded-full hover:bg-muted"
                  >
                    {emoji}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
          <button
            onClick={handleDefaultLike}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
            className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors hover:bg-muted w-full ${reactionButtonColor}`}
          >
            {userReaction ? (
              <span className="text-base leading-none">{userReaction}</span>
            ) : (
              <ThumbsUp className="h-4 w-4" />
            )}
            <span className="hidden sm:inline">{userReaction ? 'Liked' : 'Like'}</span>
          </button>
        </div>

        <button onClick={() => navigate(`/classroom/post/${post.id}`)}
          className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          <MessageSquare className="h-4 w-4" />
          <span className="hidden sm:inline">Comment</span>
        </button>
        <button onClick={handleBookmark}
          className={`flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors hover:bg-muted ${isBookmarked ? 'text-primary' : 'text-muted-foreground'}`}>
          <Bookmark className={`h-4 w-4 ${isBookmarked ? 'fill-current' : ''}`} />
          <span className="hidden sm:inline">Save</span>
        </button>
        <button onClick={handleShare}
          className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium text-muted-foreground hover:bg-muted transition-colors">
          <Share2 className="h-4 w-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>


      <EditPostSheet open={isEditing} onOpenChange={setIsEditing} post={post} />
      <UserProfileSheet open={!!profileUserId} onOpenChange={open => !open && setProfileUserId(null)} userId={profileUserId} />
      {!isOwnPost && post.author && (
        <MessageSheet open={chatOpen} onOpenChange={setChatOpen} otherUserId={post.user_id} otherUserName={post.author.name} otherUserAvatar={post.author.avatar_url || undefined} otherUserUsername={post.author.username || undefined} contextType="classroom" />
      )}
    </motion.article>
  );
}
