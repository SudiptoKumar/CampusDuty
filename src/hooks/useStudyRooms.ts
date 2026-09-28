import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth';

export interface StudyRoom {
  id: string;
  name: string;
  created_by: string;
  invite_code: string;
  video_link: string | null;
  is_active: boolean;
  max_members: number;
  created_at: string;
}

export interface StudyRoomMember {
  id: string;
  room_id: string;
  user_id: string;
  joined_at: string;
}

export function useStudyRooms() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['study-rooms', user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('study_rooms')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as StudyRoom[];
    },
    enabled: !!user?.id,
  });
}

export function useStudyRoomMembers(roomId: string | null) {
  return useQuery({
    queryKey: ['study-room-members', roomId],
    queryFn: async () => {
      if (!roomId) return [];
      const { data, error } = await supabase
        .from('study_room_members')
        .select('*')
        .eq('room_id', roomId);
      if (error) throw error;
      return data as StudyRoomMember[];
    },
    enabled: !!roomId,
  });
}

export function useCreateStudyRoom() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (room: { name: string; video_link?: string }) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data, error } = await supabase
        .from('study_rooms')
        .insert({ ...room, created_by: user.id })
        .select()
        .single();
      if (error) throw error;
      // Auto-join creator
      await supabase.from('study_room_members').insert({ room_id: data.id, user_id: user.id });
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['study-rooms'] }),
  });
}

export function useJoinStudyRoom() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (inviteCode: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { data: room, error: roomErr } = await supabase
        .from('study_rooms')
        .select('*')
        .eq('invite_code', inviteCode)
        .eq('is_active', true)
        .single();
      if (roomErr || !room) throw new Error('Room not found');
      const { error } = await supabase
        .from('study_room_members')
        .insert({ room_id: room.id, user_id: user.id });
      if (error && error.code === '23505') throw new Error('Already in this room');
      if (error) throw error;
      return room;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['study-rooms'] });
      qc.invalidateQueries({ queryKey: ['study-room-members'] });
    },
  });
}

export function useLeaveStudyRoom() {
  const qc = useQueryClient();
  const { user } = useAuth();
  return useMutation({
    mutationFn: async (roomId: string) => {
      if (!user?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('study_room_members')
        .delete()
        .eq('room_id', roomId)
        .eq('user_id', user.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['study-rooms'] });
      qc.invalidateQueries({ queryKey: ['study-room-members'] });
    },
  });
}

export function useDeleteStudyRoom() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('study_rooms').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['study-rooms'] }),
  });
}
