# 🖨️ Protezione Stampante Bluetooth - IMPORTANTE!

## ⚠️ Cosa Proteggere

Il Raspberry ascolta Firebase per stampare gli ordini. **Questi campi NON vanno toccati** dal admin:

```
stampato_cucina       ← Flag che dice "già stampato come NEW"
stampato_annullato    ← Flag che dice "già stampato come ANNULLATO"
orderId              ← Es: ORD-00001 (usato per la stampa)
```

Se li tocci, il Raspberry ristampa tutto! 😱

---

## ✅ Operazioni SICURE nel Admin

### Cambiare Status Ordine
```javascript
// ✅ BENE - Usa update()
db.ref('ordini/' + id).update({
  status: 'preparing'
});
```

### Aggiungere Note
```javascript
// ✅ BENE
db.ref('ordini/' + id).update({
  notes: 'Cliente allergia arachidi'
});
```

### Cambiare Dati Cliente (PRIMA della stampa)
```javascript
// ✅ BENE - se fatto subito
db.ref('ordini/' + id).update({
  customerName: 'Mario Rossi',
  customerPhone: '3201234567'
});
```

---

## ❌ Operazioni PERICOLOSE

### ❌ Cancellare Completamente
```javascript
// PERICOLO! Non fare mai:
db.ref('ordini/' + id).remove();  // ← RIMUOVE TUTTO!

// INVECE fai:
db.ref('ordini/' + id).update({
  status: 'deleted',
  deleted_at: Date.now()
});
```

### ❌ Sovrascrivere Tutto
```javascript
// PERICOLO! Non fare mai:
db.ref('ordini/' + id).set({
  status: 'preparing'
  // ← Perdi tutti gli altri campi!
});
```

### ❌ Toccare i Flag di Stampa
```javascript
// PERICOLO! Non fare mai:
db.ref('ordini/' + id + '/stampato_cucina').remove();
db.ref('ordini/' + id + '/stampato_annullato').remove();
```

---

## 🔄 Flusso Corretto

```
1. Cliente ordina
   ├─ status: 'new'
   ├─ stampato_cucina: false
   └─ stampato_annullato: false

2. Raspberry ascolta Firebase
   ├─ Vede status='new' + stampato_cucina=false
   ├─ Stampa il ticket
   └─ Imposta stampato_cucina=true

3. Admin Gestionale
   ├─ Vede nuovo ordine
   ├─ Clicca "Prepara"
   └─ Cambia status='preparing'
      (senza toccare ai flag di stampa!)

4. Se Annullato
   ├─ Admin clicca "Rifiuta"
   ├─ Cambia status='annullato'
   ├─ Raspberry stampa "ANNULLATO"
   └─ Imposta stampato_annullato=true
```

---

## 📱 Comandi Admin PERMESSI

Questi sono **SICURI** per il admin:

```javascript
// ✅ Cambiare status
db.ref('ordini/' + id).update({ status: 'preparing' });

// ✅ Aggiungere note
db.ref('ordini/' + id).update({ notes: 'Testo' });

// ✅ Rifiutare ordine
db.ref('ordini/' + id).update({
  status: 'rifiutato',
  motivoRifiuto: 'Troppi ordini'
});

// ✅ Annullare ordine
db.ref('ordini/' + id).update({
  status: 'annullato',
  motivoAnnullamento: 'Motivo'
});
```

---

## 🚨 Se Qualcosa Va Male

### Problema: Ordine Stampato 2 Volte

**Causa:** Flag `stampato_cucina` eliminato per sbaglio

**Soluzione:**
```javascript
// Ripristina il flag nel Firebase Console:
// ordini → [ordineID] → aggiungi campo:
stampato_cucina: true
```

### Problema: Stampante Non Stampa

**Controlla:**
1. Il Raspberry è acceso?
   ```bash
   ssh pi@raspberrypi.local
   ps aux | grep printer_bot
   ```

2. Firebase è raggiungibile?
   ```bash
   sudo tail -f /var/log/syslog | grep printer
   ```

3. Stampante è connessa?
   ```bash
   rfcomm list
   ```

### Problema: Ristampa Continua

**Causa:** Flag `stampato_cucina` o `stampato_annullato` non impostato

**Soluzione:** Nel Firebase Console, aggiungi manualmente i flag dopo la stampa

---

## 📊 Campi Ordine - Cosa È Protetto

| Campo | Protetto? | Motivo |
|-------|-----------|--------|
| `status` | ⚠️ Parziale | OK cambiarsi, non toccare i flag |
| `orderId` | 🔴 Critico | NO cambiarsi dopo stampa |
| `customerName` | ⚠️ OK | Se prima della stampa |
| `notes` | ✅ Si | Aggiungere è sicuro |
| `stampato_cucina` | 🔴 Critico | NON TOCCARE! |
| `stampato_annullato` | 🔴 Critico | NON TOCCARE! |
| `items` | ✅ Si | Se prima della stampa |
| `finalTotal` | ✅ Si | Se prima della stampa |

---

## 📝 Recap Veloce

| Azione | Sicuro? | Note |
|--------|---------|------|
| `update({status: '...'})` | ✅ | Usa sempre questo |
| `remove()` | ❌ | Perdi i flag! |
| `set({...})` | ❌ | Sovrascrive tutto |
| Toccare `stampato_*` | ❌ | Ristampa ordini |
| Cambiare `orderId` | ❌ DOPO stampa | OK prima |

---

## 🎯 REGOLA D'ORO

**Quando hai dubbi, chiedi prima di fare update direttamente!**

Se la risposta è:
- "Potrebbe questo comando toccare la stampa?" → SÌ → Usa `update()`
- "Potrebbe questo comando toccare la stampa?" → NO → Usa `update()` comunque!

In altre parole: **USA SEMPRE `update()` ✅**

---

**Link Utili:**
- 📄 [printer_bot.py](./printer_bot.py) - Lo script completo del Raspberry
- 📄 [ADMIN_SAFE_UPDATES.js](./ADMIN_SAFE_UPDATES.js) - Funzioni safe da copiare nel admin
