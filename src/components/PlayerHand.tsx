
import React from 'react';
import { Card } from '../types/uno';
import UnoCard from './UnoCard';

interface PlayerHandProps {
  cards: Card[];
  onPlayCard: (cardIndex: number) => void;
  isCurrentPlayer: boolean;
  canPlay: boolean;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ 
  cards, 
  onPlayCard, 
  isCurrentPlayer,
  canPlay 
}) => {
  return (
    <div className="bg-white/10 rounded-lg p-4">
      <h3 className="text-white text-xl mb-4 text-center">
        Your Hand ({cards.length} cards)
      </h3>
      
      <div className="flex flex-wrap justify-center gap-2 md:gap-4">
        {cards.map((card, index) => (
          <UnoCard
            key={index}
            card={card}
            isPlayable={canPlay}
            onClick={() => canPlay && onPlayCard(index)}
          />
        ))}
      </div>

      {!isCurrentPlayer && (
        <p className="text-center text-white/70 mt-4">
          Wait for your turn to play
        </p>
      )}
    </div>
  );
};

export default PlayerHand;
