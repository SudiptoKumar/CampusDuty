import { 
  LayoutDashboard, 
  Users, 
  FileText, 
  Bell, 
  BarChart3, 
  ScrollText, 
  Settings2,
  ChevronLeft,
  ChevronRight,
  Crown
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { usePermission } from '@/hooks/usePermission';

interface AdminSidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const navItems = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'users', label: 'Users', icon: Users },
  { id: 'content', label: 'Content', icon: FileText },
  { id: 'notifications', label: 'Notifications', icon: Bell },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
  { id: 'audit', label: 'Audit Logs', icon: ScrollText },
];

const superAdminItems = [
  { id: 'system', label: 'System', icon: Settings2 },
];

export function AdminSidebar({ activeTab, onTabChange, collapsed, onToggleCollapse }: AdminSidebarProps) {
  const { isSuperAdmin } = usePermission('admin');

  const allItems = [...navItems, ...(isSuperAdmin ? superAdminItems : [])];

  return (
    <div className={cn(
      'flex flex-col border-r bg-card/50 transition-all duration-300 shrink-0',
      collapsed ? 'w-14' : 'w-56'
    )}>
      {/* Header */}
      <div className="flex items-center justify-between p-3 h-14">
        {!collapsed && (
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-amber-500" />
            <span className="font-semibold text-sm">Admin</span>
          </div>
        )}
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 shrink-0"
          onClick={onToggleCollapse}
        >
          {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
        </Button>
      </div>
      
      <Separator />

      {/* Navigation */}
      <nav className="flex-1 p-2 space-y-1">
        {allItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={cn(
                'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all',
                isActive
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
              title={collapsed ? item.label : undefined}
            >
              <Icon className="w-4 h-4 shrink-0" />
              {!collapsed && <span>{item.label}</span>}
            </button>
          );
        })}
      </nav>
    </div>
  );
}
