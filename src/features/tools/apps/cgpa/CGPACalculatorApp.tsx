import { useState } from 'react';
import { useCGPAStore } from './useCGPAStore';
import DashboardView from './DashboardView';
import SemesterDetailView from './SemesterDetailView';
import WhatIfView from './WhatIfView';
import AnalyticsView from './AnalyticsView';
import AddCourseSheet from './AddCourseSheet';
import SettingsSheet from './SettingsSheet';
import { LayoutDashboard, BookOpen, Sparkles, BarChart3 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import type { ViewTab } from './types';

const TABS: { id: ViewTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'semesters', label: 'Semesters', icon: BookOpen },
  { id: 'predict', label: 'Predict', icon: Sparkles },
  { id: 'analytics', label: 'Analytics', icon: BarChart3 },
];

export default function CGPACalculatorApp() {
  const { activeTab, setActiveTab, selectedSemesterId } = useCGPAStore();
  const [addCourseOpen, setAddCourseOpen] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  const renderView = () => {
    if (activeTab === 'semesters' && selectedSemesterId) {
      return <SemesterDetailView onOpenAddCourse={() => setAddCourseOpen(true)} />;
    }
    switch (activeTab) {
      case 'dashboard': return <DashboardView onOpenSettings={() => setSettingsOpen(true)} />;
      case 'semesters': return <DashboardView onOpenSettings={() => setSettingsOpen(true)} />;
      case 'predict': return <WhatIfView />;
      case 'analytics': return <AnalyticsView />;
    }
  };

  return (
    <div className="relative min-h-[70vh] flex flex-col">
      {/* Content */}
      <div className="flex-1 px-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab + (selectedSemesterId || '')}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
          >
            {renderView()}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Bottom Tab Bar */}
      <div className="sticky bottom-0 left-0 right-0 bg-background/95 backdrop-blur border-t border-border">
        <div className="flex items-center justify-around py-1.5">
          {TABS.map(tab => {
            const isActive = activeTab === tab.id;
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => { setActiveTab(tab.id); if (tab.id !== 'semesters') useCGPAStore.getState().selectSemester(null); }}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${
                  isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Sheets */}
      <AddCourseSheet open={addCourseOpen} onOpenChange={setAddCourseOpen} />
      <SettingsSheet open={settingsOpen} onOpenChange={setSettingsOpen} />
    </div>
  );
}
