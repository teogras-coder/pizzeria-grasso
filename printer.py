sudo systemctl stop pizzeria-printer.service

cat > /home/pizzeria/printer.py << 'ENDPY'
import time, socket, re, threading, queue
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, db

SERVICE_ACCOUNT_FILE = "/home/pizzeria/serviceAccountKey.json"
DATABASE_URL = "https://teogra-c8cf5-default-rtdb.europe-west1.firebasedatabase.app"

BANCO = "192.168.1.130"
CUCINA = "192.168.1.131"
PORT = 9100

CUT = b"\x1d\x56\x42\x00"
ESC = b"\x1b"
GS = b"\x1d"
RESET = ESC + b"@"
BOLD_ON = ESC + b"E\x01"
BOLD_OFF = ESC + b"E\x00"
BIG = GS + b"!\x11"
MEDIUM = GS + b"!\x01"
NORMAL = GS + b"!\x00"
CENTER = ESC + b"a\x01"
LEFT = ESC + b"a\x00"

db_ref = None
order_queue = queue.Queue()
queued_ids = set()
queue_lock = threading.Lock()
is_ready_for_events = False

def log(m):
    print(f"[{datetime.now().strftime('%H:%M:%S')}] {m}", flush=True)

def init_firebase():
    global db_ref
    cred = credentials.Certificate(SERVICE_ACCOUNT_FILE)
    try:
        firebase_admin.get_app()
    except:
        firebase_admin.initialize_app(cred, {"databaseURL": DATABASE_URL})
    db_ref = db.reference("/")

def pulisci(t):
    if not t: return ""
    s = str(t)
    repl = {
        'à':'a\'', 'á':'a\'', 'è':'e\'', 'é':'e\'',
        'ì':'i\'', 'í':'i\'', 'ò':'o\'', 'ó':'o\'',
        'ù':'u\'', 'ú':'u\'', '€':'EUR', '’':'\'', '“':'"', '”':'"'
    }
    for k, v in repl.items():
        s = s.replace(k, v)
    return re.sub(r'[^\w \-_.,/()@:+]', ' ', s).strip()

def get_cat(it):
    for k in ['category', 'categoria', 'cat']:
        if k in it and it[k]:
            return str(it[k]).upper()[:22]
    return "VARIE"

def send(ip, data):
    try:
        s = socket.socket()
        s.settimeout(3.0)
        s.connect((ip, PORT))
        s.sendall(data)
        s.close()
        return True
    except:
        return False

