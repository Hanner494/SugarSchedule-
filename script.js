:root{
  /* Kawaii Lila-Rosa Polkadot Theme */
  --bg:#2a0d3f;
  --panel:#3a165b;
  --accent:#ff93dd;   /* rosa */
  --accent-2:#c653ff; /* lila */
  --mint:#c9ffee;     /* frisches Pastell-Mint als Akzent */
  --ink:#fff7ff;
  --muted:#e9d4f4;
  --danger:#ff6ba6;
  --good:#b7ffcf;

  --shadow:0 14px 36px rgba(0,0,0,.35);
  --radius:18px;
  --radius-sm:12px;
  --dot:#4b1a77; /* Polkadot-Farbe */
  --dot2:#5d218f;
}

*{box-sizing:border-box}
html,body{
  margin:0;padding:0;height:100%;
  background:
    radial-gradient(10px 10px at 10% 10%, var(--dot) 30%, transparent 31%) 0 0/40px 40px,
    radial-gradient(10px 10px at 30% 30%, var(--dot2) 30%, transparent 31%) 0 0/40px 40px,
    var(--bg);
  color:var(--ink);
  font-family: "Inter", ui-sans-serif, system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial;
}

.header{
  position:sticky;top:0;z-index:10;
  background:linear-gradient(180deg, rgba(255,147,221,.25) 0%, rgba(58,22,91,.9) 100%);
  backdrop-filter: blur(8px);
  border-bottom:1px solid rgba(255,255,255,.12);
  padding:14px 16px 10px;
  box-shadow:var(--shadow);
}
.header-bar{display:flex;align-items:center;justify-content:space-between}
.app-title{margin:0;font-size:20px;font-weight:900;letter-spacing:.3px}
.icon-btn{
  background:rgba(255,255,255,.1);border:1px solid rgba(255,255,255,.2);
  color:var(--ink);border-radius:14px;padding:10px 12px;cursor:pointer
}
.icon-btn.tiny{padding:6px 8px;font-size:14px}
.icon-btn.danger{border-color:rgba(255,107,166,.6);color:#ffe1ee}
.icon-btn:active{transform:translateY(1px)}

.summary{margin-top:10px}
.sum-card{
  display:flex;align-items:center;justify-content:space-between;
  background:linear-gradient(180deg, rgba(255,147,221,.18) 0%, rgba(58,22,91,.9) 100%);
  border:1px solid rgba(255,255,255,.18);
  border-radius:16px;padding:12px 14px
}
.sum-label{color:var(--muted);font-size:12px}
.sum-value{font-size:22px;font-weight:900;color:var(--good);text-shadow:0 1px 0 #000}

.header-controls{
  display:flex;gap:10px;align-items:flex-end;margin-top:10px;flex-wrap:wrap;
}
.field-inline{display:flex;flex-direction:column;gap:6px;font-size:12px}
input[type="date"], select, input[type="text"], input[type="number"]{
  width:100%;padding:12px;border-radius:14px;border:1px solid rgba(255,255,255,.18);
  background:#4a1c79;color:var(--ink);outline:none;
  box-shadow: inset 0 1px 0 rgba(255,255,255,.06);
}

.btn{
  background:linear-gradient(180deg, var(--accent) 0%, var(--accent-2) 100%);
  color:#3a0049;border:none;border-radius:999px;padding:10px 16px;
  font-weight:900;letter-spacing:.2px;box-shadow:var(--shadow);cursor:pointer
}
.btn.pill{padding:8px 14px}
.btn.primary{background:linear-gradient(180deg, #ffd0ef 0%, #ff93dd 60%, #c653ff 100%);color:#3a0049}
.btn.full{width:100%}

.tabs{display:flex;gap:8px;margin-top:12px}
.tab{
  flex:1;background:rgba(255,255,255,.08);border:1px solid rgba(255,255,255,.18);
  color:var(--ink);border-radius:14px;padding:10px;font-weight:800
}
.tab.active{background:rgba(255,147,221,.25);border-color:rgba(255,255,255,.28)}

.main{padding:12px 16px 90px}

.card{
  background:
    radial-gradient(12px 12px at 14% 18%, rgba(255,255,255,.05) 30%, transparent 31%) 0 0/40px 40px,
    radial-gradient(12px 12px at 48% 32%, rgba(255,255,255,.04) 30%, transparent 31%) 0 0/40px 40px,
    linear-gradient(180deg, rgba(255,255,255,.06) 0%, rgba(0,0,0,.12) 100%),
    var(--panel);
  border:1px solid rgba(255,255,255,.12);
  border-radius:var(--radius);
  box-shadow:var(--shadow);
  padding:14px;
}

.card.info{background:linear-gradient(180deg, rgba(201,255,238,.09) 0%, rgba(58,22,91,.8) 100%);}

.days-wrap{display:grid;gap:12px}

.day-head{display:flex;align-items:center;justify-content:space-between;gap:10px;margin-bottom:8px}
.day-title{margin:0;font-size:16px}
.day-title-wrap{display:flex;align-items:center;gap:10px}
.day-badge{
  background:rgba(201,255,238,.18);border:1px solid rgba(201,255,238,.35);
  padding:4px 8px;border-radius:999px;color:var(--mint);font-size:12px
}
.day-status{font-weight:900}
.day-status.pos{color:var(--good)}
.day-status.neg{color:var(--danger)}

.day-drop{
  min-height:50px;border:2px dashed rgba(255,255,255,.2);border-radius:14px;margin-bottom:8px
}
.day-drop.drop-over{border-color:var(--mint);background:rgba(201,255,238,.12)}

.table-scroll{overflow:auto;border-radius:14px;border:1px solid rgba(255,255,255,.12)}
.cute-table{width:100%;border-collapse:separate;border-spacing:0;background:rgba(255,255,255,.04)}
.cute-table thead th{
  position:sticky;top:0;z-index:1;
  background:linear-gradient(180deg, rgba(255,147,221,.3) 0%, rgba(58,22,91,.95) 100%);
  color:var(--ink);text-align:left;font-size:12px;padding:10px;border-bottom:1px solid rgba(255,255,255,.18)
}
.cute-table tbody td{padding:10px;border-bottom:1px dashed rgba(255,255,255,.12);vertical
