// Stockfish Web Worker - Using Lichess single-threaded version (GitHub Pages compatible)
// Lichess provides a single-threaded Stockfish that works without SharedArrayBuffer
importScripts('https://lichess1.org/assets/stockfish/stockfish.js');

console.log('[Stockfish Worker] Loaded Lichess single-threaded version');

if (typeof Stockfish === 'undefined') {
  throw new Error('Stockfish not loaded from Lichess');
}

// Initialize engine - Lichess version handles WASM loading automatically
Stockfish().then(function(engine) {
  console.log('[Stockfish Worker] Engine initialized');

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
});

console.log('[Stockfish Worker] Initializing engine...');
