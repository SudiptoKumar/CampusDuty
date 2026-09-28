import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { ArrowLeft, RotateCcw, Trash2, ChevronRight, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { AddOccurrenceSheet, Occurrence } from './AddOccurrenceSheet';
import { EditOccurrenceSheet } from './EditOccurrenceSheet';
import { DAY_NAMES } from '@/lib/mockData';

function formatTime(time: string) {
  const [hours, minutes] = time.split(':').map(Number);
  const period = hours >= 12 ? 'PM' : 'AM';
  const displayHours = hours % 12 || 12;
  return `${displayHours}:${minutes.toString().padStart(2, '0')} ${period}`;
}

interface LocationState {
  occurrences: Occurrence[];
  returnPath?: string;
  selectedSubjectId?: string;
  selectedTeacherIds?: string[];
  room?: string;
  notes?: string;
}

export function OccurrencesPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);
  
  // Get occurrences from navigation state
  const state = location.state as LocationState | null;
  const [occurrences, setOccurrences] = useState<Occurrence[]>(state?.occurrences || []);
  
  const handleAddOccurrence = (occurrence: Occurrence) => {
    setOccurrences(prev => [...prev, occurrence]);
  };
  
  const handleUpdateOccurrence = (index: number, occurrence: Occurrence) => {
    setOccurrences(prev => prev.map((o, i) => i === index ? occurrence : o));
    setEditingIndex(null);
  };
  
  const handleDeleteOccurrence = (index: number) => {
    if (occurrences.length > 1) {
      setOccurrences(prev => prev.filter((_, i) => i !== index));
    }
  };
  
  const handleBack = () => {
    // Navigate back with updated occurrences and preserved form state
    const returnPath = state?.returnPath || '/timetable/add';
    navigate(returnPath, { 
      state: { 
        occurrences, 
        fromOccurrences: true,
        selectedSubjectId: state?.selectedSubjectId,
        selectedTeacherIds: state?.selectedTeacherIds,
        room: state?.room,
        notes: state?.notes,
      },
      replace: true
    });
  };
  
  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 bg-background border-b border-border">
        <div className="flex items-center gap-4 p-4">
          <Button variant="ghost" size="icon" onClick={handleBack}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <h1 className="text-lg font-semibold">Occurrences</h1>
        </div>
      </header>
      
      <div className="p-4">
        <div className="surface-card rounded-2xl overflow-hidden divide-y divide-border">
          {occurrences.map((occurrence, index) => (
            <div 
              key={index}
              className="flex items-center gap-3 p-4"
            >
              <button
                onClick={() => setEditingIndex(index)}
                className="flex-1 text-left"
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{DAY_NAMES[occurrence.day]}</span>
                  <RotateCcw className="w-4 h-4 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground mt-1">
                  {formatTime(occurrence.startTime)} → {formatTime(occurrence.endTime)}
                </p>
              </button>
              
              {occurrences.length > 1 && (
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleDeleteOccurrence(index)}
                  className="text-primary"
                >
                  <Trash2 className="w-5 h-5" />
                </Button>
              )}
              
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setEditingIndex(index)}
              >
                <ChevronRight className="w-5 h-5" />
              </Button>
            </div>
          ))}
          
          {/* Add occurrence */}
          <button
            onClick={() => setShowAddSheet(true)}
            className="w-full flex items-center justify-between p-4 text-primary hover:bg-muted/50 transition-colors"
          >
            <span className="font-medium">Add occurrence</span>
            <Plus className="w-5 h-5" />
          </button>
        </div>
      </div>
      
      <AddOccurrenceSheet
        open={showAddSheet}
        onClose={() => setShowAddSheet(false)}
        onSave={handleAddOccurrence}
        existingOccurrences={occurrences}
      />
      
      {editingIndex !== null && occurrences[editingIndex] && (
        <EditOccurrenceSheet
          open={true}
          onClose={() => setEditingIndex(null)}
          occurrence={occurrences[editingIndex]}
          onSave={(occ) => handleUpdateOccurrence(editingIndex, occ)}
          existingOccurrences={occurrences}
          currentIndex={editingIndex}
        />
      )}
    </div>
  );
}
