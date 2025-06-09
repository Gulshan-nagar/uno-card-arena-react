
import React, { useState } from 'react';
import { help } from 'lucide-react';

const Tutorial: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed top-4 right-4 z-40 w-12 h-12 bg-yellow-500 hover:bg-yellow-600 text-white rounded-full flex items-center justify-center shadow-lg transition-all duration-200 hover:scale-110"
        title="Game Rules"
      >
        <help size={24} />
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-2xl max-h-[80vh] overflow-y-auto p-6">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-800">UNO Game Rules</h2>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700 text-xl font-bold"
              >
                ×
              </button>
            </div>
            
            <div className="space-y-4 text-gray-700">
              <section>
                <h3 className="text-lg font-semibold mb-2 text-blue-600">Objective</h3>
                <p>Be the first player to get rid of all your cards!</p>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-2 text-green-600">How to Play</h3>
                <ul className="list-disc list-inside space-y-1">
                  <li>Match the top card by color, number, or symbol</li>
                  <li>Draw a card if you can't play</li>
                  <li>Call "UNO" when you have one card left</li>
                </ul>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-2 text-red-600">Special Cards</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                  <div className="bg-red-100 p-2 rounded">
                    <strong>Skip:</strong> Next player loses their turn
                  </div>
                  <div className="bg-blue-100 p-2 rounded">
                    <strong>Reverse:</strong> Changes direction of play
                  </div>
                  <div className="bg-green-100 p-2 rounded">
                    <strong>Draw 2:</strong> Next player draws 2 cards
                  </div>
                  <div className="bg-gray-100 p-2 rounded">
                    <strong>Wild:</strong> Choose any color
                  </div>
                  <div className="bg-purple-100 p-2 rounded">
                    <strong>Wild Draw 4:</strong> Choose color, next player draws 4
                  </div>
                </div>
              </section>

              <section>
                <h3 className="text-lg font-semibold mb-2 text-purple-600">Game Tips</h3>
                <ul className="list-disc list-inside space-y-1 text-sm">
                  <li>Highlighted cards are playable</li>
                  <li>If no cards are highlighted, you must draw</li>
                  <li>Don't forget to call UNO with one card left!</li>
                  <li>Use special cards strategically</li>
                </ul>
              </section>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Tutorial;
