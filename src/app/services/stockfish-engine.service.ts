import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class StockfishEngineService {
  private worker: Worker | null = null;
  private skillLevel: number = 5;
  private isInitialized: boolean = false;
  private resolveInit: (() => void) | null = null;
  private resolveBestMove: ((move: string) => void) | null = null;

  constructor() {
    this.initializeEngine();
  }

  private initializeEngine(): void {
    if (typeof Worker !== 'undefined') {
      this.worker = new Worker('https://cdn.jsdelivr.net/npm/stockfish.js/stockfish.js');
      this.worker.onmessage = (event) => this.handleMessage(event);
      this.worker.postMessage('uci');
    } else {
      console.error('Web Workers are not supported in this environment.');
    }
  }

  private handleMessage(event: MessageEvent): void {
    const message = event.data;
    if (message.includes('uciok')) {
      this.isInitialized = true;
      this.setSkillLevel(this.skillLevel);
      if (this.resolveInit) {
        this.resolveInit();
        this.resolveInit = null;
      }
    } else if (message.includes('bestmove')) {
      const parts = message.split(' ');
      const bestMove = parts[1];
      if (this.resolveBestMove) {
        this.resolveBestMove(bestMove);
        this.resolveBestMove = null;
      }
    }
  }

  private setSkillLevel(level: number): void {
    if (this.worker && this.isInitialized) {
      this.worker.postMessage(`setoption name Skill Level value ${level}`);
    }
  }

  public setDifficulty(level: number): void {
    if (level >= 0 && level <= 20) {
      this.skillLevel = level;
      this.setSkillLevel(level);
    } else {
      console.warn('Skill level must be between 0 and 20. Defaulting to 5.');
      this.skillLevel = 5;
      this.setSkillLevel(5);
    }
  }

  public getBestMove(fen: string): Promise<string> {
    return new Promise((resolve, reject) => {
      if (!this.worker) {
        reject(new Error('Stockfish engine not available.'));
        return;
      }

      const waitForInit = () => {
        if (this.isInitialized) {
          this.resolveBestMove = resolve;
          this.worker!.postMessage(`position fen ${fen}`);
          this.worker!.postMessage('go movetime 1000');
        } else {
          setTimeout(waitForInit, 100);
        }
      };

      waitForInit();
    });
  }
}

