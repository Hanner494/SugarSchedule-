/* Mint-Brauner Y2K Finanzplaner
   - Nur HTML/CSS/JS
   - Drag & Drop für Karten & Sticker
   - Lokale Speicherung (localStorage)
*/

// Kategorien/Oberlogs
const CATEGORIES = [
  "Taschengeld",
  "Einkommen",
  "Steuern",
  "Essen",
  "Auto",
  "Spaßausgaben",
  "Freizeit",
  "Klamotten",
];

// Y2K-Style Sticker (Emoji + Label)
const STICKERS = [
  { id: "⭐", label: "Star" },
  { id: "💿", label: "Disc" },
  { id: "🛼", label: "Skate" },
  { id: "📟", label: "Pager" },
  { id: "🛍️", label: "Shop" },
  { id: "🍔", label: "Snack" },
  { id: "⛽", label: "Fuel" },
  { id: "🎮", label: "Game" },
];

const STORAGE_KEY = "y2k_finance_data_v1";

// State
let state = {
  entries: [], // {id, category, amount, note, date, stickers: [id,...]}
};

const byId = (id) => document.getElementById(id);
const fmtEUR = (num) =>
  (num || 0).toLocaleString("de-DE", { style: "currency", currency: "EUR" });

document.addEventListener("DOMContentLoaded", init);

function init() {
  loadState();
  buildColumns();
  buildTotals();
  fillTotals();
  buildStickers();
  bindHeader();
  bindForm();
  renderAllEntries();
}

function bindHeader() {
  const dp = byId("datePicker");
  const todayBtn = byId("todayBtn");
  const clearAll = byId("clearAllBtn");

  const todayStr = new Date().toISOString().slice(0, 10);
  dp.value = todayStr;
  todayBtn.addEventListener("click", () => (dp.value = new Date().toISOString().slice(0, 10)));

  clearAll.addEventListener("click", () => {
    const ok = confirm("Alle gespeicherten Einträge wirklich löschen?");
    if (!ok) return;
    state = { entries: [] };
    saveState();
    // Neu rendern:
    document.querySelectorAll(".entries").forEach((el) => (el.innerHTML = ""));
    renderAllEntries();
    fillTotals();
  });
}

function bindForm() {
  const form = byId("entryForm");
  const catSel = byId("categorySelect");
  const amountInput = byId("amountInput");
  const noteInput = byId("noteInput");
  const dateInput = byId("entryDateInput");

  // Standardmäßig Datum = globaler Header-Datepicker
  dateInput.value = byId("datePicker").value;

  form.addEventListener("submit", (e) => {
    e.preventDefault();
    const category = catSel.value;
    const amount = parseFloat(amountInput.value || "0");
    if (isNaN(amount) || amount < 0) return alert("Bitte einen gültigen Betrag eingeben.");
    const note = (noteInput.value || "").trim();
    const date = (dateInput.value || byId("datePicker").value || new Date().toISOString().slice(0, 10));

    const entry = {
      id: cryptoRandomId(),
      category,
      amount,
      note,
      date,
      stickers: [],
    };
    state.entries.push(entry);
    saveState();

    addEntryToDOM(entry);
    fillTotals();

    // Reset
    amountInput.value = "";
    noteInput.value = "";
    dateInput.value = byId("datePicker").value;
  });
}

function cryptoRandomId() {
  if (window.crypto && crypto.randomUUID) return crypto.randomUUID();
  return "id-" + Math.random().toString(36).slice(2, 10);
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw);
    if (!state.entries) state.entries = [];
  } catch {
    state = { entries: [] };
  }
}
function saveState() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

