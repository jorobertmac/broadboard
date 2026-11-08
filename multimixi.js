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
  let allPatterns = [];
  let pickerOpen = false;

  const gridEl = document.getElementById('grid');
  const previewEl = document.getElementById('target-preview');
  const statusEl = document.getElementById('status');
  const randomizeBtn = document.getElementById('randomize');
  const pickerRoot = document.getElementById('patternPicker');
  const pickerBtn = document.getElementById('patternPickerBtn');
  const pickerLabel = document.getElementById('patternPickerLabel');
  const pickerThumb = document.getElementById('patternPickerThumb');
  const pickerMenu = document.getElementById('patternPickerMenu');

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
    // Exact color multiset from the target, then shuffle positions.
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
      updatePickerSelection(id);
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
    setPickerEnabled(false);

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
      setPickerEnabled(true);
      checkWin();
    }, 300);
  }

  function handleActivate(r, c) {
    if (animating) return;
    const pair = getTopLeft(r, c);
    applyHighlight(pair[0], pair[1]);
    rotateCW(pair[0], pair[1]);
  }

  // ——— Pattern picker (custom select with thumbnails) ———

  function setPickerEnabled(on) {
    if (pickerBtn) pickerBtn.disabled = !on;
  }

  function closePicker() {
    if (!pickerOpen) return;
    pickerOpen = false;
    pickerMenu.hidden = true;
    pickerBtn.setAttribute('aria-expanded', 'false');
    pickerRoot.classList.remove('open');
  }

  function openPicker() {
    if (pickerOpen || animating) return;
    pickerOpen = true;
    pickerMenu.hidden = false;
    pickerBtn.setAttribute('aria-expanded', 'true');
    pickerRoot.classList.add('open');
    const canvases = pickerMenu.querySelectorAll('canvas[data-pattern-id]');
    for (let i = 0; i < canvases.length; i++) {
      const c = canvases[i];
      if (c.dataset.drawn === '1') continue;
      if (typeof drawPatternThumb === 'function') {
        drawPatternThumb(c, c.dataset.patternId, 24);
        c.dataset.drawn = '1';
      }
    }
    const selected = pickerMenu.querySelector('.pattern-option.selected');
    if (selected) selected.scrollIntoView({ block: 'nearest' });
  }

  function togglePicker() {
    if (pickerOpen) closePicker();
    else openPicker();
  }

  function updatePickerSelection(id) {
    currentPatternId = id;
    const entry = (typeof getPatternEntry === 'function' && getPatternEntry(id)) ||
      allPatterns.find(function (p) { return p.id === id; });
    if (entry && pickerLabel) {
      pickerLabel.textContent = entry.name + ' · ' + entry.size + '×' + entry.size;
    }
    if (pickerThumb && typeof drawPatternThumb === 'function') {
      drawPatternThumb(pickerThumb, id, 28);
    }
    const opts = pickerMenu.querySelectorAll('.pattern-option');
    for (let i = 0; i < opts.length; i++) {
      const el = opts[i];
      const on = el.dataset.id === id;
      el.classList.toggle('selected', on);
      el.setAttribute('aria-selected', on ? 'true' : 'false');
    }
  }

  function selectPattern(id) {
    if (animating || !id || id === currentPatternId) {
      closePicker();
      return;
    }
    closePicker();
    setPickerEnabled(false);
    randomizeBtn.disabled = true;
    setTargetFromId(id)
      .then(function () {
        setRandom();
        render();
        const entry = allPatterns.find(function (p) { return p.id === id; });
        const name = entry ? entry.name : id;
        statusEl.textContent = 'Target set to “' + name + '” — board randomized';
        checkWin();
        requestAnimationFrame(measureStep);
      })
      .catch(function () {})
      .finally(function () {
        setPickerEnabled(true);
        randomizeBtn.disabled = false;
      });
  }

  function buildPicker(patterns) {
    allPatterns = patterns.slice();
    pickerMenu.innerHTML = '';
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

      function addGroup(label, list) {
        if (!list || !list.length) return;
        const header = document.createElement('div');
        header.className = 'pattern-group-label';
        header.textContent = label;
        frag.appendChild(header);
        for (let i = 0; i < list.length; i++) {
          const p = list[i];
          const btn = document.createElement('button');
          btn.type = 'button';
          btn.className = 'pattern-option';
          btn.dataset.id = p.id;
          btn.setAttribute('role', 'option');
          btn.setAttribute('aria-selected', 'false');

          const canvas = document.createElement('canvas');
          canvas.className = 'pattern-option-thumb';
          canvas.dataset.patternId = p.id;
          canvas.width = 24;
          canvas.height = 24;
          if (typeof drawPatternThumb === 'function') {
            drawPatternThumb(canvas, p.id, 24);
            canvas.dataset.drawn = '1';
          }

          const text = document.createElement('span');
          text.className = 'pattern-option-name';
          text.textContent = p.name;

          const badge = document.createElement('span');
          badge.className = 'pattern-option-size';
          badge.textContent = sizeLabel;

          btn.appendChild(canvas);
          btn.appendChild(text);
          btn.appendChild(badge);
          btn.addEventListener('click', function () {
            selectPattern(p.id);
          });
          frag.appendChild(btn);
        }
      }

      addGroup(sizeLabel + ' — Black & White', groups['black-and-white']);
      addGroup(sizeLabel + ' — Color', groups.color);
    }

    pickerMenu.appendChild(frag);
  }

  pickerBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if (animating || pickerBtn.disabled) return;
    togglePicker();
  });

  document.addEventListener('click', function (e) {
    if (!pickerOpen) return;
    if (pickerRoot.contains(e.target)) return;
    closePicker();
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' && pickerOpen) {
      closePicker();
      pickerBtn.focus();
    }
  });

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

  let resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(measureStep, 100);
  });

  async function boot() {
    statusEl.textContent = 'Loading patterns…';

    if (typeof loadPatternManifest !== 'function') {
      await new Promise(function (resolve) {
        let n = 0;
        const t = setInterval(function () {
          n++;
          if (typeof loadPatternManifest === 'function' || n > 40) {
            clearInterval(t);
            resolve();
          }
        }, 25);
      });
    }

    if (typeof loadPatternManifest !== 'function') {
      statusEl.textContent = 'Pattern loader failed to load.';
      return;
    }

    try {
      const patterns = await loadPatternManifest();
      if (!patterns || !patterns.length) {
        statusEl.textContent = 'No patterns found';
        return;
      }

      buildPicker(patterns);

      const defaultId = patterns.find(function (p) {
        return p.id === 'checker-8';
      }) || patterns.find(function (p) {
        return p.size === 8 && p.category === 'black-and-white';
      }) || patterns[0];

      if (!defaultId) {
        statusEl.textContent = 'No patterns found';
        return;
      }

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
