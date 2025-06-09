
import React from 'react';
import { Eye, Users } from 'lucide-react';
import { GameState, Player } from '../types/uno';
import GameBoard from './GameBoard';

interface SpectatorModeProps {
  gameState: GameState;
  spectators: Array<{ id: string; name: string }>;
  currentPlayerId?: string;
}

const SpectatorMode: React.FC<SpectatorModeProps> = ({
  gameState,
  spectators,
  currentPlayerId
}) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Spectator Header */}
        <div className="mb-6 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-white/20">
            <Eye className="w-5 h-5 text-yellow-400" />
            <span className="text-white font-semibold">Spectating Game</span>
            <div className="flex items-center gap-1 ml-4">
              <Users className="w-4 h-4 text-white/70" />
              <span className="text-white/70 text-sm">{spectators.length} spectators</span>
            </div>
          </div>
        </div>

        {/* Game Board */}
        {gameState.gameStarted && (
          <GameBoard 
            gameState={gameState}
            onDrawCard={() => {}} // Spectators can't interact
            onCallUno={() => {}} // Spectators can't interact
            currentPlayerId={currentPlayerId || ''}
            adminId=""
            isSpectator={true}
          />
        )}

        {/* Spectator List */}
        <div className="mt-6 bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/20">
          <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
            <Users className="w-4 h-4" />
            Spectators ({spectators.length})
          </h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            {spectators.map((spectator) => (
              <div
                key={spectator.id}
                className="bg-white/10 rounded-lg p-2 text-center"
              >
                <span className="text-white/80 text-sm">{spectator.name}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Spectator Instructions */}
        <div className="mt-4 text-center">
          <p className="text-white/60 text-sm">
            You are watching this game. You cannot participate but can observe all moves and chat with other spectators.
          </p>
        </div>
      </div>
    </div>
  );
};

export default SpectatorMode;
