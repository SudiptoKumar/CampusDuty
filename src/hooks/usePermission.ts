import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/features/auth/AuthProvider';
import { Shield, BadgeCheck, User, Crown } from 'lucide-react';

export type AppRole = 'student' | 'cr' | 'admin' | 'super_admin';

export function useUserRole() {
  const { user } = useAuth();
  
  return useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return 'student' as AppRole;
      
      const { data, error } = await supabase.rpc('get_user_role', { _user_id: user.id });
      
      if (error) {
        console.error('Error fetching role:', error);
        return 'student' as AppRole;
      }
      
      return (data as AppRole) || 'student';
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000,
  });
}

export function usePermission(requiredRole: AppRole | AppRole[]) {
  const { data: userRole, isLoading } = useUserRole();
  
  const roleHierarchy: Record<AppRole, number> = {
    student: 1,
    cr: 2,
    admin: 3,
    super_admin: 4,
  };
  
  const hasPermission = () => {
    if (!userRole) return false;
    
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(userRole);
    }
    
    return roleHierarchy[userRole] >= roleHierarchy[requiredRole];
  };
  
  return {
    hasPermission: hasPermission(),
    isLoading,
    role: userRole,
    isCR: userRole === 'cr' || userRole === 'admin' || userRole === 'super_admin',
    isAdmin: userRole === 'admin' || userRole === 'super_admin',
    isSuperAdmin: userRole === 'super_admin',
    isStudent: userRole === 'student',
  };
}

// Role badge configuration with proper icons
export interface RoleBadgeConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: typeof Shield;
}

export function getRoleBadge(role: AppRole): RoleBadgeConfig | null {
  switch (role) {
    case 'super_admin':
      return { 
        label: 'Super Admin', 
        color: 'text-amber-500', 
        bgColor: 'bg-amber-500/10',
        icon: Crown 
      };
    case 'admin':
      return { 
        label: 'Admin', 
        color: 'text-red-500', 
        bgColor: 'bg-red-500/10',
        icon: Shield 
      };
    case 'cr':
      return { 
        label: 'CR', 
        color: 'text-primary', 
        bgColor: 'bg-primary/10',
        icon: BadgeCheck 
      };
    default:
      return null;
  }
}

// Get user-friendly role display name
export function getRoleDisplayName(role: AppRole): string {
  switch (role) {
    case 'super_admin':
      return 'Super Administrator';
    case 'admin':
      return 'Administrator';
    case 'cr':
      return 'Class Representative';
    default:
      return 'Student';
  }
}
