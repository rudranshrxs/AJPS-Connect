import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useGames } from '../../context/GamesContext';
import { GlassCard } from '../../components/ui/GlassCard';
import { useNavigate } from 'react-router-dom';
import { Gamepad2, Puzzle, Search, Trophy, Medal, Clock, ShieldAlert } from 'lucide-react';

export const Games = () => {
  const { currentUser } = useAuth();
  const { tttLeaderboard, puzzleLeaderboard, findMatch, activeGame } = useGames();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'ttt' | 'puzzle'>('ttt');
  const [isSearching, setIsSearching] = useState(false);

  // If there's an active game, maybe redirect or show a button
  if (activeGame) {
    navigate('/games/tictactoe');
  }

  if (!currentUser || currentUser.role !== 'Student') {
    return (
      <div className="flex flex-col items-center justify-center p-8 h-full text-center">
        <ShieldAlert className="w-16 h-16 text-red-400 mb-4" />
        <h2 className="text-2xl font-bold text-gray-800 mb-2">Students Only</h2>
        <p className="text-gray-500">The Games Module is restricted to active students only.</p>
      </div>
    );
  }

  const handleFindMatch = () => {
    setIsSearching(true);
    findMatch();
    setTimeout(() => {
       setIsSearching(false); // timeout visual
    }, 15000);
  };

  const sortedTttLb = [...tttLeaderboard].sort((a, b) => b.points - a.points);
  const sortedPuzzleLb = [...puzzleLeaderboard].sort((a, b) => a.bestTime - b.bestTime);

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    const milliseconds = Math.floor((ms % 1000) / 10);
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${milliseconds.toString().padStart(2, '0')}`;
  };

  return (
    <div className="p-4 md:p-8 max-w-6xl mx-auto animate-in fade-in pb-24 md:pb-8">
      <div className="flex items-center gap-3 mb-8">
        <div className="p-3 bg-[#A05C2B] rounded-xl shadow-lg">
          <Gamepad2 className="w-6 h-6 text-white" />
        </div>
        <div>
          <h1 className="text-2xl md:text-3xl font-black text-gray-900 tracking-tight">AJPS Arcade</h1>
          <p className="text-sm text-gray-500 font-medium">Challenge friends, solve puzzles, climb the leaderboard.</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-6 mb-10">
        <GlassCard className="p-6 relative overflow-hidden group border-[#A05C2B]/20">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-[#FDF3E7] rounded-full blur-2xl opacity-60 group-hover:bg-[#FCE5CD] transition-colors" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-12 h-12 bg-[#FDF3E7] rounded-xl flex items-center justify-center mb-4 text-[#A05C2B]">
              <Gamepad2 className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">Tic and Tac</h3>
            <p className="text-sm text-gray-600 mb-6 flex-1">Anonymous real-time multiplayer. Find a match, play your best, and see who you beat at the end! Win +10 pts, Draw +5 pts.</p>
            
            <button 
              onClick={handleFindMatch}
              disabled={isSearching}
              className="w-full py-3 bg-[#A05C2B] text-white font-bold rounded-xl shadow-md hover:bg-[#8B4C20] transition-colors flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-wait"
            >
              {isSearching ? <><Search className="w-5 h-5 animate-spin" /> Searching for Opponent...</> : 'Find Match'}
            </button>
          </div>
        </GlassCard>

        <GlassCard className="p-6 relative overflow-hidden group border-amber-200/50">
          <div className="absolute -right-6 -top-6 w-32 h-32 bg-amber-50 rounded-full blur-2xl opacity-60 group-hover:bg-amber-100 transition-colors" />
          <div className="relative z-10 flex flex-col h-full">
            <div className="w-12 h-12 bg-amber-100 rounded-xl flex items-center justify-center mb-4 text-amber-600">
              <Puzzle className="w-6 h-6" />
            </div>
            <h3 className="text-xl font-black text-gray-900 mb-2">5×5 Sliding Puzzle</h3>
            <p className="text-sm text-gray-600 mb-6 flex-1">Speed run! Slide the tiles to order them 1 to 24. A perfectly shuffled but guaranteed solvable board awaits.</p>
            
            <button 
              onClick={() => navigate('/games/slidingpuzzle')}
              className="w-full py-3 bg-amber-500 text-white font-bold rounded-xl shadow-md hover:bg-amber-600 transition-colors"
            >
              Start Speed Run
            </button>
          </div>
        </GlassCard>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="flex border-b border-gray-100 p-2 gap-2 bg-gray-50/50">
          <button 
            onClick={() => setActiveTab('ttt')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors ${activeTab === 'ttt' ? 'bg-white shadow-sm text-[#A05C2B] border border-gray-100' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Trophy className="w-4 h-4" /> Tic and Tac Leaderboard
          </button>
          <button 
            onClick={() => setActiveTab('puzzle')}
            className={`flex-1 py-3 text-sm font-bold rounded-xl flex items-center justify-center gap-2 transition-colors ${activeTab === 'puzzle' ? 'bg-white shadow-sm text-amber-600 border border-gray-100' : 'text-gray-500 hover:bg-gray-100'}`}
          >
            <Clock className="w-4 h-4" /> Sliding Puzzle Records
          </button>
        </div>

        <div className="p-0">
          {activeTab === 'ttt' && (
            <div className="overflow-x-auto w-full custom-scrollbar">
               <table className="w-full text-left text-sm whitespace-nowrap min-w-[600px]">
                 <thead className="bg-[#FDFBF7] border-b border-gray-200 text-gray-500 text-xs uppercase tracking-wider">
                   <tr>
                     <th className="p-4 font-bold">Rank</th>
                     <th className="p-4 font-bold">Student</th>
                     <th className="p-4 font-bold">Class</th>
                     <th className="p-4 font-bold text-center">W / D / L</th>
                     <th className="p-4 font-bold text-right text-[#A05C2B]">Points</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {sortedTttLb.length === 0 ? (
                     <tr><td colSpan={5} className="p-8 text-center text-gray-400 font-medium italic">No matches played yet. Be the first!</td></tr>
                   ) : (
                     sortedTttLb.map((entry, idx) => (
                       <tr key={entry.playerId} className={`hover:bg-gray-50 ${entry.playerId === currentUser.id ? 'bg-[#FDF3E7]/50' : ''}`}>
                         <td className="p-4 font-black text-gray-400">
                           {idx === 0 ? <Medal className="w-5 h-5 text-yellow-500" /> : idx === 1 ? <Medal className="w-5 h-5 text-gray-400" /> : idx === 2 ? <Medal className="w-5 h-5 text-amber-700" /> : `#${idx + 1}`}
                         </td>
                         <td className="p-4 font-bold text-gray-800">{entry.name} {entry.playerId === currentUser.id && <span className="ml-2 text-xs bg-[#A05C2B] text-white px-2 py-0.5 rounded-full">You</span>}</td>
                         <td className="p-4 font-medium text-gray-600">{entry.className} {entry.section}</td>
                         <td className="p-4 font-medium text-gray-500 text-center"><span className="text-green-600 font-bold">{entry.wins}</span> - <span className="text-gray-400 font-bold">{entry.draws}</span> - <span className="text-red-400 font-bold">{entry.losses}</span></td>
                         <td className="p-4 font-black text-right text-[#A05C2B]">{entry.points}</td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
            </div>
          )}

          {activeTab === 'puzzle' && (
            <div className="overflow-x-auto w-full custom-scrollbar">
               <table className="w-full text-left text-sm whitespace-nowrap min-w-[500px]">
                 <thead className="bg-amber-50/50 border-b border-amber-100 text-gray-500 text-xs uppercase tracking-wider">
                   <tr>
                     <th className="p-4 font-bold">Rank</th>
                     <th className="p-4 font-bold">Student</th>
                     <th className="p-4 font-bold">Class</th>
                     <th className="p-4 font-bold text-right text-amber-600">Best Time</th>
                   </tr>
                 </thead>
                 <tbody className="divide-y divide-gray-100">
                   {sortedPuzzleLb.length === 0 ? (
                     <tr><td colSpan={4} className="p-8 text-center text-gray-400 font-medium italic">No puzzles solved yet. Set the first record!</td></tr>
                   ) : (
                     sortedPuzzleLb.map((entry, idx) => (
                       <tr key={entry.playerId} className={`hover:bg-gray-50 ${entry.playerId === currentUser.id ? 'bg-amber-50/30' : ''}`}>
                         <td className="p-4 font-black text-gray-400">
                           {idx === 0 ? <Medal className="w-5 h-5 text-yellow-500" /> : idx === 1 ? <Medal className="w-5 h-5 text-gray-400" /> : idx === 2 ? <Medal className="w-5 h-5 text-amber-700" /> : `#${idx + 1}`}
                         </td>
                         <td className="p-4 font-bold text-gray-800">{entry.name} {entry.playerId === currentUser.id && <span className="ml-2 text-xs bg-amber-500 text-white px-2 py-0.5 rounded-full">You</span>}</td>
                         <td className="p-4 font-medium text-gray-600">{entry.className} {entry.section}</td>
                         <td className="p-4 font-mono font-bold text-right text-amber-600">{formatTime(entry.bestTime)}</td>
                       </tr>
                     ))
                   )}
                 </tbody>
               </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
