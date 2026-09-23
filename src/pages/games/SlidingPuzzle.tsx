import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useGames } from '../../context/GamesContext';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../../components/ui/GlassCard';
import { useNavigate } from 'react-router-dom';
import { Timer, ArrowLeft, Trophy } from 'lucide-react';

const GRID_SIZE = 5;
const NUM_TILES = GRID_SIZE * GRID_SIZE;
const EMPTY_TILE = 0;

const getInitialBoard = () => {
  const b = Array.from({ length: NUM_TILES - 1 }, (_, i) => i + 1);
  b.push(EMPTY_TILE);
  return b;
};

// Return array of valid swap indices for the empty tile
const getValidMoves = (emptyIndex: number) => {
  const row = Math.floor(emptyIndex / GRID_SIZE);
  const col = emptyIndex % GRID_SIZE;
  const moves: number[] = [];

  if (row > 0) moves.push(emptyIndex - GRID_SIZE); // up
  if (row < GRID_SIZE - 1) moves.push(emptyIndex + GRID_SIZE); // down
  if (col > 0) moves.push(emptyIndex - 1); // left
  if (col < GRID_SIZE - 1) moves.push(emptyIndex + 1); // right

  return moves;
};

const shuffleBoard = (board: number[]) => {
  let b = [...board];
  let emptyIndex = b.indexOf(EMPTY_TILE);
  let lastMove = -1;

  // 150 random valid slides
  for (let i = 0; i < 150; i++) {
    const validMoves = getValidMoves(emptyIndex).filter(m => m !== lastMove);
    if (validMoves.length === 0) break;
    const move = validMoves[Math.floor(Math.random() * validMoves.length)];
    
    // Swap
    b[emptyIndex] = b[move];
    b[move] = EMPTY_TILE;
    
    lastMove = emptyIndex;
    emptyIndex = move;
  }
  return b;
};

const formatTime = (ms: number) => {
  const minutes = Math.floor(ms / 60000);
  const seconds = Math.floor((ms % 60000) / 1000);
  const milliseconds = Math.floor((ms % 1000) / 10); // 2 digits
  return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
};

export const SlidingPuzzle = () => {
  const navigate = useNavigate();
  const { updatePuzzleScore } = useGames();
  
  const [board, setBoard] = useState<number[]>(getInitialBoard());
  const [isStarted, setIsStarted] = useState(false);
  const [isWon, setIsWon] = useState(false);
  const [timeMs, setTimeMs] = useState(0);
  const timerRef = useRef<number | null>(null);

  const startGame = useCallback(() => {
    setBoard(shuffleBoard(getInitialBoard()));
    setIsStarted(false);
    setIsWon(false);
    setTimeMs(0);
    if (timerRef.current) clearInterval(timerRef.current);
  }, []);

  useEffect(() => {
    startGame();
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [startGame]);

  const handleTileClick = (index: number) => {
    if (isWon) return;

    const emptyIndex = board.indexOf(EMPTY_TILE);
    const validMoves = getValidMoves(emptyIndex);

    if (validMoves.includes(index)) {
      if (!isStarted) {
        setIsStarted(true);
        const startTime = Date.now();
        timerRef.current = window.setInterval(() => {
          setTimeMs(Date.now() - startTime);
        }, 10); // 10ms resolution
      }

      const newBoard = [...board];
      newBoard[emptyIndex] = newBoard[index];
      newBoard[index] = EMPTY_TILE;
      setBoard(newBoard);

      checkWin(newBoard);
    }
  };

  const checkWin = (b: number[]) => {
    const isSorted = b.every((val, i) => {
      if (i === NUM_TILES - 1) return val === EMPTY_TILE;
      return val === i + 1;
    });

    if (isSorted) {
      if (timerRef.current) clearInterval(timerRef.current);
      setIsWon(true);
      updatePuzzleScore(timeMs);
    }
  };

  return (
    <div className="max-w-xl mx-auto w-full p-4 relative h-full flex flex-col">
      <div className="flex justify-between items-center mb-6">
        <button onClick={() => navigate('/games')} className="p-2 bg-white rounded-full shadow-sm hover:bg-gray-50 border border-gray-100">
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex flex-col items-center">
           <h2 className="text-lg font-black text-gray-800 tracking-wider uppercase">Speed Run</h2>
           <div className="flex items-center gap-2 mt-1">
             <Timer className={`w-4 h-4 ${isStarted && !isWon ? 'text-amber-500 animate-pulse' : 'text-gray-400'}`} />
             <span className="font-mono text-xl font-bold text-gray-700">{formatTime(timeMs)}</span>
           </div>
        </div>
        <button onClick={startGame} className="px-4 py-2 bg-gray-100 text-gray-700 font-bold text-xs rounded-lg hover:bg-gray-200">
          Restart
        </button>
      </div>

      <GlassCard className="p-3 md:p-6 flex-1 flex flex-col items-center justify-center relative shadow-lg">
        <div 
          className="grid gap-1 w-full max-w-[400px] aspect-square bg-gray-200/50 p-1 md:p-2 rounded-xl"
          style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, minmax(0, 1fr))` }}
        >
          {board.map((tile, index) => {
            const isEmpty = tile === EMPTY_TILE;
            return (
              <button
                key={tile === EMPTY_TILE ? 'empty' : tile} // Keep DOM stable for animation maybe, but index is better for strictly positioned layout
                onClick={() => handleTileClick(index)}
                disabled={isEmpty || isWon}
                className={`
                  relative flex items-center justify-center text-lg md:text-2xl font-black rounded-lg transition-all duration-150
                  ${isEmpty ? 'bg-transparent shadow-inner opacity-0' : 'bg-white shadow-[0_4px_0_0_#d1d5db] hover:shadow-[0_2px_0_0_#d1d5db] hover:translate-y-[2px] active:shadow-none active:translate-y-[4px] border border-gray-200'}
                  ${isWon && !isEmpty ? 'bg-green-500 text-white shadow-[0_4px_0_0_#16a34a] border-green-600' : 'text-gray-700'}
                `}
                style={{
                  aspectRatio: '1/1'
                }}
              >
                {!isEmpty && tile}
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {isWon && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              className="absolute inset-0 z-10 bg-white/80 backdrop-blur-sm rounded-2xl flex flex-col items-center justify-center p-6"
            >
              <div className="w-20 h-20 bg-amber-100 rounded-full flex items-center justify-center mb-4 shadow-lg shadow-amber-200/50">
                <Trophy className="w-10 h-10 text-amber-500" />
              </div>
              <h2 className="text-3xl font-black text-gray-800 mb-2">Puzzle Solved!</h2>
              <p className="text-gray-600 font-bold mb-6">Your time: <span className="font-mono text-amber-600 text-xl ml-1">{formatTime(timeMs)}</span></p>
              
              <div className="flex gap-3">
                <button onClick={() => navigate('/games')} className="px-6 py-3 bg-gray-100 text-gray-700 font-bold rounded-xl hover:bg-gray-200 transition-colors">
                  Leaderboard
                </button>
                <button onClick={startGame} className="px-6 py-3 bg-amber-500 text-white font-black rounded-xl hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/30">
                  Play Again
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </GlassCard>
    </div>
  );
};
