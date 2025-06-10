import React, { useState, useEffect } from 'react';

interface GameLobbyProps {
  onCreateRoom: (name: string) => void;
  onJoinRoom: (roomId: string, name: string) => void;
  error: string;
  onShowGameHistory: () => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({
  onCreateRoom,
  onJoinRoom,
  error,
  onShowGameHistory
}) => {
  const [createName, setCreateName] = useState('');
  const [joinName, setJoinName] = useState('');
  const [roomCode, setRoomCode] = useState('');

  const isCreateNameValid = createName.trim() !== '';
  const isJoinNameValid = joinName.trim() !== '';
  const isRoomCodeValid = roomCode.trim() !== '' && roomCode.length === 6;
  const isJoinFormValid = isJoinNameValid && isRoomCodeValid;

  const handleCreateRoom = () => {
    if (isCreateNameValid) {
      onCreateRoom(createName);
    }
  };

  const handleJoinRoom = () => {
    if (isJoinFormValid) {
      onJoinRoom(roomCode, joinName);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <div className="text-center mb-8">
          <h1 className="text-6xl font-bold text-white mb-4 drop-shadow-lg">🎮 UNO Arena 🎮</h1>
          <p className="text-white/80 text-xl">The Ultimate Online UNO Experience</p>
        </div>

        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 border border-white/20">
          {error && (
            <div className="mb-6 p-4 bg-red-500/80 text-white rounded-lg backdrop-blur-sm border border-red-400 font-semibold">
              {error}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Create Room Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4 text-center">🚀 Create New Game</h2>
              <input
                type="text"
                placeholder="Enter your name"
                value={createName}
                onChange={(e) => setCreateName(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 backdrop-blur-sm"
                maxLength={20}
              />
              <button
                onClick={handleCreateRoom}
                disabled={!isCreateNameValid}
                className="w-full px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-lg hover:from-green-600 hover:to-green-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
              >
                Create Room 🎲
              </button>
            </div>

            {/* Join Room Section */}
            <div className="space-y-4">
              <h2 className="text-2xl font-bold text-white mb-4 text-center">🎯 Join Existing Game</h2>
              <input
                type="text"
                placeholder="Enter your name"
                value={joinName}
                onChange={(e) => setJoinName(e.target.value)}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 backdrop-blur-sm"
                maxLength={20}
              />
              <input
                type="text"
                placeholder="Enter room code (e.g., ABC123)"
                value={roomCode}
                onChange={(e) => setRoomCode(e.target.value.toUpperCase())}
                className="w-full px-4 py-3 bg-white/20 border border-white/30 rounded-lg text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-yellow-400 backdrop-blur-sm font-mono"
                maxLength={6}
              />
              <button
                onClick={handleJoinRoom}
                disabled={!isJoinFormValid}
                className="w-full px-6 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-blue-700 disabled:from-gray-500 disabled:to-gray-600 disabled:cursor-not-allowed transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:hover:scale-100"
              >
                Join Room 🎪
              </button>
            </div>
          </div>

          {/* Game History Button */}
          <div className="mt-8 text-center">
            <button
              onClick={onShowGameHistory}
              className="px-6 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
            >
              📊 View Game History
            </button>
          </div>

          {/* Game Rules */}
          <div className="mt-8 p-4 bg-white/5 rounded-lg border border-white/10">
            <h3 className="text-lg font-semibold text-white mb-2">🎯 Quick Rules:</h3>
            <ul className="text-white/80 text-sm space-y-1">
              <li>• Match cards by color or number</li>
              <li>• Use action cards strategically</li>
              <li>• Call "UNO" when you have one card left!</li>
              <li>• First player to empty their hand wins</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;
