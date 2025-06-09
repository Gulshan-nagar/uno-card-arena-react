
import React from 'react';
import { GameState } from '../types/uno';
import UnoCard from './UnoCard';

interface GameBoardProps {
  gameState: GameState;
  onDrawCard: () => void;
  onCallUno: () => void;
  currentPlayerId: string;
  adminId: string;
}

const GameBoard: React.FC<GameBoardProps> = ({ 
  gameState, 
  onDrawCard, 
  onCallUno, 
  currentPlayerId,
  adminId
}) => {
  const currentPlayer = gameState.players[gameState.currentPlayer];
  const isCurrentPlayerTurn = currentPlayer?.id === currentPlayerId;

  const getPlayerPosition = (index: number, totalPlayers: number) => {
    if (totalPlayers <= 2) {
      return index === 0 ? 'top' : 'bottom';
    } else if (totalPlayers === 3) {
      switch (index) {
        case 0: return 'top';
        case 1: return 'left';
        case 2: return 'right';
        default: return 'bottom';
      }
    } else {
      switch (index) {
        case 0: return 'top';
        case 1: return 'right';
        case 2: return 'bottom';
        case 3: return 'left';
        default: return 'bottom';
      }
    }
  };

  const getPositionStyles = (position: string, isCurrentTurn: boolean) => {
    const baseStyles = "absolute bg-gradient-to-br from-white/20 to-white/10 backdrop-blur-sm rounded-xl p-4 border border-white/30 transition-all duration-300";
    const glowStyles = isCurrentTurn ? "ring-4 ring-yellow-400 ring-opacity-75 shadow-2xl scale-105" : "";
    
    switch (position) {
      case 'top':
        return `${baseStyles} top-4 left-1/2 transform -translate-x-1/2 ${glowStyles}`;
      case 'bottom':
        return `${baseStyles} bottom-4 left-1/2 transform -translate-x-1/2 ${glowStyles}`;
      case 'left':
        return `${baseStyles} left-4 top-1/2 transform -translate-y-1/2 ${glowStyles}`;
      case 'right':
        return `${baseStyles} right-4 top-1/2 transform -translate-y-1/2 ${glowStyles}`;
      default:
        return `${baseStyles} ${glowStyles}`;
    }
  };

  return (
    <div className="relative min-h-[400px] mb-8">
      {/* Players in circular positions */}
      {gameState.players.map((player, index) => {
        const position = getPlayerPosition(index, gameState.players.length);
        const isCurrentTurn = index === gameState.currentPlayer;
        
        return (
          <div 
            key={player.id}
            className={getPositionStyles(position, isCurrentTurn)}
          >
            <div className="text-center min-w-[120px]">
              <div className="font-bold text-white text-lg flex items-center gap-2">
                {player.name}
                {player.id === adminId && (
                  <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">ADMIN</span>
                )}
                {player.id === currentPlayerId && (
                  <span className="text-yellow-300">(You)</span>
                )}
              </div>
              <div className="text-white/80 text-sm mt-1">
                {player.handCount} card{player.handCount !== 1 ? 's' : ''}
              </div>
              {player.hasCalledUno && (
                <div className="bg-red-500 text-white px-2 py-1 rounded-full text-xs font-bold mt-2 animate-pulse">
                  UNO! 🔥
                </div>
              )}
              {isCurrentTurn && (
                <div className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold mt-1">
                  TURN
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Game Center */}
      <div className="flex flex-col md:flex-row items-center justify-center gap-8 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
        {/* Draw Pile */}
        <div className="text-center">
          <button
            onClick={onDrawCard}
            disabled={!isCurrentPlayerTurn}
            className={`${
              isCurrentPlayerTurn
                ? 'hover:scale-110 cursor-pointer shadow-2xl ring-2 ring-blue-400' 
                : 'opacity-50 cursor-not-allowed'
            } transition-all duration-300`}
          >
            <div className="w-20 h-28 bg-gradient-to-br from-blue-600 via-blue-700 to-blue-800 rounded-xl border-2 border-blue-400 flex items-center justify-center relative overflow-hidden">
              <div className="absolute inset-1 bg-blue-500/20 rounded-lg"></div>
              <div className="text-white font-bold text-sm relative z-10">DRAW</div>
              <div className="absolute top-1 left-1 w-2 h-2 bg-white/50 rounded-full"></div>
              <div className="absolute bottom-1 right-1 w-2 h-2 bg-white/50 rounded-full"></div>
            </div>
          </button>
          <p className="text-white mt-2 font-semibold">Draw Pile</p>
        </div>

        {/* Current Card */}
        <div className="text-center">
          <div className="relative">
            <UnoCard 
              card={gameState.topCard} 
              isPlayable={false}
              onClick={() => {}}
            />
            <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-transparent via-white/10 to-transparent animate-pulse"></div>
          </div>
          <p className="text-white mt-2 font-semibold">Current Card</p>
          {gameState.drawCount > 0 && (
            <div className="bg-red-500 text-white px-3 py-1 rounded-full font-bold text-sm mt-2 animate-bounce">
              Must draw {gameState.drawCount} cards!
            </div>
          )}
        </div>

        {/* UNO Button */}
        <div className="text-center">
          <button
            onClick={onCallUno}
            className="w-20 h-28 bg-gradient-to-br from-red-500 via-red-600 to-red-700 rounded-xl border-2 border-red-400 hover:scale-110 transition-all duration-300 shadow-lg relative overflow-hidden"
          >
            <div className="absolute inset-1 bg-red-400/20 rounded-lg"></div>
            <div className="text-white font-bold text-lg relative z-10">UNO!</div>
            <div className="absolute top-1 left-1 w-2 h-2 bg-white/50 rounded-full"></div>
            <div className="absolute bottom-1 right-1 w-2 h-2 bg-white/50 rounded-full"></div>
          </button>
          <p className="text-white mt-2 font-semibold">Call UNO</p>
        </div>
      </div>
    </div>
  );
};

export default GameBoard;
