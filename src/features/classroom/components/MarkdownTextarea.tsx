import { forwardRef, useRef, useImperativeHandle, useCallback, useEffect, useState } from 'react';
import {
  Bold, Italic, Strikethrough, Heading1, Heading2, Heading3,
  ListOrdered, CheckSquare, Quote, Code, Minus, IndentIncrease,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import MarkdownIt from 'markdown-it';

export interface MarkdownTextareaHandle {
  getMarkdown: () => string;
  setMarkdown: (md: string) => void;
  focus: () => void;
}

interface MarkdownTextareaProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  maxHeight?: string;
  onFocus?: () => void;
  showToolbar?: boolean;
}

// Shared markdown-it instance for MD → HTML
const md = new MarkdownIt({ html: true, linkify: true, breaks: true, typographer: true });

// ── HTML → Markdown converter ──────────────────────────────────────────
function htmlToMarkdown(node: Node): string {
  if (node.nodeType === Node.TEXT_NODE) return node.textContent || '';
  if (node.nodeType !== Node.ELEMENT_NODE) return '';

  const el = node as HTMLElement;
  const tag = el.tagName.toLowerCase();
  const children = () => Array.from(el.childNodes).map(htmlToMarkdown).join('');

  switch (tag) {
    case 'b': case 'strong': return `**${children()}**`;
    case 'i': case 'em': return `*${children()}*`;
    case 'del': case 's': case 'strike': return `~~${children()}~~`;
    case 'code': return `\`${children()}\``;
    case 'h1': return `# ${children()}\n\n`;
    case 'h2': return `## ${children()}\n\n`;
    case 'h3': return `### ${children()}\n\n`;
    case 'blockquote': return `> ${children().replace(/\n/g, '\n> ')}\n\n`;
    case 'hr': return `\n---\n\n`;
    case 'br': return '\n';
    case 'p': return `${children()}\n\n`;
    case 'div': return `${children()}\n`;
    case 'ul': return `${Array.from(el.children).map((li) => {
      const content = htmlToMarkdown(li).replace(/^\n+|\n+$/g, '');
      return `- ${content}`;
    }).join('\n')}\n\n`;
    case 'ol': return `${Array.from(el.children).map((li, i) => {
      const content = htmlToMarkdown(li).replace(/^\n+|\n+$/g, '');
      return `${i + 1}. ${content}`;
    }).join('\n')}\n\n`;
    case 'li': return children();
    case 'a': {
      const href = el.getAttribute('href') || '';
      return `[${children()}](${href})`;
    }
    case 'img': {
      const src = el.getAttribute('src') || '';
      const alt = el.getAttribute('alt') || 'alt';
      return `![${alt}](${src})`;
    }
    case 'table': {
      const rows = Array.from(el.querySelectorAll('tr'));
      if (rows.length === 0) return '';
      const headerCells = Array.from(rows[0].querySelectorAll('th,td')).map(c => c.textContent?.trim() || '');
      const header = `| ${headerCells.join(' | ')} |`;
      const sep = `| ${headerCells.map(() => '---').join(' | ')} |`;
      const body = rows.slice(1).map(r => {
        const cells = Array.from(r.querySelectorAll('td,th')).map(c => c.textContent?.trim() || '');
        return `| ${cells.join(' | ')} |`;
      }).join('\n');
      return `${header}\n${sep}\n${body}\n\n`;
    }
    case 'pre': {
      const codeEl = el.querySelector('code');
      return `\`\`\`\n${codeEl?.textContent || el.textContent || ''}\n\`\`\`\n\n`;
    }
    case 'sup': return `^${children()}^`;
    case 'sub': return `~${children()}~`;
    default: return children();
  }
}

function convertHtmlToMarkdown(html: string): string {
  const doc = new DOMParser().parseFromString(`<div>${html}</div>`, 'text/html');
  const result = htmlToMarkdown(doc.body.firstChild!);
  return result.replace(/\n{3,}/g, '\n\n').trim();
}

// ── Toolbar actions ────────────────────────────────────────────────────
interface ToolbarAction {
  icon: React.ReactNode;
  label: string;
  command: string;
  arg?: string;
  colorClass: string; // bg + text color for the pill
}

