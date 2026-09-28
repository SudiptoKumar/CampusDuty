import { ReactNode, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { MobileHeader } from './MobileHeader';
import { MobileDrawer } from './MobileDrawer';
import { FAB } from './FAB';
import { OfflineBanner } from '@/components/shared/OfflineBanner';
import { useAppStore } from '@/store/appStore';
import { useIsMobile } from '@/hooks/useMediaQuery';
import { useThemeApplicator } from '@/hooks/useThemeApplicator';

interface AppShellProps {
  children: ReactNode;
}

export function AppShell({ children }: AppShellProps) {
  const isMobile = useIsMobile();
  const location = useLocation();
  const sidebarOpen = useAppStore((state) => state.sidebarOpen);
  const setSidebarOpen = useAppStore((state) => state.setSidebarOpen);
  
  // Apply theme and primary color from profile
  useThemeApplicator();
  
  // Close sidebar on route change (mobile)
  useEffect(() => {
    if (isMobile) {
      setSidebarOpen(false);
    }
  }, [location.pathname, isMobile, setSidebarOpen]);
  
  // Determine FAB action based on current route
  const getFabConfig = () => {
    const path = location.pathname;
    
    if (path.includes('/subjects')) {
      return { show: true, label: 'Add Subject', action: 'subject' };
    }
    if (path.includes('/timetable')) {
      return { show: true, label: 'Add Class', action: 'class' };
    }
    if (path.includes('/agenda')) {
      return { show: true, label: 'Add Task', action: 'task' };
    }
    if (path.includes('/grades')) {
      return { show: true, label: 'Add Grade', action: 'grade' };
    }
    if (path === '/notes') {
      return { show: true, label: 'Add Note', action: 'note' };
    }
    if (path.includes('/teachers')) {
      return { show: true, label: 'Add Teacher', action: 'teacher' };
    }
    if (path === '/') {
      return { show: true, label: 'Quick Add', action: 'quick' };
    }
    
    return { show: false, label: '', action: '' };
  };
  
  const fabConfig = getFabConfig();

  return (
    <div className="flex min-h-screen bg-background flex-col">
      {/* Offline Banner */}
      <OfflineBanner />
      
      <div className="flex flex-1 min-h-0">
      {!isMobile && <Sidebar />}
      
      {/* Mobile Drawer */}
      {isMobile && (
        <MobileDrawer 
          open={sidebarOpen} 
          onClose={() => setSidebarOpen(false)} 
        />
      )}
      
      {/* Main Content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        {isMobile && <MobileHeader />}
        
        {/* Page Content */}
        <main className="flex-1 overflow-auto" id="main-content">
          <div className="animate-fade-in">
            {children}
          </div>
        </main>
      </div>
      
      {/* Floating Action Button */}
      {fabConfig.show && (
        <FAB action={fabConfig.action} label={fabConfig.label} />
      )}
      </div>
    </div>
  );
}
