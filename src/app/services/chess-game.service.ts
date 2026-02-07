import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

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

  board$ = this.boardSubject.asObservable();

  constructor() {}

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
    const dr = toRow - fromRow;
    const dc = toCol - fromCol;
    switch (piece.toLowerCase()) {
      case 'p': // Pawn
        const direction = piece === 'p' ? 1 : -1;
        if (dc === 0 && dr === direction && !targetPiece) return true;
        if (Math.abs(dc) === 1 && dr === direction && targetPiece) return true;
        return false;
      case 'r': // Rook
        return (dr === 0 || dc === 0) && this.isPathClear(fromRow, fromCol, toRow, toCol);
      case 'n': // Knight
        return (Math.abs(dr) === 2 && Math.abs(dc) === 1) || (Math.abs(dr) === 1 && Math.abs(dc) === 2);
      case 'b': // Bishop
        return Math.abs(dr) === Math.abs(dc) && this.isPathClear(fromRow, fromCol, toRow, toCol);
      case 'q': // Queen
        return ((dr === 0 || dc === 0) || (Math.abs(dr) === Math.abs(dc))) && this.isPathClear(fromRow, fromCol, toRow, toCol);
      case 'k': // King
        return Math.abs(dr) <= 1 && Math.abs(dc) <= 1;
      default:
        return false;
    }
  }

  private isSameColor(piece1: string, piece2: string): boolean {
    return (piece1 === piece1.toUpperCase()) === (piece2 === piece2.toUpperCase());
  }

  private isPathClear(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    const board = this.boardSubject.getValue();
    const dr = Math.sign(toRow - fromRow);
    const dc = Math.sign(toCol - fromCol);
    let r = fromRow + dr;
    let c = fromCol + dc;
    while (r !== toRow || c !== toCol) {
      if (board[r][c] !== null) return false;
      r += dr;
      c += dc;
    }
    return true;
  }
}

