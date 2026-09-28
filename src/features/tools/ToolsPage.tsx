import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  GraduationCap, FileText, ExternalLink, Megaphone, Timer,
  Calculator, Layers, Ruler, QrCode, CheckSquare, BarChart3,
  Volume2, Dices, DollarSign, Search, X, Store, Gamepad2, Users,
  Video, Wallet
} from 'lucide-react';
import { usePermission } from '@/hooks/usePermission';
import { motion } from 'framer-motion';
import { Input } from '@/components/ui/input';

type Category = 'all' | 'productivity' | 'study' | 'utilities' | 'fun' | 'games';

interface AppItem {
  id: string;
  label: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  category: Category;
  hasComponent?: boolean;
  path?: string;
  isExternal?: boolean;
  requiresCR?: boolean;
}

const apps: AppItem[] = [
  { id: 'pomodoro', label: 'Pomodoro Timer', tagline: 'Focus with 25/5 cycles', icon: Timer, color: 'hsl(var(--primary))', category: 'productivity', hasComponent: true },
  { id: 'cgpa-calc', label: 'CGPA Calculator', tagline: 'Marks to CGPA instantly', icon: Calculator, color: 'hsl(142, 71%, 45%)', category: 'study', hasComponent: true },
  { id: 'flashcards', label: 'Flashcards', tagline: 'Study with flip cards', icon: Layers, color: 'hsl(262, 83%, 58%)', category: 'study', hasComponent: true },
  { id: 'unit-converter', label: 'Unit Converter', tagline: 'Convert any unit', icon: Ruler, color: 'hsl(200, 80%, 50%)', category: 'utilities', hasComponent: true },
  { id: 'qr-code', label: 'QR Generator', tagline: 'Text to QR code', icon: QrCode, color: 'hsl(0, 0%, 20%)', category: 'utilities', hasComponent: true },
  { id: 'habit-tracker', label: 'Habit Tracker', tagline: 'Build daily streaks', icon: CheckSquare, color: 'hsl(35, 90%, 55%)', category: 'productivity', hasComponent: true },
  { id: 'quick-poll', label: 'Quick Poll', tagline: 'Create instant polls', icon: BarChart3, color: 'hsl(280, 70%, 55%)', category: 'utilities', hasComponent: true },
  { id: 'tts', label: 'Text to Speech', tagline: 'Listen to your notes', icon: Volume2, color: 'hsl(170, 70%, 45%)', category: 'study', hasComponent: true },
  { id: 'dice-coin', label: 'Dice & Coin', tagline: 'Random decisions', icon: Dices, color: 'hsl(340, 80%, 55%)', category: 'fun', hasComponent: true },
  { id: 'meeting-cost', label: 'Meeting Cost', tagline: 'Track meeting costs', icon: DollarSign, color: 'hsl(45, 90%, 50%)', category: 'productivity', hasComponent: true },
  { id: 'snake', label: 'Snake', tagline: 'Classic snake game', icon: Gamepad2, color: 'hsl(142, 71%, 45%)', category: 'games', hasComponent: true },
  { id: 'tetris', label: 'Tetris', tagline: 'Classic block puzzle', icon: Gamepad2, color: 'hsl(262, 83%, 58%)', category: 'games', hasComponent: true },
  { id: '2048', label: '2048', tagline: 'Slide & merge tiles', icon: Gamepad2, color: 'hsl(35, 95%, 45%)', category: 'games', hasComponent: true },
  { id: 'group-maker', label: 'Group Maker', tagline: 'Random team splits', icon: GraduationCap, color: 'hsl(280, 70%, 55%)', category: 'utilities', hasComponent: true },
  { id: 'tutor-match', label: 'Tutor Match', tagline: 'Find peer tutors', icon: Users, color: 'hsl(200, 80%, 50%)', category: 'study', hasComponent: true },
  { id: 'study-rooms', label: 'Study Rooms', tagline: 'Collaborate with peers', icon: Video, color: 'hsl(170, 70%, 45%)', category: 'productivity', hasComponent: true },
  { id: 'expense-tracker', label: 'Expenses', tagline: 'Track your spending', icon: Wallet, color: 'hsl(15, 80%, 55%)', category: 'productivity', hasComponent: true },
  { id: 'exam-mode', label: 'Exam Mode', tagline: 'Focus for exams', icon: GraduationCap, color: 'hsl(var(--primary))', category: 'study', path: '/exam-mode' },
  { id: 'docflow', label: 'DocFlow', tagline: 'Document workflow', icon: FileText, color: 'hsl(220, 80%, 55%)', category: 'utilities', path: 'https://aidocflow.lovable.app/', isExternal: true },
  { id: 'announcements', label: 'Announcements', tagline: 'Post announcements', icon: Megaphone, color: 'hsl(35, 90%, 55%)', category: 'utilities', requiresCR: true, path: '/announcements' },
];

const categories: { value: Category; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'productivity', label: 'Productivity' },
  { value: 'study', label: 'Study' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'games', label: 'Games' },
  { value: 'fun', label: 'Fun' },
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export default function ToolsPage() {
  const navigate = useNavigate();
  const { isCR } = usePermission('cr');
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<Category>('all');

  const filteredApps = apps.filter(app => {
    if (app.requiresCR && !isCR) return false;
    if (category !== 'all' && app.category !== category) return false;
    if (search && !app.label.toLowerCase().includes(search.toLowerCase()) && !app.tagline.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="p-4 md:p-6 max-w-3xl mx-auto">
      <div className="flex items-center gap-2 mb-4">
        <Store className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-bold text-foreground">Mini Store</h1>
      </div>

      {/* Search */}
      <div className="relative mb-3">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          placeholder="Search apps..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="pl-9 pr-8"
        />
        {search && (
          <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
            <X className="w-4 h-4 text-muted-foreground" />
          </button>
        )}
      </div>

      {/* Category chips */}
      <div className="flex gap-2 mb-5 overflow-x-auto pb-1 no-scrollbar">
        {categories.map(cat => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              category === cat.value
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-accent'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* App grid */}
      <motion.div
        className="grid grid-cols-3 sm:grid-cols-4 gap-4 md:gap-5"
        variants={container}
        initial="hidden"
        animate="show"
        key={category + search}
      >
        {filteredApps.map((app) => {
          const Icon = app.icon;
          return (
            <motion.button
              key={app.id}
              variants={item}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                if (app.isExternal) {
                  window.open(app.path, '_blank', 'noopener,noreferrer');
                } else if (app.hasComponent) {
                  navigate(`/tools/${app.id}`);
                } else if (app.path) {
                  navigate(app.path);
                }
              }}
              className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-200 group relative"
            >
              <div
                className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-md transition-transform duration-200 group-hover:shadow-lg"
                style={{
                  backgroundColor: app.color,
                  boxShadow: `0 4px 12px ${app.color}40`,
                }}
              >
                <Icon className="w-6 h-6 text-white" />
              </div>
              <div className="text-center">
                <p className="text-xs font-medium text-foreground leading-tight">{app.label}</p>
                <p className="text-[10px] text-muted-foreground leading-tight mt-0.5 hidden sm:block">{app.tagline}</p>
              </div>
              {app.isExternal && (
                <ExternalLink className="w-2.5 h-2.5 absolute top-2 right-2 text-muted-foreground/50" />
              )}
            </motion.button>
          );
        })}
      </motion.div>

      {filteredApps.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-12">No apps found</p>
      )}
    </div>
  );
}
