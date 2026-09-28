import { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { ArrowLeft, ArrowRight, ArrowDown, ChevronsDown, RotateCw, Play, RotateCcw, Trophy } from 'lucide-react';
import { motion } from 'framer-motion';

const COLS = 10;
const ROWS = 20;
const CELL = 16;
const STORAGE_KEY = 'tetris-high-score';

type Cell = string | null;
type Board = Cell[][];

const PIECES: Record<string, { shape: number[][]; color: string }> = {
  I: { shape: [[1, 1, 1, 1]], color: 'hsl(187, 71%, 50%)' },
  O: { shape: [[1, 1], [1, 1]], color: 'hsl(45, 90%, 50%)' },
  T: { shape: [[0, 1, 0], [1, 1, 1]], color: 'hsl(280, 70%, 55%)' },
  S: { shape: [[0, 1, 1], [1, 1, 0]], color: 'hsl(142, 71%, 45%)' },
  Z: { shape: [[1, 1, 0], [0, 1, 1]], color: 'hsl(0, 70%, 55%)' },
  J: { shape: [[1, 0, 0], [1, 1, 1]], color: 'hsl(220, 70%, 55%)' },
  L: { shape: [[0, 0, 1], [1, 1, 1]], color: 'hsl(25, 90%, 55%)' },
};
const PIECE_KEYS = Object.keys(PIECES);

interface ActivePiece {
  type: string;
  shape: number[][];
  x: number;
  y: number;
  color: string;
}

function createBoard(): Board { return Array.from({ length: ROWS }, () => Array(COLS).fill(null)); }
function getHighScore(): number { try { return parseInt(localStorage.getItem(STORAGE_KEY) || '0', 10); } catch { return 0; } }

function rotate(shape: number[][]): number[][] {
  const rows = shape.length, cols = shape[0].length;
  return Array.from({ length: cols }, (_, c) => Array.from({ length: rows }, (_, r) => shape[rows - 1 - r][c]));
}

function randomPiece(): ActivePiece {
  const key = PIECE_KEYS[Math.floor(Math.random() * PIECE_KEYS.length)];
  const p = PIECES[key];
  return { type: key, shape: p.shape, x: Math.floor((COLS - p.shape[0].length) / 2), y: 0, color: p.color };
}

function collides(board: Board, piece: ActivePiece): boolean {
  for (let r = 0; r < piece.shape.length; r++) {
    for (let c = 0; c < piece.shape[r].length; c++) {
      if (!piece.shape[r][c]) continue;
      const nx = piece.x + c, ny = piece.y + r;
      if (nx < 0 || nx >= COLS || ny >= ROWS) return true;
      if (ny >= 0 && board[ny][nx]) return true;
    }
  }
  return false;
}

function mergePiece(board: Board, piece: ActivePiece): Board {
  const nb = board.map(r => [...r]);
  piece.shape.forEach((row, r) => row.forEach((v, c) => {
    if (v && piece.y + r >= 0) nb[piece.y + r][piece.x + c] = piece.color;
  }));
  return nb;
}

function clearLines(board: Board): { board: Board; cleared: number } {
  const remaining = board.filter(r => r.some(c => !c));
  const cleared = ROWS - remaining.length;
  const newRows = Array.from({ length: cleared }, () => Array(COLS).fill(null));
  return { board: [...newRows, ...remaining], cleared };
}

type GameState = 'idle' | 'playing' | 'gameover';

export default function TetrisGame() {
  const [board, setBoard] = useState<Board>(createBoard);
  const [piece, setPiece] = useState<ActivePiece>(randomPiece);
  const [nextPiece, setNextPiece] = useState<ActivePiece>(randomPiece);
  const [gameState, setGameState] = useState<GameState>('idle');
  const [score, setScore] = useState(0);
  const [level, setLevel] = useState(1);
  const [lines, setLines] = useState(0);
  const [highScore, setHighScore] = useState(getHighScore);
  const dropRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const lockPiece = useCallback(() => {
    const merged = mergePiece(board, piece);
    const { board: cleared, cleared: linesCleared } = clearLines(merged);
    setBoard(cleared);

    const points = [0, 100, 300, 500, 800][linesCleared] || 0;
    const newScore = score + points * level;
    setScore(newScore);
    if (newScore > highScore) { setHighScore(newScore); localStorage.setItem(STORAGE_KEY, String(newScore)); }

    const newLines = lines + linesCleared;
    setLines(newLines);
    setLevel(Math.floor(newLines / 10) + 1);

    const np = nextPiece;
    if (collides(cleared, np)) { setGameState('gameover'); return; }
    setPiece(np);
    setNextPiece(randomPiece());
  }, [board, piece, nextPiece, score, level, lines, highScore]);

  const moveDown = useCallback(() => {
    const moved = { ...piece, y: piece.y + 1 };
    if (collides(board, moved)) { lockPiece(); } else { setPiece(moved); }
  }, [piece, board, lockPiece]);

  const moveLeft = useCallback(() => {
    const moved = { ...piece, x: piece.x - 1 };
    if (!collides(board, moved)) setPiece(moved);
  }, [piece, board]);

  const moveRight = useCallback(() => {
    const moved = { ...piece, x: piece.x + 1 };
    if (!collides(board, moved)) setPiece(moved);
  }, [piece, board]);

  const rotatePiece = useCallback(() => {
    const rotated = { ...piece, shape: rotate(piece.shape) };
    if (!collides(board, rotated)) setPiece(rotated);
    else {
      // Wall kick attempts
      for (const dx of [1, -1, 2, -2]) {
        const kicked = { ...rotated, x: rotated.x + dx };
        if (!collides(board, kicked)) { setPiece(kicked); return; }
      }
    }
  }, [piece, board]);

  const hardDrop = useCallback(() => {
    let dropped = { ...piece };
    while (!collides(board, { ...dropped, y: dropped.y + 1 })) dropped.y++;
    setPiece(dropped);
    // Lock immediately on next tick
    const merged = mergePiece(board, dropped);
    const { board: cleared, cleared: linesCleared } = clearLines(merged);
    setBoard(cleared);
    const points = [0, 100, 300, 500, 800][linesCleared] || 0;
    const newScore = score + points * level;
    setScore(newScore);
    if (newScore > highScore) { setHighScore(newScore); localStorage.setItem(STORAGE_KEY, String(newScore)); }
    const newLines = lines + linesCleared;
    setLines(newLines);
    setLevel(Math.floor(newLines / 10) + 1);
    const np = nextPiece;
    if (collides(cleared, np)) { setGameState('gameover'); return; }
    setPiece(np);
    setNextPiece(randomPiece());
  }, [piece, board, nextPiece, score, level, lines, highScore]);

  const startGame = useCallback(() => {
    const b = createBoard();
    const p = randomPiece();
    setBoard(b);
    setPiece(p);
    setNextPiece(randomPiece());
    setScore(0);
    setLevel(1);
    setLines(0);
    setGameState('playing');
  }, []);

  // Keyboard
  useEffect(() => {
    if (gameState !== 'playing') return;
    const handler = (e: KeyboardEvent) => {
      const map: Record<string, () => void> = {
        ArrowLeft: moveLeft, ArrowRight: moveRight, ArrowDown: moveDown,
        ArrowUp: rotatePiece, ' ': hardDrop,
      };
      if (map[e.key]) { e.preventDefault(); map[e.key](); }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [gameState, moveLeft, moveRight, moveDown, rotatePiece, hardDrop]);

  // Auto drop
  useEffect(() => {
    if (gameState !== 'playing') return;
    const speed = Math.max(100, 800 - (level - 1) * 70);
    dropRef.current = setInterval(moveDown, speed);
    return () => { if (dropRef.current) clearInterval(dropRef.current); };
  }, [gameState, level, moveDown]);

  // Render board with ghost + active piece
  const displayBoard = board.map(r => [...r]);
  // Ghost
  let ghost = { ...piece };
  while (!collides(board, { ...ghost, y: ghost.y + 1 })) ghost.y++;
  ghost.shape.forEach((row, r) => row.forEach((v, c) => {
    if (v && ghost.y + r >= 0 && ghost.y + r < ROWS) {
      const nx = ghost.x + c;
      if (nx >= 0 && nx < COLS && !displayBoard[ghost.y + r][nx])
        displayBoard[ghost.y + r][nx] = piece.color + '30'; // ghost opacity
    }
  }));
  // Active piece
  piece.shape.forEach((row, r) => row.forEach((v, c) => {
    if (v && piece.y + r >= 0 && piece.y + r < ROWS) {
      const nx = piece.x + c;
      if (nx >= 0 && nx < COLS) displayBoard[piece.y + r][nx] = piece.color;
    }
  }));

  const boardWidth = COLS * CELL;
  const boardHeight = ROWS * CELL;

  return (
    <div className="flex flex-col items-center gap-3 py-4">
      {/* Score row */}
      <div className="flex items-center justify-between w-full max-w-xs text-xs">
        <div className="text-center">
          <p className="text-muted-foreground">Score</p>
          <p className="font-bold text-foreground text-sm">{score}</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Level</p>
          <p className="font-bold text-foreground text-sm">{level}</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground">Lines</p>
          <p className="font-bold text-foreground text-sm">{lines}</p>
        </div>
        <div className="text-center">
          <p className="text-muted-foreground flex items-center gap-0.5 justify-center"><Trophy className="w-3 h-3" /> Best</p>
          <p className="font-bold text-foreground text-sm">{highScore}</p>
        </div>
      </div>

      <div className="flex gap-3 items-start">
        {/* Board */}
        <Card className="p-0 overflow-hidden shadow-lg">
          <div className="relative" style={{ width: boardWidth, height: boardHeight, backgroundColor: 'hsl(var(--muted) / 0.3)' }}>
            {displayBoard.map((row, r) => row.map((cell, c) => cell ? (
              <div
                key={`${r}-${c}`}
                className="absolute rounded-[2px]"
                style={{
                  left: c * CELL + 0.5,
                  top: r * CELL + 0.5,
                  width: CELL - 1,
                  height: CELL - 1,
                  backgroundColor: cell,
                  boxShadow: cell.includes('30') ? 'none' : 'inset 0 1px 2px rgba(255,255,255,0.3)',
                }}
              />
            ) : null))}

            {gameState === 'idle' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/70 backdrop-blur-sm gap-3">
                <p className="text-lg font-bold text-foreground">🧱 Tetris</p>
                <Button onClick={startGame} className="gap-2"><Play className="w-4 h-4" /> Start</Button>
              </div>
            )}
            {gameState === 'gameover' && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/80 backdrop-blur-sm gap-2">
                <p className="text-lg font-bold text-destructive">Game Over</p>
                <p className="text-2xl font-bold text-foreground">{score}</p>
                <p className="text-xs text-muted-foreground">{lines} lines</p>
                <Button onClick={startGame} className="gap-2"><RotateCcw className="w-4 h-4" /> Retry</Button>
              </div>
            )}
          </div>
        </Card>

        {/* Next piece preview */}
        <Card className="p-2">
          <p className="text-[10px] text-muted-foreground mb-1 text-center">Next</p>
          <div className="w-12 h-12 flex items-center justify-center">
            {nextPiece.shape.map((row, r) => (
              <div key={r} className="flex">
                {row.map((v, c) => (
                  <div
                    key={c}
                    className="rounded-[1px]"
                    style={{
                      width: 10,
                      height: 10,
                      backgroundColor: v ? nextPiece.color : 'transparent',
                      margin: 0.5,
                    }}
                  />
                ))}
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Controls */}
      <div className="flex items-center gap-6 mt-2">
        {/* Left side: directional */}
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            onPointerDown={moveLeft}
            className="w-12 h-12 rounded-xl shadow-md active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-6 h-6" />
          </Button>
          <div className="flex flex-col gap-2">
            <Button
              variant="outline"
              size="icon"
              onPointerDown={rotatePiece}
              className="w-12 h-12 rounded-xl shadow-md active:scale-90 transition-transform"
            >
              <RotateCw className="w-5 h-5" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onPointerDown={moveDown}
              className="w-12 h-12 rounded-xl shadow-md active:scale-90 transition-transform"
            >
              <ArrowDown className="w-6 h-6" />
            </Button>
          </div>
          <Button
            variant="outline"
            size="icon"
            onPointerDown={moveRight}
            className="w-12 h-12 rounded-xl shadow-md active:scale-90 transition-transform"
          >
            <ArrowRight className="w-6 h-6" />
          </Button>
        </div>

        {/* Right side: hard drop */}
        <Button
          onPointerDown={hardDrop}
          className="w-14 h-14 rounded-2xl shadow-lg active:scale-90 transition-transform flex-col gap-0"
        >
          <ChevronsDown className="w-6 h-6" />
          <span className="text-[8px]">Drop</span>
        </Button>
      </div>
    </div>
  );
}