function buildColumns() {
  const columnsWrap = byId("columns");
  columnsWrap.innerHTML = "";
  const tpl = byId("columnTemplate");

  CATEGORIES.forEach((name) => {
    const node = tpl.content.cloneNode(true);
    const col = node.querySelector(".column");
    const title = node.querySelector(".col-title");
    const sum = node.querySelector(".sum-value");
    const dz = node.querySelector(".drop-zone");

    title.textContent = name;
    col.dataset.category = name;
    dz.dataset.category = name;
    sum.textContent = "0,00 €";

    makeDropZone(dz);

    columnsWrap.appendChild(node);
  });
}

function buildTotals() {
  const grid = byId("totalsGrid");
  grid.innerHTML = "";
  CATEGORIES.forEach((cat) => {
    const row = document.createElement("div");
    row.className = "total-row";
    row.innerHTML = `
      <span class="name">${cat}</span>
      <span class="value" data-total="${cat}">0,00 €</span>
    `;
    grid.appendChild(row);
  });
}

function fillTotals() {
  const categorySums = {};
  CATEGORIES.forEach((c) => (categorySums[c] = 0));

  state.entries.forEach((e) => {
    if (categorySums[e.category] == null) categorySums[e.category] = 0;
    // Konvention: Einkommen addiert, Ausgaben subtrahiert? 
    // Hier: Alles wird „positiv“ gezählt pro Kategorie; die Bilanz ist Summe aller Kategorien.
    categorySums[e.category] += e.amount;
  });

  // Update per Kategorie
  CATEGORIES.forEach((c) => {
    const v = categorySums[c] || 0;
    const el = document.querySelector(`[data-total="${CSS.escape(c)}"]`);
    if (el) el.textContent = fmtEUR(v);
    const colSum = document.querySelector(`.column[data-category="${CSS.escape(c)}"] .sum-value`);
    if (colSum) colSum.textContent = fmtEUR(v);
  });

  // Gesamt
  const total = Object.values(categorySums).reduce((a, b) => a + b, 0);
  byId("grandTotal").textContent = fmtEUR(total);
}

function renderAllEntries() {
  // Clear all drop-zones
  document.querySelectorAll(".entries").forEach((el) => (el.innerHTML = ""));
  state.entries.forEach(addEntryToDOM);
}

function addEntryToDOM(entry) {
  const dz = document.querySelector(`.drop-zone[data-category="${CSS.escape(entry.category)}"]`);
  if (!dz) return;
  const tpl = byId("entryCardTemplate");
  const node = tpl.content.cloneNode(true);
  const card = node.querySelector(".entry-card");
  const badge = node.querySelector(".entry-badge");
  const amountEl = node.querySelector(".entry-amount");
  const noteEl = node.querySelector(".entry-note");
  const dateEl = node.querySelector(".entry-date");
  const stickersEl = node.querySelector(".entry-stickers");
  const delBtn = node.querySelector(".delete-btn");
  const editBtn = node.querySelector(".edit-btn");

  card.dataset.id = entry.id;
  badge.textContent = entry.category;
  amountEl.textContent = `${entry.category === "Einkommen" ? "+" : "-"}${fmtEUR(entry.amount).replace(/\s?€/, " €")}`;
  noteEl.textContent = entry.note || "—";
  dateEl.textContent = entry.date || "—";

  // existierende Sticker
  entry.stickers.forEach((sid) => {
    const s = makeStickerEl(sid);
    s.classList.add("card-sticker");
    stickersEl.appendChild(s);
    makeStickerDroppable(s); // Damit Sticker auch umziehbar sind
  });

  // Drag & Drop für Karte
  card.addEventListener("dragstart", (e) => {
    card.classList.add("dragging");
    e.dataTransfer.setData("text/plain", JSON.stringify({ type: "entry", id: entry.id }));
    e.dataTransfer.effectAllowed = "move";
  });
  card.addEventListener("dragend", () => card.classList.remove("dragging"));

  // Drop-Ziel für Sticker auf der Karte
  makeStickerDropTarget(stickersEl, entry.id);

  // Aktionen
  delBtn.addEventListener("click", () => {
    const ok = confirm("Eintrag löschen?");
    if (!ok) return;
    state.entries = state.entries.filter((x) => x.id !== entry.id);
    saveState();
    card.remove();
    fillTotals();
  });

  editBtn.addEventListener("click", () => {
    editEntryDialog(entry);
  });

  dz.appendChild(node);
}

