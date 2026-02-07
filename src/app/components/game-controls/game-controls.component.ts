import { Component, EventEmitter, Output } from '@angular/core';
import { ChessGameService } from '../../services/chess-game.service';

@Component({
  selector: 'app-game-controls',
  templateUrl: './game-controls.component.html',
  styleUrls: ['./game-controls.component.css']
})
export class GameControlsComponent {
  @Output() newGame = new EventEmitter<void>();
  @Output() undoMove = new EventEmitter<void>();
  @Output() difficultyChange = new EventEmitter<number>();

  difficultyOptions = [
    { label: 'Easy', value: 2 },
    { label: 'Medium', value: 10 },
    { label: 'Hard', value: 20 }
  ];
  selectedDifficulty = this.difficultyOptions[1].value; // Default to Medium

  constructor(private chessGameService: ChessGameService) {}

  onNewGame(): void {
    this.chessGameService.resetGame();
    this.newGame.emit();
  }

  onUndoMove(): void {
    this.chessGameService.undoMove();
    this.undoMove.emit();
  }

  onDifficultyChange(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const value = parseInt(select.value, 10);
    this.selectedDifficulty = value;
    this.chessGameService.setDifficulty(value);
    this.difficultyChange.emit(value);
  }
}

