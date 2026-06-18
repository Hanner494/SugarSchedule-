/* Y2K Brown & Mint Timetable: Drag & Drop, Stickers, Edit, Save/Load */

const timetable = document.getElementById('timetable');
const tbody = document.getElementById('timetable-body');

const addRowBtn = document.getElementById('add-row');
const addColBtn = document.getElementById('add-col');
const resetBtn = document.getElementById('reset-layout');
const saveBtn = document.getElementById('save-layout');
const loadBtn = document.getElementById('load-layout');

let dragSrcCell = null;
let draggedStickerData = null;
let activeSticker = null;

function makeCellDraggable(td) {
  td.setAttribute('draggable', 'true');
  td.classList.add('slot');

  td.addEventListener('dragstart', (e) => {
    if (e.target !== td) return;
    dragSrcCell = td;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', td.querySelector('.cell-content')?.innerHTML || '');
    td.style.opacity = '0.6';
  });

  td.addEventListener('dragend', () => {
    td.style.opacity = '1';
    dragSrcCell = null;
    clearDragOver();
  });

  td.addEventListener('dragover', (e) => {
    e.preventDefault();
    if (draggedStickerData) return;
    td.classList.add('drag-over');
    e.dataTransfer.dropEffect = 'move';
  });

  td.addEventListener('dragleave', () => td.classList.remove('drag-over'));

  td.addEventListener('drop', (e) => {
    e.preventDefault();
    td.classList.remove('drag-over');

    if (draggedStickerData) return;

    if (dragSrcCell && dragSrcCell !== td) {
      const srcContent = dragSrcCell.querySelector('.cell-content')?.innerHTML || '';
      const dstContent = td.querySelector('.cell-content')?.innerHTML || '';

      dragSrcCell.querySelector('.cell-content').innerHTML = dstContent;
      td.querySelector('.cell-content').innerHTML = srcContent;

      flash(td);
      flash(dragSrcCell);
    }
  });

  td.addEventListener('dblclick', () => {
    const content = td.querySelector('.cell-content');
    if (content) {
      content.innerHTML = '';
      td.classList.add('cleared');
      setTimeout(() => td.classList.remove('cleared'), 400);
    }
  });
}

function clearDragOver() {
  document.querySelectorAll('.slot.drag-over').forEach(el => el.classList.remove('drag-over'));
}

function createCell(initialText = '') {
  const td = document.createElement('td');
  const div = document.createElement('div');
  div.className = 'cell-content';
  div.contentEditable = 'true';
  div.innerHTML = initialText;
  td.appendChild(div);
  makeCellDraggable(td);
  return td;
}

// Initialize existing cells
document.querySelectorAll('td.slot').forEach(makeCellDraggable);

// Add row
addRowBtn.addEventListener('click', () => {
  const theadCells = timetable.querySelector('thead tr').children.length;
  const tr = document.createElement('tr');

  const th = document.createElement('th');
  th.className = 'time-cell';
  th.contentEditable = 'true';
  th.textContent = 'New Time';
  tr.appendChild(th);

  for (let i = 1; i < theadCells; i++) {
    tr.appendChild(createCell(''));
  }
  tbody.appendChild(tr);
});

// Add column
addColBtn.addEventListener('click', () => {
  const theadRow = timetable.querySelector('thead tr');
  const th = document.createElement('th');
  th.contentEditable = 'true';
  th.textContent = 'New Day';
  theadRow.appendChild(th);

  [...tbody.rows].forEach((row) => {
    row.appendChild(createCell(''));
  });
});

// Reset
resetBtn.addEventListener('click', () => {
  if (!confirm('Reset timetable and remove stickers?')) return;
  document.querySelectorAll('#timetable-body td .cell-content').forEach(div => div.innerHTML = '');
  document.querySelectorAll('.board-sticker').forEach(s => s.remove());
  localStorage.removeItem('y2kTimetable');
});

// Save
saveBtn.addEventListener('click', () => {
  const data = serializeState();
  localStorage.setItem('y2kTimetable', JSON.stringify(data));
  alert('Saved!');
});

// Load
loadBtn.addEventListener('click', () => {
  const raw = localStorage.getItem('y2kTimetable');
  if (!raw) return alert('No saved layout found.');
  const data = JSON.parse(raw);
  restoreState(data);
  alert('Loaded!');
});

function serializeState() {
  const head = [...timetable.querySelectorAll('thead th')].map(th => th.textContent);
  const body = [...tbody.rows].map(row => {
    const time = row.querySelector('.time-cell')?.textContent || '';
    const cells = [...row.querySelectorAll('td .cell-content')].map(div => div.innerHTML);
    return { time, cells };
  });

  const stickers = [...document.querySelectorAll('.board-sticker')].map((el) => {
    return { text: el.textContent, x: parseFloat(el.dataset.x), y: parseFloat(el.dataset.y) };
  });

  return { head, body, stickers, title: document.querySelector('header h1')?.textContent || '' };
}

