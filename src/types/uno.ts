
export interface Card {
  color?: 'red' | 'blue' | 'green' | 'yellow';
  type: 'number' | 'action' | 'wild';
  value: number | string;
  chosenColor?: string;
}

export interface Player {
  id: string;
  name: string;
  handCount: number;
  hasCalledUno: boolean;
}

export interface GameState {
  roomId: string;
  players: Player[];
  currentPlayer: number;
  topCard: Card;
  gameStarted: boolean;
  winner: string | null;
  drawCount: number;
}
