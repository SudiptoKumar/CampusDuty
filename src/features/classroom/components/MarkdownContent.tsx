import { useMemo } from 'react';
import MarkdownIt from 'markdown-it';
import DOMPurify from 'dompurify';
import katex from 'katex';
import 'katex/dist/katex.min.css';
import { cn } from '@/lib/utils';

interface MarkdownContentProps {
  content: string;
  className?: string;
}

// Plugin to enable KaTeX math rendering in Markdown-it
// https://github.com/waylonflinn/markdown-it-katex
function markdownItKatex(md: MarkdownIt, options?: any) {
  options = options || {};

  function katexInline(latex: string) {
    try {
      return katex.renderToString(latex, {
        displayMode: false,
        throwOnError: false
      });
    } catch (error) {
      return `<span class="katex-error">${latex}</span>`;
    }
  }

  function katexBlock(latex: string) {
    try {
      return `<p class="katex-block">${katex.renderToString(latex, {
        displayMode: true,
        throwOnError: false
      })}</p>`;
    } catch (error) {
      return `<p class="katex-error">${latex}</p>`;
    }
  }

  function renderInline(tokens: any[], idx: number) {
    return katexInline(tokens[idx].content);
  }

  function renderBlock(tokens: any[], idx: number) {
    return katexBlock(tokens[idx].content);
  }

  md.inline.ruler.push('katex', (state, silent) => {
    let start, match, token, res, end;

    if (state.src.charCodeAt(state.pos) !== 0x24/* $ */) { return false; }
    start = state.pos;
    match = state.src.slice(start).match(/^\$\$([^\$]+)\$\$|^\$([^\$]+)\$/);
    if (!match) { return false; }
    end = start + match[0].length;

    if (!silent) {
      token         = state.push('katex', 'math', 0);
      token.content = match[0].startsWith('$$') ? match[1] : match[2];
      token.markup  = '$';
      token.info    = 'katex';
      token.map     = [ start, end ];
      token.level   = state.level;
      res = true;
    }
    state.pos = end;
    return true;
  });

  md.block.ruler.push('katex', (state, startLine, endLine, silent) => {
    let start, match, token, res, end, lineText;

    if (state.src.charCodeAt(state.bMarks[startLine]) !== 0x24/* $ */) { return false; }

    start = state.bMarks[startLine];
    end = state.eMarks[startLine];
    lineText = state.src.slice(start, end);

    match = lineText.match(/^\$\$([^\$]+)\$\$$/);
    if (!match) { return false; }

    if (silent) { return true; }

    res = state.push('katex', 'math', 0);
    res.content = match[1];
    res.markup = '$$';
    res.info = 'katex';
    res.map = [ startLine, endLine ];
    res.level = state.level;

    state.line = endLine + 1;
    return true;
  });

  md.renderer.rules['katex'] = renderInline;
  md.renderer.rules['katex_block'] = renderBlock;
}



