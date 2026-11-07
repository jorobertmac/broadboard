/**
 * Broad Board — pattern loader
 * Loads manifest + individual JSON files from patterns/black-and-white and patterns/color
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

  /** @type {{id:string,name:string,size:number,category:string,path:string}[]} */
  let PATTERNS = [];
  let manifestLoaded = false;
  const patternCache = new Map();

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
    const res = await fetch(BASE + 'manifest.json');
    if (!res.ok) throw new Error('Failed to load pattern manifest');
    const data = await res.json();
    PATTERNS = data.patterns || [];
    manifestLoaded = true;
    global.PATTERNS = PATTERNS;
    return PATTERNS;
  }

  async function loadPattern(entryOrId) {
    let entry = entryOrId;
    if (typeof entryOrId === 'string') {
      entry = PATTERNS.find((p) => p.id === entryOrId);
      if (!entry) throw new Error('Unknown pattern: ' + entryOrId);
    }
    if (patternCache.has(entry.id)) {
      return patternCache.get(entry.id);
    }
    const res = await fetch(BASE + entry.path);
    if (!res.ok) throw new Error('Failed to load pattern ' + entry.path);
    const data = await res.json();
    patternCache.set(entry.id, data);
    return data;
  }

  function makeBoardFromPattern(pat) {
    if (!pat || !pat.grid) return null;
    return pat.grid.map((row) => row.slice());
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
