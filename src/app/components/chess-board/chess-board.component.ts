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
    piece: null as string | null,
    validMove: false
  }));

  files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
  selectedSquare: string | null = null;
  validMoves: string[] = [];

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
      this.squares[i].validMove = false;
    }
    this.highlightValidMoves();
  }

  getPieceUnicode(piece: string | null): string {
    if (!piece) return '';
    return pieceToUnicode[piece] || '';
  }

  isWhitePiece(piece: string | null): boolean {
    return piece ? piece === piece.toUpperCase() : false;
  }

  onDragStart(event: DragEvent, square: any): void {
    if (!square.piece) {
      event.preventDefault();
      return;
    }
    event.dataTransfer?.setData('text/plain', square.coordinate);
    this.selectedSquare = square.coordinate;
    this.validMoves = this.chessGameService.getValidMoves(square.coordinate);
    this.highlightValidMoves();
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
  }

  onDrop(event: DragEvent, targetSquare: any): void {
    event.preventDefault();
    const sourceCoordinate = event.dataTransfer?.getData('text/plain');
    if (!sourceCoordinate || !this.validMoves.includes(targetSquare.coordinate)) {
      return;
    }
    this.chessGameService.makeMove(sourceCoordinate, targetSquare.coordinate);
    this.selectedSquare = null;
    this.validMoves = [];
    this.highlightValidMoves();
  }

  private highlightValidMoves(): void {
    this.squares.forEach(square => {
      square.validMove = this.validMoves.includes(square.coordinate);
    });
  }
}

