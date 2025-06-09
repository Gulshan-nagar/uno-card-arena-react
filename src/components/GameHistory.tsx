
import React, { useState, useEffect } from 'react';
import { History, Trophy, Users, Clock, Calendar } from 'lucide-react';

interface GameRecord {
  id: string;
  roomId: string;
  players: Array<{
    name: string;
    finalPosition: number;
    cardsLeft: number;
  }>;
  winner: string;
  duration: number; // in minutes
  startTime: Date;
  endTime: Date;
  gameMode: string;
}

interface GameHistoryProps {
  socket: any;
  playerId: string;
  isOpen: boolean;
  onClose: () => void;
}

const GameHistory: React.FC<GameHistoryProps> = ({
  socket,
  playerId,
  isOpen,
  onClose
}) => {
  const [gameHistory, setGameHistory] = useState<GameRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [filter, setFilter] = useState<'all' | 'won' | 'lost'>('all');

  useEffect(() => {
    if (isOpen && socket) {
      setLoading(true);
      socket.emit('getGameHistory', { playerId });
      
      socket.on('gameHistoryUpdate', (history: GameRecord[]) => {
        setGameHistory(history);
        setLoading(false);
      });

      return () => {
        socket.off('gameHistoryUpdate');
      };
    }
  }, [isOpen, socket, playerId]);

  const filteredHistory = gameHistory.filter(game => {
    if (filter === 'won') return game.winner === playerId;
    if (filter === 'lost') return game.winner !== playerId;
    return true;
  });

  const stats = {
    totalGames: gameHistory.length,
    wins: gameHistory.filter(g => g.winner === playerId).length,
    winRate: gameHistory.length > 0 ? Math.round((gameHistory.filter(g => g.winner === playerId).length / gameHistory.length) * 100) : 0
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-4xl w-full max-h-[80vh] overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
              <History className="w-6 h-6" />
              Game History
            </h2>
            <button
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 text-xl font-bold"
            >
              ×
            </button>
          </div>
          
          {/* Stats */}
          <div className="mt-4 grid grid-cols-3 gap-4">
            <div className="bg-blue-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-blue-600">{stats.totalGames}</div>
              <div className="text-sm text-blue-800">Total Games</div>
            </div>
            <div className="bg-green-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-green-600">{stats.wins}</div>
              <div className="text-sm text-green-800">Wins</div>
            </div>
            <div className="bg-purple-50 rounded-lg p-3 text-center">
              <div className="text-2xl font-bold text-purple-600">{stats.winRate}%</div>
              <div className="text-sm text-purple-800">Win Rate</div>
            </div>
          </div>
        </div>

        <div className="p-6">
          {/* Filter */}
          <div className="mb-4 flex gap-2">
            {(['all', 'won', 'lost'] as const).map((filterOption) => (
              <button
                key={filterOption}
                onClick={() => setFilter(filterOption)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors ${
                  filter === filterOption
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {filterOption}
              </button>
            ))}
          </div>

          {/* History List */}
          <div className="space-y-3 max-h-96 overflow-y-auto">
            {loading ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                <p className="text-gray-500 mt-2">Loading history...</p>
              </div>
            ) : filteredHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No games found
              </div>
            ) : (
              filteredHistory.map((game) => (
                <div
                  key={game.id}
                  className={`border rounded-lg p-4 ${
                    game.winner === playerId ? 'border-green-200 bg-green-50' : 'border-gray-200 bg-gray-50'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {game.winner === playerId && (
                        <Trophy className="w-4 h-4 text-yellow-500" />
                      )}
                      <span className="font-semibold">Room: {game.roomId}</span>
                      <span className="text-sm text-gray-500">({game.gameMode})</span>
                    </div>
                    <div className="flex items-center gap-4 text-sm text-gray-500">
                      <div className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {game.duration}m
                      </div>
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(game.endTime).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1">
                      <Users className="w-4 h-4 text-gray-400" />
                      <span className="text-sm">{game.players.length} players</span>
                    </div>
                    <div className="text-sm">
                      Winner: <span className="font-semibold">{game.winner}</span>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameHistory;
