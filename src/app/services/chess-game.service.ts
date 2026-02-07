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
    // Simplified: return all squares for now; implement chess logic if needed
    const moves: string[] = [];
    const board = this.boardSubject.getValue();
    const fromRow = 8 - parseInt(from[1]);
    const fromCol = from.charCodeAt(0) - 97;
    const piece = board[fromRow][fromCol];
    if (!piece) return moves;
    const isWhite = piece === piece.toUpperCase();
    const currentTurn = this.turnSubject.getValue();
    if ((isWhite && currentTurn !== 'white') || (!isWhite && currentTurn !== 'black')) {
      return moves;
    }
    // Basic pawn moves for example
    if (piece.toLowerCase() === 'p') {
      const direction = isWhite ? -1 : 1;
      const newRow = fromRow + direction;
      if (newRow >= 0 && newRow < 8 && !board[newRow][fromCol]) {
        moves.push(String.fromCharCode(97 + fromCol) + (8 - newRow));
      }
    }
    return moves;
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
      const fen = this.boardToFEN(board);
      this.stockfishEngine.getBestMove(fen).then(bestMove => {
        if (bestMove && bestMove.length >= 4) {
          const from = bestMove.substring(0, 2);
          const to = bestMove.substring(2, 4);
          this.makeMove(from, to);
        }
      }).catch(err => console.error('AI move error:', err));
    }
  }

  private boardToFEN(board: (string | null)[][]): string {
    // Simplified FEN generation for starting position; implement full logic if needed
    return 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
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
    const initialBoard = [
      ['r', 'n', 'b', 'q', 'k', 'b', 'n', 'r'],
      ['p', 'p', 'p', 'p', 'p', 'p', 'p', 'p'],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      [null, null, null, null, null, null, null, null],
      ['P', 'P', 'P', 'P', 'P', 'P', 'P', 'P'],
      ['R', 'N', 'B', 'Q', 'K', 'B', 'N', 'R']
    ];
    this.boardSubject.next(initialBoard);
    this.turnSubject.next('white');
    this.historySubject.next([]);
    sessionStorage.clear();
  }

  undoMove(): void {
    const history = this.historySubject.getValue();
    if (history.length >= 2) {
      const newHistory = history.slice(0, -2);
      this.historySubject.next(newHistory);
      // Revert board state by replaying moves (simplified: reset to initial and replay)
      this.resetGame();
      newHistory.forEach(move => {
        const [from, to] = move.split('-');
        this.makeMove(from, to);
      });
    } else if (history.length === 1) {
      // Only one move, undo it
      this.historySubject.next([]);
      this.resetGame();
    }
  }

  setDifficulty(level: number): void {
    this.stockfishEngine.setDifficulty(level);
  }
}

