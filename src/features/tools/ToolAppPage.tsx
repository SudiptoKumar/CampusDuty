import { Suspense, lazy } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { DashboardSkeleton } from '@/components/shared/DashboardSkeleton';
import {
  Timer, Calculator, Layers, Ruler, QrCode, CheckSquare,
  BarChart3, Volume2, Dices, DollarSign, Gamepad2, Users, Video, Wallet
} from 'lucide-react';

const PomodoroTimer = lazy(() => import('./apps/PomodoroTimer'));
const CGPACalculator = lazy(() => import('./apps/CGPACalculator'));
const FlashcardsApp = lazy(() => import('./apps/FlashcardsApp'));
const UnitConverter = lazy(() => import('./apps/UnitConverter'));
const QRCodeGenerator = lazy(() => import('./apps/QRCodeGenerator'));
const HabitTracker = lazy(() => import('./apps/HabitTracker'));
const QuickPollApp = lazy(() => import('./apps/QuickPollApp'));
const TextToSpeech = lazy(() => import('./apps/TextToSpeech'));
const DiceCoinFlip = lazy(() => import('./apps/DiceCoinFlip'));
const MeetingCostCalc = lazy(() => import('./apps/MeetingCostCalc'));
const SnakeGame = lazy(() => import('./apps/SnakeGame'));
const TetrisGame = lazy(() => import('./apps/TetrisGame'));
const Game2048 = lazy(() => import('./apps/Game2048'));
const RandomGroupMaker = lazy(() => import('./apps/RandomGroupMaker'));
const TutorMatchmaker = lazy(() => import('./apps/TutorMatchmaker'));
const StudyRoomApp = lazy(() => import('./apps/studyrooms/StudyRoomApp'));
const ExpenseTrackerApp = lazy(() => import('./apps/expenses/ExpenseTrackerApp'));

interface AppMeta {
  label: string;
  tagline: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  component: React.LazyExoticComponent<() => JSX.Element>;
}

const appRegistry: Record<string, AppMeta> = {
  pomodoro: { label: 'Pomodoro Timer', tagline: 'Focus with 25/5 cycles', icon: Timer, color: 'hsl(var(--primary))', component: PomodoroTimer },
  'cgpa-calc': { label: 'CGPA Calculator', tagline: 'Marks to CGPA instantly', icon: Calculator, color: 'hsl(142, 71%, 45%)', component: CGPACalculator },
  flashcards: { label: 'Flashcards', tagline: 'Study with flip cards', icon: Layers, color: 'hsl(262, 83%, 58%)', component: FlashcardsApp },
  'unit-converter': { label: 'Unit Converter', tagline: 'Convert any unit', icon: Ruler, color: 'hsl(200, 80%, 50%)', component: UnitConverter },
  'qr-code': { label: 'QR Generator', tagline: 'Text to QR code', icon: QrCode, color: 'hsl(0, 0%, 20%)', component: QRCodeGenerator },
  'habit-tracker': { label: 'Habit Tracker', tagline: 'Build daily streaks', icon: CheckSquare, color: 'hsl(35, 90%, 55%)', component: HabitTracker },
  'quick-poll': { label: 'Quick Poll', tagline: 'Create instant polls', icon: BarChart3, color: 'hsl(280, 70%, 55%)', component: QuickPollApp },
  tts: { label: 'Text to Speech', tagline: 'Listen to your notes', icon: Volume2, color: 'hsl(170, 70%, 45%)', component: TextToSpeech },
  'dice-coin': { label: 'Dice & Coin', tagline: 'Random decisions', icon: Dices, color: 'hsl(340, 80%, 55%)', component: DiceCoinFlip },
  'meeting-cost': { label: 'Meeting Cost', tagline: 'Track meeting costs', icon: DollarSign, color: 'hsl(45, 90%, 50%)', component: MeetingCostCalc },
  snake: { label: 'Snake', tagline: 'Classic snake game', icon: Gamepad2, color: 'hsl(142, 71%, 45%)', component: SnakeGame },
  tetris: { label: 'Tetris', tagline: 'Classic block puzzle', icon: Gamepad2, color: 'hsl(262, 83%, 58%)', component: TetrisGame },
  '2048': { label: '2048', tagline: 'Slide & merge tiles', icon: Gamepad2, color: 'hsl(35, 95%, 45%)', component: Game2048 },
  'group-maker': { label: 'Group Maker', tagline: 'Random team splits', icon: Gamepad2, color: 'hsl(280, 70%, 55%)', component: RandomGroupMaker },
  'tutor-match': { label: 'Tutor Match', tagline: 'Find peer tutors', icon: Users, color: 'hsl(200, 80%, 50%)', component: TutorMatchmaker },
  'study-rooms': { label: 'Study Rooms', tagline: 'Collaborate with peers', icon: Video, color: 'hsl(170, 70%, 45%)', component: StudyRoomApp },
  'expense-tracker': { label: 'Expenses', tagline: 'Track your spending', icon: Wallet, color: 'hsl(15, 80%, 55%)', component: ExpenseTrackerApp },
};

export default function ToolAppPage() {
  const { appId } = useParams<{ appId: string }>();
  const navigate = useNavigate();
  const app = appId ? appRegistry[appId] : null;

  if (!app) {
    return (
      <div className="flex flex-col items-center justify-center h-screen gap-4">
        <p className="text-muted-foreground">App not found</p>
        <Button variant="outline" onClick={() => navigate('/tools')}>Back to Store</Button>
      </div>
    );
  }

  const Icon = app.icon;

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-border/50 bg-card/80 backdrop-blur-sm flex-shrink-0 safe-area-top">
        <Button variant="ghost" size="icon" onClick={() => navigate('/tools')} className="rounded-full h-9 w-9 -ml-1">
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div
          className="w-9 h-9 rounded-xl flex items-center justify-center shadow-sm"
          style={{ backgroundColor: app.color }}
        >
          <Icon className="w-4.5 h-4.5 text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <h1 className="text-sm font-semibold text-foreground truncate">{app.label}</h1>
          <p className="text-[10px] text-muted-foreground">{app.tagline}</p>
        </div>
      </header>

      {/* Content */}
      <ScrollArea className="flex-1">
        <div className="max-w-2xl mx-auto px-4 pb-8">
          <Suspense fallback={<DashboardSkeleton />}>
            <app.component />
          </Suspense>
        </div>
      </ScrollArea>
    </div>
  );
}
