// Phase 2 retention guard. Keeps history visible after the daily quota is exhausted
// while applying the plan's product retention window to cloud-loaded history.
(function () {
  'use strict';
  const KEY = 'coolcalci_phase1_v5';
  const windows = { free: 24 * 60 * 60 * 1000, pro_monthly: 31 * 24 * 60 * 60 * 1000, pro_yearly: 366 * 24 * 60 * 60 * 1000 };

  function state() {
    try { return JSON.parse(localStorage.getItem(KEY) || '{}'); } catch (_) { return {}; }
  }
  function save(s) { try { localStorage.setItem(KEY, JSON.stringify(s)); } catch (_) {} }
  function prune() {
    const s = state();
    const plan = s.plan || 'free';
    const cutoff = Date.now() - (windows[plan] || windows.free);
    if (Array.isArray(s.history)) s.history = s.history.filter(x => Number(x.time || 0) >= cutoff);
    save(s);
    document.dispatchEvent(new CustomEvent('coolcalci:history-retention-applied'));
  }

  document.addEventListener('DOMContentLoaded', () => {
    prune();
    setTimeout(prune, 1500);
  });
  window.addEventListener('storage', prune);
})();
