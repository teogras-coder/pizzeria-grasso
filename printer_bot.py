#!/usr/bin/env python3
# -*- coding: utf-8 -*-

"""
🖨️ PRINTER BOT v2 - Ascoltatore Firebase per Stampante Bluetooth
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Legge i flag stampato_130 / stampato_131 / stampato_annullato
scritti da admin.html e stampa di conseguenza.

Flusso:
  admin.html crea ordine → stampato_130=null, stampato_131=null
  → questo bot stampa su Bluetooth
  → setta stampato_130=True, stampato_131=True

Ristampa:
  admin.html mette stampato_130=null, stampato_131=null, ristampa=True
  → bot ristampa
  → bot cancella ristampa=True

INSTALLAZIONE:
  pip3 install firebase-admin pyserial

SYSTEMD:
  sudo systemctl restart bt-keepalive.service
"""

import firebase_admin
import time
import serial
import os
import json
import re
import fcntl
import threading
from firebase_admin import credentials, db

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CONFIGURAZIONE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

FIREBASE_KEY = "/home/pizzeria/serviceAccountKey.json"
FIREBASE_URL = "https://teogra-c8cf5-default-rtdb.europe-west1.firebasedatabase.app"

FILE_STAMPATI = "/home/pizzeria/stampati_v2.json"
LOCK_FILE = "/home/pizzeria/stampati_v2.lock"

SERIAL_PORT = "/dev/rfcomm0"
BAUD_RATE = 9600

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# FIREBASE INIT
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
in_elaborazione = set()
print_lock = threading.Lock()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# CACHE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def carica_stampati():
    try:
        with open(FILE_STAMPATI, 'r') as f:
            fcntl.flock(f.fileno(), fcntl.LOCK_SH)
            data = json.load(f)
            fcntl.flock(f.fileno(), fcntl.LOCK_UN)
            return set(data)
    except:
        return set()

