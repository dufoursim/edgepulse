#!/usr/bin/env python3
"""EdgePulse : ligne d'état pour Claude Code.

Claude Code appelle ce script et lui envoie un JSON par l'entrée standard.
Le script :
  1. garde les limites d'utilisation (rate_limits) dans ~/.edgepulse/state.json;
  2. démarre le relais local s'il ne tourne pas déjà;
  3. affiche une ligne d'état (ou celle que tu avais avant EdgePulse).
"""
import json
import os
import socket
import subprocess
import sys
import time

BASE = os.path.join(os.path.expanduser("~"), ".edgepulse")
STATE = os.path.join(BASE, "state.json")
PREVIOUS = os.path.join(BASE, "previous-statusline.json")
RELAY = os.path.join(BASE, "relay.py")
PORT = int(os.environ.get("EDGEPULSE_PORT", "4747"))
_LANG = os.environ.get("EDGEPULSE_LANG") or os.environ.get("LC_ALL") or os.environ.get("LANG") or "en"
FR = _LANG.lower().startswith("fr")


def get(d, *keys):
    """Lit une valeur imbriquée sans planter si une clé manque."""
    for k in keys:
        if not isinstance(d, dict):
            return None
        d = d.get(k)
    return d


def save_state(data):
    rl = data.get("rate_limits")
    if not rl:
        return None
    state = {
        "app": "edgepulse",
        "version": 1,
        "received_at": int(time.time()),
        "rate_limits": rl,
    }
    extras = {
        "model": get(data, "model", "display_name"),
        "context_used_percentage": get(data, "context_window", "used_percentage"),
        "session_cost_usd": get(data, "cost", "total_cost_usd"),
    }
    state.update({k: v for k, v in extras.items() if v is not None})
    os.makedirs(BASE, exist_ok=True)
    tmp = STATE + ".tmp"
    with open(tmp, "w", encoding="utf-8") as f:
        json.dump(state, f)
    os.replace(tmp, STATE)  # écriture atomique : le relais ne lit jamais un fichier à moitié écrit
    return rl


def ensure_relay():
    try:
        with socket.create_connection(("127.0.0.1", PORT), timeout=0.2):
            return
    except OSError:
        pass
    if os.path.exists(RELAY):
        subprocess.Popen(
            [sys.executable, RELAY],
            stdin=subprocess.DEVNULL,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL,
            start_new_session=True,
        )


def previous_statusline(raw):
    try:
        with open(PREVIOUS, encoding="utf-8") as f:
            cmd = json.load(f).get("command")
    except (OSError, ValueError):
        return None
    if not cmd:
        return None
    try:
        out = subprocess.run(cmd, shell=True, input=raw, capture_output=True, text=True, timeout=5)
        return out.stdout.rstrip("\n")
    except Exception:
        return None


def main():
    raw = sys.stdin.read()
    try:
        data = json.loads(raw) if raw.strip() else {}
    except ValueError:
        data = {}

    rl = None
    try:
        rl = save_state(data)
    except Exception:
        pass
    try:
        ensure_relay()
    except Exception:
        pass

    texte = previous_statusline(raw)
    if texte is None:
        if rl:
            h5 = get(rl, "five_hour", "used_percentage")
            j7 = get(rl, "seven_day", "used_percentage")
            texte = ("EdgePulse · 5 h {} % · 7 j {} %" if FR else "EdgePulse · 5h {}% · 7d {}%").format(
                "?" if h5 is None else round(h5), "?" if j7 is None else round(j7)
            )
        else:
            texte = "EdgePulse · en attente des limites" if FR else "EdgePulse · waiting for limits"
    print(texte)


if __name__ == "__main__":
    main()