def gen(o):
    st = str(o.get("status", "")).lower()
    is_annullato_o_rifiutato = st in ["annullato", "rifiutato"]
    
    out = RESET + LEFT + CENTER + BOLD_ON + b"ANTICA PIZZERIA GRASSO\n" + BOLD_OFF
    out += CENTER + BOLD_ON + MEDIUM + f"{datetime.now().strftime('%d/%m %H:%M')}  #{o.get('orderId','')}\n".encode('latin-1', 'replace') + BOLD_OFF + NORMAL

    if is_annullato_o_rifiutato:
        titolo = "*** ORDINE ANNULLATO ***" if st == "annullato" else "*** ORDINE RIFIUTATO ***"
        out += CENTER + BOLD_ON + BIG + titolo.encode('latin-1', 'replace') + b"\n" + BOLD_OFF + NORMAL
        out += LEFT + b"------------------------------\n"
        out += BOLD_ON + MEDIUM + f"CLIENTE: {pulisci(o.get('customerName'))}\nTEL: {pulisci(o.get('customerPhone'))}\n".encode('latin-1', 'replace')
        motivo = o.get('motivoAnnullamento') or o.get('motivoRifiuto')
        if motivo:
            out += f"MOTIVO: {pulisci(motivo)}\n".encode('latin-1', 'replace')
        out += f"TOTALE: EUR {float(o.get('finalTotal', 0)):.2f}\n".encode('latin-1', 'replace')
        out += BOLD_OFF + NORMAL + b"------------------------------\n" + LEFT + b"\n\n\n" + CUT
        return out

    is_d = (str(o.get("type", "")).lower() == "delivery")
    tipo_str = "*** CONSEGNA A DOMICILIO ***\n" if is_d else "*** RITIRO IN NEGOZIO ***\n"
    out += CENTER + BOLD_ON + BIG + tipo_str.encode('latin-1', 'replace') + BOLD_OFF + NORMAL

    if o.get("ristampa") or o.get("richiestaRistampa_130") or o.get("richiestaRistampa_131"):
        out += CENTER + BOLD_ON + b"*** RISTAMPA ***\n" + BOLD_OFF

    out += LEFT + b"------------------------------\n"
    out += BOLD_ON + MEDIUM + f"CLIENTE: {pulisci(o.get('customerName'))}\nTEL: {pulisci(o.get('customerPhone'))}\n".encode('latin-1', 'replace')
    
    if is_d:
        out += f"INDIRIZZO: {pulisci(o.get('address'))}\n".encode('latin-1', 'replace')
        
    orario = o.get('scheduledTime')
    if orario and orario != 'Prima possibile':
        out += BOLD_ON + f"ORARIO: {pulisci(orario)}\n".encode('latin-1', 'replace') + BOLD_OFF
        
    nota = pulisci(o.get('notes'))
    if nota:
        out += BOLD_ON + f"NOTE: {nota}\n".encode('latin-1', 'replace') + BOLD_OFF

    out += BOLD_OFF + NORMAL + b"------------------------------\n"

    cat = {}
    sub = 0.0
    for it in (o.get("items") or []):
        if not isinstance(it, dict): continue
        qty = int(it.get('qty', 1))
        price = float(it.get('price', 0))
        sub += price * qty
        cat.setdefault(get_cat(it), []).append(it)

    for c, prods in cat.items():
        out += b"\n" + BOLD_ON + MEDIUM + f"[{pulisci(c)}]\n".encode('latin-1', 'replace') + BOLD_OFF + NORMAL + b"\n" + MEDIUM
        for p in prods:
            qty = int(p.get('qty', 1))
            price = float(p.get('price', 0))
            name = pulisci(str(p.get('name', '')))[:26]
            out += f"{qty}x {name}  {price * qty:.2f}\n".encode('latin-1', 'replace')
            np = p.get('note') or p.get('variant') or ""
            if np:
                out += f"   > {pulisci(np)}\n".encode('latin-1', 'replace')
        out += NORMAL + b"\n"

    out += b"------------------------------\n" + BOLD_ON + MEDIUM + f"SUBTOTALE: {sub:.2f}\n".encode('latin-1', 'replace')
    fee = float(o.get('deliveryFee', 0))
    if is_d and fee > 0:
        out += f"CONSEGNA: {fee:.2f}\n".encode('latin-1', 'replace')

    final_tot = float(o.get('finalTotal', sub + fee))
    out += BOLD_OFF + NORMAL + b"------------------------------\n"
    out += CENTER + BOLD_ON + BIG + f"TOTALE: EUR {final_tot:.2f}\n".encode('latin-1', 'replace') + BOLD_OFF + NORMAL + LEFT + b"\n\n\n" + CUT
    return out

