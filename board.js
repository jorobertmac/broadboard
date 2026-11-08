/**
 * Broad Board — board DOM, sizing, color application, render.
 * Exposes BroadBoard.board API used by picker + game modules.
 */
(function (global) {
  'use strict';

  const BB = (global.BroadBoard = global.BroadBoard || {});

  let SIZE = 8;
  let STEP = 40;
  let board = null;
  let target = null;
  let tiles = [];
  let previewTiles = [];
  let highlighted = null;
  let solved = false;

  const gridEl = document.getElementById('grid');
  const previewEl = document.getElementById('target-preview');
  const statusEl = document.getElementById('status');

  function measureStep() {
    if (tiles[0] && tiles[0][0] && tiles[0][1]) {
      const a = tiles[0][0].getBoundingClientRect();
      const b = tiles[0][1].getBoundingClientRect();
      const s = b.left - a.left;
      if (s > 4) STEP = s;
    }
  }

  function setColor(el, colorIndex) {
    const idx = colorIndex | 0;
    el.dataset.color = String(idx);
    const hex = (typeof COLORS !== 'undefined' && COLORS[idx]) ? COLORS[idx] : (idx ? '#0d0d0d' : '#e8e8e8');
    el.style.background = hex;
    const isDark = idx === 1 || idx === 2 || idx === 3 || idx === 6 || idx === 9;
    el.style.boxShadow = isDark
      ? 'inset 0 0 0 1px rgba(255,255,255,0.08)'
      : 'inset 0 0 0 1px rgba(0,0,0,0.12)';
  }

  function getTopLeft(r, c) {
    let tr = r;
    let tc = c;
    if (tc >= SIZE - 1) tc = SIZE - 2;
    if (tr >= SIZE - 1) tr = SIZE - 2;
    return [tr, tc];
  }

  function clearGrid() {
    gridEl.innerHTML = '';
    previewEl.innerHTML = '';
    tiles = [];
    previewTiles = [];
    highlighted = null;
  }

  function createTiles() {
    const frag = document.createDocumentFragment();
    tiles = new Array(SIZE);
    for (let r = 0; r < SIZE; r++) {
      tiles[r] = new Array(SIZE);
      for (let c = 0; c < SIZE; c++) {
        const el = document.createElement('div');
        el.className = 'tile';
        el.dataset.r = r;
        el.dataset.c = c;
        frag.appendChild(el);
        tiles[r][c] = el;
      }
    }
    gridEl.appendChild(frag);
  }

  function createPreviewTiles() {
    const frag = document.createDocumentFragment();
    previewTiles = new Array(SIZE);
    for (let r = 0; r < SIZE; r++) {
      previewTiles[r] = new Array(SIZE);
      for (let c = 0; c < SIZE; c++) {
        const el = document.createElement('div');
        el.className = 'preview-tile';
        frag.appendChild(el);
        previewTiles[r][c] = el;
      }
    }
    previewEl.appendChild(frag);
  }

  function applySize(size) {
    SIZE = size;
    gridEl.style.gridTemplateColumns = 'repeat(' + SIZE + ', 1fr)';
    gridEl.style.gridTemplateRows = 'repeat(' + SIZE + ', 1fr)';
    previewEl.style.gridTemplateColumns = 'repeat(' + SIZE + ', 1fr)';
    previewEl.style.gridTemplateRows = 'repeat(' + SIZE + ', 1fr)';
    if (SIZE >= 12) {
      gridEl.style.gap = '1px';
      document.documentElement.style.setProperty('--gap', '1px');
    } else if (SIZE >= 10) {
      gridEl.style.gap = '2px';
      document.documentElement.style.setProperty('--gap', '2px');
    } else {
      gridEl.style.gap = '';
      document.documentElement.style.removeProperty('--gap');
    }
    clearGrid();
    createTiles();
    createPreviewTiles();
  }

  function setRandom() {
    const n = SIZE * SIZE;
    const colors = new Array(n);
    if (target) {
      let k = 0;
      for (let r = 0; r < SIZE; r++) {
        for (let c = 0; c < SIZE; c++) {
          colors[k++] = target[r][c] | 0;
        }
      }
    } else {
      for (let k = 0; k < n; k++) colors[k] = 0;
    }
    for (let i = n - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const t = colors[i];
      colors[i] = colors[j];
      colors[j] = t;
    }
    board = Array.from({ length: SIZE }, function () { return new Array(SIZE); });
    for (let k = 0; k < n; k++) {
      board[(k / SIZE) | 0][k % SIZE] = colors[k];
    }
    solved = false;
    document.body.classList.remove('won');
  }

  function boardsEqual(a, b) {
    if (!a || !b || a.length !== SIZE || b.length !== SIZE) return false;
    for (let r = 0; r < SIZE; r++) {
      const ar = a[r], br = b[r];
      for (let c = 0; c < SIZE; c++) {
        if ((ar[c] | 0) !== (br[c] | 0)) return false;
      }
    }
    return true;
  }

  function checkWin() {
    if (boardsEqual(board, target)) {
      if (!solved) {
        solved = true;
        document.body.classList.add('won');
        statusEl.textContent = '🎉 Solved! Pattern matched.';
        if (typeof BB.spawnConfetti === 'function') BB.spawnConfetti();
      }
    } else if (solved) {
      solved = false;
      document.body.classList.remove('won');
      statusEl.textContent = '';
    }
  }

  function render() {
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        setColor(tiles[r][c], board[r][c]);
      }
    }
  }

  function renderTargetPreview() {
    if (!target) return;
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) {
        setColor(previewTiles[r][c], target[r][c]);
      }
    }
  }

  function updateFourColors(tr, tc) {
    setColor(tiles[tr][tc], board[tr][tc]);
    setColor(tiles[tr][tc + 1], board[tr][tc + 1]);
    setColor(tiles[tr + 1][tc], board[tr + 1][tc]);
    setColor(tiles[tr + 1][tc + 1], board[tr + 1][tc + 1]);
  }

  function clearHighlight() {
    if (!highlighted) return;
    const tr = highlighted[0], tc = highlighted[1];
    tiles[tr][tc].classList.remove('highlight');
    tiles[tr][tc + 1].classList.remove('highlight');
    tiles[tr + 1][tc].classList.remove('highlight');
    tiles[tr + 1][tc + 1].classList.remove('highlight');
    highlighted = null;
  }

  function applyHighlight(tr, tc) {
    if (highlighted && highlighted[0] === tr && highlighted[1] === tc) return;
    clearHighlight();
    tiles[tr][tc].classList.add('highlight');
    tiles[tr][tc + 1].classList.add('highlight');
    tiles[tr + 1][tc].classList.add('highlight');
    tiles[tr + 1][tc + 1].classList.add('highlight');
    highlighted = [tr, tc];
  }

  BB.board = {
    get SIZE() { return SIZE; },
    get STEP() { return STEP; },
    get board() { return board; },
    set board(v) { board = v; },
    get target() { return target; },
    set target(v) { target = v; },
    get tiles() { return tiles; },
    get solved() { return solved; },
    set solved(v) { solved = v; },
    get highlighted() { return highlighted; },
    gridEl: gridEl,
    previewEl: previewEl,
    statusEl: statusEl,
    measureStep: measureStep,
    setColor: setColor,
    getTopLeft: getTopLeft,
    applySize: applySize,
    setRandom: setRandom,
    checkWin: checkWin,
    render: render,
    renderTargetPreview: renderTargetPreview,
    updateFourColors: updateFourColors,
    clearHighlight: clearHighlight,
    applyHighlight: applyHighlight,
  };
})(typeof window !== 'undefined' ? window : globalThis);
