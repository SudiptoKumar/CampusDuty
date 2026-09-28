import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { StickyNote, Plus, Search, Pin, Trash2 } from 'lucide-react';
import { useNotes, useUpdateNote, useDeleteNote, Note } from '@/hooks/useNotes';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
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
import { MarkdownContent } from '@/features/classroom/components/MarkdownContent';
import { cn } from '@/lib/utils';

const NOTE_COLORS = [
  { name: 'Yellow', value: '#FEF3C7', textColor: '#92400E' },
  { name: 'Pink', value: '#FCE7F3', textColor: '#9D174D' },
  { name: 'Green', value: '#D1FAE5', textColor: '#065F46' },
  { name: 'Blue', value: '#DBEAFE', textColor: '#1E40AF' },
  { name: 'Purple', value: '#EDE9FE', textColor: '#5B21B6' },
  { name: 'Orange', value: '#FFEDD5', textColor: '#9A3412' },
];

const CATEGORIES = ['All', 'General', 'Study', 'Ideas', 'To-Do', 'Important'];

export function NotesPage() {
  const navigate = useNavigate();
  const { data: notes, isLoading } = useNotes();
  const updateNote = useUpdateNote();
  const deleteNote = useDeleteNote();
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [deleteNoteId, setDeleteNoteId] = useState<string | null>(null);
  
  // Filter notes
  const filteredNotes = (notes ?? []).filter(note => {
    const matchesSearch = note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (note.content?.toLowerCase().includes(searchQuery.toLowerCase()) ?? false);
    const matchesCategory = selectedCategory === 'All' || note.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });
  
  const pinnedNotes = filteredNotes.filter(n => n.is_pinned);
  const unpinnedNotes = filteredNotes.filter(n => !n.is_pinned);
  
  const togglePin = (note: Note) => {
    updateNote.mutate({ id: note.id, is_pinned: !note.is_pinned });
  };
  
  const getTextColor = (bgColor: string) => {
    const colorObj = NOTE_COLORS.find(c => c.value === bgColor);
    return colorObj?.textColor || '#1F2937';
  };
  
  const renderNoteCard = (note: Note, index: number) => (
    <motion.div
      key={note.id}
      layout
      initial={{ opacity: 0, scale: 0.9 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9 }}
      transition={{ delay: index * 0.05 }}
      className="relative group rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      style={{ 
        backgroundColor: note.color,
        transform: `rotate(${(index % 3 - 1) * 0.5}deg)`,
      }}
      onClick={() => navigate(`/notes/${note.id}/edit`)}
    >
      {note.is_pinned && (
        <Pin 
          className="absolute -top-1 -right-1 w-5 h-5 rotate-45" 
          style={{ color: getTextColor(note.color) }}
          fill="currentColor"
        />
      )}
      
      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex gap-1">
        <button
          onClick={(e) => { e.stopPropagation(); togglePin(note); }}
          className="p-1.5 rounded-lg bg-white/50 hover:bg-white/80 transition-colors"
        >
          <Pin className="w-3.5 h-3.5" style={{ color: getTextColor(note.color) }} />
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); setDeleteNoteId(note.id); }}
          className="p-1.5 rounded-lg bg-white/50 hover:bg-red-100 transition-colors"
        >
          <Trash2 className="w-3.5 h-3.5 text-red-600" />
        </button>
      </div>
      
      <h3 
        className="font-semibold text-sm mb-2 pr-8 line-clamp-2"
        style={{ color: getTextColor(note.color) }}
      >
        {note.title}
      </h3>
      
      {note.content && (
        <div 
          className="text-xs line-clamp-4 mb-3 opacity-80"
          style={{ color: getTextColor(note.color) }}
        >
          <MarkdownContent content={note.content} className="[&>*]:!mb-0 [&>*]:!text-inherit" />
        </div>
      )}
      
      <Badge 
        variant="secondary" 
        className="text-[10px] px-2 py-0.5"
        style={{ 
          backgroundColor: 'rgba(255,255,255,0.5)',
          color: getTextColor(note.color),
        }}
      >
        {note.category}
      </Badge>
    </motion.div>
  );
  
  if (isLoading) {
    return (
      <div className="p-4 md:p-6 lg:p-8 pb-24 max-w-4xl mx-auto">
        <div className="flex items-center gap-3 mb-6">
          <Skeleton className="w-10 h-10 rounded-xl" />
          <Skeleton className="h-8 w-32" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <Skeleton key={i} className="h-32 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="p-4 md:p-6 lg:p-8 pb-24 max-w-4xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-yellow-500/10 flex items-center justify-center">
              <StickyNote className="h-5 w-5 text-yellow-500" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">My Notes</h1>
              <p className="text-muted-foreground text-sm">
                {notes?.length || 0} notes
              </p>
            </div>
          </div>
          
          <Button
            onClick={() => navigate('/notes/new')}
            className="gap-2 rounded-xl"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">New Note</span>
          </Button>
        </div>
      </motion.div>
      
      {/* Search & Filters */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="space-y-4 mb-6"
      >
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 rounded-xl"
          />
        </div>
        
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {CATEGORIES.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={cn(
                'px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all',
                selectedCategory === cat
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted hover:bg-muted/80 text-muted-foreground'
              )}
            >
              {cat}
            </button>
          ))}
        </div>
      </motion.div>
      
      {/* Notes Grid */}
      {filteredNotes.length > 0 ? (
        <div className="space-y-6">
          {pinnedNotes.length > 0 && (
            <div>
              <h2 className="text-sm font-medium text-muted-foreground mb-3 flex items-center gap-2">
                <Pin className="w-4 h-4" /> Pinned
              </h2>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {pinnedNotes.map((note, index) => renderNoteCard(note, index))}
                </AnimatePresence>
              </div>
            </div>
          )}
          
          {unpinnedNotes.length > 0 && (
            <div>
              {pinnedNotes.length > 0 && (
                <h2 className="text-sm font-medium text-muted-foreground mb-3">Others</h2>
              )}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                <AnimatePresence mode="popLayout">
                  {unpinnedNotes.map((note, index) => renderNoteCard(note, index + pinnedNotes.length))}
                </AnimatePresence>
              </div>
            </div>
          )}
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center py-16"
        >
          <div className="w-20 h-20 rounded-3xl bg-yellow-500/10 flex items-center justify-center mx-auto mb-4">
            <StickyNote className="w-10 h-10 text-yellow-500" />
          </div>
          <h3 className="text-lg font-semibold mb-2">No notes yet</h3>
          <p className="text-muted-foreground text-sm mb-4">
            Start capturing your ideas and thoughts
          </p>
          <Button onClick={() => navigate('/notes/new')} className="gap-2">
            <Plus className="w-4 h-4" /> Create your first note
          </Button>
        </motion.div>
      )}
      
      {/* Delete confirmation */}
      <AlertDialog open={!!deleteNoteId} onOpenChange={() => setDeleteNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Note?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. The note will be permanently deleted.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteNoteId) {
                  deleteNote.mutate(deleteNoteId);
                  setDeleteNoteId(null);
                }
              }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

export default NotesPage;
