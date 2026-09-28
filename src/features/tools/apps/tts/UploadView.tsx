import { useState, useRef } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Upload, FileText, X, Trash2 } from 'lucide-react';
import { useTTSStore } from './useTTSStore';
import { toast } from 'sonner';
import { motion } from 'framer-motion';

interface Props {
  onUploaded: () => void;
}

export default function UploadView({ onUploaded }: Props) {
  const { documents, addDocument, removeDocument, setActiveDoc } = useTTSStore();
  const [text, setText] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase() as 'txt' | 'md' | 'docx';

    if (ext === 'txt' || ext === 'md') {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string || '';
        addDocument({
          id: crypto.randomUUID(),
          name: file.name,
          text: content,
          format: ext,
          wordCount: content.trim().split(/\s+/).length,
          addedAt: Date.now(),
        });
        toast.success('File loaded!');
        onUploaded();
      };
      reader.readAsText(file);
    } else if (ext === 'docx') {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const blob = new Blob([e.target?.result as ArrayBuffer]);
          const raw = await blob.text();
          const matches = raw.match(/<w:t[^>]*>([^<]*)<\/w:t>/g);
          const content = matches ? matches.map(m => m.replace(/<[^>]+>/g, '')).join(' ') : 'Could not extract text.';
          addDocument({
            id: crypto.randomUUID(),
            name: file.name,
            text: content,
            format: 'docx',
            wordCount: content.trim().split(/\s+/).length,
            addedAt: Date.now(),
          });
          toast.success('File loaded!');
          onUploaded();
        } catch {
          toast.error('Error reading docx');
        }
      };
      reader.readAsArrayBuffer(file);
    }
  };

  const pasteText = () => {
    if (!text.trim()) return;
    addDocument({
      id: crypto.randomUUID(),
      name: 'Pasted Text',
      text: text.trim(),
      format: 'paste',
      wordCount: text.trim().split(/\s+/).length,
      addedAt: Date.now(),
    });
    setText('');
    toast.success('Text added!');
    onUploaded();
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  const timeAgo = (ts: number) => {
    const mins = Math.floor((Date.now() - ts) / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  };

  return (
    <div className="flex flex-col gap-4 py-3">
      {/* Drop Zone */}
      <Card className="border-dashed border-2 border-border/70 bg-muted/30">
        <CardContent className="p-4">
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.docx"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFile(f); }}
          />
          <div
            className={`flex flex-col items-center gap-3 cursor-pointer rounded-xl p-6 transition-colors ${dragOver ? 'bg-primary/10' : ''}`}
            onClick={() => fileInputRef.current?.click()}
            onDragOver={e => { e.preventDefault(); setDragOver(true); }}
            onDragLeave={() => setDragOver(false)}
            onDrop={e => { e.preventDefault(); setDragOver(false); const f = e.dataTransfer.files[0]; if (f) handleFile(f); }}
          >
            <Upload className="w-10 h-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground text-center">Drop a file or tap to upload</p>
            <div className="flex gap-1.5">
              <Badge variant="secondary" className="text-[10px]">TXT</Badge>
              <Badge variant="secondary" className="text-[10px]">MD</Badge>
              <Badge variant="secondary" className="text-[10px]">DOCX</Badge>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Paste Text */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-muted-foreground">Or paste text</span>
            <span className="text-[10px] text-muted-foreground">{wordCount} words</span>
          </div>
          <Textarea
            placeholder="Paste your text here..."
            value={text}
            onChange={e => setText(e.target.value)}
            rows={4}
            className="resize-none text-sm"
          />
          <Button onClick={pasteText} disabled={!text.trim()} className="w-full" size="sm">
            Add to Reader
          </Button>
        </CardContent>
      </Card>

      {/* Recent Documents */}
      {documents.length > 0 && (
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground">Recent Documents</span>
          {documents.slice(0, 5).map((doc, i) => (
            <motion.div
              key={doc.id}
              initial={{ opacity: 0, y: 5 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <Card
                className="cursor-pointer hover:shadow-sm transition-shadow"
                onClick={() => { setActiveDoc(doc.id); onUploaded(); }}
              >
                <CardContent className="p-3 flex items-center gap-3">
                  <FileText className="w-4 h-4 text-primary flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{doc.name}</p>
                    <p className="text-[10px] text-muted-foreground">{doc.wordCount} words · {timeAgo(doc.addedAt)}</p>
                  </div>
                  <Badge variant="outline" className="text-[9px] h-4">{doc.format.toUpperCase()}</Badge>
                  <Button variant="ghost" size="icon" className="h-6 w-6" onClick={e => { e.stopPropagation(); removeDocument(doc.id); }}>
                    <X className="w-3 h-3 text-muted-foreground" />
                  </Button>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