def process_order(oid):
    try:
        o = db_ref.child(f"ordini/{oid}").get()
        if not o or not isinstance(o, dict) or not o.get("items"):
            return

        # I pre-ordini NON si stampano finché non vengono trasformati
        if o.get("status") == "preorder" or o.get("isPreOrder") is True:
            log(f"Ordine {oid} e' ancora pre-ordine, non stampo.")
            return

        st = str(o.get("status", "")).lower()
        is_r_old = str(o.get("ristampa")).lower() in ["true", "1", "si"]
        need_130_reprint = is_r_old or (o.get("richiestaRistampa_130") is True)
        need_131_reprint = is_r_old or (o.get("richiestaRistampa_131") is True)

        if st in ["annullato", "rifiutato"]:
            if o.get("stampato_annullato") is True and not need_130_reprint and not need_131_reprint:
                return
            log(f"STAMPA ANNULLATO/RIFIUTO -> {oid}")
            d = gen(o)
            do_banco = (o.get("stampato_annullato") is not True) or need_130_reprint
            do_cucina = (o.get("stampato_annullato") is not True) or need_131_reprint
            ok1 = send(BANCO, d) if do_banco else True
            if do_banco: time.sleep(0.3)
            ok2 = send(CUCINA, d) if do_cucina else True
            if ok1 and ok2:
                db_ref.child(f"ordini/{oid}").update({
                    'stampato_annullato': True,
                    'ristampa': None,
                    'richiestaRistampa_130': None,
                    'richiestaRistampa_131': None
                })
            return

        need_banco = (not o.get("stampato_130")) or need_130_reprint
        need_cucina = (not o.get("stampato_131")) or need_131_reprint

        if not need_banco and not need_cucina:
            return

        log(f"--> STAMPA IN CORSO {oid} (Banco={need_banco}, Cucina={need_cucina})")
        d = gen(o)
        upd = {}

        if need_banco:
            if send(BANCO, d):
                upd['stampato_130'] = True
                if need_130_reprint: upd['richiestaRistampa_130'] = None
                log(f"  [OK] Banco 130 -> {oid}")
            else:
                log(f"  [OFFLINE] Banco 130 non raggiungibile per {oid}")
            time.sleep(0.3)

        if need_cucina:
            if send(CUCINA, d):
                upd['stampato_131'] = True
                if need_131_reprint: upd['richiestaRistampa_131'] = None
                log(f"  [OK] Cucina 131 -> {oid}")
            else:
                log(f"  [OFFLINE] Cucina 131 non raggiungibile per {oid}")

        if is_r_old and upd.get('stampato_130') and upd.get('stampato_131'):
            upd['ristampa'] = None

        if upd:
            db_ref.child(f"ordini/{oid}").update(upd)
    except Exception as e:
        log(f"Errore processo ordine {oid}: {e}")

def queue_worker():
    while True:
        oid = order_queue.get()
        try:
            process_order(oid)
        finally:
            with queue_lock:
                queued_ids.discard(oid)
            order_queue.task_done()
        time.sleep(0.1)

def enqueue_order(oid):
    with queue_lock:
        if oid not in queued_ids:
            queued_ids.add(oid)
            order_queue.put(oid)

def on_order_change(event):
    global is_ready_for_events
    path = str(event.path or "")

    # PROTEZIONE SPARK: Ignora lo scarico iniziale della lista intera
    if path in ["/", ""]:
        if not is_ready_for_events:
            is_ready_for_events = True
            log("Connessione Realtime stabilita. Pronto per gli ordini!")
        return

    if not is_ready_for_events:
        return

    # Ignora solo le scritture di conferma generate dal Raspberry stesso
    if "stampato_130" in path or "stampato_131" in path or "stampato_annullato" in path:
        return

    parts = path.strip("/").split("/")
    if not parts or not parts[0]:
        return

    oid = parts[0]
    log(f"Evento ricevuto per ordine {oid}")
    enqueue_order(oid)

def listener_loop():
    while True:
        try:
            log("Avvio ascolto comande Realtime...")
            db_ref.child("ordini").listen(on_order_change)
            log("Connessione chiusa, riconnessione tra 10s...")
            time.sleep(10)
        except Exception as e:
            log(f"Disconnessione: {e}. Attendo 30s prima di riprovare...")
            time.sleep(30)

def main():
    log("=== SERVER STAMPE PIZZERIA GRASSO AVVIATO ===")
    init_firebase()
    
    t_worker = threading.Thread(target=queue_worker, daemon=True)
    t_worker.start()

    listener_loop()

if __name__ == "__main__":
    main()
ENDPY

python3 -m py_compile /home/pizzeria/printer.py && sudo systemctl restart pizzeria-printer.service && sudo journalctl -u pizzeria-printer.service -n 12 --no-pager