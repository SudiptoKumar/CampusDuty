import { useState } from 'react';
import { motion } from 'framer-motion';
import { Crown, Shield, Loader2 } from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { Navigate } from 'react-router-dom';
import { useIsMobile } from '@/hooks/use-mobile';

import { AdminSidebar } from './components/AdminSidebar';
import { DashboardSection } from './components/DashboardSection';
import { UserManagementSection } from './components/UserManagementSection';
import { NotificationsSection } from './components/NotificationsSection';
import { ContentModerationSection } from './components/ContentModerationSection';
import { AnalyticsSection } from './components/AnalyticsSection';
import { AuditLogSection } from './components/AuditLogSection';
import { SystemSettingsSection } from './components/SystemSettingsSection';

export function AdminPage() {
  const { isAdmin, isSuperAdmin, isLoading } = usePermission('admin');
  const [activeTab, setActiveTab] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const isMobile = useIsMobile();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!isAdmin) {
    return <Navigate to="/" replace />;
  }

  const renderSection = () => {
    switch (activeTab) {
      case 'dashboard': return <DashboardSection />;
      case 'users': return <UserManagementSection />;
      case 'content': return <ContentModerationSection />;
      case 'notifications': return <NotificationsSection />;
      case 'analytics': return <AnalyticsSection />;
      case 'audit': return <AuditLogSection />;
      case 'system': return <SystemSettingsSection />;
      default: return <DashboardSection />;
    }
  };

  return (
    <div className="flex h-[calc(100vh-4rem)] md:h-screen overflow-hidden">
      {/* Sidebar */}
      {!isMobile && (
        <AdminSidebar
          activeTab={activeTab}
          onTabChange={setActiveTab}
          collapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />
      )}

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto">
        <div className="p-4 md:p-6 lg:p-8 pb-24">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-6"
          >
            <div className="flex items-center gap-3">
              <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center">
                {isSuperAdmin ? (
                  <Crown className="h-6 w-6 text-amber-500" />
                ) : (
                  <Shield className="h-6 w-6 text-destructive" />
                )}
              </div>
              <div>
                <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                  {isSuperAdmin ? 'Super Admin Panel' : 'Admin Panel'}
                </h1>
                <p className="text-muted-foreground text-sm">
                  {isSuperAdmin ? 'Full platform control & moderation' : 'Manage users, content, and settings'}
                </p>
              </div>
            </div>
          </motion.div>

          {/* Mobile tab nav */}
          {isMobile && (
            <div className="flex gap-1 overflow-x-auto pb-4 mb-4 -mx-4 px-4 scrollbar-hide">
              {[
                { id: 'dashboard', label: 'Dashboard' },
                { id: 'users', label: 'Users' },
                { id: 'content', label: 'Content' },
                { id: 'notifications', label: 'Notifs' },
                { id: 'analytics', label: 'Analytics' },
                { id: 'audit', label: 'Audit' },
                ...(isSuperAdmin ? [{ id: 'system', label: 'System' }] : []),
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
                    activeTab === tab.id
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          )}

          {/* Section Content */}
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.2 }}
          >
            {renderSection()}
          </motion.div>
        </div>
      </div>
    </div>
  );
}

export default AdminPage;
