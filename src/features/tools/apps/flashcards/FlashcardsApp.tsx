import { LayoutDashboard, GraduationCap, User } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { useFlashcardStore } from './useFlashcardStore';
import DashboardView from './DashboardView';
import DeckDetailView from './DeckDetailView';
import StudyView from './StudyView';
import ProfileView from './ProfileView';
import type { FlashcardTab } from './types';

const TABS: { id: FlashcardTab; label: string; icon: typeof LayoutDashboard }[] = [
  { id: 'dashboard', label: 'Decks', icon: LayoutDashboard },
  { id: 'study', label: 'Study', icon: GraduationCap },
  { id: 'profile', label: 'Profile', icon: User },
];

export default function FlashcardsApp() {
  const { activeTab, setActiveTab, selectedDeckId, studyDeckId } = useFlashcardStore();

  const currentView = studyDeckId ? 'studying' : selectedDeckId ? 'deck' : activeTab;

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto pb-16 px-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentView}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {studyDeckId ? <StudyView /> :
             selectedDeckId ? <DeckDetailView /> :
             activeTab === 'dashboard' ? <DashboardView /> :
             activeTab === 'study' ? <DashboardView /> :
             <ProfileView />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t z-50">
        <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
          {TABS.map(tab => {
            const active = activeTab === tab.id && !selectedDeckId && !studyDeckId;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex flex-col items-center gap-0.5 px-3 py-1 rounded-lg transition-colors ${active ? 'text-primary' : 'text-muted-foreground'}`}
              >
                <tab.icon className={`w-5 h-5 ${active ? 'stroke-[2.5]' : ''}`} />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
