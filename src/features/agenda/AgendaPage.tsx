import { useState, useMemo } from 'react';
import { CalendarDays, CheckCircle2, AlertTriangle, Loader2, MoreVertical, Pencil, Trash2, Calendar, SlidersHorizontal, MapPin, ArrowRight, CheckSquare, X, Clock, Target } from 'lucide-react';
import { format, isSameDay, isToday, parseISO, startOfDay, addDays, getDay } from 'date-fns';
import { useSubjects } from '@/hooks/useSubjects';
import { useTasks, useToggleTaskComplete, useDeleteTask, useBulkUpdateTasks, useBulkDeleteTasks } from '@/hooks/useTasks';
import { useClasses } from '@/hooks/useClasses';
import { useIsMobile } from '@/hooks/use-mobile';
import { cn } from '@/lib/utils';
import { formatRelativeDate, isOverdue } from '@/hooks/useTime';
import { EmptyState } from '@/components/shared/EmptyState';
import { EditTaskForm } from './components/EditTaskForm';
import { AgendaSettingsSheet, LayoutType } from './components/AgendaSettingsSheet';
import { AgendaWeekStrip } from './components/AgendaWeekStrip';
import { TaskDetailSheet } from './components/TaskDetailSheet';
import { Checkbox } from '@/components/ui/checkbox';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { Database } from '@/integrations/supabase/types';

type Task = Database['public']['Tables']['tasks']['Row'];
type TimetableClass = Database['public']['Tables']['classes']['Row'];

// Union type for agenda items (tasks or class instances)
interface ClassInstance {
  type: 'class';
  id: string;
  classData: TimetableClass;
  date: string;
}

interface TaskInstance {
  type: 'task';
  id: string;
  taskData: Task;
}

type AgendaItem = ClassInstance | TaskInstance;

interface AgendaSettings {
  layout: LayoutType;
  showUpcomingClasses: boolean;
  showCompleted: boolean;
  showArchived: boolean;
}

