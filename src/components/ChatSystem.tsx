
import React, { useState, useEffect, useRef } from 'react';
import { Send, MessageCircle, X } from 'lucide-react';

interface ChatMessage {
  id: string;
  playerId: string;
  playerName: string;
  message: string;
  timestamp: Date;
  type: 'chat' | 'system';
}

interface ChatSystemProps {
  socket: any;
  roomId: string;
  playerName: string;
  isCollapsed?: boolean;
  onToggle?: () => void;
}

const ChatSystem: React.FC<ChatSystemProps> = ({
  socket,
  roomId,
  playerName,
  isCollapsed = false,
  onToggle
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const handleChatMessage = (message: ChatMessage) => {
      console.log('Received chat message:', message);
      setMessages(prev => [...prev, {
        ...message,
        timestamp: new Date(message.timestamp)
      }]);
    };

    const handleSystemMessage = (message: Omit<ChatMessage, 'playerId' | 'playerName'>) => {
      console.log('Received system message:', message);
      setMessages(prev => [...prev, {
        ...message,
        playerId: 'system',
        playerName: 'System',
        type: 'system',
        timestamp: new Date(message.timestamp)
      }]);
    };

    socket.on('chatMessage', handleChatMessage);
    socket.on('systemMessage', handleSystemMessage);

    return () => {
      socket.off('chatMessage', handleChatMessage);
      socket.off('systemMessage', handleSystemMessage);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!newMessage.trim() || !socket || !roomId) {
      console.log('Cannot send message:', { newMessage: newMessage.trim(), socket: !!socket, roomId });
      return;
    }

    console.log('Sending chat message:', newMessage);
    socket.emit('sendChatMessage', { 
      roomId, 
      message: {
        message: newMessage.trim(),
        timestamp: new Date()
      }
    });
    setNewMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  if (isCollapsed) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 w-80 h-96 bg-white/90 backdrop-blur-md rounded-lg shadow-xl border border-white/20 flex flex-col z-40">
      <div className="p-3 border-b border-gray-200 flex items-center justify-between">
        <h3 className="font-semibold text-gray-800">Game Chat</h3>
        <button
          onClick={onToggle}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={20} />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 text-sm py-4">
            No messages yet. Start chatting!
          </div>
        )}
        {messages.map((msg, index) => (
          <div
            key={msg.id || index}
            className={`p-2 rounded-lg ${
              msg.type === 'system'
                ? 'bg-gray-100 text-gray-600 text-center text-sm'
                : msg.playerId === socket?.id
                ? 'bg-blue-500 text-white ml-8'
                : 'bg-gray-200 text-gray-800 mr-8'
            }`}
          >
            {msg.type === 'chat' && (
              <div className="text-xs opacity-70 mb-1">{msg.playerName}</div>
            )}
            <div className="text-sm">{msg.message}</div>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      
      <div className="p-3 border-t border-gray-200">
        <div className="flex gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type a message..."
            className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={200}
          />
          <button
            onClick={sendMessage}
            disabled={!newMessage.trim()}
            className="px-3 py-2 bg-blue-500 hover:bg-blue-600 disabled:bg-gray-300 text-white rounded-lg transition-colors"
          >
            <Send size={16} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatSystem;
