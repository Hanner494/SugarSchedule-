// ---------- Konfiguration ----------
const DAYS = ["Mo", "Di", "Mi", "Do", "Fr"];
const DEFAULT_TIMES = [
  "08:00–08:45",
  "08:50–09:35",
  "09:50–10:35",
  "10:40–11:25",
  "11:30–12:15",
  "12:20–13:05"
];

const LS_CARDS = "sp_cards_v1";
const LS_TIMES = "sp_times_v1";
const LS_VAC  = "sp_vacation_date_v1";

// ---------- State ----------
let TIMES = loadTimes() || [...DEFAULT_TIMES];
let cards = loadCards();
let currentEditId = null;
let draggingSticker = null; // Emoji aus dem Regal

// ---------- Seed-Daten ----------
if (!cards.length) {
  cards = [
    mkCard("Mathe", "Fr. Müller", "201", "normal", false, 0, 0),
    mkCard("Deutsch", "Hr. König", "105", "substitute", false, 0, 1),
    mkCard("Bio", "Fr. Li", "Bi2", "normal", false, 1, 2),
    mkCard("Englisch", "Fr. Brown", "301", "canceled", false, 2, 3),
    mkCard("Sport", "Hr. Novak", "Halle", "normal", true, 3, 4),
    mkCard("Kunst", "Fr. Rossi", "Kunstraum", "normal", false, 4, 0),
  ];
  saveCards();
}

// ---------- Init ----------
document.addEventListener("DOMContentLoaded", () => {
  // Kopfdatum/Zeit
  updateNow();
  setInterval(updateNow, 1000);

  // Grid aufbauen + rendern
  buildGrid();
  renderAll();

  // Buttons
  qs("#btnAddLesson").addEventListener("click", onAddCard);
  qs("#btnReset").addEventListener("click", onReset);

  // Edit-Modal
  qs("#btnCloseEdit").addEventListener("click", closeEdit);
  qs("#btnSaveEdit").addEventListener("click", onSaveEdit);
  qs("#btnDelete").addEventListener("click", onDeleteCard);

  // Times modal
  qs("#btnEditTimes").addEventListener("click", openTimesEditor);
  qs("#btnTimesCancel").addEventListener("click", closeTimes);
  qs("#btnTimesSave").addEventListener("click", saveTimesFromEditor);
  qs("#btnTimesAdd").addEventListener("click", addTimesRow);

  // Sticker Shelf Drag
  initStickerShelf();

  // Pflanze und Ferien
  const vacInput = qs("#vacationDate");
  const savedVac = localStorage.getItem(LS_VAC);
  if (savedVac) vacInput.value = savedVac;
  vacInput.addEventListener("change", updateVacation);
  updateVacation();
});

// ---------- Helpers ----------
function qs(sel, root=document) { return root.querySelector(sel); }
function qsa(sel, root=document) { return Array.from(root.querySelectorAll(sel)); }
function uid() { return "c_" + Math.random().toString(36).slice(2, 10); }
function mkCard(subject, teacher, room, status, hasTest, dayIndex, timeIndex) {
  return { id: uid(), subject, teacher, room, status, hasTest, dayIndex, timeIndex, stickers: [] };
}

// ---------- Zeit/Datum ----------
function updateNow() {
  const now = new Date();
  qs("#nowTime").textContent = now.toLocaleTimeString("de-DE");
  qs("#todayDate").textContent = now.toLocaleDateString("de-DE", { weekday: "long", year: "numeric", month: "2-digit", day: "2-digit" });
}

// ---------- Grid ----------
function buildGrid() {
  const grid = qs("#grid");
  // Kopfzeile (6 Zellen) existiert bereits in HTML. Wir fügen für jede Zeit eine Reihe.
  TIMES.forEach((t, ti) => {
    // Zeit-Spalte
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

      // Dropzone Events
      dz.addEventListener("dragover", onSlotDragOver);
      dz.addEventListener("dragleave", onSlotDragLeave);
      dz.addEventListener("drop", onSlotDrop);

      cell.appendChild(dz);
      grid.appendChild(cell);
    }
  });
}

