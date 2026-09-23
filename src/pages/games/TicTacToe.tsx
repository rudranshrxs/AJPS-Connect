import React, { useState } from 'react';
import { useGames } from '../../context/GamesContext';
import { motion, AnimatePresence } from 'motion/react';
import { GlassCard } from '../../components/ui/GlassCard';
import { useNavigate } from 'react-router-dom';

export const TicTacToe = () => {
  const { activeGame, makeMove, playAgain, closeGame, clearActiveGame } = useGames();
  const navigate = useNavigate();
  const [showReveal, setShowReveal] = useState(false);

  if (!activeGame) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center h-full">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">No Active Game</h2>
        <button onClick={() => navigate('/games')} className="px-6 py-2 bg-[#A05C2B] text-white font-bold rounded-lg hover:bg-[#8B4C20]">
          Back to Games
        </button>
      </div>
    );
  }

  const isMyTurn = activeGame.currentTurn === activeGame.mySymbol;
  const isPlaying = activeGame.status === 'playing';

  const handleClose = () => {
    closeGame();
    setShowReveal(true);
  };

  const finishReveal = () => {
    clearActiveGame();
    navigate('/games');
  };

  if (showReveal) {
    const isWinner = activeGame.winner === activeGame.mySymbol;
    const isDraw = activeGame.winner === 'draw';
    
    let resultText = isDraw ? "It's a Draw!" : isWinner ? "You Won! +10 Points" : "You Lost! Better luck next time.";
    
    return (
      <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#1A1208] text-white p-4">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 1, type: "spring" }}
          className="text-center w-full max-w-lg"
        >
          <h1 className="text-4xl md:text-6xl font-black mb-8 text-[#E2A856] drop-shadow-lg uppercase tracking-widest">
            The Reveal
          </h1>
          
          <h2 className="text-2xl font-bold mb-12 text-white/80">{resultText}</h2>

          <div className="flex flex-col md:flex-row justify-center items-center gap-8 md:gap-16 mb-12">
            <motion.div 
              initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 0.5 }}
              className="flex flex-col items-center"
            >
              <div className="w-24 h-24 rounded-full bg-[#E2A856]/20 flex items-center justify-center mb-4 border-4 border-[#E2A856]">
                <span className="text-4xl font-bold text-[#E2A856]">{activeGame.mySymbol}</span>
              </div>
              <h3 className="text-xl font-bold text-white">{activeGame.mySymbol === 'X' ? activeGame.playerX.name : activeGame.playerO.name}</h3>
              <p className="text-sm text-gray-400 mt-1">Class {activeGame.mySymbol === 'X' ? activeGame.playerX.className : activeGame.playerO.className} {activeGame.mySymbol === 'X' ? activeGame.playerX.section : activeGame.playerO.section}</p>
            </motion.div>
            
            <div className="text-3xl font-black text-gray-600 italic">VS</div>

            <motion.div 
              initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: 1.5 }}
              className="flex flex-col items-center"
            >
              <div className="w-24 h-24 rounded-full bg-white/10 flex items-center justify-center mb-4 border-4 border-white/20">
                <span className="text-4xl font-bold text-white/50">{activeGame.mySymbol === 'X' ? 'O' : 'X'}</span>
              </div>
              <h3 className="text-xl font-bold text-white">{activeGame.mySymbol === 'X' ? activeGame.playerO.name : activeGame.playerX.name}</h3>
              <p className="text-sm text-gray-400 mt-1">Class {activeGame.mySymbol === 'X' ? activeGame.playerO.className : activeGame.playerX.className} {activeGame.mySymbol === 'X' ? activeGame.playerO.section : activeGame.playerX.section}</p>
            </motion.div>
          </div>

          <motion.button 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 3 }}
            onClick={finishReveal} 
            className="px-8 py-3 bg-[#E2A856] text-black font-black rounded-xl hover:bg-[#C5873A] transition-colors w-full uppercase tracking-wider"
          >
            Return to Games Hub
          </motion.button>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto w-full p-4 relative">
      <div className="flex justify-between items-center mb-8 bg-white p-4 rounded-2xl shadow-sm border border-gray-100">
        <div className={`flex flex-col items-center p-3 rounded-xl transition-colors ${activeGame.currentTurn === 'X' ? 'bg-[#FDF3E7] ring-2 ring-[#C5873A]' : 'opacity-60'}`}>
          <span className="text-[#C5873A] font-black text-2xl">X</span>
          <span className="text-xs font-bold mt-1 text-gray-700">{activeGame.mySymbol === 'X' ? 'You' : 'Mystery Challenger'}</span>
        </div>
        
        <div className="flex flex-col items-center">
          <span className="text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Status</span>
          {isPlaying ? (
            <span className="text-sm font-bold px-3 py-1 bg-gray-100 rounded-full animate-pulse text-gray-800">
              {isMyTurn ? "Your Turn!" : "Waiting..."}
            </span>
          ) : (
            <span className="text-sm font-bold px-3 py-1 bg-amber-100 text-amber-800 rounded-full">
              Game Over
            </span>
          )}
        </div>

        <div className={`flex flex-col items-center p-3 rounded-xl transition-colors ${activeGame.currentTurn === 'O' ? 'bg-gray-100 ring-2 ring-gray-400' : 'opacity-60'}`}>
          <span className="text-gray-600 font-black text-2xl">O</span>
          <span className="text-xs font-bold mt-1 text-gray-700">{activeGame.mySymbol === 'O' ? 'You' : 'Mystery Challenger'}</span>
        </div>
      </div>

      <GlassCard className="p-4 md:p-8 relative">
        {!isMyTurn && isPlaying && (
          <div className="absolute inset-0 z-10 bg-white/20 backdrop-blur-[1px] rounded-2xl flex items-center justify-center cursor-not-allowed" />
        )}
        
        <div className="grid grid-cols-3 gap-2 md:gap-4 max-w-sm mx-auto">
          {activeGame.board.map((cell, idx) => (
            <button
              key={idx}
              disabled={!!cell || !isMyTurn || !isPlaying}
              onClick={() => makeMove(idx)}
              className={`aspect-square rounded-2xl flex items-center justify-center text-4xl md:text-6xl font-black transition-all duration-300
                ${!cell && isMyTurn && isPlaying ? 'hover:bg-[#FDF3E7] hover:scale-105 active:scale-95 bg-gray-50 border-2 border-dashed border-gray-200' : ''}
                ${cell ? 'bg-white shadow-md border border-gray-100' : 'bg-gray-50/50'}
                ${cell === 'X' ? 'text-[#C5873A]' : 'text-gray-700'}
              `}
            >
              <AnimatePresence>
                {cell && (
                  <motion.span
                    initial={{ scale: 0, rotate: -45 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", bounce: 0.6 }}
                  >
                    {cell}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
          ))}
        </div>
      </GlassCard>

      <AnimatePresence>
        {!isPlaying && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="fixed bottom-0 left-0 right-0 p-4 md:p-8 bg-white/90 backdrop-blur-md border-t border-gray-200 shadow-[0_-10px_40px_-10px_rgba(0,0,0,0.1)] z-50 flex flex-col items-center"
          >
            <h2 className="text-2xl font-black text-gray-800 mb-6">
              {activeGame.winner === 'draw' ? "It's a Draw!" : activeGame.winner === activeGame.mySymbol ? "You Won! 🎉" : "You Lost!"}
            </h2>
            
            <div className="flex gap-4 w-full max-w-sm">
              <button 
                onClick={playAgain}
                className="flex-1 py-3 px-4 bg-[#FDF3E7] text-[#A05C2B] font-bold rounded-xl hover:bg-[#FCE5CD] transition-colors border border-[#A05C2B]/20"
              >
                {activeGame.rematchRequestedBy && activeGame.rematchRequestedBy !== activeGame.mySymbol ? "Accept Rematch" : activeGame.rematchRequestedBy ? "Waiting..." : "Play Again"}
              </button>
              
              <button 
                onClick={handleClose}
                className="flex-1 py-3 px-4 bg-[#A05C2B] text-white font-bold rounded-xl hover:bg-[#8B4C20] transition-colors shadow-md shadow-[#A05C2B]/30"
              >
                Close the Game
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
