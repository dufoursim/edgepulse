#!/usr/bin/env bash
# uninstall.sh : retire EdgePulse de ce Codespace.
# Remet ta ligne d'état d'avant EdgePulse (s'il y en avait une), arrête le relais
# et supprime le dossier ~/.edgepulse.

DEST="$HOME/.edgepulse"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
SETTINGS="$CLAUDE_DIR/settings.json"

case "${EDGEPULSE_LANG:-${LC_ALL:-${LANG:-en}}}" in fr*) FR=1 ;; *) FR=0 ;; esac
msg() { if [ "$FR" = 1 ]; then echo "EdgePulse : $1"; else echo "EdgePulse: $2"; fi; }

msg "désinstallation..." "uninstalling..."

if [ -f "$SETTINGS" ] && command -v python3 >/dev/null 2>&1; then
    python3 - "$SETTINGS" "$DEST" "$FR" <<'PY'
import json, os, sys
chemin, dest, fr = sys.argv[1], sys.argv[2], sys.argv[3] == "1"
def msg(f, e): print("EdgePulse : " + f if fr else "EdgePulse: " + e)
try:
    with open(chemin, encoding="utf-8") as f:
        config = json.load(f)
except (OSError, ValueError):
    msg("settings.json illisible, je n'y touche pas.", "unreadable settings.json, leaving it untouched.")
    sys.exit(0)
actuelle = config.get("statusLine")
if not (isinstance(actuelle, dict) and "edgepulse" in str(actuelle.get("command", ""))):
    msg("la ligne d'état n'est pas celle d'EdgePulse, je n'y touche pas.", "the status line isn't EdgePulse's, leaving it untouched.")
    sys.exit(0)
precedente = os.path.join(dest, "previous-statusline.json")
if os.path.exists(precedente):
    with open(precedente, encoding="utf-8") as f:
        config["statusLine"] = json.load(f)
    msg("ta ligne d'état précédente est remise.", "your previous status line is restored.")
else:
    config.pop("statusLine", None)
    msg("ligne d'état retirée.", "status line removed.")
with open(chemin, "w", encoding="utf-8") as f:
    json.dump(config, f, indent=2, ensure_ascii=False)
PY
fi

pkill -f "$DEST/relay.py" 2>/dev/null && msg "relais arrêté." "relay stopped."
rm -rf "$DEST"
msg "terminé. Relance tes sessions Claude Code." "done. Restart your Claude Code sessions."
