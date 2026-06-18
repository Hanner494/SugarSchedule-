// ===================== Konfiguration =====================
const DAYS = ["Mo", "Di", "Mi", "Do", "Fr"];
const DEFAULT_TIMES = [
  "08:00–08:45",
  "08:50–09:35",
  "09:50–10:35",
  "10:40–11:25",
  "11:30–12:15",
  "12:20–13:05"
];

const LS_CARDS = "cozy_cards_v1";
const LS_TIMES = "cozy_times_v1";
const LS_VAC  = "cozy_vacation_date_v1";

// ===================== State =====================
let TIMES = loadTimes() || [...DEFAULT_TIMES];
let cards = loadCards();
let currentEditId = null;
let draggingSticker = null; // Emoji-Text aus dem Sticker-Regal

// Falls noch keine Karten existieren: Seed-Beispiele
if (!cards.length) {
  cards = [
    mkCard("Mathe", "Fr. Müller", "201", "normal", false, 0, 0),
    mkCard("Deutsch", "Hr. König", "105", "substitute", false, 0, 1),
    mkCard("Biologie", "Fr. Li", "Bio2", "normal", false, 1, 2),
    mkCard("Englisch", "Fr. Brown", "301", "canceled", false, 2, 3),
    mkCard("Sport", "Hr. Novak", "Halle", "normal", true, 3, 4),
    mkCard("Kunst", "Fr. Rossi", "Kunstraum", "normal", false, 4, 0),
  ];
  saveCards();
}

// ===================== Init =====================
document.addEventListener("DOMContentLoaded", () => {
  // Zeit/Datum
  updateNow();
  setInterval(updateNow, 1000);

  // Grid aufbauen und rendern
  buildGrid();
  renderAll();

  // Header-Buttons
  on("#btnAddLesson", "click", onAddCard);
  on("#btnReset", "click", onReset);

  // Edit-Modal
  on("#btnCloseEdit", "click", closeEdit);
  on("#btnSaveEdit", "click", onSaveEdit);
  on("#btnDelete", "click", onDeleteCard);

  // Zeiten-Modal
  on("#btnEditTimes", "click", openTimesEditor);
  on("#btnTimesCancel", "click", closeTimes);
  on("#btnTimesSave", "click", saveTimesFromEditor);
  on("#btnTimesAdd", "click", addTimesRow);

  // Sticker-Regal
  initStickerShelf();

  // Ferien/Pflanze
  const vacInput = qs("#vacationDate");
  const savedVac = localStorage.getItem(LS_VAC);
  if (savedVac) vacInput.value = savedVac;
  vacInput.addEventListener("change", updateVacation);
  updateVacation();
});

// ===================== Helpers =====================
function qs(sel, root=document) { return root.querySelector(sel); }
function qsa(sel, root=document) { return Array.from(root.querySelectorAll(sel)); }
function on(sel, evt, handler, root=document) { const el = qs(sel, root); if (el) el.addEventListener(evt, handler); }
function uid() { return "c_" + Math.random().toString(36).slice(2, 10); }

function mkCard(subject, teacher, room, status, hasTest, dayIndex, timeIndex) {
  return { id: uid(), subject, teacher, room, status, hasTest, dayIndex, timeIndex, stickers: [] };
}

// ===================== Datum/Uhrzeit =====================
function updateNow() {
  const now = new Date();
  const time = now.toLocaleTimeString("de-DE");
  const date = now.toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "2-digit", day: "2-digit" });
  const tEl = qs("#nowTime");
  const dEl = qs("#todayDate");
  if (tEl) tEl.textContent = time;
  if (dEl) dEl.textContent = date;
}

// ===================== Grid und Rendering =====================
function buildGrid() {
  const grid = qs("#grid");
  if (!grid) return;

  // In index.html existieren bereits 6 Kopfzellen (Zeit + Mo-Fr).
  // Für jede Zeit fügen wir 1 Zeitspalte + 5 Tagesspalten hinzu.
  TIMES.forEach((t, ti) => {
    // Zeit-Spalte (links)
    const timeCell = document.createElement("div");
    timeCell.className = "cell cell--time";
    timeCell.textContent = t;
    grid.appendChild(timeCell);

    // 5 Tages-Spalten
    for (let d = 0; d < DAYS.length; d++) {
      const cell = document.createElement("div");
      cell.className = "cell";

      const dz = document.createElement("div");
      dz.className = "slot-dropzone";
      dz.dataset.dayIndex = d;
      dz.dataset.timeIndex = ti;

      dz.addEventListener("dragover", onSlotDragOver);
      dz.addEventListener("dragleave", onSlotDragLeave);
      dz.addEventListener("drop", onSlotDrop);

      cell.appendChild(dz);
      grid.appendChild(cell);
    }
  });
}

function renderAll() {
  // Alle Dropzonen leeren
  qsa(".slot-dropzone").forEach(dz => dz.innerHTML = "");

  // Karten platzieren
  cards.forEach(card => {
    const dz = findDropzone(card.dayIndex, card.timeIndex);
    if (!dz) return;
    dz.appendChild(createCardEl(card));
  });
}

