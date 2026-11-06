// MultiMixi pattern definitions
// Each generator returns 0 (white) or 1 (black). makeBoardFromGen balances to exactly 32 black.

const PATTERNS = [
  { id: 'checker', name: 'Checkerboard', gen: (r, c) => (r + c) % 2 },
  { id: 'checkerOpp', name: 'Opposite Checkerboard', gen: (r, c) => (r + c + 1) % 2 },
  { id: 'halfTop', name: 'Top Black / Bottom White', gen: (r, c) => r < 4 ? 1 : 0 },
  { id: 'halfBottom', name: 'Bottom Black / Top White', gen: (r, c) => r >= 4 ? 1 : 0 },
  { id: 'halfLeft', name: 'Left Black / Right White', gen: (r, c) => c < 4 ? 1 : 0 },
  { id: 'halfRight', name: 'Right Black / Left White', gen: (r, c) => c >= 4 ? 1 : 0 },
  { id: 'stripesH', name: 'Horizontal Stripes', gen: (r, c) => Math.floor(r / 2) % 2 },
  { id: 'stripesV', name: 'Vertical Stripes', gen: (r, c) => Math.floor(c / 2) % 2 },
  { id: 'stripesH1', name: 'Fine Horizontal Stripes', gen: (r, c) => r % 2 },
  { id: 'stripesV1', name: 'Fine Vertical Stripes', gen: (r, c) => c % 2 },
  { id: 'quad', name: 'Quadrants (TL+BR Black)', gen: (r, c) => ((r < 4 && c < 4) || (r >= 4 && c >= 4)) ? 1 : 0 },
  { id: 'quadAlt', name: 'Quadrants (TR+BL Black)', gen: (r, c) => ((r < 4 && c >= 4) || (r >= 4 && c < 4)) ? 1 : 0 },
  { id: 'diagMain', name: 'Thick Main Diagonal', gen: (r, c) => Math.abs(r - c) <= 1 ? 1 : 0 },
  { id: 'diagAnti', name: 'Thick Anti-Diagonal', gen: (r, c) => Math.abs(r + c - 7) <= 1 ? 1 : 0 },
  { id: 'bothDiag', name: 'Both Thick Diagonals (X)', gen: (r, c) => (Math.abs(r - c) <= 1 || Math.abs(r + c - 7) <= 1) ? 1 : 0 },
  { id: 'frame', name: 'Outer Frame', gen: (r, c) => (r === 0 || r === 7 || c === 0 || c === 7) ? 1 : 0 },
  { id: 'innerFrame', name: 'Double Frame', gen: (r, c) => {
      const outer = r === 0 || r === 7 || c === 0 || c === 7;
      const inner = r === 1 || r === 6 || c === 1 || c === 6;
      return (outer || inner) ? 1 : 0;
    }
  },
  { id: 'centerBlock', name: 'Center 4×4 Black', gen: (r, c) => (r >= 2 && r <= 5 && c >= 2 && c <= 5) ? 1 : 0 },
  { id: 'radial', name: 'Radial (Center Black)', gen: (r, c) => {
      const dr = r - 3.5, dc = c - 3.5;
      return (dr * dr + dc * dc) < 12 ? 1 : 0;
    }
  },
  { id: 'radialInv', name: 'Radial (Center White)', gen: (r, c) => {
      const dr = r - 3.5, dc = c - 3.5;
      return (dr * dr + dc * dc) >= 12 ? 1 : 0;
    }
  },
  { id: 'corners', name: 'Four Corners', gen: (r, c) => {
      const inCorner = (r < 3 && c < 3) || (r < 3 && c > 4) || (r > 4 && c < 3) || (r > 4 && c > 4);
      return inCorner ? 1 : 0;
    }
  },
  { id: 'plus', name: 'Plus / Cross', gen: (r, c) => (r === 3 || r === 4 || c === 3 || c === 4) ? 1 : 0 }
];

function makeBoardFromGen(gen) {
  const SIZE = 8;
  const b = Array.from({ length: SIZE }, (_, r) =>
    Array.from({ length: SIZE }, (_, c) => (gen(r, c) ? 1 : 0))
  );
  let count = 0;
  for (let r = 0; r < SIZE; r++) {
    for (let c = 0; c < SIZE; c++) count += b[r][c];
  }
  if (count !== 32) {
    const needBlack = count < 32;
    const candidates = [];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        if ((needBlack && b[r][c] === 0) || (!needBlack && b[r][c] === 1)) {
          candidates.push({ r, c, dist: Math.abs(r - 3.5) + Math.abs(c - 3.5) });
        }
      }
    }
    candidates.sort((a, b) => a.dist - b.dist);
    let i = 0;
    while (count !== 32 && i < candidates.length) {
      const { r, c } = candidates[i++];
      b[r][c] = needBlack ? 1 : 0;
      count += needBlack ? 1 : -1;
    }
  }
  return b;
}
