
import React, { useState, useEffect } from 'react';
import { User, Trophy, Target, Calendar, Settings, Upload } from 'lucide-react';

interface PlayerStats {
  gamesPlayed: number;
  gamesWon: number;
  winRate: number;
  longestWinStreak: number;
  fastestWin: number; // in minutes
  favoriteColor: string;
  totalPlayTime: number; // in hours
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  unlockedAt?: Date;
  progress?: number;
  maxProgress?: number;
}

interface PlayerProfileProps {
  playerId: string;
  playerName: string;
  avatar?: string;
  isOwn: boolean;
  isOpen: boolean;
  onClose: () => void;
  onUpdateProfile?: (data: { name: string; avatar: string }) => void;
}

const PlayerProfile: React.FC<PlayerProfileProps> = ({
  playerId,
  playerName,
  avatar,
  isOwn,
  isOpen,
  onClose,
  onUpdateProfile
}) => {
  const [stats, setStats] = useState<PlayerStats>({
    gamesPlayed: 0,
    gamesWon: 0,
    winRate: 0,
    longestWinStreak: 0,
    fastestWin: 0,
    favoriteColor: 'blue',
    totalPlayTime: 0
  });
  
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(playerName);
  const [editAvatar, setEditAvatar] = useState(avatar || '');

  const defaultAchievements: Achievement[] = [
    { id: 'first-win', name: 'First Victory', description: 'Win your first game', icon: '🏆' },
    { id: 'speed-demon', name: 'Speed Demon', description: 'Win a game in under 5 minutes', icon: '⚡' },
    { id: 'uno-master', name: 'UNO Master', description: 'Win 10 games', icon: '👑' },
    { id: 'card-shark', name: 'Card Shark', description: 'Win 5 games in a row', icon: '🦈' },
    { id: 'social-player', name: 'Social Player', description: 'Play 50 games', icon: '🎮' },
    { id: 'color-collector', name: 'Color Collector', description: 'Use all wild cards in a single game', icon: '🌈' }
  ];

  useEffect(() => {
    if (isOpen) {
      // Mock data - in real app, fetch from server
      setStats({
        gamesPlayed: 47,
        gamesWon: 23,
        winRate: 49,
        longestWinStreak: 5,
        fastestWin: 3.5,
        favoriteColor: 'red',
        totalPlayTime: 12.5
      });

      setAchievements(defaultAchievements.map(ach => ({
        ...ach,
        unlockedAt: Math.random() > 0.5 ? new Date() : undefined,
        progress: Math.floor(Math.random() * 10),
        maxProgress: 10
      })));
    }
  }, [isOpen]);

  const handleSaveProfile = () => {
    if (onUpdateProfile) {
      onUpdateProfile({ name: editName, avatar: editAvatar });
    }
    setIsEditing(false);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="relative p-6 bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-xl">
          <button
            onClick={onClose}
            className="absolute top-4 right-4 text-white/80 hover:text-white text-xl font-bold"
          >
            ×
          </button>
          
          <div className="flex items-center gap-4">
            <div className="relative">
              <div className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center text-2xl">
                {avatar ? (
                  <img src={avatar} alt="Avatar" className="w-full h-full rounded-full object-cover" />
                ) : (
                  <User className="w-10 h-10" />
                )}
              </div>
              {isOwn && isEditing && (
                <button className="absolute -bottom-1 -right-1 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                  <Upload className="w-3 h-3" />
                </button>
              )}
            </div>
            
            <div className="flex-1">
              {isEditing ? (
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="text-2xl font-bold bg-white/20 rounded px-2 py-1 text-white placeholder-white/60"
                  placeholder="Enter name"
                />
              ) : (
                <h2 className="text-2xl font-bold">{playerName}</h2>
              )}
              <p className="text-white/80">Level {Math.floor(stats.gamesWon / 5) + 1} Player</p>
            </div>
            
            {isOwn && (
              <div className="flex gap-2">
                {isEditing ? (
                  <>
                    <button
                      onClick={handleSaveProfile}
                      className="px-3 py-1 bg-green-500 rounded text-sm font-medium"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-3 py-1 bg-gray-500 rounded text-sm font-medium"
                    >
                      Cancel
                    </button>
                  </>
                ) : (
                  <button
                    onClick={() => setIsEditing(true)}
                    className="p-2 bg-white/20 rounded-full hover:bg-white/30 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Stats */}
        <div className="p-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Target className="w-5 h-5 text-blue-500" />
            Statistics
          </h3>
          
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            <div className="text-center p-3 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{stats.gamesPlayed}</div>
              <div className="text-sm text-blue-800">Games Played</div>
            </div>
            <div className="text-center p-3 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{stats.gamesWon}</div>
              <div className="text-sm text-green-800">Games Won</div>
            </div>
            <div className="text-center p-3 bg-purple-50 rounded-lg">
              <div className="text-2xl font-bold text-purple-600">{stats.winRate}%</div>
              <div className="text-sm text-purple-800">Win Rate</div>
            </div>
            <div className="text-center p-3 bg-orange-50 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">{stats.longestWinStreak}</div>
              <div className="text-sm text-orange-800">Best Streak</div>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6 text-sm">
            <div className="flex justify-between">
              <span className="text-gray-600">Fastest Win:</span>
              <span className="font-medium">{stats.fastestWin}m</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Total Play Time:</span>
              <span className="font-medium">{stats.totalPlayTime}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600">Favorite Color:</span>
              <span className="font-medium capitalize">{stats.favoriteColor}</span>
            </div>
          </div>
        </div>

        {/* Achievements */}
        <div className="px-6 pb-6">
          <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Trophy className="w-5 h-5 text-yellow-500" />
            Achievements
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {achievements.map((achievement) => (
              <div
                key={achievement.id}
                className={`p-3 rounded-lg border-2 transition-all ${
                  achievement.unlockedAt
                    ? 'border-yellow-200 bg-yellow-50'
                    : 'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="text-2xl">{achievement.icon}</div>
                  <div className="flex-1">
                    <div className="font-medium">{achievement.name}</div>
                    <div className="text-sm text-gray-600">{achievement.description}</div>
                    {!achievement.unlockedAt && achievement.progress !== undefined && (
                      <div className="mt-1">
                        <div className="w-full bg-gray-200 rounded-full h-1.5">
                          <div
                            className="bg-blue-500 h-1.5 rounded-full transition-all"
                            style={{ width: `${(achievement.progress / (achievement.maxProgress || 1)) * 100}%` }}
                          ></div>
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {achievement.progress}/{achievement.maxProgress}
                        </div>
                      </div>
                    )}
                  </div>
                  {achievement.unlockedAt && (
                    <div className="text-xs text-yellow-600">
                      <Calendar className="w-3 h-3 inline mr-1" />
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlayerProfile;
