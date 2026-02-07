import { Injectable } from '@angular/core';
import { BoardMatrix } from '../models/chess.models';

interface Move {
  from: { row: number; col: number };
  to: { row: number; col: number };
  score?: number;
}

@Injectable({
  providedIn: 'root'
})
export class SimpleChessAI {
  private readonly PIECE_VALUES: { [key: string]: number } = {
    'p': 10, 'n': 30, 'b': 30, 'r': 50, 'q': 90, 'k': 900,
    'P': 10, 'N': 30, 'B': 30, 'R': 50, 'Q': 90, 'K': 900
  };

  getBestMove(board: BoardMatrix, color: 'white' | 'black', depth: number = 2): string | null {
    const allMoves = this.getAllValidMoves(board, color);
    if (allMoves.length === 0) return null;

    // Depth 2 minimax search
    let bestMove: Move | null = null;
    let bestScore = color === 'black' ? -Infinity : Infinity;

    for (const move of allMoves) {
      const newBoard = this.makeTestMove(board, move);
      const score = this.minimax(newBoard, depth - 1, color === 'white' ? 'black' : 'white', -Infinity, Infinity, false);
      
      if (color === 'black' && score > bestScore) {
        bestScore = score;
        bestMove = move;
      } else if (color === 'white' && score < bestScore) {
        bestScore = score;
        bestMove = move;
      }
    }

    if (!bestMove) return null;
    return this.moveToNotation(bestMove);
  }

  private minimax(board: BoardMatrix, depth: number, color: 'white' | 'black', alpha: number, beta: number, maximizing: boolean): number {
    if (depth === 0) {
      return this.evaluatePosition(board);
    }

    const moves = this.getAllValidMoves(board, color);
    if (moves.length === 0) return this.evaluatePosition(board);

    if (maximizing) {
      let maxEval = -Infinity;
      for (const move of moves) {
        const newBoard = this.makeTestMove(board, move);
        const evaluation = this.minimax(newBoard, depth - 1, color === 'white' ? 'black' : 'white', alpha, beta, false);
        maxEval = Math.max(maxEval, evaluation);
        alpha = Math.max(alpha, evaluation);
        if (beta <= alpha) break;
      }
      return maxEval;
    } else {
      let minEval = Infinity;
      for (const move of moves) {
        const newBoard = this.makeTestMove(board, move);
        const evaluation = this.minimax(newBoard, depth - 1, color === 'white' ? 'black' : 'white', alpha, beta, true);
        minEval = Math.min(minEval, evaluation);
        beta = Math.min(beta, evaluation);
        if (beta <= alpha) break;
      }
      return minEval;
    }
  }

