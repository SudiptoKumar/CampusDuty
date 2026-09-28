import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Volume2, Play, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useTTSStore } from './useTTSStore';
import { motion } from 'framer-motion';

export default function VoiceSettingsView() {
  const { preferences, setPreferences } = useTTSStore();
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);
  const [previewPlaying, setPreviewPlaying] = useState('');

  useEffect(() => {
    if (!('speechSynthesis' in window)) return;
    let attempts = 0;
    const tryLoad = () => {
      const v = window.speechSynthesis.getVoices();
      if (v.length > 0) {
        setVoices(v);
      } else if (attempts < 5) {
        attempts++;
        setTimeout(tryLoad, 600);
      }
    };
    tryLoad();
    window.speechSynthesis.onvoiceschanged = () => setVoices(window.speechSynthesis.getVoices());
  }, []);

  const filteredVoices = voices.filter(v => v.lang.startsWith(preferences.lang.split('-')[0]));

  const previewVoice = (voiceName: string) => {
    window.speechSynthesis.cancel();
    const sample = preferences.lang.startsWith('bn') ? 'আমি একটি পরীক্ষা বাক্য।' : 'This is a sample sentence to preview this voice.';
    const utterance = new SpeechSynthesisUtterance(sample);
    utterance.rate = preferences.speed;
    const voice = voices.find(v => v.name === voiceName);
    if (voice) utterance.voice = voice;
    setPreviewPlaying(voiceName);
    utterance.onend = () => setPreviewPlaying('');
    utterance.onerror = () => setPreviewPlaying('');
    window.speechSynthesis.speak(utterance);
  };

  return (
    <div className="flex flex-col gap-4 py-3">
      <h2 className="text-base font-semibold text-foreground flex items-center gap-2">
        <Volume2 className="w-5 h-5 text-primary" /> Voice Settings
      </h2>

      {/* Speed */}
      <Card>
        <CardContent className="p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-foreground">Reading Speed</span>
            <Badge variant="secondary" className="text-xs">{preferences.speed}x</Badge>
          </div>
          <Slider
            value={[preferences.speed]}
            onValueChange={([v]) => setPreferences({ speed: v })}
            min={0.5}
            max={2}
            step={0.25}
          />
          <div className="flex justify-between text-[10px] text-muted-foreground">
            <span>0.5x</span><span>1x</span><span>1.5x</span><span>2x</span>
          </div>
        </CardContent>
      </Card>

      {/* Language */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <span className="text-sm font-medium text-foreground">Language</span>
          <Select value={preferences.lang} onValueChange={v => setPreferences({ lang: v, voiceName: '' })}>
            <SelectTrigger className="h-9">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="en-US">🇺🇸 English</SelectItem>
              <SelectItem value="bn-BD">🇧🇩 বাংলা</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Voice Picker */}
      <Card>
        <CardContent className="p-4 space-y-2">
          <span className="text-sm font-medium text-foreground">Voice</span>
          {filteredVoices.length === 0 ? (
            <p className="text-xs text-muted-foreground py-2">No voices available for this language</p>
          ) : (
            <div className="space-y-1.5 max-h-[40vh] overflow-y-auto">
              {filteredVoices.map(v => {
                const isSelected = preferences.voiceName === v.name;
                const isPlaying = previewPlaying === v.name;
                return (
                  <motion.button
                    key={v.name}
                    onClick={() => setPreferences({ voiceName: v.name })}
                    className={`w-full p-2.5 rounded-lg border text-left flex items-center gap-2 transition-colors ${
                      isSelected ? 'border-primary bg-primary/5' : 'border-border/50 hover:bg-accent'
                    }`}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0 ${
                      isSelected ? 'bg-primary' : 'border border-muted-foreground/30'
                    }`}>
                      {isSelected && <Check className="w-3 h-3 text-primary-foreground" />}
                    </div>
                    <span className="text-xs font-medium text-foreground flex-1 truncate">
                      {v.name.length > 30 ? v.name.slice(0, 30) + '…' : v.name}
                    </span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6"
                      onClick={e => { e.stopPropagation(); previewVoice(v.name); }}
                    >
                      <Play className={`w-3 h-3 ${isPlaying ? 'text-primary' : ''}`} />
                    </Button>
                  </motion.button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
