import { forwardRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { CalendarDays, ListTodo, Calendar, BookOpen } from 'lucide-react';
import { cn } from '@/lib/utils';

const tabs = [
  { id: 'timetable', label: 'Timetable', icon: CalendarDays, path: '/timetable' },
  { id: 'agenda', label: 'Agenda', icon: ListTodo, path: '/agenda' },
  { id: 'calendar', label: 'Calendar', icon: Calendar, path: '/calendar' },
  { id: 'subjects', label: 'Subjects', icon: BookOpen, path: '/subjects' },
];

export const QuickNavTabs = forwardRef<HTMLDivElement>((_, ref) => {
  const navigate = useNavigate();
  const location = useLocation();
  
  return (
    <nav ref={ref} className="overflow-x-auto no-scrollbar -mx-4 px-4" aria-label="Quick navigation">
      <div className="flex gap-2 min-w-max pb-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = location.pathname === tab.path;
          
          return (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              aria-current={isActive ? 'page' : undefined}
              className={cn(
                'flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium',
                'transition-all duration-200 active:scale-95 whitespace-nowrap',
                isActive
                  ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                  : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4" aria-hidden="true" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
});

QuickNavTabs.displayName = 'QuickNavTabs';
