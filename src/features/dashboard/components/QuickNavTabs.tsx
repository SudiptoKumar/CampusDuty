import { Clock, CalendarDays, Calendar, BookOpen } from 'lucide-react';
import { Link, useLocation } from 'react-router-dom';
import { cn } from '@/lib/utils';

const tabs = [
  { path: '/timetable', label: 'Timetable', icon: Clock },
  { path: '/agenda', label: 'Agenda', icon: CalendarDays },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/subjects', label: 'Subjects', icon: BookOpen },
];

export function QuickNavTabs() {
  const location = useLocation();
  
  return (
    <nav className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0 scrollbar-hide" aria-label="Quick navigation">
      {tabs.map((tab) => {
        const Icon = tab.icon;
        const isActive = location.pathname === tab.path;
        
        return (
          <Link
            key={tab.path}
            to={tab.path}
            aria-current={isActive ? 'page' : undefined}
            className={cn(
              'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all duration-200',
              'border',
              isActive 
                ? 'bg-primary text-primary-foreground border-primary' 
                : 'liquid-glass-card text-muted-foreground hover:text-foreground'
            )}
          >
            <Icon className="w-4 h-4" aria-hidden="true" />
            {tab.label}
          </Link>
        );
      })}
    </nav>
  );
}
