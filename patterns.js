/**
 * Broad Board - pattern loader
 * Prefers JSON files under patterns/; falls back to built-in generators so the
 * game works even when not every size/category file is present yet.
 */
(function (global) {
  'use strict';

  const COLORS = [
    '#e8e8e8', // 0  light / white
    '#0d0d0d', // 1  black
    '#e74c3c', // 2  red
    '#3498db', // 3  blue
    '#2ecc71', // 4  green
    '#f1c40f', // 5  yellow
    '#9b59b6', // 6  purple
    '#e67e22', // 7  orange
    '#1abc9c', // 8  teal
    '#e91e63', // 9  pink
  ];

  const SIZES = [4, 6, 8, 10, 12, 14, 16];

  function fromGen(size, gen) {
    const b = Array.from({ length: size }, function () { return new Array(size).fill(0); });
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) b[r][c] = gen(r, c, size) | 0;
    }
    return b;
  }

  function bwGens(size) {
    const mid = (size - 1) / 2;
    const half = size / 2;
    return [
      ['checker', 'Checkerboard', function (r, c) { return (r + c) % 2; }],
      ['checker-inv', 'Checker Inverse', function (r, c) { return (r + c + 1) % 2; }],
      ['stripes-h', 'Horizontal Stripes', function (r, c) { return r % 2; }],
      ['stripes-v', 'Vertical Stripes', function (r, c) { return c % 2; }],
      ['stripes-h2', 'Double H-Stripes', function (r, c) { return ((r / 2) | 0) % 2; }],
      ['stripes-v2', 'Double V-Stripes', function (r, c) { return ((c / 2) | 0) % 2; }],
      ['border', 'Border Frame', function (r, c) { return (r === 0 || r === size - 1 || c === 0 || c === size - 1) ? 1 : 0; }],
      ['double-border', 'Double Border', function (r, c) { return Math.min(r, c, size - 1 - r, size - 1 - c) <= 1 ? 1 : 0; }],
      ['xmark', 'X Mark', function (r, c) { return (r === c || r + c === size - 1) ? 1 : 0; }],
      ['plus', 'Plus Cross', function (r, c) {
        const a = Math.floor(mid), b = Math.ceil(mid);
        return (r === a || r === b || c === a || c === b) ? 1 : 0;
      }],
      ['diamond', 'Diamond', function (r, c) { return Math.abs(r - mid) + Math.abs(c - mid) <= half ? 1 : 0; }],
      ['diamond-ring', 'Diamond Ring', function (r, c) {
        const d = Math.abs(r - mid) + Math.abs(c - mid);
        return d >= half - 1 && d <= half + 0.5 ? 1 : 0;
      }],
      ['quarters', 'Quarters Split', function (r, c) {
        const top = r < half, left = c < half;
        return (top && left) || (!top && !left) ? 1 : 0;
      }],
      ['rings', 'Concentric Rings', function (r, c) { return Math.min(r, c, size - 1 - r, size - 1 - c) % 2; }],
      ['stairs', 'Stairs', function (r, c) { return c <= r ? 1 : 0; }],
      ['center-block', 'Center Block', function (r, c) {
        const m = Math.max(2, Math.floor(size / 4));
        return r >= half - m && r < half + m && c >= half - m && c < half + m ? 1 : 0;
      }],
      ['corners', 'Four Corners', function (r, c) {
        const m = Math.max(1, Math.floor(size / 4));
        return ((r < m && c < m) || (r >= size - m && c < m) ||
                (r >= size - m && c >= size - m) || (r < m && c >= size - m)) ? 1 : 0;
      }],
      ['zigzag-h', 'Zigzag Horizontal', function (r, c) { return (c + (r % 2)) % 2; }],
    ];
  }

  function colorGens(size) {
    const mid = (size - 1) / 2;
    const half = size / 2;
    return [
      ['rainbow-rows', 'Rainbow Rows', function (r, c) { return 2 + (r % 6); }],
      ['rainbow-cols', 'Rainbow Columns', function (r, c) { return 2 + (c % 6); }],
      ['rainbow-diag', 'Rainbow Diagonal', function (r, c) { return 2 + ((r + c) % 6); }],
      ['quarters-color', 'Four Quarters', function (r, c) {
        if (r < half && c < half) return 2;
        if (r < half) return 3;
        if (c < half) return 4;
        return 5;
      }],
      ['nine-blocks', 'Nine Blocks', function (r, c) {
        const br = Math.min(2, Math.floor((r * 3) / size));
        const bc = Math.min(2, Math.floor((c * 3) / size));
        return 2 + (br * 3 + bc) % 6;
      }],
      ['blocks-2x2', 'Color Mosaic 2x2', function (r, c) { return 2 + ((((r / 2) | 0) + ((c / 2) | 0) * 3) % 6); }],
      ['bullseye', 'Bullseye', function (r, c) {
        const d = Math.floor(Math.max(Math.abs(r - mid), Math.abs(c - mid)));
        return [2, 0, 3, 1, 4, 5, 6, 7][d % 8];
      }],
      ['rings-color', 'Color Rings', function (r, c) { return 2 + (Math.min(r, c, size - 1 - r, size - 1 - c) % 6); }],
      ['flag', 'Flag Stripes', function (r, c) { return [2, 0, 3][Math.min(2, Math.floor((r * 3) / size))]; }],
      ['tri-bands', 'Triple Bands', function (r, c) { return [2, 4, 6][Math.min(2, Math.floor((r * 3) / size))]; }],
      ['plus-color', 'Color Plus', function (r, c) {
        const a = Math.floor(mid), b = Math.ceil(mid);
        if (r === a || r === b) return 2;
        if (c === a || c === b) return 3;
        return 1;
      }],
      ['x-color', 'Color X', function (r, c) { return r === c ? 2 : (r + c === size - 1 ? 3 : 0); }],
      ['gradient-corner', 'Corner Gradient', function (r, c) { return 2 + Math.min(5, Math.floor(((r + c) * 6) / (2 * Math.max(1, size - 1)))); }],
      ['checker-color', 'Color Checker', function (r, c) {
        const pair = (r + c) % 2, band = Math.floor(r / 2) % 3;
        return pair ? 2 + band : 5 + (band % 2);
      }],
      ['columns-pair', 'Paired Columns', function (r, c) { return 2 + ((c / 2) | 0) % 6; }],
      ['rows-pair', 'Paired Rows', function (r, c) { return 2 + ((r / 2) | 0) % 6; }],
      ['diagonal-bands', 'Diagonal Bands', function (r, c) { return 2 + Math.abs(r - c) % 6; }],
      ['center-burst', 'Center Burst', function (r, c) { return 2 + (Math.floor(Math.abs(r - mid) + Math.abs(c - mid)) % 6); }],
    ];
  }

  function buildBuiltinCatalog() {
    const list = [];
    for (let si = 0; si < SIZES.length; si++) {
      const size = SIZES[si];
      const bw = bwGens(size);
      for (let i = 0; i < bw.length; i++) {
        const fileId = bw[i][0], name = bw[i][1], gen = bw[i][2];
        list.push({
          id: fileId + '-' + size,
          name: name,
          size: size,
          category: 'black-and-white',
          path: 'black-and-white/' + size + '/' + fileId + '.json',
          _gen: gen,
        });
      }
      const col = colorGens(size);
      for (let i = 0; i < col.length; i++) {
        const fileId = col[i][0], name = col[i][1], gen = col[i][2];
        list.push({
          id: fileId + '-' + size,
          name: name,
          size: size,
          category: 'color',
          path: 'color/' + size + '/' + fileId + '.json',
          _gen: gen,
        });
      }
    }
    return list;
  }

  let PATTERNS = [];
  let manifestLoaded = false;
  const patternCache = new Map();
  let genMap = {};

  function patternsBase() {
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      const src = scripts[i].src || '';
      if (src.indexOf('patterns.js') !== -1) {
        return src.replace(/patterns\.js(\?.*)?$/, 'patterns/');
      }
    }
    return 'patterns/';
  }

  const BASE = patternsBase();

  async function loadManifest() {
    if (manifestLoaded) return PATTERNS;

    const catalog = buildBuiltinCatalog();
    genMap = {};
    for (let i = 0; i < catalog.length; i++) {
      genMap[catalog[i].id] = catalog[i]._gen;
    }

    try {
      const res = await fetch(BASE + 'manifest.json');
      if (res.ok) {
        const data = await res.json();
        if (data.patterns && data.patterns.length) {
          PATTERNS = data.patterns;
          manifestLoaded = true;
          global.PATTERNS = PATTERNS;
          return PATTERNS;
        }
        // Split manifests: { parts: ["manifest-4.json", ...] }
        if (data.parts && data.parts.length) {
          const parts = await Promise.all(
            data.parts.map(function (p) {
              return fetch(BASE + p).then(function (r) {
                return r.ok ? r.json() : { patterns: [] };
              }).catch(function () { return { patterns: [] }; });
            })
          );
          const merged = [];
          for (let i = 0; i < parts.length; i++) {
            if (parts[i].patterns) {
              for (let j = 0; j < parts[i].patterns.length; j++) {
                merged.push(parts[i].patterns[j]);
              }
            }
          }
          if (merged.length) {
            PATTERNS = merged;
            manifestLoaded = true;
            global.PATTERNS = PATTERNS;
            return PATTERNS;
          }
        }
      }
    } catch (e) { /* use builtin */ }

    PATTERNS = catalog.map(function (p) {
      return {
        id: p.id,
        name: p.name,
        size: p.size,
        category: p.category,
        path: p.path,
      };
    });
    manifestLoaded = true;
    global.PATTERNS = PATTERNS;
    return PATTERNS;
  }

  async function loadPattern(entryOrId) {
    let entry = entryOrId;
    if (typeof entryOrId === 'string') {
      entry = PATTERNS.find(function (p) { return p.id === entryOrId; });
      if (!entry) throw new Error('Unknown pattern: ' + entryOrId);
    }
    if (patternCache.has(entry.id)) {
      return patternCache.get(entry.id);
    }

    try {
      const res = await fetch(BASE + entry.path);
      if (res.ok) {
        const data = await res.json();
        patternCache.set(entry.id, data);
        return data;
      }
    } catch (e) { /* generate */ }

    const gen = genMap[entry.id];
    if (!gen) {
      const catalog = buildBuiltinCatalog();
      const found = catalog.find(function (p) { return p.id === entry.id; });
      if (!found) throw new Error('No generator for ' + entry.id);
      const data = {
        id: found.id,
        name: found.name,
        size: found.size,
        category: found.category,
        grid: fromGen(found.size, found._gen),
      };
      patternCache.set(entry.id, data);
      return data;
    }

    const data = {
      id: entry.id,
      name: entry.name,
      size: entry.size,
      category: entry.category,
      grid: fromGen(entry.size, gen),
    };
    patternCache.set(entry.id, data);
    return data;
  }

  function makeBoardFromPattern(pat) {
    if (!pat || !pat.grid) return null;
    return pat.grid.map(function (row) { return row.slice(); });
  }

  function makeBoardFromGen() {
    console.warn('makeBoardFromGen is deprecated');
    return null;
  }

  global.COLORS = COLORS;
  global.PATTERNS = PATTERNS;
  global.loadPatternManifest = loadManifest;
  global.loadPattern = loadPattern;
  global.makeBoardFromPattern = makeBoardFromPattern;
  global.makeBoardFromGen = makeBoardFromGen;
})(typeof window !== 'undefined' ? window : globalThis);
