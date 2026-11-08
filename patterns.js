/**
 * Broad Board - pattern loader
 * Built-in generators are available immediately (no network required for first
 * paint). Optional JSON under patterns/ is fetched in the background and used
 * when present.
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

  // truncated for this message - FULL FILE NEEDED
})(typeof window !== 'undefined' ? window : globalThis);