function createCardEl(card) {
  const el = document.createElement("div");
  el.className = "card";
  el.draggable = true;
  el.dataset.id = card.id;

  // Draggen der Karte
  el.addEventListener("dragstart", onCardDragStart);
  // Bearbeiten per Doppelklick
  el.addEventListener("dblclick", () => openEdit(card.id));

  // Kopf mit Titel+Badge
  const header = document.createElement("div");
  header.className = "card-header";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = card.subject || "Fach";

  if (card.hasTest) {
    const tf = document.createElement("span");
    tf.className = "test-flag";
    tf.textContent = "📝";
    title.appendChild(tf);
  }

  const badges = document.createElement("div");
  badges.className = "badges";
  const badge = document.createElement("span");
  badge.className = "badge " + (card.status || "normal");
  badge.textContent = statusLabel(card.status);
  badges.appendChild(badge);

  header.appendChild(title);
  header.appendChild(badges);

  // Meta Infos
  const meta = document.createElement("div");
  meta.className = "card-meta";
  const t = document.createElement("span");
  t.className = "teacher";
  t.textContent = card.teacher || "-";
  const r = document.createElement("span");
  r.className = "room";
  r.textContent = card.room || "-";
  const s = document.createElement("span");
  s.className = "status";
  s.textContent = (card.status === "substitute" ? "Vertretung" : card.status === "canceled" ? "Ausfall" : "Normal");
  meta.appendChild(t);
  meta.appendChild(r);
  meta.appendChild(s);

  // Sticker-Leiste (bereits aufgeklebte)
  const stickerBar = document.createElement("div");
  stickerBar.className = "card-stickers";
  (card.stickers || []).forEach(emoji => {
    const chip = document.createElement("span");
    chip.className = "card-sticker";
    chip.textContent = emoji;
    chip.title = "Sticker";
    chip.draggable = false;
    stickerBar.appendChild(chip);
  });

  // Sticker-Drop auf Karte
  el.addEventListener("dragover", (e) => {
    if (draggingSticker) e.preventDefault();
  });
  el.addEventListener("drop", (e) => {
    if (!draggingSticker) return;
    e.preventDefault();
    addStickerToCard(card.id, draggingSticker);
    draggingSticker = null;
  });

  el.appendChild(header);
  el.appendChild(meta);
  el.appendChild(stickerBar);

  return el;
}

function statusLabel(s) {
  switch (s) {
    case "substitute": return "Vertretung";
    case "canceled": return "Ausfall";
    default: return "Normal";
  }
}

function findDropzone(dayIndex, timeIndex) {
  return document.querySelector(`.slot-dropzone[data-day-index="${dayIndex}"][data-time-index="${timeIndex}"]`);
}

// ===================== Drag & Drop: Karten =====================
let dragId = null;
function onCardDragStart(e) {
  dragId = e.currentTarget.dataset.id;
  e.dataTransfer.setData("text/plain", dragId);
  e.dataTransfer.effectAllowed = "move";
}

function onSlotDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add("dragover");
}
function onSlotDragLeave(e) {
  e.currentTarget.classList.remove("dragover");
}
function onSlotDrop(e) {
  e.preventDefault();
  const dz = e.currentTarget;
  dz.classList.remove("dragover");

  // Sticker oder Karte?
  const dropped = e.dataTransfer.getData("text/plain");
  if (draggingSticker && dropped === draggingSticker) {
    // Sticker auf Slot droppen: ignorieren (nur auf Karten erlaubt)
    draggingSticker = null;
    return;
  }

  const id = dropped || dragId;
  const dayIndex = parseInt(dz.dataset.dayIndex, 10);
  const timeIndex = parseInt(dz.dataset.timeIndex, 10);
  const idx = cards.findIndex(c => c.id === id);
  if (idx >= 0) {
    cards[idx].dayIndex = dayIndex;
    cards[idx].timeIndex = timeIndex;
    saveCards();
    renderAll();
  }
}

// ===================== Sticker-Regal =====================
function initStickerShelf() {
  qsa(".sticker").forEach(s => {
    s.addEventListener("dragstart", (e) => {
      draggingSticker = e.target.textContent.trim();
      e.dataTransfer.setData("text/plain", draggingSticker);
      e.dataTransfer.effectAllowed = "copy";
    });
    s.addEventListener("dragend", () => {
      draggingSticker = null;
    });
  });
}

function addStickerToCard(cardId, emoji) {
  const idx = cards.findIndex(c => c.id === cardId);
  if (idx < 0) return;
  const set = new Set(cards[idx].stickers || []);
  set.add(emoji); // Duplikate vermeiden
  cards[idx].stickers = Array.from(set);
  saveCards();
  renderAll();
}

// ===================== Bearbeiten (Modal) =====================
function openEdit(id) {
  currentEditId = id;
  const card = cards.find(c => c.id === id);
  if (!card) return;

  qs("#inpSubject").value = card.subject || "";
  qs("#inpTeacher").value = card.teacher || "";
  qs("#inpRoom").value = card.room || "";
  qs("#inpStatus").value = card.status || "normal";
  qs("#inpHasTest").checked = !!card.hasTest;

  qs("#editModal").classList.remove("hidden");
}
function closeEdit() {
  currentEditId = null;
  qs("#editModal").classList.add("hidden");
}

