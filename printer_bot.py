#!/usr/bin/env python3
# -*- coding: utf-8 -*-
import time, socket, traceback, re
from datetime import datetime
import firebase_admin
from firebase_admin import credentials, db

SERVICE_ACCOUNT_FILE="/home/pizzeria/serviceAccountKey.json"
DATABASE_URL="https://teogra-c8cf5-default-rtdb.europe-west1.firebasedatabase.app"
BANCO="192.168.1.130"
CUCINA="192.168.1.131"
PORT=9100
MAPPA={}
db_ref=None
LAST_CHECK={}

BOLD_ON=b"\x1b\x45\x01"
BOLD_OFF=b"\x1b\x45\x00"
WIDE_ON=b"\x1d\x21\x01"
DOUBLE_ON=b"\x1d\x21\x11"
NORMAL=b"\x1d\x21\x00"
CUT=b"\x1d\x56\x42\x00"

def init_firebase():
    global db_ref
    cred=credentials.Certificate(SERVICE_ACCOUNT_FILE)
    try: firebase_admin.get_app()
    except: firebase_admin.initialize_app(cred, {"databaseURL": DATABASE_URL})
    db_ref=db.reference("/")

def pulisci(s):
    return re.sub(r'[^A-Za-z0-9 \-_]', '', str(s)).strip() if s else ""

def carica():
    global MAPPA
    try:
        cats=db_ref.child("categories").get() or {}
        menu=db_ref.child("menu").get() or {}
        m={}
        for k,prods in menu.items():
            nc=pulisci(cats.get(k,{}).get("name",k)).upper() or "ALTRO"
            if not isinstance(prods,list): continue
            for p in prods:
                if isinstance(p,dict) and p.get("name"):
                    m[p["name"].strip().lower()]=nc
        MAPPA=m
    except: pass

def send_bytes(ip, data):
    try:
        s=socket.socket()
        s.settimeout(4)
        s.connect((ip, PORT))
        s.sendall(data)
        s.close()
        return True
    except Exception as e:
        print(f"Errore {ip}: {e}")
        return False

def gen_bytes(o):
    out=b"\x1b\x40"
    if o.get("ristampa") is True:
        out+=BOLD_ON+DOUBLE_ON+b"*** RISTAMPA ***\n"+NORMAL+BOLD_OFF
        out+=b"----------------------------\n"
    out+=b"ANTICA PIZZERIA GRASSO\nVia Antiche Mura 8/A\nTel: 0884 660377\n----------------------------\n"
    oid=o.get("orderId") or ""
    ts=o.get("timestamp")
    try: dt=datetime.fromtimestamp(int(ts)/1000) if ts else datetime.now()
    except: dt=datetime.now()
    out+=BOLD_ON+WIDE_ON+f"#{oid}\n{dt.strftime('%d/%m/%Y %H:%M')}\n".encode()+NORMAL+BOLD_OFF+b"----------------------------\n"
    out+=BOLD_ON+WIDE_ON+f"CLIENTE: {pulisci(o.get('customerName'))}\n".encode()+NORMAL+BOLD_OFF
    out+=BOLD_ON+WIDE_ON+f"TEL: {o.get('customerPhone')}\n".encode()+NORMAL+BOLD_OFF
    if o.get("type")=="delivery":
        out+=BOLD_ON+WIDE_ON+f"INDIRIZZO: {pulisci(o.get('address'))}\n".encode()+NORMAL+BOLD_OFF
    tipo="CONSEGNA" if o.get('type')=='delivery' else "RITIRO"
    out+=BOLD_ON+DOUBLE_ON+f"TIPO: {tipo}\n".encode()+NORMAL+BOLD_OFF
    out+=b"----------------------------\n\n"

    items=o.get("items") or []
    gruppi={}
    for it in items:
        if not isinstance(it,dict): continue
        nome=pulisci(it.get("name") or "Prodotto")
        qty=int(it.get("qty") or 1)
        price=float(it.get("price") or 0)
        cat=pulisci(MAPPA.get((it.get("name") or "").strip().lower(), "ALTRO")).upper()
        gruppi.setdefault(cat,[]).append((nome,qty,price))

    for cat in sorted(gruppi.keys()):
        out+=WIDE_ON+f"*** {cat} ***\n".encode()+NORMAL
        for nome,qty,price in gruppi[cat]:
            tot_riga=price*qty
            out+=BOLD_ON+WIDE_ON+f" {nome} x{qty} {tot_riga:.2f} EUR\n".encode()+NORMAL+BOLD_OFF
        out+=b"\n"

    out+=b"----------------------------\n"
    sub=sum(float(i.get("price") or 0)*int(i.get("qty") or 1) for i in items if isinstance(i,dict))
    fee=float(o.get("deliveryFee") or 0)
    tot=float(o.get("finalTotal") or (sub+fee))

    out+=WIDE_ON+f"Subtotale: {sub:.2f} EUR\n".encode()+NORMAL
    if o.get("type")=="delivery":
        out+=WIDE_ON+f"Consegna Moover: {fee:.2f} EUR\n".encode()+NORMAL
    out+=b"----------------------------\n"
    out+=BOLD_ON+WIDE_ON+f"TOTALE: {tot:.2f} EUR\n".encode()+NORMAL+BOLD_OFF+b"\n\n\n"+CUT
    return out

def main():
    print("V47 - Categorie non bold + Moover")
    init_firebase()
    carica()
    print("Firebase OK - In ascolto ogni 20s")
    while True:
        try:
            cutoff=int((time.time() - 24*3600)*1000)
            try:
                ordini=db_ref.child("ordini").order_by_child("timestamp").start_at(cutoff).get() or {}
            except:
                ordini=db_ref.child("ordini").get() or {}
            for oid, order in ordini.items():
                if not isinstance(order, dict): continue
                is_ristampa=order.get("ristampa") is True
                h=str(order.get("stampato_130"))+str(order.get("stampato_131"))+str(order.get("ristampa"))
                if not is_ristampa and LAST_CHECK.get(oid)==h: continue
                LAST_CHECK[oid]=h
                if not order.get("items"): continue
                if not is_ristampa and order.get("stampato_130") and order.get("stampato_131"): continue
                print(f"[STAMPA] {oid} ristampa={is_ristampa}")
                data=gen_bytes(order)
                ok1=send_bytes(BANCO, data)
                time.sleep(1)
                ok2=send_bytes(CUCINA, data)
                if ok1: db_ref.child(f"ordini/{oid}/stampato_130").set(True)
                if ok2: db_ref.child(f"ordini/{oid}/stampato_131").set(True)
                if ok1 and ok2 and is_ristampa:
                    db_ref.child(f"ordini/{oid}/ristampa").delete()
                    print(f"[RISTAMPA OK] {oid} cancellato")
                time.sleep(1)
            time.sleep(20)
        except Exception as e:
            print(f"Errore: {e}")
            traceback.print_exc()
            time.sleep(20)

if __name__=="__main__": main()