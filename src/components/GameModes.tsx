
import React, { useState } from 'react';
import { Zap, Clock, Trophy, Settings, Users } from 'lucide-react';

interface GameMode {
  id: string;
  name: string;
  description: string;
  icon: React.ReactNode;
  rules: string[];
  maxPlayers: number;
  estimatedDuration: string;
}

interface GameModesProps {
  selectedMode: string;
  onModeSelect: (mode: string) => void;
  onCustomRules?: (rules: any) => void;
}

const GameModes: React.FC<GameModesProps> = ({
  selectedMode,
  onModeSelect,
  onCustomRules
}) => {
  const [showCustomRules, setShowCustomRules] = useState(false);
  const [customSettings, setCustomSettings] = useState({
    drawStackLimit: 4,
    timeLimit: 30,
    allowStacking: true,
    forcePlayDrawnCard: false,
    jumpInRules: false,
    sevenSwap: false
  });

  const gameModes: GameMode[] = [
    {
      id: 'classic',
      name: 'Classic UNO',
      description: 'Traditional UNO rules',
      icon: <Users className="w-6 h-6" />,
      rules: [
        'Standard UNO deck (108 cards)',
        'Match color or number',
        'Special action cards',
        'Call UNO with one card left'
      ],
      maxPlayers: 4,
      estimatedDuration: '10-15 min'
    },
    {
      id: 'speed',
      name: 'Speed UNO',
      description: 'Fast-paced with time limits',
      icon: <Zap className="w-6 h-6" />,
      rules: [
        '15 seconds per turn',
        'Auto-draw if time expires',
        'No thinking time',
        'Faster gameplay'
      ],
      maxPlayers: 4,
      estimatedDuration: '5-8 min'
    },
    {
      id: 'tournament',
      name: 'Tournament Mode',
      description: 'Competitive ranked play',
      icon: <Trophy className="w-6 h-6" />,
      rules: [
        'Best of 3 rounds',
        'Points-based scoring',
        'Rank progression',
        'Strict rule enforcement'
      ],
      maxPlayers: 4,
      estimatedDuration: '20-30 min'
    },
    {
      id: 'house',
      name: 'House Rules',
      description: 'Customizable game rules',
      icon: <Settings className="w-6 h-6" />,
      rules: [
        'Stacking +2/+4 cards',
        'Seven swaps hands',
        'Jump-in on exact matches',
        'Custom draw limits'
      ],
      maxPlayers: 6,
      estimatedDuration: '15-25 min'
    }
  ];

  const handleCustomRuleChange = (rule: string, value: any) => {
    const newSettings = { ...customSettings, [rule]: value };
    setCustomSettings(newSettings);
    if (onCustomRules) {
      onCustomRules(newSettings);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-white mb-2">Choose Game Mode</h2>
        <p className="text-white/70">Select how you want to play UNO</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {gameModes.map((mode) => (
          <div
            key={mode.id}
            onClick={() => onModeSelect(mode.id)}
            className={`cursor-pointer p-6 rounded-xl border-2 transition-all hover:scale-105 ${
              selectedMode === mode.id
                ? 'border-yellow-400 bg-yellow-400/20 backdrop-blur-md'
                : 'border-white/20 bg-white/10 backdrop-blur-md hover:border-white/40'
            }`}
          >
            <div className="flex items-center gap-3 mb-4">
              <div className={`p-2 rounded-lg ${
                selectedMode === mode.id ? 'bg-yellow-400 text-black' : 'bg-white/20 text-white'
              }`}>
                {mode.icon}
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">{mode.name}</h3>
                <p className="text-white/70 text-sm">{mode.description}</p>
              </div>
            </div>

            <div className="space-y-2 mb-4">
              {mode.rules.map((rule, index) => (
                <div key={index} className="flex items-center gap-2 text-white/80 text-sm">
                  <div className="w-1.5 h-1.5 bg-white/60 rounded-full"></div>
                  {rule}
                </div>
              ))}
            </div>

            <div className="flex justify-between text-sm text-white/60">
              <span className="flex items-center gap-1">
                <Users className="w-3 h-3" />
                Up to {mode.maxPlayers} players
              </span>
              <span className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {mode.estimatedDuration}
              </span>
            </div>
          </div>
        ))}
      </div>

      {/* Custom Rules Panel */}
      {selectedMode === 'house' && (
        <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-bold text-white">Custom Rules</h3>
            <button
              onClick={() => setShowCustomRules(!showCustomRules)}
              className="text-white/70 hover:text-white transition-colors"
            >
              {showCustomRules ? 'Hide' : 'Show'} Options
            </button>
          </div>

          {showCustomRules && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white/80 text-sm mb-2">Draw Stack Limit</label>
                  <select
                    value={customSettings.drawStackLimit}
                    onChange={(e) => handleCustomRuleChange('drawStackLimit', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value={2}>2 cards max</option>
                    <option value={4}>4 cards max</option>
                    <option value={8}>8 cards max</option>
                    <option value={-1}>Unlimited</option>
                  </select>
                </div>

                <div>
                  <label className="block text-white/80 text-sm mb-2">Turn Time Limit</label>
                  <select
                    value={customSettings.timeLimit}
                    onChange={(e) => handleCustomRuleChange('timeLimit', Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white/10 border border-white/20 rounded-lg text-white"
                  >
                    <option value={15}>15 seconds</option>
                    <option value={30}>30 seconds</option>
                    <option value={60}>1 minute</option>
                    <option value={-1}>No limit</option>
                  </select>
                </div>
              </div>

              <div className="space-y-3">
                {[
                  { key: 'allowStacking', label: 'Allow stacking +2 and +4 cards' },
                  { key: 'forcePlayDrawnCard', label: 'Must play drawn card if possible' },
                  { key: 'jumpInRules', label: 'Jump-in on exact number/color match' },
                  { key: 'sevenSwap', label: 'Playing 7 swaps hands with another player' }
                ].map((rule) => (
                  <div key={rule.key} className="flex items-center justify-between">
                    <span className="text-white/80">{rule.label}</span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={customSettings[rule.key as keyof typeof customSettings] as boolean}
                        onChange={(e) => handleCustomRuleChange(rule.key, e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-500"></div>
                    </label>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default GameModes;
