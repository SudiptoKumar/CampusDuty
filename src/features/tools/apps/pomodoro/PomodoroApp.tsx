import { Timer, ListTodo, Volume2, BarChart3 } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { usePomodoroStore } from './usePomodoroStore';
import TimerView from './TimerView';
import TasksView from './TasksView';
import SoundsView from './SoundsView';
import StatsView from './StatsView';
import type { PomodoroTab } from './types';

const TABS: { id: PomodoroTab; label: string; icon: typeof Timer }[] = [
  { id: 'timer', label: 'Timer', icon: Timer },
  { id: 'tasks', label: 'Tasks', icon: ListTodo },
  { id: 'sounds', label: 'Sounds', icon: Volume2 },
  { id: 'stats', label: 'Stats', icon: BarChart3 },
];

export default function PomodoroApp() {
  const { activeTab, setActiveTab } = usePomodoroStore();

  return (
    <div className="flex flex-col h-full min-h-0">
      <div className="flex-1 overflow-y-auto pb-16 px-1">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeTab}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.15 }}
          >
            {activeTab === 'timer' && <TimerView />}
            {activeTab === 'tasks' && <TasksView />}
            {activeTab === 'sounds' && <SoundsView />}
            {activeTab === 'stats' && <StatsView />}
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-background/80 backdrop-blur-lg border-t z-50">
        <div className="flex justify-around items-center h-14 max-w-lg mx-auto">
          {TABS.map(tab => {
            const active = activeTab === tab.id;
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
