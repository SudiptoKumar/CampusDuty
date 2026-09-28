import { useState, useEffect, useRef } from 'react';

interface UseCountUpOptions {
  end: number;
  start?: number;
  duration?: number;
  delay?: number;
  decimals?: number;
  suffix?: string;
  prefix?: string;
  enabled?: boolean;
}

export function useCountUp({
  end,
  start = 0,
  duration = 1500,
  delay = 0,
  decimals = 0,
  suffix = '',
  prefix = '',
  enabled = true,
}: UseCountUpOptions) {
  const [value, setValue] = useState(start);
  const [isComplete, setIsComplete] = useState(false);
  const frameRef = useRef<number>();
  const startTimeRef = useRef<number>();
  const hasStarted = useRef(false);

  useEffect(() => {
    if (!enabled || hasStarted.current) return;

    const timeout = setTimeout(() => {
      hasStarted.current = true;
      
      const easeOutQuad = (t: number) => t * (2 - t);

      const animate = (timestamp: number) => {
        if (!startTimeRef.current) {
          startTimeRef.current = timestamp;
        }

        const elapsed = timestamp - startTimeRef.current;
        const progress = Math.min(elapsed / duration, 1);
        const easedProgress = easeOutQuad(progress);
        const currentValue = start + (end - start) * easedProgress;

        setValue(currentValue);

        if (progress < 1) {
          frameRef.current = requestAnimationFrame(animate);
        } else {
          setValue(end);
          setIsComplete(true);
        }
      };

      frameRef.current = requestAnimationFrame(animate);
    }, delay);

    return () => {
      clearTimeout(timeout);
      if (frameRef.current) {
        cancelAnimationFrame(frameRef.current);
      }
    };
  }, [end, start, duration, delay, enabled]);

  const formattedValue = `${prefix}${value.toFixed(decimals)}${suffix}`;
  const displayValue = decimals === 0 ? Math.round(value) : Number(value.toFixed(decimals));

  return { value: displayValue, formattedValue, isComplete };
}
