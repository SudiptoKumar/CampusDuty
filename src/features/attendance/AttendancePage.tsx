import { useState } from 'react';
import { UserCheck, MoreVertical, Pencil, Trash2, Loader2, Calendar } from 'lucide-react';
import { useSubjects } from '@/hooks/useSubjects';
import { useAttendance, useDeleteAttendance } from '@/hooks/useAttendance';
import { useIsMobile } from '@/hooks/use-mobile';
import { EmptyState } from '@/components/shared/EmptyState';
import { EditAttendanceForm } from './components/EditAttendanceForm';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { Database } from '@/integrations/supabase/types';

type Attendance = Database['public']['Tables']['attendance']['Row'];

export function AttendancePage() {
  const { data: attendance, isLoading } = useAttendance();
  const { data: subjects } = useSubjects();
  const deleteAttendance = useDeleteAttendance();
  const isMobile = useIsMobile();
  
  const [view, setView] = useState<'stats' | 'records'>('stats');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [editRecord, setEditRecord] = useState<Attendance | null>(null);
  
  const getSubject = (id: string) => subjects?.find((s) => s.id === id);
  
  // Calculate attendance stats per subject
  const attendanceStats = (subjects ?? []).map((subject) => {
    const records = attendance?.filter((a) => a.subject_id === subject.id) ?? [];
    const present = records.filter((a) => a.status === 'present').length;
    const absent = records.filter((a) => a.status === 'absent' && !a.excused).length;
    const excused = records.filter((a) => a.excused).length;
    const tardy = records.filter((a) => a.status === 'tardy').length;
    const total = records.length;
    const rate = total > 0 ? (present / total) * 100 : 100;
    
    return {
      subject,
      present,
      absent,
      excused,
      tardy,
      total,
      rate,
    };
  }).filter((s) => s.total > 0);
  
  const handleDelete = async () => {
    if (deleteId) {
      await deleteAttendance.mutateAsync(deleteId);
      setDeleteId(null);
    }
  };
  
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'bg-green-500/20 text-green-500';
      case 'absent': return 'bg-red-500/20 text-red-500';
      case 'tardy': return 'bg-yellow-500/20 text-yellow-500';
      case 'left_early': return 'bg-orange-500/20 text-orange-500';
      default: return 'bg-muted text-muted-foreground';
    }
  };
  
  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'present': return 'Present';
      case 'absent': return 'Absent';
      case 'tardy': return 'Tardy';
      case 'left_early': return 'Left Early';
      default: return status;
    }
  };

  const AttendanceRecordCard = ({ record }: { record: Attendance }) => {
    const subject = getSubject(record.subject_id);
    
    const cardContent = (
      <div className="surface-card p-4 flex items-center gap-3 group">
        {subject && (
          <div 
            className="w-1 h-12 rounded-full"
            style={{ backgroundColor: subject.color }}
          />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h3 className="font-medium">{subject?.name || 'Unknown'}</h3>
            {record.excused && (
              <span className="text-xs px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-500">
                Excused
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 mt-1">
            <Calendar className="w-3 h-3 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {format(new Date(record.date), 'MMM d, yyyy')}
            </span>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className={cn(
            'text-xs px-2 py-1 rounded-full capitalize',
            getStatusColor(record.status)
          )}>
            {getStatusLabel(record.status)}
          </span>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className={`p-1 rounded-lg hover:bg-muted transition-all ${!isMobile ? 'opacity-0 group-hover:opacity-100' : ''}`}>
                <MoreVertical className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-popover border border-border z-50">
              <DropdownMenuItem onClick={() => setEditRecord(record)}>
                <Pencil className="w-4 h-4 mr-2" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem 
                className="text-destructive focus:text-destructive"
                onClick={() => setDeleteId(record.id)}
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
    
    return <div className="rounded-xl stagger-item">{cardContent}</div>;
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
      <header className="mb-6">
        <h1 className="text-2xl font-bold">Attendance</h1>
        <p className="text-muted-foreground text-sm">
          {attendance?.length ?? 0} record{(attendance?.length ?? 0) !== 1 ? 's' : ''}
        </p>
      </header>
      
      <Tabs value={view} onValueChange={(v) => setView(v as 'stats' | 'records')}>
        <TabsList className="mb-4 w-full">
          <TabsTrigger value="stats" className="flex-1">
            Statistics
          </TabsTrigger>
          <TabsTrigger value="records" className="flex-1">
            Records ({attendance?.length ?? 0})
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="stats" className="mt-0">
          {attendanceStats.length > 0 ? (
            <div className="space-y-3">
              {attendanceStats.map(({ subject, present, absent, excused, tardy, total, rate }) => (
                <div key={subject.id} className="surface-card p-4">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div 
                        className="w-3 h-3 rounded-full"
                        style={{ backgroundColor: subject.color }}
                      />
                      <span className="font-medium">{subject.name}</span>
                    </div>
                    <span className={cn(
                      'text-lg font-bold',
                      rate >= 90 ? 'text-green-500' : rate >= 75 ? 'text-yellow-500' : 'text-red-500'
                    )}>
                      {rate.toFixed(0)}%
                    </span>
                  </div>
                  
                  {/* Progress bar */}
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className={cn(
                        'h-full transition-all',
                        rate >= 90 ? 'bg-green-500' : rate >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                      )}
                      style={{ width: `${rate}%` }}
                    />
                  </div>
                  
                  <div className="flex gap-4 mt-2 text-xs text-muted-foreground">
                    <span>Present: {present}</span>
                    <span>Absent: {absent}</span>
                    <span>Tardy: {tardy}</span>
                    <span>Excused: {excused}</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <EmptyState
              icon={<UserCheck className="w-8 h-8" />}
              title="No attendance records"
              description="Start tracking your attendance for each class"
            />
          )}
        </TabsContent>
        
        <TabsContent value="records" className="mt-0">
          {attendance && attendance.length > 0 ? (
            <div className="space-y-2">
              {[...attendance]
                .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                .map((record) => (
                  <AttendanceRecordCard key={record.id} record={record} />
                ))}
            </div>
          ) : (
            <EmptyState
              icon={<UserCheck className="w-8 h-8" />}
              title="No attendance records"
              description="Start tracking your attendance for each class"
            />
          )}
        </TabsContent>
      </Tabs>
      
      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Record?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The attendance record will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleDelete} 
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleteAttendance.isPending}
            >
              {deleteAttendance.isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      
      {/* Edit Form - Desktop Dialog */}
      {!isMobile && (
        <Dialog open={!!editRecord} onOpenChange={() => setEditRecord(null)}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Edit Attendance</DialogTitle>
            </DialogHeader>
            {editRecord && (
              <EditAttendanceForm 
                attendance={editRecord} 
                onClose={() => setEditRecord(null)} 
              />
            )}
          </DialogContent>
        </Dialog>
      )}
      
      {/* Edit Form - Mobile Sheet */}
      {isMobile && (
        <Sheet open={!!editRecord} onOpenChange={() => setEditRecord(null)}>
          <SheetContent side="bottom" className="h-auto max-h-[90vh] rounded-t-2xl overflow-y-auto">
            <SheetHeader>
              <SheetTitle>Edit Attendance</SheetTitle>
            </SheetHeader>
            <div className="pt-4 pb-8">
              {editRecord && (
                <EditAttendanceForm 
                  attendance={editRecord} 
                  onClose={() => setEditRecord(null)} 
                />
              )}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </div>
  );
}

export default AttendancePage;
