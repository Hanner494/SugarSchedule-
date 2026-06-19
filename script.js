// Init, UI-Hilfen und einfache Summen-Logik (für spätere Erweiterungen vorbereitet)
(function () {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  const saldoRowsBody = document.getElementById('saldo-rows');
  const addRowBtn = document.getElementById('add-row');
  const recalcBtn = document.getElementById('recalc');
  const clearBtn = document.getElementById('clear-rows');

  const sumIncomeEl = document.getElementById('sum-income');
  const sumExpenseEl = document.getElementById('sum-expense');
  const sumTotalEl = document.getElementById('sum-total');

  // State-Objekt (kann später durch localStorage/Backend ersetzt werden)
  const appState = {
    version: '0.2.0',
    initialized: true
  };
  console.log('Financefrenzy gestartet.', appState);

  // Hilfsfunktionen
  function parseEuro(value) {
    if (!value) return 0;
    // Erlaubt Eingaben wie "1.234,56" oder "1234,56" oder "1234.56"
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

    sumIncomeEl.textContent = formatEuro(income);
    sumExpenseEl.textContent = formatEuro(expense);
    sumTotalEl.textContent = formatEuro(total);
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
    const optIn = document.createElement('option');
    optIn.value = 'income';
    optIn.textContent = 'Einnahme';
    const optOut = document.createElement('option');
    optOut.value = 'expense';
    optOut.textContent = 'Ausgabe';
    select.appendChild(optIn);
    select.appendChild(optOut);
    tdType.appendChild(select);

    const tdAmount = document.createElement('td');
    tdAmount.contentEditable = 'true';
    tdAmount.setAttribute('data-placeholder', '0,00');

    tr.appendChild(tdDate);
    tr.appendChild(tdDesc);
    tr.appendChild(tdType);
    tr.appendChild(tdAmount);

    saldoRowsBody.appendChild(tr);
  }

  function clearRows() {
    saldoRowsBody.innerHTML = '';
    recalcTotals();
  }

  // Events
  if (addRowBtn) addRowBtn.addEventListener('click', addRow);
  if (clearBtn) clearBtn.addEventListener('click', clearRows);
  if (recalcBtn) recalcBtn.addEventListener('click', recalcTotals);

  // Live-Neuberechnung bei Änderungen
  saldoRowsBody.addEventListener('input', (e) => {
    // Nur neu berechnen, wenn Betrag/Typ geändert wird
    const isAmountCell = e.target && e.target.closest('td') && e.target.closest('td').cellIndex === 3;
    const isTypeSelect = e.target && e.target.tagName === 'SELECT';
    if (isAmountCell || isTypeSelect) {
      recalcTotals();
    }
  });

  // Initiale Berechnung
  recalcTotals();
})();
