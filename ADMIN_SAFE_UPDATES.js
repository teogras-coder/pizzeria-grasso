/**
 * 🛡️ PROTEZIONE STAMPANTE + RISTAMPA
 * 
 * Copia queste funzioni nel admin.html (dopo la riga ~1100)
 * 
 * IMPORTANTE: Usa sempre update() e NON remove() o set()
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ FUNZIONE SAFE: Aggiorna Status Ordine
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function updateOrderStatus(id, st, orderType) {
  /**
   * Cambia lo status di un ordine IN SICUREZZA
   * 
   * @param {string} id - ID Firebase dell'ordine
   * @param {string} st - Nuovo status: 'new','preparing','ready','picked','delivering','delivered'
   * @param {string} orderType - 'delivery' o 'pickup'
   */
  
  // ✅ Lista di status validi
  const validStatus = [
    'new',
    'preparing',
    'ready',
    'picked',
    'delivering',
    'delivered',
    'rifiutato',
    'annullato'
  ];
  
  if (!validStatus.includes(st)) {
    showToast('❌ Status non valido: ' + st);
    return;
  }
  
  try {
    // ✅ USO SEMPRE update() - mai remove() o set()
    const safeUpdate = {
      status: st,
      timestamp_status_changed: Date.now()
      // ⚠️ NON TOCCARE: stampato_cucina, stampato_annullato
    };
    
    db.ref('ordini/' + id).update(safeUpdate)
      .then(() => {
        showToast('✅ Aggiornato');
      })
      .catch(err => {
        showToast('❌ Errore: ' + err.message);
        console.error('Errore update:', err);
      });
      
  } catch(e) {
    showToast('❌ Errore aggiornamento: ' + e.message);
    console.error('Errore:', e);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 🖨️ FUNZIONE: Ristampa Ordine
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function ristampaOrdine(id) {
  /**
   * Ristampa un ordine che è già stato stampato
   * 
   * Cosa fa:
   * 1. Resetta i flag di stampa (stampato_cucina, stampato_annullato)
   * 2. Il Raspberry vede che non è più "stampato"
   * 3. Ristampa automaticamente il ticket
   * 
   * @param {string} id - ID Firebase dell'ordine
   */
  
  const order = ordersCache[id];
  if (!order) {
    showToast('❌ Ordine non trovato');
    return;
  }
  
  const ok = confirm(`Ristampare ordine ${order.orderId || id}?`);
  if (!ok) return;
  
  try {
    // ✅ Reset dei flag di stampa
    const resetUpdate = {
      stampato_cucina: false,        // Resetta il flag
      stampato_annullato: false      // Resetta il flag
      // ⚠️ NON tocchiamo gli altri campi!
    };
    
    db.ref('ordini/' + id).update(resetUpdate)
      .then(() => {
        showToast('🖨️ Ristampa richiesta! Il ticket arriverà tra pochi secondi...');
        console.log(`Ristampa ordine ${order.orderId}: flag resettati`);
      })
      .catch(err => {
        showToast('❌ Errore: ' + err.message);
        console.error('Errore ristampa:', err);
      });
      
  } catch(e) {
    showToast('❌ Errore ristampa: ' + e.message);
    console.error('Errore:', e);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ FUNZIONE SAFE: Rifiuta Ordine
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function rifiutaOrdine(id) {
  /**
   * Rifiuta un ordine con motivo
   * La stampante vedrà status='rifiutato' e stamperà di nuovo? NO!
   * Perché usiamo un flag separato 'stampato_annullato'
   */
  
  const motivo = await showPrompt(
    'Rifiuta Ordine',
    'Motivo del rifiuto:',
    'Es: Troppi ordini in coda',
    'Troppi ordini in coda'
  );
  
  if (motivo === null) return;
  if (!motivo.trim()) {
    showToast('⚠️ Scrivi un motivo');
    return;
  }
  
  try {
    // ✅ USO update() - preserva i flag di stampa
    db.ref('ordini/' + id).update({
      status: 'rifiutato',
      motivoRifiuto: sanitize(motivo),
      timestampRifiuto: Date.now()
      // ✅ NON rimuovo stampato_cucina
    })
    .then(() => {
      showToast('❌ Ordine rifiutato');
      renderOrders(ordersCache);
    })
    .catch(err => showToast('❌ Errore: ' + err.message));
    
  } catch(e) {
    showToast('❌ Errore: ' + e.message);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ FUNZIONE SAFE: Cancella Ordine
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

async function deleteOrder(id) {
  /**
   * Cancella un ordine IN SICUREZZA
   * 
   * INVECE di: db.ref('ordini/' + id).remove()
   * FACCIO:    Cambio status a 'deleted'
   * 
   * Questo mantiene i flag di stampa intatti!
   */
  
  const ok = await showConfirm('Eliminare Ordine?', 'Questa azione non può essere annullata.');
  if (!ok) return;
  
  try {
    // ✅ USO update() - non remove()
    db.ref('ordini/' + id).update({
      status: 'deleted',
      deleted_at: Date.now()
      // ✅ Mantieni stampato_cucina e stampato_annullato
    })
    .then(() => {
      showToast('🗑️ Eliminato');
      renderOrders(ordersCache);
    })
    .catch(err => showToast('❌ Errore: ' + err.message));
    
  } catch(e) {
    showToast('❌ Errore: ' + e.message);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ✅ FUNZIONE SAFE: Aggiungi Note
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

function addOrderNote(id, note) {
  /**
   * Aggiungi una nota all'ordine
   * Sicuro perché non tocca i flag di stampa
   */
  
  if (!note || !note.trim()) {
    showToast('⚠️ Scrivi una nota');
    return;
  }
  
  try {
    db.ref('ordini/' + id).update({
      notes: sanitize(note),
      updated_at: Date.now()
    })
    .then(() => {
      showToast('✅ Nota aggiunta');
    })
    .catch(err => showToast('❌ Errore: ' + err.message));
    
  } catch(e) {
    showToast('❌ Errore: ' + e.message);
  }
}

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// 📝 ISTRUZIONI HTML PER IL BOTTONE
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/**
 * AGGIUNGI QUESTO BOTTONE NELLA SEZIONE .order-actions
 * (circa alla riga 983-999 del renderOrders)
 * 
 * <button class="btn-secondary" onclick="ristampaOrdine('${id}')">
 *   <i class="fas fa-print"></i> Ristampa
 * </button>
 * 
 * O se vuoi un pulsante più visibile per la ristampa:
 * 
 * <button class="btn-whatsapp" style="background:#7c3aed;color:white;" 
 *         onclick="ristampaOrdine('${id}')">
 *   <i class="fas fa-print"></i> Ristampa Ticket
 * </button>
 */

// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
// ❌ FUNZIONI VIETATE - NON USARE MAI!
// ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

/*
 * ❌ PERICOLO #1: Cancellazione Completa
 * 
 * db.ref('ordini/' + id).remove();  // ← PERDI I FLAG DI STAMPA!
 * 
 * Causa: Il Raspberry non sa che è già stato stampato
 * Risultato: Ristampa lo stesso ordine!
 */

/*
 * ❌ PERICOLO #2: Sovrascrittura Completa
 * 
 * db.ref('ordini/' + id).set({status: 'preparing'});  // ← PERDI TUTTO!
 * 
 * Causa: Sovrascrive TUTTI i campi, compresa data dell'ordine
 * Risultato: L'ordine perde informazioni critiche
 */

/*
 * ❌ PERICOLO #3: Toccare Flag di Stampa (MALE)
 * 
 * db.ref('ordini/' + id + '/stampato_cucina').remove();  // ← SBAGLIATO!
 * 
 * ✅ GIUSTO - Usa update() come nella funzione ristampaOrdine()
 * 
 * db.ref('ordini/' + id).update({
 *   stampato_cucina: false,
 *   stampato_annullato: false
 * });
 */

/*
 * ❌ PERICOLO #4: Cambiare orderId
 * 
 * db.ref('ordini/' + id).update({orderId: 'ORD-99999'});  // ← DOPO stampa!
 * 
 * Causa: Il ticket è già stampato con ORD-00001, ma Firebase dice ORD-99999
 * Risultato: Confusione tra cliente e cucina
 */
