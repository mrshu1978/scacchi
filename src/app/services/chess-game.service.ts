import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { SimpleChessAI } from './simple-chess-ai.service';
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
  private aiDifficulty: number = 2; // depth for minimax (1=easy, 2=medium, 3=hard)

  board$ = this.boardSubject.asObservable();
  turn$ = this.turnSubject.asObservable();
  history$ = this.historySubject.asObservable();

  constructor(private simpleAI: SimpleChessAI) {
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
    
    if (piece && this.isValidMove(from, to, piece)) {
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

    // Use SimpleChessAI to get all valid moves for this piece
    const allMoves = this.simpleAI.getAllValidMoves(board, currentTurn);
    const pieceMoves = allMoves.filter(move => 
      move.from.row === fromRow && move.from.col === fromCol
    );

    return pieceMoves.map(move => {
      const col = String.fromCharCode(97 + move.to.col);
      const row = 8 - move.to.row;
      return `${col}${row}`;
    });
  }

  getCurrentPosition(): BoardMatrix {
    return this.boardSubject.getValue();
  }

  private isValidMove(from: string, to: string, piece: string): boolean {
    const validMoves = this.getValidMoves(from);
    return validMoves.includes(to);
  }

  private toggleTurn(): void {
    const currentTurn = this.turnSubject.getValue();
    this.turnSubject.next(currentTurn === 'white' ? 'black' : 'white');
  }

  private executeAIMoveIfNeeded(): void {
    const currentTurn = this.turnSubject.getValue();
    if (currentTurn === 'black') {
      const board = this.boardSubject.getValue();
      const bestMove = this.simpleAI.getBestMove(board, 'black', this.aiDifficulty);
      
      if (bestMove && bestMove.length >= 4) {
        const from = bestMove.substring(0, 2);
        const to = bestMove.substring(2, 4);
        console.log(`AI move: ${from} -> ${to}`);
        this.makeMove(from, to);
      } else {
        console.warn('AI could not find a valid move');
      }
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
    // Map 0-20 Stockfish levels to 1-3 minimax depth
    if (level <= 5) {
      this.aiDifficulty = 1; // Easy
    } else if (level <= 15) {
      this.aiDifficulty = 2; // Medium
    } else {
      this.aiDifficulty = 3; // Hard
    }
    console.log(`AI difficulty set to depth ${this.aiDifficulty} (level ${level})`);
  }
}
