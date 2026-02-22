export type GameMode = 'classic' | 'time';
export type GameState = 'menu' | 'playing' | 'gameover';

export interface BlockData {
  id: string;
  value: number;
  isSelected: boolean;
}

export interface GameStats {
  score: number;
  level: number;
  target: number;
  currentSum: number;
  timeLeft?: number;
}
