import { StickyNote, Plus, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useNotes } from '@/hooks/useNotes';
import { formatDistanceToNow } from 'date-fns';

const getTextColor = (bgColor: string) => {
  const colorMap: Record<string, string> = {
    '#FEF3C7': '#92400E',
    '#FCE7F3': '#9D174D',
    '#D1FAE5': '#065F46',
    '#DBEAFE': '#1E40AF',
    '#EDE9FE': '#5B21B6',
    '#FFEDD5': '#9A3412',
  };
  return colorMap[bgColor] || '#1F2937';
};

export function StickyNotesTile() {
  const { data: notes } = useNotes();
  
  // Get recent notes (pinned first, then by date, limit to 2)
  const recentNotes = (notes ?? [])
    .sort((a, b) => {
      if (a.is_pinned && !b.is_pinned) return -1;
      if (!a.is_pinned && b.is_pinned) return 1;
      return new Date(b.updated_at).getTime() - new Date(a.updated_at).getTime();
    })
    .slice(0, 2);
  
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="col-span-full relative overflow-hidden liquid-glass-card p-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-yellow-500/10 flex items-center justify-center">
            <StickyNote className="w-4 h-4 text-yellow-500" />
          </div>
          <span className="font-semibold text-sm">My Notes</span>
        </div>
        <Link
          to="/notes"
          aria-label="Add new note"
          className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center hover:bg-primary/20 transition-colors"
        >
          <Plus className="w-4 h-4 text-primary" aria-hidden="true" />
        </Link>
      </div>
      
      {/* Notes */}
      {recentNotes.length > 0 ? (
        <div className="space-y-2">
          {recentNotes.map((note, index) => (
            <motion.div
              key={note.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * index }}
              className="relative p-3 rounded-xl"
              style={{ backgroundColor: note.color }}
            >
              {/* Pin indicator */}
              {note.is_pinned && (
                <span className="absolute top-2 right-2 text-xs">📌</span>
              )}
              
              {/* Content */}
              <p 
                className="text-sm font-medium line-clamp-1 pr-6"
                style={{ color: getTextColor(note.color) }}
              >
                {note.title}
              </p>
              
              {/* Date */}
              <p 
                className="text-[10px] opacity-70 mt-1"
                style={{ color: getTextColor(note.color) }}
              >
                {formatDistanceToNow(new Date(note.updated_at), { addSuffix: true })}
              </p>
            </motion.div>
          ))}
        </div>
      ) : (
        <div className="text-center py-4">
          <StickyNote className="w-8 h-8 mx-auto text-yellow-500/50 mb-2" />
          <p className="text-sm text-muted-foreground">No notes yet</p>
          <p className="text-xs text-muted-foreground/60">Tap + to add one</p>
        </div>
      )}
      
      {/* Footer link */}
      <Link 
        to="/notes" 
        aria-label="View all notes"
        className="flex items-center justify-center gap-1 mt-3 text-xs text-yellow-600 dark:text-yellow-500 font-medium hover:gap-2 transition-all"
      >
        View all <ChevronRight className="w-3 h-3" aria-hidden="true" />
      </Link>
    </motion.div>
  );
}
