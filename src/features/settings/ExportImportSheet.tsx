import { useState, useRef } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useExportData, useImportFromFile } from '@/hooks/useDataExport';
import { useSubjects } from '@/hooks/useSubjects';
import { useTeachers } from '@/hooks/useTeachers';
import { useClasses } from '@/hooks/useClasses';
import { useTasks } from '@/hooks/useTasks';
import { Book, Users, Calendar, Download, Upload, Loader2, FileJson, ClipboardList, GraduationCap, CheckSquare, ArrowLeft, StickyNote } from 'lucide-react';
import { useNotes } from '@/hooks/useNotes';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';

interface ExportImportSheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface ParsedFileData {
  version: string;
  exportedAt: string;
  subjects?: any[];
  teachers?: any[];
  classes?: any[];
  tasks?: any[];
  grades?: any[];
  attendance?: any[];
  terms?: any[];
  [key: string]: any;
}

export function ExportImportSheet({ open, onOpenChange }: ExportImportSheetProps) {
  const [activeTab, setActiveTab] = useState<'export' | 'import'>('export');
  
  // Export state
  const [exportSubjects, setExportSubjects] = useState(true);
  const [exportTeachers, setExportTeachers] = useState(true);
  const [exportClasses, setExportClasses] = useState(true);
  const [exportTasks, setExportTasks] = useState(true);
  const [exportGrades, setExportGrades] = useState(true);
  const [exportAttendance, setExportAttendance] = useState(true);
  const [exportTerms, setExportTerms] = useState(true);
  const [exportNotes, setExportNotes] = useState(true);
  
  // Import state
  const [parsedFile, setParsedFile] = useState<ParsedFileData | null>(null);
  const [importSubjects, setImportSubjects] = useState(true);
  const [importTeachers, setImportTeachers] = useState(true);
  const [importClasses, setImportClasses] = useState(true);
  const [importTasks, setImportTasks] = useState(true);
  const [importGrades, setImportGrades] = useState(true);
  const [importAttendance, setImportAttendance] = useState(true);
  const [importTerms, setImportTerms] = useState(true);
  const [importNotes, setImportNotes] = useState(true);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const { data: subjects } = useSubjects();
  const { data: teachers } = useTeachers();
  const { data: classes } = useClasses();
  const { data: tasks } = useTasks();
  const { data: notes } = useNotes();
  
  const exportData = useExportData();
  const importFromFile = useImportFromFile();

  const handleExport = () => {
    if (!exportSubjects && !exportTeachers && !exportClasses && !exportTasks && !exportGrades && !exportAttendance && !exportTerms && !exportNotes) {
      toast.error('Please select at least one data type to export');
      return;
    }
    exportData.mutate({
      includeSubjects: exportSubjects,
      includeTeachers: exportTeachers,
      includeClasses: exportClasses,
      includeTasks: exportTasks,
      includeGrades: exportGrades,
      includeAttendance: exportAttendance,
      includeTerms: exportTerms,
      includeNotes: exportNotes,
    });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.json')) {
      toast.error('Please select a JSON file');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const data = JSON.parse(event.target?.result as string);
        
        if (!data.version || !data.exportedAt) {
          toast.error('Invalid export file format');
          return;
        }
        
        // Store parsed data and show toggle options
        setParsedFile(data);
        setImportSubjects(!!(data.subjects?.length));
        setImportTeachers(!!(data.teachers?.length));
        setImportClasses(!!(data.classes?.length));
        setImportTasks(!!(data.tasks?.length));
        setImportGrades(!!(data.grades?.length));
        setImportAttendance(!!(data.attendance?.length));
        setImportTerms(!!(data.terms?.length));
        setImportNotes(!!(data.notes?.length));
      } catch (error) {
        toast.error('Failed to parse file. Please ensure it\'s a valid JSON export file.');
      }
    };
    reader.readAsText(file);
  };

  const handleImport = () => {
    if (!parsedFile) return;
    
    if (!importSubjects && !importTeachers && !importClasses && !importTasks && !importGrades && !importAttendance && !importTerms && !importNotes) {
      toast.error('Please select at least one data type to import');
      return;
    }

    importFromFile.mutate({
      fileData: parsedFile,
      options: {
        includeSubjects: importSubjects,
        includeTeachers: importTeachers,
        includeClasses: importClasses,
        includeTasks: importTasks,
        includeGrades: importGrades,
        includeAttendance: importAttendance,
        includeTerms: importTerms,
        includeNotes: importNotes,
      },
    }, {
      onSuccess: () => {
        setParsedFile(null);
        if (fileInputRef.current) {
          fileInputRef.current.value = '';
        }
      },
    });
  };

  const resetImport = () => {
    setParsedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const hasData = (subjects?.length || 0) > 0 || (teachers?.length || 0) > 0 || (classes?.length || 0) > 0 || (notes?.length || 0) > 0;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="flex items-center gap-2">
            <FileJson className="w-5 h-5 text-primary" />
            Export / Import Data
          </SheetTitle>
          <SheetDescription>
            Backup your data to a file or restore from a previous export.
          </SheetDescription>
        </SheetHeader>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as 'export' | 'import')} className="mt-6">
          <TabsList className="w-full">
            <TabsTrigger value="export" className="flex-1 gap-2">
              <Download className="w-4 h-4" />
              Export
            </TabsTrigger>
            <TabsTrigger value="import" className="flex-1 gap-2">
              <Upload className="w-4 h-4" />
              Import
            </TabsTrigger>
          </TabsList>

          <TabsContent value="export" className="mt-6 space-y-4">
            {!hasData ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                You don't have any data to export yet.
              </p>
            ) : (
              <>
                <Label className="text-base">Select data to export</Label>
                
                <div className="space-y-3">
                  <ToggleItem icon={Book} title="Subjects" subtitle={`${subjects?.length || 0} subjects`} checked={exportSubjects} onChange={setExportSubjects} disabled={!subjects?.length} />
                  <ToggleItem icon={Users} title="Teachers" subtitle={`${teachers?.length || 0} teachers`} checked={exportTeachers} onChange={setExportTeachers} disabled={!teachers?.length} />
                  <ToggleItem icon={Calendar} title="Timetable" subtitle={`${classes?.length || 0} classes`} checked={exportClasses} onChange={setExportClasses} disabled={!classes?.length} />
                  <ToggleItem icon={ClipboardList} title="Tasks" subtitle={`${tasks?.length || 0} tasks`} checked={exportTasks} onChange={setExportTasks} disabled={!tasks?.length} />
                  <ToggleItem icon={GraduationCap} title="Grades & Terms" subtitle="Include grades and academic terms" checked={exportGrades && exportTerms} onChange={(v) => { setExportGrades(v); setExportTerms(v); }} />
                  <ToggleItem icon={CheckSquare} title="Attendance" subtitle="Include attendance records" checked={exportAttendance} onChange={setExportAttendance} />
                  <ToggleItem icon={StickyNote} title="Notes" subtitle={`${notes?.length || 0} notes`} checked={exportNotes} onChange={setExportNotes} disabled={!notes?.length} />
                </div>

                <Button onClick={handleExport} className="w-full" disabled={exportData.isPending}>
                  {exportData.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Download className="w-4 h-4 mr-2" />}
                  Export as JSON
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">Your data will be saved as a .json file</p>
              </>
            )}
          </TabsContent>

          <TabsContent value="import" className="mt-6 space-y-4">
            {!parsedFile ? (
              <div className="text-center space-y-4">
                <div className="w-16 h-16 mx-auto rounded-full bg-primary/10 flex items-center justify-center">
                  <Upload className="w-8 h-8 text-primary" />
                </div>
                <div>
                  <h3 className="font-medium mb-1">Import from File</h3>
                  <p className="text-sm text-muted-foreground">Select a previously exported JSON file to restore your data.</p>
                </div>
                <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
                <Button onClick={() => fileInputRef.current?.click()} className="w-full">
                  <FileJson className="w-4 h-4 mr-2" />
                  Select JSON File
                </Button>
                <p className="text-xs text-muted-foreground">This will add new records. Existing data won't be overwritten.</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="icon" onClick={resetImport} className="shrink-0">
                    <ArrowLeft className="w-4 h-4" />
                  </Button>
                  <Label className="text-base">Select data to import</Label>
                </div>
                
                <div className="space-y-3">
                  <ToggleItem icon={Users} title="Teachers" subtitle={`${parsedFile.teachers?.length || 0} teachers`} checked={importTeachers} onChange={setImportTeachers} disabled={!parsedFile.teachers?.length} />
                  <ToggleItem icon={Book} title="Subjects" subtitle={`${parsedFile.subjects?.length || 0} subjects`} checked={importSubjects} onChange={setImportSubjects} disabled={!parsedFile.subjects?.length} />
                  <ToggleItem icon={Calendar} title="Timetable" subtitle={`${parsedFile.classes?.length || 0} classes`} checked={importClasses} onChange={setImportClasses} disabled={!parsedFile.classes?.length} />
                  <ToggleItem icon={ClipboardList} title="Tasks" subtitle={`${parsedFile.tasks?.length || 0} tasks`} checked={importTasks} onChange={setImportTasks} disabled={!parsedFile.tasks?.length} />
                  <ToggleItem icon={GraduationCap} title="Grades & Terms" subtitle={`${parsedFile.grades?.length || 0} grades, ${parsedFile.terms?.length || 0} terms`} checked={importGrades && importTerms} onChange={(v) => { setImportGrades(v); setImportTerms(v); }} disabled={!parsedFile.grades?.length && !parsedFile.terms?.length} />
                  <ToggleItem icon={CheckSquare} title="Attendance" subtitle={`${parsedFile.attendance?.length || 0} records`} checked={importAttendance} onChange={setImportAttendance} disabled={!parsedFile.attendance?.length} />
                  <ToggleItem icon={StickyNote} title="Notes" subtitle={`${parsedFile.notes?.length || 0} notes`} checked={importNotes} onChange={setImportNotes} disabled={!parsedFile.notes?.length} />
                </div>

                <Button onClick={handleImport} className="w-full" disabled={importFromFile.isPending}>
                  {importFromFile.isPending ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Upload className="w-4 h-4 mr-2" />}
                  Import Selected Data
                </Button>
                
                <p className="text-xs text-muted-foreground text-center">New records will be added. Existing data won't be overwritten.</p>
              </>
            )}
          </TabsContent>
        </Tabs>
      </SheetContent>
    </Sheet>
  );
}

function ToggleItem({ 
  icon: Icon, title, subtitle, checked, onChange, disabled = false,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  subtitle: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <div className={cn(
      'flex items-center justify-between p-3 rounded-lg border transition-colors',
      checked && !disabled ? 'border-primary bg-primary/5' : 'border-border',
      disabled && 'opacity-50'
    )}>
      <div className="flex items-center gap-3">
        <Icon className="w-5 h-5 text-primary" />
        <div>
          <p className="font-medium text-sm">{title}</p>
          <p className="text-xs text-muted-foreground">{subtitle}</p>
        </div>
      </div>
      <Switch checked={checked} onCheckedChange={onChange} disabled={disabled} />
    </div>
  );
}