def salva_stampati(s):
    try:
        with open(FILE_STAMPATI, 'w') as f:
            fcntl.flock(f.fileno(), fcntl.LOCK_EX)
            json.dump(list(s), f)
            fcntl.flock(f.fileno(), fcntl.LOCK_UN)
    except Exception as e:
        print(f"❌ Errore salvataggio cache: {e}")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# PULIZIA TESTO
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def pulisci_testo(testo):
    if not testo:
        return ''
    testo = re.sub(r'[^\x20-\x7E\xC0-\xFF]', '', str(testo))
    testo = re.sub(r"b'", "", testo)
    testo = re.sub(r'b"', "", testo)
    return testo.strip()

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# STAMPA ORDINE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def stampa_ordine(data, tipo, oid):
    global stampati, in_elaborazione

    order_id = data.get('orderId', oid)
    chiave = f"{order_id}_{tipo}"

    with print_lock:
        stampati = carica_stampati()

        if chiave in stampati:
            print(f"⏭️  {order_id} {tipo} già stampato")
            return

        if chiave in in_elaborazione:
            print(f"⏳ {order_id} {tipo} in elaborazione")
            return

        in_elaborazione.add(chiave)
        stampati.add(chiave)
        salva_stampati(stampati)

    try:
        ser = serial.Serial(SERIAL_PORT, BAUD_RATE, timeout=10)
        time.sleep(0.5)
        ser.write(b'\x1B\x40')
        time.sleep(0.3)

        # Banner ristampa
        if data.get('ristampa') is True:
            ser.write(b'\x1B\x21\x30\x1B\x61\x01')
            ser.write(b'*** RISTAMPA ***\n')
            ser.write(b'\x1B\x21\x00\x1B\x61\x00\n')

        # Banner annullato
        if tipo == 'annullato':
            ser.write(b'\x1B\x21\x10\x1B\x61\x01')
            ser.write(b'   *** ORDINE ANNULLATO ***\n')
            ser.write(b'-------------------------------\n\n')
            ser.write(b'\x1B\x21\x00\x1B\x61\x00')
            time.sleep(0.2)

        # Intestazione
        ser.write(b'\x1B\x21\x10\x1B\x61\x01\n')
        ser.write(b'   ANTICA PIZZERIA GRASSO\n')
        ser.write(b'-------------------------------\n\n')
        time.sleep(0.2)

        # Numero ordine
        ser.write(b'\x1B\x21\x10\x1B\x61\x00')
        ser.write(b'ORDINE: ' + order_id.encode('latin-1', errors='ignore') + b'\n')
        time.sleep(0.1)

        # Cliente
        ser.write(b'\x1B\x21\x00')
        ser.write(b'DATA:    ' + time.strftime('%d/%m/%Y %H:%M').encode('latin-1', errors='ignore') + b'\n')
        ser.write(b'CLIENTE: ' + pulisci_testo(data.get('customerName', '')).encode('latin-1', errors='ignore') + b'\n')
        ser.write(b'TEL:     ' + pulisci_testo(data.get('customerPhone', '')).encode('latin-1', errors='ignore') + b'\n')

        if data.get('type') == 'delivery':
            ser.write(b'INDIRIZZO: ' + pulisci_testo(data.get('address', '')).encode('latin-1', errors='ignore') + b'\n')

        ser.write(b'ORARIO:  ' + pulisci_testo(data.get('scheduledTime', 'Subito')).encode('latin-1', errors='ignore') + b'\n')
        ser.write(b'TIPO:    ' + ('CONSEGNA' if data.get('type') == 'delivery' else 'RITIRO').encode('latin-1', errors='ignore') + b'\n')

        note = pulisci_testo(data.get('notes', ''))
        if note:
            ser.write(b'NOTE:    ' + note.encode('latin-1', errors='ignore') + b'\n')

        if tipo == 'annullato':
            motivo = pulisci_testo(data.get('motivoAnnullamento', ''))
            if motivo:
                ser.write(b'MOTIVO:  ' + motivo.encode('latin-1', errors='ignore') + b'\n')

        time.sleep(0.1)
        ser.write(b'\n-------------------------------\n\n')
        time.sleep(0.1)

        # Articoli
        ser.write(b'\x1B\x21\x10')
        items = data.get('items', [])
        cat_corrente = None

        for item in items:
            categoria = item.get('cat', '')
            if categoria != cat_corrente:
                cat_corrente = categoria
                ser.write(b'--- ' + pulisci_testo(categoria).encode('latin-1', errors='ignore') + b' ---\n')
                time.sleep(0.05)

            nome = pulisci_testo(item.get('name', '')).encode('latin-1', errors='ignore')
            qty = item.get('qty', 1)
            prezzo = float(item.get('price', 0)) * qty

            riga = b'  ' + str(qty).encode() + b'x ' + nome
            prezzo_str = f'EUR {prezzo:.2f}'.encode('latin-1', errors='ignore')
            spazi = max(1, 32 - len(riga) - len(prezzo_str))
            ser.write(riga + b' ' * spazi + prezzo_str + b'\n')
            time.sleep(0.05)

        # Totali
        ser.write(b'\x1B\x21\x10')
        ser.write(b'\n-------------------------------\n')

        subtotale = sum(float(i.get('price', 0)) * int(i.get('qty', 1)) for i in items)
        delivery_fee = float(data.get('deliveryFee', 0))
        totale = float(data.get('finalTotal', subtotale + delivery_fee))

        if data.get('type') == 'delivery' and delivery_fee > 0:
            ser.write(b'PRODOTTI: EUR ' + f"{subtotale:.2f}".encode('latin-1', errors='ignore') + b'\n')
            ser.write(b'CONSEGNA: EUR ' + f"{delivery_fee:.2f}".encode('latin-1', errors='ignore') + b'\n')

        ser.write(b'TOTALE:   EUR ' + f"{totale:.2f}".encode('latin-1', errors='ignore') + b'\n')
        ser.write(b'\n\n\n\n\n')

        time.sleep(0.5)
        ser.flush()
        ser.close()

        print(f"✅ STAMPATO {order_id} - {tipo}")
        return True

    except Exception as e:
        print(f"❌ ERRORE STAMPA {order_id}: {e}")
        import traceback
        traceback.print_exc()
        # Rimuovi dalla cache così ritenta
        stampati.discard(chiave)
        salva_stampati(stampati)
        return False
    finally:
        in_elaborazione.discard(chiave)

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# LISTENER ORDINI
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def on_ordine_change(event):
    if not isinstance(event.data, dict):
        return

    oid = event.path.split('/')[-1]
    if not oid or oid == 'ordini':
        return

    try:
        data = db.reference(f"ordini/{oid}").get()
        if not data:
            return
    except Exception as e:
        print(f"❌ Errore recupero dati: {e}")
        return

    status = data.get('status', '')

    # Salta preordini non trasformati
    if status == 'preorder':
        return

    # Salta annullati/rifiutati per la stampa normale
    # (li gestiamo nel ramo 'annullato' sotto)
    if status in ('rifiutato',):
        return

    s130 = data.get('stampato_130')
    s131 = data.get('stampato_131')
    sann = data.get('stampato_annullato')

    # ─── Stampa ordine normale ───
    if status not in ('annullato',) and (s130 is not True or s131 is not True):
        print(f"📦 STAMPA: {data.get('orderId', oid)} (130={s130}, 131={s131})")
        ok = stampa_ordine(data, 'new', oid)
        if ok:
            try:
                db.reference(f"ordini/{oid}").update({
                    'stampato_130': True,
                    'stampato_131': True
                })
                # 🧹 Cancella flag ristampa se presente
                if data.get('ristampa') is True:
                    db.reference(f"ordini/{oid}/ristampa").delete()
                    print(f"🧹 Flag ristampa cancellato per {oid}")
            except Exception as e:
                print(f"❌ Errore aggiornamento flag: {e}")

    # ─── Stampa annullamento ───
    if status == 'annullato' and sann is not True:
        print(f"🗑️  ANNULLATO: {data.get('orderId', oid)}")
        ok = stampa_ordine(data, 'annullato', oid)
        if ok:
            try:
                db.reference(f"ordini/{oid}/stampato_annullato").set(True)
            except Exception as e:
                print(f"❌ Errore aggiornamento flag annullato: {e}")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# SCAN INIZIALE
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

