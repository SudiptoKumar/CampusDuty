import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowUp, ArrowDown, ArrowLeft, ArrowRight, Play, RotateCcw, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
type Point = { x: number; y: number };
type GameState = 'idle' | 'playing' | 'gameover';

const GRID = 20;
const CELL = 16;
const INITIAL_SPEED = 150;

const STORAGE_KEY = 'snake-high-score';

function getHighScore(): number {
  try { return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10); } catch { return 0; }
}

export default function SnakeGame() {
  const [snake, setSnake] = useState<Point[]>([{ x: 10, y: 10 }]);
  const [food, setFood] = useState<Point>({ x: 15, y: 10 });
  const [dir, setDir] = useState<Direction>('RIGHT');
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(getHighScore);
  const dirRef = useRef<Direction>('RIGHT');
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const spawnFood = useCallback((currentSnake: Point[]): Point => {
    let p: Point;
    do {
      p = { x: Math.floor(Math.random() * GRID), y: Math.floor(Math.random() * GRID) };
    } while (currentSnake.some(s => s.x === p.x && s.y === p.y));
    return p;
  }, []);

  const resetGame = useCallback(() => {
    const initial = [{ x: 10, y: 10 }];
    setSnake(initial);
    setFood(spawnFood(initial));
    setDir('RIGHT');
    dirRef.current = 'RIGHT';
    setScore(0);
    setGameState('idle');
  }, [spawnFood]);

  const startGame = useCallback(() => {
    resetGame();
    setGameState('playing');
  }, [resetGame]);

  const changeDir = useCallback((newDir: Direction) => {
    const opposites: Record<Direction, Direction> = { UP: 'DOWN', DOWN: 'UP', LEFT: 'RIGHT', RIGHT: 'LEFT' };
    if (opposites[newDir] !== dirRef.current) {
      dirRef.current = newDir;
      setDir(newDir);
    }
  }, []);

  // Keyboard support
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, Direction> = { ArrowUp: 'UP', ArrowDown: 'DOWN', ArrowLeft: 'LEFT', ArrowRight: 'RIGHT', w: 'UP', s: 'DOWN', a: 'LEFT', d: 'RIGHT' };
      const d = map[e.key];
      if (d) { e.preventDefault(); changeDir(d); }
      if (e.key === ' ' && gameState !== 'playing') startGame();
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [changeDir, gameState, startGame]);

  // Game loop
  useEffect(() => {
    if (gameState !== 'playing') return;
    const speed = Math.max(60, INITIAL_SPEED - score * 2);
    intervalRef.current = setInterval(() => {
      setSnake(prev => {
        const head = { ...prev[0] };
        const d = dirRef.current;
        if (d === 'UP') head.y--;
        if (d === 'DOWN') head.y++;
        if (d === 'LEFT') head.x--;
        if (d === 'RIGHT') head.x++;

        // Wall collision
        if (head.x < 0 || head.x >= GRID || head.y < 0 || head.y >= GRID) {
          setGameState('gameover');
          return prev;
        }
        // Self collision
        if (prev.some(s => s.x === head.x && s.y === head.y)) {
          setGameState('gameover');
          return prev;
        }

        const newSnake = [head, ...prev];
        // Eat food
        if (head.x === food.x && head.y === food.y) {
          setScore(s => {
            const ns = s + 1;
            if (ns > highScore) {
              setHighScore(ns);
              localStorage.setItem(STORAGE_KEY, String(ns));
            }
            return ns;
          });
          setFood(spawnFood(newSnake));
        } else {
          newSnake.pop();
        }
        return newSnake;
      });
    }, speed);
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, [gameState, score, food, highScore, spawnFood]);

  const boardSize = GRID * CELL;

  return (
    <div className="flex flex-col items-center gap-4 py-4">
      {/* Score bar */}
      <div className="flex items-center justify-between w-full max-w-xs">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
          Score: <span className="text-primary">{score}</span>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
          <Trophy className="w-3.5 h-3.5" /> Best: {highScore}
        </div>
      </div>

      {/* Game board */}
      <Card className="p-0 overflow-hidden shadow-lg">
        <div
          className="relative bg-muted/30 border border-border/30"
          style={{ width: boardSize, height: boardSize }}
        >
          {/* Grid lines */}
          <div className="absolute inset-0 opacity-5" style={{
            backgroundSize: `${CELL}px ${CELL}px`,
            backgroundImage: 'linear-gradient(to right, hsl(var(--foreground)) 1px, transparent 1px), linear-gradient(to bottom, hsl(var(--foreground)) 1px, transparent 1px)',
          }} />

          {/* Snake */}
          {snake.map((s, i) => (
            <div
              key={i}
              className="absolute rounded-sm transition-all duration-75"
              style={{
                left: s.x * CELL,
                top: s.y * CELL,
                width: CELL - 1,
                height: CELL - 1,
                backgroundColor: i === 0 ? 'hsl(142, 71%, 40%)' : 'hsl(142, 71%, 50%)',
                boxShadow: i === 0 ? '0 0 6px hsl(142, 71%, 45% / 0.5)' : 'none',
              }}
            />
          ))}

          {/* Food */}
          <motion.div
            className="absolute rounded-full"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ repeat: Infinity, duration: 0.8 }}
            style={{
              left: food.x * CELL + 2,
              top: food.y * CELL + 2,
              width: CELL - 5,
              height: CELL - 5,
              backgroundColor: 'hsl(0, 80%, 55%)',
              boxShadow: '0 0 8px hsl(0, 80%, 55% / 0.6)',
            }}
          />

          {/* Overlay states */}
          {gameState === 'idle' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm gap-3">
              <p className="text-lg font-bold text-foreground">🐍 Snake</p>
              <Button onClick={startGame} className="gap-2"><Play className="w-4 h-4" /> Start Game</Button>
            </div>
          )}
          {gameState === 'gameover' && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-3">
              <p className="text-lg font-bold text-destructive">Game Over</p>
              <p className="text-2xl font-bold text-foreground">{score}</p>
              <p className="text-xs text-muted-foreground">points</p>
              <Button onClick={startGame} className="gap-2"><RotateCcw className="w-4 h-4" /> Play Again</Button>
            </div>
          )}
        </div>
      </Card>

      {/* D-Pad */}
      <div className="relative w-40 h-40">
        {/* Up */}
        <Button
          variant="outline"
          size="icon"
          onPointerDown={() => changeDir('UP')}
          className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-xl shadow-md active:scale-90 transition-transform"
        >
          <ArrowUp className="w-6 h-6" />
        </Button>
        {/* Down */}
        <Button
          variant="outline"
          size="icon"
          onPointerDown={() => changeDir('DOWN')}
          className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-12 rounded-xl shadow-md active:scale-90 transition-transform"
        >
          <ArrowDown className="w-6 h-6" />
        </Button>
        {/* Left */}
        <Button
          variant="outline"
          size="icon"
          onPointerDown={() => changeDir('LEFT')}
          className="absolute left-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl shadow-md active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-6 h-6" />
        </Button>
        {/* Right */}
        <Button
          variant="outline"
          size="icon"
          onPointerDown={() => changeDir('RIGHT')}
          className="absolute right-0 top-1/2 -translate-y-1/2 w-12 h-12 rounded-xl shadow-md active:scale-90 transition-transform"
        >
          <ArrowRight className="w-6 h-6" />
        </Button>
        {/* Center dot */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-6 h-6 rounded-full bg-muted border border-border" />
      </div>
    </div>
  );
}