const TOOLBAR_ACTIONS: ToolbarAction[] = [
  { icon: <Heading1 className="w-4 h-4" />, label: 'Heading 1', command: 'formatBlock', arg: 'h1', colorClass: 'bg-[hsl(0_80%_92%)] text-[hsl(0_70%_50%)]' },
  { icon: <Heading2 className="w-4 h-4" />, label: 'Heading 2', command: 'formatBlock', arg: 'h2', colorClass: 'bg-[hsl(30_80%_92%)] text-[hsl(30_70%_45%)]' },
  { icon: <Heading3 className="w-4 h-4" />, label: 'Heading 3', command: 'formatBlock', arg: 'h3', colorClass: 'bg-[hsl(50_80%_90%)] text-[hsl(50_70%_40%)]' },
  { icon: <Bold className="w-4 h-4" />, label: 'Bold', command: 'bold', colorClass: 'bg-[hsl(145_60%_92%)] text-[hsl(145_60%_35%)]' },
  { icon: <Italic className="w-4 h-4" />, label: 'Italic', command: 'italic', colorClass: 'bg-[hsl(175_50%_92%)] text-[hsl(175_50%_35%)]' },
  { icon: <Strikethrough className="w-4 h-4" />, label: 'Strikethrough', command: 'strikeThrough', colorClass: 'bg-muted text-muted-foreground' },
  { icon: <Code className="w-4 h-4" />, label: 'Code', command: 'code', colorClass: 'bg-[hsl(200_60%_92%)] text-[hsl(200_60%_40%)]' },
  { icon: <ListOrdered className="w-4 h-4" />, label: 'Ordered List', command: 'insertOrderedList', colorClass: 'bg-[hsl(220_60%_93%)] text-[hsl(220_60%_45%)]' },
  { icon: <IndentIncrease className="w-4 h-4" />, label: 'Sub-bullet', command: 'indent', colorClass: 'bg-[hsl(250_50%_93%)] text-[hsl(250_50%_50%)]' },
  { icon: <CheckSquare className="w-4 h-4" />, label: 'Task List', command: 'taskList', colorClass: 'bg-[hsl(280_50%_93%)] text-[hsl(280_50%_50%)]' },
  { icon: <Quote className="w-4 h-4" />, label: 'Quote', command: 'formatBlock', arg: 'blockquote', colorClass: 'bg-[hsl(310_40%_93%)] text-[hsl(310_40%_45%)]' },
  { icon: <Minus className="w-4 h-4" />, label: 'Divider', command: 'insertHR', colorClass: 'bg-muted text-muted-foreground' },
];

