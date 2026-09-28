import { NavLink, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Calendar, 
  Clock, 
  BookOpen, 
  Users,
  Settings,
  LogOut,
  User,
  Bell,
  Shield,
  StickyNote,
  GraduationCap,
  Store,
  ShoppingBag
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { useAuth } from '@/features/auth/AuthProvider';
import { usePermission } from '@/hooks/usePermission';
import { NotificationPanel } from './NotificationPanel';
import { LiquidEffectAnimation } from '@/components/ui/liquid-effect-animation';
import { useUnreadClassroomPosts } from '@/hooks/useUnreadClassroomPosts';
import { useUnreadNotificationCount } from '@/hooks/useAppNotifications';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresAdmin?: boolean;
  showDot?: 'classroom' | 'whats-new';
}

const navItems: NavItem[] = [
  { path: '/', label: 'Overview', icon: LayoutDashboard },
  { path: '/classroom', label: 'Classroom', icon: Users, showDot: 'classroom' },
  { path: '/agenda', label: 'Agenda', icon: CalendarDays },
  { path: '/notes', label: 'Notes', icon: StickyNote },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/timetable', label: 'Timetable', icon: Clock },
  { path: '/subjects', label: 'Subjects', icon: BookOpen },
  { path: '/teachers', label: 'Teachers', icon: Users },
  { path: '/tools', label: 'Mini Store', icon: Store },
  { path: '/marketplace', label: 'Marketplace', icon: ShoppingBag },
  
  { path: '/profile', label: 'Profile', icon: User },
  { path: '/whats-new', label: "What's New", icon: Bell, showDot: 'whats-new' },
  { path: '/admin', label: 'Admin Panel', icon: Shield, requiresAdmin: true },
];

export function Sidebar() {
  const location = useLocation();
  const settings = useAppStore((state) => state.settings);
  const { user, signOut } = useAuth();
  const { isAdmin } = usePermission('cr');
  
  // Get unread counts for notification dots
  const { data: classroomData } = useUnreadClassroomPosts();
  const whatsNewUnread = useUnreadNotificationCount();
  const classroomUnread = classroomData?.unreadCount || 0;
  
  // Filter nav items based on role
  const filteredNavItems = navItems.filter(item => {
    if (item.requiresAdmin && !isAdmin) return false;
    return true;
  });
  
  const hasNotificationDot = (item: NavItem) => {
    if (item.showDot === 'classroom' && classroomUnread > 0) return true;
    if (item.showDot === 'whats-new' && whatsNewUnread > 0) return true;
    return false;
  };
  
  return (
    <aside className="hidden md:flex flex-col w-64 bg-sidebar border-r border-sidebar-border relative overflow-hidden" aria-label="Main navigation">
      <LiquidEffectAnimation metalness={0.9} roughness={0.15} displacementScale={2} />
      <div className="absolute inset-0 bg-sidebar/85 backdrop-blur-sm z-[1]" />
      {/* Logo - Enhanced */}
      <div className="h-16 flex items-center justify-between px-5 border-b border-sidebar-border relative z-[2]">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg bg-primary text-primary-foreground">
            <GraduationCap className="w-5 h-5" />
          </div>
          <span className="font-bold text-base text-sidebar-foreground">
            Campus Duty
          </span>
        </div>
        <NotificationPanel />
      </div>
      
      
      {/* Navigation - Enhanced */}
      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto relative z-[2]" aria-label="Primary navigation">
        {filteredNavItems.map((item) => {
          const Icon = item.icon;
          const isActive = location.pathname === item.path;
          const showDot = hasNotificationDot(item);
          
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={cn(
                'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
                isActive 
                  ? 'text-white shadow-md' 
                  : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
              )}
              style={isActive ? {
                background: `linear-gradient(135deg, ${settings.primaryColor}, hsl(217 91% 60%))`,
                boxShadow: `0 4px 12px ${settings.primaryColor}30`
              } : undefined}
            >
              <motion.div
                className={cn(
                  'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
                  isActive 
                    ? 'bg-white/20' 
                    : 'bg-muted/50 group-hover:bg-primary/10'
                )}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                initial={false}
                animate={isActive ? { scale: [1, 1.2, 1] } : {}}
                transition={{ type: 'spring', stiffness: 400, damping: 15 }}
              >
                <Icon className={cn(
                  'w-4 h-4 transition-colors',
                  isActive ? 'text-white' : 'text-muted-foreground group-hover:text-primary'
                )} />
              </motion.div>
              <span className="flex-1">{item.label}</span>
              {isActive && (
                <div className="ml-auto w-1.5 h-1.5 rounded-full bg-white/70" />
              )}
              {/* Single notification dot on right side */}
              {showDot && !isActive && (
                <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_2px_rgba(239,68,68,0.5)]" />
              )}
            </NavLink>
          );
        })}
      </nav>
      
      {/* Bottom section - Enhanced */}
      <div className="p-3 border-t border-sidebar-border space-y-1 relative z-[2]">
        <NavLink
          to="/settings"
          className={cn(
            'group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200',
            location.pathname === '/settings'
              ? 'text-white shadow-md'
              : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
          )}
          style={location.pathname === '/settings' ? {
            background: `linear-gradient(135deg, ${settings.primaryColor}, hsl(217 91% 60%))`,
            boxShadow: `0 4px 12px ${settings.primaryColor}30`
          } : undefined}
        >
          <motion.div
            className={cn(
              'w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200',
              location.pathname === '/settings' 
                ? 'bg-white/20' 
                : 'bg-muted/50 group-hover:bg-primary/10'
            )}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <Settings className={cn(
              'w-4 h-4',
              location.pathname === '/settings' ? 'text-white' : 'text-muted-foreground group-hover:text-primary'
            )} />
          </motion.div>
          Settings
        </NavLink>
        
        <button 
          onClick={() => signOut()}
          className="w-full group flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-sidebar-foreground/70 hover:text-destructive hover:bg-destructive/10 transition-all duration-200"
        >
          <motion.div
            className="w-8 h-8 rounded-lg flex items-center justify-center bg-muted/50 group-hover:bg-destructive/10 transition-all duration-200"
            whileHover={{ scale: 1.1, rotate: -10 }}
            whileTap={{ scale: 0.9 }}
          >
            <LogOut className="w-4 h-4 text-muted-foreground group-hover:text-destructive transition-colors" />
          </motion.div>
          Sign Out
        </button>
      </div>
    </aside>
  );
}
