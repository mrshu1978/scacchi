import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { BoardMatrix, STARTING_FEN } from '../models/chess.models';

@Injectable({
  providedIn: 'root'
})
export class ChessGameService {
  private boardState = new BehaviorSubject<BoardMatrix>(this.parseFEN(STARTING_FEN));
  boardState$ = this.boardState.asObservable();

  constructor() {
    this.initializeGame();
  }

  private initializeGame(): void {
    const initialBoard = this.parseFEN(STARTING_FEN);
    this.boardState.next(initialBoard);
  }

  parseFEN(fen: string): BoardMatrix {
    const boardPart = fen.split(' ')[0];
    const rows = boardPart.split('/');
    const board: BoardMatrix = [];

    for (let i = 0; i < 8; i++) {
      const row: (string | null)[] = [];
      const fenRow = rows[i];
      let colIndex = 0;

      for (const char of fenRow) {
        if (/\d/.test(char)) {
          const emptyCount = parseInt(char, 10);
          for (let j = 0; j < emptyCount; j++) {
            row.push(null);
            colIndex++;
          }
        } else {
          row.push(char);
          colIndex++;
        }
      }
      board.push(row);
    }

    return board;
  }

  getCurrentPosition(): BoardMatrix {
    return this.boardState.getValue();
  }
}