export function AgendaPage() {
  const { data: subjects } = useSubjects();
  const { data: tasks, isLoading: tasksLoading } = useTasks();
  const { data: classes, isLoading: classesLoading } = useClasses();
  const toggleTask = useToggleTaskComplete();
  const deleteTask = useDeleteTask();
  const bulkUpdate = useBulkUpdateTasks();
  const bulkDelete = useBulkDeleteTasks();
  const isMobile = useIsMobile();
  
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [viewTask, setViewTask] = useState<Task | null>(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [selectionMode, setSelectionMode] = useState(false);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkPriorityOpen, setBulkPriorityOpen] = useState(false);
  const [deadlinesMode, setDeadlinesMode] = useState(false);
  const [settings, setSettings] = useState<AgendaSettings>({
    layout: 'agenda',
    showUpcomingClasses: false,
    showCompleted: true,
    showArchived: false,
  });
  
  const getSubject = (id?: string | null) => subjects?.find((s) => s.id === id);

  // Helper to format time
  const formatTime = (time: string) => {
    const [hours, minutes] = time.split(':').map(Number);
    const period = hours >= 12 ? 'PM' : 'AM';
    const displayHours = hours % 12 || 12;
    return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
  };

  // Generate class instances for the next 14 days when showUpcomingClasses is enabled
  const classInstances = useMemo(() => {
    if (!settings.showUpcomingClasses || !classes) return [];
    
    const instances: ClassInstance[] = [];
    const today = startOfDay(new Date());
    
    // Generate class instances for next 14 days
    for (let i = 0; i < 14; i++) {
      const date = addDays(today, i);
      const dayOfWeek = getDay(date);
      const dateStr = format(date, 'yyyy-MM-dd');
      
      // Find classes that occur on this day of week
      classes.forEach(cls => {
        if (cls.day === dayOfWeek) {
          instances.push({
            type: 'class',
            id: `class-${cls.id}-${dateStr}`,
            classData: cls,
            date: dateStr,
          });
        }
      });
    }
    
    return instances;
  }, [classes, settings.showUpcomingClasses]);

  // Group all items (tasks + classes) by date
  const groupedItems = useMemo(() => {
    const groups: Record<string, AgendaItem[]> = {};
    
    // Add tasks
    (tasks ?? []).forEach(task => {
      // Filter based on settings
      if (task.is_completed && !settings.showCompleted) return;
      // Note: showArchived would need an 'archived' field on tasks - skip for now
      
      const dateKey = task.due_date;
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push({
        type: 'task',
        id: task.id,
        taskData: task,
      });
    });
    
    // Add class instances if enabled
    if (settings.showUpcomingClasses) {
      classInstances.forEach(instance => {
        const dateKey = instance.date;
        if (!groups[dateKey]) {
          groups[dateKey] = [];
        }
        groups[dateKey].push(instance);
      });
    }
    
    // Sort items within each date by time
    Object.keys(groups).forEach(dateKey => {
      groups[dateKey].sort((a, b) => {
        const timeA = a.type === 'task' 
          ? (a.taskData.due_time || '23:59:59')
          : a.classData.start_time;
        const timeB = b.type === 'task'
          ? (b.taskData.due_time || '23:59:59')
          : b.classData.start_time;
        return timeA.localeCompare(timeB);
      });
    });
    
    return groups;
  }, [tasks, classInstances, settings.showCompleted, settings.showUpcomingClasses]);

  // Get sorted date keys
  const sortedDates = useMemo(() => {
    return Object.keys(groupedItems).sort(
      (a, b) => new Date(a).getTime() - new Date(b).getTime()
    );
  }, [groupedItems]);

  // Filter dates that have visible items
  const filteredDates = useMemo(() => {
    return sortedDates.filter(dateKey => {
      const items = groupedItems[dateKey];
      return items && items.length > 0;
    });
  }, [sortedDates, groupedItems]);

  const getDateLabel = (dateStr: string) => {
    const date = parseISO(dateStr);
    const today = startOfDay(new Date());
    
    if (isSameDay(date, today)) {
      return `Today • ${format(date, 'EEEE')} • ${format(date, 'MMM d')}`;
    }
    
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (isSameDay(date, tomorrow)) {
      return `Tomorrow • ${format(date, 'EEEE')} • ${format(date, 'MMM d')}`;
    }
    
    return `${format(date, 'EEEE')} • ${format(date, 'MMM d')}`;
  };
  
  const pendingCount = tasks?.filter((t) => !t.is_completed).length ?? 0;
  const completedCount = tasks?.filter((t) => t.is_completed).length ?? 0;

  // Deadlines view: only incomplete tasks sorted by urgency
  const deadlineItems = useMemo(() => {
    if (!deadlinesMode || !tasks) return [];
    const today = startOfDay(new Date());
    return tasks
      .filter(t => !t.is_completed)
      .sort((a, b) => new Date(a.due_date).getTime() - new Date(b.due_date).getTime())
      .map(t => {
        const dueDate = new Date(t.due_date);
        const diff = Math.ceil((dueDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
        let urgency: 'overdue' | 'today' | 'week' | 'later' = 'later';
        if (diff < 0) urgency = 'overdue';
        else if (diff === 0) urgency = 'today';
        else if (diff <= 7) urgency = 'week';
        return { task: t, urgency, diff };
      });
  }, [deadlinesMode, tasks]);
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'exam': return '📝';
      case 'assignment': return '📋';
      case 'reminder': return '🔔';
      default: return '📚';
    }
  };
  
  const handleDelete = async () => {
    if (deleteId) {
      await deleteTask.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };

  const handleGoToToday = () => {
    setSelectedDate(new Date());
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const exitSelectionMode = () => {
    setSelectionMode(false);
    setSelectedIds(new Set());
  };

  const handleBulkComplete = async () => {
    if (selectedIds.size === 0) return;
    await bulkUpdate.mutateAsync({ ids: Array.from(selectedIds), updates: { is_completed: true } });
    exitSelectionMode();
  };

  const handleBulkDelete = async () => {
    if (selectedIds.size === 0) return;
    await bulkDelete.mutateAsync(Array.from(selectedIds));
    exitSelectionMode();
  };

  const handleBulkPriority = async (priority: 'high' | 'low' | 'medium') => {
    if (selectedIds.size === 0) return;
    await bulkUpdate.mutateAsync({ ids: Array.from(selectedIds), updates: { priority } });
    setBulkPriorityOpen(false);
    exitSelectionMode();
  };

  const TaskCard = ({ task, isCompleted }: { task: Task; isCompleted: boolean }) => {
    const subject = getSubject(task.subject_id);
    const overdue = !isCompleted && isOverdue(task.due_date);
    
    const handleCardClick = (e: React.MouseEvent) => {
      // Don't open detail if clicking on checkbox or menu
      const target = e.target as HTMLElement;
      if (target.closest('button') || target.closest('[role="checkbox"]')) {
        return;
      }
      if (selectionMode) {
        toggleSelection(task.id);
        return;
      }
      setViewTask(task);
    };
    
    const cardContent = (
      <div 
        onClick={handleCardClick}
        className={cn(
          'surface-card p-4 flex items-start gap-3 group transition-all cursor-pointer hover:bg-muted/30 active:scale-[0.99]',
          overdue && 'border-destructive/50',
          isCompleted && 'opacity-60',
          selectionMode && selectedIds.has(task.id) && 'bg-primary/10 border-primary/30'
        )}
      >
        {selectionMode ? (
          <Checkbox
            checked={selectedIds.has(task.id)}
            onCheckedChange={() => toggleSelection(task.id)}
            className="mt-1"
          />
        ) : (
          <Checkbox
            checked={task.is_completed}
            onCheckedChange={() => toggleTask.mutate({ 
              id: task.id, 
              is_completed: !task.is_completed 
            })}
            className="mt-1"
          />
        )}
        
        <div className="flex-1 min-w-0">
          <div className="flex items-start gap-2">
            <span>{getTypeIcon(task.type)}</span>
            <div className="flex-1 min-w-0">
              <h3 className={cn("font-medium", isCompleted && "line-through")}>
                {task.title}
              </h3>
              {subject && (
                <div className="flex items-center gap-2 mt-1">
                  <div 
                    className="w-2 h-2 rounded-full" 
                    style={{ backgroundColor: subject.color }}
                  />
                  <span className="text-sm text-muted-foreground">
                    {subject.name}
                  </span>
                </div>
              )}
              {task.notes && !isCompleted && (
                <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                  {task.notes}
                </p>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex flex-col items-end gap-1">
          <div className="flex items-center gap-1">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className={`p-1 rounded-lg hover:bg-muted transition-all ${!isMobile ? 'opacity-0 group-hover:opacity-100' : ''}`}>
                  <MoreVertical className="w-4 h-4" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="bg-popover border border-border z-50">
                <DropdownMenuItem onClick={() => setEditTask(task)}>
                  <Pencil className="w-4 h-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-destructive focus:text-destructive"
                  onClick={() => setDeleteId(task.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          {task.due_time && (
            <span className="text-xs text-muted-foreground">
              {task.due_time}
            </span>
          )}
          {task.priority === 'high' && !isCompleted && (
            <AlertTriangle className="w-4 h-4 text-destructive" />
          )}
        </div>
      </div>
    );
    
    return <div className="rounded-xl stagger-item">{cardContent}</div>;
  };

  const isLoading = tasksLoading || classesLoading;

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header with icons */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-border">
        {selectionMode ? (
          <>
            <div className="flex items-center gap-2">
              <button onClick={exitSelectionMode} className="p-2 rounded-lg hover:bg-muted">
                <X className="w-5 h-5" />
              </button>
              <span className="font-medium">{selectedIds.size} selected</span>
            </div>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold">Agenda</h1>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setDeadlinesMode(!deadlinesMode)}
                className={cn(
                  "p-2 rounded-lg transition-all",
                  deadlinesMode ? "bg-primary/10 text-primary" : "hover:bg-muted text-muted-foreground"
                )}
                title="Deadlines view"
              >
                <Target className="w-5 h-5" />
              </button>
              <button
                onClick={() => setSelectionMode(true)}
                className="p-2 rounded-lg hover:bg-muted transition-all"
                title="Select tasks"
              >
                <CheckSquare className="w-5 h-5 text-muted-foreground" />
              </button>
              <button
                onClick={handleGoToToday}
                className="p-2 rounded-lg hover:bg-muted transition-all"
                title="Go to today"
              >
                <Calendar className="w-5 h-5 text-muted-foreground" />
              </button>
              <button
                onClick={() => setSettingsOpen(true)}
                className="p-2 rounded-lg hover:bg-muted transition-all"
                title="Settings"
              >
                <SlidersHorizontal className="w-5 h-5 text-muted-foreground" />
              </button>
            </div>
          </>
        )}
      </header>

      {/* Week Strip */}
      <AgendaWeekStrip 
        selectedDate={selectedDate} 
        onDateSelect={setSelectedDate} 
      />

      {/* Items List by Date */}
      <div className="flex-1 overflow-y-auto pb-24">
        {/* Deadlines Mode */}
        {deadlinesMode ? (
          deadlineItems.length > 0 ? (
            <div>
              {/* Urgency groups */}
              {(['overdue', 'today', 'week', 'later'] as const).map(urgency => {
                const items = deadlineItems.filter(d => d.urgency === urgency);
                if (items.length === 0) return null;
                const labels = {
                  overdue: { text: 'Overdue', color: 'text-destructive' },
                  today: { text: 'Due Today', color: 'text-orange-500' },
                  week: { text: 'This Week', color: 'text-yellow-500' },
                  later: { text: 'Upcoming', color: 'text-muted-foreground' },
                };
                const label = labels[urgency];
                return (
                  <div key={urgency}>
                    <div className="px-4 py-3 bg-muted/30 sticky top-0 z-10 flex items-center gap-2">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        urgency === 'overdue' ? 'bg-destructive' :
                        urgency === 'today' ? 'bg-orange-500' :
                        urgency === 'week' ? 'bg-yellow-500' : 'bg-muted-foreground'
                      )} />
                      <h2 className={cn("text-sm font-medium", label.color)}>
                        {label.text} ({items.length})
                      </h2>
                    </div>
                    <div className="divide-y divide-border">
                      {items.map(({ task }) => (
                        <TaskCard key={task.id} task={task} isCompleted={false} />
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-4">
              <EmptyState
                icon={<Target className="w-8 h-8" />}
                title="No deadlines"
                description="All tasks are completed!"
              />
            </div>
          )
        ) : filteredDates.length > 0 ? (
          <div>
            {filteredDates.map((dateKey) => {
              const items = groupedItems[dateKey];
              
              if (!items || items.length === 0) return null;
              
              return (
                <div key={dateKey}>
                  {/* Date Header */}
                  <div className="px-4 py-3 bg-muted/30 sticky top-0 z-10">
                    <h2 className="text-sm font-medium text-muted-foreground">
                      {getDateLabel(dateKey)}
                    </h2>
                  </div>
                  
                  {/* Items for this date */}
                  <div className="divide-y divide-border">
                    {items.map((item) => {
                      if (item.type === 'task') {
                        return (
                          <TaskCard 
                            key={item.id} 
                            task={item.taskData} 
                            isCompleted={item.taskData.is_completed} 
                          />
                        );
                      } else {
                        // Render class card
                        const subject = getSubject(item.classData.subject_id);
                        if (!subject) return null;
                        
                        return (
                          <div 
                            key={item.id}
                            className="surface-card p-4 flex items-center gap-3"
                          >
                            <div 
                              className="w-1 h-12 rounded-full shrink-0"
                              style={{ backgroundColor: subject.color }}
                            />
                            <div className="flex-1 min-w-0">
                              <h3 className="font-medium">{subject.name}</h3>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground mt-1">
                                <span>{formatTime(item.classData.start_time)}</span>
                                <ArrowRight className="w-3 h-3" />
                                <span>{formatTime(item.classData.end_time)}</span>
                                {item.classData.room && (
                                  <>
                                    <span className="mx-1">•</span>
                                    <MapPin className="w-3 h-3" />
                                    <span>{item.classData.room}</span>
                                  </>
                                )}
                              </div>
                            </div>
                            <div className="text-xs text-primary font-medium px-2 py-1 rounded-full bg-primary/10">
                              Class
                            </div>
                          </div>
                        );
                      }
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="p-4">
            <EmptyState
              icon={<CheckCircle2 className="w-8 h-8" />}
              title="All caught up!"
              description={settings.showUpcomingClasses 
                ? "No tasks or classes to show" 
                : "No tasks to show"}
            />
          </div>
        )}

      </div>

      {/* Bulk Actions Bar */}
      {selectionMode && selectedIds.size > 0 && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-2 rounded-2xl bg-card border border-border shadow-xl md:bottom-8">
          <button
            onClick={handleBulkComplete}
            disabled={bulkUpdate.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-primary/10 text-primary text-sm font-medium hover:bg-primary/20 transition-colors"
          >
            <CheckCircle2 className="w-4 h-4" />
            Complete
          </button>
          <button
            onClick={() => setBulkPriorityOpen(!bulkPriorityOpen)}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-muted/80 transition-colors"
          >
            <AlertTriangle className="w-4 h-4" />
            Priority
          </button>
          <button
            onClick={handleBulkDelete}
            disabled={bulkDelete.isPending}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-destructive/10 text-destructive text-sm font-medium hover:bg-destructive/20 transition-colors"
          >
            <Trash2 className="w-4 h-4" />
            Delete
          </button>
        </div>
      )}

      {/* Bulk Priority Picker */}
      {bulkPriorityOpen && (
        <div className="fixed bottom-36 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2 p-3 rounded-2xl bg-card border border-border shadow-xl md:bottom-24">
          {(['low', 'medium', 'high'] as const).map((p) => (
            <button
              key={p}
              onClick={() => handleBulkPriority(p)}
              className={cn(
                'px-4 py-2 rounded-xl text-sm font-medium capitalize transition-colors',
                p === 'high' ? 'bg-destructive/10 text-destructive hover:bg-destructive/20' :
                p === 'medium' ? 'bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20' :
                'bg-green-500/10 text-green-600 hover:bg-green-500/20'
              )}
            >
              {p}
            </button>
          ))}
        </div>
      )}

      {/* Settings Sheet */}
      <AgendaSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={settings}
        onSettingsChange={setSettings}
      />
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Task?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The task will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteTask.isPending}
            >
              {deleteTask.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit Form - Desktop Dialog */}
      {!isMobile && (
        <Dialog open={!!editTask} onOpenChange={() => setEditTask(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Task</DialogTitle>
            </DialogHeader>
            {editTask && (
              <EditTaskForm 
                task={editTask} 
                onClose={() => setEditTask(null)} 
              />
            )}
          </DialogContent>
        </Dialog>
      )}
      
      {/* Edit Form - Mobile Sheet */}
      {isMobile && (
        <Sheet open={!!editTask} onOpenChange={() => setEditTask(null)}>
          <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Edit Task</SheetTitle>
            </SheetHeader>
            <div className="pt-4 pb-8">
              {editTask && (
                <EditTaskForm 
                  task={editTask} 
                  onClose={() => setEditTask(null)} 
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
      
      {/* Task Detail Sheet */}
      <TaskDetailSheet
        task={viewTask}
        open={!!viewTask}
        onOpenChange={(open) => !open && setViewTask(null)}
        onEdit={(task) => {
          setViewTask(null);
          setEditTask(task);
        }}
      />
    </div>
  );
}

export default AgendaPage;
