// Summen-Logik, Glitzer-Trail & Konfetti
(function () {
  const yearEl = document.getElementById('year');
  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const saldoRowsBody = document.getElementById('saldo-rows');
  const addRowBtn = document.getElementById('add-row');
  const recalcBtn = document.getElementById('recalc');
  const clearBtn = document.getElementById('clear-rows');

  const sumIncomeEl = document.getElementById('sum-income');
  const sumExpenseEl = document.getElementById('sum-expense');
  const sumTotalEl = document.getElementById('sum-total');

  // Überblicks-Tabelle
  const overviewIncomeEl = document.getElementById('overview-income');
  const overviewExpenseEl = document.getElementById('overview-expense');
  const overviewTotalEl = document.getElementById('overview-total');

  // Effekt-Layer
  const sparkleLayer = document.getElementById('sparkle-layer');
  const confettiLayer = document.getElementById('confetti-layer');

  const appState = { version: '0.7.0', initialized: true };
  console.log('Financefrenzy gestartet.', appState);

  /* ----- Finanzen: Berechnung ----- */
  function parseEuro(value) {
    if (!value) return 0;
    const normalized = String(value)
      .replace(/\s/g, '')
      .replace(/\./g, '')
      .replace(',', '.')
      .replace(/[^\d.-]/g, '');
    const num = parseFloat(normalized);
    return isNaN(num) ? 0 : num;
  }

  function formatEuro(num) {
    try {
      return num.toLocaleString('de-DE', {
        style: 'currency',
        currency: 'EUR',
        minimumFractionDigits: 2
      });
    } catch {
      const n = Math.round(num * 100) / 100;
      return n.toFixed(2) + ' €';
    }
  }

  function recalcTotals() {
    let income = 0;
    let expense = 0;

    const rows = saldoRowsBody.querySelectorAll('tr');
    rows.forEach((tr) => {
      const typeSelect = tr.querySelector('select');
      const amountCell = tr.cells[3];
      const amount = parseEuro(amountCell ? amountCell.textContent : '');

      if (typeSelect && typeSelect.value === 'income') {
        income += amount;
      } else {
        expense += amount;
      }
    });

    const total = income - expense;

    // Oben in den Cards
    sumIncomeEl.textContent = formatEuro(income);
    sumExpenseEl.textContent = formatEuro(expense);
    sumTotalEl.textContent = formatEuro(total);

    // Unten in der Mini-Überblicks-Tabelle
    if (overviewIncomeEl) overviewIncomeEl.textContent = formatEuro(income);
    if (overviewExpenseEl) overviewExpenseEl.textContent = formatEuro(expense);
    if (overviewTotalEl) overviewTotalEl.textContent = formatEuro(total);
  }

  function addRow() {
    const tr = document.createElement('tr');

    const tdDate = document.createElement('td');
    tdDate.contentEditable = 'true';
    tdDate.setAttribute('data-placeholder', 'TT.MM.JJJJ');

    const tdDesc = document.createElement('td');
    tdDesc.contentEditable = 'true';
    tdDesc.setAttribute('data-placeholder', 'Beschreibung …');

    const tdType = document.createElement('td');
    const select = document.createElement('select');
    select.innerHTML = `
      <option value="income">Einnahme</option>
      <option value="expense">Ausgabe</option>
    `;
    tdType.appendChild(select);

    const tdAmount = document.createElement('td');
    tdAmount.contentEditable = 'true';
    tdAmount.setAttribute('data-placeholder', '0,00');

    tr.appendChild(tdDate);
    tr.appendChild(tdDesc);
    tr.appendChild(tdType);
    tr.appendChild(tdAmount);

    saldoRowsBody.appendChild(tr);

    // Konfetti bei neuer Zeile
    triggerConfetti();
  }

  function clearRows() {
    saldoRowsBody.innerHTML = '';
    recalcTotals();
  }

  /* ----- Glitzer-Trail (Cursor) ----- */
  let lastSparkleTime = 0;
  window.addEventListener('mousemove', (e) => {
    const now = performance.now();
    // throttle ~ alle 20ms
    if (now - lastSparkleTime < 20) return;
    lastSparkleTime = now;

    if (!sparkleLayer) return;
    const s = document.createElement('div');
    s.className = 'sparkle';
    s.style.left = (e.clientX - 4) + 'px';
    s.style.top = (e.clientY - 4) + 'px';
    sparkleLayer.appendChild(s);
    setTimeout(() => s.remove(), 700);
  });

  /* ----- Pinkes Konfetti ----- */
  function triggerConfetti() {
    if (!confettiLayer) return;
    const count = Math.min(80, Math.floor(window.innerWidth / 15)); // dynamisch je Breite
    for (let i = 0; i < count; i++) {
      const c = document.createElement('div');
      c.className = 'confetti';
      // zufällige Farbvariation
      if (i % 3 === 0) c.classList.add('alt');
      if (i % 5 === 0) c.classList.add('light');

      const startX = Math.random() * window.innerWidth;
      const delay = (Math.random() * 300) | 0;
      const duration = 900 + (Math.random() * 800);

      c.style.left = startX + 'px';
      c.style.top = '-10px';
      c.style.animationDuration = duration + 'ms';
      c.style.animationDelay = delay + 'ms';
      c.style.transform = `rotate(${Math.random() * 360}deg)`;

      confettiLayer.appendChild(c);
      setTimeout(() => c.remove(), duration + delay + 200);
    }
  }

  /* ----- Events ----- */
  if (addRowBtn) addRowBtn.addEventListener('click', addRow);
  if (clearBtn) clearBtn.addEventListener('click', clearRows);
  if (recalcBtn) recalcBtn.addEventListener('click', () => { recalcTotals(); triggerConfetti(); });

  // Live-Neuberechnung bei Änderungen an Betrag oder Typ + Konfetti
  saldoRowsBody.addEventListener('input', (e) => {
    const isAmountCell = e.target && e.target.closest('td') && e.target.closest('td').cellIndex === 3;
    const isTypeSelect = e.target && e.target.tagName === 'SELECT';
    if (isAmountCell || isTypeSelect) {
      recalcTotals();
      triggerConfetti();
    }
  });

  // Initial
  recalcTotals();
})();
