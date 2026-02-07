import { Component } from '@angular/core';

@Component({
  selector: 'app-chess-board',
  templateUrl: './chess-board.component.html',
  styleUrls: ['./chess-board.component.css']
})
export class ChessBoardComponent {
  squares = Array.from({length: 64}, (_, i) => ({
    row: Math.floor(i / 8),
    col: i % 8,
    color: (Math.floor(i / 8) + i % 8) % 2 === 0 ? 'light' : 'dark',
    coordinate: String.fromCharCode(97 + i % 8) + (8 - Math.floor(i / 8))
  }));

  files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
  ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
}

