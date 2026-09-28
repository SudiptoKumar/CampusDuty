import { useState, useRef } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { toPng } from 'html-to-image';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Download, Link, Copy, Check } from 'lucide-react';
import { toast } from 'sonner';

const SIZES = [
  { label: 'S', value: 150 },
  { label: 'M', value: 200 },
  { label: 'L', value: 280 },
];

const COLORS = [
  { label: 'Black', value: '#000000' },
  { label: 'Navy', value: '#1e3a5f' },
  { label: 'Purple', value: '#6b21a8' },
  { label: 'Green', value: '#166534' },
];

export default function QRCodeGenerator() {
  const [text, setText] = useState('');
  const [size, setSize] = useState(200);
  const [fgColor, setFgColor] = useState('#000000');
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const download = async () => {
    if (!qrRef.current || !text) return;
    try {
      const dataUrl = await toPng(qrRef.current, { pixelRatio: 3 });
      const link = document.createElement('a');
      link.download = 'qrcode.png';
      link.href = dataUrl;
      link.click();
    } catch {}
  };

  const copyToClipboard = async () => {
    if (!qrRef.current || !text) return;
    try {
      const dataUrl = await toPng(qrRef.current, { pixelRatio: 3 });
      const res = await fetch(dataUrl);
      const blob = await res.blob();
      await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
      setCopied(true);
      toast.success('Copied to clipboard!');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error('Copy not supported in this browser');
    }
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="w-full">
        <div className="relative">
          <Link className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Enter text or URL..."
            value={text}
            onChange={e => setText(e.target.value)}
            className="pl-9"
          />
        </div>
      </div>

      {/* Options */}
      <div className="flex gap-4 w-full">
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground font-medium">Size</span>
          <div className="flex gap-1">
            {SIZES.map(s => (
              <button
                key={s.value}
                onClick={() => setSize(s.value)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium transition-colors ${
                  size === s.value ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>
        <div className="space-y-1">
          <span className="text-[10px] text-muted-foreground font-medium">Color</span>
          <div className="flex gap-1.5">
            {COLORS.map(c => (
              <button
                key={c.value}
                onClick={() => setFgColor(c.value)}
                className={`w-6 h-6 rounded-full border-2 transition-all ${
                  fgColor === c.value ? 'border-primary scale-110' : 'border-border'
                }`}
                style={{ backgroundColor: c.value }}
                title={c.label}
              />
            ))}
          </div>
        </div>
      </div>

      {/* QR Display */}
      <Card className="shadow-md">
        <CardContent className="p-5">
          <div ref={qrRef} className="bg-white p-4 rounded-xl">
            <QRCodeCanvas
              value={text || ' '}
              size={size}
              level="H"
              includeMargin
              bgColor="#ffffff"
              fgColor={fgColor}
            />
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="flex gap-2 w-full max-w-xs">
        <Button onClick={download} disabled={!text} className="flex-1 gap-2">
          <Download className="w-4 h-4" /> Download
        </Button>
        <Button onClick={copyToClipboard} disabled={!text} variant="outline" className="gap-2">
          {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
        </Button>
      </div>
    </div>
  );
}
