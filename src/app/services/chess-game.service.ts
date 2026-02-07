import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { StockfishEngineService } from './stockfish-engine.service';

export interface GameState {
  board: (string | null)[][];
  turn: 'white' | 'black';
  history: string[];
}

@Injectable({
  providedIn: 'root'
})
export class ChessGameService {
  private boardSubject = new BehaviorSubject<(string | null)[][]>([
    ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
    ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    [null, null, null, null, null, null, null, null],
    ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
    ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
  ]);
  private turnSubject = new BehaviorSubject<'white' | 'black'>('white');
  private historySubject = new BehaviorSubject<string[]>([]);

  board$ = this.boardSubject.asObservable();
  turn$ = this.turnSubject.asObservable();
  history$ = this.historySubject.asObservable();

  constructor(private stockfishEngine: StockfishEngineService) {
    this.loadGameState();
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
      this.executeAIMoveIfNeeded();
    }
  }

  getValidMoves(from: string): string[] {
    const board = this.boardSubject.getValue();
    const row = 8 - parseInt(from[1]);
    const col = from.charCodeAt(0) - 97;
    const piece = board[row][col];
    if (!piece) return [];
    const moves: string[] = [];
    for (let r = 0; r < 8; r++) {
      for (let c = 0; c < 8; c++) {
        const to = String.fromCharCode(97 + c) + (8 - r);
        if (this.isValidMove(from, to, piece)) {
          moves.push(to);
        }
      }
    }
    return moves;
  }

  private isValidMove(from: string, to: string, piece: string): boolean {
    const fromRow = 8 - parseInt(from[1]);
    const fromCol = from.charCodeAt(0) - 97;
    const toRow = 8 - parseInt(to[1]);
    const toCol = to.charCodeAt(0) - 97;
    const board = this.boardSubject.getValue();
    const targetPiece = board[toRow][toCol];
    if (targetPiece && this.isSameColor(piece, targetPiece)) return false;
    const rowDiff = Math.abs(toRow - fromRow);
    const colDiff = Math.abs(toCol - fromCol);
    switch (piece.toLowerCase()) {
      case 'p':
        const direction = piece === 'p' ? 1 : -1;
        if (colDiff === 0 && targetPiece === null) {
          if (rowDiff === 1) return true;
          if (rowDiff === 2 && ((piece === 'p' && fromRow === 1) || (piece === 'P' && fromRow === 6))) return true;
        } else if (colDiff === 1 && rowDiff === 1 && targetPiece !== null) {
          return true;
        }
        return false;
      case 'r':
        return (rowDiff === 0 || colDiff === 0) && this.isPathClear(fromRow, fromCol, toRow, toCol);
      case 'n':
        return (rowDiff === 2 && colDiff === 1) || (rowDiff === 1 && colDiff === 2);
      case 'b':
        return rowDiff === colDiff && this.isPathClear(fromRow, fromCol, toRow, toCol);
      case 'q':
        return (rowDiff === 0 || colDiff === 0 || rowDiff === colDiff) && this.isPathClear(fromRow, fromCol, toRow, toCol);
      case 'k':
        return rowDiff <= 1 && colDiff <= 1;
      default:
        return false;
    }
  }

  private isSameColor(piece1: string, piece2: string): boolean {
    return (piece1 === piece1.toUpperCase()) === (piece2 === piece2.toUpperCase());
  }

  private isPathClear(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    const board = this.boardSubject.getValue();
    const rowStep = toRow > fromRow ? 1 : toRow < fromRow ? -1 : 0;
    const colStep = toCol > fromCol ? 1 : toCol < fromCol ? -1 : 0;
    let r = fromRow + rowStep;
    let c = fromCol + colStep;
    while (r !== toRow || c !== toCol) {
      if (board[r][c] !== null) return false;
      r += rowStep;
      c += colStep;
    }
    return true;
  }

  private toggleTurn(): void {
    const currentTurn = this.turnSubject.getValue();
    const newTurn = currentTurn === 'white' ? 'black' : 'white';
    this.turnSubject.next(newTurn);
  }

  private async executeAIMoveIfNeeded(): Promise<void> {
    const currentTurn = this.turnSubject.getValue();
    if (currentTurn === 'black') {
      try {
        const fen = this.getCurrentFEN();
        const bestMove = await this.stockfishEngine.getBestMove(fen);
        if (bestMove && bestMove.length >= 4) {
          const from = bestMove.substring(0, 2);
          const to = bestMove.substring(2, 4);
          this.makeMove(from, to);
        }
      } catch (error) {
        console.error('Error executing AI move:', error);
      }
    }
  }

  private getCurrentFEN(): string {
    const board = this.boardSubject.getValue();
    let fen = '';
    for (let r = 0; r < 8; r++) {
      let emptyCount = 0;
      for (let c = 0; c < 8; c++) {
        const piece = board[r][c];
        if (piece === null) {
          emptyCount++;
        } else {
          if (emptyCount > 0) {
            fen += emptyCount;
            emptyCount = 0;
          }
          fen += piece;
        }
      }
      if (emptyCount > 0) {
        fen += emptyCount;
      }
      if (r < 7) fen += '/';
    }
    fen += ' w - - 0 1';
    return fen;
  }

  private saveGameState(): void {
    const gameState: GameState = {
      board: this.boardSubject.getValue(),
      turn: this.turnSubject.getValue(),
      history: this.historySubject.getValue()
    };
    sessionStorage.setItem('chessGame', JSON.stringify(gameState));
  }

  private loadGameState(): void {
    const saved = sessionStorage.getItem('chessGame');
    if (saved) {
      try {
        const gameState: GameState = JSON.parse(saved);
        this.boardSubject.next(gameState.board);
        this.turnSubject.next(gameState.turn);
        this.historySubject.next(gameState.history);
      } catch (error) {
        console.error('Error loading game state:', error);
      }
    }
  }
}

