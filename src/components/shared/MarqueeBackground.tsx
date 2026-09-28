import {
  BookOpen, Clock, PenTool, CalendarDays, FlaskConical,
  GraduationCap, ClipboardList, Users, Bell, BarChart3,
  FileText, Megaphone, MapPin, Timer, Target, Notebook,
  Award, Star, CheckCircle2, Brain
} from 'lucide-react';

const marqueeRows = [
  [
    { icon: CalendarDays, label: 'Track your timetable' },
    { icon: ClipboardList, label: 'Manage attendance' },
    { icon: BookOpen, label: 'Organize subjects' },
    { icon: GraduationCap, label: 'View grades' },
    { icon: Bell, label: 'Get class alerts' },
    { icon: Users, label: 'Share with classmates' },
  ],
  [
    { icon: PenTool, label: 'Take quick notes' },
    { icon: Target, label: 'Set study goals' },
    { icon: Timer, label: 'Exam countdown' },
    { icon: BarChart3, label: 'Grade analytics' },
    { icon: Megaphone, label: 'Announcements' },
    { icon: FlaskConical, label: 'Lab schedules' },
  ],
  [
    { icon: FileText, label: 'Assignment tracker' },
    { icon: MapPin, label: 'Find classrooms' },
    { icon: Notebook, label: 'Semester planner' },
    { icon: Award, label: 'Achievements' },
    { icon: Clock, label: 'Class reminders' },
    { icon: Brain, label: 'Study streaks' },
  ],
  [
    { icon: Star, label: 'GPA calculator' },
    { icon: CheckCircle2, label: 'Daily agenda' },
    { icon: CalendarDays, label: 'Exam schedule' },
    { icon: Users, label: 'Teacher contacts' },
    { icon: BookOpen, label: 'Course materials' },
    { icon: Target, label: 'Weekly reports' },
  ],
  [
    { icon: Bell, label: 'Deadline alerts' },
    { icon: ClipboardList, label: 'Attendance stats' },
    { icon: PenTool, label: 'Quick reminders' },
    { icon: GraduationCap, label: 'Academic profile' },
    { icon: FlaskConical, label: 'Lab reports' },
    { icon: Award, label: 'Progress tracking' },
  ],
];

function MarqueeRow({ items, direction, speed }: {
  items: typeof marqueeRows[0];
  direction: 'left' | 'right';
  speed: number;
}) {
  // Duplicate items for seamless loop
  const doubled = [...items, ...items];

  return (
    <div className="flex overflow-hidden py-2">
      <div
        className={`flex gap-3 ${direction === 'left' ? 'animate-marquee-left' : 'animate-marquee-right'}`}
        style={{ animationDuration: `${speed}s` }}
      >
        {doubled.map(({ icon: Icon, label }, i) => (
          <div
            key={i}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border/40 bg-card/30 backdrop-blur-sm whitespace-nowrap text-sm text-muted-foreground/60 shrink-0"
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

interface MarqueeBackgroundProps {
  variant?: 'login' | 'signup';
}

export function MarqueeBackground({ variant = 'login' }: MarqueeBackgroundProps) {
  // Signup has reversed directions
  const reverseDirections = variant === 'signup';
  
  return (
    <>
      {/* Mobile - positioned at top */}
      <div className="lg:hidden absolute inset-x-0 top-0 overflow-hidden pointer-events-none flex flex-col gap-3 py-4 opacity-40">
        {/* Fade edges - mobile */}
        <div className="absolute inset-y-0 left-0 w-16 z-10 bg-gradient-to-r from-background to-transparent" />
        <div className="absolute inset-y-0 right-0 w-16 z-10 bg-gradient-to-l from-background to-transparent" />

        {marqueeRows.slice(0, 2).map((row, i) => (
          <MarqueeRow
            key={i}
            items={row}
            direction={reverseDirections ? (i % 2 === 0 ? 'right' : 'left') : (i % 2 === 0 ? 'left' : 'right')}
            speed={30 + i * 5}
          />
        ))}
      </div>

      {/* Desktop - centered background */}
      <div className="hidden lg:flex absolute inset-0 overflow-hidden pointer-events-none flex-col justify-center gap-3 opacity-40">
        {/* Fade edges - desktop */}
        <div className="absolute inset-y-0 left-0 w-24 z-10 bg-gradient-to-r from-background to-transparent" />
        <div className="absolute inset-y-0 right-0 w-24 z-10 bg-gradient-to-l from-background to-transparent" />
        <div className="absolute inset-x-0 top-0 h-20 z-10 bg-gradient-to-b from-background to-transparent" />
        <div className="absolute inset-x-0 bottom-0 h-20 z-10 bg-gradient-to-t from-background to-transparent" />

        {marqueeRows.map((row, i) => (
          <MarqueeRow
            key={i}
            items={row}
            direction={reverseDirections ? (i % 2 === 0 ? 'right' : 'left') : (i % 2 === 0 ? 'left' : 'right')}
            speed={30 + i * 5}
          />
        ))}
      </div>
    </>
  );
}
