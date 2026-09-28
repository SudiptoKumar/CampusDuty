import { useState, useMemo, useEffect, useCallback } from 'react';
import { format, addDays } from 'date-fns';
import { CalendarIcon, Copy, Check, MessageCircle, Clock, Video, X } from 'lucide-react';
import { useClasses } from '@/hooks/useClasses';
import { useSubjects } from '@/hooks/useSubjects';
import { useAllSubjectTeachers } from '@/hooks/useAllSubjectTeachers';
import { useProfile } from '@/hooks/useProfile';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

const DAY_NAMES = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface ClassAnnouncement {
  classId: string;
  subjectId: string;
  subjectName: string;
  subjectColor: string;
  selectedTeacher: string; // Teacher ID or 'CANCELLED'
  originalTime: string; // Original start time from timetable
  currentTime: string; // Calculated time after ripple effect
  endTime: string;
  room?: string;
  is2Hour: boolean;
  isOnline: boolean;
  customTime: string;
}

// Helper: Parse time string "HH:MM:SS" to minutes from midnight
function parseTimeToMinutes(time: string): number {
  const parts = time.split(':').map(Number);
  return parts[0] * 60 + parts[1];
}

// Helper: Convert minutes to "HH:MM AM/PM" format
function minsToDisplayStr(mins: number): string {
  let h = Math.floor(mins / 60);
  const m = mins % 60;
  const mod = h >= 12 ? 'PM' : 'AM';
  if (h > 12) h -= 12;
  if (h === 0) h = 12;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')} ${mod}`;
}

// Helper: Get short name for teacher
function getShortTeacherName(firstName: string, lastName: string): string {
  const fullName = `${firstName} ${lastName}`.toLowerCase();
  
  // Special case: Nur Nubi (two words)
  if (fullName.includes('nur') && lastName.toLowerCase() === 'nubi') {
    return 'Nur Nubi Sir';
  }
  
  // Special case: If first_name is just a title like "Prof.", use last_name
  const cleanFirst = firstName.replace(/^(Prof\.|Dr\.|Md\.)\s*/gi, '').trim();
  if (!cleanFirst || cleanFirst.toLowerCase() === 'prof' || cleanFirst.toLowerCase() === 'dr') {
    return `${lastName} Sir`;
  }
  
  // Split by spaces or hyphens and get the last meaningful word
  const parts = cleanFirst.split(/[\s-]+/).filter((p) => 
    p.length > 0 && 
    !['prof', 'dr', 'md', 'mohammad'].includes(p.toLowerCase())
  );
  
  if (parts.length > 0) {
    return `${parts[parts.length - 1]} Sir`;
  }
  
  // Fallback to last_name
  return `${lastName} Sir`;
}

