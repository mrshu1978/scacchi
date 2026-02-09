import { TestBed } from '@angular/core/testing';
import { StockfishEngineService } from './stockfish-engine.service';

describe('StockfishEngineService', () => {
  let service: StockfishEngineService;
  let mockWorker: any;

  beforeEach(() => {
    // Mock Worker
    mockWorker = {
      postMessage: jasmine.createSpy('postMessage'),
      terminate: jasmine.createSpy('terminate'),
      onmessage: null,
      onerror: null
    };

    spyOn(window as any, 'Worker').and.returnValue(mockWorker);

    TestBed.configureTestingModule({});
    service = TestBed.inject(StockfishEngineService);
  });

  afterEach(() => {
    service.destroy();
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize worker with correct path', () => {
    expect((window as any).Worker).toHaveBeenCalledWith('/stockfish.worker.js');
  });

  it('should send UCI command on initialization', (done) => {
    setTimeout(() => {
      expect(mockWorker.postMessage).toHaveBeenCalledWith('uci');
      done();
    }, 100);
  });

  it('should handle UCI response', (done) => {
    service.getMessages().subscribe((message) => {
      if (message === 'uciok') {
        expect(message).toBe('uciok');
        done();
      }
    });

    // Simulate worker response
    mockWorker.onmessage({ data: 'uciok' });
  });

  it('should send isready command', () => {
    mockWorker.postMessage.calls.reset();
    service.sendCommand('isready');
    expect(mockWorker.postMessage).toHaveBeenCalledWith('isready');
  });

  it('should handle position command', () => {
    mockWorker.postMessage.calls.reset();
    service.sendCommand('position startpos');
    expect(mockWorker.postMessage).toHaveBeenCalledWith('position startpos');
  });

  it('should request best move', (done) => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    service.getBestMove(fen, 5).subscribe((move) => {
      expect(move).toMatch(/^[a-h][1-8][a-h][1-8]$/); // UCI move format
      done();
    });

    // Simulate worker response
    setTimeout(() => {
      mockWorker.onmessage({ data: 'bestmove e2e4' });
    }, 100);
  });

  it('should parse bestmove response correctly', (done) => {
    const fen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';

    service.getBestMove(fen, 10).subscribe((move) => {
      expect(move).toBe('d2d4');
      done();
    });

    // Simulate bestmove response
    setTimeout(() => {
      mockWorker.onmessage({ data: 'bestmove d2d4 ponder d7d5' });
    }, 100);
  });

  it('should handle worker error', (done) => {
    spyOn(console, 'error');

    const errorEvent = new ErrorEvent('error', {
      message: 'Worker failed',
      filename: '/stockfish.worker.js',
      lineno: 1
    });

    mockWorker.onerror(errorEvent);

    setTimeout(() => {
      expect(console.error).toHaveBeenCalled();
      done();
    }, 100);
  });

  it('should terminate worker on destroy', () => {
    service.destroy();
    expect(mockWorker.terminate).toHaveBeenCalled();
  });

  it('should not send commands after destroy', () => {
    service.destroy();
    mockWorker.postMessage.calls.reset();

    spyOn(console, 'error');
    service.sendCommand('go depth 10');

    expect(mockWorker.postMessage).not.toHaveBeenCalled();
    expect(console.error).toHaveBeenCalledWith('Stockfish Worker not initialized');
  });
});
