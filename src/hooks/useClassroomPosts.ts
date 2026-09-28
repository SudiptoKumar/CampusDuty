import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { useEffect } from 'react';
import { useAuth } from '@/features/auth';

import type { AppRole } from './usePermission';

export interface ClassroomPost {
  id: string;
  user_id: string;
  content: string;
  is_pinned: boolean;
  is_published: boolean;
  scheduled_at: string | null;
  created_at: string;
  updated_at: string;
  visibility: string;
  tags: string[];
  attachments?: { name: string; url: string; type: string; size: number }[];
  author?: {
    name: string;
    avatar_url: string | null;
    username: string | null;
    role: AppRole;
    bio: string | null;
    headline: string | null;
  };
}

interface PostReaction {
  id: string;
  post_id: string;
  user_id: string;
  emoji: string;
  created_at: string;
}

interface PostComment {
  id: string;
  post_id: string;
  user_id: string;
  content: string;
  parent_id: string | null;
  created_at: string;
  updated_at: string;
  author?: {
    name: string;
    avatar_url: string | null;
  };
}

export function useClassroomPosts() {
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: ['classroom-posts'],
    queryFn: async () => {
      const { data: posts, error } = await supabase
        .from('classroom_posts')
        .select('*')
        .order('is_pinned', { ascending: false })
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      const userIds = [...new Set((posts || []).map(p => p.user_id))];
      const { data: profiles } = userIds.length
        ? await supabase.rpc('get_public_profiles', { _user_ids: userIds })
        : { data: [] };

      const profileMap = new Map(
        (profiles || []).map((p: any) => [
          p.user_id,
          { name: p.name, avatar_url: p.avatar_url, username: p.username, role: p.role, bio: p.bio, headline: p.headline }
        ])
      );

      const postsWithAuthors = (posts || []).map(post => ({
        ...post,
        tags: (post as any).tags || [],
        visibility: (post as any).visibility || 'everyone',
        author: profileMap.get(post.user_id) || { name: 'Unknown', avatar_url: null, username: null, role: 'student' as AppRole, bio: null, headline: null },
      }));

      return postsWithAuthors as unknown as ClassroomPost[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel('classroom-posts-changes')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'classroom_posts' },
        async (payload) => {
          queryClient.invalidateQueries({ queryKey: ['classroom-posts'] });
          const { data: { user } } = await supabase.auth.getUser();
          if (user && payload.new && payload.new.user_id !== user.id) {
            const { data: profiles } = await supabase.rpc('get_public_profiles', { _user_ids: [payload.new.user_id] });
            const profile = profiles?.[0];
            const authorName = profile?.name || 'Someone';
            const content = payload.new.content as string || '';
            import('@/lib/notifications').then(({ showClassroomPostNotification }) => {
              showClassroomPostNotification(authorName, content);
            });
          }
        }
      )
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'classroom_posts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['classroom-posts'] });
      })
      .on('postgres_changes', { event: 'DELETE', schema: 'public', table: 'classroom_posts' }, () => {
        queryClient.invalidateQueries({ queryKey: ['classroom-posts'] });
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [queryClient]);

  return query;
}

export function useCreatePost() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      content, scheduledAt, faculty, semester, attachments, visibility = 'everyone', tags = [],
    }: { 
      content: string; 
      scheduledAt?: string;
      faculty: 'Agriculture' | 'CSE' | 'FBA' | 'Fisheries' | 'ESDM' | 'NFS' | 'LLA';
      semester: number;
      attachments?: { name: string; url: string; type: string; size: number }[];
      visibility?: string;
      tags?: string[];
    }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const insertData: Record<string, unknown> = {
        user_id: user.id, content, is_published: !scheduledAt,
        faculty, semester, scheduled_at: scheduledAt || null,
        visibility, tags,
      };
      if (attachments && attachments.length > 0) insertData.attachments = attachments;

      const { data, error } = await supabase
        .from('classroom_posts')
        .insert(insertData as any)
        .select()
        .single();

      if (error) throw error;
      return { data, isScheduled: !!scheduledAt };
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['classroom-posts'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      toast.success(result.isScheduled ? 'Post scheduled!' : 'Post published!');
    },
    onError: (error) => { toast.error('Failed to create post: ' + error.message); },
  });
}

export function useScheduledPosts() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['scheduled-posts', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('classroom_posts')
        .select('*')
        .eq('user_id', user.id)
        .eq('is_published', false)
        .not('scheduled_at', 'is', null)
        .order('scheduled_at', { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
}

export function useUpdatePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, content, scheduledAt, isPublished }: { 
      postId: string; content: string; scheduledAt?: string | null; isPublished?: boolean;
    }) => {
      const updateData: { content: string; updated_at: string; scheduled_at?: string | null; is_published?: boolean } = {
        content,
        updated_at: new Date().toISOString(),
      };
      if (scheduledAt !== undefined) updateData.scheduled_at = scheduledAt;
      if (isPublished !== undefined) updateData.is_published = isPublished;
      const { error } = await supabase.from('classroom_posts').update(updateData).eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classroom-posts'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      toast.success('Post updated!');
    },
    onError: (error) => { toast.error('Failed to update post: ' + error.message); },
  });
}

