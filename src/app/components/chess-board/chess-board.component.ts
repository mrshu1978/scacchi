import { Component, OnInit } from '@angular/core';
import { ChessGameService } from '../../services/chess-game.service';
import { pieceToUnicode } from '../../utils/piece-renderer';

@Component({
  selector: 'app-chess-board',
  templateUrl: './chess-board.component.html',
  styleUrls: ['./chess-board.component.css']
})
export class ChessBoardComponent implements OnInit {
  squares = Array.from({length: 64}, (_, i) => ({
    row: Math.floor(i / 8),
    col: i % 8,
    color: (Math.floor(i / 8) + i % 8) % 2 === 0 ? 'light' : 'dark',
    coordinate: String.fromCharCode(97 + i % 8) + (8 - Math.floor(i / 8)),
    piece: null as string | null
  }));

  files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];

  constructor(private chessGameService: ChessGameService) {}

  ngOnInit(): void {
    this.chessGameService.board$.subscribe(board => {
      if (board) {
        this.updateSquares(board);
      }
    });
  }

  private updateSquares(board: (string | null)[][]): void {
    for (let i = 0; i < 64; i++) {
      const row = Math.floor(i / 8);
      const col = i % 8;
      this.squares[i].piece = board[row][col];
    }
  }

  getPieceUnicode(piece: string | null): string {
    if (!piece) return '';
    return pieceToUnicode[piece] || '';
  }

  isWhitePiece(piece: string | null): boolean {
    return piece ? piece === piece.toUpperCase() : false;
  }
}

