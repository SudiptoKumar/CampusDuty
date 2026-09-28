import { useState } from 'react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { motion } from 'framer-motion';
import { useTasks, useToggleTaskComplete } from '@/hooks/useTasks';
import { useSubjects } from '@/hooks/useSubjects';
import { useClasses } from '@/hooks/useClasses';
import { useCampusEvents, useCreateEvent, useDeleteEvent, type CampusEvent } from '@/hooks/useEvents';
import { usePermission } from '@/hooks/usePermission';
import { useCurrentTimeUpdate, timeToMinutes, formatTimeDisplay, getClassStatus, getEffectiveEndMinutes } from '@/hooks/useCurrentTimeUpdate';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ChevronLeft, ChevronRight, Loader2, ArrowRight, CalendarDays, Clock, MapPin, Plus, Sparkles, Trash2 } from 'lucide-react';

// Event type colors
const EVENT_TYPE_COLORS = {
  exam: '#ef4444',       // Red
  assignment: '#3b82f6', // Blue
  homework: '#3b82f6',   // Blue (same as assignment)
  reminder: '#a855f7',   // Purple
  class: '#22c55e',      // Green
} as const;

const getEventColor = (type: string, eventType: 'task' | 'class') => {
  if (eventType === 'class') return EVENT_TYPE_COLORS.class;
  return EVENT_TYPE_COLORS[type as keyof typeof EVENT_TYPE_COLORS] || '#6b7280';
};

