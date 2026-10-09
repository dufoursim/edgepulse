#!/usr/bin/env bash
# uninstall.sh : retire EdgePulse de ce Codespace.
# Remet ta ligne d'état d'avant EdgePulse (s'il y en avait une), arrête le relais
# et supprime le dossier ~/.edgepulse.

DEST="$HOME/.edgepulse"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"
SETTINGS="$CLAUDE_DIR/settings.json"

echo "EdgePulse : désinstallation..."

if [ -f "$SETTINGS" ] && command -v python3 >/dev/null 2>&1; then
    python3 - "$SETTINGS" "$DEST" <<'PY'
import json, os, sys
chemin, dest = sys.argv[1], sys.argv[2]
try:
    with open(chemin, encoding="utf-8") as f:
        config = json.load(f)
except (OSError, ValueError):
    print("EdgePulse : settings.json illisible, je n'y touche pas.")
    sys.exit(0)
actuelle = config.get("statusLine")
if not (isinstance(actuelle, dict) and "edgepulse" in str(actuelle.get("command", ""))):
    print("EdgePulse : la ligne d'état n'est pas celle d'EdgePulse, je n'y touche pas.")
    sys.exit(0)
precedente = os.path.join(dest, "previous-statusline.json")
if os.path.exists(precedente):
    with open(precedente, encoding="utf-8") as f:
        config["statusLine"] = json.load(f)
    print("EdgePulse : ta ligne d'état précédente est remise.")
else:
    config.pop("statusLine", None)
    print("EdgePulse : ligne d'état retirée.")
with open(chemin, "w", encoding="utf-8") as f:
    json.dump(config, f, indent=2, ensure_ascii=False)
PY
fi

pkill -f "$DEST/relay.py" 2>/dev/null && echo "EdgePulse : relais arrêté."
rm -rf "$DEST"
echo "EdgePulse : terminé. Relance tes sessions Claude Code."
