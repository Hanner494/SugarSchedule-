(() => {
  const el = {
    tableBody: document.getElementById('tableBody'),
    summaryBalance: document.getElementById('summary-balance'),
    summaryIncome: document.getElementById('summary-income'),
    summaryExpense: document.getElementById('summary-expense'),
    searchText: document.getElementById('searchText'),
    filterType: document.getElementById('filterType'),
    filterFrom: document.getElementById('filterFrom'),
    filterTo: document.getElementById('filterTo'),
    btnClearFilters: document.getElementById('btnClearFilters'),
    btnUndo: document.getElementById('btnUndo'),
    dateInput: document.getElementById('dateInput'),
    typeInput: document.getElementById('typeInput'),
    purposeInput: document.getElementById('purposeInput'),
    categoryInput: document.getElementById('categoryInput'),
    amountInput: document.getElementById('amountInput'),
    noteInput: document.getElementById('noteInput'),
    btnAdd: document.getElementById('btnAdd'),
    btnClear: document.getElementById('btnClear'),
  };

  const STORAGE_KEY = 'kawaii_finanzplaner_v1';
  const UNDO_STACK = [];

  function loadData(){
    try{
      const raw = localStorage.getItem(STORAGE_KEY);
      if(!raw) return [];
      const data = JSON.parse(raw);
      return Array.isArray(data) ? data : [];
    }catch(e){
      console.warn('Load error', e);
      return [];
    }
  }
  function saveData(list){
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  }

  function formatCurrency(num){
    const n = Number(num || 0);
    return n.toLocaleString('de-DE', { style:'currency', currency:'EUR' });
  }

  function computeSums(list){
    let income = 0, expense = 0;
    for(const it of list){
      const v = Number(it.amount) || 0;
      if(it.type === 'income') income += v;
      else expense += v;
    }
    return { income, expense, balance: income - expense };
  }

  function applyFilters(list){
    const q = (el.searchText.value || '').trim().toLowerCase();
    const t = el.filterType.value;
    const from = el.filterFrom.value ? new Date(el.filterFrom.value) : null;
    const to = el.filterTo.value ? new Date(el.filterTo.value) : null;

    return list.filter(item=>{
      if(t !== 'all' && item.type !== t) return false;
      if(from || to){
        const d = item.date ? new Date(item.date) : null;
        if(d){
          if(from && d < from) return false;
          if(to){
            const toEnd = new Date(to);
            toEnd.setHours(23,59,59,999);
            if(d > toEnd) return false;
          }
        }
      }
      if(q){
        const hay = [item.purpose, item.category, item.note].join(' ').toLowerCase();
        if(!hay.includes(q)) return false;
      }
      return true;
    });
  }

  function render(){
    const list = loadData();
    const filtered = applyFilters(list);

    const sums = computeSums(filtered);
    el.summaryIncome.textContent = formatCurrency(sums.income);
    el.summaryExpense.textContent = formatCurrency(sums.expense);
    el.summaryBalance.textContent = formatCurrency(sums.balance);

    el.tableBody.innerHTML = '';
    if(filtered.length === 0){
      const tr = document.createElement('tr');
      const td = document.createElement('td');
      td.colSpan = 7;
      td.style.color = '#7b6b7f';
      td.textContent = 'Keine Einträge gefunden. Füge rechts einen neuen Eintrag hinzu ✨';
      tr.appendChild(td);
      el.tableBody.appendChild(tr);
      return;
    }

    const sorted = [...filtered].sort((a,b)=>{
      const da = a.date ? new Date(a.date).getTime() : 0;
      const db = b.date ? new Date(b.date).getTime() : 0;
      return db - da;
    });

    for(const item of sorted){
      const tr = document.createElement('tr');

      const tdDate = document.createElement('td');
      tdDate.textContent = item.date ? new Date(item.date).toLocaleDateString('de-DE') : '';
      tr.appendChild(tdDate);

      const tdPurpose = document.createElement('td');
      tdPurpose.textContent = item.purpose || '';
      tr.appendChild(tdPurpose);

      const tdCat = document.createElement('td');
      tdCat.textContent = item.category || '';
      tr.appendChild(tdCat);

      const tdType = document.createElement('td');
      tdType.textContent = item.type === 'income' ? 'Einnahme' : 'Ausgabe';
      tr.appendChild(tdType);

      const tdAmount = document.createElement('td');
      const span = document.createElement('span');
      span.className = 'amount ' + (item.type === 'income' ? 'income' : 'expense');
      span.textContent = (item.type === 'income' ? '+' : '−') + ' ' + formatCurrency(item.amount).replace('€','').trim();
      tdAmount.appendChild(span);
      tr.appendChild(tdAmount);

      const tdNote = document.createElement('td');
      tdNote.textContent = item.note || '';
      tr.appendChild(tdNote);

      const tdAct = document.createElement('td');
      tdAct.className = 'actions';

      const btnEdit = document.createElement('button');
      btnEdit.className = 'btn-ghost';
      btnEdit.textContent = 'Bearbeiten';
      btnEdit.addEventListener('click', ()=> startEdit(item.id));
      tdAct.appendChild(btnEdit);

      const btnDel = document.createElement('button');
      btnDel.className = 'btn-ghost';
      btnDel.textContent = 'Löschen';
      btnDel.addEventListener('click', ()=> deleteItem(item.id));
      tdAct.appendChild(btnDel);

      tr.appendChild(tdAct);

      el.tableBody.appendChild(tr);
    }
  }

  function clearForm(){
    el.dateInput.value = '';
    el.typeInput.value = 'expense';
    el.purposeInput.value = '';
    el.categoryInput.value = '';
    el.amountInput.value = '';
    el.noteInput.value = '';
  }

  function validateForm(){
    const errors = [];
    if(!el.dateInput.value) errors.push('Bitte Datum angeben.');
    if(!el.purposeInput.value.trim()) errors.push('Bitte Zweck angeben.');
    const amount = Number(el.amountInput.value);
    if(isNaN(amount) || amount <= 0) errors.push('Betrag muss größer als 0 sein.');
    return errors;
  }

  function addItem(){
    const errors = validateForm();
    if(errors.length){
      alert(errors.join('\n'));
      return;
    }
    const list = loadData();
    const item = {
      id: (crypto.randomUUID ? crypto.randomUUID() : String(Date.now()) + Math.random().toString(16).slice(2)),
      date: el.dateInput.value,
      type: el.typeInput.value,
      purpose: el.purposeInput.value.trim(),
      category: el.categoryInput.value.trim(),
      amount: Number(el.amountInput.value),
      note: el.noteInput.value.trim(),
      createdAt: Date.now()
    };
    pushUndo({kind:'add', payload: item});
    list.push(item);
    saveData(list);
    render();
    clearForm();
  }

  function startEdit(id){
    const list = loadData();
    const found = list.find(x=>x.id===id);
    if(!found) return;

    el.dateInput.value = found.date || '';
    el.typeInput.value = found.type || 'expense';
    el.purposeInput.value = found.purpose || '';
    el.categoryInput.value = found.category || '';
    el.amountInput.value = (found.amount != null ? String(found.amount) : '');
    el.noteInput.value = found.note || '';

    el.btnAdd.textContent = 'Änderungen speichern 💾';
    el.btnAdd.classList.add('secondary');
    el.btnAdd.onclick = function(){
      saveEdit(id);
    };
  }

  function saveEdit(id){
    const errors = validateForm();
    if(errors.length){
      alert(errors.join('\n'));
      return;
    }
    const list = loadData();
    const idx = list.findIndex(x=>x.id===id);
    if(idx < 0) return;
    const before = {...list[idx]};

    const updated = {
      ...list[idx],
      date: el.dateInput.value,
      type: el.typeInput.value,
      purpose: el.purposeInput.value.trim(),
      category: el.categoryInput.value.trim(),
      amount: Number(el.amountInput.value),
      note: el.noteInput.value.trim(),
      updatedAt: Date.now()
    };
    list[idx] = updated;
    pushUndo({kind:'edit', payload: {before, after: updated}});
    saveData(list);
    render();

    el.btnAdd.textContent = 'Hinzufügen ✨';
    el.btnAdd.classList.remove('secondary');
    el.btnAdd.onclick = addItem;
    clearForm();
  }

  function deleteItem(id){
    const list = loadData();
    const idx = list.findIndex(x=>x.id===id);
    if(idx < 0) return;
    const removed = list[idx];
    if(!confirm('Diesen Eintrag wirklich löschen?')) return;
    list.splice(idx,1);
    pushUndo({kind:'delete', payload: removed});
    saveData(list);
    render();
  }

  function pushUndo(entry){
    UNDO_STACK.push(entry);
    if(UNDO_STACK.length > 50) UNDO_STACK.shift();
  }

  function undo(){
    const last = UNDO_STACK.pop();
    if(!last) return;
    const list = loadData();
    if(last.kind === 'add'){
      const idx = list.findIndex(x=>x.id===last.payload.id);
      if(idx >= 0) list.splice(idx,1);
    }else if(last.kind === 'delete'){
      list.push(last.payload);
    }else if(last.kind === 'edit'){
      const idx = list.findIndex(x=>x.id===last.payload.after.id);
      if(idx >= 0) list[idx] = last.payload.before;
    }
    saveData(list);
    render();
  }

  function clearFilters(){
    el.searchText.value = '';
    el.filterType.value = 'all';
    el.filterFrom.value = '';
    el.filterTo.value = '';
    render();
  }

  // Events
  el.btnAdd.addEventListener('click', addItem);
  el.btnClear.addEventListener('click', clearForm);
  el.btnUndo.addEventListener('click', undo);
  el.btnClearFilters.addEventListener('click', clearFilters);
  el.searchText.addEventListener('input', render);
  el.filterType.addEventListener('change', render);
  el.filterFrom.addEventListener('change', render);
  el.filterTo.addEventListener('change', render);

  // Defaults
  const today = new Date();
  el.dateInput.value = today.toISOString().slice(0,10);
  el.typeInput.value = 'expense';

  render();

  // Shortcut
  document.addEventListener('keydown', (e)=>{
    if((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z'){
      e.preventDefault();
      undo();
    }
  });
})();