function editEntryDialog(entry) {
  const amount = prompt("Betrag (€):", String(entry.amount));
  if (amount == null) return;
  const nVal = parseFloat(amount);
  if (isNaN(nVal) || nVal < 0) return alert("Ungültiger Betrag.");
  const note = prompt("Notiz:", entry.note || "") ?? entry.note;
  const date = prompt("Datum (YYYY-MM-DD):", entry.date || "") ?? entry.date;

  entry.amount = nVal;
  entry.note = note || "";
  entry.date = date || entry.date;

  saveState();
  renderAllEntries();
  fillTotals();
}

function buildStickers() {
  const pal = byId("stickerPalette");
  pal.innerHTML = "";
  STICKERS.forEach((s) => {
    const el = document.createElement("button");
    el.type = "button";
    el.className = "sticker";
    el.draggable = true;
    el.textContent = s.id;

    el.addEventListener("dragstart", (e) => {
      e.dataTransfer.setData("text/plain", JSON.stringify({ type: "sticker", stickerId: s.id }));
      e.dataTransfer.effectAllowed = "copy";
    });

    el.addEventListener("click", () => {
      alert(`Ziehe mich auf eine Karte oder Spalte! (${s.id} ${s.label})`);
    });

    pal.appendChild(el);
  });
}

// Sticker-Element für Karten
function makeStickerEl(stickerId) {
  const span = document.createElement("span");
  span.className = "card-sticker";
  span.draggable = true;
  span.textContent = stickerId;

  span.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", JSON.stringify({ type: "sticker-on-card", stickerId }));
    e.dataTransfer.effectAllowed = "move";
    // Kennzeichne ursprüngliches Sticker-Element:
    span.dataset.dragging = "1";
    setTimeout(() => span.removeAttribute("data-dragging"), 0);
  });

  return span;
}

function makeStickerDroppable(stickerEl) {
  // Karte soll Sticker aufnehmen können – bereits durch makeStickerDropTarget abgedeckt
  // Hier optional weitere Logik. Aktuell nicht benötigt.
}

function makeDropZone(zone) {
  zone.addEventListener("dragover", (e) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    zone.classList.add("drag-over");
  });
  zone.addEventListener("dragleave", () => zone.classList.remove("drag-over"));
  zone.addEventListener("drop", (e) => {
    e.preventDefault();
    zone.classList.remove("drag-over");
    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;
    let data;
    try { data = JSON.parse(raw); } catch { return; }

    if (data.type === "entry") {
      // Karte in andere Kategorie verschieben
      const entry = state.entries.find((x) => x.id === data.id);
      if (!entry) return;
      entry.category = zone.dataset.category;
      saveState();
      renderAllEntries();
      fillTotals();
    } else if (data.type === "sticker") {
      // Sticker auf Spalte droppen -> alle Karten in der Spalte bekommen den Sticker
      const cat = zone.dataset.category;
      const affected = state.entries.filter((e2) => e2.category === cat);
      affected.forEach((e2) => {
        if (!e2.stickers.includes(data.stickerId)) e2.stickers.push(data.stickerId);
      });
      saveState();
      renderAllEntries();
    } else if (data.type === "sticker-on-card") {
      // Sticker von Karte auf Spalte bewegen -> hänge Sticker an alle Karten der Spalte
      const cat = zone.dataset.category;
      const affected = state.entries.filter((e2) => e2.category === cat);
      affected.forEach((e2) => {
        if (!e2.stickers.includes(data.stickerId)) e2.stickers.push(data.stickerId);
      });
      saveState();
      renderAllEntries();
    }
  });
}

function makeStickerDrop

