#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
🖨️ PRINTER BOT - Ascoltatore Firebase per Stampante Bluetooth
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Questo script:
1. Ascolta gli ordini su Firebase
2. Stampa automaticamente i ticket sulla stampante Bluetooth
3. Evita duplicati con flag di stampa
4. Gestisce disconnessioni e errori

INSTALLAZIONE:
  pip3 install firebase-admin pyserial

CONFIGURAZIONE:
  1. Scarica serviceAccountKey.json da Firebase Console
  2. Metti il file in /home/pizzeria/serviceAccountKey.json
  3. Copia questo script in /home/pizzeria/printer_bot.py
  4. Rendi eseguibile: chmod +x /home/pizzeria/printer_bot.py
  5. Avvia: python3 /home/pizzeria/printer_bot.py

SYSTEMD (Autoavvio):
  sudo systemctl restart bt-keepalive.service
"""

import firebase_admin
import time
import serial
import os
import json
import re
import fcntl
from firebase_admin import credentials, db

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CONFIGURAZIONE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FIREBASE_KEY = "/home/pizzeria/serviceAccountKey.json"
FIREBASE_URL = "https://teogra-c8cf5-default-rtdb.europe-west1.firebasedatabase.app"

FILE_STAMPATI = "/home/pizzeria/stampati.json"  # Cache ordini già stampati
LOCK_FILE = "/home/pizzeria/stampati.lock"       # Lock file per evitare race conditions

SERIAL_PORT = "/dev/rfcomm0"  # Porta Bluetooth
BAUD_RATE = 9600

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# INIZIALIZZAZIONE FIREBASE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

try:
    cred = credentials.Certificate(FIREBASE_KEY)
    firebase_admin.initialize_app(cred, {'databaseURL': FIREBASE_URL})
    print("✅ Firebase inizializzato")
except Exception as e:
    print(f"❌ Errore Firebase: {e}")
    exit(1)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# VARIABILI GLOBALI
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

stampati = set()
ultimo_ordine = {}

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# GESTIONE CACHE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def carica_stampati():
    """Carica la lista di ordini già stampati dal file locale"""
    try:
        with open(FILE_STAMPATI, 'r') as f:
            fcntl.flock(f.fileno(), fcntl.LOCK_SH)
            data = json.load(f)
            fcntl.flock(f.fileno(), fcntl.LOCK_UN)
            return set(data)
    except:
        return set()

def salva_stampati(stampati):
    """Salva la lista di ordini già stampati nel file locale"""
    with open(FILE_STAMPATI, 'w') as f:
        fcntl.flock(f.fileno(), fcntl.LOCK_EX)
        json.dump(list(stampati), f)
        fcntl.flock(f.fileno(), fcntl.LOCK_UN)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PULIZIA TESTO
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def pulisci_testo(testo):
    """
    Pulisce il testo da caratteri non stampabili
    - Rimuove unicode sporco
    - Rimuove stringhe strane come "b'" e "b""
    - Converte in latin-1 per la stampante
    """
    if not testo:
        return ''
    
    # Mantieni solo caratteri stampabili e latino
    testo = re.sub(r'[^\x20-\x7E\xC0-\xFF]', '', testo)
    testo = re.sub(r'[Uu]\s*[0-9]', '', testo)
    testo = re.sub(r'[A-Za-z]\s*[0-9]{4,}', '', testo)
    testo = re.sub(r"b'", "", testo)
    testo = re.sub(r'b"', "", testo)
    
    return testo.strip()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STAMPA ORDINE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def stampa_ordine(data, tipo, oid):
    """
    Stampa un ordine sulla stampante Bluetooth
    
    Args:
        data: Dizionario con i dati dell'ordine (da Firebase)
        tipo: 'new' oppure 'annullato'
        oid: ID Firebase dell'ordine
    """
    global stampati, ultimo_ordine
    
    # Prendi l'orderId reale (es: ORD-00001)
    order_id = data.get('orderId', oid)
    
    # Usa una chiave che combina orderId e tipo
    # Es: "ORD-00001_new" oppure "ORD-00001_annullato"
    chiave_stampa = f"{order_id}_{tipo}"
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # PROTEZIONE CONTRO DUPLICATI
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    with open(LOCK_FILE, 'w') as lock:
        fcntl.flock(lock.fileno(), fcntl.LOCK_EX)
        
        # Ricarica dal file (potrebbe essere stato aggiornato)
        stampati = carica_stampati()
        
        # Controlla se già stampato
        if chiave_stampa in stampati:
            print(f"⏭️  ORDINE {order_id} {tipo} GIA STAMPATO, SALTO")
            return
        
        # Controlla se attualmente in elaborazione (crash durante stampa?)
        if ultimo_ordine.get('orderId') == order_id and ultimo_ordine.get('tipo') == tipo:
            print(f"⏳ ORDINE {order_id} {tipo} GIA IN ELABORAZIONE, SALTO")
            return
        
        # Segna come in elaborazione
        ultimo_ordine = {'orderId': order_id, 'tipo': tipo}
        stampati.add(chiave_stampa)
        salva_stampati(stampati)
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # CONNESSIONE E STAMPA
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    try:
        # Apri porta seriale Bluetooth
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=10)
        time.sleep(0.5)
        
        # Reset stampante
        ser.write(b'\x1B\x40')
        time.sleep(0.3)
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # SE È ANNULLATO - SCRIVI IN EVIDENZA
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        if tipo == 'annullato':
            ser.write(b'\x1B\x21\x10\x1B\x61\x01')  # Grassetto + Centrato
            ser.write(b'   *** ORDINE ANNULLATO ***\n')
            ser.write(b'-------------------------------\n\n')
            ser.write(b'\x1B\x21\x00\x1B\x61\x00')  # Normale
            time.sleep(0.2)
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # INTESTAZIONE
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ser.write(b'\x1B\x21\x10\x1B\x61\x01\n')  # Grassetto + Centrato
        ser.write(b'   ANTICA PIZZERIA GRASSO\n')
        ser.write(b'-------------------------------\n\n')
        time.sleep(0.2)
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # NUMERO ORDINE
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ser.write(b'\x1B\x21\x10\x1B\x61\x00')  # Grassetto
        ser.write(b'ORDINE: ' + order_id.encode('latin-1', errors='ignore') + b'\n')
        time.sleep(0.1)
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # DATI CLIENTE
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ser.write(b'\x1B\x21\x00')  # Normale
        ser.write(b'DATA:   ' + time.strftime('%d/%m/%Y %H:%M').encode('latin-1', errors='ignore') + b'\n')
        ser.write(b'CLIENTE: ' + pulisci_testo(data.get('customerName', '')).encode('latin-1', errors='ignore') + b'\n')
        ser.write(b'TEL:    ' + pulisci_testo(data.get('customerPhone', '')).encode('latin-1', errors='ignore') + b'\n')
        
        if data.get('type') == 'delivery':
            ser.write(b'INDIRIZZO: ' + pulisci_testo(data.get('address', '')).encode('latin-1', errors='ignore') + b'\n')
        
        ser.write(b'ORARIO: ' + pulisci_testo(data.get('scheduledTime', 'Subito')).encode('latin-1', errors='ignore') + b'\n')
        ser.write(b'TIPO: ' + ('CONSEGNA' if data.get('type') == 'delivery' else 'RITIRO').encode('latin-1', errors='ignore') + b'\n')
        
        # Note (se presenti)
        note = pulisci_testo(data.get('notes', ''))
        if note:
            ser.write(b'NOTE: ' + note.encode('latin-1', errors='ignore') + b'\n')
        
        # Motivo annullamento (se presente)
        if tipo == 'annullato':
            motivo = pulisci_testo(data.get('motivoAnnullamento', ''))
            if motivo:
                ser.write(b'MOTIVO: ' + motivo.encode('latin-1', errors='ignore') + b'\n')
        
        time.sleep(0.1)
        ser.write(b'\n-------------------------------\n\n')
        time.sleep(0.1)
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # ARTICOLI
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ser.write(b'\x1B\x21\x10')  # Grassetto
        
        items = data.get('items', [])
        categoria_corrente = None
        
        for item in items:
            categoria = item.get('cat', '')
            
            # Intestazione categoria
            if categoria != categoria_corrente:
                categoria_corrente = categoria
                ser.write(b'--- ' + pulisci_testo(categoria).encode('latin-1', errors='ignore') + b' ---\n')
                time.sleep(0.05)
            
            # Riga articolo: "2x Margherita             EUR 11.00"
            nome = pulisci_testo(item.get('name', '')).encode('latin-1', errors='ignore')
            qty = item.get('qty', 1)
            prezzo = item.get('price', 0)
            
            riga = b'  ' + str(qty).encode() + b'x ' + nome
            prezzo_str = f'EUR {prezzo:.2f}'.encode('latin-1', errors='ignore')
            spazi = 32 - len(riga) - len(prezzo_str)
            if spazi < 1:
                spazi = 1
            
            ser.write(riga + b' ' * spazi + prezzo_str + b'\n')
            time.sleep(0.05)
        
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        # TOTALE
        # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
        
        ser.write(b'\x1B\x21\x10')  # Grassetto
        ser.write(b'\n-------------------------------\n')
        
        if data.get('type') == 'delivery' and data.get('deliveryFee', 0) > 0:
            ser.write(b'COSTO CONSEGNA:  EUR ' + f"{data.get('deliveryFee', 0):.2f}".encode('latin-1', errors='ignore') + b'\n')
        
        ser.write(b'TOTALE:         EUR ' + f"{data.get('finalTotal', 0):.2f}".encode('latin-1', errors='ignore') + b'\n')
        
        # Spazi finali (per far staccare il ticket)
        ser.write(b'\n\n\n\n\n')
        
        time.sleep(0.5)
        ser.flush()
        ser.close()
        
        print(f"✅ STAMPATO {order_id} - {tipo}")
        return True
        
    except Exception as e:
        print(f"❌ ERRORE STAMPA: {e}")
        import traceback
        traceback.print_exc()
        
        # Rimuovi dalla cache se la stampa è fallita
        stampati.discard(chiave_stampa)
        salva_stampati(stampati)
        return False

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LISTENER FIREBASE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def on_change(event):
    """
    Callback chiamato quando un ordine cambia su Firebase
    
    Stampa quando:
    - status = 'new' e stampato_cucina = false
    - status = 'annullato' e stampato_annullato = false
    """
    
    if not isinstance(event.data, dict):
        return
    
    # Estrai ID Firebase dal percorso (es: /ordini/-ABC123DEF)
    oid = event.path.split('/')[-1]
    if not oid or oid == 'ordini':
        return
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # RECUPERA DATI COMPLETI DELL'ORDINE
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    try:
        ref = db.reference(f"ordini/{oid}")
        data = ref.get()
        if not data:
            return
    except Exception as e:
        print(f"❌ ERRORE recupero dati: {e}")
        return
    
    status = data.get('status', '')
    stampato_cucina = data.get('stampato_cucina', False)
    stampato_annullato = data.get('stampato_annullato', False)
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STAMPA SE È NUOVO
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    if status == 'new' and not stampato_cucina:
        print(f"📦 ORDINE NUOVO: {data.get('orderId', oid)}")
        
        # Segna come in stampa
        try:
            db.reference(f"ordini/{oid}/stampato_cucina").set(True)
        except:
            pass
        
        stampa_ordine(data, 'new', oid)
    
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    # STAMPA SE È ANNULLATO
    # ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
    
    elif status in ['cancelled', 'annullato'] and not stampato_annullato:
        print(f"📦 ORDINE ANNULLATO: {data.get('orderId', oid)}")
        
        # Segna come in stampa
        try:
            db.reference(f"ordini/{oid}/stampato_annullato").set(True)
        except:
            pass
        
        stampa_ordine(data, 'annullato', oid)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MAIN LOOP
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if __name__ == '__main__':
    print("""
╔════════════════════════════════════╗
║  🖨️ PRINTER BOT - GRASSO           ║
║  Ascoltando Firebase...            ║
╚════════════════════════════════════╝
    """)
    
    # Inizio ascolto
    db.reference("ordini").listen(on_change)
    print("✅ BOT AVVIATO - IN ATTESA DI ORDINI...")
    
    # Keep running
    while True:
        time.sleep(1)
