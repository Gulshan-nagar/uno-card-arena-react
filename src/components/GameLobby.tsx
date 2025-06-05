
import React, { useState } from 'react';

interface GameLobbyProps {
  onCreateRoom: (playerName: string) => void;
  onJoinRoom: (roomId: string, playerName: string) => void;
  error: string;
}

const GameLobby: React.FC<GameLobbyProps> = ({ onCreateRoom, onJoinRoom, error }) => {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [showJoinForm, setShowJoinForm] = useState(false);

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim()) {
      onCreateRoom(playerName.trim());
    }
  };

  const handleJoinRoom = (e: React.FormEvent) => {
    e.preventDefault();
    if (playerName.trim() && roomId.trim()) {
      onJoinRoom(roomId.trim().toUpperCase(), playerName.trim());
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-600 via-yellow-500 to-blue-600 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">UNO Game</h1>
          <p className="text-gray-600">Join the fun!</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Your Name
            </label>
            <input
              type="text"
              value={playerName}
              onChange={(e) => setPlayerName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your name"
              maxLength={20}
            />
          </div>

          {!showJoinForm ? (
            <div className="space-y-3">
              <button
                onClick={handleCreateRoom}
                disabled={!playerName.trim()}
                className="w-full py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Create New Room
              </button>
              
              <button
                onClick={() => setShowJoinForm(true)}
                className="w-full py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 transition-colors"
              >
                Join Existing Room
              </button>
            </div>
          ) : (
            <form onSubmit={handleJoinRoom} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Room Code
                </label>
                <input
                  type="text"
                  value={roomId}
                  onChange={(e) => setRoomId(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 uppercase"
                  placeholder="Enter room code"
                  maxLength={6}
                />
              </div>
              
              <button
                type="submit"
                disabled={!playerName.trim() || !roomId.trim()}
                className="w-full py-3 bg-blue-500 text-white font-bold rounded-lg hover:bg-blue-600 disabled:bg-gray-300 disabled:cursor-not-allowed transition-colors"
              >
                Join Room
              </button>
              
              <button
                type="button"
                onClick={() => setShowJoinForm(false)}
                className="w-full py-2 text-gray-600 hover:text-gray-800 transition-colors"
              >
                Back
              </button>
            </form>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-500">
          <p>2-4 players • Real-time multiplayer</p>
        </div>
      </div>
    </div>
  );
};

export default GameLobby;
