/* Kawaii Finanzplaner – Tages-Tabelle (Lila/Rosa/Polkadot)
   - Tagesgruppen: pro Datum eine Karte, mit Tages-Saldo (+/-) und Tabelle
   - Gesammtsaldo oben
   - Kategorien fest: Taschengeld, Einkommen, Steuern, Essen, Auto, Spaßausgaben, Freizeit, Klamotten
   - Einträge: hinzufügen, bearbeiten, löschen
   - Drag & Drop: Zeilen zwischen Tagen verschieben (Datum ändert sich)
   - Sticker: Palette -> Zeile oder -> gesamte Tageskarte; Sticker entfernbar
   - localStorage Persistenz
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

const STICKERS = ["🎀","🩷","🌈","🧁","🫧","✨","🍓","🧸","💿","🌟","🎮","⛽"];

const STORAGE_KEY = "kawaii_finance_by_day_v1";

// ---------- Utils ----------

const $ = (s, r=document)=>r.querySelector(s);
const $$ = (s, r=document)=>Array.from(r.querySelectorAll(s));
const byId = (id)=>document.getElementById(id);
const fmtEUR = n => (n||0).toLocaleString("de-DE",{style:"currency",currency:"EUR"});
const uid = ()=> (crypto?.randomUUID ? crypto.randomUUID() : "id-"+Math.random().toString(36).slice(2,10));

// ---------- State ----------

let state = { entries: [] };
// entry: {id, date, category, type: 'income'|'expense', amount, note, stickers: []}

// ---------- Init ----------

document.addEventListener("DOMContentLoaded", ()=>{
  load();
  setupTabs();
  setupBottomNav();
  setupHeader();
  setupForm();
  renderCategoryOptions();
  renderDays();
  renderStickerPalette();
  updateTotals();
});

// ---------- Load/Save ----------

function load(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) state = JSON.parse(raw);
    if (!state.entries) state.entries = [];
  }catch{ state = { entries: [] }; }
}
function save(){
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
}

// ---------- Header ----------

function setupHeader(){
  const gDate = byId("globalDate");
  const todayBtn = byId("todayBtn");
  const resetBtn = byId("resetBtn");
  gDate.value = new Date().toISOString().slice(0,10);
  todayBtn.addEventListener("click", ()=> gDate.value = new Date().toISOString().slice(0,10));
  resetBtn.addEventListener("click", ()=>{
    if (!confirm("Alle Daten wirklich löschen?")) return;
    state.entries = [];
    save();
    renderDays();
    updateTotals();
  });
}

// ---------- Tabs & Bottom Nav ----------

function setupTabs(){
  $$(".tab").forEach(btn=>{
    btn.addEventListener("click", ()=> setActiveTab(btn.dataset.tab));
  });
}
function setupBottomNav(){
  $$(".bottom-nav .nav-btn").forEach(btn=>{
    btn.addEventListener("click", ()=> setActiveTab(btn.dataset.tab));
  });
}
function setActiveTab(tab){
  $$(".tab").forEach(b=>b.classList.toggle("active", b.dataset.tab===tab));
  $$(".bottom-nav .nav-btn").forEach(b=>b.classList.toggle("active", b.dataset.tab===tab));
  $$(".tab-page").forEach(p=>p.classList.toggle("active", p.id===`tab-${tab}`));
}

// ---------- Form ----------

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
  const gDate = byId("globalDate");
  byId("dateInput").value = gDate.value;

  form.addEventListener("submit", (e)=>{
    e.preventDefault();
    const date = byId("dateInput").value || gDate.value || new Date().toISOString().slice(0,10);
    const category = byId("categorySelect").value;
    const type = byId("typeSelect").value;
    const amount = parseFloat(byId("amountInput").value);
    if (isNaN(amount) || amount < 0) return alert("Bitte einen gültigen Betrag eingeben.");
    const note = (byId("noteInput").value || "").trim();

    const entry = { id: uid(), date, category, type, amount, note, stickers: [] };
    state.entries.push(entry);
    save();

    renderDays();
    updateTotals();
    setActiveTab("board");

    byId("amountInput").value = "";
    byId("noteInput").value = "";
    byId("dateInput").value = gDate.value;
  });
}

// ---------- Days (Tages-Sektionen) ----------

function renderDays(){
  const wrap = byId("daysWrap");
  wrap.innerHTML = "";

  const byDate = groupByDate(state.entries);
  const dates = Object.keys(byDate).sort((a,b)=> (a<b?1:-1)); // neueste zuerst

  if (dates.length === 0){
    const empty = document.createElement("div");
    empty.className = "card info";
    empty.innerHTML = "<p class='hint'>Noch keine Einträge. Füge oben über „Hinzufügen“ deinen ersten Eintrag hinzu ✨</p>";
    wrap.appendChild(empty);
    return;
  }

  dates.forEach(date=>{
    const sec = renderDaySection(date, byDate[date]);
    wrap.appendChild(sec);
  });
}

function groupByDate(entries){
  const m = {};
  entries.forEach(e=>{
    const d = e.date || new Date().toISOString().slice(0,10);
    if (!m[d]) m[d] = [];
    m[d].push(e);
  });
  return m;
}

function renderDaySection(date, entries){
  const tpl = byId("dayTemplate");
  const node = tpl.content.cloneNode(true);
  const sec = node.querySelector(".day");
  const title = node.querySelector(".day-title");
  const sumEl = node.querySelector(".day-sum");
  const status = node.querySelector(".day-status");
  const drop = node.querySelector(".day-drop");
  const tbody = node.querySelector(".tbody");

  sec.dataset.date = date;
  title.textContent = date;

  // Summe für Tag
  const daySum = entries.reduce((acc,e)=> acc + (e.type==="income" ? e.amount : -e.amount), 0);
  sumEl.textContent = fmtEUR(daySum);
  status.textContent = (daySum >= 0 ? "+ Plus" : "− Minus");
  status.classList.toggle("pos", daySum >= 0);
  status.classList.toggle("neg", daySum < 0);

  // Drop-Zone für Tageswechsler und Sticker auf Tag
  makeDayDropZone(drop, date);

  // Zeilen rendern
  entries.forEach(e=> tbody.appendChild(renderRow(e)));

  return node;
}

// ---------- Rows (Zeilen) ----------

function renderRow(entry){
  const tpl = byId("rowTemplate");
  const node = tpl.content.cloneNode(true);
  const tr = node.querySelector(".row");
  const chip = node.querySelector(".chip");
  const catTd = node.querySelector(".cell-cat");
  const amountTd = node.querySelector(".cell-amount");
  const noteTd = node.querySelector(".cell-note");
  const stickerWrap = node.querySelector(".stickers");
  const btnEdit = node.querySelector(".edit");
  const btnDelete = node.querySelector(".delete");

  tr.dataset.id = entry.id;

  chip.textContent = entry.type==="income" ? "+ Einnahme" : "− Ausgabe";
  if (entry.type==="expense") chip.classList.add("neg");
  const sign = entry.type==="income" ? "+" : "−";
  amountTd.textContent = `${sign}${fmtEUR(entry.amount)}`;
  catTd.textContent = entry.category || "—";
  noteTd.textContent = entry.note || "—";

  // Sticker rendern
  stickerWrap.innerHTML = "";
  (entry.stickers||[]).forEach(s=> stickerWrap.appendChild(makeStickerChip(s, entry.id)));

  // Drag der Zeile (zwischen Tagen verschieben)
  tr.addEventListener("dragstart", (e)=>{
    tr.classList.add("dragging");
    e.dataTransfer.setData("application/json", JSON.stringify({kind:"entry", id: entry.id}));
    e.dataTransfer.effectAllowed = "move";
  });
  tr.addEventListener("dragend", ()=> tr.classList.remove("dragging"));

  // Sticker Drop Target für die Zeile
  makeStickerDropTarget(stickerWrap, entry.id);

  // Aktionen
  btnDelete.addEventListener("click", ()=>{
    if (!confirm("Eintrag löschen?")) return;
    const d = entry.date;
    state.entries = state.entries.filter(x=>x.id!==entry.id);
    save();
    renderDays();
    updateTotals();
  });
  btnEdit.addEventListener("click", ()=> editEntry(entry));

  return node;
}

// ---------- Drag & Drop auf Tageskarte ----------

function makeDayDropZone(zone, dayDate){
  zone.addEventListener("dragover", (e)=>{
    const types = e.dataTransfer?.types || [];
    if (types.includes("application/json") || types.includes("text/plain")) e.preventDefault();
    zone.classList.add("drop-over");
  });
  zone.addEventListener("dragleave", ()=> zone.classList.remove("drop-over"));
  zone.addEventListener("drop", (e)=>{
    e.preventDefault();
    zone.classList.remove("drop-over");

    // 1) Zeile (Entry) auf anderen Tag verschieben -> Datum ändern
    const rawJson = e.dataTransfer.getData("application/json");
    if (rawJson){
      try{
        const data = JSON.parse(rawJson);
        if (data.kind==="entry" && data.id){
          const entry = state.entries.find(x=>x.id===data.id);
          if (!entry) return;
          entry.date = dayDate;
          save();
          renderDays();
          updateTotals();
          return;
        }
      }catch{}
    }

    // 2) Sticker auf Tageskarte: alle Zeilen dieses Tages taggen
    const rawTxt = e.dataTransfer.getData("text/plain");
    if (rawTxt){
      try{
        const data = JSON.parse(rawTxt);
        if (data.kind==="sticker"){
          state.entries.filter(en=>en.date===dayDate).forEach(en=>{
            if (!en.stickers) en.stickers = [];
            if (!en.stickers.includes(data.sticker)) en.stickers.push(data.sticker);
          });
          save();
          renderDays();
          updateTotals();
        }
      }catch{}
    }
  });
}

// ---------- Sticker ----------

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
      alert("Ziehe den Sticker auf eine Zeile oder auf eine Tageskarte.");
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
    if (data.kind==="sticker"){
      const entry = state.entries.find(x=>x.id===entryId);
      if (!entry) return;
      if (!entry.stickers) entry.stickers = [];
      if (!entry.stickers.includes(data.sticker)) entry.stickers.push(data.sticker);
      save();
      // nur Sticker-Bereich neu rendern
      container.innerHTML = "";
      entry.stickers.forEach(s=> container.appendChild(makeStickerChip(s, entryId)));
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

  chip.addEventListener("dragstart", (e)=>{
    e.dataTransfer.setData("text/plain", JSON.stringify({kind:"sticker", sticker}));
    e.dataTransfer.effectAllowed = "move";
  });

  removeBtn.addEventListener("click", ()=>{
    const entry = state.entries.find(x=>x.id===entryId);
    if (!entry) return;
    entry.stickers = (entry.stickers||[]).filter(s=>s!==sticker);
    save();
    chip.remove();
  });

  return node;
}

// ---------- Editieren ----------

function editEntry(entry){
  const amountStr = prompt("Betrag (€):", String(entry.amount));
  if (amountStr==null) return;
  const n = parseFloat(amountStr);
  if (isNaN(n)||n<0) return alert("Ungültiger Betrag.");

  const typeStr = prompt("Art (income/expense):", entry.type);
  if (typeStr==null) return;
  const t = (typeStr==="income"||typeStr==="expense") ? typeStr : entry.type;

  const catStr = prompt("Kategorie (z.B. Essen):", entry.category||"");
  if (catStr==null) return;

  const noteStr = prompt("Notiz:", entry.note||"");
  if (noteStr==null) return;

  const dateStr = prompt("Datum (YYYY-MM-DD):", entry.date||"");
  if (dateStr==null) return;

  entry.amount = n;
  entry.type = t;
  entry.category = catStr || entry.category;
  entry.note = noteStr||"";
  entry.date = dateStr || entry.date;

  save();
  renderDays();
  updateTotals();
}

// ---------- Summen ----------

function updateTotals(){
  const total = state.entries.reduce((acc, e)=> acc + (e.type==="income" ? e.amount : -e.amount), 0);
  byId("grandTotal").textContent = fmtEUR(total);
}