  private evaluatePosition(board: BoardMatrix): number {
    let score = 0;
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (piece) {
          const value = this.PIECE_VALUES[piece] || 0;
          score += piece === piece.toUpperCase() ? -value : value; // White negative, Black positive
        }
      }
    }
    return score;
  }

  getAllValidMoves(board: BoardMatrix, color: 'white' | 'black'): Move[] {
    const moves: Move[] = [];
    for (let row = 0; row < 8; row++) {
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
        if (!piece) continue;
        const isWhite = piece === piece.toUpperCase();
        if ((color === 'white' && !isWhite) || (color === 'black' && isWhite)) continue;

        const pieceMoves = this.getMovesForPiece(board, row, col, piece);
        moves.push(...pieceMoves);
      }
    }
    return moves;
  }

  private getMovesForPiece(board: BoardMatrix, row: number, col: number, piece: string): Move[] {
    const moves: Move[] = [];
    const isWhite = piece === piece.toUpperCase();
    const type = piece.toLowerCase();

    switch (type) {
      case 'p': // Pawn
        const direction = isWhite ? -1 : 1;
        // Forward move
        if (this.isInBounds(row + direction, col) && !board[row + direction][col]) {
          moves.push({ from: { row, col }, to: { row: row + direction, col } });
          // Double move from starting position
          const startRow = isWhite ? 6 : 1;
          if (row === startRow && !board[row + 2 * direction][col]) {
            moves.push({ from: { row, col }, to: { row: row + 2 * direction, col } });
          }
        }
        // Captures
        for (const dcol of [-1, 1]) {
          const newRow = row + direction;
          const newCol = col + dcol;
          if (this.isInBounds(newRow, newCol) && board[newRow][newCol]) {
            const target = board[newRow][newCol]!;
            const targetIsWhite = target === target.toUpperCase();
            if (isWhite !== targetIsWhite) {
              moves.push({ from: { row, col }, to: { row: newRow, col: newCol } });
            }
          }
        }
        break;

      case 'n': // Knight
        const knightMoves = [
          [-2, -1], [-2, 1], [-1, -2], [-1, 2],
          [1, -2], [1, 2], [2, -1], [2, 1]
        ];
        for (const [dr, dc] of knightMoves) {
          const newRow = row + dr;
          const newCol = col + dc;
          if (this.isInBounds(newRow, newCol)) {
            const target = board[newRow][newCol];
            if (!target || (target === target.toUpperCase()) !== isWhite) {
              moves.push({ from: { row, col }, to: { row: newRow, col: newCol } });
            }
          }
        }
        break;

      case 'b': // Bishop
        this.addSlidingMoves(board, row, col, isWhite, [[1,1], [1,-1], [-1,1], [-1,-1]], moves);
        break;

      case 'r': // Rook
        this.addSlidingMoves(board, row, col, isWhite, [[1,0], [-1,0], [0,1], [0,-1]], moves);
        break;

      case 'q': // Queen
        this.addSlidingMoves(board, row, col, isWhite, [
          [1,0], [-1,0], [0,1], [0,-1],
          [1,1], [1,-1], [-1,1], [-1,-1]
        ], moves);
        break;

      case 'k': // King
        for (let dr = -1; dr <= 1; dr++) {
          for (let dc = -1; dc <= 1; dc++) {
            if (dr === 0 && dc === 0) continue;
            const newRow = row + dr;
            const newCol = col + dc;
            if (this.isInBounds(newRow, newCol)) {
              const target = board[newRow][newCol];
              if (!target || (target === target.toUpperCase()) !== isWhite) {
                moves.push({ from: { row, col }, to: { row: newRow, col: newCol } });
              }
            }
          }
        }
        break;
    }

    return moves;
  }

  private addSlidingMoves(board: BoardMatrix, row: number, col: number, isWhite: boolean, directions: number[][], moves: Move[]): void {
    for (const [dr, dc] of directions) {
      let r = row + dr;
      let c = col + dc;
      while (this.isInBounds(r, c)) {
        const target = board[r][c];
        if (!target) {
          moves.push({ from: { row, col }, to: { row: r, col: c } });
        } else {
          const targetIsWhite = target === target.toUpperCase();
          if (isWhite !== targetIsWhite) {
            moves.push({ from: { row, col }, to: { row: r, col: c } });
          }
          break;
        }
        r += dr;
        c += dc;
      }
    }
  }

  private isInBounds(row: number, col: number): boolean {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
  }

  private makeTestMove(board: BoardMatrix, move: Move): BoardMatrix {
    const newBoard = board.map(row => [...row]);
    const piece = newBoard[move.from.row][move.from.col];
    newBoard[move.from.row][move.from.col] = null;
    newBoard[move.to.row][move.to.col] = piece;
    return newBoard;
  }

  private moveToNotation(move: Move): string {
    const fromCol = String.fromCharCode(97 + move.from.col);
    const fromRow = 8 - move.from.row;
    const toCol = String.fromCharCode(97 + move.to.col);
    const toRow = 8 - move.to.row;
    return `${fromCol}${fromRow}${toCol}${toRow}`;
  }
}