export function AnnouncementsPage() {
  const { data: classes, isLoading: classesLoading } = useClasses();
  const { data: subjects, isLoading: subjectsLoading } = useSubjects();
  const { data: teachersBySubject } = useAllSubjectTeachers();
  const { data: profile } = useProfile();
  
  const [selectedDate, setSelectedDate] = useState<Date>(addDays(new Date(), 1)); // Tomorrow by default
  const [classSettings, setClassSettings] = useState<Record<string, ClassAnnouncement>>({});
  const [generatedText, setGeneratedText] = useState('');
  const [copied, setCopied] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);

  const isLoading = classesLoading || subjectsLoading;

  // Get classes for selected day, sorted by start_time
  const dayClasses = useMemo(() => {
    if (!classes || !subjects) return [];
    
    const dayOfWeek = selectedDate.getDay();
    
    return classes
      .filter((cls) => cls.day === dayOfWeek)
      .sort((a, b) => a.start_time.localeCompare(b.start_time))
      .map((cls) => {
        const subject = subjects.find((s) => s.id === cls.subject_id);
        return {
          ...cls,
          subject,
        };
      });
  }, [classes, subjects, selectedDate]);

  // Initialize settings when classes change
  useEffect(() => {
    if (dayClasses.length === 0) {
      setClassSettings({});
      return;
    }
    
    setClassSettings((prev) => {
      const newSettings: Record<string, ClassAnnouncement> = {};
      
      dayClasses.forEach((cls) => {
        const subjectTeachers = teachersBySubject?.[cls.subject_id] || [];
        const defaultTeacherId = subjectTeachers[0]?.id || '';
        
        // Keep existing settings if available, otherwise create new
        if (prev[cls.id] && prev[cls.id].subjectId === cls.subject_id) {
          newSettings[cls.id] = {
            ...prev[cls.id],
            originalTime: cls.start_time,
            // Ensure teacher is set if previously empty
            selectedTeacher: prev[cls.id].selectedTeacher || defaultTeacherId,
          };
        } else {
          newSettings[cls.id] = {
            classId: cls.id,
            subjectId: cls.subject_id,
            subjectName: cls.subject?.name || 'Unknown Subject',
            subjectColor: cls.subject?.color || '#5F6AF7',
            selectedTeacher: defaultTeacherId,
            originalTime: cls.start_time,
            currentTime: cls.start_time,
            endTime: cls.end_time,
            room: cls.room || '',
            is2Hour: false,
            isOnline: false,
            customTime: '20:00',
          };
        }
      });
      
      return newSettings;
    });
  }, [dayClasses, teachersBySubject]);

  // Reset generated text when date changes
  useEffect(() => {
    setGeneratedText('');
  }, [selectedDate]);

  // RIPPLE EFFECT: Recalculate times when toggles change
  const calculateRippleTimes = useCallback(() => {
    if (dayClasses.length === 0) return;

    setClassSettings((prev) => {
      const newSettings = { ...prev };
      let lastEndMins = 0;

      dayClasses.forEach((cls) => {
        const setting = newSettings[cls.id];
        if (!setting) return;

        // Online classes don't participate in ripple
        if (setting.isOnline) {
          return;
        }

        const origMins = parseTimeToMinutes(setting.originalTime);
        // Start at MAX(original time, end of last active class)
        const startMins = Math.max(origMins, lastEndMins);
        
        // Convert back to HH:MM:SS format for storage
        const h = Math.floor(startMins / 60);
        const m = startMins % 60;
        newSettings[cls.id] = {
          ...setting,
          currentTime: `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}:00`,
        };

        // If cancelled, don't add to ripple chain
        if (setting.selectedTeacher === 'CANCELLED') {
          return;
        }

        // Calculate end time for next class
        lastEndMins = startMins + (setting.is2Hour ? 120 : 60);
      });

      return newSettings;
    });
  }, [dayClasses]);

  // Trigger ripple calculation when settings change
  useEffect(() => {
    calculateRippleTimes();
  }, [
    // Only trigger on toggle changes, not the full settings object
    JSON.stringify(
      Object.values(classSettings).map((s) => ({
        id: s.classId,
        is2Hour: s.is2Hour,
        isOnline: s.isOnline,
        cancelled: s.selectedTeacher === 'CANCELLED',
      }))
    ),
  ]);

  const updateClassSetting = (classId: string, key: keyof ClassAnnouncement, value: any) => {
    setClassSettings((prev) => ({
      ...prev,
      [classId]: {
        ...prev[classId],
        [key]: value,
      },
    }));
    setGeneratedText('');
  };

  const getTeacherDisplayName = (teacherId: string, subjectId: string) => {
    const teachers = teachersBySubject?.[subjectId] || [];
    const teacher = teachers.find((t) => t.id === teacherId);
    if (teacher) {
      return getShortTeacherName(teacher.first_name, teacher.last_name);
    }
    return 'Teacher TBA';
  };

  const generateAnnouncement = () => {
    // Ensure ripple is calculated
    calculateRippleTimes();

    const dateStr = format(selectedDate, 'd MMM yyyy');
    const dayName = DAY_NAMES[selectedDate.getDay()];

    // Find the first class with a room to use as default room
    const defaultRoom = dayClasses.find(cls => classSettings[cls.id]?.room)?.room || 'CR-2';

    // Check if ALL active (non-cancelled) classes are online
    const activeSettings = Object.values(classSettings).filter(s => s.selectedTeacher !== 'CANCELLED');
    const allOnline = activeSettings.length > 0 && activeSettings.every(s => s.isOnline);

    let msg = `*CLASS ANNOUNCEMENT*\n\n`;
    msg += `*Date:* ${dateStr} (${dayName})\n`;
    if (allOnline) {
      msg += `*Online:* \`Zoom App\`\n`;
    } else {
      msg += `*Room:* \`${defaultRoom}\`\n`;
    }
    msg += `------------------\n\n`;

    // Collect active classes (not cancelled)
    const activeClasses: {
      sortTime: number;
      text: string;
    }[] = [];

    dayClasses.forEach((cls) => {
      const settings = classSettings[cls.id];
      if (!settings || settings.selectedTeacher === 'CANCELLED') return;

      let displayTime = '';
      let suffix = '';
      let sortTime = 0;

      if (settings.isOnline) {
        // Parse custom time "HH:MM" to display format
        const [h, m] = settings.customTime.split(':').map(Number);
        sortTime = h * 60 + m;
        displayTime = minsToDisplayStr(sortTime);
        suffix = ' *(Online Class)*';
      } else {
        const startMins = parseTimeToMinutes(settings.currentTime);
        sortTime = startMins;

        if (settings.is2Hour) {
          // Show time range with 5-min buffer (e.g., 09:00 AM-10:55 AM)
          const endMins = startMins + 120 - 5;
          displayTime = `${minsToDisplayStr(startMins)}-${minsToDisplayStr(endMins)}`;
        } else {
          displayTime = minsToDisplayStr(startMins);
        }
      }

      const teacherName = getTeacherDisplayName(settings.selectedTeacher, settings.subjectId);

      activeClasses.push({
        sortTime,
        text: `\`${displayTime}\`\n*${settings.subjectName}*${suffix}\n_${teacherName}_`,
      });
    });

    // Sort by time
    activeClasses.sort((a, b) => a.sortTime - b.sortTime);

    if (activeClasses.length > 0) {
      activeClasses.forEach((obj, index) => {
        msg += `${index + 1}. ${obj.text}\n\n`;
      });
    } else {
      msg += `*No classes scheduled.*\n`;
    }

    setGeneratedText(msg);
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(generatedText);
      setCopied(true);
      toast.success('Copied to clipboard!', { duration: 1000 });
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Failed to copy', { duration: 1000 });
    }
  };

  const shareToWhatsApp = () => {
    const encoded = encodeURIComponent(generatedText);
    window.open(`https://wa.me/?text=${encoded}`, '_blank');
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 pb-24 max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center space-y-1">
        <h1 className="text-xl font-bold">CR Dashboard</h1>
        <p className="text-sm text-muted-foreground">Class Announcements</p>
      </div>

      {/* Date Picker */}
      <div className="surface-card p-4 space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Select Date
        </Label>
        <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={cn(
                'w-full justify-start text-left font-medium h-12 rounded-xl',
                !selectedDate && 'text-muted-foreground'
              )}
            >
              <CalendarIcon className="mr-3 h-4 w-4" />
              {selectedDate ? format(selectedDate, 'EEEE, d MMMM yyyy') : <span>Pick a date</span>}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0 bg-popover border-border z-50" align="start">
            <Calendar
              mode="single"
              selected={selectedDate}
              onSelect={(date) => {
                if (date) {
                  setSelectedDate(date);
                  setCalendarOpen(false);
                }
              }}
              initialFocus
              className="p-3 pointer-events-auto"
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Classes List */}
      <div className="space-y-3">
        <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Schedule
        </Label>

        {dayClasses.length === 0 ? (
          <div className="surface-card p-8 text-center">
            <CalendarIcon className="w-12 h-12 mx-auto text-muted-foreground/50 mb-3" />
            <p className="font-medium">No Classes</p>
            <p className="text-sm text-muted-foreground">
              No classes on {DAY_NAMES[selectedDate.getDay()]}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {dayClasses.map((cls) => {
              const settings = classSettings[cls.id];
              if (!settings) return null;

              const subjectTeachers = teachersBySubject?.[cls.subject_id] || [];
              const isCancelled = settings.selectedTeacher === 'CANCELLED';
              const displayTime = settings.isOnline
                ? minsToDisplayStr(
                    parseInt(settings.customTime.split(':')[0]) * 60 +
                      parseInt(settings.customTime.split(':')[1])
                  )
                : minsToDisplayStr(parseTimeToMinutes(settings.currentTime));

              return (
                <div
                  key={cls.id}
                  className={cn(
                    'surface-card p-4 space-y-3 transition-all duration-200',
                    settings.isOnline && !isCancelled && 'bg-blue-500/10 border-blue-500/30',
                    isCancelled && 'opacity-50 bg-destructive/5'
                  )}
                >
                  {/* Top Row - Time and Toggles */}
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-muted-foreground" />
                      {settings.isOnline && !isCancelled ? (
                        <input
                          type="time"
                          value={settings.customTime}
                          onChange={(e) => updateClassSetting(cls.id, 'customTime', e.target.value)}
                          className="text-sm font-semibold bg-background border border-border rounded-lg px-2 py-1"
                        />
                      ) : (
                        <span
                          className={cn(
                            'text-sm font-semibold bg-muted/50 px-2.5 py-1 rounded-lg',
                            isCancelled && 'line-through'
                          )}
                        >
                          {displayTime}
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
                        <Switch
                          checked={settings.is2Hour}
                          onCheckedChange={(v) => updateClassSetting(cls.id, 'is2Hour', v)}
                          disabled={isCancelled || settings.isOnline}
                        />
                        <span>2H</span>
                      </label>
                      <label className="flex items-center gap-2 text-xs font-medium text-muted-foreground cursor-pointer">
                        <Switch
                          checked={settings.isOnline}
                          onCheckedChange={(v) => updateClassSetting(cls.id, 'isOnline', v)}
                          disabled={isCancelled}
                        />
                        <Video className="w-3.5 h-3.5" />
                      </label>
                    </div>
                  </div>

                  {/* Subject Name */}
                  <div className="flex items-center gap-2">
                    <div
                      className="w-3 h-3 rounded-full shrink-0"
                      style={{ backgroundColor: settings.subjectColor }}
                    />
                    <span className={cn('font-semibold truncate', isCancelled && 'line-through')}>
                      {settings.subjectName}
                    </span>
                    {isCancelled && (
                      <span className="ml-auto text-xs text-destructive font-medium flex items-center gap-1">
                        <X className="w-3 h-3" /> Cancelled
                      </span>
                    )}
                  </div>

                  {/* Teacher Dropdown */}
                  <Select
                    value={settings.selectedTeacher}
                    onValueChange={(value) => updateClassSetting(cls.id, 'selectedTeacher', value)}
                  >
                    <SelectTrigger className="w-full bg-background">
                      <SelectValue placeholder="Select teacher" />
                    </SelectTrigger>
                    <SelectContent className="bg-popover border-border z-50">
                      {subjectTeachers.map((teacher) => (
                        <SelectItem key={teacher.id} value={teacher.id}>
                          {teacher.first_name} {teacher.last_name}
                        </SelectItem>
                      ))}
                      <SelectItem value="CANCELLED" className="text-destructive">
                        ❌ Class Cancelled
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Action Buttons */}
      {dayClasses.length > 0 && (
        <div className="space-y-3">
          <Button onClick={generateAnnouncement} className="w-full" size="lg">
            Generate Announcement
          </Button>

          {generatedText && (
            <>
              <div className="surface-card p-4 space-y-3">
                <Label className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
                  Preview
                </Label>
                <Textarea
                  value={generatedText}
                  readOnly
                  className="min-h-[200px] font-mono text-xs bg-muted/30"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Button onClick={copyToClipboard} variant="outline" className="gap-2">
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? 'Copied!' : 'Copy Text'}
                </Button>
                <Button
                  onClick={shareToWhatsApp}
                  className="gap-2 bg-[#25D366] hover:bg-[#20BD5A] text-white"
                >
                  <MessageCircle className="w-4 h-4" />
                  Share WhatsApp
                </Button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
