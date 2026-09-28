import { useEffect, useRef, useCallback } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import { Play, Pause, TreePine, Waves, Train, Coffee, Radio, Volume2 } from 'lucide-react';
import { usePomodoroStore } from './usePomodoroStore';
import type { SoundPreset } from './types';

const SOUNDS: SoundPreset[] = [
  { id: 'rain', name: 'Deep Forest Rain', description: 'Gentle rain on leaves', category: 'nature', filterFreq: 600, gain: 0.25 },
  { id: 'static', name: 'Analog Static', description: 'Warm analog noise', category: 'mechanical', filterFreq: 1200, gain: 0.15 },
  { id: 'library', name: 'Library Silence', description: 'Quiet ambient hum', category: 'nature', filterFreq: 300, gain: 0.08 },
  { id: 'train', name: 'Midnight Train', description: 'Rhythmic track noise', category: 'mechanical', filterFreq: 400, gain: 0.2 },
  { id: 'coffee', name: 'Coffee House', description: 'Café background murmur', category: 'nature', filterFreq: 900, gain: 0.18 },
];

const ICONS: Record<string, typeof TreePine> = {
  rain: TreePine, static: Radio, library: Waves, train: Train, coffee: Coffee,
};

export default function SoundsView() {
  const { activeSound, setActiveSound, soundVolume, setSoundVolume } = usePomodoroStore();
  const audioCtxRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<AudioBufferSourceNode | null>(null);
  const gainRef = useRef<GainNode | null>(null);

  const stopSound = useCallback(() => {
    try { sourceRef.current?.stop(); } catch {}
    try { audioCtxRef.current?.close(); } catch {}
    sourceRef.current = null;
    audioCtxRef.current = null;
    gainRef.current = null;
  }, []);

  const playSound = useCallback((preset: SoundPreset) => {
    stopSound();
    try {
      const ctx = new AudioContext();
      audioCtxRef.current = ctx;
      const bufferSize = ctx.sampleRate * 2;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) data[i] = (Math.random() * 2 - 1) * preset.gain;
      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.loop = true;
      const gain = ctx.createGain();
      gain.gain.value = soundVolume / 100;
      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.value = preset.filterFreq;
      source.connect(filter).connect(gain).connect(ctx.destination);
      source.start();
      sourceRef.current = source;
      gainRef.current = gain;
    } catch {}
  }, [soundVolume, stopSound]);

  useEffect(() => {
    if (activeSound) {
      const preset = SOUNDS.find(s => s.id === activeSound);
      if (preset) playSound(preset);
    } else {
      stopSound();
    }
    return stopSound;
  }, [activeSound]);

  useEffect(() => {
    if (gainRef.current) gainRef.current.gain.value = soundVolume / 100;
  }, [soundVolume]);

  const toggleSound = (id: string) => setActiveSound(activeSound === id ? null : id);

  return (
    <div className="flex flex-col gap-4 py-4">
      <div>
        <h3 className="font-semibold text-foreground">Ambient Sounds</h3>
        <p className="text-xs text-muted-foreground">Background noise to help you focus</p>
      </div>

      {/* Volume */}
      <Card>
        <CardContent className="p-3 flex items-center gap-3">
          <Volume2 className="w-4 h-4 text-muted-foreground shrink-0" />
          <Slider value={[soundVolume]} onValueChange={([v]) => setSoundVolume(v)} max={100} step={1} className="flex-1" />
          <span className="text-xs text-muted-foreground w-8 text-right">{soundVolume}%</span>
        </CardContent>
      </Card>

      {['nature', 'mechanical'].map(cat => (
        <div key={cat}>
          <h4 className="text-xs font-medium text-muted-foreground mb-2 capitalize">{cat}</h4>
          <div className="space-y-2">
            {SOUNDS.filter(s => s.category === cat).map(sound => {
              const Icon = ICONS[sound.id] || Waves;
              const isActive = activeSound === sound.id;
              return (
                <Card key={sound.id} className={isActive ? 'ring-2 ring-primary' : ''}>
                  <CardContent className="p-3 flex items-center gap-3">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground">{sound.name}</p>
                      <p className="text-[10px] text-muted-foreground">{sound.description}</p>
                    </div>
                    <button onClick={() => toggleSound(sound.id)} className={`w-8 h-8 rounded-full flex items-center justify-center ${isActive ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                      {isActive ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4 ml-0.5" />}
                    </button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
}
