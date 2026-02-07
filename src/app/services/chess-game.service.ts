import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { Piece, BoardMatrix, STARTING_FEN } from '../models/chess.models';
import { StockfishEngineService } from './stockfish-engine.service';

export interface GameState {
  board: BoardMatrix;
  currentPlayer: 'white' | 'black';
  isGameOver: boolean;
  winner: 'white' | 'black' | 'draw' | null;
  fen: string;
}

@Injectable({
  providedIn: 'root'
})
export class ChessGameService {
  private gameStateSubject = new BehaviorSubject<GameState>(this.getInitialState());
  public gameState$: Observable<GameState> = this.gameStateSubject.asObservable();

  constructor(private stockfishEngine: StockfishEngineService) {}

  private getInitialState(): GameState {
    return {
      board: this.parseFEN(STARTING_FEN),
      currentPlayer: 'white',
      isGameOver: false,
      winner: null,
      fen: STARTING_FEN
    };
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

  newGame(): void {
    this.gameStateSubject.next(this.getInitialState());
    this.stockfishEngine.sendCommand('ucinewgame');
  }

  movePiece(fromRow: number, fromCol: number, toRow: number, toCol: number): boolean {
    const currentState = this.gameStateSubject.value;

    if (currentState.isGameOver) {
      return false;
    }

    const piece = currentState.board[fromRow][fromCol];
    if (!piece) {
      return false;
    }

    const pieceColor = piece === piece.toLowerCase() ? 'black' : 'white';
    if (pieceColor !== currentState.currentPlayer) {
      return false;
    }

    // Update board
    const newBoard = currentState.board.map(row => [...row]);
    newBoard[toRow][toCol] = newBoard[fromRow][fromCol];
    newBoard[fromRow][fromCol] = null;

    // Generate new FEN (simplified - doesn't handle castling/en passant flags)
    const newFEN = this.boardToFEN(newBoard, currentState.currentPlayer === 'white' ? 'black' : 'white');

    // Check for game over (simplified - just checks if kings are present)
    const hasWhiteKing = newBoard.flat().some(p => p === 'K');
    const hasBlackKing = newBoard.flat().some(p => p === 'k');
    const isGameOver = !hasWhiteKing || !hasBlackKing;
    const winner = !hasWhiteKing ? 'black' : !hasBlackKing ? 'white' : null;

    this.gameStateSubject.next({
      board: newBoard,
      currentPlayer: currentState.currentPlayer === 'white' ? 'black' : 'white',
      isGameOver,
      winner,
      fen: newFEN
    });

    // If it's AI's turn, request move from Stockfish
    if (!isGameOver && this.gameStateSubject.value.currentPlayer === 'black') {
      this.requestAIMove();
    }

    return true;
  }

  private requestAIMove(): void {
    const currentState = this.gameStateSubject.value;
    
    this.stockfishEngine.getBestMove(currentState.fen, 10).subscribe(move => {
      if (move && move.length >= 4) {
        const fromCol = move.charCodeAt(0) - 97; // 'a' = 0
        const fromRow = 8 - parseInt(move[1]);
        const toCol = move.charCodeAt(2) - 97;
        const toRow = 8 - parseInt(move[3]);

        setTimeout(() => {
          this.movePiece(fromRow, fromCol, toRow, toCol);
        }, 500);
      }
    });
  }

  private boardToFEN(board: BoardMatrix, nextPlayer: 'white' | 'black'): string {
    let fen = '';

    for (let row = 0; row < 8; row++) {
      let emptyCount = 0;
      for (let col = 0; col < 8; col++) {
        const piece = board[row][col];
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
      if (row < 7) {
        fen += '/';
      }
    }

    fen += ` ${nextPlayer === 'white' ? 'w' : 'b'} KQkq - 0 1`;
    return fen;
  }

  getGameState(): GameState {
    return this.gameStateSubject.value;
  }
}
