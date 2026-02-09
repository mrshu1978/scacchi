import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class StockfishEngineService {
  private worker: Worker | null = null;
  private messageSubject = new Subject<string>();

  constructor() {
    this.initializeWorker();
  }

  private initializeWorker(): void {
    try {
      // Get base href from HTML document
      const baseHref = document.querySelector('base')?.getAttribute('href') || '/';

      // Use external worker file (not Blob) to avoid CORS issues with CDN in workers
      const workerPath = `${baseHref}stockfish.worker.js`;

      console.log('[Stockfish] Base href:', baseHref);
      console.log('[Stockfish] Worker path:', workerPath);

      this.worker = new Worker(workerPath);

      this.worker.onmessage = (event: MessageEvent) => {
        console.log('[Stockfish] Message from worker:', event.data);
        this.messageSubject.next(event.data);
      };

      this.worker.onerror = (error: ErrorEvent) => {
        console.error('[Stockfish] Worker error:', error);
        console.error('[Stockfish] Message:', error.message);
        console.error('[Stockfish] Stockfish path was:', stockfishPath);
      };

      console.log('[Stockfish] Worker initialized with URL:', workerUrl);

      // Initialize UCI protocol
      this.sendCommand('uci');
    } catch (error) {
      console.error('[Stockfish] Failed to initialize worker:', error);
      throw error;
    }
  }

  sendCommand(command: string): void {
    if (this.worker) {
      this.worker.postMessage(command);
    } else {
      console.error('Stockfish Worker not initialized');
    }
  }

  getMessages(): Observable<string> {
    return this.messageSubject.asObservable();
  }

  getBestMove(fen: string, depth: number = 10): Observable<string> {
    const moveSubject = new Subject<string>();

    const subscription = this.messageSubject.subscribe((message: string) => {
      if (message.startsWith('bestmove')) {
        const move = message.split(' ')[1];
        moveSubject.next(move);
        moveSubject.complete();
        subscription.unsubscribe();
      }
    });

    this.sendCommand(`position fen ${fen}`);
    this.sendCommand(`go depth ${depth}`);

    return moveSubject.asObservable();
  }

  destroy(): void {
    if (this.worker) {
      this.worker.terminate();
      this.worker = null;
    }
  }
}