def scan_iniziale():
    print("🔍 Scan iniziale ordini non stampati...")
    try:
        ordini = db.reference("ordini").get() or {}
        count = 0
        for oid, o in ordini.items():
            if not isinstance(o, dict):
                continue
            status = o.get('status', '')
            if status in ('preorder', 'rifiutato'):
                continue
            if status != 'annullato':
                if o.get('stampato_130') is not True or o.get('stampato_131') is not True:
                    stampa_ordine(o, 'new', oid)
                    db.reference(f"ordini/{oid}").update({'stampato_130': True, 'stampato_131': True})
                    if o.get('ristampa') is True:
                        db.reference(f"ordini/{oid}/ristampa").delete()
                    count += 1
            elif status == 'annullato' and o.get('stampato_annullato') is not True:
                stampa_ordine(o, 'annullato', oid)
                db.reference(f"ordini/{oid}/stampato_annullato").set(True)
                count += 1
        if count:
            print(f"✅ Processati {count} ordini")
        else:
            print("✅ Nessun ordine da stampare")
    except Exception as e:
        print(f"❌ Errore scan: {e}")

# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
# MAIN
# ━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

if __name__ == '__main__':
    print("""
╔════════════════════════════════════╗
║  🖨️  PRINTER BOT v2 - GRASSO       ║
║  Ascoltando Firebase...            ║
╚════════════════════════════════════╝
    """)

    scan_iniziale()

    print("👂 In ascolto su /ordini ...")
    db.reference("ordini").listen(on_ordine_change)
    print("✅ BOT AVVIATO")

    while True:
        time.sleep(1)