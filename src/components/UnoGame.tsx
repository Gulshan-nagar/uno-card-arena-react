import React, { useState, useEffect } from 'react';
import { io, Socket } from 'socket.io-client';
import GameBoard from './GameBoard';
import PlayerHand from './PlayerHand';
import GameLobby from './GameLobby';
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

    newSocket.on('gameWon', ({ winner }) => {
      alert(`Game won by player: ${winner}`);
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

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-600 via-yellow-500 to-blue-600 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">Connecting to Server...</h1>
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 mb-4">Please make sure the game server is running on port 5000.</p>
          {error && (
            <div className="p-3 bg-red-100 border border-red-400 text-red-700 rounded">
              {error}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!isInGame) {
    return (
      <GameLobby 
        onCreateRoom={createRoom}
        onJoinRoom={joinRoom}
        error={error}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-600 via-purple-600 to-red-600 p-4">
      <div className="max-w-6xl mx-auto">
        {error && (
          <div className="mb-4 p-4 bg-red-500 text-white rounded-lg">
            {error}
          </div>
        )}
        
        {isLoading && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p>Processing...</p>
            </div>
          </div>
        )}
        
        {gameState && (
          <>
            <div className="mb-4 text-center">
              <h1 className="text-4xl font-bold text-white mb-2">UNO Game</h1>
              <p className="text-white">Room: {roomId}</p>
              {!gameState.gameStarted && gameState.players.length >= 2 && (
                <button
                  onClick={startGame}
                  className="mt-4 px-6 py-3 bg-green-500 text-white font-bold rounded-lg hover:bg-green-600 transition-colors"
                >
                  Start Game
                </button>
              )}
            </div>

            {gameState.gameStarted && (
              <>
                <GameBoard 
                  gameState={gameState}
                  onDrawCard={drawCard}
                  onCallUno={callUno}
                  currentPlayerId={socket?.id || ''}
                />
                
                <PlayerHand 
                  cards={playerHand}
                  onPlayCard={playCard}
                  isCurrentPlayer={gameState.players[gameState.currentPlayer]?.id === socket?.id}
                  canPlay={gameState.players[gameState.currentPlayer]?.id === socket?.id}
                />
              </>
            )}

            {!gameState.gameStarted && (
              <div className="text-center text-white">
                <h2 className="text-2xl mb-4">Waiting for players...</h2>
                <div className="bg-white/20 rounded-lg p-4">
                  <h3 className="text-xl mb-2">Players in room:</h3>
                  {gameState.players.map((player, index) => (
                    <div key={player.id} className="mb-1">
                      {player.name} {player.id === socket?.id && '(You)'}
                    </div>
                  ))}
                  <p className="mt-4 text-sm">Need at least 2 players to start</p>
                </div>
              </div>
            )}
          </>
        )}

        {showColorPicker && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-lg">
              <h3 className="text-xl mb-4">Choose a color:</h3>
              <div className="grid grid-cols-2 gap-4">
                <button
                  onClick={() => selectColor('red')}
                  className="w-20 h-20 rounded-lg border-4 border-gray-300 hover:border-gray-500 transition-colors"
                  style={{ backgroundColor: '#EF4444' }}
                >
                  <span className="text-white font-bold">Red</span>
                </button>
                <button
                  onClick={() => selectColor('blue')}
                  className="w-20 h-20 rounded-lg border-4 border-gray-300 hover:border-gray-500 transition-colors"
                  style={{ backgroundColor: '#3B82F6' }}
                >
                  <span className="text-white font-bold">Blue</span>
                </button>
                <button
                  onClick={() => selectColor('green')}
                  className="w-20 h-20 rounded-lg border-4 border-gray-300 hover:border-gray-500 transition-colors"
                  style={{ backgroundColor: '#10B981' }}
                >
                  <span className="text-white font-bold">Green</span>
                </button>
                <button
                  onClick={() => selectColor('yellow')}
                  className="w-20 h-20 rounded-lg border-4 border-gray-300 hover:border-gray-500 transition-colors"
                  style={{ backgroundColor: '#F59E0B' }}
                >
                  <span className="text-white font-bold">Yellow</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default UnoGame;
