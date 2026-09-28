import { useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion } from 'framer-motion';

interface Result { type: 'coin' | 'dice'; value: string; time: string; }

const DICE_DOTS: Record<number, number[][]> = {
  1: [[1, 1]],
  2: [[0, 0], [2, 2]],
  3: [[0, 0], [1, 1], [2, 2]],
  4: [[0, 0], [0, 2], [2, 0], [2, 2]],
  5: [[0, 0], [0, 2], [1, 1], [2, 0], [2, 2]],
  6: [[0, 0], [0, 2], [1, 0], [1, 2], [2, 0], [2, 2]],
};

export default function DiceCoinFlip() {
  const [coinResult, setCoinResult] = useState<'heads' | 'tails' | null>(null);
  const [coinFlipping, setCoinFlipping] = useState(false);
  const [diceResult, setDiceResult] = useState<number | null>(null);
  const [diceRolling, setDiceRolling] = useState(false);
  const [history, setHistory] = useState<Result[]>([]);

  const playClick = useCallback(() => {
    try {
      const ctx = new AudioContext();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = 600;
      gain.gain.value = 0.1;
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.1);
      osc.connect(gain).connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.1);
    } catch {}
  }, []);

  const addHistory = (type: 'coin' | 'dice', value: string) => {
    setHistory(prev => [{ type, value, time: new Date().toLocaleTimeString() }, ...prev].slice(0, 15));
  };

  const flipCoin = () => {
    setCoinFlipping(true);
    playClick();
    setTimeout(() => {
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      setCoinResult(result);
      setCoinFlipping(false);
      addHistory('coin', result);
    }, 800);
  };

  const rollDice = () => {
    setDiceRolling(true);
    playClick();
    setTimeout(() => {
      const result = Math.floor(Math.random() * 6) + 1;
      setDiceResult(result);
      setDiceRolling(false);
      addHistory('dice', String(result));
    }, 600);
  };

  // Stats
  const coinHistory = history.filter(r => r.type === 'coin');
  const heads = coinHistory.filter(r => r.value === 'heads').length;
  const tails = coinHistory.filter(r => r.value === 'tails').length;
  const diceHistory = history.filter(r => r.type === 'dice');
  const diceDistribution = Array.from({ length: 6 }, (_, i) => diceHistory.filter(r => r.value === String(i + 1)).length);

  return (
    <div className="flex flex-col gap-4 py-2">
      <Tabs defaultValue="coin">
        <TabsList className="w-full">
          <TabsTrigger value="coin" className="flex-1">Coin Flip</TabsTrigger>
          <TabsTrigger value="dice" className="flex-1">Dice Roll</TabsTrigger>
        </TabsList>

        <TabsContent value="coin" className="flex flex-col items-center gap-4 pt-4">
          <div style={{ perspective: '600px' }}>
            <motion.div
              className="w-36 h-36 rounded-full flex items-center justify-center text-5xl font-bold shadow-xl cursor-pointer select-none"
              style={{
                background: coinResult === 'tails'
                  ? 'linear-gradient(135deg, hsl(var(--muted)), hsl(var(--accent)))'
                  : 'linear-gradient(135deg, hsl(var(--primary)), hsl(217, 91%, 60%))',
                color: 'white',
              }}
              animate={coinFlipping ? { rotateX: [0, 720] } : { rotateX: 0 }}
              transition={{ duration: 0.8 }}
              onClick={flipCoin}
            >
              {coinResult === 'heads' ? 'H' : coinResult === 'tails' ? 'T' : '?'}
            </motion.div>
          </div>
          <p className="text-lg font-semibold text-foreground capitalize">{coinResult || 'Tap to flip'}</p>
          <Button onClick={flipCoin} disabled={coinFlipping} className="w-40">Flip Coin</Button>

          {/* Coin stats */}
          {coinHistory.length > 0 && (
            <Card className="w-full">
              <CardContent className="p-3 flex items-center justify-around text-center">
                <div>
                  <p className="text-lg font-bold text-primary">{heads}</p>
                  <p className="text-[10px] text-muted-foreground">Heads</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <p className="text-lg font-bold text-muted-foreground">{tails}</p>
                  <p className="text-[10px] text-muted-foreground">Tails</p>
                </div>
                <div className="w-px h-8 bg-border" />
                <div>
                  <p className="text-lg font-bold text-foreground">{coinHistory.length}</p>
                  <p className="text-[10px] text-muted-foreground">Total</p>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="dice" className="flex flex-col items-center gap-4 pt-4">
          <motion.div
            className="w-28 h-28 rounded-2xl bg-card border-2 border-border shadow-xl p-3 cursor-pointer"
            animate={diceRolling ? { rotate: [0, 90, 180, 270, 360], scale: [1, 1.1, 0.9, 1.1, 1] } : {}}
            transition={{ duration: 0.6 }}
            onClick={rollDice}
          >
            {diceResult ? (
              <div className="grid grid-cols-3 grid-rows-3 w-full h-full">
                {Array.from({ length: 9 }).map((_, i) => {
                  const row = Math.floor(i / 3);
                  const col = i % 3;
                  const hasDot = DICE_DOTS[diceResult]?.some(([r, c]) => r === row && c === col);
                  return (
                    <div key={i} className="flex items-center justify-center">
                      {hasDot && <div className="w-4 h-4 rounded-full bg-foreground" />}
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="w-full h-full flex items-center justify-center text-4xl text-muted-foreground">?</div>
            )}
          </motion.div>
          <p className="text-lg font-semibold text-foreground">{diceResult ? `Rolled: ${diceResult}` : 'Tap to roll'}</p>
          <Button onClick={rollDice} disabled={diceRolling} className="w-40">Roll Dice</Button>

          {/* Dice stats */}
          {diceHistory.length > 0 && (
            <Card className="w-full">
              <CardContent className="p-3">
                <h4 className="text-[10px] text-muted-foreground mb-2">Distribution ({diceHistory.length} rolls)</h4>
                <div className="flex items-end gap-2 h-12">
                  {diceDistribution.map((count, i) => {
                    const maxCount = Math.max(...diceDistribution, 1);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5">
                        <div
                          className="w-full bg-primary rounded-t-sm transition-all"
                          style={{ height: `${(count / maxCount) * 100}%`, minHeight: count > 0 ? '4px' : '0' }}
                        />
                        <span className="text-[9px] text-muted-foreground">{i + 1}</span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardContent className="p-3">
            <h4 className="text-xs font-medium text-muted-foreground mb-2">History</h4>
            <div className="max-h-32 overflow-y-auto space-y-1">
              {history.map((r, i) => (
                <div key={i} className="flex items-center justify-between text-xs px-2 py-1 rounded bg-muted/50">
                  <span className="text-foreground capitalize">
                    {r.type === 'coin' ? '🪙' : '🎲'} {r.value}
                  </span>
                  <span className="text-muted-foreground text-[10px]">{r.time}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
