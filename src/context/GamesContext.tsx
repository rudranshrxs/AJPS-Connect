import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { useNavigate } from 'react-router-dom';

export interface TttLeaderboardEntry {
  playerId: string; name: string; className: string;
  section: string; wins: number; losses: number; draws: number; points: number;
}

export interface PuzzleLeaderboardEntry {
  playerId: string; name: string; className: string;
  section: string; bestTime: number; // milliseconds
}

export interface ActiveGame {
  gameId: string; 
  board: (string | null)[];
  playerX: { id: string; name: string; className: string; section: string };
  playerO: { id: string; name: string; className: string; section: string };
  currentTurn: 'X' | 'O';
  mySymbol: 'X' | 'O';
  winner: 'X' | 'O' | 'draw' | null;
  status: 'playing' | 'ended';
  rematchRequestedBy?: 'X' | 'O' | null;
}

interface GamesContextType {
  tttLeaderboard: TttLeaderboardEntry[];
  puzzleLeaderboard: PuzzleLeaderboardEntry[];
  activeGame: ActiveGame | null;
  incomingChallenge: { challengerId: string, gameId: string } | null;
  findMatch: () => void;
  acceptMatch: (gameId: string, challengerId: string) => void;
  declineMatch: () => void;
  makeMove: (index: number) => void;
  closeGame: () => void;
  playAgain: () => void;
  leaveGame: () => void;
  updatePuzzleScore: (timeMs: number) => void;
  clearActiveGame: () => void;
}

const GamesContext = createContext<GamesContextType | undefined>(undefined);

