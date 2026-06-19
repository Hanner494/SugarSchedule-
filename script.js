:root{
  --bg:#0b1f1c;            /* sehr dunkles Grün-Braun Mix */
  --panel:#112a26;         /* Karten-Hintergrund */
  --accent:#12a594;        /* Mint/Teal */
  --accent-2:#b8ffe9;      /* helles Mint */
  --ink:#edf8f6;           /* fast weiß */
  --muted:#88a39f;
  --brown:#6b4e3d;         /* Braun-Akzent */
  --danger:#ff6b6b;
  --shadow:0 12px 30px rgba(0,0,0,.35);
  --radius:16px;
  --radius-sm:12px;
  --gap:14px;
  --touch:18px;
}

*{box-sizing:border-box}
html,body{margin:0;padding:0;height:100%;background:var(--bg);color:var(--ink);font-family:Inter, ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial}

.header{
  position:sticky;top:0;z-index:10;
  background:linear-gradient(180deg, #0e2a25 0%, #0b1f1c 100%);
  padding:14px max(14px, env(safe-area-inset-left)) 10px max(14px, env(safe-area-inset-right));
  box-shadow:var(--shadow);
  border-bottom:1px solid rgba(255,255,255,.06);
}
.header-row{display:flex;align-items:center;justify-content:space-between;gap:8px}
.app-title{margin:0;font-weight:800;font-size:20px;letter-spacing:.3px}
.icon-btn{
  background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.15);
  color:var(--ink);border-radius:12px;padding:10px 12px;cursor:pointer;
}
.icon-btn.small{padding:6px 8px;font-size:14px}
.icon-btn.danger{border-color:rgba(255,107,107,.5)}
.icon-btn:active{transform:translateY(1px)}

.controls{
  display:flex;gap:10px;align-items:flex-end;margin-top:10px;
}
.control{display:flex;flex-direction:column;gap:6px;font-size:12px}
input[type="date"], select, input[type="text"], input[type="number"]{
  width:100%;padding:12px;border-radius:12px;border:1px solid rgba(255,255,255,.14);
  background:#0f2723;color:var(--ink);outline:none;
}
.btn{
  background:var(--accent);color:#032a25;border:none;border-radius:999px;
  padding:12px 16px;font-weight:800;letter-spacing:.2px;box-shadow:var(--shadow);cursor:pointer;
}
.btn.pill{padding:10px 14px}
.btn.primary{background:linear-gradient(180deg, var(--accent) 0%, #0e7a6b 100%);color:#eafff8}
.btn.full{width:100%}

.summary{margin-top:12px}
.sum-box{
  display:flex;align-items:center;justify-content:space-between;
  background:linear-gradient(180deg, #10312b 0%, #0e2824 100%);
  border:1px solid rgba(255,255,255,.06);
  border-radius:14px;padding:12px;
}
.sum-label{color:var(--muted);font-size:12px}
.sum-value{font-size:20px;font-weight:900}

.tabs{display:flex;gap:8px;margin-top:12px}
.tab{
  flex:1;background:rgba(255,255,255,.07);border:1px solid rgba(255,255,255,.12);color:var(--ink);
  border-radius:12px;padding:10px;font-weight:700
}
.tab.active{background:#143a33;border-color:rgba(255,255,255,.2)}

.main{
  padding:12px max(14px, env(safe-area-inset-left)) 90px max(14px, env(safe-area-inset-right));
}

.card{
  background:var(--panel);
  border:1px solid rgba(255,255,255,.08);
  border-radius:var(--radius);
  box-shadow:var(--shadow);
  padding:14px;
}

.categories{display:grid;gap:12px}
.category .category-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.title-wrap{display:flex;align-items:center;gap:10px}
.category-title{margin:0;font-size:16px}
.badge-sum{
  font-size:12px;background:#0f2723;border:1px solid rgba(255,255,255,.08);
  padding:4px 8px;border-radius:999px;color:var(--accent-2)
}
.collapse-btn{transform:rotate(0);transition:transform .2s}
.category.collapsed .collapse-btn{transform:rotate(-90deg)}
.entries{
  margin-top:10px;padding:8px;border:2px dashed rgba(255,255,255,.12);border-radius:12px;min-height:72px
}
.drop-over{border-color:var(--accent);background:rgba(18,165,148,.08)}

.entry{
  display:grid;gap:8px;background:#0f2723;border:1px solid rgba(255,255,255,.08);
  border-radius:12px;padding:10px;margin-bottom:8px
}
.entry.dragging{opacity:.7;transform:scale(.99)}
.entry-top{display:flex;align-items:center;justify-content:space-between}
.chip{
  display:inline-flex;align-items:center;gap:6px;padding:4px 8px;border-radius:999px;
  font-size:12px;font-weight:800;color:#022a25;background:var(--accent-2);border:1px solid rgba(0,0,0,.1)
}
.chip.neg{background:#ffd2d2;color:#5b1a1a}
.amount{font-weight:900;font-variant-numeric:tabular-nums}
.entry-mid{display:flex;align-items:center;justify-content:space-between;gap:8px}
.note{color:#daf5f0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap;max-width:62%}
.date{font-size:12px;color:var(--muted)}
.entry-stickers{display:flex;flex-wrap:wrap;gap:6px}
.sticker-chip{
  display:inline-flex;align-items:center;gap:6px;background:#16433b;border:1px solid rgba(255,255,255,.14);
  padding:4px 6px;border-radius:999px;color:#c7fff0
}
.sticker-chip .emoji{font-size:16px}
.remove-sticker{
  background:transparent;border:none;color:#b3d7d1;font-size:16px;cursor:pointer;line-height:1
}

.entry-actions{display:flex;gap:8px;justify-content:flex-end}
.icon-btn.delete{border-color:rgba(255,107,107,.5);color:#ffdede}
.icon-btn.edit{border-color:rgba(184,255,233,.35)}

.form-card h2{margin:0 0 10px 0}
.field{display:flex;flex-direction:column;gap:6px;margin-bottom:10px}
.row{display:grid;grid-template-columns:1fr 1fr;gap:10px}

.sticker-palette{display:grid;grid-template-columns:repeat(5,1fr);gap:10px}
.sticker-button{
  background:#123a33;border:1px solid rgba(255,255,255,.12);border-radius:12px;padding:12px;cursor:grab;font-size:20px;
}
.sticker-button:active{cursor:grabbing}
.hint{margin-top:8px;color:var(--muted);font-size:12px}

.bottom-nav{
  position:fixed;left:0;right:0;bottom:0;z-index:11;
  display:flex;gap:10px;justify-content:space-around;
  background:linear-gradient(180deg, #0f2c26 0%, #0a1d1a 100%);
  padding:10px max(8px, env(safe-area-inset-left)) calc(10px + env(safe-area-inset-bottom)) max(8px, env(safe-area-inset-right));
  border-top:1px solid rgba(255,255,255,.08);
}
.nav-btn{
  background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.14);
  color:var(--ink);border-radius:14px;padding:12px 18px;font-size:18px
}
.nav-btn.active{background:var(--accent);color:#032a25;border-color:transparent}

.tab-page{display:none}
.tab-page.active{display:block}

/* Desktop-Verbesserungen */
@media(min-width:760px){
  .main{max-width:760px;margin:0 auto}
}
