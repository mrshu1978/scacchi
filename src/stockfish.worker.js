// Stockfish Web Worker - Using local assets from build
// Import Stockfish from local assets (copied by Angular build from node_modules)
importScripts('./assets/stockfish/stockfish-17.1-lite-51f59da.js');

console.log('[Stockfish Worker] Loaded from local assets');

if (typeof Stockfish === 'undefined') {
  throw new Error('Stockfish not loaded from local assets');
}

// Initialize engine with locateFile for WASM
const engine = Stockfish({
  locateFile: function(file) {
    console.log('[Stockfish Worker] Locating file:', file);
    return './assets/stockfish/' + file;
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

console.log('[Stockfish Worker] Engine initialized');