// Convert WhatsApp-style formatting to standard Markdown
function convertWhatsAppToMarkdown(text: string): string {
  const codeBlocks: string[] = [];
  const inlineCodes: string[] = [];

  let processed = text.replace(/```[\s\S]*?```/g, (match) => {
    codeBlocks.push(match);
    return `<<<CODEBLOCK${codeBlocks.length - 1}>>>`;
  });

  processed = processed.replace(/`[^`]+`/g, (match) => {
    inlineCodes.push(match);
    return `<<<INLINECODE${inlineCodes.length - 1}>>>`;
  });

  processed = processed.replace(/(?<!\\*)\*([^*\n]+)\*(?!\*)/g, '**$1**');
  processed = processed.replace(/(?<!_)_([^_\\n]+)_(?!_)/g, '*$1*');
  processed = processed.replace(/(?<!~)~([^~\n]+)~(?!~)/g, '~~$1~~');

  inlineCodes.forEach((code, i) => {
    processed = processed.replace(`<<<INLINECODE${i}>>>`, code);
  });
  codeBlocks.forEach((block, i) => {
    processed = processed.replace(`<<<CODEBLOCK${i}>>>`, block);
  });

  return processed;
}

// Normalize indented dashes/asterisks into proper markdown nested lists
// Ensures consistent 2-space indentation per level for markdown-it parsing
function preprocessNestedLists(text: string): string {
  const lines = text.split('\n');
  const result: string[] = [];
  
  for (const line of lines) {
    // Match lines starting with spaces followed by - or *
    const match = line.match(/^( +)([-*]) (.*)$/);
    if (match) {
      const spaces = match[1];
      const marker = match[2];
      const content = match[3];
      // Calculate depth: every 2-4 spaces = 1 level
      const depth = Math.max(1, Math.ceil(spaces.length / 2));
      result.push('  '.repeat(depth) + `${marker} ${content}`);
    } else {
      result.push(line);
    }
  }
  
  return result.join('\n');
}

const md = new MarkdownIt({
  html: false,
  linkify: true,
  breaks: true,
  typographer: true,
});

md.use(markdownItKatex);

// Make links open in new tab
const defaultRender = md.renderer.rules.link_open || function(tokens, idx, options, _env, self) {
  return self.renderToken(tokens, idx, options);
};
md.renderer.rules.link_open = (tokens, idx, options, env, self) => {
  tokens[idx].attrSet('target', '_blank');
  tokens[idx].attrSet('rel', 'noopener noreferrer');
  return defaultRender(tokens, idx, options, env, self);
};

export function MarkdownContent({ content, className }: MarkdownContentProps) {
  const html = useMemo(() => {
    const withLists = preprocessNestedLists(content);
    const processed = convertWhatsAppToMarkdown(withLists);
    const rawHtml = md.render(processed);
    return DOMPurify.sanitize(rawHtml, {
      ADD_TAGS: ['span', 'div', 'math', 'semantics', 'mrow', 'mi', 'mo', 'mn', 'msup', 'msub', 'mfrac', 'msqrt', 'mover', 'munder', 'annotation'],
      ADD_ATTR: ['class', 'style', 'aria-hidden', 'encoding'],
    });
  }, [content]);

  return (
    <div
      className={cn(
        'prose prose-sm dark:prose-invert max-w-none',
        '[&>p]:mb-2 [&>p:last-child]:mb-0',
        '[&_ul]:list-disc [&_ul]:pl-5 [&_ul]:mb-2 [&_ul]:mt-1',
        '[&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:mb-2 [&_ol]:mt-1',
        '[&_li]:mb-0.5 [&_li]:leading-snug',
        '[&_ul_ul]:list-[circle] [&_ul_ul]:pl-6 [&_ul_ul]:mt-0.5 [&_ul_ul]:mb-0',
        '[&_ul_ul_ul]:list-[square] [&_ul_ul_ul]:pl-6 [&_ul_ul_ul]:mt-0.5',
        '[&_ol_ol]:pl-6 [&_ol_ol]:mt-0.5 [&_ol_ol]:mb-0',
        '[&_li_ul]:ml-0 [&_li_ol]:ml-0',
        '[&>h1]:text-lg [&>h1]:font-bold [&>h1]:mb-2',
        '[&>h2]:text-base [&>h2]:font-bold [&>h2]:mb-2',
        '[&>h3]:text-sm [&>h3]:font-semibold [&>h3]:mb-1',
        '[&>blockquote]:border-l-2 [&>blockquote]:border-primary/50 [&>blockquote]:pl-3 [&>blockquote]:italic [&>blockquote]:text-muted-foreground',
        '[&_code]:bg-muted [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:rounded [&_code]:text-xs [&_code]:font-mono',
        '[&>pre]:bg-muted [&>pre]:p-3 [&>pre]:rounded-lg [&>pre]:overflow-x-auto',
        '[&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2',
        '[&>hr]:border-border [&>hr]:my-3',
        '[&_strong]:font-bold',
        '[&_em]:italic',
        '[&_del]:line-through',
        '[&_.katex-block]:overflow-x-auto',
        className
      )}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}
