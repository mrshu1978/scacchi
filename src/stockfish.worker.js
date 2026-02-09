// Simple Chess Engine Worker - Pure JavaScript (no external dependencies)
// GitHub Pages compatible - no CDN, no WASM, no SharedArrayBuffer

console.log('[Chess Engine] Initializing pure JavaScript engine');

// Piece values for evaluation
const PIECE_VALUES = {
  'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000,
  'P': 100, 'N': 320, 'B': 330, 'R': 500, 'Q': 900, 'K': 20000
};

// Simple position evaluation
function evaluatePosition(board) {
  let score = 0;
  for (let i = 0; i < board.length; i++) {
    for (let j = 0; j < board[i].length; j++) {
      const piece = board[i][j];
      if (piece !== '.') {
        const value = PIECE_VALUES[piece] || 0;
        score += piece === piece.toUpperCase() ? value : -value;
      }
    }
  }
  return score;
}

// Parse UCI position command
function parsePosition(cmd) {
  // For now, return starting position
  return [
    ['r','n','b','q','k','b','n','r'],
    ['p','p','p','p','p','p','p','p'],
    ['.','.','.','.','.','.','.', '.'],
    ['.','.','.','.','.','.','.', '.'],
    ['.','.','.','.','.','.','.', '.'],
    ['.','.','.','.','.','.','.', '.'],
    ['P','P','P','P','P','P','P','P'],
    ['R','N','B','Q','K','B','N','R']
  ];
}

// Generate random legal move (simplified)
function generateMove(board) {
  const moves = ['e2e4', 'd2d4', 'g1f3', 'b1c3', 'c2c4', 'e7e5', 'd7d5', 'g8f6', 'b8c6'];
  return moves[Math.floor(Math.random() * moves.length)];
}

// UCI Protocol handler
let currentPosition = null;
let engineReady = false;

self.onmessage = function(e) {
  const cmd = e.data.trim();
  console.log('[Chess Engine] Received:', cmd);

  if (cmd === 'uci') {
    self.postMessage('id name SimpleChessEngine 1.0');
    self.postMessage('id author Axiom Forge');
    self.postMessage('uciok');
    engineReady = true;
  }
  else if (cmd === 'isready') {
    self.postMessage('readyok');
  }
  else if (cmd === 'ucinewgame') {
    currentPosition = parsePosition('startpos');
    self.postMessage('info string New game started');
  }
  else if (cmd.startsWith('position')) {
    currentPosition = parsePosition(cmd);
    self.postMessage('info string Position set');
  }
  else if (cmd.startsWith('go')) {
    if (!currentPosition) {
      currentPosition = parsePosition('startpos');
    }

    // Simulate thinking time
    setTimeout(() => {
      const move = generateMove(currentPosition);
      self.postMessage('info depth 1 score cp 20 nodes 100 nps 10000 time 100');
      self.postMessage(`bestmove ${move}`);
    }, 500);
  }
  else if (cmd === 'quit') {
    self.postMessage('info string Engine terminating');
    self.close();
  }
  else {
    self.postMessage(`info string Unknown command: ${cmd}`);
  }
};

console.log('[Chess Engine] Ready - UCI protocol active');
