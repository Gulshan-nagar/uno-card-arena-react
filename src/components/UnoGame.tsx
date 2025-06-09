import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import GameBoard from './GameBoard';
import PlayerHand from './PlayerHand';
import GameLobby from './GameLobby';
import Tutorial from './Tutorial';
import WinnerModal from './WinnerModal';
import { Card, GameState, Player } from '../types/uno';

const UnoGame: React.FC = () => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [playerHand, setPlayerHand] = useState<Card[]>([]);
  const [roomId, setRoomId] = useState<string>('');
  const [playerName, setPlayerName] = useState<string>('');
  const [isInGame, setIsInGame] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [showColorPicker, setShowColorPicker] = useState<boolean>(false);
  const [pendingWildCard, setPendingWildCard] = useState<number | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [adminId, setAdminId] = useState<string>('');
  const [winner, setWinner] = useState<string | null>(null);

  useEffect(() => {
    console.log('Attempting to connect to server...');
    const newSocket = io('https://uno-card-arena-react.onrender.com', {
      transports: ['websocket', 'polling'],
      timeout: 10000,
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
    });
    
    setSocket(newSocket);

    newSocket.on('connect', () => {
      console.log('Connected to server:', newSocket.id);
      setIsConnected(true);
      setError('');
    });

    newSocket.on('connect_error', (error) => {
      console.log('Connection error:', error);
      setIsConnected(false);
      setError('Failed to connect to game server. Please make sure the server is running on port 5000.');
    });

    newSocket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Reconnection attempt ${attemptNumber}`);
      setError(`Attempting to reconnect... (${attemptNumber}/5)`);
    });

    newSocket.on('reconnect_failed', () => {
      console.log('Failed to reconnect');
      setError('Failed to reconnect to server. Please refresh the page.');
    });

    newSocket.on('roomCreated', ({ roomId, game }) => {
      console.log('Room created:', roomId);
      setRoomId(roomId);
      setGameState(game);
      setIsInGame(true);
      setError('');
      setAdminId(newSocket.id || ''); // Creator is admin
    });

    newSocket.on('gameUpdate', (game: GameState) => {
      console.log('Game update received:', game);
      setGameState(game);
    });

    newSocket.on('handUpdate', (hand: Card[]) => {
      console.log('Hand update received:', hand);
      setPlayerHand(hand);
    });

    newSocket.on('error', (errorMessage: string) => {
      console.log('Game error:', errorMessage);
      setError(errorMessage);
      setTimeout(() => setError(''), 5000);
    });

    newSocket.on('gameWon', ({ winner, winnerName }) => {
      console.log('Game won by:', winnerName);
      setWinner(winnerName);
    });

    return () => {
      console.log('Cleaning up socket connection');
      newSocket.close();
    };
  }, []);

  const createRoom = async (name: string) => {
    console.log('Creating room for player:', name);
    if (!isConnected) {
      setError('Not connected to server. Please refresh and try again.');
      return;
    }
    setIsLoading(true);
    setPlayerName(name);
    socket?.emit('createRoom', { playerName: name });
    setIsLoading(false);
  };

  const joinRoom = async (roomId: string, name: string) => {
    console.log('Joining room:', roomId, 'with player:', name);
    if (!isConnected) {
      setError('Not connected to server. Please refresh and try again.');
      return;
    }
    setIsLoading(true);
    setPlayerName(name);
    socket?.emit('joinRoom', { roomId, playerName: name });
    setIsInGame(true);
    setIsLoading(false);
  };

  const startGame = async () => {
    if (socket?.id !== adminId) {
      setError('Only the admin can start the game!');
      setTimeout(() => setError(''), 3000);
      return;
    }
    setIsLoading(true);
    socket?.emit('startGame');
    setIsLoading(false);
  };

  const playCard = async (cardIndex: number, chosenColor?: string) => {
    const card = playerHand[cardIndex];
    
    if (card.type === 'wild' && !chosenColor) {
      setPendingWildCard(cardIndex);
      setShowColorPicker(true);
      return;
    }

    setIsLoading(true);
    socket?.emit('playCard', { cardIndex, chosenColor });
    setShowColorPicker(false);
    setPendingWildCard(null);
    setIsLoading(false);
  };

  const drawCard = async () => {
    setIsLoading(true);
    socket?.emit('drawCard');
    setIsLoading(false);
  };

  const callUno = async () => {
    setIsLoading(true);
    socket?.emit('callUno');
    setIsLoading(false);
  };

  const selectColor = (color: string) => {
    if (pendingWildCard !== null) {
      playCard(pendingWildCard, color);
    }
  };

  const closeWinnerModal = () => {
    setWinner(null);
    // Optionally reset game state or return to lobby
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 flex items-center justify-center p-4">
        <div className="bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-8 max-w-md w-full text-center border border-white/20">
          <h1 className="text-2xl font-bold text-white mb-4">Connecting to Server...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
          <p className="text-white/80 mb-4">Please make sure the game server is running on port 5000.</p>
          {error && (
            <div className="p-3 bg-red-500/80 border border-red-400 text-white rounded-lg backdrop-blur-sm">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isInGame) {
    return (
      <>
        <Tutorial />
        <GameLobby 
          onCreateRoom={createRoom}
          onJoinRoom={joinRoom}
          error={error}
        />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 via-indigo-900 to-purple-900 p-4 relative overflow-hidden">
      {/* Background decorative elements */}
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-10 left-10 w-20 h-20 bg-yellow-400/20 rounded-full blur-xl animate-pulse"></div>
        <div className="absolute top-1/3 right-20 w-32 h-32 bg-red-400/20 rounded-full blur-xl animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-green-400/20 rounded-full blur-xl animate-pulse delay-2000"></div>
        <div className="absolute bottom-1/3 right-1/3 w-16 h-16 bg-blue-400/20 rounded-full blur-xl animate-pulse delay-3000"></div>
      </div>

      <Tutorial />
      
      <div className="max-w-6xl mx-auto relative z-10">
        {error && (
          <div className="mb-4 p-4 bg-red-500/80 text-white rounded-lg backdrop-blur-sm border border-red-400 font-semibold">
            {error}
          </div>
        )}
        
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl text-center border border-white/20">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-yellow-400 mx-auto mb-4"></div>
              <p className="text-white font-semibold">Processing...</p>
            </div>
          </div>
        )}
        
        {gameState && (
          <>
            <div className="mb-4 text-center">
              <h1 className="text-5xl font-bold text-white mb-2 drop-shadow-lg">🎮 UNO Arena 🎮</h1>
              <p className="text-white/80 text-lg">Room: <span className="font-mono bg-white/20 px-2 py-1 rounded">{roomId}</span></p>
              {!gameState.gameStarted && gameState.players.length >= 2 && socket?.id === adminId && (
                <button
                  onClick={startGame}
                  className="mt-4 px-8 py-4 bg-gradient-to-r from-green-500 to-green-600 text-white font-bold rounded-xl hover:from-green-600 hover:to-green-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:scale-105"
                >
                  🚀 Start Game
                </button>
              )}
              {!gameState.gameStarted && gameState.players.length >= 2 && socket?.id !== adminId && (
                <p className="mt-4 text-yellow-300 font-semibold">Waiting for admin to start the game...</p>
              )}
            </div>

            {gameState.gameStarted && (
              <>
                <GameBoard 
                  gameState={gameState}
                  onDrawCard={drawCard}
                  onCallUno={callUno}
                  currentPlayerId={socket?.id || ''}
                  adminId={adminId}
                />
                
                <PlayerHand 
                  cards={playerHand}
                  onPlayCard={playCard}
                  isCurrentPlayer={gameState.players[gameState.currentPlayer]?.id === socket?.id}
                  canPlay={gameState.players[gameState.currentPlayer]?.id === socket?.id}
                  gameState={gameState}
                  topCard={gameState.topCard}
                />
              </>
            )}

            {!gameState.gameStarted && (
              <div className="text-center text-white">
                <h2 className="text-3xl mb-6 font-bold">🎯 Waiting for players...</h2>
                <div className="bg-white/10 backdrop-blur-md rounded-xl p-6 border border-white/20">
                  <h3 className="text-xl mb-4 font-semibold">Players in room:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {gameState.players.map((player, index) => (
                      <div key={player.id} className="bg-white/10 rounded-lg p-3 flex items-center justify-between">
                        <span className="font-semibold">{player.name}</span>
                        <div className="flex gap-2">
                          {player.id === adminId && (
                            <span className="bg-yellow-500 text-black px-2 py-1 rounded-full text-xs font-bold">ADMIN</span>
                          )}
                          {player.id === socket?.id && (
                            <span className="text-yellow-300 font-bold">(You)</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                  <p className="mt-4 text-white/70">Need at least 2 players to start • Maximum 4 players</p>
                </div>
              </div>
            )}
          </>
        )}

        {/* Color Picker Modal */}
        {showColorPicker && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20">
              <h3 className="text-xl mb-4 text-white font-bold text-center">Choose a color:</h3>
              <div className="grid grid-cols-2 gap-4">
                {[
                  { color: 'red', bg: '#EF4444', name: 'Red' },
                  { color: 'blue', bg: '#3B82F6', name: 'Blue' },
                  { color: 'green', bg: '#10B981', name: 'Green' },
                  { color: 'yellow', bg: '#F59E0B', name: 'Yellow' }
                ].map(({ color, bg, name }) => (
                  <button
                    key={color}
                    onClick={() => selectColor(color)}
                    className="w-24 h-24 rounded-xl border-4 border-white/30 hover:border-white hover:scale-110 transition-all duration-200 shadow-lg font-bold text-white"
                    style={{ backgroundColor: bg }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Winner Modal */}
        {winner && (
          <WinnerModal 
            winnerName={winner}
            onClose={closeWinnerModal}
          />
        )}
      </div>
    </div>
  );
};

export default UnoGame;
