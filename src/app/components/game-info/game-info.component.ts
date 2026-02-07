import { Component, OnInit } from '@angular/core';
import { ChessGameService } from '../../services/chess-game.service';

@Component({
  selector: 'app-game-info',
  templateUrl: './game-info.component.html',
  styleUrls: ['./game-info.component.css']
})
export class GameInfoComponent implements OnInit {
  currentTurn: 'white' | 'black' = 'white';
  moveHistory: string[] = [];

  constructor(private chessGameService: ChessGameService) {}

  ngOnInit(): void {
    this.chessGameService.turn$.subscribe(turn => {
      this.currentTurn = turn;
    });
    this.chessGameService.history$.subscribe(history => {
      this.moveHistory = history.slice(-5);
    });
  }
}

