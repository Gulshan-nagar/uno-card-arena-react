
import React from 'react';
import { Card } from '../types/uno';

interface UnoCardProps {
  card: Card;
  isPlayable: boolean;
  onClick: () => void;
}

const UnoCard: React.FC<UnoCardProps> = ({ card, isPlayable, onClick }) => {
  const getCardColor = () => {
    if (card.type === 'wild') {
      return card.chosenColor || 'black';
    }
    return card.color || 'black';
  };

  const getCardContent = () => {
    if (card.type === 'number') {
      return card.value.toString();
    }
    
    if (card.type === 'action') {
      switch (card.value) {
        case 'skip': return 'SKIP';
        case 'reverse': return '↔';
        case 'draw2': return '+2';
        default: return card.value;
      }
    }
    
    if (card.type === 'wild') {
      return card.value === 'draw4' ? '+4' : 'WILD';
    }
    
    return '';
  };

  const colorClasses = {
    red: 'bg-red-500 border-red-600',
    blue: 'bg-blue-500 border-blue-600',
    green: 'bg-green-500 border-green-600',
    yellow: 'bg-yellow-400 border-yellow-500',
    black: 'bg-gray-800 border-gray-900'
  };

  const cardColor = getCardColor();
  const colorClass = colorClasses[cardColor as keyof typeof colorClasses] || colorClasses.black;

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={`
        w-16 h-24 md:w-20 md:h-28 rounded-lg border-2 
        flex items-center justify-center text-white font-bold
        transition-all duration-200 select-none
        ${colorClass}
        ${isPlayable ? 'hover:scale-110 hover:-translate-y-2 cursor-pointer shadow-lg' : ''}
        ${card.type === 'wild' && !card.chosenColor ? 'bg-gradient-to-br from-red-500 via-blue-500 to-green-500' : ''}
      `}
    >
      <div className="text-center">
        <div className={`${card.type === 'wild' || card.type === 'action' ? 'text-xs md:text-sm' : 'text-lg md:text-2xl'}`}>
          {getCardContent()}
        </div>
        {card.type === 'wild' && card.chosenColor && (
          <div className="text-xs mt-1">({card.chosenColor})</div>
        )}
      </div>
    </div>
  );
};

export default UnoCard;
