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

      // Build FULL URL (not relative path) for importScripts
      // Workers created from Blob require full http:// or https:// URLs for importScripts
      const origin = window.location.origin;
      const stockfishPath = `${origin}${baseHref}assets/stockfish/`;

      console.log('[Stockfish] Base href:', baseHref);
      console.log('[Stockfish] Stockfish path:', stockfishPath);

      // Create inline worker wrapper that loads Stockfish with correct locateFile
      const workerCode = `
        // Polyfill for SharedArrayBuffer (GitHub Pages compatibility)
        if (typeof SharedArrayBuffer === 'undefined') {
          self.SharedArrayBuffer = ArrayBuffer;
        }

        // Use full URL for importScripts (required for blob workers)
        self.importScripts('${stockfishPath}stockfish-17.1-lite-51f59da.js');

        console.log('[Stockfish Worker] Script loaded successfully');

        if (typeof Stockfish === 'undefined') {
          throw new Error('Stockfish global not found after importScripts');
        }

        const engine = Stockfish({
          locateFile: function(file) {
            console.log('[Stockfish Worker] Locating file:', file);
            return '${stockfishPath}' + file;
          }
        });

        engine.addMessageListener(function(msg) {
          self.postMessage(msg);
        });

        self.onmessage = function(e) {
          if (e.data === 'quit') {
            engine.postMessage('quit');
          } else {
            engine.postMessage(e.data);
          }
        };

        console.log('[Stockfish Worker] Engine initialized successfully');
      `;

      const blob = new Blob([workerCode], { type: 'application/javascript' });
      const workerUrl = URL.createObjectURL(blob);

      this.worker = new Worker(workerUrl);

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
