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

  // NOTE: full file content truncated in this thought - need full push
}());