export function CalendarPage() {
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: subjects } = useSubjects();
  const { data: classes, isLoading: classesLoading } = useClasses();
  const toggleTask = useToggleTaskComplete();
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<Date | null>(new Date());
  const { isCR, isAdmin } = usePermission('cr');
  const canCreateEvent = isCR || isAdmin;
  const { data: campusEvents } = useCampusEvents(currentMonth);
  const deleteEvent = useDeleteEvent();
  
  // Use reactive time state - updates every minute for progress bars
  const { currentMinutes, dayOfWeek } = useCurrentTimeUpdate();
  
  const getSubject = (id?: string | null) => subjects?.find((s) => s.id === id);
  
  // Get all days in the current month view
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Pad with days from previous month to start on Sunday
  const startPadding = monthStart.getDay();
  const paddedDays = Array(startPadding).fill(null).concat(daysInMonth);
  
  // Get tasks for a specific date (assignments, exams, etc.)
  const getTasksForDate = (date: Date) => 
    tasks?.filter((t) => isSameDay(new Date(t.due_date), date)) ?? [];
  
  // Get classes for a specific date (based on day of week)
  const getClassesForDate = (date: Date) => {
    const dateDayOfWeek = getDay(date); // 0 = Sunday, 1 = Monday, etc.
    return classes?.filter((c) => c.day === dateDayOfWeek) ?? [];
  };
  
  // Get campus events for a specific date
  const getCampusEventsForDate = (date: Date) =>
    campusEvents?.filter(e => isSameDay(new Date(e.event_date), date)) ?? [];

  // Get unique event type indicators for a date (one dot per type, not per event)
  const getEventsForDate = (date: Date) => {
    const dayTasks = getTasksForDate(date);
    const dayClasses = getClassesForDate(date);
    const dayCampusEvents = getCampusEventsForDate(date);
    
    const eventTypes = new Map<string, { id: string; color: string; type: 'task' | 'class' }>();
    
    if (dayClasses.length > 0) {
      eventTypes.set('class', { id: 'class', color: EVENT_TYPE_COLORS.class, type: 'class' });
    }
    
    if (dayCampusEvents.length > 0) {
      eventTypes.set('campus_event', { id: 'campus_event', color: '#a855f7', type: 'task' });
    }
    
    dayTasks.forEach((task) => {
      if (!eventTypes.has(task.type)) {
        eventTypes.set(task.type, { id: task.type, color: getEventColor(task.type, 'task'), type: 'task' });
      }
    });
    
    return Array.from(eventTypes.values());
  };
  
  const selectedDateTasks = selectedDate ? getTasksForDate(selectedDate) : [];
  const selectedDateClasses = selectedDate ? getClassesForDate(selectedDate) : [];
  const selectedDateEvents = selectedDate ? getCampusEventsForDate(selectedDate) : [];

  const isLoading = tasksLoading || classesLoading;

  const handleGoToToday = () => {
    const today = new Date();
    setCurrentMonth(today);
    setSelectedDate(today);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24">
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Calendar</h1>
          <p className="text-muted-foreground text-sm">
            {format(currentMonth, 'MMMM yyyy')}
          </p>
        </div>
        
        <div className="flex gap-2">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={handleGoToToday}
            title="Go to today"
          >
            <CalendarDays className="w-5 h-5" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button 
            variant="outline" 
            size="icon"
            onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
      </header>
      
      {/* Calendar Grid */}
      <div className="surface-card p-4">
        {/* Day headers */}
        <div className="grid grid-cols-7 gap-1 mb-2">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div key={`${day}-${idx}`} className="text-center text-xs text-muted-foreground py-2 font-medium">
              {day}
            </div>
          ))}
        </div>
        
        {/* Days grid */}
        <div className="grid grid-cols-7 gap-1">
          {paddedDays.map((day, index) => {
            if (!day) {
              return <div key={`pad-${index}`} className="aspect-square" />;
            }
            
            const events = getEventsForDate(day);
            const isToday = isSameDay(day, new Date());
            const isSelected = selectedDate && isSameDay(day, selectedDate);
            
            return (
              <button
                key={day.toISOString()}
                onClick={() => setSelectedDate(day)}
                className={cn(
                  'aspect-square rounded-xl flex flex-col items-center justify-center gap-0.5 transition-all relative',
                  'hover:bg-muted',
                  isToday && !isSelected && 'bg-primary text-primary-foreground',
                  isSelected && 'bg-primary/20 text-primary ring-2 ring-primary',
                  !isSameMonth(day, currentMonth) && 'opacity-30'
                )}
              >
                <span className="text-sm font-medium">{format(day, 'd')}</span>
                {events.length > 0 && (
                  <div className="flex gap-0.5 absolute bottom-1">
                    {events.slice(0, 3).map((event) => (
                      <div 
                        key={event.id}
                        className="w-1.5 h-1.5 rounded-full"
                        style={{ backgroundColor: event.color }}
                      />
                    ))}
                    {events.length > 3 && (
                      <span className="text-[8px] text-muted-foreground">+{events.length - 3}</span>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
      
      {/* Selected Date Events */}
      {selectedDate && (
        <div className="mt-6 space-y-4">
          {/* Tasks Section (Assignments, Exams, etc.) */}
          {selectedDateTasks.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                  {selectedDateTasks.length}
                </span>
                <h2 className="font-semibold">Your events</h2>
                <span className="ml-auto text-sm text-muted-foreground">
                  {format(selectedDate, 'M/d/yy')}
                </span>
              </div>
              
              <div className="space-y-2">
                {selectedDateTasks.map((task) => {
                  const subject = getSubject(task.subject_id);
                  const typeColor = getEventColor(task.type, 'task');
                  return (
                    <div 
                      key={task.id}
                      className="surface-card p-4 flex items-center gap-3"
                    >
                      <Checkbox
                        checked={task.is_completed}
                        onCheckedChange={() => toggleTask.mutate({ 
                          id: task.id, 
                          is_completed: !task.is_completed 
                        })}
                        style={{ 
                          borderColor: typeColor,
                          backgroundColor: task.is_completed ? typeColor : 'transparent'
                        }}
                      />
                      <div 
                        className="w-1 h-10 rounded-full"
                        style={{ backgroundColor: typeColor }}
                      />
                      <div className="flex-1">
                        {subject && (
                          <p className="text-sm text-muted-foreground">{subject.name}</p>
                        )}
                        <p className={cn('font-medium', task.is_completed && 'line-through opacity-50')}>
                          {task.type.charAt(0).toUpperCase() + task.type.slice(1)}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
          
          {/* Classes Section - Reordered: Now → Upcoming → Earlier */}
          {selectedDateClasses.length > 0 && (() => {
            const isToday = isSameDay(selectedDate, new Date());
            
            // Group classes by status
            const classesWithStatus = selectedDateClasses
              .map((cls) => {
                const { status, progress } = getClassStatus(
                  cls.start_time,
                  cls.end_time,
                  cls.day,
                  currentMinutes,
                  isToday ? dayOfWeek : -1
                );
                return { cls, status, progress };
              })
              .sort((a, b) => a.cls.start_time.localeCompare(b.cls.start_time));
            
            const ongoingClasses = classesWithStatus.filter(c => c.status === 'ongoing');
            const upcomingClasses = classesWithStatus.filter(c => c.status === 'upcoming' || c.status === 'starting_soon');
            const pastClasses = classesWithStatus.filter(c => c.status === 'past');
            
            const renderClassCard = ({ cls, status, progress }: typeof classesWithStatus[0]) => {
              const subject = getSubject(cls.subject_id);
              const isOngoing = status === 'ongoing';
              const isStartingSoon = status === 'starting_soon';
              
              return (
                <div 
                  key={cls.id}
                  className="surface-card p-4 relative overflow-hidden"
                >
                  <div className="flex items-start gap-3">
                    <div 
                      className="w-3 h-3 rounded-full mt-1 flex-shrink-0"
                      style={{ backgroundColor: subject?.color || EVENT_TYPE_COLORS.class }}
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <p className="text-sm text-muted-foreground flex items-center gap-1">
                          {formatTimeDisplay(cls.start_time)}
                          <ArrowRight className="w-3 h-3" />
                          {formatTimeDisplay(cls.end_time)}
                        </p>
                        {isOngoing && (
                          <span className="flex items-center gap-1 text-xs text-green-500 font-medium">
                            <Clock className="w-3 h-3" />
                            Now
                          </span>
                        )}
                        {isStartingSoon && (
                          <span className="flex items-center gap-1 text-xs text-amber-500 font-medium">
                            <Clock className="w-3 h-3" />
                            Soon
                          </span>
                        )}
                      </div>
                      <p className="font-medium">{subject?.name || 'Unknown Subject'}</p>
                      {cls.room && (
                        <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                          <MapPin className="w-3 h-3" /> {cls.room}
                        </p>
                      )}
                    </div>
                  </div>
                  
                  {/* Progress bar for ongoing class */}
                  {isOngoing && (
                    <div className="mt-3 h-1.5 rounded-full bg-muted/50 overflow-hidden">
                      <motion.div
                        className="h-full rounded-full"
                        style={{ backgroundColor: subject?.color || EVENT_TYPE_COLORS.class }}
                        initial={{ width: 0 }}
                        animate={{ width: `${progress}%` }}
                        transition={{ duration: 0.5 }}
                      />
                    </div>
                  )}
                </div>
              );
            };
            
            return (
              <div className="space-y-4">
                {/* Right now section */}
                {isToday && ongoingClasses.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-green-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                        {ongoingClasses.length}
                      </span>
                      <h2 className="font-semibold text-green-600 dark:text-green-400">Right now</h2>
                    </div>
                    <div className="space-y-2">
                      {ongoingClasses.map(renderClassCard)}
                    </div>
                  </div>
                )}
                
                {/* Coming up section */}
                {isToday && upcomingClasses.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                        {upcomingClasses.length}
                      </span>
                      <h2 className="font-semibold">Coming up</h2>
                    </div>
                    <div className="space-y-2">
                      {upcomingClasses.map(renderClassCard)}
                    </div>
                  </div>
                )}
                
                {/* Earlier today section */}
                {isToday && pastClasses.length > 0 && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-muted text-muted-foreground text-xs font-bold px-2 py-1 rounded-full">
                        {pastClasses.length}
                      </span>
                      <h2 className="font-semibold text-muted-foreground">Earlier today</h2>
                    </div>
                    <div className="space-y-2 opacity-60">
                      {pastClasses.map(renderClassCard)}
                    </div>
                  </div>
                )}
                
                {/* For non-today dates, just show all classes */}
                {!isToday && (
                  <div>
                    <div className="flex items-center gap-2 mb-3">
                      <span className="bg-primary text-primary-foreground text-xs font-bold px-2 py-1 rounded-full">
                        {selectedDateClasses.length}
                      </span>
                      <h2 className="font-semibold">Your classes</h2>
                    </div>
                    <div className="space-y-2">
                      {classesWithStatus.map(renderClassCard)}
                    </div>
                  </div>
                )}
              </div>
            );
          })()}
          
          {/* Campus Events Section */}
          {selectedDateEvents.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="bg-purple-500 text-white text-xs font-bold px-2 py-1 rounded-full">
                  {selectedDateEvents.length}
                </span>
                <h2 className="font-semibold text-purple-600 dark:text-purple-400">Campus Events</h2>
              </div>
              <div className="space-y-2">
                {selectedDateEvents.map((event) => (
                  <div key={event.id} className="surface-card p-4 relative overflow-hidden border-l-4 border-purple-500">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-purple-500" />
                          <p className="font-medium text-sm">{event.title}</p>
                        </div>
                        {event.description && <p className="text-xs text-muted-foreground mt-1">{event.description}</p>}
                        <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                          {event.start_time && (
                            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{event.start_time.slice(0, 5)}{event.end_time ? ` - ${event.end_time.slice(0, 5)}` : ''}</span>
                          )}
                          {event.location && (
                            <span className="flex items-center gap-1"><MapPin className="w-3 h-3" />{event.location}</span>
                          )}
                        </div>
                      </div>
                      {canCreateEvent && (
                        <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive" onClick={() => deleteEvent.mutate(event.id)}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Create Event Button for CRs/Admins */}
          {canCreateEvent && selectedDate && <CreateEventSheet date={selectedDate} />}

          {/* Empty State */}
          {selectedDateTasks.length === 0 && selectedDateClasses.length === 0 && selectedDateEvents.length === 0 && (
            <div className="surface-card p-6 text-center space-y-2">
              <CalendarDays className="w-10 h-10 mx-auto text-muted-foreground/60" />
              <p className="text-muted-foreground font-medium">No events or classes for this day</p>
              <p className="text-xs text-muted-foreground/80 max-w-xs mx-auto">
                Add classes in Timetable or tasks in Agenda to see them here
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function CreateEventSheet({ date }: { date: Date }) {
  const createEvent = useCreateEvent();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({ title: '', description: '', start_time: '', end_time: '', location: '', event_type: 'general' });

  const handleSubmit = () => {
    if (!form.title.trim()) return;
    createEvent.mutate(
      { title: form.title, description: form.description || undefined, event_date: format(date, 'yyyy-MM-dd'), start_time: form.start_time || undefined, end_time: form.end_time || undefined, location: form.location || undefined, event_type: form.event_type },
      { onSuccess: () => { setOpen(false); setForm({ title: '', description: '', start_time: '', end_time: '', location: '', event_type: 'general' }); } }
    );
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="sm" className="w-full gap-1"><Plus className="w-4 h-4" /> Add Campus Event</Button>
      </SheetTrigger>
      <SheetContent side="bottom" className="rounded-t-2xl max-h-[85vh] overflow-y-auto">
        <SheetHeader><SheetTitle>Create Event for {format(date, 'MMM d, yyyy')}</SheetTitle></SheetHeader>
        <div className="space-y-4 mt-4">
          <div><Label>Title *</Label><Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Event name" /></div>
          <div><Label>Description</Label><Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} rows={2} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><Label>Start Time</Label><Input type="time" value={form.start_time} onChange={e => setForm(f => ({ ...f, start_time: e.target.value }))} /></div>
            <div><Label>End Time</Label><Input type="time" value={form.end_time} onChange={e => setForm(f => ({ ...f, end_time: e.target.value }))} /></div>
          </div>
          <div><Label>Location</Label><Input value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} placeholder="Room / Building" /></div>
          <div><Label>Type</Label>
            <Select value={form.event_type} onValueChange={v => setForm(f => ({ ...f, event_type: v }))}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="general">General</SelectItem>
                <SelectItem value="workshop">Workshop</SelectItem>
                <SelectItem value="seminar">Seminar</SelectItem>
                <SelectItem value="holiday">Holiday</SelectItem>
                <SelectItem value="sports">Sports</SelectItem>
                <SelectItem value="cultural">Cultural</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSubmit} disabled={!form.title.trim() || createEvent.isPending} className="w-full">
            {createEvent.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null} Create Event
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  );
}

export default CalendarPage;
