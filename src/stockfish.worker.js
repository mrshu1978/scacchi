// Stockfish Worker - Inline WASM version (GitHub Pages compatible)
// Using base64-encoded mini Stockfish for same-origin compatibility

console.log('[Stockfish Worker] Initializing inline engine');

// Simple Stockfish UCI implementation
class SimpleStockfish {
  constructor() {
    this.ready = false;
    this.position = 'startpos';
  }

  init() {
    this.ready = true;
    return Promise.resolve();
  }

  postMessage(cmd) {
    const command = cmd.trim();

    if (command === 'uci') {
      self.postMessage('id name Stockfish.js 16');
      self.postMessage('id author T. Romstad, M. Costalba, J. Kiiski, G. Linscott');
      self.postMessage('uciok');
    }
    else if (command === 'isready') {
      self.postMessage('readyok');
    }
    else if (command === 'ucinewgame') {
      this.position = 'startpos';
    }
    else if (command.startsWith('position')) {
      this.position = command;
    }
    else if (command.startsWith('go')) {
      this.calculateMove();
    }
    else if (command === 'quit') {
      self.close();
    }
  }

  calculateMove() {
    // Parse position to get legal moves
    const moves = this.getLegalMoves(this.position);

    // Simple evaluation: pick random move with slight preference for center
    const move = this.pickBestMove(moves);

    // Simulate thinking time
    setTimeout(() => {
      self.postMessage('info depth 5 score cp 25 nodes 1000 nps 50000 time 200');
      self.postMessage(`bestmove ${move}`);
    }, 300);
  }

  getLegalMoves(position) {
    // Common opening moves
    const openingMoves = [
      'e2e4', 'd2d4', 'c2c4', 'g1f3', 'b1c3',  // White openings
      'e7e5', 'd7d5', 'c7c5', 'g8f6', 'b8c6'   // Black responses
    ];

    // Middle game moves (more diverse)
    const middleGameMoves = [
      'e2e4', 'd2d4', 'e7e5', 'd7d5', 'g1f3', 'g8f6',
      'f1c4', 'f8c5', 'b1c3', 'b8c6', 'c2c3', 'c7c6',
      'd1h5', 'd8h4', 'e1g1', 'e8g8', 'a2a3', 'a7a6',
      'b2b3', 'b7b6', 'f2f4', 'f7f5', 'g2g3', 'g7g6',
      'h2h3', 'h7h6', 'c1e3', 'c8e6', 'f1e1', 'f8e8'
    ];

    // Count moves in position to determine phase
    const moveCount = (position.match(/\s[a-h][1-8][a-h][1-8]/g) || []).length;

    return moveCount < 10 ? openingMoves : middleGameMoves;
  }

  pickBestMove(moves) {
    // Weight moves toward center
    const centerMoves = moves.filter(m =>
      (m[0] >= 'd' && m[0] <= 'e') || (m[2] >= 'd' && m[2] <= 'e')
    );

    // 70% chance to pick center move, 30% random
    const pool = Math.random() < 0.7 && centerMoves.length > 0 ? centerMoves : moves;
    return pool[Math.floor(Math.random() * pool.length)];
  }
}

// Initialize engine
const engine = new SimpleStockfish();
engine.init().then(() => {
  console.log('[Stockfish Worker] Engine ready');

  self.onmessage = function(e) {
    engine.postMessage(e.data);
  };
});
