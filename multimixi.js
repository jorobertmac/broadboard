(function () {
  'use strict';

  const SIZE = 8;
  let STEP = 40;

  let board = null;
  let target = null;
  let tiles = [];
  let previewTiles = [];
  let animating = false;
  let highlighted = null;
  let solved = false;
  let lastTouchTime = 0;

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
      if (s > 8) STEP = s;
    }
  }

  function setColor(el, isBlack) {
    if (isBlack) el.classList.add('black');
    else el.classList.remove('black');
  }

  function getTopLeft(r, c) {
    let tr = r;
    let tc = c;
    if (tc >= SIZE - 1) tc = SIZE - 2;
    if (tr >= SIZE - 1) tr = SIZE - 2;
    return [tr, tc];
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

  function setRandom() {
    board = Array.from({ length: SIZE }, () => new Array(SIZE).fill(0));
    const positions = Array.from({ length: 64 }, (_, i) => i);
    for (let i = 63; i > 0; i--) {
      const j = (Math.random() * (i + 1)) | 0;
      const t = positions[i];
      positions[i] = positions[j];
      positions[j] = t;
    }
    for (let k = 0; k < 32; k++) {
      const p = positions[k];
      board[(p / 8) | 0][p % 8] = 1;
    }
    solved = false;
    document.body.classList.remove('won');
  }

  function setTargetFromId(id) {
    const pat = PATTERNS.find(p => p.id === id) || PATTERNS[0];
    target = makeBoardFromGen(pat.gen);
    solved = false;
    document.body.classList.remove('won');
    renderTargetPreview();
  }

  function boardsEqual(a, b) {
    if (!a || !b) return false;
    for (let r = 0; r < SIZE; r++) {
      const ar = a[r], br = b[r];
      for (let c = 0; c < SIZE; c++) {
        if (ar[c] !== br[c]) return false;
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
    const colors = ['#39ff14', '#00e5ff', '#ff6b6b', '#ffd93d', '#c77dff'];
    const frag = document.createDocumentFragment();
    const els = [];
    for (let i = 0; i < 40; i++) {
      const el = document.createElement('div');
      el.className = 'confetti';
      el.style.left = (Math.random() * 100) + 'vw';
      el.style.top = '-10px';
      el.style.background = colors[i % 5];
      el.style.animationDelay = (Math.random() * 0.35) + 's';
      el.style.animationDuration = (1.3 + Math.random() * 0.9) + 's';
      frag.appendChild(el);
      els.push(el);
    }
    document.body.appendChild(frag);
    setTimeout(() => { for (const el of els) el.remove(); }, 2600);
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
        const el = previewTiles[r][c];
        if (target[r][c]) el.classList.add('black');
        else el.classList.remove('black');
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
    const [tr, tc] = highlighted;
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

    const transition = 'transform 0.34s cubic-bezier(0.33, 1.15, 0.64, 1)';
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
    D.style.transform = 'translate(' + (-STEP) + 'px, 0)';
    C.style.transform = 'translate(0, ' + (-STEP) + 'px)';

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
    }, 360);
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
    setTargetFromId(patternSelect.value);
    const name = patternSelect.options[patternSelect.selectedIndex].text;
    statusEl.textContent = 'Target set to “' + name + '”';
    checkWin();
  });

  let resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(measureStep, 100);
  });

  function populateSelect() {
    const frag = document.createDocumentFragment();
    for (let i = 0; i < PATTERNS.length; i++) {
      const p = PATTERNS[i];
      const opt = document.createElement('option');
      opt.value = p.id;
      opt.textContent = p.name;
      frag.appendChild(opt);
    }
    patternSelect.appendChild(frag);
  }

  createTiles();
  createPreviewTiles();
  populateSelect();
  setTargetFromId('checker');
  setRandom();
  render();
  requestAnimationFrame(function () {
    measureStep();
    checkWin();
    statusEl.textContent = 'Randomized — try to reach the Checkerboard';
  });
})();
