import { useState, useRef, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { ZoomIn, ZoomOut, RotateCcw, Loader2 } from 'lucide-react';

interface ImageCropperDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  imageSrc: string;
  onCropComplete: (croppedBlob: Blob) => void;
}

export function ImageCropperDialog({
  open,
  onOpenChange,
  imageSrc,
  onCropComplete,
}: ImageCropperDialogProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [image, setImage] = useState<HTMLImageElement | null>(null);
  const [zoom, setZoom] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [isProcessing, setIsProcessing] = useState(false);

  const CANVAS_SIZE = 280;

  // Load image when dialog opens
  useEffect(() => {
    let objectUrl: string | null = null;
    
    if (open && imageSrc) {
      const img = new Image();
      img.onload = () => {
        setImage(img);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      };
      img.src = imageSrc;
    }
    
    // Cleanup on unmount or when imageSrc changes
    return () => {
      if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
      }
      // Reset state when dialog closes
      if (!open) {
        setImage(null);
        setZoom(1);
        setPosition({ x: 0, y: 0 });
      }
    };
  }, [open, imageSrc]);

  // Draw image on canvas
  const drawCanvas = useCallback(() => {
    if (!canvasRef.current || !image) return;
    
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = CANVAS_SIZE;
    canvas.height = CANVAS_SIZE;

    // Clear and fill background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);

    // Calculate dimensions to fit image
    const minDim = Math.min(image.width, image.height);
    const scale = (CANVAS_SIZE / minDim) * zoom;
    const drawWidth = image.width * scale;
    const drawHeight = image.height * scale;

    // Center image with position offset
    const x = (CANVAS_SIZE - drawWidth) / 2 + position.x;
    const y = (CANVAS_SIZE - drawHeight) / 2 + position.y;

    ctx.drawImage(image, x, y, drawWidth, drawHeight);
  }, [image, zoom, position]);

  useEffect(() => {
    drawCanvas();
  }, [drawCanvas]);

  // Mouse/touch handlers
  const handleMouseDown = (e: React.MouseEvent | React.TouchEvent) => {
    setIsDragging(true);
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setDragStart({ x: clientX - position.x, y: clientY - position.y });
  };

  const handleMouseMove = useCallback((e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging) return;
    const clientX = 'touches' in e ? e.touches[0].clientX : e.clientX;
    const clientY = 'touches' in e ? e.touches[0].clientY : e.clientY;
    setPosition({
      x: clientX - dragStart.x,
      y: clientY - dragStart.y,
    });
  }, [isDragging, dragStart]);

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Zoom with mouse wheel
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom(prev => Math.max(0.5, Math.min(3, prev + delta)));
  };

  const handleReset = () => {
    setZoom(1);
    setPosition({ x: 0, y: 0 });
  };

  const handleSave = async () => {
    if (!canvasRef.current) return;
    setIsProcessing(true);
    
    try {
      // Create high-res output canvas (400x400)
      const outputCanvas = document.createElement('canvas');
      const outputSize = 400;
      outputCanvas.width = outputSize;
      outputCanvas.height = outputSize;
      const outCtx = outputCanvas.getContext('2d');
      
      if (!outCtx || !image) return;

      // Fill with white background (for transparency)
      outCtx.fillStyle = '#ffffff';
      outCtx.fillRect(0, 0, outputSize, outputSize);

      // Calculate same proportions as preview
      const minDim = Math.min(image.width, image.height);
      const scale = (outputSize / minDim) * zoom;
      const drawWidth = image.width * scale;
      const drawHeight = image.height * scale;
      const scaleFactor = outputSize / CANVAS_SIZE;

      const x = (outputSize - drawWidth) / 2 + position.x * scaleFactor;
      const y = (outputSize - drawHeight) / 2 + position.y * scaleFactor;

      outCtx.drawImage(image, x, y, drawWidth, drawHeight);

      // Compress to JPEG, max 200KB
      let quality = 0.9;
      let blob: Blob | null = null;
      
      while (quality > 0.1) {
        blob = await new Promise<Blob | null>(resolve => {
          outputCanvas.toBlob(b => resolve(b), 'image/jpeg', quality);
        });
        
        if (blob && blob.size <= 200 * 1024) break;
        quality -= 0.1;
      }

      if (blob) {
        onCropComplete(blob);
        onOpenChange(false);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md z-[200]">
        <DialogHeader>
          <DialogTitle>Crop Profile Photo</DialogTitle>
        </DialogHeader>

        <div className="flex flex-col items-center gap-4">
          {/* Crop area */}
          <div
            ref={containerRef}
            className="relative rounded-full overflow-hidden border-2 border-primary/50 shadow-lg cursor-move touch-none"
            style={{ width: CANVAS_SIZE, height: CANVAS_SIZE }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleMouseDown}
            onTouchMove={handleMouseMove}
            onTouchEnd={handleMouseUp}
            onWheel={handleWheel}
          >
            <canvas ref={canvasRef} className="w-full h-full" />
            {/* Overlay circle guide */}
            <div className="absolute inset-0 rounded-full ring-2 ring-white/30 ring-inset pointer-events-none" />
          </div>

          <p className="text-xs text-muted-foreground text-center">
            Drag to position • Scroll to zoom
          </p>

          {/* Zoom controls */}
          <div className="flex items-center gap-3 w-full max-w-xs">
            <ZoomOut className="w-4 h-4 text-muted-foreground" />
            <Slider
              value={[zoom]}
              onValueChange={([v]) => setZoom(v)}
              min={0.5}
              max={3}
              step={0.1}
              className="flex-1"
            />
            <ZoomIn className="w-4 h-4 text-muted-foreground" />
          </div>
        </div>

        <DialogFooter className="flex-row gap-2 sm:gap-0">
          <Button variant="outline" onClick={handleReset} className="flex-1 sm:flex-none">
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </Button>
          <Button onClick={handleSave} disabled={isProcessing} className="flex-1 sm:flex-none">
            {isProcessing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              'Save Photo'
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
