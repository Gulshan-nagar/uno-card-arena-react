
import React from 'react';
import { Card } from '../types/uno';
import UnoCard from './UnoCard';
import { ArrowDown } from 'lucide-react';

interface PlayerHandProps {
  cards: Card[];
  onPlayCard: (cardIndex: number) => void;
  isCurrentPlayer: boolean;
  canPlay: boolean;
  gameState: any;
  topCard: Card;
}

const PlayerHand: React.FC<PlayerHandProps> = ({ 
  cards, 
  onPlayCard, 
  isCurrentPlayer,
  canPlay,
  gameState,
  topCard
}) => {
  const isCardPlayable = (card: Card): boolean => {
    if (!canPlay || !topCard) return false;
    
    if (gameState?.drawCount > 0) {
      return (card.type === 'action' && card.value === 'draw2') || 
             (card.type === 'wild' && card.value === 'draw4');
    }

    if (card.type === 'wild') return true;
    
    const topColor = topCard.chosenColor || topCard.color;
    
    return card.color === topColor || 
           (card.type === 'number' && topCard.type === 'number' && card.value === topCard.value) ||
           (card.type === 'action' && topCard.type === 'action' && card.value === topCard.value);
  };

  const playableCards = cards.filter(isCardPlayable);
  const hasPlayableCards = playableCards.length > 0;

  return (
    <div className="bg-gradient-to-r from-purple-900/40 via-blue-900/40 to-purple-900/40 rounded-2xl p-6 backdrop-blur-sm border border-white/20">
      <h3 className="text-white text-xl mb-4 text-center font-bold">
        Your Hand ({cards.length} cards)
        {isCurrentPlayer && (
          <span className="block text-sm text-yellow-300 mt-1">Your turn!</span>
        )}
      </h3>
      
      <div className="flex flex-wrap justify-center gap-2 md:gap-4 mb-4">
        {cards.map((card, index) => {
          const cardIsPlayable = isCardPlayable(card);
          return (
            <UnoCard
              key={index}
              card={card}
              isPlayable={cardIsPlayable}
              isHighlighted={isCurrentPlayer && cardIsPlayable}
              onClick={() => cardIsPlayable && onPlayCard(index)}
            />
          );
        })}
      </div>

      {isCurrentPlayer && !hasPlayableCards && (
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-red-500/80 text-white px-4 py-2 rounded-full font-bold animate-bounce">
            <ArrowDown className="w-5 h-5" />
            Draw a card from the deck!
            <ArrowDown className="w-5 h-5" />
          </div>
        </div>
      )}

      {!isCurrentPlayer && (
        <p className="text-center text-white/70 mt-4">
          Wait for your turn to play
        </p>
      )}
    </div>
  );
};

export default PlayerHand;
