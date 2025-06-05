
import React from 'react';
import { GameState } from '../types/uno';
import UnoCard from './UnoCard';

interface GameBoardProps {
  gameState: GameState;
  onDrawCard: () => void;
  onCallUno: () => void;
  currentPlayerId: string;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  gameState, 
  onDrawCard, 
  onCallUno, 
  currentPlayerId 
}) => {
  const currentPlayer = gameState.players[gameState.currentPlayer];
  const isCurrentPlayerTurn = currentPlayer?.id === currentPlayerId;

  return (
    <div className="mb-8">
      {/* Player Status */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        {gameState.players.map((player, index) => (
          <div 
            key={player.id}
            className={`p-4 rounded-lg text-center ${
              index === gameState.currentPlayer 
                ? 'bg-yellow-400 text-black' 
                : 'bg-white/20 text-white'
            }`}
          >
            <div className="font-bold">{player.name}</div>
            <div className="text-sm">Cards: {player.handCount}</div>
            {player.hasCalledUno && (
              <div className="text-xs font-bold text-red-500">UNO!</div>
            )}
            {player.id === currentPlayerId && (
              <div className="text-xs">(You)</div>
            )}
          </div>
        ))}
      </div>

      {/* Game Center */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 mb-6">
        {/* Draw Pile */}
        <div className="text-center">
          <button
            onClick={onDrawCard}
            disabled={!isCurrentPlayerTurn}
            className={`${
              isCurrentPlayerTurn
                ? 'hover:scale-110 cursor-pointer' 
                : 'opacity-50 cursor-not-allowed'
            } transition-transform`}
          >
            <div className="w-20 h-28 bg-blue-800 rounded-lg border-2 border-white flex items-center justify-center">
              <div className="text-white font-bold">DRAW</div>
            </div>
          </button>
          <p className="text-white mt-2">Draw Pile</p>
        </div>

        {/* Current Card */}
        <div className="text-center">
          <UnoCard 
            card={gameState.topCard} 
            isPlayable={false}
            onClick={() => {}}
          />
          <p className="text-white mt-2">Current Card</p>
          {gameState.drawCount > 0 && (
            <p className="text-red-300 font-bold">
              Must draw {gameState.drawCount} cards!
            </p>
          )}
        </div>

        {/* UNO Button */}
        <div className="text-center">
          <button
            onClick={onCallUno}
            className="w-20 h-28 bg-red-600 rounded-lg border-2 border-white hover:bg-red-700 transition-colors"
          >
            <div className="text-white font-bold text-xl">UNO!</div>
          </button>
          <p className="text-white mt-2">Call UNO</p>
        </div>
      </div>

      {/* Turn Indicator */}
      <div className="text-center text-white">
        <p className="text-lg">
          {isCurrentPlayerTurn ? 
            "It's your turn!" : 
            `${currentPlayer?.name}'s turn`
          }
        </p>
      </div>
    </div>
  );
};

export default GameBoard;
