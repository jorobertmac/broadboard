/**
 * Broad Board — black-and-white pattern generators (size-agnostic).
 * Registers BW_GENS(size) → [[fileId, name, gen(r,c,size)], ...]
 */
(function (global) {
  'use strict';

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
      ['border', 'Border Frame', function (r, c) {
        return (r === 0 || r === size - 1 || c === 0 || c === size - 1) ? 1 : 0;
      }],
      ['double-border', 'Double Border', function (r, c) {
        return Math.min(r, c, size - 1 - r, size - 1 - c) <= 1 ? 1 : 0;
      }],
      ['xmark', 'X Mark', function (r, c) {
        return (r === c || r + c === size - 1) ? 1 : 0;
      }],
      ['plus', 'Plus Cross', function (r, c) {
        const a = Math.floor(mid), b = Math.ceil(mid);
        return (r === a || r === b || c === a || c === b) ? 1 : 0;
      }],
      ['diamond', 'Diamond', function (r, c) {
        return Math.abs(r - mid) + Math.abs(c - mid) <= half ? 1 : 0;
      }],
      ['diamond-ring', 'Diamond Ring', function (r, c) {
        const d = Math.abs(r - mid) + Math.abs(c - mid);
        return d >= half - 1 && d <= half + 0.5 ? 1 : 0;
      }],
      ['quarters', 'Quarters Split', function (r, c) {
        const top = r < half, left = c < half;
        return (top && left) || (!top && !left) ? 1 : 0;
      }],
      ['rings', 'Concentric Rings', function (r, c) {
        return Math.min(r, c, size - 1 - r, size - 1 - c) % 2;
      }],
      ['stairs', 'Stairs', function (r, c) { return c <= r ? 1 : 0; }],
      ['center-block', 'Center Block', function (r, c) {
        const m = Math.max(2, Math.floor(size / 4));
        return r >= half - m && r < half + m && c >= half - m && c < half + m ? 1 : 0;
      }],
      ['corners', 'Four Corners', function (r, c) {
        const m = Math.max(1, Math.floor(size / 4));
        return ((r < m && c < m) || (r < m && c >= size - m) ||
                (r >= size - m && c < m) || (r >= size - m && c >= size - m)) ? 1 : 0;
      }],
      ['zigzag-h', 'Zigzag Horizontal', function (r, c) {
        return (c + (r % 2)) % 2;
      }],
    ];
  }

  global.BW_GENS = bwGens;
})(typeof window !== 'undefined' ? window : globalThis);
