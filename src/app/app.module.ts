import { NgModule } from '@angular/core';
import { BrowserModule } from '@angular/platform-browser';
import { AppComponent } from './app.component';
import { ChessBoardComponent } from './components/chess-board/chess-board.component';
import { GameInfoComponent } from './components/game-info/game-info.component';
import { GameControlsComponent } from './components/game-controls/game-controls.component';

@NgModule({
  declarations: [
    AppComponent,
    ChessBoardComponent,
    GameInfoComponent,
    GameControlsComponent
  ],
  imports: [
    BrowserModule
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }

