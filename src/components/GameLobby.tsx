
import React, { useState } from 'react';
import { User, Users, Eye, History } from 'lucide-react';

interface GameLobbyProps {
  onCreateRoom: (name: string) => void;
  onJoinRoom: (roomId: string, name: string) => void;
  onSpectateGame?: (roomId: string, name: string) => void; 
  error: string;
  onShowGameHistory?: () => void;
  onShowPlayerProfile?: () => void;
}

const GameLobby: React.FC<GameLobbyProps> = ({
  onCreateRoom,
  onJoinRoom,
  onSpectateGame,
  error,
  onShowGameHistory,
  onShowPlayerProfile
}) => {
  const [playerName, setPlayerName] = useState('');
  const [roomId, setRoomId] = useState('');
  const [activeTab, setActiveTab] = useState<'create' | 'join' | 'spectate'>('create');
  const [isNameValid, setIsNameValid] = useState<boolean>(true);
  const [isRoomIdValid, setIsRoomIdValid] = useState<boolean>(true);

  const validateName = (name: string): boolean => {
    return name.trim().length >= 2 && name.trim().length <= 20;
  };

  const validateRoomId = (id: string): boolean => {
    return /^[A-Z0-9]{6}$/.test(id);
  };

  const handleCreateRoom = () => {
    if (validateName(playerName)) {
      onCreateRoom(playerName);
    } else {
      setIsNameValid(false);
    }
  };

  const handleJoinRoom = () => {
    if (validateName(playerName) && validateRoomId(roomId)) {
      onJoinRoom(roomId, playerName);
    } else {
      setIsNameValid(validateName(playerName));
      setIsRoomIdValid(validateRoomId(roomId));
    }
  };

  const handleSpectateGame = () => {
    if (validateName(playerName) && validateRoomId(roomId) && onSpectateGame) {
      onSpectateGame(roomId, playerName);
    } else {
      setIsNameValid(validateName(playerName));
      setIsRoomIdValid(validateRoomId(roomId));
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (activeTab === 'create') {
        handleCreateRoom();
      } else if (activeTab === 'join') {
        handleJoinRoom();
      } else if (activeTab === 'spectate') {
        handleSpectateGame();
      }
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 max-w-md w-full border border-white/20">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">🎮 UNO Arena 🎮</h1>
          <p className="text-white/80">Ready to play the classic card game online?</p>
        </div>
        
        {/* Tabs */}
        <div className="flex rounded-lg bg-white/5 p-1 mb-6">
          <button
            onClick={() => setActiveTab('create')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'create'
                ? 'bg-blue-500 text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Users className="w-4 h-4" />
            Create
          </button>
          <button
            onClick={() => setActiveTab('join')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'join'
                ? 'bg-blue-500 text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <User className="w-4 h-4" />
            Join
          </button>
          <button
            onClick={() => setActiveTab('spectate')}
            className={`flex-1 py-2 px-4 rounded-md transition-colors flex items-center justify-center gap-2 ${
              activeTab === 'spectate'
                ? 'bg-blue-500 text-white'
                : 'text-white/70 hover:text-white'
            }`}
          >
            <Eye className="w-4 h-4" />
            Spectate
          </button>
        </div>

        {/* Name Field (common to all tabs) */}
        <div className="mb-4">
          <label className="block text-white mb-2 font-medium">Your Name</label>
          <input
            type="text"
            value={playerName}
            onChange={(e) => {
              setPlayerName(e.target.value);
              setIsNameValid(true);
            }}
            onKeyPress={handleKeyPress}
            maxLength={20}
            placeholder="Enter your name"
            className={`w-full px-4 py-3 rounded-lg bg-white/5 text-white border ${
              isNameValid ? 'border-white/20' : 'border-red-400'
            } focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/40`}
          />
          {!isNameValid && (
            <p className="text-red-300 text-sm mt-1">
              Name should be between 2-20 characters
            </p>
          )}
        </div>

        {/* Room ID Field (only for join/spectate) */}
        {(activeTab === 'join' || activeTab === 'spectate') && (
          <div className="mb-4">
            <label className="block text-white mb-2 font-medium">Room Code</label>
            <input
              type="text"
              value={roomId}
              onChange={(e) => {
                setRoomId(e.target.value.toUpperCase());
                setIsRoomIdValid(true);
              }}
              onKeyPress={handleKeyPress}
              placeholder="Enter 6-digit code"
              maxLength={6}
              className={`w-full px-4 py-3 rounded-lg bg-white/5 text-white border ${
                isRoomIdValid ? 'border-white/20' : 'border-red-400'
              } focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-white/40 uppercase`}
            />
            {!isRoomIdValid && (
              <p className="text-red-300 text-sm mt-1">
                Room code should be 6 alphanumeric characters
              </p>
            )}
          </div>
        )}

        {/* Action Button */}
        {activeTab === 'create' && (
          <button
            onClick={handleCreateRoom}
            className="w-full px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 text-white font-bold rounded-lg hover:from-blue-600 hover:to-blue-700 transition-all duration-300 shadow-lg mt-4"
          >
            Create New Game
          </button>
        )}

        {activeTab === 'join' && (
          <button
            onClick={handleJoinRoom}
            className="w-full px-4 py-3 bg-gradient-to-r from-purple-500 to-purple-600 text-white font-bold rounded-lg hover:from-purple-600 hover:to-purple-700 transition-all duration-300 shadow-lg mt-4"
          >
            Join Game
          </button>
        )}

        {activeTab === 'spectate' && (
          <button
            onClick={handleSpectateGame}
            className="w-full px-4 py-3 bg-gradient-to-r from-yellow-500 to-yellow-600 text-white font-bold rounded-lg hover:from-yellow-600 hover:to-yellow-700 transition-all duration-300 shadow-lg mt-4"
          >
            Spectate Game
          </button>
        )}

        {/* Additional Options */}
        <div className="mt-6 flex justify-center gap-4">
          {onShowPlayerProfile && (
            <button
              onClick={onShowPlayerProfile}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              <User className="w-4 h-4" />
              Profile
            </button>
          )}
          
          {onShowGameHistory && (
            <button
              onClick={onShowGameHistory}
              className="flex items-center gap-2 px-4 py-2 bg-white/10 text-white rounded-lg hover:bg-white/20 transition-colors"
            >
              <History className="w-4 h-4" />
              History
            </button>
          )}
        </div>

        {/* Error Display */}
        {error && (
          <div className="mt-6 p-3 bg-red-500/80 border border-red-400 text-white rounded-lg backdrop-blur-sm">
            {error}
          </div>
        )}
      </div>
    </div>
  );
};

export default GameLobby;