function onSaveEdit() {
  if (!currentEditId) return;
  const idx = cards.findIndex(c => c.id === currentEditId);
  if (idx < 0) return;

  cards[idx].subject = qs("#inpSubject").value.trim();
  cards[idx].teacher = qs("#inpTeacher").value.trim();
  cards[idx].room    = qs("#inpRoom").value.trim();
  cards[idx].status  = qs("#inpStatus").value;
  cards[idx].hasTest = qs("#inpHasTest").checked;

  saveCards();
  renderAll();
  closeEdit();
}

function onDeleteCard() {
  if (!currentEditId) return;
  cards = cards.filter(c => c.id !== currentEditId);
  saveCards();
  renderAll();
  closeEdit();
}

// ===================== Hinzufügen/Zurücksetzen =====================
function onAddCard() {
  const newCard = mkCard("Neues Fach", "", "", "normal", false, 0, 0);
  cards.push(newCard);
  saveCards();
  renderAll();
}

function onReset() {
  if (!confirm("Alles zurücksetzen?")) return;
  localStorage.removeItem(LS_CARDS);
  localStorage.removeItem(LS_TIMES);
  localStorage.removeItem(LS_VAC);
  TIMES = [...DEFAULT_TIMES];
  cards = [];
  saveCards();
  location.reload();
}

// ===================== Zeiten-Editor =====================
function openTimesEditor() {
  const modal = qs("#timesModal");
  const editor = qs("#timesEditor");
  if (!modal || !editor) return;

  editor.innerHTML = "";
  TIMES.forEach((t) => editor.appendChild(timesRow(t)));

  modal.classList.remove("hidden");
}
function closeTimes() {
  const modal = qs("#timesModal");
  if (modal) modal.classList.add("hidden");
}
function timesRow(value="") {
  const row = document.createElement("div");
  row.className = "times-row";
  row.innerHTML = `
    <input type="text" class="time-input" placeholder="z. B. 08:00–08:45" value="${value}">
    <button class="btn btn-light btn-remove" title="Zeile entfernen">–</button>
  `;
  const btn = row.querySelector(".btn-remove");
  btn.addEventListener("click", () => row.remove());
  return row;
}
function addTimesRow() {
  const editor = qs("#timesEditor");
  if (editor) editor.appendChild(timesRow(""));
}
function saveTimesFromEditor() {
  const editor = qs("#timesEditor");
  if (!editor) return;
  const vals = qsa(".time-input", editor).map(i => i.value.trim()).filter(Boolean);
  if (!vals.length) {
    alert("Bitte mindestens eine Zeit eintragen.");
    return;
  }
  TIMES = vals;
  saveTimes(vals);

  // Grid neu aufbauen: alles nach den 6 Kopfzellen entfernen
  const grid = qs("#grid");
  if (grid) {
    while (grid.children.length > 6) grid.removeChild(grid.lastChild);
    buildGrid();
  }

  // Karten anpassen, falls timeIndex out-of-range ist
  cards.forEach(c => { if (c.timeIndex >= TIMES.length) c.timeIndex = TIMES.length - 1; });
  saveCards();
  renderAll();

  closeTimes();
}

// ===================== Ferien/Pflanze =====================
function updateVacation() {
  const input = qs("#vacationDate");
  const dStr = input ? input.value : "";
  if (dStr) localStorage.setItem(LS_VAC, dStr);

  const stem = qs("#plantStem");
  const flower = qs("#plantFlower");
  const daysEl = qs("#daysToVacation");

  const today = new Date();
  const vac = dStr ? new Date(dStr + "T00:00:00") : null;

  if (!vac) {
    if (stem) stem.style.height = "16px";
    if (flower) flower.style.transform = "translateY(0)";
    if (daysEl) daysEl.textContent = "–";
    return;
  }

  const diffDays = Math.ceil((vac - today) / (1000 * 60 * 60 * 24));
  if (daysEl) daysEl.textContent = Math.max(diffDays, 0);

  const windowDays = 42; // 6 Wochen
  const clamped = Math.max(0, Math.min(windowDays, diffDays));
  const progress = 1 - (clamped / windowDays); // 0..1 (je näher, desto größer)

  // Höhe 16..140px
  const height = 16 + Math.round(progress * 124);
  if (stem) stem.style.height = height + "px";
  if (flower) flower.style.transform = `translateY(${Math.round(progress * -10)}px)`;
}

// ===================== Storage =====================
function loadCards() {
  try { return JSON.parse(localStorage.getItem(LS_CARDS) || "[]"); } catch (_) { return []; }
}
function saveCards() {
  localStorage.setItem(LS_CARDS, JSON.stringify(cards));
}
function loadTimes() {
  try { return JSON.parse(localStorage.getItem(LS_TIMES) || "[]"); } catch (_) { return null; }
}
function saveTimes(arr) {
  localStorage.setItem(LS_TIMES, JSON.stringify(arr));
}
