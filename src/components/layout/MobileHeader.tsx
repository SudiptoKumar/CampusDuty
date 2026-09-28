import { forwardRef } from 'react';
import { Menu } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useAppStore } from '@/store/appStore';
import { NotificationPanel } from './NotificationPanel';

const pageTitles: Record<string, string> = {
  '/': 'Overview',
  '/agenda': 'Agenda',
  '/calendar': 'Calendar',
  '/timetable': 'Timetable',
  '/grades': 'Grades',
  '/subjects': 'Subjects',
  '/attendance': 'Attendance',
  '/teachers': 'Teachers',
  '/analytics': 'Analytics',
  '/settings': 'Settings',
  '/profile': 'Profile',
  '/exam-mode': 'Exam Mode',
  '/announcements': 'Announcements',
  '/classroom': 'Classroom',
  '/notes': 'Notes',
  '/tools': 'Mini Store',
};

export const MobileHeader = forwardRef<HTMLElement>((_, ref) => {
  const location = useLocation();
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  
  const title = pageTitles[location.pathname] || 'Campus Duty';
  
  return (
    <header 
      ref={ref} 
      className="sticky top-0 z-40 glass-strong"
    >
      <div className="h-14 flex items-center justify-between px-4">
        <button
          onClick={() => setSidebarOpen(true)}
          className="touch-target flex items-center justify-center -ml-2 rounded-xl hover:bg-primary/10 transition-colors"
          aria-label="Open menu"
        >
          <Menu className="w-6 h-6" />
        </button>
        
        <div className="flex items-center gap-2">
          <h1 className="font-bold text-lg">{title}</h1>
        </div>
        
        {/* Notification Panel */}
        <NotificationPanel />
      </div>
    </header>
  );
});

MobileHeader.displayName = 'MobileHeader';
