import { useState } from 'react';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { Clock, Edit2, Trash2, Calendar, Send } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/shared';
import { Skeleton } from '@/components/ui/skeleton';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { useScheduledPosts, useDeletePost, usePublishNow } from '@/hooks/useClassroomPosts';
import { EditPostSheet } from './EditPostSheet';
import { MarkdownContent } from './MarkdownContent';

export function ScheduledPostsTab() {
  const { data: scheduledPosts, isLoading } = useScheduledPosts();
  const deletePost = useDeletePost();
  const publishNow = usePublishNow();
  
  const [editingPost, setEditingPost] = useState<typeof scheduledPosts extends (infer T)[] ? T : never | null>(null);
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null);

  const handleDelete = () => {
    if (deletingPostId) {
      deletePost.mutate(deletingPostId, {
        onSuccess: () => setDeletingPostId(null),
      });
    }
  };

  const handlePublishNow = (postId: string) => {
    publishNow.mutate(postId);
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[...Array(2)].map((_, i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    );
  }

  if (!scheduledPosts?.length) {
    return (
      <EmptyState
        icon={<Clock className="h-12 w-12 text-muted-foreground" />}
        title="No scheduled posts"
        description="Posts you schedule will appear here. You can edit or cancel them before they're published."
      />
    );
  }

  return (
    <>
      <div className="space-y-4">
        {scheduledPosts.map((post) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <Card className="border-dashed border-primary/30">
              <CardContent className="p-4">
                {/* Scheduled Badge */}
                <div className="flex items-center justify-between mb-3">
                  <Badge variant="secondary" className="gap-1.5">
                    <Calendar className="h-3 w-3" />
                    {post.scheduled_at && format(new Date(post.scheduled_at), 'PPP \'at\' p')}
                  </Badge>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setEditingPost(post)}
                    >
                      <Edit2 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-destructive hover:text-destructive"
                      onClick={() => setDeletingPostId(post.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                {/* Content Preview */}
                <div className="mb-3 text-sm line-clamp-4">
                  <MarkdownContent content={post.content} />
                </div>
                
                {/* Actions */}
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-1.5"
                    onClick={() => handlePublishNow(post.id)}
                    disabled={publishNow.isPending}
                  >
                    <Send className="h-3.5 w-3.5" />
                    Publish Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </div>
      
      {/* Edit Sheet */}
      {editingPost && (
        <EditPostSheet
          open={!!editingPost}
          onOpenChange={(open) => !open && setEditingPost(null)}
          post={editingPost}
        />
      )}
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deletingPostId} onOpenChange={(open) => !open && setDeletingPostId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Cancel scheduled post?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the scheduled post. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Keep it</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
