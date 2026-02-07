import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StockfishEngineService } from './stockfish-engine.service';
import { BoardMatrix, STARTING_FEN } from '../models/chess.models';

export interface GameState {
  board: (string | null)[][];
  turn: 'white' | 'black';
  history: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ChessGameService {
  private boardSubject = new BehaviorSubject<BoardMatrix>(this.parseFEN(STARTING_FEN));
  private turnSubject = new BehaviorSubject<'white' | 'black'>('white');
  private historySubject = new BehaviorSubject<string[]>([]);
  private stockfishDepth: number = 10; // Stockfish search depth (1-20)

  board$ = this.boardSubject.asObservable();
  turn$ = this.turnSubject.asObservable();
  history$ = this.historySubject.asObservable();

  constructor(private stockfish: StockfishEngineService) {
    this.loadGameState();
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

  makeMove(from: string, to: string): void {
    const board = this.boardSubject.getValue();
    const fromRow = 8 - parseInt(from[1]);
    const fromCol = from.charCodeAt(0) - 97;
    const toRow = 8 - parseInt(to[1]);
    const toCol = to.charCodeAt(0) - 97;
    const piece = board[fromRow][fromCol];
    
    if (piece) {
      const newBoard = board.map(row => [...row]);
      newBoard[fromRow][fromCol] = null;
      newBoard[toRow][toCol] = piece;
      this.boardSubject.next(newBoard);
      
      const moveNotation = `${from}-${to}`;
      const history = this.historySubject.getValue();
      this.historySubject.next([...history, moveNotation]);
      
      this.toggleTurn();
      this.saveGameState();
      
      // Execute AI move after short delay
      setTimeout(() => this.executeAIMoveIfNeeded(), 500);
    }
  }

  getValidMoves(from: string): string[] {
    // Simplified: allow all moves for now
    // In a full implementation, would use chess rules validation
    const board = this.boardSubject.getValue();
    const fromRow = 8 - parseInt(from[1]);
    const fromCol = from.charCodeAt(0) - 97;
    const piece = board[fromRow][fromCol];
    
    if (!piece) return [];
    
    const isWhite = piece === piece.toUpperCase();
    const currentTurn = this.turnSubject.getValue();
    
    // Can only move pieces of current turn color
    if ((isWhite && currentTurn !== 'white') || (!isWhite && currentTurn !== 'black')) {
      return [];
    }

    // Return all empty squares and opponent pieces as valid moves
    const validMoves: string[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const targetPiece = board[row][col];
        if (targetPiece === null || (targetPiece === targetPiece.toUpperCase()) !== isWhite) {
          const targetSquare = String.fromCharCode(97 + col) + (8 - row);
          validMoves.push(targetSquare);
        }
      }
    }

    return validMoves;
  }

  getCurrentPosition(): BoardMatrix {
    return this.boardSubject.getValue();
  }

  private toggleTurn(): void {
    const currentTurn = this.turnSubject.getValue();
    this.turnSubject.next(currentTurn === 'white' ? 'black' : 'white');
  }

  private executeAIMoveIfNeeded(): void {
    const currentTurn = this.turnSubject.getValue();
    if (currentTurn === 'black') {
      const fen = this.boardToFEN(this.boardSubject.getValue());
      
      this.stockfish.getBestMove(fen, this.stockfishDepth).subscribe(move => {
        if (move && move.length >= 4) {
          const from = move.substring(0, 2);
          const to = move.substring(2, 4);
          console.log(`Stockfish AI move: ${from} -> ${to}`);
          this.makeMove(from, to);
        } else {
          console.warn('Stockfish could not find a valid move');
        }
      });
    }
  }

  private boardToFEN(board: (string | null)[][]): string {
    let fen = '';
    for (let row = 0; row < 8; row++) {
      let emptyCount = 0;
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece === null) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            fen += emptyCount.toString();
            emptyCount = 0;
          }
          fen += piece;
        }
      }
      if (emptyCount > 0) {
        fen += emptyCount.toString();
      }
      if (row < 7) {
        fen += '/';
      }
    }
    const turn = this.turnSubject.getValue();
    return `${fen} ${turn === 'white' ? 'w' : 'b'} KQkq - 0 1`;
  }

  private saveGameState(): void {
    const state: GameState = {
      board: this.boardSubject.getValue(),
      turn: this.turnSubject.getValue(),
      history: this.historySubject.getValue()
    };
    sessionStorage.setItem('chessGameState', JSON.stringify(state));
  }

  private loadGameState(): void {
    const saved = sessionStorage.getItem('chessGameState');
    if (saved) {
      const state: GameState = JSON.parse(saved);
      this.boardSubject.next(state.board);
      this.turnSubject.next(state.turn);
      this.historySubject.next(state.history);
    }
  }

  resetGame(): void {
    const initialBoard = this.parseFEN(STARTING_FEN);
    this.boardSubject.next(initialBoard);
    this.turnSubject.next('white');
    this.historySubject.next([]);
    sessionStorage.clear();
    this.stockfish.sendCommand('ucinewgame');
  }

  undoMove(): void {
    const history = this.historySubject.getValue();
    if (history.length >= 2) {
      const newHistory = history.slice(0, -2); // Undo last 2 moves (human + AI)
      this.historySubject.next(newHistory);
      this.resetGame();
      newHistory.forEach(move => {
        const [from, to] = move.split('-');
        this.makeMove(from, to);
      });
    } else if (history.length === 1) {
      this.historySubject.next([]);
      this.resetGame();
    }
  }

  setDifficulty(level: number): void {
    // Map 0-20 level slider directly to Stockfish depth
    this.stockfishDepth = Math.max(1, Math.min(20, level));
    console.log(`Stockfish difficulty set to depth ${this.stockfishDepth}`);
  }
}
