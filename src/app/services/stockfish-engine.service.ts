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
      // Get base href for asset paths
      const baseHref = document.querySelector('base')?.getAttribute('href') || '/';
      const stockfishDir = `${baseHref}assets/stockfish/`;
      
      // Create inline worker wrapper that loads Stockfish with correct locateFile
      const workerCode = `
        self.importScripts('${stockfishDir}stockfish-17.1-lite-51f59da.js');
        
        // Configure Stockfish to find WASM file
        if (typeof Stockfish !== 'undefined') {
          const engine = Stockfish({
            locateFile: function(file) {
              return '${stockfishDir}' + file;
            }
          });
          
          // Forward messages between Stockfish and main thread
          engine.addMessageListener(function(msg) {
            self.postMessage(msg);
          });
          
          self.onmessage = function(e) {
            engine.postMessage(e.data);
          };
        }
      `;
      
      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);
      
      this.worker = new Worker(workerUrl);
      
      this.worker.onmessage = (event: MessageEvent) => {
        this.messageSubject.next(event.data);
      };

      this.worker.onerror = (error: ErrorEvent) => {
        console.error('Stockfish Worker error:', error);
        console.error('Stockfish directory:', stockfishDir);
      };

      // Initialize UCI protocol
      this.sendCommand('uci');
    } catch (error) {
      console.error('Failed to initialize Stockfish Worker:', error);
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
