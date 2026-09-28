import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Check, Undo2, Redo2, Bold, Italic, Heading1, Heading2, Heading3, List, Hash, Palette } from 'lucide-react';
import { useNotes, useCreateNote, useUpdateNote } from '@/hooks/useNotes';
import { cn } from '@/lib/utils';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

const NOTE_COLORS = [
  { name: 'Yellow', value: '#FEF3C7' },
  { name: 'Pink', value: '#FCE7F3' },
  { name: 'Green', value: '#D1FAE5' },
  { name: 'Blue', value: '#DBEAFE' },
  { name: 'Purple', value: '#EDE9FE' },
  { name: 'Orange', value: '#FFEDD5' },
];

const CATEGORIES = ['General', 'Study', 'Ideas', 'To-Do', 'Important'];

// Convert markdown to HTML for display in contentEditable
function markdownToHtml(md: string): string {
  if (!md) return '';
  let html = md;
  // Escape HTML entities first
  html = html.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  // Headings (must come before bold to avoid conflicts with **)
  html = html.replace(/^### (.+)$/gm, '<h3>$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2>$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1>$1</h1>');
  // Bold **text** or *text* (WhatsApp style)
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/(?<!\*)\*(?!\*)(.+?)(?<!\*)\*(?!\*)/g, '<strong>$1</strong>');
  // Italic _text_
  html = html.replace(/(?<!\w)_(.+?)_(?!\w)/g, '<em>$1</em>');
  // Strikethrough ~text~
  html = html.replace(/~(.+?)~/g, '<s>$1</s>');
  // Inline code `text`
  html = html.replace(/`(.+?)`/g, '<code>$1</code>');
  // Unordered list items
  html = html.replace(/^- (.+)$/gm, '<li>$1</li>');
  // Wrap consecutive <li> in <ul>
  html = html.replace(/((?:<li>.*<\/li>\n?)+)/g, '<ul>$1</ul>');
  // Line breaks (for lines not already wrapped in block elements)
  html = html.replace(/\n/g, '<br>');
  // Clean up <br> inside block elements
  html = html.replace(/<br><(h[1-3]|ul|li)/g, '<$1');
  html = html.replace(/<\/(h[1-3]|ul|li)><br>/g, '</$1>');
  return html;
}

// Convert HTML from contentEditable back to markdown for storage
function htmlToMarkdown(html: string): string {
  if (!html) return '';
  let md = html;
  // Replace divs and paragraphs with newlines
  md = md.replace(/<div><br\s*\/?><\/div>/gi, '\n');
  md = md.replace(/<div>/gi, '\n');
  md = md.replace(/<\/div>/gi, '');
  md = md.replace(/<p>/gi, '\n');
  md = md.replace(/<\/p>/gi, '');
  // Headings
  md = md.replace(/<h1[^>]*>(.*?)<\/h1>/gi, '# $1');
  md = md.replace(/<h2[^>]*>(.*?)<\/h2>/gi, '## $1');
  md = md.replace(/<h3[^>]*>(.*?)<\/h3>/gi, '### $1');
  // Bold
  md = md.replace(/<strong>(.*?)<\/strong>/gi, '**$1**');
  md = md.replace(/<b>(.*?)<\/b>/gi, '**$1**');
  // Italic
  md = md.replace(/<em>(.*?)<\/em>/gi, '_$1_');
  md = md.replace(/<i>(.*?)<\/i>/gi, '_$1_');
  // Strikethrough
  md = md.replace(/<s>(.*?)<\/s>/gi, '~$1~');
  md = md.replace(/<strike>(.*?)<\/strike>/gi, '~$1~');
  md = md.replace(/<del>(.*?)<\/del>/gi, '~$1~');
  // Code
  md = md.replace(/<code>(.*?)<\/code>/gi, '`$1`');
  // List items
  md = md.replace(/<li>(.*?)<\/li>/gi, '- $1');
  md = md.replace(/<\/?ul[^>]*>/gi, '');
  md = md.replace(/<\/?ol[^>]*>/gi, '');
  // Line breaks
  md = md.replace(/<br\s*\/?>/gi, '\n');
  // Remove any remaining HTML tags
  md = md.replace(/<[^>]+>/g, '');
  // Decode HTML entities
  md = md.replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ');
  // Clean up multiple newlines
  md = md.replace(/\n{3,}/g, '\n\n');
  // Trim leading newline
  md = md.replace(/^\n+/, '');
  return md;
}

