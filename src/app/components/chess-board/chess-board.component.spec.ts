import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ChessBoardComponent } from './chess-board.component';
import { CommonModule } from '@angular/common';

describe('ChessBoardComponent', () => {
  let component: ChessBoardComponent;
  let fixture: ComponentFixture<ChessBoardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ChessBoardComponent, CommonModule]
    }).compileComponents();

    fixture = TestBed.createComponent(ChessBoardComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  it('should initialize board with 64 squares', () => {
    expect(component.board.length).toBe(64);
  });

  it('should have correct starting position', () => {
    // White pieces
    expect(component.board[0].piece).toBe('r'); // a8 - black rook
    expect(component.board[56].piece).toBe('R'); // a1 - white rook
    expect(component.board[60].piece).toBe('K'); // e1 - white king
    expect(component.board[4].piece).toBe('k'); // e8 - black king
  });

  it('should generate correct rank labels', () => {
    expect(component.ranks).toEqual(['8', '7', '6', '5', '4', '3', '2', '1']);
  });

  it('should generate correct file labels', () => {
    expect(component.files).toEqual(['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h']);
  });

  it('should identify white pieces correctly', () => {
    expect(component.isWhitePiece('P')).toBe(true);
    expect(component.isWhitePiece('N')).toBe(true);
    expect(component.isWhitePiece('p')).toBe(false);
    expect(component.isWhitePiece('n')).toBe(false);
  });

  it('should return correct unicode for pieces', () => {
    expect(component.getPieceUnicode('K')).toBe('♔');
    expect(component.getPieceUnicode('Q')).toBe('♕');
    expect(component.getPieceUnicode('R')).toBe('♖');
    expect(component.getPieceUnicode('B')).toBe('♗');
    expect(component.getPieceUnicode('N')).toBe('♘');
    expect(component.getPieceUnicode('P')).toBe('♙');
    expect(component.getPieceUnicode('k')).toBe('♚');
    expect(component.getPieceUnicode('q')).toBe('♛');
    expect(component.getPieceUnicode('r')).toBe('♜');
    expect(component.getPieceUnicode('b')).toBe('♝');
    expect(component.getPieceUnicode('n')).toBe('♞');
    expect(component.getPieceUnicode('p')).toBe('♟');
  });

  it('should have correct square colors', () => {
    // a8 (index 0) should be dark
    expect(component.board[0].color).toBe('dark');
    // b8 (index 1) should be light
    expect(component.board[1].color).toBe('light');
    // a1 (index 56) should be light
    expect(component.board[56].color).toBe('light');
    // h1 (index 63) should be dark
    expect(component.board[63].color).toBe('dark');
  });

  it('should convert index to algebraic notation', () => {
    // Testing internal logic - these would be private methods
    // Just verify board setup is correct based on algebraic positions
    const a8 = component.board[0];
    const h1 = component.board[63];
    const e4 = component.board[28]; // Middle of board

    expect(a8.piece).toBe('r'); // Black rook at a8
    expect(h1.piece).toBe('R'); // White rook at h1
    expect(e4.piece).toBeNull(); // Empty square at e4
  });

  it('should render board in DOM', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const squares = compiled.querySelectorAll('.square');
    expect(squares.length).toBe(64);
  });

  it('should render rank labels', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const rankLabels = compiled.querySelectorAll('.rank-label');
    expect(rankLabels.length).toBe(8);
    expect(rankLabels[0].textContent).toBe('8');
    expect(rankLabels[7].textContent).toBe('1');
  });

  it('should render file labels', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const fileLabels = compiled.querySelectorAll('.file-label');
    expect(fileLabels.length).toBe(8);
    expect(fileLabels[0].textContent).toBe('a');
    expect(fileLabels[7].textContent).toBe('h');
  });

  it('should display Axiom Forge banner', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const banner = compiled.querySelector('.axiom-banner');
    expect(banner).toBeTruthy();
    expect(banner?.textContent).toContain('Axiom Forge');
  });

  it('should apply correct CSS classes to pieces', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const whitePieces = compiled.querySelectorAll('.white-piece');
    const blackPieces = compiled.querySelectorAll('.black-piece');

    // Should have 16 white pieces and 16 black pieces at start
    expect(whitePieces.length).toBe(16);
    expect(blackPieces.length).toBe(16);
  });

  it('should have light and dark squares alternating', () => {
    const compiled = fixture.nativeElement as HTMLElement;
    const lightSquares = compiled.querySelectorAll('.square.light');
    const darkSquares = compiled.querySelectorAll('.square.dark');

    expect(lightSquares.length).toBe(32);
    expect(darkSquares.length).toBe(32);
  });
});
