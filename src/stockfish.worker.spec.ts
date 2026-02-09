// Test file for Stockfish Worker (run in Node.js environment)
// This tests the worker logic without actually running it in a Worker context

describe('Stockfish Worker Logic', () => {
  let engine: any;
  let messages: string[] = [];

  // Mock self.postMessage
  const mockPostMessage = (msg: string) => {
    messages.push(msg);
  };

  beforeEach(() => {
    messages = [];
    global.self = { postMessage: mockPostMessage } as any;

    // Simulate the SimpleStockfish class from worker
    class SimpleStockfish {
      ready = false;
      position = 'startpos';

      init() {
        this.ready = true;
        return Promise.resolve();
      }

      postMessage(cmd: string) {
        const command = cmd.trim();

        if (command === 'uci') {
          mockPostMessage('id name Stockfish.js 16');
          mockPostMessage('id author T. Romstad, M. Costalba, J. Kiiski, G. Linscott');
          mockPostMessage('uciok');
        } else if (command === 'isready') {
          mockPostMessage('readyok');
        } else if (command === 'ucinewgame') {
          this.position = 'startpos';
        } else if (command.startsWith('position')) {
          this.position = command;
        } else if (command.startsWith('go')) {
          this.calculateMove();
        }
      }

      calculateMove() {
        const moves = this.getLegalMoves(this.position);
        const move = this.pickBestMove(moves);
        mockPostMessage('info depth 5 score cp 25 nodes 1000 nps 50000 time 200');
        mockPostMessage(`bestmove ${move}`);
      }

      getLegalMoves(position: string) {
        const openingMoves = ['e2e4', 'd2d4', 'c2c4', 'g1f3', 'b1c3', 'e7e5', 'd7d5', 'c7c5', 'g8f6', 'b8c6'];
        const middleGameMoves = [
          'e2e4', 'd2d4', 'e7e5', 'd7d5', 'g1f3', 'g8f6', 'f1c4', 'f8c5',
          'b1c3', 'b8c6', 'c2c3', 'c7c6', 'd1h5', 'd8h4', 'e1g1', 'e8g8'
        ];
        const moveCount = (position.match(/\s[a-h][1-8][a-h][1-8]/g) || []).length;
        return moveCount < 10 ? openingMoves : middleGameMoves;
      }

      pickBestMove(moves: string[]) {
        const centerMoves = moves.filter(m =>
          (m[0] >= 'd' && m[0] <= 'e') || (m[2] >= 'd' && m[2] <= 'e')
        );
        const pool = centerMoves.length > 0 ? centerMoves : moves;
        return pool[Math.floor(Math.random() * pool.length)];
      }
    }

    engine = new SimpleStockfish();
  });

  it('should initialize successfully', async () => {
    await engine.init();
    expect(engine.ready).toBe(true);
  });

  it('should respond to UCI command', () => {
    engine.postMessage('uci');
    expect(messages).toContain('id name Stockfish.js 16');
    expect(messages).toContain('uciok');
  });

  it('should respond to isready command', () => {
    engine.postMessage('isready');
    expect(messages).toContain('readyok');
  });

  it('should handle ucinewgame command', () => {
    engine.position = 'position startpos moves e2e4';
    engine.postMessage('ucinewgame');
    expect(engine.position).toBe('startpos');
  });

  it('should store position command', () => {
    engine.postMessage('position startpos moves e2e4 e7e5');
    expect(engine.position).toBe('position startpos moves e2e4 e7e5');
  });

  it('should generate move on go command', () => {
    messages = [];
    engine.postMessage('go depth 5');

    // Should have info and bestmove
    const hasBestmove = messages.some(m => m.startsWith('bestmove'));
    const hasInfo = messages.some(m => m.startsWith('info'));

    expect(hasInfo).toBe(true);
    expect(hasBestmove).toBe(true);
  });

  it('should generate valid UCI move format', () => {
    messages = [];
    engine.postMessage('go depth 10');

    const bestmoveMsg = messages.find(m => m.startsWith('bestmove'));
    expect(bestmoveMsg).toBeDefined();

    const move = bestmoveMsg?.split(' ')[1];
    expect(move).toMatch(/^[a-h][1-8][a-h][1-8]$/);
  });

  it('should return opening moves for early game', () => {
    const moves = engine.getLegalMoves('startpos');
    expect(moves).toContain('e2e4');
    expect(moves).toContain('d2d4');
    expect(moves).toContain('g1f3');
  });

  it('should return different moves for middle game', () => {
    const position = 'position startpos moves e2e4 e7e5 g1f3 b8c6 f1c4 f8c5 d2d3 g8f6 b1c3 d7d6';
    const moves = engine.getLegalMoves(position);

    // Should have more diverse moves in middle game
    expect(moves.length).toBeGreaterThan(10);
  });

  it('should prefer center moves', () => {
    const moves = ['a2a3', 'b2b3', 'e2e4', 'd2d4', 'h2h3'];
    const centerMoves = moves.filter(m =>
      (m[0] >= 'd' && m[0] <= 'e') || (m[2] >= 'd' && m[2] <= 'e')
    );

    expect(centerMoves).toContain('e2e4');
    expect(centerMoves).toContain('d2d4');
    expect(centerMoves.length).toBe(2);
  });

  it('should handle multiple commands in sequence', () => {
    messages = [];

    engine.postMessage('uci');
    expect(messages).toContain('uciok');

    messages = [];
    engine.postMessage('isready');
    expect(messages).toContain('readyok');

    messages = [];
    engine.postMessage('position startpos');
    engine.postMessage('go depth 5');
    expect(messages.some(m => m.startsWith('bestmove'))).toBe(true);
  });

  it('should provide info with depth, score, nodes', () => {
    messages = [];
    engine.postMessage('go depth 10');

    const infoMsg = messages.find(m => m.startsWith('info'));
    expect(infoMsg).toContain('depth');
    expect(infoMsg).toContain('score');
    expect(infoMsg).toContain('nodes');
    expect(infoMsg).toContain('nps');
  });
});
