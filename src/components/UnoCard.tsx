
import React from 'react';
import { Card } from '../types/uno';

interface UnoCardProps {
  card: Card;
  isPlayable: boolean;
  onClick: () => void;
  isHighlighted?: boolean;
}

const UnoCard: React.FC<UnoCardProps> = ({ card, isPlayable, onClick, isHighlighted = false }) => {
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
        case 'skip': return '🚫';
        case 'reverse': return '🔄';
        case 'draw2': return '+2';
        default: return card.value;
      }
    }
    
    if (card.type === 'wild') {
      return card.value === 'draw4' ? '+4' : '🌈';
    }
    
    return '';
  };

  const getCardStyles = () => {
    const cardColor = getCardColor();
    
    const baseStyles = `
      w-16 h-24 md:w-20 md:h-28 rounded-xl border-3 
      flex items-center justify-center text-white font-bold
      transition-all duration-300 select-none relative
      shadow-lg backdrop-blur-sm
    `;

    const colorStyles = {
      red: 'bg-gradient-to-br from-red-400 via-red-500 to-red-600 border-red-700',
      blue: 'bg-gradient-to-br from-blue-400 via-blue-500 to-blue-600 border-blue-700',
      green: 'bg-gradient-to-br from-green-400 via-green-500 to-green-600 border-green-700',
      yellow: 'bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 border-yellow-600 text-gray-800',
      black: 'bg-gradient-to-br from-gray-700 via-gray-800 to-gray-900 border-gray-900'
    };

    let cardStyle = colorStyles[cardColor as keyof typeof colorStyles] || colorStyles.black;

    if (card.type === 'wild' && !card.chosenColor) {
      cardStyle = 'bg-gradient-to-br from-red-500 via-yellow-400 via-green-500 to-blue-500 border-purple-600';
    }

    if (isPlayable && isHighlighted) {
      cardStyle += ' hover:scale-110 hover:-translate-y-3 cursor-pointer ring-4 ring-yellow-400 ring-opacity-75 shadow-2xl';
    } else if (isPlayable) {
      cardStyle += ' hover:scale-105 hover:-translate-y-1 cursor-pointer opacity-90';
    } else {
      cardStyle += ' opacity-40 grayscale';
    }

    return `${baseStyles} ${cardStyle}`;
  };

  return (
    <div
      onClick={isPlayable ? onClick : undefined}
      className={getCardStyles()}
    >
      {/* Card background pattern */}
      <div className="absolute inset-1 rounded-lg bg-white/10 backdrop-blur-sm"></div>
      
      {/* Card content */}
      <div className="text-center relative z-10">
        <div className={`${card.type === 'wild' || card.type === 'action' ? 'text-sm md:text-lg' : 'text-xl md:text-3xl'} font-black drop-shadow-lg`}>
          {getCardContent()}
        </div>
        {card.type === 'wild' && card.chosenColor && (
          <div className="text-xs mt-1 bg-black/30 rounded px-1">({card.chosenColor})</div>
        )}
      </div>

      {/* Highlight glow effect */}
      {isHighlighted && (
        <div className="absolute inset-0 rounded-xl bg-yellow-400/30 animate-pulse"></div>
      )}

      {/* Corner decoration */}
      <div className="absolute top-1 left-1 w-2 h-2 bg-white/30 rounded-full"></div>
      <div className="absolute bottom-1 right-1 w-2 h-2 bg-white/30 rounded-full"></div>
    </div>
  );
};

export default UnoCard;
