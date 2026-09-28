import { NavLink, useLocation } from 'react-router-dom';
import { StickyNote } from 'lucide-react';
import { 
  LayoutDashboard, 
  CalendarDays, 
  Calendar, 
  Clock, 
  BookOpen, 
  Users,
  Settings,
  User,
  Bell,
  Shield,
  GraduationCap,
  Store,
  ShoppingBag
} from 'lucide-react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useAppStore } from '@/store/appStore';
import { usePermission } from '@/hooks/usePermission';
import { useUnreadClassroomPosts } from '@/hooks/useUnreadClassroomPosts';
import { useUnreadNotificationCount } from '@/hooks/useAppNotifications';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { LiquidEffectAnimation } from '@/components/ui/liquid-effect-animation';

interface NavItem {
  path: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  requiresCR?: boolean;
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
  { path: '/settings', label: 'Settings', icon: Settings },
];

interface MobileDrawerProps {
  open: boolean;
  onClose: () => void;
}

export function MobileDrawer({ open, onClose }: MobileDrawerProps) {
  const location = useLocation();
  const settings = useAppStore((state) => state.settings);
  const { isCR, isAdmin } = usePermission('cr');
  
  // Get unread counts for notification dots
  const { data: classroomData } = useUnreadClassroomPosts();
  const whatsNewUnread = useUnreadNotificationCount();
  const classroomUnread = classroomData?.unreadCount || 0;
  
  // Filter nav items based on role
  const filteredNavItems = navItems.filter(item => {
    if (item.requiresAdmin && !isAdmin) return false;
    if (item.requiresCR && !isCR) return false;
    return true;
  });
  
  const hasNotificationDot = (item: NavItem) => {
    if (item.showDot === 'classroom' && classroomUnread > 0) return true;
    if (item.showDot === 'whats-new' && whatsNewUnread > 0) return true;
    return false;
  };
  
  return (
    <Sheet open={open} onOpenChange={onClose}>
      <SheetContent side="left" className="w-72 p-0 bg-sidebar border-sidebar-border flex flex-col overflow-hidden">
        <LiquidEffectAnimation metalness={0.9} roughness={0.15} displacementScale={2} />
        <div className="absolute inset-0 bg-sidebar/85 backdrop-blur-sm z-[1]" />
        <SheetHeader className="h-16 flex flex-row items-center justify-between px-4 border-b border-sidebar-border flex-shrink-0 relative z-[2]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center bg-primary text-primary-foreground">
              <GraduationCap className="w-5 h-5" />
            </div>
            <SheetTitle className="font-semibold text-lg text-sidebar-foreground">
              Campus Duty
            </SheetTitle>
          </div>
        </SheetHeader>
        
        <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto relative z-[2]">
          {filteredNavItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            const showDot = hasNotificationDot(item);
            
            return (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={onClose}
                className={cn(
                  'flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200 touch-target',
                  'active:bg-white/5',
                  isActive 
                    ? 'bg-primary/10 text-primary' 
                    : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent'
                )}
              >
                <motion.div
                  initial={false}
                  animate={isActive ? { scale: [1, 1.25, 1], rotate: [0, -8, 8, 0] } : { scale: 1 }}
                  transition={{ type: 'spring', stiffness: 400, damping: 15 }}
                >
                  <Icon className={cn('w-5 h-5', isActive && 'text-primary')} />
                </motion.div>
                <span className="flex-1">{item.label}</span>
                {/* Single notification dot on right side */}
                {showDot && !isActive && (
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_2px_rgba(239,68,68,0.5)]" />
                )}
              </NavLink>
            );
          })}
        </nav>
      </SheetContent>
    </Sheet>
  );
}
