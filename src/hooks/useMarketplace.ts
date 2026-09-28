import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/AuthProvider';
import { toast } from 'sonner';

export interface MarketplaceListing {
  id: string;
  user_id: string;
  title: string;
  description: string | null;
  price: number;
  category: string;
  condition: string;
  image_urls: string[];
  status: string;
  created_at: string;
  updated_at: string;
  seller_name?: string;
  seller_username?: string;
  seller_faculty?: string;
  seller_semester?: number;
}

export function useMarketplaceListings(category?: string) {
  return useQuery({
    queryKey: ['marketplace', category],
    queryFn: async () => {
      let query = supabase
        .from('marketplace_listings')
        .select('*')
        .eq('status', 'active')
        .order('created_at', { ascending: false });
      
      if (category && category !== 'all') {
        query = query.eq('category', category);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data as MarketplaceListing[];
    },
  });
}

export function useMyListings() {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['marketplace', 'mine'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('marketplace_listings')
        .select('*')
        .eq('user_id', user!.id)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as MarketplaceListing[];
    },
    enabled: !!user,
  });
}

export function useCreateListing() {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  
  return useMutation({
    mutationFn: async (listing: { title: string; description?: string; price: number; category: string; condition: string }) => {
      // Fetch user profile for identity
      const { data: profile } = await supabase
        .from('profiles')
        .select('name, username, faculty, semester')
        .eq('user_id', user!.id)
        .single();

      const { error } = await supabase.from('marketplace_listings').insert({
        ...listing,
        user_id: user!.id,
        seller_name: profile?.name || 'Unknown',
        seller_username: profile?.username || null,
        seller_faculty: profile?.faculty || null,
        seller_semester: profile?.semester || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      toast.success('Listing created!');
    },
    onError: () => toast.error('Failed to create listing'),
  });
}

export function useDeleteListing() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('marketplace_listings').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      toast.success('Listing deleted');
    },
  });
}

export function useUpdateListingStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const { error } = await supabase.from('marketplace_listings').update({ status }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['marketplace'] });
      toast.success('Listing updated');
    },
  });
}
