/**
 * Broad Board — pattern picker UI (custom select with lazy thumbnails).
 * Depends on BroadBoard.board and pattern globals from patterns-core.js.
 */
(function (global) {
  'use strict';

  const BB = (global.BroadBoard = global.BroadBoard || {});
  const B = BB.board;

  let allPatterns = [];
  let pickerOpen = false;
  let currentPatternId = null;
  let thumbObserver = null;

  const pickerRoot = document.getElementById('patternPicker');
  const pickerBtn = document.getElementById('patternPickerBtn');
  const pickerLabel = document.getElementById('patternPickerLabel');
  const pickerThumb = document.getElementById('patternPickerThumb');
  const pickerMenu = document.getElementById('patternPickerMenu');

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
    if (pickerOpen || (BB.game && BB.game.animating)) return;
    pickerOpen = true;
    pickerMenu.hidden = false;
    pickerBtn.setAttribute('aria-expanded', 'true');
    pickerRoot.classList.add('open');

    observeThumbs();

    if (!thumbObserver && typeof drawPatternThumb === 'function') {
      const undrawn = pickerMenu.querySelectorAll('canvas[data-pattern-id]:not([data-drawn="1"])');
      let i = 0;
      function paintBatch() {
        const end = Math.min(i + 12, undrawn.length);
        for (; i < end; i++) ensureThumbDrawn(undrawn[i]);
        if (i < undrawn.length) requestAnimationFrame(paintBatch);
      }
      requestAnimationFrame(paintBatch);
    }

    const selected = pickerMenu.querySelector('.pattern-option.selected');
    if (selected) {
      selected.scrollIntoView({ block: 'nearest' });
      const selCanvas = selected.querySelector('canvas[data-pattern-id]');
      if (selCanvas) ensureThumbDrawn(selCanvas);
    }
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

  function ensureThumbDrawn(canvas) {
    if (!canvas || canvas.dataset.drawn === '1') return;
    if (typeof drawPatternThumb !== 'function') return;
    const id = canvas.dataset.patternId;
    if (!id) return;
    drawPatternThumb(canvas, id, 24);
    canvas.dataset.drawn = '1';
  }

  function setupThumbObserver() {
    if (thumbObserver) {
      thumbObserver.disconnect();
      thumbObserver = null;
    }
    if (typeof IntersectionObserver === 'undefined') return;
    thumbObserver = new IntersectionObserver(function (entries) {
      for (let i = 0; i < entries.length; i++) {
        const e = entries[i];
        if (!e.isIntersecting) continue;
        const canvas = e.target;
        ensureThumbDrawn(canvas);
        thumbObserver.unobserve(canvas);
      }
    }, {
      root: pickerMenu,
      rootMargin: '80px 0px',
      threshold: 0.01,
    });
  }

  function observeThumbs() {
    if (!thumbObserver) return;
    const canvases = pickerMenu.querySelectorAll('canvas[data-pattern-id]:not([data-drawn="1"])');
    for (let i = 0; i < canvases.length; i++) {
      thumbObserver.observe(canvases[i]);
    }
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
            if (typeof BB.selectPattern === 'function') BB.selectPattern(p.id);
          });
          frag.appendChild(btn);
        }
      }

      addGroup(sizeLabel + ' — Black & White', groups['black-and-white']);
      addGroup(sizeLabel + ' — Color', groups.color);
    }

    pickerMenu.appendChild(frag);
    setupThumbObserver();
    observeThumbs();
  }

  pickerBtn.addEventListener('click', function (e) {
    e.stopPropagation();
    if ((BB.game && BB.game.animating) || pickerBtn.disabled) return;
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

  BB.picker = {
    get allPatterns() { return allPatterns; },
    get currentPatternId() { return currentPatternId; },
    set currentPatternId(v) { currentPatternId = v; },
    get open() { return pickerOpen; },
    setPickerEnabled: setPickerEnabled,
    closePicker: closePicker,
    openPicker: openPicker,
    togglePicker: togglePicker,
    updatePickerSelection: updatePickerSelection,
    buildPicker: buildPicker,
  };
})(typeof window !== 'undefined' ? window : globalThis);