function restoreState(data) {
  const titleEl = document.querySelector('header h1');
  if (titleEl && data.title) titleEl.textContent = data.title;

  const theadRow = timetable.querySelector('thead tr');
  theadRow.innerHTML = '';
  data.head.forEach((txt, i) => {
    const th = document.createElement('th');
    th.textContent = txt;
    if (i === 0) th.className = 'corner-cell';
    th.contentEditable = true;
    theadRow.appendChild(th);
  });

  tbody.innerHTML = '';
  data.body.forEach((row) => {
    const tr = document.createElement('tr');
    const th = document.createElement('th');
    th.className = 'time-cell';
    th.contentEditable = true;
    th.textContent = row.time || '';
    tr.appendChild(th);

    row.cells.forEach((html) => {
      tr.appendChild(createCell(html));
    });

    tbody.appendChild(tr);
  });

  document.querySelectorAll('.board-sticker').forEach(s => s.remove());

  const board = document.querySelector('.board');
  if (Array.isArray(data.stickers)) {
    data.stickers.forEach(s => {
      const el = createBoardSticker(s.text, s.x, s.y);
      board.appendChild(el);
    });
  }
}

/* Sticker panel → board */
document.querySelectorAll('.sticker').forEach((sticker) => {
  sticker.addEventListener('dragstart', (e) => {
    draggedStickerData = e.target.dataset.sticker || e.target.textContent.trim();
    e.dataTransfer.setData('text/plain', draggedStickerData);
    e.dataTransfer.effectAllowed = 'copy';
  });
  sticker.addEventListener('dragend', () => {
    draggedStickerData = null;
  });
});

const board = document.querySelector('.board');
board.addEventListener('dragover', (e) => {
  if (draggedStickerData) {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'copy';
  }
});

board.addEventListener('drop', (e) => {
  if (!draggedStickerData) return;
  e.preventDefault();

  const rect = board.getBoundingClientRect();
  const x = ((e.clientX - rect.left) / rect.width) * 100;
  const y = ((e.clientY - rect.top) / rect.height) * 100;

  const el = createBoardSticker(draggedStickerData, x, y);
  board.appendChild(el);

  draggedStickerData = null;
});

function createBoardSticker(text, xPercent, yPercent) {
  const el = document.createElement('div');
  el.className = 'board-sticker';
  el.textContent = text;
  el.style.left = `${xPercent}%`;
  el.style.top = `${yPercent}%`;
  el.dataset.x = xPercent;
  el.dataset.y = yPercent;

  enableStickerDrag(el);
  enableStickerSelect(el);

  el.addEventListener('dblclick', () => el.remove());

  return el;
}

function enableStickerSelect(el) {
  el.addEventListener('click', () => {
    if (activeSticker && activeSticker !== el) {
      activeSticker.classList.remove('selected');
    }
    activeSticker = el;
    el.classList.toggle('selected');
  });
}

function enableStickerDrag(el) {
  let isDragging = false;
  let startX = 0, startY = 0;

  el.addEventListener('mousedown', (e) => {
    isDragging = true;
    startX = e.clientX;
    startY = e.clientY;
    document.body.style.userSelect = 'none';
  });

  document.addEventListener('mousemove', (e) => {
    if (!isDragging) return;
    const rect = board.getBoundingClientRect();
    const dx = e.clientX - startX;
    const dy = e.clientY - startY;

    const currentLeft = parseFloat(el.style.left);
    const currentTop = parseFloat(el.style.top);

    const newLeftPx = (currentLeft / 100) * rect.width + dx;
    const newTopPx = (currentTop / 100) * rect.height + dy;

    const newLeft = Math.max(0, Math.min(100, (newLeftPx / rect.width) * 100));
    const newTop = Math.max(0, Math.min(100, (newTopPx / rect.height) * 100));

    el.style.left = `${newLeft}%`;
    el.style.top = `${newTop}%`;
    el.dataset.x = newLeft;
    el.dataset.y = newTop;

    startX = e.clientX;
    startY = e.clientY;
  });

  document.addEventListener('mouseup', () => {
    if (isDragging) {
      isDragging = false;
      document.body.style.userSelect = '';
    }
  });
}

/* Keep contentEditable tidy */
document.addEventListener('keydown', (e) => {
  if (e.target && e.target.classList && e.target.classList.contains('cell-content')) {
    if (e.key === 'Enter') {
      e.preventDefault();
      document.execCommand('insertLineBreak');
    }
  }
});

function flash(el) {
  el.style.transition = 'background 0.2s';
  const orig = el.style.background;
  el.style.background = '#eafff3';
  setTimeout(() => { el.style.background = orig || '#fff'; }, 180);
}

/* Auto-load if saved exists */
window.addEventListener('DOMContentLoaded', () => {
  const raw = localStorage.getItem('y2kTimetable');
  if (raw) {
    try {
      const data = JSON.parse(raw);
      restoreState(data);
    } catch (e) {
      console.warn('Failed to restore saved timetable:', e);
    }
  }
});
