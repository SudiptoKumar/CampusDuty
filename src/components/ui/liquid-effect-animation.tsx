import { useEffect, useRef } from 'react';

interface LiquidEffectProps {
  imageUrl?: string;
  metalness?: number;
  roughness?: number;
  displacementScale?: number;
  className?: string;
}

export function LiquidEffectAnimation({
  imageUrl = 'https://images.unsplash.com/photo-1557682250-33bd709cbe85?w=1200&q=80',
  metalness = 0.75,
  roughness = 0.25,
  displacementScale = 5,
  className = '',
}: LiquidEffectProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const appRef = useRef<any>(null);
  const scriptRef = useRef<HTMLScriptElement | null>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // Create canvas
    const canvas = document.createElement('canvas');
    canvas.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
    const canvasId = `liquid-${Date.now()}-${Math.random().toString(36).slice(2)}`;
    canvas.setAttribute('data-liquid-canvas', canvasId);
    container.appendChild(canvas);

    // Create inline module script
    // threejs-components liquid1 exposes a DEFAULT export factory:
    //   Liquid(canvas) -> { loadImage, setRain, dispose, ... }
    const script = document.createElement('script');
    script.type = 'module';
    script.textContent = `
      try {
        const { default: Liquid } = await import("https://cdn.jsdelivr.net/npm/threejs-components@0.0.22/build/backgrounds/liquid1.min.js");
        const canvas = document.querySelector('[data-liquid-canvas="${canvasId}"]');
        if (canvas) {
          const app = Liquid(canvas);
          app.setRain(false);
          app.loadImage(${JSON.stringify(imageUrl)});
          canvas.__liquidApp = app;
        }
      } catch (e) {
        console.warn('Liquid effect failed to load:', e);
      }
    `;

    scriptRef.current = script;
    document.body.appendChild(script);

    return () => {
      // Cleanup
      if (canvas.__liquidApp) {
        try { canvas.__liquidApp.dispose?.(); } catch {}
      }
      canvas.remove();
      script.remove();
    };
  }, [imageUrl, metalness, roughness, displacementScale]);

  return (
    <div
      ref={containerRef}
      className={`absolute inset-0 overflow-hidden ${className}`}
      style={{ zIndex: 0 }}
    />
  );
}

// Augment HTMLCanvasElement for internal use
declare global {
  interface HTMLCanvasElement {
    __liquidApp?: any;
  }
}

export default LiquidEffectAnimation;
