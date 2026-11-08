/**
 * Broad Board — pattern core: catalog, load, cache, thumbnails.
 * Depends on BW_GENS / COLOR_GENS (from patterns-gens-*.js).
 * Built-ins paint immediately; optional JSON under patterns/ refreshes in background.
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

  function buildBuiltinCatalog() {
    const list = [];
    const bwMaker = typeof global.BW_GENS === 'function' ? global.BW_GENS : null;
    const colMaker = typeof global.COLOR_GENS === 'function' ? global.COLOR_GENS : null;

    for (let si = 0; si < SIZES.length; si++) {
      const size = SIZES[si];
      if (bwMaker) {
        const bw = bwMaker(size);
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
      }
      if (colMaker) {
        const col = colMaker(size);
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
    }
    return list;
  }

  const catalog = buildBuiltinCatalog();
  const genMap = {};
  const entryById = {};
  for (let i = 0; i < catalog.length; i++) {
    const p = catalog[i];
    genMap[p.id] = p._gen;
    entryById[p.id] = p;
  }

  let PATTERNS = catalog.map(function (p) {
    return {
      id: p.id,
      name: p.name,
      size: p.size,
      category: p.category,
      path: p.path,
    };
  });
  let manifestLoaded = false;
  let manifestPromise = null;
  const patternCache = new Map();
  const thumbCache = new Map();

  function patternsBase() {
    if (typeof document === 'undefined') return 'patterns/';
    const scripts = document.getElementsByTagName('script');
    for (let i = scripts.length - 1; i >= 0; i--) {
      const src = scripts[i].src || '';
      if (src.indexOf('patterns-core.js') !== -1 || src.indexOf('patterns.js') !== -1) {
        return src.replace(/patterns(?:-core)?\.js(\?.*)?$/, 'patterns/');
      }
    }
    return 'patterns/';
  }

  let _base = null;
  function BASE() {
    if (_base == null) _base = patternsBase();
    return _base;
  }

  function applyPatternsList(list) {
    if (!list || !list.length) return;
    PATTERNS = list;
    for (let i = 0; i < PATTERNS.length; i++) {
      entryById[PATTERNS[i].id] = Object.assign({}, entryById[PATTERNS[i].id] || {}, PATTERNS[i]);
    }
    global.PATTERNS = PATTERNS;
  }

  async function loadManifest() {
    if (manifestLoaded) return PATTERNS;
    if (manifestPromise) return manifestPromise;

    manifestPromise = (async function () {
      try {
        const res = await fetch(BASE() + 'manifest.json');
        if (res.ok) {
          const data = await res.json();
          if (data.patterns && data.patterns.length) {
            applyPatternsList(data.patterns);
            manifestLoaded = true;
            return PATTERNS;
          }
          if (data.parts && data.parts.length) {
            const parts = await Promise.all(
              data.parts.map(function (p) {
                return fetch(BASE() + p).then(function (r) {
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
              applyPatternsList(merged);
              manifestLoaded = true;
              return PATTERNS;
            }
          }
        }
      } catch (e) { /* keep builtins */ }

      manifestLoaded = true;
      global.PATTERNS = PATTERNS;
      return PATTERNS;
    })();

    return manifestPromise;
  }

  function resolveEntry(entryOrId) {
    if (typeof entryOrId === 'string') {
      const e = entryById[entryOrId] || PATTERNS.find(function (p) { return p.id === entryOrId; });
      if (!e) throw new Error('Unknown pattern: ' + entryOrId);
      return e;
    }
    return entryOrId;
  }

  function generatePattern(entry) {
    const gen = genMap[entry.id];
    if (!gen) throw new Error('No generator for ' + entry.id);
    return {
      id: entry.id,
      name: entry.name,
      size: entry.size,
      category: entry.category,
      grid: fromGen(entry.size, gen),
    };
  }

  async function loadPattern(entryOrId) {
    const entry = resolveEntry(entryOrId);
    if (patternCache.has(entry.id)) {
      return patternCache.get(entry.id);
    }

    const generated = generatePattern(entry);
    patternCache.set(entry.id, generated);

    if (entry.path && typeof fetch === 'function') {
      try {
        fetch(BASE() + entry.path)
          .then(function (res) { return res.ok ? res.json() : null; })
          .then(function (data) {
            if (data && data.grid) {
              patternCache.set(entry.id, data);
              thumbCache.delete(entry.id);
            }
          })
          .catch(function () { /* ignore network / file:// failures */ });
      } catch (e) { /* ignore environments without working fetch */ }
    }

    return generated;
  }

  function getPatternGridSync(id) {
    if (patternCache.has(id)) {
      const p = patternCache.get(id);
      return p && p.grid ? p.grid : null;
    }
    const entry = entryById[id];
    if (!entry) return null;
    try {
      const data = generatePattern(entry);
      patternCache.set(id, data);
      return data.grid;
    } catch (e) {
      return null;
    }
  }

  function drawPatternThumb(canvas, id, px) {
    const grid = getPatternGridSync(id);
    if (!grid || !canvas) return false;
    const size = grid.length;
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const out = px || 28;
    canvas.width = Math.round(out * dpr);
    canvas.height = Math.round(out * dpr);
    canvas.style.width = out + 'px';
    canvas.style.height = out + 'px';
    const ctx = canvas.getContext('2d');
    if (!ctx) return false;
    ctx.imageSmoothingEnabled = false;
    const cell = canvas.width / size;
    for (let r = 0; r < size; r++) {
      for (let c = 0; c < size; c++) {
        const idx = grid[r][c] | 0;
        ctx.fillStyle = COLORS[idx] || (idx ? '#0d0d0d' : '#e8e8e8');
        ctx.fillRect(Math.floor(c * cell), Math.floor(r * cell), Math.ceil(cell) + 0.5, Math.ceil(cell) + 0.5);
      }
    }
    return true;
  }

  function getThumbDataUrl(id, px) {
    const key = id + '@' + (px || 28);
    if (thumbCache.has(key)) return thumbCache.get(key);
    const canvas = document.createElement('canvas');
    if (!drawPatternThumb(canvas, id, px || 28)) return '';
    const url = canvas.toDataURL('image/png');
    thumbCache.set(key, url);
    return url;
  }

  global.COLORS = COLORS;
  global.PATTERNS = PATTERNS;
  global.loadPatternManifest = loadManifest;
  global.loadPattern = loadPattern;
  global.makeBoardFromPattern = function (pat) {
    if (!pat || !pat.grid) return null;
    return pat.grid.map(function (row) { return row.slice(); });
  };
  global.getPatternGridSync = getPatternGridSync;
  global.drawPatternThumb = drawPatternThumb;
  global.getThumbDataUrl = getThumbDataUrl;
  global.getPatternEntry = function (id) { return entryById[id] || null; };
})(typeof window !== 'undefined' ? window : globalThis);