const MarkdownTextarea = forwardRef<MarkdownTextareaHandle, MarkdownTextareaProps>(
  ({ value, onChange, placeholder = 'Write your post...', minHeight = '150px', maxHeight = '200px', onFocus, showToolbar = true }, ref) => {
    const editorRef = useRef<HTMLDivElement>(null);
    const isInternalUpdate = useRef(false);
    const [isEmpty, setIsEmpty] = useState(!value);

    const renderMarkdownToEditor = useCallback((markdown: string) => {
      if (!editorRef.current) return;
      if (!markdown.trim()) {
        editorRef.current.innerHTML = '';
        setIsEmpty(true);
        return;
      }
      const html = md.render(markdown);
      editorRef.current.innerHTML = html;
      setIsEmpty(false);
    }, []);

    useEffect(() => {
      if (editorRef.current && value && !editorRef.current.innerHTML) {
        renderMarkdownToEditor(value);
      }
    }, []); // eslint-disable-line react-hooks/exhaustive-deps

    useEffect(() => {
      if (isInternalUpdate.current) {
        isInternalUpdate.current = false;
        return;
      }
      const currentMd = editorRef.current ? convertHtmlToMarkdown(editorRef.current.innerHTML) : '';
      if (value !== currentMd) {
        renderMarkdownToEditor(value);
      }
    }, [value, renderMarkdownToEditor]);

    useImperativeHandle(ref, () => ({
      getMarkdown: () => {
        if (!editorRef.current) return '';
        return convertHtmlToMarkdown(editorRef.current.innerHTML);
      },
      setMarkdown: (markdown: string) => {
        renderMarkdownToEditor(markdown);
        isInternalUpdate.current = true;
        onChange(markdown);
      },
      focus: () => editorRef.current?.focus(),
    }));

    const syncToParent = useCallback(() => {
      if (!editorRef.current) return;
      const html = editorRef.current.innerHTML;
      const text = editorRef.current.textContent || '';
      setIsEmpty(!text.trim());
      isInternalUpdate.current = true;
      onChange(convertHtmlToMarkdown(html));
    }, [onChange]);

    const handlePaste = useCallback((e: React.ClipboardEvent) => {
      e.preventDefault();
      const text = e.clipboardData.getData('text/plain');
      document.execCommand('insertText', false, text);
    }, []);

    const applyAction = useCallback((action: ToolbarAction) => {
      const editor = editorRef.current;
      if (!editor) return;
      editor.focus();

      const sel = window.getSelection();

      switch (action.command) {
        case 'bold':
        case 'italic':
        case 'strikeThrough':
          document.execCommand(action.command, false);
          break;
        case 'formatBlock':
          document.execCommand('formatBlock', false, `<${action.arg}>`);
          break;
        case 'insertOrderedList':
          document.execCommand(action.command, false);
          break;
        case 'indent':
          document.execCommand('indent', false);
          break;
        case 'code': {
          const selected = sel?.toString();
          if (selected) {
            document.execCommand('insertHTML', false, `<code>${selected}</code>`);
          } else {
            document.execCommand('insertHTML', false, '<code>code</code>');
          }
          break;
        }
        case 'insertHR':
          document.execCommand('insertHTML', false, '<hr/>');
          break;
        case 'taskList':
          document.execCommand('insertHTML', false, '<ul><li>☐ Task item</li></ul>');
          break;
      }

      syncToParent();
    }, [syncToParent]);

    return (
      <div className="relative">
        {/* Rich text editor area */}
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={syncToParent}
          onFocus={onFocus}
          onPaste={handlePaste}
          data-placeholder={placeholder}
          className={cn(
            'w-full bg-transparent px-1 py-0 text-sm text-foreground overflow-y-auto',
            'focus:outline-none',
            'prose prose-sm dark:prose-invert max-w-none',
            '[&>p]:mb-2 [&>p:last-child]:mb-0',
            '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2',
            '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2',
            '[&_li]:mb-0.5 [&_li]:leading-snug',
            '[&>h1]:text-lg [&>h1]:font-bold [&>h1]:mb-2',
            '[&>h2]:text-base [&>h2]:font-bold [&>h2]:mb-2',
            '[&>h3]:text-sm [&>h3]:font-semibold [&>h3]:mb-1',
            '[&>blockquote]:border-l-2 [&>blockquote]:border-primary/50 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-muted-foreground',
            '[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono',
            '[&>pre]:bg-muted [&>pre]:p-3 [&>pre]:rounded-lg [&>pre]:overflow-x-auto',
            '[&_a]:text-primary [&_a]:no-underline [&_a]:font-medium',
            '[&>hr]:border-border [&>hr]:my-3',
            '[&_strong]:font-bold [&_em]:italic [&_del]:line-through',
            '[&_sup]:text-[0.75em] [&_sup]:align-super [&_sub]:text-[0.75em] [&_sub]:align-sub',
            '[&_table]:w-full [&_table]:border-collapse [&_table]:my-2 [&_td]:border [&_td]:border-border [&_td]:px-2 [&_td]:py-1 [&_td]:text-xs [&_th]:border [&_th]:border-border [&_th]:px-2 [&_th]:py-1 [&_th]:bg-muted [&_th]:font-semibold [&_th]:text-xs',
            isEmpty ? 'is-empty leading-[--editor-line-height]' : 'leading-relaxed'
          )}
          style={{ minHeight, maxHeight, '--editor-line-height': minHeight } as React.CSSProperties}
        />

        {/* Bottom toolbar — colorful icon pills, conditionally shown */}
        {showToolbar && (
          <div className="flex items-center gap-1.5 px-1 py-1.5 overflow-x-auto scrollbar-hide">
            {TOOLBAR_ACTIONS.map((action, i) => (
              <button
                key={i}
                type="button"
                title={action.label}
                onClick={() => applyAction(action)}
                className={cn(
                  'shrink-0 p-2.5 rounded-xl transition-all active:scale-95 hover:shadow-sm',
                  action.colorClass
                )}
              >
                {action.icon}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  }
);

MarkdownTextarea.displayName = 'MarkdownTextarea';

export default MarkdownTextarea;
