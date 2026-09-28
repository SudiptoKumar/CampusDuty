import { useState, useCallback, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, Trophy, ArrowUp, ArrowDown, ArrowLeft, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Board = number[][];

const GRID = 4;
const STORAGE_KEY = '2048-best';

function createEmpty(): Board {
  return Array.from({ length: GRID }, () => Array(GRID).fill(0));
}

function addRandom(board: Board): Board {
  const b = board.map(r => [...r]);
  const empty: [number, number][] = [];
  b.forEach((row, r) => row.forEach((v, c) => { if (!v) empty.push([r, c]); }));
  if (!empty.length) return b;
  const [r, c] = empty[Math.floor(Math.random() * empty.length)];
  b[r][c] = Math.random() < 0.9 ? 2 : 4;
  return b;
}

function slideRow(row: number[]): { result: number[]; score: number } {
  const filtered = row.filter(v => v);
  let score = 0;
  const merged: number[] = [];
  let i = 0;
  while (i < filtered.length) {
    if (i + 1 < filtered.length && filtered[i] === filtered[i + 1]) {
      const val = filtered[i] * 2;
      merged.push(val);
      score += val;
      i += 2;
    } else {
      merged.push(filtered[i]);
      i++;
    }
  }
  while (merged.length < GRID) merged.push(0);
  return { result: merged, score };
}

function rotate90(board: Board): Board {
  return board[0].map((_, c) => board.map(row => row[c]).reverse());
}

function rotateBack90(board: Board): Board {
  return board[0].map((_, c) => board.map(row => row[GRID - 1 - c]));
}

function moveLeft(board: Board): { board: Board; score: number; moved: boolean } {
  let totalScore = 0;
  let moved = false;
  const newBoard = board.map(row => {
    const { result, score } = slideRow(row);
    totalScore += score;
    if (result.some((v, i) => v !== row[i])) moved = true;
    return result;
  });
  return { board: newBoard, score: totalScore, moved };
}

function move(board: Board, dir: 'left' | 'right' | 'up' | 'down'): { board: Board; score: number; moved: boolean } {
  let b = board;
  let rotations = 0;
  if (dir === 'right') { b = b.map(r => [...r].reverse()); }
  else if (dir === 'up') { b = rotateBack90(b); }
  else if (dir === 'down') { b = rotate90(b); }

  const result = moveLeft(b);

  if (dir === 'right') { result.board = result.board.map(r => r.reverse()); }
  else if (dir === 'up') { result.board = rotate90(result.board); }
  else if (dir === 'down') { result.board = rotateBack90(result.board); }

  return result;
}

function canMove(board: Board): boolean {
  for (let r = 0; r < GRID; r++) {
    for (let c = 0; c < GRID; c++) {
      if (!board[r][c]) return true;
      if (c + 1 < GRID && board[r][c] === board[r][c + 1]) return true;
      if (r + 1 < GRID && board[r][c] === board[r + 1][c]) return true;
    }
  }
  return false;
}

function has2048(board: Board): boolean {
  return board.some(row => row.some(v => v >= 2048));
}

const TILE_COLORS: Record<number, { bg: string; text: string }> = {
  0: { bg: 'hsl(var(--muted))', text: 'transparent' },
  2: { bg: 'hsl(48, 80%, 92%)', text: 'hsl(30, 20%, 30%)' },
  4: { bg: 'hsl(48, 70%, 85%)', text: 'hsl(30, 20%, 30%)' },
  8: { bg: 'hsl(25, 80%, 65%)', text: 'hsl(0, 0%, 100%)' },
  16: { bg: 'hsl(15, 85%, 60%)', text: 'hsl(0, 0%, 100%)' },
  32: { bg: 'hsl(5, 80%, 60%)', text: 'hsl(0, 0%, 100%)' },
  64: { bg: 'hsl(0, 75%, 55%)', text: 'hsl(0, 0%, 100%)' },
  128: { bg: 'hsl(48, 90%, 60%)', text: 'hsl(0, 0%, 100%)' },
  256: { bg: 'hsl(45, 90%, 55%)', text: 'hsl(0, 0%, 100%)' },
  512: { bg: 'hsl(42, 90%, 50%)', text: 'hsl(0, 0%, 100%)' },
  1024: { bg: 'hsl(38, 90%, 48%)', text: 'hsl(0, 0%, 100%)' },
  2048: { bg: 'hsl(35, 95%, 45%)', text: 'hsl(0, 0%, 100%)' },
};

function getTileStyle(value: number) {
  return TILE_COLORS[value] || { bg: 'hsl(30, 50%, 30%)', text: 'hsl(0, 0%, 100%)' };
}

export default function Game2048() {
  const [board, setBoard] = useState<Board>(() => addRandom(addRandom(createEmpty())));
  const [score, setScore] = useState(0);
  const [best, setBest] = useState(() => parseInt(localStorage.getItem(STORAGE_KEY) || '0'));
  const [gameOver, setGameOver] = useState(false);
  const [won, setWon] = useState(false);
  const boardRef = useRef<HTMLDivElement>(null);
  const touchStart = useRef<{ x: number; y: number } | null>(null);

  const handleMove = useCallback((dir: 'left' | 'right' | 'up' | 'down') => {
    if (gameOver) return;
    setBoard(prev => {
      const result = move(prev, dir);
      if (!result.moved) return prev;
      const newBoard = addRandom(result.board);
      const newScore = score + result.score;
      setScore(newScore);
      if (newScore > best) {
        setBest(newScore);
        localStorage.setItem(STORAGE_KEY, String(newScore));
      }
      if (has2048(newBoard) && !won) setWon(true);
      if (!canMove(newBoard)) setGameOver(true);
      return newBoard;
    });
  }, [gameOver, score, best, won]);

  // Keyboard
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, 'left' | 'right' | 'up' | 'down'> = {
        ArrowLeft: 'left', ArrowRight: 'right', ArrowUp: 'up', ArrowDown: 'down',
        a: 'left', d: 'right', w: 'up', s: 'down',
      };
      const dir = map[e.key];
      if (dir) { e.preventDefault(); handleMove(dir); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [handleMove]);

  // Touch / Swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    const t = e.touches[0];
    touchStart.current = { x: t.clientX, y: t.clientY };
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!touchStart.current) return;
    const t = e.changedTouches[0];
    const dx = t.clientX - touchStart.current.x;
    const dy = t.clientY - touchStart.current.y;
    const absDx = Math.abs(dx);
    const absDy = Math.abs(dy);
    if (Math.max(absDx, absDy) < 30) return;
    if (absDx > absDy) {
      handleMove(dx > 0 ? 'right' : 'left');
    } else {
      handleMove(dy > 0 ? 'down' : 'up');
    }
    touchStart.current = null;
  };

  const reset = () => {
    setBoard(addRandom(addRandom(createEmpty())));
    setScore(0);
    setGameOver(false);
    setWon(false);
  };

  return (
    <div className="flex flex-col items-center gap-4 py-4 select-none">
      {/* Score bar */}
      <div className="flex items-center gap-3 w-full max-w-[320px]">
        <div className="flex-1 bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Score</p>
          <p className="text-lg font-bold text-foreground">{score}</p>
        </div>
        <div className="flex-1 bg-card border border-border rounded-xl p-3 text-center">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold">Best</p>
          <p className="text-lg font-bold text-primary flex items-center justify-center gap-1">
            <Trophy className="w-3.5 h-3.5" /> {best}
          </p>
        </div>
        <Button variant="outline" size="icon" onClick={reset} className="rounded-xl h-12 w-12 shrink-0">
          <RotateCcw className="w-5 h-5" />
        </Button>
      </div>

      {/* Board */}
      <div
        ref={boardRef}
        className="relative bg-muted/60 rounded-2xl p-2 touch-none"
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        style={{ width: 'min(320px, 85vw)', height: 'min(320px, 85vw)' }}
      >
        <div className="grid grid-cols-4 gap-1.5 w-full h-full">
          {board.flat().map((value, i) => {
            const style = getTileStyle(value);
            return (
              <AnimatePresence key={i} mode="popLayout">
                <motion.div
                  key={value + '-' + i}
                  initial={{ scale: value ? 0.5 : 1, opacity: value ? 0 : 1 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  className="rounded-lg flex items-center justify-center font-bold"
                  style={{
                    backgroundColor: style.bg,
                    color: style.text,
                    fontSize: value >= 1024 ? '1rem' : value >= 128 ? '1.15rem' : '1.4rem',
                  }}
                >
                  {value || ''}
                </motion.div>
              </AnimatePresence>
            );
          })}
        </div>

        {/* Game Over / Won overlay */}
        {(gameOver || won) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="absolute inset-0 rounded-2xl flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-3"
          >
            <p className="text-2xl font-bold text-foreground">{gameOver ? 'Game Over!' : '🎉 You Win!'}</p>
            <p className="text-muted-foreground">Score: {score}</p>
            <Button onClick={reset} className="rounded-full px-6">Play Again</Button>
            {won && !gameOver && (
              <Button variant="ghost" size="sm" onClick={() => setWon(false)}>Keep Playing</Button>
            )}
          </motion.div>
        )}
      </div>

      {/* Swipe hint */}
      <p className="text-xs text-muted-foreground">Swipe on the board or use buttons below</p>

      {/* Virtual D-Pad */}
      <div className="grid grid-cols-3 gap-1.5 w-[160px]">
        <div />
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl h-12 w-12 active:scale-90 transition-transform"
          onClick={() => handleMove('up')}
        >
          <ArrowUp className="w-5 h-5" />
        </Button>
        <div />
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl h-12 w-12 active:scale-90 transition-transform"
          onClick={() => handleMove('left')}
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <div />
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl h-12 w-12 active:scale-90 transition-transform"
          onClick={() => handleMove('right')}
        >
          <ArrowRight className="w-5 h-5" />
        </Button>
        <div />
        <Button
          variant="outline"
          size="icon"
          className="rounded-xl h-12 w-12 active:scale-90 transition-transform"
          onClick={() => handleMove('down')}
        >
          <ArrowDown className="w-5 h-5" />
        </Button>
        <div />
      </div>
    </div>
  );
}
