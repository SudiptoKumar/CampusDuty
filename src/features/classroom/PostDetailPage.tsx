import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Send } from 'lucide-react';
import { motion } from 'framer-motion';
import { formatDistanceToNow, differenceInSeconds } from 'date-fns';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/features/auth';
import { useProfile } from '@/hooks/useProfile';
import { useClassroomPosts, usePostComments, useCreateComment, useDeleteComment } from '@/hooks/useClassroomPosts';
import { PostCard } from './components/PostCard';

function formatTimeAgo(dateString: string): string {
  const now = new Date();
  const date = new Date(dateString);
  const seconds = differenceInSeconds(now, date);
  if (seconds < 60) return 'now';
  const str = formatDistanceToNow(date, { addSuffix: false })
    .replace('about ', '')
    .replace('less than a minute', 'now')
    .replace(' minutes', 'm').replace(' minute', 'm')
    .replace(' hours', 'h').replace(' hour', 'h')
    .replace(' days', 'd').replace(' day', 'd')
    .replace(' months', 'mo').replace(' month', 'mo');
  return str;
}

export function PostDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { data: profile } = useProfile();
  const { data: posts, isLoading: postsLoading } = useClassroomPosts();
  const { data: comments = [], isLoading: commentsLoading } = usePostComments(id || '');
  const createComment = useCreateComment();
  const deleteComment = useDeleteComment();
  const [newComment, setNewComment] = useState('');

  const post = posts?.find(p => p.id === id);

  const handleSubmitComment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim() || !id) return;
    createComment.mutate({ postId: id, content: newComment.trim() });
    setNewComment('');
  };

  if (postsLoading) {
    return (
      <div className="max-w-[600px] mx-auto p-4 space-y-4">
        <Skeleton className="h-8 w-24" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
    );
  }

  if (!post) {
    return (
      <div className="max-w-[600px] mx-auto p-4">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4">
          <ArrowLeft className="w-4 h-4" /> Back
        </button>
        <p className="text-center text-muted-foreground py-16">Post not found</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Header */}
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur-md border-b border-border px-4 py-3 flex items-center gap-3">
        <button onClick={() => navigate('/classroom')} className="p-1.5 rounded-full hover:bg-muted transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-sm font-semibold">Post</h1>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-auto">
        <div className="max-w-[600px] mx-auto w-full">
          <div className="p-3">
            <PostCard post={post} forceExpanded />
          </div>

          <Separator />

          {/* Comments section */}
          <div className="px-4 py-4 space-y-4">
            <h2 className="text-sm font-semibold">
              Comments {comments.length > 0 && `(${comments.length})`}
            </h2>

            {commentsLoading ? (
              <div className="space-y-3">
                {[1, 2].map(i => (
                  <div key={i} className="flex gap-2.5">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="flex-1 space-y-1.5">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-3 w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : comments.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">No comments yet. Be the first to comment!</p>
            ) : (
              <div className="space-y-4">
                {comments.map(comment => (
                  <motion.div
                    key={comment.id}
                    initial={{ opacity: 0, y: 4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex gap-2.5"
                  >
                    <Avatar className="h-9 w-9 shrink-0">
                      <AvatarImage src={comment.author?.avatar_url || undefined} />
                      <AvatarFallback className="text-[10px] bg-muted">{comment.author?.name?.charAt(0) || '?'}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <div className="bg-muted rounded-xl px-3.5 py-2.5">
                        <div className="mb-1">
                          <p className="text-xs font-bold leading-tight">{comment.author?.name}</p>
                          {(comment.author as any)?.headline && (
                            <p className="text-[11px] text-muted-foreground leading-tight truncate">{(comment.author as any).headline}</p>
                          )}
                        </div>
                        <p className="text-[13px] leading-snug">{comment.content}</p>
                      </div>
                      <div className="flex items-center gap-3 mt-1 px-1 text-[11px] text-muted-foreground">
                        <span>{formatTimeAgo(comment.created_at)}</span>
                        <button className="hover:text-foreground font-medium transition-colors">Like</button>
                        {comment.user_id === user?.id && (
                          <button
                            onClick={() => deleteComment.mutate({ commentId: comment.id, postId: post.id })}
                            className="hover:text-destructive font-medium transition-colors"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Sticky comment input */}
      <div className="sticky bottom-0 z-50 bg-background/95 backdrop-blur-md border-t border-border p-3">
        <form onSubmit={handleSubmitComment} className="max-w-[600px] mx-auto flex gap-2 items-center">
          <Avatar className="h-8 w-8 shrink-0">
            <AvatarImage src={profile?.avatar_url || undefined} />
            <AvatarFallback className="text-[11px] bg-primary/10 text-primary font-semibold">
              {profile?.name?.charAt(0) || user?.email?.charAt(0)?.toUpperCase() || '?'}
            </AvatarFallback>
          </Avatar>
          <Input
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 h-9 text-sm rounded-full bg-muted border-0 px-4"
          />
          <Button type="submit" size="icon" variant="ghost" disabled={!newComment.trim() || createComment.isPending} className="h-8 w-8 rounded-full shrink-0">
            <Send className="h-3.5 w-3.5" />
          </Button>
        </form>
      </div>
    </div>
  );
}

export default PostDetailPage;
