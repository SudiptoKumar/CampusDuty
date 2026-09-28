import { Megaphone, ChevronRight, MessageSquare } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { formatDistanceToNow } from 'date-fns';
import { useUnreadClassroomPosts, markPostAsRead } from '@/hooks/useUnreadClassroomPosts';
import { stripMarkdown } from '@/lib/markdownUtils';

export function ClassroomInboxTile() {
  const { data } = useUnreadClassroomPosts();
  const unreadPosts = data?.posts || [];
  const unreadCount = data?.unreadCount || 0;
  
  const handleMarkRead = (postId: string) => {
    markPostAsRead(postId);
  };
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="col-span-full relative overflow-hidden liquid-glass-card p-4"
    >
      
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <Megaphone className="w-4 h-4 text-amber-500" />
          </div>
          <span className="font-semibold text-sm">Classroom</span>
          {unreadCount > 0 && (
            <span className="px-2 py-0.5 text-xs font-medium bg-red-500 text-white rounded-full">
              {unreadCount} new
            </span>
          )}
        </div>
        <Link 
          to="/classroom"
          aria-label="View all classroom announcements"
          className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5"
        >
          View all <ChevronRight className="w-3 h-3" aria-hidden="true" />
        </Link>
      </div>
      
      {/* Content */}
      {unreadPosts.length > 0 ? (
        <div className="space-y-2">
          {unreadPosts.slice(0, 2).map((post) => (
            <Link
              key={post.id}
              to="/classroom"
              onClick={() => handleMarkRead(post.id)}
              className="flex items-start gap-3 p-3 rounded-xl bg-muted/40 hover:bg-muted/60 transition-colors"
            >
              <div className="w-8 h-8 rounded-lg bg-amber-500/20 flex items-center justify-center flex-shrink-0">
                <MessageSquare className="w-4 h-4 text-amber-600" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{post.authorName}</p>
                <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                  {stripMarkdown(post.content).slice(0, 80)}
                </p>
                <p className="text-[10px] text-muted-foreground/60 mt-1">
                  {formatDistanceToNow(new Date(post.created_at), { addSuffix: true })}
                </p>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <div className="w-12 h-12 mx-auto mb-2 rounded-xl bg-amber-500/10 flex items-center justify-center">
            <span className="text-2xl">📬</span>
          </div>
          <p className="text-sm text-muted-foreground">All caught up! 🎉</p>
          <p className="text-xs text-muted-foreground/60 mt-1">Check back later for new posts from your class</p>
        </div>
      )}
    </motion.div>
  );
}