function renderAll() {
  // Dropzonen leeren
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

  el.addEventListener("dragstart", onCardDragStart);
  el.addEventListener("dblclick", () => openEdit(card.id));

  // Header
  const header = document.createElement("div");
  header.className = "card-header";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = card.subject || "Fach";

  // Badges
  const badges = document.createElement("div");
  badges.className = "badges";
  const b = document.createElement("span");
  b.className = "badge " + (card.status || "normal");
  b.textContent = statusLabel(card.status);
  badges.appendChild(b);

  if (card.hasTest) {
    const tf = document.createElement("span");
    tf.className = "test-flag";
    tf.textContent = "📝";
    title.appendChild(tf);
  }

  header.appendChild(title);
  header.appendChild(badges);

  // Meta
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

  // Sticker-Leiste
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

  el.appendChild(header);
  el.appendChild(meta);
  el.appendChild(stickerBar);

  // Sticker-Drop (auf Karte)
  el.addEventListener("dragover", (e) => {
    if (draggingSticker) e.preventDefault();
  });
  el.addEventListener("drop", (e) => {
    if (!draggingSticker) return;
    e.preventDefault();
    addStickerToCard(card.id, draggingSticker);
    draggingSticker = null;
  });

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

// ---------- Drag & Drop: Karten ----------
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
  const id = e.dataTransfer.getData("text/plain") || dragId;
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

// ---------- Sticker Shelf ----------
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
  set.add(emoji); // doppelte vermeiden
  cards[idx].stickers = Array.from(set);
  saveCards();
  renderAll();
}

// ---------- Bearbeiten ----------
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

// ---------- Add/Reset ----------
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

// ---------- Zeiten-Editor ----------
function openTimesEditor() {
  const modal = qs("#timesModal");
  const editor = qs("#timesEditor");
  editor.innerHTML = "";

  TIMES.forEach((t) => editor.appendChild(timesRow(t)));

  modal.classList.remove("hidden");
}
function closeTimes() {
  qs("#timesModal").classList.add("hidden");
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
  qs("#timesEditor").appendChild(timesRow(""));
}
function saveTimesFromEditor() {
  const vals = qsa(".time-input", qs("#timesEditor")).map(i => i.value.trim()).filter(Boolean);
  if (!vals.length) {
    alert("Bitte mindestens eine Zeit eintragen.");
    return;
  }
  TIMES = vals;
  saveTimes(vals);

  // Grid neu aufbauen
  const grid = qs("#grid");
  while (grid.children.length > 6) grid.removeChild(grid.lastChild); // alles nach Kopf
  buildGrid();
  // Re-map ggf. timeIndex > neues TIMES.length abfangen:
  cards.forEach(c => { if (c.timeIndex >= TIMES.length) c.timeIndex = TIMES.length - 1; });
  saveCards();
  renderAll();

  closeTimes();
}

// ---------- Ferien/Pflanze ----------
function updateVacation() {
  const input = qs("#vacationDate");
  const dStr = input.value || "";
  if (dStr) localStorage.setItem(LS_VAC, dStr);

  const stem = qs("#plantStem");
  const flower = qs("#plantFlower");
  const daysEl = qs("#daysToVacation");

  const today = new Date();
  const vac = dStr ? new Date(dStr + "T00:00:00") : null;

  if (!vac) {
    stem.style.height = "16px";
    flower.style.transform = "translateY(0)";
    daysEl.textContent = "–";
    return;
  }

  const diffDays = Math.ceil((vac - today) / (1000 * 60 * 60 * 24));
  daysEl.textContent = Math.max(diffDays, 0);

  const windowDays = 42; // 6 Wochen Fenster
  const clamped = Math.max(0, Math.min(windowDays, diffDays));
  const progress = 1 - (clamped / windowDays); // 0..1 (nahe = größer)

  // Höhe 16..140px
  const height = 16 + Math.round(progress * 124);
  stem.style.height = height + "px";
  flower.style.transform = `translateY(${Math.round(progress * -10)}px)`;
}

// ---------- Storage ----------
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
