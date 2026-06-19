/* Moderne Mobile-Version – Mint/Braun Y2K Finanzplaner (nur HTML/CSS/JS)
   Features:
   - Kategorien & Summen
   - Einnahmen/Ausgaben (+/−)
   - Einträge anlegen, bearbeiten, löschen
   - Drag & Drop: Karten zwischen Kategorien
   - Sticker: Palette -> Karte oder Kategorie; Sticker entfernbar
   - Datumsauswahl + Heute-Button
   - LocalStorage-Persistenz
*/

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

const STICKERS = [
  "⭐","💿","🛼","📟","🛍️","🍔","⛽","🎮","🧃","🎧"
];

const STORAGE_KEY = "y2k_finance_mobile_v2";

// -------------------- State --------------------

let state = {
  entries: [
    // Beispiel: {id, category, type: 'income'|'expense', amount, note, date, stickers:[]}
  ],
};

// -------------------- Utils --------------------

const $ = (sel, root=document) => root.querySelector(sel);
const $$ = (sel, root=document) => Array.from(root.querySelectorAll(sel));
const byId = (id) => document.getElementById(id);
const fmtEUR = (n) => (n||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"});

function uid(){
  if (crypto?.randomUUID) return crypto.randomUUID();
  return "id-"+Math.random().toString(36).slice(2,9);
}

// -------------------- Init --------------------

document.addEventListener("DOMContentLoaded", () => {
  load();
  setupTabs();
  setupBottomNav();
  setupHeader();
  setupForm();
  renderCategoryOptions();
  renderBoard();
  renderStickerPalette();
  updateTotals();
});

// -------------------- Load/Save --------------------

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw);
    if (!state.entries) state.entries = [];
  }catch(e){
    state = { entries: [] };
  }
}
function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// -------------------- Header Controls --------------------

function setupHeader(){
  const gDate = byId("globalDate");
  const today = byId("todayBtn");
  const reset = byId("resetBtn");
  const todayStr = new Date().toISOString().slice(0,10);
  gDate.value = todayStr;
  today.addEventListener("click", () => gDate.value = new Date().toISOString().slice(0,10));
  reset.addEventListener("click", () => {
    if (!confirm("Wirklich alle Daten löschen?")) return;
    state.entries = [];
    save();
    renderBoard();
    updateTotals();
  });
}

// -------------------- Tabs / Bottom Nav --------------------

function setupTabs(){
  const tabs = $$(".tab");
  tabs.forEach(btn=>{
    btn.addEventListener("click", ()=>{
      const tab = btn.dataset.tab;
      setActiveTab(tab);
    });
  });
}
function setupBottomNav(){
  const navBtns = $$(".bottom-nav .nav-btn");
  navBtns.forEach(b=>{
    b.addEventListener("click", ()=>{
      const tab = b.dataset.tab;
      setActiveTab(tab);
    });
  });
}
function setActiveTab(tab){
  // Tab Buttons
  $$(".tab").forEach(t=>{
    t.classList.toggle("active", t.dataset.tab===tab);
  });
  // Bottom Nav
  $$(".bottom-nav .nav-btn").forEach(t=>{
    t.classList.toggle("active", t.dataset.tab===tab);
  });
  // Pages
  $$(".tab-page").forEach(p=>{
    p.classList.toggle("active", p.id===`tab-${tab}`);
  });
}

// -------------------- Form --------------------

function renderCategoryOptions(){
  const sel = byId("categorySelect");
  sel.innerHTML = "";
  CATEGORIES.forEach(c=>{
    const opt = document.createElement("option");
    opt.value = c; opt.textContent = c;
    sel.appendChild(opt);
  });
}

function setupForm(){
  const form = byId("entryForm");
  const catSel = byId("categorySelect");
  const typeSel = byId("typeSelect");
  const amountInput = byId("amountInput");
  const dateInput = byId("dateInput");
  const noteInput = byId("noteInput");
  const gDate = byId("globalDate");

  dateInput.value = gDate.value;

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const category = catSel.value;
    const type = typeSel.value; // income/expense
    const amount = parseFloat(amountInput.value);
    if (isNaN(amount) || amount < 0) return alert("Bitte einen gültigen Betrag eingeben.");
    const date = (dateInput.value || gDate.value || new Date().toISOString().slice(0,10));
    const note = (noteInput.value || "").trim();

    const entry = {
      id: uid(),
      category, type, amount, date, note,
      stickers: [],
    };
    state.entries.push(entry);
    save();
    renderBoard();
    updateTotals();

    // Reset
    amountInput.value = "";
    noteInput.value = "";
    dateInput.value = gDate.value;
    setActiveTab("board");
  });
}

// -------------------- Board Rendering --------------------

function renderBoard(){
  const wrap = byId("categories");
  wrap.innerHTML = "";
  CATEGORIES.forEach(cat=>{
    const catNode = renderCategory(cat);
    wrap.appendChild(catNode);
  });
}

