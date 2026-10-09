#!/usr/bin/env python3
"""EdgePulse : relais local.

Sert le contenu de ~/.edgepulse/state.json sur http://127.0.0.1:4747/usage.
VS Code redirige ce port vers ton PC, où le widget iCUE le lit.
Seules les limites et quelques indicateurs sont exposés : aucun chemin, aucun identifiant.
"""
import json
import os
import sys
import time
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

BASE = os.path.join(os.path.expanduser("~"), ".edgepulse")
STATE = os.path.join(BASE, "state.json")
PORT = int(os.environ.get("EDGEPULSE_PORT", "4747"))


class Handler(BaseHTTPRequestHandler):
    def _send(self, code, payload):
        corps = json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(corps)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, OPTIONS")
        self.end_headers()

    def do_GET(self):
        chemin = self.path.split("?")[0].rstrip("/")
        if chemin == "/health":
            self._send(200, {"app": "edgepulse", "ok": True})
            return
        if chemin != "/usage":
            self._send(404, {"error": "introuvable"})
            return
        try:
            with open(STATE, encoding="utf-8") as f:
                etat = json.load(f)
            etat["status"] = "ok"
        except (OSError, ValueError):
            etat = {"app": "edgepulse", "status": "waiting"}
        etat["served_at"] = int(time.time())
        self._send(200, etat)

    def log_message(self, *args):
        pass


def main():
    try:
        serveur = ThreadingHTTPServer(("127.0.0.1", PORT), Handler)
    except OSError:
        sys.exit(0)  # port déjà pris : un autre relais tourne sans doute déjà
    serveur.serve_forever()


if __name__ == "__main__":
    main()
