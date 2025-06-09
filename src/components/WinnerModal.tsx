
import React from 'react';
import { star } from 'lucide-react';

interface WinnerModalProps {
  winnerName: string;
  onClose: () => void;
}

const WinnerModal: React.FC<WinnerModalProps> = ({ winnerName, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-gradient-to-br from-yellow-400 via-orange-400 to-red-400 rounded-2xl p-8 max-w-md w-full text-center relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-pulse"></div>
        
        <div className="relative z-10">
          <div className="mb-6">
            <star className="w-16 h-16 text-yellow-200 mx-auto mb-4 animate-bounce" />
            <h2 className="text-3xl font-bold text-white mb-2">🎉 WINNER! 🎉</h2>
            <p className="text-xl text-white/90 font-semibold">{winnerName}</p>
          </div>
          
          <div className="mb-6">
            <p className="text-white/80 text-lg">Congratulations on your victory!</p>
          </div>
          
          <button
            onClick={onClose}
            className="bg-white text-orange-600 px-8 py-3 rounded-full font-bold text-lg hover:bg-orange-50 transition-colors shadow-lg"
          >
            Play Again
          </button>
        </div>
        
        <div className="absolute top-2 left-2 w-4 h-4 bg-yellow-300 rounded-full animate-ping"></div>
        <div className="absolute top-4 right-4 w-3 h-3 bg-orange-300 rounded-full animate-ping delay-300"></div>
        <div className="absolute bottom-4 left-4 w-2 h-2 bg-red-300 rounded-full animate-ping delay-700"></div>
      </div>
    </div>
  );
};

export default WinnerModal;