function renderCategory(cat){
  const tpl = byId("categoryTemplate");
  const node = tpl.content.cloneNode(true);
  const sec = node.querySelector(".category");
  const title = node.querySelector(".category-title");
  const sumEl = node.querySelector(".category-sum");
  const collapseBtn = node.querySelector(".collapse-btn");
  const zone = node.querySelector(".entries");

  sec.dataset.category = cat;
  title.textContent = cat;

  // Summe für Kategorie berechnen
  const sum = calcCategorySum(cat);
  sumEl.textContent = fmtEUR(sum);

  // Drop Zone aktivieren
  makeDropZone(zone, cat);

  // Einträge rendern
  const entries = state.entries.filter(e=>e.category===cat);
  entries.forEach(e=>{
    const card = renderEntry(e);
    zone.appendChild(card);
  });

  // Ein/Ausklappen
  collapseBtn.addEventListener("click", ()=>{
    sec.classList.toggle("collapsed");
    zone.style.display = sec.classList.contains("collapsed") ? "none" : "";
  });

  return node;
}

function calcCategorySum(cat){
  return state.entries
    .filter(e=>e.category===cat)
    .reduce((acc,e)=> acc + (e.type==="income" ? e.amount : -e.amount), 0);
}

function updateCategorySum(cat){
  const sec = $(`.category[data-category="${cssEscape(cat)}"]`);
  if (!sec) return;
  const sumEl = $(".category-sum", sec);
  sumEl.textContent = fmtEUR(calcCategorySum(cat));
}

// -------------------- Entry Rendering & Actions --------------------

function renderEntry(entry){
  const tpl = byId("entryTemplate");
  const node = tpl.content.cloneNode(true);
  const card = node.querySelector(".entry");
  const chip = node.querySelector(".chip");
  const amountEl = node.querySelector(".amount");
  const noteEl = node.querySelector(".note");
  const dateEl = node.querySelector(".date");
  const stickerWrap = node.querySelector(".entry-stickers");
  const btnEdit = node.querySelector(".edit");
  const btnDelete = node.querySelector(".delete");

  card.dataset.id = entry.id;
  card.draggable = true;

  chip.textContent = entry.type==="income" ? "+ Einnahme" : "− Ausgabe";
  if (entry.type==="expense") chip.classList.add("neg");
  const sign = entry.type==="income" ? "+" : "−";
  amountEl.textContent = `${sign}${fmtEUR(entry.amount)}`;

  noteEl.textContent = entry.note || "—";
  dateEl.textContent = entry.date || "—";

  // existierende Sticker rendern
  entry.stickers.forEach(s=>{
    const el = makeStickerChip(s, entry.id);
    stickerWrap.appendChild(el);
  });

  // Drag Start/End (Karte verschieben)
  card.addEventListener("dragstart", (e)=>{
    card.classList.add("dragging");
    e.dataTransfer.setData("application/json", JSON.stringify({kind:"entry", id: entry.id}));
    e.dataTransfer.effectAllowed = "move";
  });
  card.addEventListener("dragend", ()=>{
    card.classList.remove("dragging");
  });

  // Sticker Drop Target für Karte
  makeStickerDropTarget(stickerWrap, entry.id);

  // Aktionen
  btnDelete.addEventListener("click", ()=>{
    if (!confirm("Diesen Eintrag löschen?")) return;
    const catBefore = entry.category;
    state.entries = state.entries.filter(x=>x.id!==entry.id);
    save();
    // Karte entfernen
    card.remove();
    updateCategorySum(catBefore);
    updateTotals();
  });

  btnEdit.addEventListener("click", ()=>{
    editEntry(entry);
  });

  return node;
}

function editEntry(entry){
  const amountStr = prompt("Betrag (€):", String(entry.amount));
  if (amountStr==null) return;
  const n = parseFloat(amountStr);
  if (isNaN(n)||n<0) return alert("Ungültiger Betrag.");
  const typeStr = prompt("Art (income/expense):", entry.type);
  if (typeStr==null) return;
  const t = (typeStr==="income"||typeStr==="expense") ? typeStr : entry.type;
  const noteStr = prompt("Notiz:", entry.note||"");
  if (noteStr==null) return;
  const dateStr = prompt("Datum (YYYY-MM-DD):", entry.date||"");
  if (dateStr==null) return;

  entry.amount = n;
  entry.type = t;
  entry.note = noteStr||"";
  entry.date = dateStr||entry.date;

  save();
  renderBoard();
  updateTotals();
}

// -------------------- Drag & Drop: Kategorien --------------------

