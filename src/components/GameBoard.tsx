import React from 'react';
import { Plus, Zap, Users, Clock } from 'lucide-react';
import UnoCard from './UnoCard';
import { Card, GameState } from '../types/uno';

interface GameBoardProps {
  gameState: GameState;
  onDrawCard: () => void;
  onCallUno: () => void;
  currentPlayerId: string;
  adminId: string;
  isSpectator?: boolean;
}

const calculatePlayerPositions = (
  numPlayers: number,
  currentPlayerIndex: number
) => {
  const positions = [];
  const angleIncrement = 360 / numPlayers;

  for (let i = 0; i < numPlayers; i++) {
    const angle = (i * angleIncrement - 90 - currentPlayerIndex * angleIncrement + 360) % 360;
    const radians = (angle * Math.PI) / 180;
    const distance = 100; // Distance from the center

    const x = 50 + distance * Math.cos(radians) * 0.6; // Adjusted for aspect ratio
    const y = 50 + distance * Math.sin(radians) * 0.5; // Adjusted for aspect ratio

    positions.push({ x, y });
  }

  return positions;
};

const playerHasOneCard = (gameState: GameState, currentPlayerId: string): boolean => {
  const player = gameState.players.find(player => player.id === currentPlayerId);
  return player ? player.handCount === 1 : false;
};

const GameBoard: React.FC<GameBoardProps> = ({
  gameState,
  onDrawCard,
  onCallUno,
  currentPlayerId,
  adminId,
  isSpectator = false,
}) => {
  const currentPlayerIndex = gameState.players.findIndex(
    (player) => player.id === currentPlayerId
  );
  const isCurrentPlayerActive = gameState.players[gameState.currentPlayer]?.id === currentPlayerId;

  const playerPositions = calculatePlayerPositions(
    gameState.players.length,
    currentPlayerIndex
  );

  return (
    <div className="relative w-full aspect-[4/3] md:aspect-[2/1] mb-8">
      {/* Game info */}
      <div className="absolute top-0 left-0 bg-white/10 backdrop-blur-md p-2 rounded-lg text-white text-sm flex items-center gap-3 border border-white/20">
        <div className="flex items-center gap-1">
          <Users className="w-4 h-4" />
          <span>{gameState.players.length} players</span>
        </div>
        <div className="flex items-center gap-1">
          <Clock className="w-4 h-4" />
          <span>Turn: {gameState.currentPlayer + 1}</span>
        </div>
        {isSpectator && (
          <div className="bg-yellow-500/80 text-black px-2 py-0.5 rounded-full text-xs font-bold">
            SPECTATING
          </div>
        )}
      </div>

      {/* Center area with draw pile and top card */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex gap-4 md:gap-8 items-center">
        {/* Draw pile */}
        <div 
          onClick={isCurrentPlayerActive && !isSpectator ? onDrawCard : undefined}
          className={`relative ${isCurrentPlayerActive && !isSpectator ? 'cursor-pointer hover:scale-110 transition-transform' : ''}`}
        >
          <div className="w-20 h-32 md:w-24 md:h-36 bg-gradient-to-br from-blue-700 to-blue-900 rounded-xl p-1 border-4 border-white">
            <div className="w-full h-full border-2 border-dashed border-white/50 rounded-lg flex items-center justify-center text-white font-bold text-lg md:text-2xl">
              UNO
            </div>
          </div>
          <div className="absolute -bottom-2 -right-2">
            <div className="w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-full text-sm font-bold">
              <Plus />
            </div>
          </div>
        </div>

        {/* Top card */}
        <div className="relative">
          {gameState.topCard && (
            <>
              <UnoCard card={gameState.topCard} size="large" />
              
              {gameState.drawCount > 0 && (
                <div className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center bg-red-500 text-white rounded-full text-xs font-bold">
                  +{gameState.drawCount}
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Call UNO button */}
      {!isSpectator && (
        <button
          onClick={onCallUno}
          className={`absolute bottom-0 left-1/2 -translate-x-1/2 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-full font-bold text-xl shadow-lg transition-all ${
            playerHasOneCard(gameState, currentPlayerId) ? 'animate-pulse' : ''
          }`}
        >
          Call UNO!
        </button>
      )}

      {/* Player avatars in circular arrangement */}
      {gameState.players.map((player, index) => {
        const position = playerPositions[index];
        const isCurrentPlayer = player.id === currentPlayerId;
        const isActivePlayer = index === gameState.currentPlayer;
        
        return (
          <div
            key={player.id}
            style={{
              position: 'absolute',
              top: `${position.y}%`,
              left: `${position.x}%`,
              transform: 'translate(-50%, -50%)'
            }}
            className={`transition-all duration-300 ${
              isActivePlayer && 'animate-pulse'
            }`}
          >
            <div
              className={`w-16 h-16 md:w-20 md:h-20 rounded-full flex items-center justify-center relative 
              ${isCurrentPlayer 
                ? 'bg-blue-500 text-white' 
                : 'bg-white/10 backdrop-blur-md text-white border border-white/30'}
              ${isActivePlayer 
                ? 'ring-4 ring-yellow-400 animate-pulse' 
                : ''}`}
            >
              <div className="text-center">
                <div className="font-bold text-lg">
                  {player.name.charAt(0).toUpperCase()}
                </div>
                <div className="text-xs opacity-80 truncate max-w-[70px]">
                  {isCurrentPlayer ? 'You' : player.name}
                </div>
              </div>

              {/* Card count badge */}
              <div className="absolute -top-2 -right-2 w-7 h-7 flex items-center justify-center bg-red-500 text-white text-xs font-medium rounded-full border-2 border-white">
                {player.handCount}
              </div>
              
              {/* Admin badge */}
              {player.id === adminId && (
                <div className="absolute -bottom-1 -left-1 px-2 py-0.5 bg-yellow-500 text-black text-[10px] font-bold rounded-full">
                  ADMIN
                </div>
              )}
              
              {/* UNO badge */}
              {player.hasCalledUno && player.handCount === 1 && (
                <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 px-2 py-0.5 bg-red-600 text-white text-xs font-bold rounded-full animate-bounce">
                  UNO!
                </div>
              )}
            </div>
            
            {/* Active player indicator */}
            {isActivePlayer && (
              <div className="absolute -bottom-6 left-1/2 transform -translate-x-1/2 flex items-center gap-1 bg-yellow-500/80 text-black px-2 py-0.5 rounded-full text-xs font-bold">
                <Zap className="w-3 h-3" />
                <span>Turn</span>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GameBoard;
