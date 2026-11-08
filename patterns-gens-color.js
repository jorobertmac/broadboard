/**
 * Broad Board — color pattern generators (size-agnostic).
 * Registers COLOR_GENS(size) → [[fileId, name, gen(r,c,size)], ...]
 */
(function (global) {
  'use strict';

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
      ['blocks-2x2', 'Color Mosaic 2×2', function (r, c) {
        return 2 + ((((r / 2) | 0) + ((c / 2) | 0) * 3) % 6);
      }],
      ['bullseye', 'Bullseye', function (r, c) {
        const d = Math.floor(Math.max(Math.abs(r - mid), Math.abs(c - mid)));
        return [2, 0, 3, 1, 4, 5, 6, 7][d % 8];
      }],
      ['rings-color', 'Color Rings', function (r, c) {
        return 2 + (Math.min(r, c, size - 1 - r, size - 1 - c) % 6);
      }],
      ['flag', 'Flag Stripes', function (r, c) {
        return [2, 0, 3][Math.min(2, Math.floor((r * 3) / size))];
      }],
      ['tri-bands', 'Triple Bands', function (r, c) {
        return [2, 4, 6][Math.min(2, Math.floor((r * 3) / size))];
      }],
      ['plus-color', 'Color Plus', function (r, c) {
        const a = Math.floor(mid), b = Math.ceil(mid);
        if (r === a || r === b) return 2;
        if (c === a || c === b) return 3;
        return 1;
      }],
      ['x-color', 'Color X', function (r, c) {
        return r === c ? 2 : (r + c === size - 1 ? 3 : 0);
      }],
      ['gradient-corner', 'Corner Gradient', function (r, c) {
        return 2 + Math.min(5, Math.floor(((r + c) * 6) / (2 * Math.max(1, size - 1))));
      }],
      ['checker-color', 'Color Checker', function (r, c) {
        const pair = (r + c) % 2, band = Math.floor(r / 2) % 3;
        return pair ? 2 + band : 5 + (band % 2);
      }],
      ['columns-pair', 'Paired Columns', function (r, c) {
        return 2 + ((c / 2) | 0) % 6;
      }],
      ['rows-pair', 'Paired Rows', function (r, c) {
        return 2 + ((r / 2) | 0) % 6;
      }],
      ['diagonal-bands', 'Diagonal Bands', function (r, c) {
        return 2 + Math.abs(r - c) % 6;
      }],
      ['center-burst', 'Center Burst', function (r, c) {
        return 2 + (Math.floor(Math.abs(r - mid) + Math.abs(c - mid)) % 6);
      }],
    ];
  }

  global.COLOR_GENS = colorGens;
})(typeof window !== 'undefined' ? window : globalThis);
