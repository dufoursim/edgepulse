#!/usr/bin/env bash
# install.sh : exécuté automatiquement par GitHub à la création de chaque Codespace.
# Installe EdgePulse et branche sa ligne d'état dans Claude Code.
# Peut être relancé sans danger (il ne fait rien de plus la deuxième fois).

SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/edgepulse"
DEST="$HOME/.edgepulse"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

echo "EdgePulse : installation..."

if ! command -v python3 >/dev/null 2>&1; then
    echo "EdgePulse : python3 introuvable, installation ignorée."
    exit 0
fi

mkdir -p "$DEST" "$CLAUDE_DIR"
cp "$SOURCE/statusline.py" "$SOURCE/relay.py" "$DEST/"
chmod +x "$DEST/statusline.py" "$DEST/relay.py"

python3 - "$CLAUDE_DIR/settings.json" "$DEST" <<'PY'
import json, os, sys
chemin, dest = sys.argv[1], sys.argv[2]
commande = "python3 " + os.path.join(dest, "statusline.py")

config = {}
if os.path.exists(chemin) and os.path.getsize(chemin) > 0:
    try:
        with open(chemin, encoding="utf-8") as f:
            config = json.load(f)
    except ValueError:
        print("EdgePulse : settings.json invalide, je n'y touche pas.")
        sys.exit(0)

actuelle = config.get("statusLine")
if isinstance(actuelle, dict) and actuelle.get("command") == commande:
    print("EdgePulse : déjà branché dans Claude Code.")
    sys.exit(0)

# On garde la ligne d'état existante : EdgePulse continuera de l'afficher
if isinstance(actuelle, dict) and actuelle.get("command"):
    with open(os.path.join(dest, "previous-statusline.json"), "w", encoding="utf-8") as f:
        json.dump(actuelle, f, indent=2)
    print("EdgePulse : ta ligne d'état existante est conservée et restera affichée.")

config["statusLine"] = {"type": "command", "command": commande}
with open(chemin, "w", encoding="utf-8") as f:
    json.dump(config, f, indent=2, ensure_ascii=False)
print("EdgePulse : ligne d'état branchée dans Claude Code.")
PY

echo "EdgePulse : terminé. Le relais démarrera au premier message envoyé à Claude Code."
exit 0
