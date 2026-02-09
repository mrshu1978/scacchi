// Stockfish Web Worker - CDN version for GitHub Pages
importScripts('https://cdn.jsdelivr.net/npm/stockfish@16.0.0/src/stockfish.js');

console.log('[Stockfish Worker] Loaded from external file');

if (typeof Stockfish === 'undefined') {
  throw new Error('Stockfish not loaded from CDN');
}

const engine = Stockfish();

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

console.log('[Stockfish Worker] Engine initialized');
