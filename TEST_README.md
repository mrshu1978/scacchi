# Test Suite per Applicazione Scacchi

## Panoramica

Suite completa di test automatici per l'applicazione scacchi Angular con motore chess custom.

## Test Implementati

### 1. **StockfishEngineService Tests** (`stockfish-engine.service.spec.ts`)
Test del servizio che gestisce il motore chess tramite Web Worker.

**Copertura:**
- ✅ Inizializzazione Worker con path corretto
- ✅ Comunicazione UCI protocol (uci, isready, position, go)
- ✅ Parsing risposte bestmove
- ✅ Gestione errori Worker
- ✅ Cleanup risorse (terminate)
- ✅ Validazione comandi UCI

**Scenari testati:**
- Invio comando UCI → ricevi `uciok`
- Richiesta best move → ricevi mossa formato UCI (`e2e4`)
- Worker error → gestione corretta
- Destroy service → worker terminato

### 2. **ChessBoardComponent Tests** (`chess-board.component.spec.ts`)
Test del componente scacchiera visuale.

**Copertura:**
- ✅ Creazione componente
- ✅ Inizializzazione board 8×8 (64 caselle)
- ✅ Posizione iniziale corretta (pezzi al posto giusto)
- ✅ Etichette coordinate (a-h, 1-8)
- ✅ Colori caselle alternati (light/dark)
- ✅ Unicode pezzi (♔♕♖♗♘♙ / ♚♛♜♝♞♟)
- ✅ Rendering DOM (64 squares, 8 rank labels, 8 file labels)
- ✅ Banner "Axiom Forge"
- ✅ CSS classes corrette (white-piece, black-piece)

**Scenari testati:**
- Board iniziale: 16 pezzi bianchi + 16 neri
- Posizioni specifiche: Re bianco e1, Re nero e8, Torri a1/h1/a8/h8
- Alternanza colori: 32 caselle chiare + 32 scure
- Unicode rendering: K→♔, k→♚, Q→♕, q→♛, etc.

### 3. **Stockfish Worker Logic Tests** (`stockfish.worker.spec.ts`)
Test della logica del motore chess (eseguiti in ambiente Node.js).

**Copertura:**
- ✅ Inizializzazione motore
- ✅ Risposte UCI protocol complete
- ✅ Generazione mosse legali
- ✅ Preferenza per mosse centrali (d4, e4)
- ✅ Differenza apertura vs medio gioco
- ✅ Formato UCI valido (`[a-h][1-8][a-h][1-8]`)
- ✅ Sequenze comandi multiple
- ✅ Output info (depth, score, nodes, nps)

**Scenari testati:**
- Aperture: e2e4, d2d4, Nf3, Nc3, c4
- Medio gioco: 16+ mosse diverse
- Strategia centrale: 70% preferenza d-e file
- Info output: `info depth 5 score cp 25 nodes 1000`

## Eseguire i Test

### Test Interattivi (con UI)
```bash
npm test
```
- Apre browser Chrome con Karma
- Watch mode: ri-esegue test su modifica file
- Report visuale Jasmine Spec Runner

### Test Headless (CI/CD)
```bash
npm run test:headless
```
- Esegue test senza UI
- Chrome headless
- Output console testuale
- Perfetto per CI/CD pipelines

### Test con Coverage
```bash
npm run test:coverage
```
- Genera report copertura codice
- Output: `coverage/scacchi/index.html`
- Metriche: statements, branches, functions, lines
- Target: >80% coverage

## Risultati Attesi

### Test Success
```
✔ StockfishEngineService: should be created
✔ StockfishEngineService: should send UCI command
✔ StockfishEngineService: should handle bestmove
✔ ChessBoardComponent: should initialize with 64 squares
✔ ChessBoardComponent: should have correct starting position
✔ Stockfish Worker: should respond to UCI commands
✔ Stockfish Worker: should generate valid moves

TOTAL: 35 specs, 0 failures
```

### Coverage Target
- **Statements**: >80%
- **Branches**: >75%
- **Functions**: >80%
- **Lines**: >80%

## Struttura Test Files

```
src/
├── app/
│   ├── services/
│   │   └── stockfish-engine.service.spec.ts    (12 test cases)
│   └── components/
│       └── chess-board/
│           └── chess-board.component.spec.ts   (15 test cases)
└── stockfish.worker.spec.ts                    (13 test cases)

karma.conf.js                                    (Karma config)
package.json                                     (test scripts)
```

## Test Framework

- **Framework**: Jasmine 5.1
- **Runner**: Karma 6.4
- **Browser**: Chrome / ChromeHeadless
- **Coverage**: Istanbul (via Karma)

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Test

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: 18
      - run: npm ci
      - run: npm run test:headless
      - run: npm run test:coverage
```

## Debugging Test

### Run Single Test
```typescript
fit('should do something', () => {
  // Solo questo test viene eseguito
});
```

### Skip Test
```typescript
xit('should do something', () => {
  // Test skippato
});
```

### Debug in Browser
1. Run `npm test`
2. Click "Debug" in Karma UI
3. Apri DevTools (F12)
4. Set breakpoint nel test

## Best Practices

### 1. **Test Isolation**
Ogni test è indipendente, usa `beforeEach` per setup

### 2. **Mock External Dependencies**
Worker mockato per evitare thread reali nei test

### 3. **Descriptive Names**
Nome test descrive comportamento atteso

### 4. **AAA Pattern**
- **Arrange**: Setup test data
- **Act**: Execute code under test
- **Assert**: Verify expectations

### 5. **Coverage ≠ Quality**
80% coverage è obiettivo, ma qualità > quantità

## Troubleshooting

### "Worker is not defined"
```typescript
// Mock Worker in test
spyOn(window as any, 'Worker').and.returnValue(mockWorker);
```

### "Module not found"
```bash
npm install
```

### "ChromeHeadless not launching"
```bash
# Install Chrome on Linux CI
apt-get install -y chromium-browser
```

## Metriche Qualità

### Test Pyramid
```
     E2E (Manual)
    ↗              ↖
  Integration (3)
 ↗                  ↖
Unit (40 test cases)
```

### Code Coverage (Target)
| Metric      | Target | Current |
|-------------|--------|---------|
| Statements  | 80%    | TBD     |
| Branches    | 75%    | TBD     |
| Functions   | 80%    | TBD     |
| Lines       | 80%    | TBD     |

## Future Enhancements

- [ ] E2E tests con Playwright/Cypress
- [ ] Visual regression tests (screenshot diff)
- [ ] Performance tests (FPS durante animazioni)
- [ ] Accessibility tests (WCAG compliance)
- [ ] Load tests (1000 mosse consecutive)

## Contribuire

Per aggiungere nuovi test:
1. Creare file `*.spec.ts` accanto al file testato
2. Seguire pattern esistenti (describe/it)
3. Target: almeno 3 test per file
4. Run `npm run test:coverage` per verificare coverage
