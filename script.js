// Kleines Skript, um das Jahr im Footer automatisch zu setzen.
// (Bereit für spätere Erweiterungen: Budget-Logik, Transaktionen, Speicherung etc.)
(function () {
  const yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  // Platzhalter für zukünftigen App-Status
  const appState = {
    version: '0.1.0',
    initialized: true
  };

  // Debug-Hinweis in der Konsole
  // Öffne die Browser-Konsole, um das zu sehen (Rechtsklick -> Untersuchen -> Konsole)
  console.log('Financefrenzy gestartet.', appState);
})();
