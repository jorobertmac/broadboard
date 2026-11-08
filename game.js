/**
 * Broad Board — rotation, win effects, interaction, boot.
 * Depends on BroadBoard.board + BroadBoard.picker and pattern globals.
 */
(function (global) {
  'use strict';

  const BB = (global.BroadBoard = global.BroadBoard || {});
  const B = BB.board;
  const P = BB.picker;

  let animating = false;
  let lastTouchTime = 0;

  const randomizeBtn = document.getElementById('randomize');

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
  BB.spawnConfetti = spawnConfetti;

  function rotateCW(tr, tc) {
    if (animating) return;
    animating = true;
    randomizeBtn.disabled = true;
    P.setPickerEnabled(false);

    const tiles = B.tiles;
    const board = B.board;
    const A = tiles[tr][tc];
    const Btile = tiles[tr][tc + 1];
    const C = tiles[tr + 1][tc];
    const D = tiles[tr + 1][tc + 1];
    const STEP = B.STEP;

    B.measureStep();

    const transition = 'transform 0.28s cubic-bezier(0.33, 1.15, 0.64, 1)';
    A.style.transition = transition;
    Btile.style.transition = transition;
    C.style.transition = transition;
    D.style.transition = transition;

    A.classList.add('animating');
    Btile.classList.add('animating');
    C.classList.add('animating');
    D.classList.add('animating');

    void A.offsetWidth;

    A.style.transform = 'translate(' + STEP + 'px, 0)';
    Btile.style.transform = 'translate(0, ' + STEP + 'px)';
    D.style.transform = 'translate(' + -STEP + 'px, 0)';
    C.style.transform = 'translate(0, ' + -STEP + 'px)';

    setTimeout(function () {
      const tmp = board[tr][tc];
      board[tr][tc] = board[tr + 1][tc];
      board[tr + 1][tc] = board[tr + 1][tc + 1];
      board[tr + 1][tc + 1] = board[tr][tc + 1];
      board[tr][tc + 1] = tmp;

      B.updateFourColors(tr, tc);

      A.style.transition = 'none';
      Btile.style.transition = 'none';
      C.style.transition = 'none';
      D.style.transition = 'none';

      A.style.transform = '';
      Btile.style.transform = '';
      C.style.transform = '';
      D.style.transform = '';

      A.classList.remove('animating');
      Btile.classList.remove('animating');
      C.classList.remove('animating');
      D.classList.remove('animating');

      animating = false;
      randomizeBtn.disabled = false;
      P.setPickerEnabled(true);
      B.checkWin();
    }, 300);
  }

  function handleActivate(r, c) {
    if (animating) return;
    const pair = B.getTopLeft(r, c);
    B.applyHighlight(pair[0], pair[1]);
    rotateCW(pair[0], pair[1]);
  }

  async function setTargetFromId(id) {
    if (typeof loadPattern !== 'function') {
      B.statusEl.textContent = 'Pattern loader not ready';
      return;
    }
    B.statusEl.textContent = 'Loading pattern…';
    try {
      const pat = await loadPattern(id);
      P.currentPatternId = pat.id;
      B.applySize(pat.size);
      if (typeof makeBoardFromPattern === 'function') {
        B.target = makeBoardFromPattern(pat);
      } else if (pat.grid) {
        B.target = pat.grid.map(function (row) { return row.slice(); });
      } else {
        throw new Error('No board factory available');
      }
      B.solved = false;
      document.body.classList.remove('won');
      B.renderTargetPreview();
      P.updatePickerSelection(id);
    } catch (err) {
      console.error(err);
      B.statusEl.textContent = 'Failed to load pattern';
      throw err;
    }
  }

  function selectPattern(id) {
    if (animating || !id || id === P.currentPatternId) {
      P.closePicker();
      return;
    }
    P.closePicker();
    P.setPickerEnabled(false);
    randomizeBtn.disabled = true;
    setTargetFromId(id)
      .then(function () {
        B.setRandom();
        B.render();
        const entry = P.allPatterns.find(function (p) { return p.id === id; });
        const name = entry ? entry.name : id;
        B.statusEl.textContent = 'Target set to “' + name + '” — board randomized';
        B.checkWin();
        requestAnimationFrame(B.measureStep);
      })
      .catch(function () {})
      .finally(function () {
        P.setPickerEnabled(true);
        randomizeBtn.disabled = false;
      });
  }
  BB.selectPattern = selectPattern;

  // ——— Board interaction ———

  B.gridEl.addEventListener('mouseover', function (e) {
    if (animating) return;
    if (Date.now() - lastTouchTime < 500) return;
    const tile = e.target.closest('.tile');
    if (!tile) return;
    const pair = B.getTopLeft(+tile.dataset.r, +tile.dataset.c);
    B.applyHighlight(pair[0], pair[1]);
  });

  B.gridEl.addEventListener('mouseleave', function () {
    if (!animating) B.clearHighlight();
  });

  B.gridEl.addEventListener('click', function (e) {
    if (Date.now() - lastTouchTime < 500) return;
    if (animating) return;
    const tile = e.target.closest('.tile');
    if (!tile) return;
    handleActivate(+tile.dataset.r, +tile.dataset.c);
  });

  B.gridEl.addEventListener('touchstart', function (e) {
    if (animating) return;
    const touch = e.changedTouches[0];
    if (!touch) return;
    const el = document.elementFromPoint(touch.clientX, touch.clientY);
    const tile = el && el.closest ? el.closest('.tile') : null;
    if (!tile || !B.gridEl.contains(tile)) return;

    e.preventDefault();
    lastTouchTime = Date.now();
    handleActivate(+tile.dataset.r, +tile.dataset.c);
  }, { passive: false });

  randomizeBtn.addEventListener('click', function () {
    if (animating) return;
    B.setRandom();
    B.render();
    B.statusEl.textContent = 'Randomized — match the selected target';
    B.checkWin();
  });

  let resizeTimer = null;
  window.addEventListener('resize', function () {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(B.measureStep, 100);
  });

  async function boot() {
    B.statusEl.textContent = 'Loading patterns…';

    if (typeof loadPatternManifest !== 'function' && typeof PATTERNS === 'undefined') {
      await new Promise(function (resolve) {
        let n = 0;
        const t = setInterval(function () {
          n++;
          if (typeof loadPatternManifest === 'function' || typeof PATTERNS !== 'undefined' || n > 40) {
            clearInterval(t);
            resolve();
          }
        }, 25);
      });
    }

    let patterns = (typeof PATTERNS !== 'undefined' && PATTERNS && PATTERNS.length)
      ? PATTERNS.slice()
      : null;

    if (!patterns || !patterns.length) {
      if (typeof loadPatternManifest === 'function') {
        try {
          patterns = await loadPatternManifest();
        } catch (e) { /* fall through */ }
      }
    }

    if (!patterns || !patterns.length) {
      B.statusEl.textContent = typeof loadPatternManifest === 'function'
        ? 'No patterns found'
        : 'Pattern loader failed to load.';
      return;
    }

    try {
      P.buildPicker(patterns);

      const defaultEntry = patterns.find(function (p) {
        return p.id === 'checker-8';
      }) || patterns.find(function (p) {
        return p.size === 8 && p.category === 'black-and-white';
      }) || patterns[0];

      if (!defaultEntry) {
        B.statusEl.textContent = 'No patterns found';
        return;
      }

      await setTargetFromId(defaultEntry.id);
      B.setRandom();
      B.render();
      requestAnimationFrame(function () {
        B.measureStep();
        B.checkWin();
        B.statusEl.textContent = 'Randomized — try to reach “' + defaultEntry.name + '”';
      });

      if (typeof loadPatternManifest === 'function') {
        loadPatternManifest().then(function (upgraded) {
          if (!upgraded || !upgraded.length) return;
          const same = upgraded.length === P.allPatterns.length &&
            upgraded.every(function (p, i) {
              return P.allPatterns[i] && P.allPatterns[i].id === p.id;
            });
          if (same) return;
          const keepId = P.currentPatternId;
          P.buildPicker(upgraded);
          if (keepId) P.updatePickerSelection(keepId);
        }).catch(function () { /* ignore network upgrade failures */ });
      }
    } catch (err) {
      console.error(err);
      const msg = (err && err.message) ? String(err.message) : 'unknown error';
      B.statusEl.textContent = 'Could not start: ' + msg;
    }
  }

  BB.game = {
    get animating() { return animating; },
    rotateCW: rotateCW,
    handleActivate: handleActivate,
    setTargetFromId: setTargetFromId,
    selectPattern: selectPattern,
    boot: boot,
  };

  boot();
})(typeof window !== 'undefined' ? window : globalThis);
