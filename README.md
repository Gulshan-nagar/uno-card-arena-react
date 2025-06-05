
# UNO Game - Full Stack MERN Application

A real-time multiplayer UNO card game built with React, Node.js, Express, and Socket.IO.

## Features

- **Real-time Multiplayer**: Play with 2-4 players in real-time
- **Complete UNO Rules**: All card types, special actions, and game rules implemented
- **Room System**: Create or join game rooms with unique codes
- **Interactive UI**: Smooth animations and responsive design
- **Turn Management**: Proper turn-based gameplay with validation
- **UNO Calling**: Call UNO when you have one card left
- **Wild Card Support**: Choose colors for wild cards with color picker

## Tech Stack

### Frontend
- React 18 with TypeScript
- Socket.IO Client for real-time communication
- Tailwind CSS for styling
- Responsive design for all devices

### Backend
- Node.js with Express
- Socket.IO for real-time multiplayer
- In-memory game state management
- Complete UNO game logic implementation

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. **Install frontend dependencies:**
   ```bash
   npm install
   ```

2. **Install backend dependencies:**
   ```bash
   cd server
   npm install
   ```

### Running the Application

1. **Start the backend server:**
   ```bash
   cd server
   npm start
   ```
   The server will run on http://localhost:5000

2. **Start the frontend development server:**
   ```bash
   npm run dev
   ```
   The frontend will run on http://localhost:8080

### How to Play

1. **Create or Join a Room:**
   - Enter your name
   - Create a new room or join with a room code
   - Wait for 2-4 players to join

2. **Game Rules:**
   - Each player starts with 7 cards
   - Match color, number, or action with the top card
   - Special cards: Skip, Reverse, Draw 2, Wild, Wild Draw 4
   - Call "UNO" when you have one card left
   - First player to play all cards wins!

3. **Controls:**
   - Click a card to play it
   - Click "DRAW" to draw a card when you can't play
   - Click "UNO!" to call UNO when you have one card
   - For wild cards, choose a color from the color picker

## Game Features

### Card Types
- **Number Cards (0-9)**: Match color or number
- **Skip**: Skip the next player's turn
- **Reverse**: Reverse the direction of play
- **Draw 2**: Next player draws 2 cards and loses turn
- **Wild**: Choose any color to continue
- **Wild Draw 4**: Choose color, next player draws 4 cards

### Special Rules
- Draw 2 and Draw 4 cards stack
- Reverse in 2-player game acts as Skip
- Must call UNO when down to one card
- Automatic win detection

## Development

### Project Structure
```
src/
├── components/
│   ├── UnoGame.tsx        # Main game component
│   ├── GameBoard.tsx      # Game board and status
│   ├── PlayerHand.tsx     # Player's hand display
│   ├── UnoCard.tsx        # Individual card component
│   └── GameLobby.tsx      # Room creation/joining
├── types/
│   └── uno.ts             # TypeScript interfaces
└── pages/
    └── Index.tsx          # Main page

server/
├── index.js               # Express server with Socket.IO
└── package.json           # Backend dependencies
```

### Future Enhancements
- MongoDB integration for persistent game state
- Player statistics and leaderboards
- Tournament mode
- Chat system
- Sound effects and animations
- Mobile app version

## Contributing

Feel free to contribute to this project by submitting issues or pull requests!

## License

This project is open source and available under the MIT License.