export function usePublishNow() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('classroom_posts')
        .update({ is_published: true, scheduled_at: null, updated_at: new Date().toISOString() })
        .eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classroom-posts'] });
      queryClient.invalidateQueries({ queryKey: ['scheduled-posts'] });
      toast.success('Post published!');
    },
    onError: (error) => { toast.error('Failed to publish post: ' + error.message); },
  });
}

export function useDeletePost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (postId: string) => {
      const { error } = await supabase.from('classroom_posts').delete().eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['classroom-posts'] });
      toast.success('Post deleted');
    },
    onError: (error) => { toast.error('Failed to delete post: ' + error.message); },
  });
}

export function useTogglePinPost() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, isPinned }: { postId: string; isPinned: boolean }) => {
      const { error } = await supabase.from('classroom_posts').update({ is_pinned: !isPinned }).eq('id', postId);
      if (error) throw error;
    },
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['classroom-posts'] }); },
  });
}

// Reactions
export function usePostReactions(postId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['post-reactions', postId],
    queryFn: async () => {
      const { data, error } = await supabase.from('post_reactions').select('*').eq('post_id', postId);
      if (error) throw error;
      return data as PostReaction[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`reactions-${postId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_reactions', filter: `post_id=eq.${postId}` },
        () => { queryClient.invalidateQueries({ queryKey: ['post-reactions', postId] }); }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postId, queryClient]);

  return query;
}

export function useToggleReaction() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async ({ postId, emoji }: { postId: string; emoji: string }) => {
      if (!user) throw new Error('Not authenticated');
      const { data: existing } = await supabase.from('post_reactions').select('id')
        .eq('post_id', postId).eq('user_id', user.id).eq('emoji', emoji).maybeSingle();
      if (existing) {
        const { error } = await supabase.from('post_reactions').delete().eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('post_reactions').insert({ post_id: postId, user_id: user.id, emoji });
        if (error) throw error;
      }
    },
    onSuccess: (_, { postId }) => { queryClient.invalidateQueries({ queryKey: ['post-reactions', postId] }); },
  });
}

// Comments
export function usePostComments(postId: string) {
  const queryClient = useQueryClient();
  const query = useQuery({
    queryKey: ['post-comments', postId],
    queryFn: async () => {
      const { data: comments, error } = await supabase.from('post_comments').select('*')
        .eq('post_id', postId).order('created_at', { ascending: true });
      if (error) throw error;

      const userIds = [...new Set((comments || []).map(c => c.user_id))];
      const { data: profiles } = userIds.length
        ? await supabase.rpc('get_public_profiles', { _user_ids: userIds })
        : { data: [] };

      const profileMap = new Map(
        (profiles || []).map((p: any) => [p.user_id, { name: p.name, avatar_url: p.avatar_url, headline: p.headline, username: p.username }])
      );

      return (comments || []).map(comment => ({
        ...comment,
        author: profileMap.get(comment.user_id) || { name: 'Unknown', avatar_url: null },
      })) as PostComment[];
    },
  });

  useEffect(() => {
    const channel = supabase
      .channel(`comments-${postId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'post_comments', filter: `post_id=eq.${postId}` },
        () => { queryClient.invalidateQueries({ queryKey: ['post-comments', postId] }); }
      ).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [postId, queryClient]);

  return query;
}

export function useCreateComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ postId, content, parentId }: { postId: string; content: string; parentId?: string }) => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');
      const { data, error } = await supabase.from('post_comments')
        .insert({ post_id: postId, user_id: user.id, content, parent_id: parentId || null })
        .select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { postId }) => { queryClient.invalidateQueries({ queryKey: ['post-comments', postId] }); },
    onError: (error) => { toast.error('Failed to add comment: ' + error.message); },
  });
}

export function useDeleteComment() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ commentId, postId }: { commentId: string; postId: string }) => {
      const { error } = await supabase.from('post_comments').delete().eq('id', commentId);
      if (error) throw error;
      return postId;
    },
    onSuccess: (postId) => { queryClient.invalidateQueries({ queryKey: ['post-comments', postId] }); },
    onError: (error) => { toast.error('Failed to delete comment: ' + error.message); },
  });
}

// Bookmarks
export function useBookmarks() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['post-bookmarks', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data, error } = await supabase
        .from('post_bookmarks')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as { id: string; user_id: string; post_id: string; created_at: string }[];
    },
    enabled: !!user,
  });
}

export function useToggleBookmark() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (postId: string) => {
      if (!user) throw new Error('Not authenticated');
      const { data: existing } = await supabase
        .from('post_bookmarks')
        .select('id')
        .eq('post_id', postId)
        .eq('user_id', user.id)
        .maybeSingle();
      if (existing) {
        const { error } = await supabase.from('post_bookmarks').delete().eq('id', existing.id);
        if (error) throw error;
        return { action: 'removed' as const };
      } else {
        const { error } = await supabase.from('post_bookmarks').insert({ post_id: postId, user_id: user.id });
        if (error) throw error;
        return { action: 'added' as const };
      }
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['post-bookmarks'] });
      toast.success(result.action === 'added' ? 'Bookmarked!' : 'Bookmark removed');
    },
  });
}