export const GamesProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [channel, setChannel] = useState<BroadcastChannel | null>(null);

  const [tttLeaderboard, setTttLeaderboard] = useState<TttLeaderboardEntry[]>(() => {
    const stored = localStorage.getItem('ajps_ttt_leaderboard');
    return stored ? JSON.parse(stored) : [];
  });

  const [puzzleLeaderboard, setPuzzleLeaderboard] = useState<PuzzleLeaderboardEntry[]>(() => {
    const stored = localStorage.getItem('ajps_puzzle_leaderboard');
    return stored ? JSON.parse(stored) : [];
  });

  const [activeGame, setActiveGame] = useState<ActiveGame | null>(null);
  const [incomingChallenge, setIncomingChallenge] = useState<{ challengerId: string, gameId: string } | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    const bc = new BroadcastChannel('ajps_games_channel');
    setChannel(bc);

    bc.onmessage = (event) => {
      const data = event.data;
      if (!currentUser || currentUser.role !== 'Student') return;

      if (data.type === 'CHALLENGE') {
        if (data.challengerId !== currentUser.id && !activeGame) {
          setIncomingChallenge({ challengerId: data.challengerId, gameId: data.gameId });
        }
      } else if (data.type === 'ACCEPT') {
        if (isSearching && data.challengerId === currentUser.id) {
          setIsSearching(false);
          setActiveGame({
            gameId: data.gameId,
            board: Array(9).fill(null),
            playerX: { id: currentUser.id, name: currentUser.name, className: currentUser.className || '', section: currentUser.sectionName || '' },
            playerO: data.playerO,
            currentTurn: 'X',
            mySymbol: 'X',
            winner: null,
            status: 'playing'
          });
          navigate('/games');
        }
      } else if (data.type === 'MOVE') {
        setActiveGame(prev => {
          if (!prev || prev.gameId !== data.gameId) return prev;
          const newBoard = [...prev.board];
          newBoard[data.index] = data.symbol;
          const winnerInfo = checkWin(newBoard);
          
          if (winnerInfo) {
             updateTttLeaderboardForGame(winnerInfo === 'draw' ? 'draw' : winnerInfo === prev.mySymbol ? 'win' : 'loss', prev);
          }

          return {
            ...prev,
            board: newBoard,
            currentTurn: data.symbol === 'X' ? 'O' : 'X',
            winner: winnerInfo,
            status: winnerInfo ? 'ended' : 'playing'
          };
        });
      } else if (data.type === 'REMATCH_REQUEST') {
         setActiveGame(prev => {
           if (!prev || prev.gameId !== data.gameId) return prev;
           return { ...prev, rematchRequestedBy: data.symbol };
         });
      } else if (data.type === 'REMATCH_ACCEPT') {
         setActiveGame(prev => {
           if (!prev || prev.gameId !== data.gameId) return prev;
           return {
             ...prev,
             board: Array(9).fill(null),
             winner: null,
             status: 'playing',
             currentTurn: 'X',
             rematchRequestedBy: null
           };
         });
      } else if (data.type === 'LEAVE') {
         setActiveGame(prev => {
           if (!prev || prev.gameId !== data.gameId) return prev;
           return null;
         });
         setIncomingChallenge(null);
      }
    };

    return () => {
      bc.close();
    };
  }, [currentUser, isSearching, activeGame, navigate]);

  const checkWin = (board: (string | null)[]) => {
    const lines = [
      [0, 1, 2], [3, 4, 5], [6, 7, 8],
      [0, 3, 6], [1, 4, 7], [2, 5, 8],
      [0, 4, 8], [2, 4, 6]
    ];
    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (board[a] && board[a] === board[b] && board[a] === board[c]) {
        return board[a] as 'X' | 'O';
      }
    }
    if (board.every(cell => cell !== null)) return 'draw';
    return null;
  };

  const updateTttLeaderboardForGame = (result: 'win' | 'loss' | 'draw', game: ActiveGame) => {
      setTttLeaderboard(prev => {
         const newLb = [...prev];
         const pIndex = newLb.findIndex(p => p.playerId === currentUser?.id);
         let pEntry = pIndex >= 0 ? { ...newLb[pIndex] } : {
           playerId: currentUser?.id || '', name: currentUser?.name || '', className: currentUser?.className || '',
           section: currentUser?.sectionName || '', wins: 0, losses: 0, draws: 0, points: 0
         };

         if (result === 'win') { pEntry.wins++; pEntry.points += 10; }
         else if (result === 'loss') { pEntry.losses++; }
         else { pEntry.draws++; pEntry.points += 5; }

         if (pIndex >= 0) newLb[pIndex] = pEntry;
         else newLb.push(pEntry);

         localStorage.setItem('ajps_ttt_leaderboard', JSON.stringify(newLb));
         return newLb;
      });
  };

  const findMatch = () => {
    if (!currentUser || !channel) return;
    setIsSearching(true);
    const gameId = 'game_' + Date.now();
    channel.postMessage({ type: 'CHALLENGE', challengerId: currentUser.id, gameId });
    
    // Auto timeout search
    setTimeout(() => {
       setIsSearching(false);
    }, 15000);
  };

  const acceptMatch = (gameId: string, challengerId: string) => {
    if (!currentUser || !channel) return;
    setIncomingChallenge(null);
    channel.postMessage({
      type: 'ACCEPT',
      gameId,
      challengerId,
      playerO: { id: currentUser.id, name: currentUser.name, className: currentUser.className || '', section: currentUser.sectionName || '' }
    });

    setActiveGame({
      gameId,
      board: Array(9).fill(null),
      playerX: { id: challengerId, name: 'Mystery Challenger', className: '???', section: '???' }, 
      playerO: { id: currentUser.id, name: currentUser.name, className: currentUser.className || '', section: currentUser.sectionName || '' },
      currentTurn: 'X',
      mySymbol: 'O',
      winner: null,
      status: 'playing'
    });
    navigate('/games');
  };

  const declineMatch = () => {
    setIncomingChallenge(null);
  };

  const makeMove = (index: number) => {
    if (!activeGame || !channel || activeGame.board[index] || activeGame.currentTurn !== activeGame.mySymbol || activeGame.status !== 'playing') return;

    const newBoard = [...activeGame.board];
    newBoard[index] = activeGame.mySymbol;
    const winnerInfo = checkWin(newBoard);

    if (winnerInfo) {
       updateTttLeaderboardForGame(winnerInfo === 'draw' ? 'draw' : winnerInfo === activeGame.mySymbol ? 'win' : 'loss', activeGame);
    }

    setActiveGame(prev => prev ? {
      ...prev,
      board: newBoard,
      currentTurn: prev.mySymbol === 'X' ? 'O' : 'X',
      winner: winnerInfo,
      status: winnerInfo ? 'ended' : 'playing'
    } : null);

    channel.postMessage({ type: 'MOVE', gameId: activeGame.gameId, index, symbol: activeGame.mySymbol });
  };

  const playAgain = () => {
    if (!activeGame || !channel) return;
    if (activeGame.rematchRequestedBy && activeGame.rematchRequestedBy !== activeGame.mySymbol) {
       channel.postMessage({ type: 'REMATCH_ACCEPT', gameId: activeGame.gameId });
       setActiveGame(prev => prev ? {
         ...prev, board: Array(9).fill(null), winner: null, status: 'playing', currentTurn: 'X', rematchRequestedBy: null
       } : null);
    } else {
       channel.postMessage({ type: 'REMATCH_REQUEST', gameId: activeGame.gameId, symbol: activeGame.mySymbol });
       setActiveGame(prev => prev ? { ...prev, rematchRequestedBy: activeGame.mySymbol } : null);
    }
  };

  const closeGame = () => {
    if (!activeGame || !channel) return;
    channel.postMessage({ type: 'LEAVE', gameId: activeGame.gameId });
  };

  const leaveGame = () => {
    if (!activeGame || !channel) return;
    channel.postMessage({ type: 'LEAVE', gameId: activeGame.gameId });
    setActiveGame(null);
  };

  const clearActiveGame = () => {
    setActiveGame(null);
  }

  const updatePuzzleScore = (timeMs: number) => {
    if (!currentUser) return;
    setPuzzleLeaderboard(prev => {
      const newLb = [...prev];
      const pIndex = newLb.findIndex(p => p.playerId === currentUser.id);
      if (pIndex >= 0) {
        if (timeMs < newLb[pIndex].bestTime) {
           newLb[pIndex] = { ...newLb[pIndex], bestTime: timeMs };
        }
      } else {
        newLb.push({
          playerId: currentUser.id, name: currentUser.name, className: currentUser.className || '',
          section: currentUser.sectionName || '', bestTime: timeMs
        });
      }
      localStorage.setItem('ajps_puzzle_leaderboard', JSON.stringify(newLb));
      return newLb;
    });
  };

  return (
    <GamesContext.Provider value={{
      tttLeaderboard, puzzleLeaderboard, activeGame, incomingChallenge,
      findMatch, acceptMatch, declineMatch, makeMove, closeGame, playAgain, leaveGame, updatePuzzleScore, clearActiveGame
    }}>
      {children}
      {/* Global Challenge Toast */}
      {incomingChallenge && (
        <div className="fixed top-20 right-4 z-[9999] bg-[#1F2937] text-white p-4 rounded-xl shadow-2xl border border-white/10 w-80 animate-in slide-in-from-right-8 fade-in">
          <div className="flex gap-3">
            <div className="bg-[#A05C2B] p-2 rounded-full text-2xl h-10 w-10 flex items-center justify-center">🎮</div>
            <div>
              <h4 className="font-bold text-sm">New Challenge!</h4>
              <p className="text-xs text-gray-300 mt-1">Someone is Challenging you in Tic and Tac!</p>
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button onClick={() => acceptMatch(incomingChallenge.gameId, incomingChallenge.challengerId)} className="flex-1 bg-[#A05C2B] hover:bg-[#8B4C20] py-2 rounded-lg text-xs font-bold transition-colors">Accept</button>
            <button onClick={declineMatch} className="flex-1 bg-white/10 hover:bg-white/20 py-2 rounded-lg text-xs font-bold transition-colors">Decline</button>
          </div>
        </div>
      )}
    </GamesContext.Provider>
  );
};

export const useGames = () => {
  const context = useContext(GamesContext);
  if (context === undefined) {
    throw new Error('useGames must be used within a GamesProvider');
  }
  return context;
};
