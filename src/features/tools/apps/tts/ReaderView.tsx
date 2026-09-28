import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Play, Pause, Square, SkipBack, SkipForward, FileText, AlertTriangle, RefreshCw, ExternalLink } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import { useTTSStore } from './useTTSStore';
import { toast } from 'sonner';

export default function ReaderView() {
  const { documents, activeDocId, preferences, addListeningRecord } = useTTSStore();
  const activeDoc = documents.find(d => d.id === activeDocId);

  const [speaking, setSpeaking] = useState(false);
  const [paused, setPaused] = useState(false);
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(-1);
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [synthAvailable, setSynthAvailable] = useState<boolean | null>(null);
  const livePreviewRef = useRef<HTMLDivElement>(null);
  const startTimeRef = useRef<number>(0);
  const startFiredRef = useRef(false);

  const text = activeDoc?.text || '';
  const sentences = text ? (text.match(/[^.!?\n]+[.!?\n]*/g) || [text]) : [];

  const loadVoicesWithRetry = useCallback(() => {
    if (!('speechSynthesis' in window)) {
      setSynthAvailable(false);
      return;
    }

    let attempts = 0;
    const maxAttempts = 5;

    const tryLoad = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        setVoices(v);
        setSynthAvailable(true);
      } else if (attempts < maxAttempts) {
        attempts++;
        setTimeout(tryLoad, 600);
      } else {
        setVoices([]);
        setSynthAvailable(false);
      }
    };

    tryLoad();
    window.speechSynthesis.onvoiceschanged = () => {
      const v = window.speechSynthesis.getVoices();
      setVoices(v);
      if (v.length > 0) setSynthAvailable(true);
    };
  }, []);

  useEffect(() => {
    loadVoicesWithRetry();
    return () => { window.speechSynthesis?.cancel(); };
  }, [loadVoicesWithRetry]);

  useEffect(() => {
    if (currentSentenceIndex >= 0 && livePreviewRef.current) {
      const el = livePreviewRef.current.querySelector(`[data-sentence="${currentSentenceIndex}"]`);
      el?.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, [currentSentenceIndex]);

  const speakChunked = useCallback((allSentences: string[], startIdx: number) => {
    if (startIdx >= allSentences.length) {
      setSpeaking(false);
      setPaused(false);
      setCurrentSentenceIndex(-1);
      if (activeDoc && startTimeRef.current) {
        const duration = Math.round((Date.now() - startTimeRef.current) / 1000);
        addListeningRecord({
          id: crypto.randomUUID(),
          documentName: activeDoc.name,
          durationSeconds: duration,
          date: new Date().toISOString().split('T')[0],
        });
      }
      return;
    }

    let chunk = '';
    let endIdx = startIdx;
    while (endIdx < allSentences.length && (chunk.length + allSentences[endIdx].length) < 250) {
      chunk += allSentences[endIdx];
      endIdx++;
    }
    if (endIdx === startIdx) { chunk = allSentences[startIdx]; endIdx = startIdx + 1; }

    const utterance = new SpeechSynthesisUtterance(chunk);
    utterance.lang = preferences.lang;
    utterance.rate = preferences.speed;

    const voice = voices.find(v => v.name === preferences.voiceName) ||
      voices.find(v => v.lang.startsWith(preferences.lang.split('-')[0]));
    if (voice) utterance.voice = voice;

    utterance.onboundary = (event) => {
      let charCount = 0;
      for (let i = startIdx; i < endIdx; i++) {
        charCount += allSentences[i].length;
        if (event.charIndex < charCount) { setCurrentSentenceIndex(i); break; }
      }
    };

    setCurrentSentenceIndex(startIdx);

    startFiredRef.current = false;
    utterance.onstart = () => {
      startFiredRef.current = true;
      setSpeaking(true);
    };
    utterance.onend = () => speakChunked(allSentences, endIdx);
    utterance.onerror = (e) => {
      if (e.error !== 'interrupted') {
        setSpeaking(false);
        setPaused(false);
        setCurrentSentenceIndex(-1);
        toast.error('Speech playback failed. Try opening in a new browser tab.');
        setSynthAvailable(false);
      }
    };

    try {
      window.speechSynthesis.speak(utterance);
    } catch {
      toast.error('Speech synthesis is not available.');
      setSynthAvailable(false);
      return;
    }

    // Timeout: if onstart hasn't fired in 1.5s, speech is blocked
    setTimeout(() => {
      if (!startFiredRef.current && !paused) {
        window.speechSynthesis.cancel();
        setSpeaking(false);
        setCurrentSentenceIndex(-1);
        setSynthAvailable(false);
        toast.error('Speech not available in this context. Try opening the app in a new tab.');
      }
    }, 1500);
  }, [preferences, voices, activeDoc, addListeningRecord, paused]);

  const play = () => {
    if (!('speechSynthesis' in window)) {
      toast.error('Speech synthesis not supported in this browser.');
      setSynthAvailable(false);
      return;
    }
    if (voices.length === 0) {
      toast.error('No voices available. Try a different browser or device.');
      return;
    }
    if (paused) { window.speechSynthesis.resume(); setPaused(false); return; }
    if (!text.trim()) return;
    window.speechSynthesis.cancel();
    startTimeRef.current = Date.now();
    speakChunked(sentences, 0);
  };

  const pause = () => { window.speechSynthesis.pause(); setPaused(true); };

  const stop = () => {
    window.speechSynthesis.cancel();
    setSpeaking(false);
    setPaused(false);
    setCurrentSentenceIndex(-1);
  };

  const skipTo = (direction: 'back' | 'forward') => {
    const target = direction === 'back'
      ? Math.max(0, currentSentenceIndex - 1)
      : Math.min(sentences.length - 1, currentSentenceIndex + 1);
    window.speechSynthesis.cancel();
    speakChunked(sentences, target);
  };

  const estimatedMinutes = Math.max(1, Math.round(sentences.length * 3 / (preferences.speed * 60)));

  if (!activeDoc) {
    return (
      <div className="flex flex-col items-center justify-center py-16 gap-3">
        <FileText className="w-12 h-12 text-muted-foreground/30" />
        <p className="text-sm text-muted-foreground">No document loaded</p>
        <p className="text-xs text-muted-foreground/70">Go to Upload tab to add text</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3 py-3">
      {/* Synthesis Unavailable Banner */}
      {synthAvailable === false && (
        <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-3 flex flex-col gap-2">
          <div className="flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 text-destructive flex-shrink-0 mt-0.5" />
            <div className="text-xs text-destructive">
              <p className="font-medium">Speech synthesis unavailable</p>
              <p className="mt-1 text-destructive/80">
                This may not work in embedded previews or on some devices. Try opening the published app directly in your browser.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              onClick={() => {
                setSynthAvailable(null);
                loadVoicesWithRetry();
              }}
            >
              <RefreshCw className="w-3 h-3" /> Retry
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-xs gap-1"
              asChild
            >
              <a href="https://campusduty.lovable.app/tools/tts" target="_blank" rel="noopener noreferrer">
                <ExternalLink className="w-3 h-3" /> Open in new tab
              </a>
            </Button>
          </div>
        </div>
      )}

      {/* Title Bar */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 min-w-0">
          <FileText className="w-4 h-4 text-primary flex-shrink-0" />
          <span className="text-sm font-medium text-foreground truncate">{activeDoc.name}</span>
        </div>
        <div className="flex items-center gap-1.5">
          <Badge variant="outline" className="text-[10px] flex-shrink-0">
            {voices.length} voice{voices.length !== 1 ? 's' : ''}
          </Badge>
          <Badge variant="secondary" className="text-[10px] flex-shrink-0">~{estimatedMinutes} min</Badge>
        </div>
      </div>

      {/* Content with Sentence Highlighting */}
      <Card className="flex-1">
        <CardContent className="p-0">
          <ScrollArea className="h-[45vh]">
            <div ref={livePreviewRef} className="p-4 space-y-1">
              {sentences.map((s, i) => (
                <p
                  key={i}
                  data-sentence={i}
                  className={`text-sm px-2 py-1 rounded transition-all duration-300 leading-relaxed ${
                    i === currentSentenceIndex
                      ? 'bg-primary/15 text-foreground font-medium border-l-2 border-primary'
                      : i < currentSentenceIndex
                      ? 'text-muted-foreground/50'
                      : 'text-foreground/80'
                  }`}
                >
                  {s.trim()}
                </p>
              ))}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>

      {/* Waveform */}
      {speaking && (
        <div className="flex items-center justify-center gap-1 h-6">
          {[0, 1, 2, 3, 4, 5, 6].map(i => (
            <motion.div
              key={i}
              className="w-1 bg-primary rounded-full"
              animate={!paused ? {
                height: [4, 12 + Math.random() * 8, 6, 16 + Math.random() * 4, 4],
              } : { height: 4 }}
              transition={{ repeat: Infinity, duration: 0.5, delay: i * 0.08 }}
            />
          ))}
        </div>
      )}

      {/* Playback Controls */}
      <div className="flex items-center justify-center gap-3 py-2">
        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => skipTo('back')} disabled={!speaking}>
          <SkipBack className="w-4 h-4" />
        </Button>

        {!speaking || paused ? (
          <Button onClick={play} disabled={!text.trim() || synthAvailable === false} className="h-12 w-12 rounded-full p-0">
            <Play className="w-5 h-5 ml-0.5" />
          </Button>
        ) : (
          <Button onClick={pause} variant="outline" className="h-12 w-12 rounded-full p-0">
            <Pause className="w-5 h-5" />
          </Button>
        )}

        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => skipTo('forward')} disabled={!speaking}>
          <SkipForward className="w-4 h-4" />
        </Button>

        <Button variant="ghost" size="icon" className="h-9 w-9" onClick={stop} disabled={!speaking && !paused}>
          <Square className="w-4 h-4" />
        </Button>
      </div>

      {/* Progress */}
      {speaking && (
        <div className="flex items-center justify-center gap-2">
          <span className="text-[10px] text-muted-foreground">
            Sentence {Math.max(1, currentSentenceIndex + 1)} of {sentences.length}
          </span>
          <Badge variant="outline" className="text-[10px] h-4">{preferences.speed}x</Badge>
        </div>
      )}
    </div>
  );
}
