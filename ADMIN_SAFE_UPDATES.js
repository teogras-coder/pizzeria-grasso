/**
 * 🛡️ ADMIN SAFE UPDATES - Antica Pizzeria Grasso
 * Versione: 2.0 (2026-07-02)
 * 
 * PROTEZIONE STAMPANTE + RISTAMPA
 * Usa SEMPRE update() e MAI remove() o set()
 * 
 * DIPENDENZE NECESSARIE (devono essere definite prima):
 * - db: istanza Firebase Realtime Database
 * - ordersCache: oggetto con cache ordini { [id]: order }
 * - showToast(msg): funzione per mostrare toast
 * - showPrompt(title, label, placeholder, default): ritorna Promise<string|null>
 * - showConfirm(title, msg): ritorna Promise<boolean>
 * - sanitize(str): funzione sanitizzazione input
 * - renderOrders(cache): funzione re-render ordini
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🔍 CONTROLLO DIPENDENZE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function checkDependencies() {
  const missing = [];
  if (typeof db === 'undefined') missing.push('db');
  if (typeof ordersCache === 'undefined') missing.push('ordersCache');
  if (typeof showToast !== 'function') missing.push('showToast');
  if (typeof showPrompt !== 'function') missing.push('showPrompt');
  if (typeof showConfirm !== 'function') missing.push('showConfirm');
  if (typeof sanitize !== 'function') missing.push('sanitize');
  if (typeof renderOrders !== 'function') missing.push('renderOrders');
  
  if (missing.length > 0) {
    console.error('[SAFE_UPDATES] Dipendenze mancanti:', missing);
    showToast('❌ Errore configurazione: ' + missing.join(', '));
    return false;
  }
  return true;
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ AGGIORNA STATUS ORDINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function updateOrderStatus(id, st, orderType) {
  /**
   * Cambia lo status di un ordine IN SICUREZZA
   * @param {string} id - ID Firebase dell'ordine
   * @param {string} st - Nuovo status
   * @param {string} orderType - 'delivery' o 'pickup'
   */
  if (!checkDependencies()) return;
  
  const validStatus = [
    'new', 'preparing', 'ready', 'picked', 
    'delivering', 'delivered', 'rifiutato', 'annullato'
  ];
  
  if (!validStatus.includes(st)) {
    showToast('❌ Status non valido: ' + st);
    return;
  }
  
  const safeUpdate = {
    status: st,
    timestamp_status_changed: Date.now(),
    timestamp_status_changed_iso: new Date().toISOString()
    // ⚠️ NON TOCCARE: stampato_cucina, stampato_annullato
  };
  
  db.ref('ordini/' + id).update(safeUpdate)
    .then(() => {
      showToast('✅ Aggiornato a: ' + st);
      console.log(`[SAFE] Ordine ${id} → ${st}`);
    })
    .catch(err => {
      showToast('❌ Errore: ' + err.message);
      console.error('[SAFE] Errore update:', err);
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖨️ RISTAMPA ORDINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function ristampaOrdine(id) {
  /**
   * Ristampa un ordine resettando i flag di stampa
   * Il Raspberry vedrà flag=false e ristamperà il ticket
   * @param {string} id - ID Firebase dell'ordine
   */
  if (!checkDependencies()) return;
  
  const order = ordersCache[id];
  if (!order) {
    showToast('❌ Ordine non trovato in cache');
    return;
  }
  
  const orderNum = order.orderId || id;
  const ok = confirm(`Ristampare ordine ${orderNum}?\n\nIl ticket verrà ristampato dalla stampante di cucina.`);
  if (!ok) return;
  
  const resetUpdate = {
    stampato_cucina: false,
    stampato_annullato: false,
    reprint_requested_at: Date.now()
  };
  
  db.ref('ordini/' + id).update(resetUpdate)
    .then(() => {
      showToast('🖨️ Ristampa richiesta! Ticket in arrivo...');
      console.log(`[SAFE] Ristampa ordine ${orderNum}: flag resettati`);
    })
    .catch(err => {
      showToast('❌ Errore: ' + err.message);
      console.error('[SAFE] Errore ristampa:', err);
    });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ❌ RIFIUTA ORDINE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function rifiutaOrdine(id) {
  /**
   * Rifiuta un ordine con motivo
   * @param {string} id - ID Firebase dell'ordine
   */
  if (!checkDependencies()) return;
  
  let motivo;
  try {
    motivo = await showPrompt(
      'Rifiuta Ordine',
      'Motivo del rifiuto:',
      'Es: Troppi ordini in coda',
      'Troppi ordini in coda'
    );
  } catch (e) {
    console.error('[SAFE] Errore showPrompt:', e);
    return;
  }
  
  if (motivo === null) return; // Annullato dall'utente
  if (!motivo.trim()) {
    showToast('⚠️ Scrivi un motivo');
    return;
  }
  
  db.ref('ordini/' + id).update({
    status: 'rifiutato',
    motivoRifiuto: sanitize(motivo),
    timestampRifiuto: Date.now(),
    timestampRifiuto_iso: new Date().toISOString()
    // ✅ NON rimuovo stampato_cucina
  })
  .then(() => {
    showToast('❌ Ordine rifiutato');
    renderOrders(ordersCache);
  })
  .catch(err => {
    showToast('❌ Errore: ' + err.message);
    console.error('[SAFE] Errore rifiuto:', err);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🗑️ ELIMINA ORDINE (soft delete)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
async function deleteOrder(id) {
  /**
   * Cancella un ordine IN SICUREZZA (soft delete)
   * Cambia status a 'deleted' invece di remove()
   * @param {string} id - ID Firebase dell'ordine
   */
  if (!checkDependencies()) return;
  
  let ok;
  try {
    ok = await showConfirm(
      'Eliminare Ordine?', 
      'Questa azione non può essere annullata. L\'ordine verrà marcato come eliminato.'
    );
  } catch (e) {
    console.error('[SAFE] Errore showConfirm:', e);
    return;
  }
  
  if (!ok) return;
  
  db.ref('ordini/' + id).update({
    status: 'deleted',
    deleted_at: Date.now(),
    deleted_at_iso: new Date().toISOString()
    // ✅ Mantieni stampato_cucina e stampato_annullato
  })
  .then(() => {
    showToast('🗑️ Eliminato');
    renderOrders(ordersCache);
  })
  .catch(err => {
    showToast('❌ Errore: ' + err.message);
    console.error('[SAFE] Errore delete:', err);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 AGGIUNGI NOTA
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
function addOrderNote(id, note) {
  /**
   * Aggiunge una nota all'ordine senza toccare i flag
   * @param {string} id - ID Firebase
   * @param {string} note - Testo della nota
   */
  if (!checkDependencies()) return;
  
  if (!note || !note.trim()) {
    showToast('⚠️ Scrivi una nota');
    return;
  }
  
  db.ref('ordini/' + id).update({
    notes: sanitize(note),
    updated_at: Date.now(),
    updated_at_iso: new Date().toISOString()
  })
  .then(() => {
    showToast('✅ Nota aggiunta');
  })
  .catch(err => {
    showToast('❌ Errore: ' + err.message);
    console.error('[SAFE] Errore nota:', err);
  });
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📋 ESPORTA FUNZIONI (se usi moduli)
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
if (typeof window !== 'undefined') {
  window.updateOrderStatus = updateOrderStatus;
  window.ristampaOrdine = ristampaOrdine;
  window.rifiutaOrdine = rifiutaOrdine;
  window.deleteOrder = deleteOrder;
  window.addOrderNote = addOrderNote;
}

console.log('[SAFE_UPDATES] ✅ Modulo caricato - v2.0');
