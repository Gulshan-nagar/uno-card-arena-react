
import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, RefreshCw } from 'lucide-react';

interface ReconnectionHandlerProps {
  socket: any;
  isConnected: boolean;
  onReconnect: () => void;
  playerName: string;
  roomId: string;
}

const ReconnectionHandler: React.FC<ReconnectionHandlerProps> = ({
  socket,
  isConnected,
  onReconnect,
  playerName,
  roomId
}) => {
  const [isReconnecting, setIsReconnecting] = useState(false);
  const [reconnectAttempts, setReconnectAttempts] = useState(0);
  const [showReconnectModal, setShowReconnectModal] = useState(false);
  const [gameStateBeforeDisconnect, setGameStateBeforeDisconnect] = useState<any>(null);

  useEffect(() => {
    if (!socket) return;

    const handleDisconnect = () => {
      console.log('Player disconnected');
      setShowReconnectModal(true);
      setIsReconnecting(true);
    };

    const handleReconnect = () => {
      console.log('Player reconnected');
      setIsReconnecting(false);
      setReconnectAttempts(0);
      setShowReconnectModal(false);
      
      // Attempt to rejoin the game
      if (roomId && playerName) {
        socket.emit('rejoinGame', { roomId, playerName });
      }
    };

    const handleReconnectAttempt = (attemptNumber: number) => {
      setReconnectAttempts(attemptNumber);
    };

    const handleGameStateRestore = (gameState: any) => {
      setGameStateBeforeDisconnect(gameState);
      onReconnect();
    };

    socket.on('disconnect', handleDisconnect);
    socket.on('reconnect', handleReconnect);
    socket.on('reconnect_attempt', handleReconnectAttempt);
    socket.on('gameStateRestore', handleGameStateRestore);

    return () => {
      socket.off('disconnect', handleDisconnect);
      socket.off('reconnect', handleReconnect);
      socket.off('reconnect_attempt', handleReconnectAttempt);
      socket.off('gameStateRestore', handleGameStateRestore);
    };
  }, [socket, roomId, playerName, onReconnect]);

  const handleManualReconnect = () => {
    if (socket) {
      setIsReconnecting(true);
      socket.connect();
    }
  };

  // Connection status indicator
  const ConnectionStatus = () => (
    <div className={`fixed top-4 left-4 z-50 flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium transition-all ${
      isConnected 
        ? 'bg-green-500/20 border border-green-500/30 text-green-700' 
        : 'bg-red-500/20 border border-red-500/30 text-red-700'
    }`}>
      {isConnected ? (
        <Wifi className="w-4 h-4" />
      ) : (
        <WifiOff className="w-4 h-4" />
      )}
      {isConnected ? 'Connected' : 'Disconnected'}
    </div>
  );

  // Reconnection modal
  const ReconnectionModal = () => {
    if (!showReconnectModal) return null;

    return (
      <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 max-w-md w-full text-center">
          <div className="mb-4">
            {isReconnecting ? (
              <RefreshCw className="w-12 h-12 text-blue-500 mx-auto animate-spin" />
            ) : (
              <WifiOff className="w-12 h-12 text-red-500 mx-auto" />
            )}
          </div>
          
          <h3 className="text-xl font-bold text-gray-800 mb-2">
            {isReconnecting ? 'Reconnecting...' : 'Connection Lost'}
          </h3>
          
          <p className="text-gray-600 mb-4">
            {isReconnecting 
              ? `Attempting to reconnect... (${reconnectAttempts}/5)`
              : 'Your connection to the game has been lost.'
            }
          </p>
          
          {gameStateBeforeDisconnect && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
              <p className="text-sm text-blue-800">
                Don't worry! Your game progress has been saved and will be restored when you reconnect.
              </p>
            </div>
          )}
          
          {!isReconnecting && (
            <button
              onClick={handleManualReconnect}
              className="w-full px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg font-medium transition-colors"
            >
              Try Reconnecting
            </button>
          )}
          
          {isReconnecting && (
            <div className="text-sm text-gray-500">
              This may take a few moments...
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <>
      <ConnectionStatus />
      <ReconnectionModal />
    </>
  );
};

export default ReconnectionHandler;
