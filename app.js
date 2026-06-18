// ------- Konfiguration -------
const DAYS = ["Mo", "Di", "Mi", "Do", "Fr"];
const TIMES = [
  "08:00–08:45",
  "08:50–09:35",
  "09:50–10:35",
  "10:40–11:25",
  "11:30–12:15",
  "12:20–13:05"
];

// Seed-Daten für Demo – werden beim ersten Start in LocalStorage gelegt
const SEED_CARDS = [
  // dayIndex: 0=Mo, 4=Fr | timeIndex: 0..(TIMES.length-1)
  { id: uid(), dayIndex: 0, timeIndex: 0, subject: "Mathe", teacher: "Fr. Müller", room: "201", status: "normal" },
  { id: uid(), dayIndex: 0, timeIndex: 1, subject: "Deutsch", teacher: "Hr. König", room: "105", status: "substitute" },
  { id: uid(), dayIndex: 1, timeIndex: 2, subject: "Bio", teacher: "Fr. Li", room: "Bi2", status: "normal" },
  { id: uid(), dayIndex: 2, timeIndex: 3, subject: "Englisch", teacher: "Fr. Brown", room: "301", status: "canceled" },
  { id: uid(), dayIndex: 3, timeIndex: 4, subject: "Sport", teacher: "Hr. Novak", room: "Halle", status: "normal" },
  { id: uid(), dayIndex: 4, timeIndex: 0, subject: "Kunst", teacher: "Fr. Rossi", room: "Kunstraum", status: "normal" }
];

const LS_KEY = "ss_cards_v1";

// ------- State -------
let cards = loadCards();
let currentEditId = null;

// ------- Init -------
document.addEventListener("DOMContentLoaded", () => {
  buildGrid();
  renderAll();

  document.getElementById("btnAdd").addEventListener("click", onAddCard);
  document.getElementById("btnReset").addEventListener("click", onReset);

  // Edit-Modal
  document.getElementById("btnCloseEdit").addEventListener("click", closeEdit);
  document.getElementById("btnSaveEdit").addEventListener("click", onSaveEdit);
  document.getElementById("btnDelete").addEventListener("click", onDeleteCard);
});

// ------- Grid aufbauen -------
function buildGrid() {
  const grid = document.getElementById("grid");

  // Bereits Kopfzeile vorhanden: Zeit, Mo..Fr (6 Zellen)
  // Wir fügen für jede Zeit eine neue Reihe: linke Zeit-Zelle + 5 Dropzonen
  TIMES.forEach((t) => {
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
      dz.dataset.timeIndex = TIMES.indexOf(t);

      // Drag & Drop Events
      dz.addEventListener("dragover", onDragOver);
      dz.addEventListener("dragleave", onDragLeave);
      dz.addEventListener("drop", onDrop);

      cell.appendChild(dz);
      grid.appendChild(cell);
    }
  });
}

// ------- Render -------
function renderAll() {
  // Alle Dropzonen leeren
  document.querySelectorAll(".slot-dropzone").forEach(dz => dz.innerHTML = "");

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

  el.addEventListener("dragstart", onDragStart);
  el.addEventListener("dblclick", () => openEdit(card.id));

  const header = document.createElement("div");
  header.className = "card-header";

  const title = document.createElement("div");
  title.className = "card-title";
  title.textContent = card.subject;

  const badges = document.createElement("div");
  badges.className = "badges";
  const b = document.createElement("span");
  b.className = "badge " + (card.status || "normal");
  b.textContent = statusLabel(card.status);
  badges.appendChild(b);

  header.appendChild(title);
  header.appendChild(badges);

  const meta = document.createElement("div");
  meta.className = "card-meta";
  const t = document.createElement("span");
  t.textContent = `👩‍🏫 ${card.teacher || "-"}`;
  const r = document.createElement("span");
  r.textContent = `🏫 ${card.room || "-"}`;
  meta.appendChild(t);
  meta.appendChild(r);

  el.appendChild(header);
  el.appendChild(meta);
  return el;
}

function statusLabel(s) {
  switch (s) {
    case "substitute": return "Vertretung";
    case "canceled": return "Ausfall";
    default: return "Normal";
  }
}

// ------- Drag & Drop -------
let dragId = null;

function onDragStart(e) {
  dragId = e.currentTarget.dataset.id;
  e.dataTransfer.setData("text/plain", dragId);
  e.dataTransfer.effectAllowed = "move";
}

function onDragOver(e) {
  e.preventDefault();
  e.currentTarget.classList.add("dragover");
}
function onDragLeave(e) {
  e.currentTarget.classList.remove("dragover");
}
function onDrop(e) {
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

// ------- Editieren -------
function openEdit(id) {
  currentEditId = id;
  const card = cards.find(c => c.id === id);
  if (!card) return;

  document.getElementById("inpSubject").value = card.subject || "";
  document.getElementById("inpTeacher").value = card.teacher || "";
  document.getElementById("inpRoom").value = card.room || "";
  document.getElementById("inpStatus").value = card.status || "normal";

  document.getElementById("editModal").classList.remove("hidden");
}
function closeEdit() {
  currentEditId = null;
  document.getElementById("editModal").classList.add("hidden");
}
function onSaveEdit() {
  if (!currentEditId) return;
  const idx = cards.findIndex(c => c.id === currentEditId);
  if (idx < 0) return;

  cards[idx].subject = document.getElementById("inpSubject").value.trim();
  cards[idx].teacher = document.getElementById("inpTeacher").value.trim();
  cards[idx].room    = document.getElementById("inpRoom").value.trim();
  cards[idx].status  = document.getElementById("inpStatus").value;

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

// ------- Add/Reset -------
function onAddCard() {
  // Standard: am Montag erste Stunde
  const newCard = {
    id: uid(),
    dayIndex: 0,
    timeIndex: 0,
    subject: "Neues Fach",
    teacher: "",
    room: "",
    status: "normal"
  };
  cards.push(newCard);
  saveCards();
  renderAll();
}
function onReset() {
  if (!confirm("Alles auf Ausgangszustand zurücksetzen?")) return;
  localStorage.removeItem(LS_KEY);
  cards = loadCards();
  renderAll();
}

// ------- Utilities -------
function findDropzone(dayIndex, timeIndex) {
  return document.querySelector(`.slot-dropzone[data-day-index="${dayIndex}"][data-time-index="${timeIndex}"]`);
}

function loadCards() {
  const s = localStorage.getItem(LS_KEY);
  if (s) {
    try { return JSON.parse(s); } catch (_) {}
  }
  // Seed initial speichern
  localStorage.setItem(LS_KEY, JSON.stringify(SEED_CARDS));
  return JSON.parse(localStorage.getItem(LS_KEY));
}
function saveCards() {
  localStorage.setItem(LS_KEY, JSON.stringify(cards));
}

function uid() {
  return "c_" + Math.random().toString(36).slice(2, 10);
}
