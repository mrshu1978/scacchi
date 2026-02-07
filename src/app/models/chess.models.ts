export interface Piece {
  type: string; // 'K', 'Q', 'R', 'B', 'N', 'P' for white; lowercase for black
  color: 'white' | 'black';
  position: { row: number; col: number };
}

export type BoardMatrix = (string | null)[][]; // 8x8 array, null for empty squares

export const STARTING_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