export function NoteEditorPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const isEditing = !!id;

  const { data: notes } = useNotes();
  const createNote = useCreateNote();
  const updateNote = useUpdateNote();

  const [title, setTitle] = useState('');
  const [color, setColor] = useState(NOTE_COLORS[0].value);
  const [category, setCategory] = useState('General');
  const [loaded, setLoaded] = useState(false);
  const [charCount, setCharCount] = useState(0);

  const editorRef = useRef<HTMLDivElement>(null);
  const initialContentRef = useRef('');

  // Load existing note
  useEffect(() => {
    if (isEditing && notes && !loaded) {
      const note = notes.find(n => n.id === id);
      if (note) {
        setTitle(note.title);
        setColor(note.color);
        setCategory(note.category || 'General');
        initialContentRef.current = note.content || '';
        if (editorRef.current) {
          editorRef.current.innerHTML = markdownToHtml(note.content || '');
          setCharCount(editorRef.current.innerText.length);
        }
        setLoaded(true);
      }
    }
  }, [isEditing, notes, id, loaded]);

  const getContent = useCallback((): string => {
    if (!editorRef.current) return '';
    return htmlToMarkdown(editorRef.current.innerHTML);
  }, []);

  const handleInput = useCallback(() => {
    if (editorRef.current) {
      setCharCount(editorRef.current.innerText.replace(/\n$/,'').length);
    }
  }, []);

  const execFormat = useCallback((command: string, value?: string) => {
    editorRef.current?.focus();
    document.execCommand(command, false, value);
    handleInput();
  }, [handleInput]);

  const handleSave = () => {
    if (!title.trim()) return;
    const content = getContent().trim() || null;

    if (isEditing && id) {
      updateNote.mutate(
        { id, title: title.trim(), content, color, category },
        { onSuccess: () => navigate('/notes') }
      );
    } else {
      createNote.mutate(
        { title: title.trim(), content, color, category, is_pinned: false },
        { onSuccess: () => navigate('/notes') }
      );
    }
  };

  const insertHeading = (level: number) => {
    const tag = `h${level}`;
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;
    
    // Check if already inside a heading
    const node = sel.anchorNode;
    const parentEl = node?.nodeType === 3 ? node.parentElement : (node as HTMLElement);
    const existingHeading = parentEl?.closest('h1, h2, h3');
    
    if (existingHeading) {
      // Replace heading level
      const newHeading = document.createElement(tag);
      newHeading.innerHTML = existingHeading.innerHTML;
      existingHeading.replaceWith(newHeading);
      // Place cursor inside
      const range = document.createRange();
      range.selectNodeContents(newHeading);
      range.collapse(false);
      sel.removeAllRanges();
      sel.addRange(range);
    } else {
      // Wrap selected text or current line in heading
      document.execCommand('formatBlock', false, tag);
    }
    handleInput();
  };

  const insertList = () => {
    execFormat('insertUnorderedList');
  };

  const insertHashtag = () => {
    editorRef.current?.focus();
    document.execCommand('insertText', false, '#tag ');
    handleInput();
  };

  const dateStr = format(new Date(), 'MMM d, yyyy • h:mm a');

  return (
    <div className="flex flex-col h-[100dvh] bg-background">
      {/* Top Bar */}
      <div className="flex items-center justify-between px-3 py-3 border-b border-border/50">
        <button
          onClick={() => navigate('/notes')}
          className="p-2 rounded-xl hover:bg-muted transition-colors"
          aria-label="Back"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1">
          <button
            onClick={() => execFormat('undo')}
            className="p-2 rounded-xl hover:bg-muted transition-colors disabled:opacity-30"
            aria-label="Undo"
          >
            <Undo2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => execFormat('redo')}
            className="p-2 rounded-xl hover:bg-muted transition-colors disabled:opacity-30"
            aria-label="Redo"
          >
            <Redo2 className="w-5 h-5" />
          </button>
          <button
            onClick={handleSave}
            disabled={!title.trim() || createNote.isPending || updateNote.isPending}
            className="p-2 rounded-xl bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50 ml-1"
            aria-label="Save"
          >
            <Check className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Editor Body */}
      <div className="flex-1 overflow-auto px-5 pt-5 pb-24">
        {/* Title */}
        <input
          type="text"
          placeholder="Title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full text-2xl font-light bg-transparent border-none outline-none placeholder:text-muted-foreground/50 mb-2"
          autoFocus={!isEditing}
        />

        {/* Date + char count + color dot + category */}
        <div className="flex items-center gap-2 text-xs text-muted-foreground mb-5">
          <span
            className="w-3 h-3 rounded-full inline-block flex-shrink-0"
            style={{ backgroundColor: color }}
          />
          <span>{dateStr}</span>
          <span>·</span>
          <span>{charCount} characters</span>
          <span>·</span>
          <span>{category}</span>
        </div>

        {/* Rich Text Content Editor */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={handleInput}
          data-placeholder="Start typing..."
          className={cn(
            "w-full min-h-[60vh] bg-transparent outline-none text-base leading-relaxed",
            "prose prose-sm max-w-none",
            "[&>h1]:text-2xl [&>h1]:font-bold [&>h1]:mb-2 [&>h1]:mt-4",
            "[&>h2]:text-xl [&>h2]:font-semibold [&>h2]:mb-2 [&>h2]:mt-3",
            "[&>h3]:text-lg [&>h3]:font-medium [&>h3]:mb-1 [&>h3]:mt-2",
            "[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:my-1",
            "[&_ul_ul]:list-[circle] [&_ul_ul]:pl-5 [&_ul_ul]:mt-1",
            "[&_ul_ul_ul]:list-[square] [&_ul_ul_ul]:pl-5",
            "[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:my-1",
            "[&_ol_ol]:pl-5 [&_ol_ol]:mt-1",
            "[&_code]:bg-muted [&_code]:px-1 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-sm [&_code]:font-mono",
            "empty:before:content-[attr(data-placeholder)] empty:before:text-muted-foreground/40 empty:before:pointer-events-none"
          )}
        />
      </div>

      {/* Bottom Formatting Toolbar */}
      <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-border/50 bg-background/95 backdrop-blur-sm px-2 py-2">
        <div className="flex items-center gap-0.5 max-w-4xl mx-auto overflow-x-auto scrollbar-hide">
          <button
            onClick={() => execFormat('bold')}
            className="p-2.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            title="Bold"
          >
            <Bold className="w-5 h-5" />
          </button>
          <button
            onClick={() => execFormat('italic')}
            className="p-2.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            title="Italic"
          >
            <Italic className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-border mx-1 flex-shrink-0" />

          <button
            onClick={() => insertHeading(1)}
            className="p-2.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            title="Heading 1"
          >
            <Heading1 className="w-5 h-5" />
          </button>
          <button
            onClick={() => insertHeading(2)}
            className="p-2.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            title="Heading 2"
          >
            <Heading2 className="w-5 h-5" />
          </button>
          <button
            onClick={() => insertHeading(3)}
            className="p-2.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            title="Heading 3"
          >
            <Heading3 className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-border mx-1 flex-shrink-0" />

          <button
            onClick={insertList}
            className="p-2.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            title="List"
          >
            <List className="w-5 h-5" />
          </button>
          <button
            onClick={insertHashtag}
            className="p-2.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
            title="Hashtag"
          >
            <Hash className="w-5 h-5" />
          </button>

          <div className="w-px h-6 bg-border mx-1 flex-shrink-0" />

          {/* Color & Category Picker */}
          <Popover>
            <PopoverTrigger asChild>
              <button
                className="p-2.5 rounded-lg hover:bg-muted transition-colors flex-shrink-0"
                title="Color & Category"
              >
                <Palette className="w-5 h-5" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3" side="top" align="end">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Color</p>
                  <div className="flex gap-2">
                    {NOTE_COLORS.map((c) => (
                      <button
                        key={c.value}
                        onClick={() => setColor(c.value)}
                        className={cn(
                          'w-8 h-8 rounded-full transition-transform',
                          color === c.value && 'ring-2 ring-offset-2 ring-primary scale-110'
                        )}
                        style={{ backgroundColor: c.value }}
                      />
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-medium text-muted-foreground mb-2">Category</p>
                  <div className="flex flex-wrap gap-1.5">
                    {CATEGORIES.map((cat) => (
                      <button
                        key={cat}
                        onClick={() => setCategory(cat)}
                        className={cn(
                          'px-3 py-1 rounded-full text-xs font-medium transition-all',
                          category === cat
                            ? 'bg-primary text-primary-foreground'
                            : 'bg-muted hover:bg-muted/80 text-muted-foreground'
                        )}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </PopoverContent>
          </Popover>
        </div>
      </div>
    </div>
  );
}

export default NoteEditorPage;
