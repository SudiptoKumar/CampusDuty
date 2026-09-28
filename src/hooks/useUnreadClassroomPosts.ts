import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth';

// Store read post IDs in localStorage
const READ_POSTS_KEY = 'classroom_read_posts';

function getReadPostIds(): Set<string> {
  try {
    const stored = localStorage.getItem(READ_POSTS_KEY);
    return new Set(stored ? JSON.parse(stored) : []);
  } catch {
    return new Set();
  }
}

export function markPostAsRead(postId: string) {
  const readIds = getReadPostIds();
  readIds.add(postId);
  localStorage.setItem(READ_POSTS_KEY, JSON.stringify([...readIds]));
}

export function markAllClassroomPostsAsRead() {
  // Store timestamp of when user last visited classroom
  localStorage.setItem('classroom_last_visit', Date.now().toString());
}

export function useMarkClassroomVisited() {
  const queryClient = useQueryClient();
  
  return () => {
    markAllClassroomPostsAsRead();
    // Invalidate to recalculate unread count
    queryClient.invalidateQueries({ queryKey: ['unread-classroom-posts'] });
  };
}

export function useUnreadClassroomPosts() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['unread-classroom-posts', user?.id],
    queryFn: async () => {
      if (!user) return { posts: [], unreadCount: 0 };
      
      // Get user's faculty and semester
      const { data: profile } = await supabase
        .from('profiles')
        .select('faculty, semester')
        .eq('user_id', user.id)
        .maybeSingle();
      
      if (!profile?.faculty || !profile?.semester) {
        return { posts: [], unreadCount: 0 };
      }
      
      // Get last visit timestamp
      const lastVisit = localStorage.getItem('classroom_last_visit');
      const lastVisitTime = lastVisit ? parseInt(lastVisit, 10) : 0;
      
      // Get published posts for user's faculty/semester
      const { data: posts, error } = await supabase
        .from('classroom_posts')
        .select('id, content, created_at, user_id')
        .eq('is_published', true)
        .eq('faculty', profile.faculty)
        .eq('semester', profile.semester)
        .order('created_at', { ascending: false })
        .limit(10);
      
      if (error) throw error;
      
      const readIds = getReadPostIds();
      
      // Filter out posts created by current user, already read, or before last visit
      const unreadPosts = (posts || []).filter(p => {
        if (p.user_id === user.id) return false;
        if (readIds.has(p.id)) return false;
        // If post was created before last visit, it's considered read
        if (lastVisitTime && new Date(p.created_at).getTime() < lastVisitTime) return false;
        return true;
      });
      
      // Fetch author names via secure RPC
      const slicedPosts = unreadPosts.slice(0, 5);
      const userIds = [...new Set(slicedPosts.map(p => p.user_id))];
      const { data: profiles } = userIds.length
        ? await supabase.rpc('get_public_profiles', { _user_ids: userIds })
        : { data: [] };

      const profileMap = new Map(
        (profiles || []).map((p: { user_id: string; name: string }) => [p.user_id, p.name])
      );

      const postsWithAuthors = slicedPosts.map(post => ({
        ...post,
        authorName: profileMap.get(post.user_id) || 'Unknown',
      }));
      
      return {
        posts: postsWithAuthors,
        unreadCount: unreadPosts.length,
      };
    },
    enabled: !!user,
    staleTime: 30 * 1000, // 30 seconds
    refetchInterval: 60 * 1000, // 1 minute
  });
}