function makeDropZone(zone, cat){
  zone.addEventListener("dragover", (e)=>{
    // Unterstütze Sticker und Karten
    const types = e.dataTransfer?.types || [];
    if (types.includes("application/json")) e.preventDefault();
    if (types.includes("text/plain")) e.preventDefault();
    zone.classList.add("drop-over");
  });
  zone.addEventListener("dragleave", ()=>{
    zone.classList.remove("drop-over");
  });
  zone.addEventListener("drop", (e)=>{
    e.preventDefault();
    zone.classList.remove("drop-over");

    try{
      const rawJson = e.dataTransfer.getData("application/json");
      if (rawJson){
        const data = JSON.parse(rawJson);
        if (data.kind==="entry" && data.id){
          // Karte verschieben
          const entry = state.entries.find(x=>x.id===data.id);
          if (!entry) return;
          const oldCat = entry.category;
          entry.category = cat;
          save();
          renderBoard();
          updateCategorySum(oldCat);
          updateCategorySum(cat);
          updateTotals();
          return;
        }
      }
    }catch{}

    // Sticker auf Kategorie: alle Karten in der Kategorie taggen
    const rawTxt = e.dataTransfer.getData("text/plain");
    if (rawTxt){
      try{
        const data = JSON.parse(rawTxt);
        if (data.kind==="sticker" && data.sticker){
          const affected = state.entries.filter(en=>en.category===cat);
          affected.forEach(en=>{
            if (!en.stickers.includes(data.sticker)) en.stickers.push(data.sticker);
          });
          save();
          renderBoard();
          updateCategorySum(cat);
          updateTotals();
        }
      }catch{}
    }
  });
}

// -------------------- Sticker Palette & Chips --------------------

function renderStickerPalette(){
  const pal = byId("stickerPalette");
  pal.innerHTML = "";
  STICKERS.forEach(s=>{
    const btn = document.createElement("button");
    btn.className = "sticker-button";
    btn.type = "button";
    btn.draggable = true;
    btn.textContent = s;

    btn.addEventListener("dragstart", (e)=>{
      e.dataTransfer.setData("text/plain", JSON.stringify({kind:"sticker", sticker: s}));
      e.dataTransfer.effectAllowed = "copy";
    });

    btn.addEventListener("click", ()=>{
      alert("Ziehe den Sticker auf eine Karte oder Kategorie.");
    });

    pal.appendChild(btn);
  });
}

function makeStickerDropTarget(container, entryId){
  container.addEventListener("dragover", (e)=>{
    const types = e.dataTransfer?.types || [];
    if (types.includes("text/plain")) e.preventDefault();
    container.classList.add("drop-over");
  });
  container.addEventListener("dragleave", ()=> container.classList.remove("drop-over"));
  container.addEventListener("drop", (e)=>{
    e.preventDefault();
    container.classList.remove("drop-over");
    const raw = e.dataTransfer.getData("text/plain");
    if (!raw) return;
    let data;
    try{ data = JSON.parse(raw); }catch{ return; }
    if (data.kind==="sticker" && data.sticker){
      const entry = state.entries.find(x=>x.id===entryId);
      if (!entry) return;
      if (!entry.stickers.includes(data.sticker)) entry.stickers.push(data.sticker);
      save();
      // render nur Sticker-Bereich neu:
      container.innerHTML = "";
      entry.stickers.forEach(s=>{
        container.appendChild(makeStickerChip(s, entryId));
      });
      updateTotals();
    }
  });
}

function makeStickerChip(sticker, entryId){
  const tpl = byId("stickerChipTemplate");
  const node = tpl.content.cloneNode(true);
  const chip = node.querySelector(".sticker-chip");
  const emoji = node.querySelector(".emoji");
  const removeBtn = node.querySelector(".remove-sticker");

  emoji.textContent = sticker;

  // Sticker zwischen Karten verschieben
  chip.addEventListener("dragstart", (e)=>{
    e.dataTransfer.setData("text/plain", JSON.stringify({kind:"sticker", sticker}));
    e.dataTransfer.effectAllowed = "move";
  });

  // Sticker aus Karte entfernen
  removeBtn.addEventListener("click", ()=>{
    const entry = state.entries.find(x=>x.id===entryId);
    if (!entry) return;
    entry.stickers = entry.stickers.filter(s=>s!==sticker);
    save();
    // Chip entfernen
    chip.remove();
  });

  return node;
}

// -------------------- Totals --------------------

function updateTotals(){
  // Saldierung: Einkommen positiv, Ausgaben negativ, über alle Kategorien
  const total = state.entries.reduce((acc, e)=> acc + (e.type==="income" ? e.amount : -e.amount), 0);
  byId("grandTotal").textContent = fmtEUR(total);
  // Kategorien-Summen aktualisieren
  CATEGORIES.forEach(updateCategorySum);
}

// -------------------- Helpers --------------------

function cssEscape(str){
  // Minimal-escape für Attribute-Selektor
  return str.replace(/["\$$/g, "\\$&");
}
