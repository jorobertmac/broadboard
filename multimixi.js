(function () {
  'use strict';

  let SIZE = 8;
  let STEP = 40;

  let board = null;
  let target = null;
  let tiles = [];
  let previewTiles = [];
  let animating = false;
  let highlighted = null;
  let solved = false;
  let lastTouchTime = 0;
  let currentPatternId = null;

  const gridEl = document.getElementById('grid');
  const previewEl = document.getElementById('target-preview');
  const statusEl = document.getElementById('status');
  const randomizeBtn = document.getElementById('randomize');
  const patternSelect = document.getElementById('patternSelect');

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

  function colorsInTarget() {
    const set = new Set();
    if (!target) return [0, 1];
    for (let r = 0; r < SIZE; r++) {
      for (let c = 0; c < SIZE; c++) set.add(target[r][c] | 0);
    }
    return Array.from(set);
  }

  function setRandom() {
    board = Array.from({ length: SIZE }, () => new Array(SIZE).fill(0));
    const palette = colorsInTarget();
    const n = SIZE * SIZE;
    const positions = Array.from({ length: n }, (_, i) => i);
    for (let i = n - 1; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const t = positions[i];
      positions[i] = positions[j];
      positions[j] = t;
    }
    for (let k = 0; k < n; k++) {
      const p = positions[k];
      board[(p / SIZE) | 0][p % SIZE] = palette[k % palette.length];
    }
    for (let i = 0; i < n; i++) {
      const j = (Math.random() * n) | 0;
      const ri = (i / SIZE) | 0, ci = i % SIZE;
      const rj = (j / SIZE) | 0, cj = j % SIZE;
      const tmp = board[ri][ci];
      board[ri][ci] = board[rj][cj];
      board[rj][cj] = tmp;
    }
    solved = false;
    document.body.classList.remove('won');
  }

  async function setTargetFromId(id) {
    if (typeof loadPattern !== 'function') {
      statusEl.textContent = 'Pattern loader not ready';
      return;
    }
    statusEl.textContent = 'Loading pattern…';
    try {
      const pat = await loadPattern(id);
      currentPatternId = pat.id;
      if (pat.size !== SIZE) {
        applySize(pat.size);
      }
      target = makeBoardFromPattern(pat);
      solved = false;
      document.body.classList.remove('won');
      renderTargetPreview();
    } catch (err) {
      console.error(err);
      statusEl.textContent = 'Failed to load pattern';
      throw err;
    }
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
        spawnConfetti();
      }
    } else if (solved) {
      solved = false;
      document.body.classList.remove('won');
      statusEl.textContent = '';
    }
  }

  function spawnConfetti() {
    const colors = ['#39ff14', '#00e5ff', '#ff6b6b', '#ffd93d', '#c77dff', '#e74c3c', '#3498db'];
    const frag = document.createDocumentFragment();
    const els = [];
    for (let i = 0; i < 40; i++) {
      const el = document.createElement('div');
      el.className = 'confetti';
      el.style.left = Math.random() * 100 + 'vw';
      el.style.top = '-10px';
      el.style.background = colors[i % colors.length];
      el.style.animationDelay = Math.random() * 0.35 + 's';
      el.style.animationDuration = 1.3 + Math.random() * 0.9 + 's';
      frag.appendChild(el);
      els.push(el);
    }
    document.body.appendChild(frag);
    setTimeout(function () {
      for (const el of els) el.remove();
    }, 2600);
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

  function rotateCW(tr, tc) {
    if (animating) return;
    animating = true;
    randomizeBtn.disabled = true;
    patternSelect.disabled = true;

    const A = tiles[tr][tc];
    const B = tiles[tr][tc + 1];
    const C = tiles[tr + 1][tc];
    const D = tiles[tr + 1][tc + 1];

    measureStep();

    const transition = 'transform 0.28s cubic-bezier(0.33, 1.15, 0.64, 1)';
    A.style.transition = transition;
    B.style.transition = transition;
    C.style.transition = transition;
    D.style.transition = transition;

    A.classList.add('animating');
    B.classList.add('animating');
    C.classList.add('animating');
    D.classList.add('animating');

    void A.offsetWidth;

    A.style.transform = 'translate(' + STEP + 'px, 0)';
    B.style.transform = 'translate(0, ' + STEP + 'px)';
    D.style.transform = 'translate(' + -STEP + 'px, 0)';
    C.style.transform = 'translate(0, ' + -STEP + 'px)';

    setTimeout(function () {
      const tmp = board[tr][tc];
      board[tr][tc] = board[tr + 1][tc];
      board[tr + 1][tc] = board[tr + 1][tc + 1];
      board[tr + 1][tc + 1] = board[tr][tc + 1];
      board[tr][tc + 1] = tmp;

      updateFourColors(tr, tc);

      A.style.transition = 'none';
      B.style.transition = 'none';
      C.style.transition = 'none';
      D.style.transition = 'none';

      A.style.transform = '';
      B.style.transform = '';
      C.style.transform = '';
      D.style.transform = '';

      A.classList.remove('animating');
      B.classList.remove('animating');
      C.classList.remove('animating');
      D.classList.remove('animating');

      animating = false;
      randomizeBtn.disabled = false;
      patternSelect.disabled = false;
      checkWin();
    }, 300);
  }

  function handleActivate(r, c) {
    if (animating) return;
    const pair = getTopLeft(r, c);
    applyHighlight(pair[0], pair[1]);
    rotateCW(pair[0], pair[1]);
  }

  gridEl.addEventListener('mouseover', function (e) {
    if (animating) return;
    if (Date.now() - lastTouchTime < 500) return;
    const tile = e.target.closest('.tile');
    if (!tile) return;
    const pair = getTopLeft(+tile.dataset.r, +tile.dataset.c);
    applyHighlight(pair[0], pair[1]);
  });

  gridEl.addEventListener('mouseleave', function () {
    if (!animating) clearHighlight();
  });

  gridEl.addEventListener('click', function (e) {
    if (Date.now() - lastTouchTime < 500) return;
    if (animating) return;
    const tile = e.target.closest('.tile');
    if (!tile) return;
    handleActivate(+tile.dataset.r, +tile.dataset.c);
  });

  gridEl.addEventListener('touchstart', function (e) {
    if (animating) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const tile = el && el.closest ? el.closest('.tile') : null;
    if (!tile || !gridEl.contains(tile)) return;

    e.preventDefault();
    lastTouchTime = Date.now();
    handleActivate(+tile.dataset.r, +tile.dataset.c);
  }, { passive: false });

  randomizeBtn.addEventListener('click', function () {
    if (animating) return;
    setRandom();
    render();
    statusEl.textContent = 'Randomized — match the selected target';
    checkWin();
  });

  patternSelect.addEventListener('change', function () {
    if (animating) return;
    const id = patternSelect.value;
    if (!id) return;
    patternSelect.disabled = true;
    randomizeBtn.disabled = true;
    setTargetFromId(id)
      .then(function () {
        setRandom();
        render();
        const name = patternSelect.options[patternSelect.selectedIndex].text;
        statusEl.textContent = 'Target set to “' + name + '” — board randomized';
        checkWin();
        requestAnimationFrame(measureStep);
      })
      .catch(function () {})
      .finally(function () {
        patternSelect.disabled = false;
        randomizeBtn.disabled = false;
      });
  });

  let resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(measureStep, 100);
  });

  function populateSelect(patterns) {
    patternSelect.innerHTML = '';
    const frag = document.createDocumentFragment();

    const bySize = {};
    for (let i = 0; i < patterns.length; i++) {
      const p = patterns[i];
      if (!bySize[p.size]) bySize[p.size] = { 'black-and-white': [], color: [] };
      const cat = p.category === 'color' ? 'color' : 'black-and-white';
      bySize[p.size][cat].push(p);
    }

    const sizes = Object.keys(bySize).map(Number).sort(function (a, b) { return a - b; });
    for (let s = 0; s < sizes.length; s++) {
      const size = sizes[s];
      const groups = bySize[size];
      const sizeLabel = size + '×' + size;

      const bw = groups['black-and-white'];
      if (bw && bw.length) {
        const og = document.createElement('optgroup');
        og.label = sizeLabel + ' — Black & White';
        for (let i = 0; i < bw.length; i++) {
          const p = bw[i];
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = p.name;
          og.appendChild(opt);
        }
        frag.appendChild(og);
      }

      const col = groups.color;
      if (col && col.length) {
        const og = document.createElement('optgroup');
        og.label = sizeLabel + ' — Color';
        for (let i = 0; i < col.length; i++) {
          const p = col[i];
          const opt = document.createElement('option');
          opt.value = p.id;
          opt.textContent = p.name;
          og.appendChild(opt);
        }
        frag.appendChild(og);
      }
    }
    patternSelect.appendChild(frag);
  }

  async function boot() {
    statusEl.textContent = 'Loading patterns…';
    try {
      const patterns = await loadPatternManifest();
      populateSelect(patterns);

      const defaultId = patterns.find(function (p) {
        return p.id === 'checker-8';
      }) || patterns.find(function (p) {
        return p.size === 8 && p.category === 'black-and-white';
      }) || patterns[0];

      if (!defaultId) {
        statusEl.textContent = 'No patterns found';
        return;
      }

      patternSelect.value = defaultId.id;
      await setTargetFromId(defaultId.id);
      setRandom();
      render();
      requestAnimationFrame(function () {
        measureStep();
        checkWin();
        statusEl.textContent = 'Randomized — try to reach “' + defaultId.name + '”';
      });
    } catch (err) {
      console.error(err);
      statusEl.textContent = 'Could not load patterns. Serve over HTTP (not file://).';
    }
  }

  boot();
})();
