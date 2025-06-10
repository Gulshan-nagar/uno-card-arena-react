
import React from 'react';
import { Eye } from 'lucide-react';

const SpectatorMode: React.FC = () => {
  return (
    <div className="w-full text-center py-12">
      <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md rounded-xl px-6 py-3 border border-white/20">
        <Eye className="w-5 h-5 text-yellow-400" />
        <span className="text-white font-semibold">Spectator mode has been disabled</span>
      </div>
      <p className="text-white/60 text-sm mt-4">
        Please join as a player to participate in the game.
      </p>
    </div>
  );
};

export default SpectatorMode;
