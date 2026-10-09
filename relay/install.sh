#!/usr/bin/env bash
# install.sh : exécuté automatiquement par GitHub à la création de chaque Codespace.
# Installe EdgePulse et branche sa ligne d'état dans Claude Code.
# Peut être relancé sans danger (il ne fait rien de plus la deuxième fois).

SOURCE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)/edgepulse"
DEST="$HOME/.edgepulse"
CLAUDE_DIR="${CLAUDE_CONFIG_DIR:-$HOME/.claude}"

# Langue des messages : EDGEPULSE_LANG (fr ou en), sinon la langue du système
case "${EDGEPULSE_LANG:-${LC_ALL:-${LANG:-en}}}" in fr*) FR=1 ;; *) FR=0 ;; esac
msg() { if [ "$FR" = 1 ]; then echo "EdgePulse : $1"; else echo "EdgePulse: $2"; fi; }

msg "installation..." "installing..."

if ! command -v python3 >/dev/null 2>&1; then
    msg "python3 introuvable, installation ignorée." "python3 not found, installation skipped."
    exit 0
fi

mkdir -p "$DEST" "$CLAUDE_DIR"
cp "$SOURCE/statusline.py" "$SOURCE/relay.py" "$DEST/"
chmod +x "$DEST/statusline.py" "$DEST/relay.py"

python3 - "$CLAUDE_DIR/settings.json" "$DEST" "$FR" <<'PY'
import json, os, sys
chemin, dest, fr = sys.argv[1], sys.argv[2], sys.argv[3] == "1"
def msg(f, e): print("EdgePulse : " + f if fr else "EdgePulse: " + e)
commande = "python3 " + os.path.join(dest, "statusline.py")

config = {}
if os.path.exists(chemin) and os.path.getsize(chemin) > 0:
    try:
        with open(chemin, encoding="utf-8") as f:
            config = json.load(f)
    except ValueError:
        msg("settings.json invalide, je n'y touche pas.", "invalid settings.json, leaving it untouched.")
        sys.exit(0)

actuelle = config.get("statusLine")
if isinstance(actuelle, dict) and actuelle.get("command") == commande:
    msg("déjà branché dans Claude Code.", "already connected to Claude Code.")
    sys.exit(0)

# On garde la ligne d'état existante : EdgePulse continuera de l'afficher
if isinstance(actuelle, dict) and actuelle.get("command"):
    with open(os.path.join(dest, "previous-statusline.json"), "w", encoding="utf-8") as f:
        json.dump(actuelle, f, indent=2)
    msg("ta ligne d'état existante est conservée et restera affichée.", "your existing status line is kept and will still be shown.")

config["statusLine"] = {"type": "command", "command": commande}
with open(chemin, "w", encoding="utf-8") as f:
    json.dump(config, f, indent=2, ensure_ascii=False)
msg("ligne d'état branchée dans Claude Code.", "status line connected to Claude Code.")
PY

msg "terminé. Le relais démarrera au premier message envoyé à Claude Code." "done. The relay will start with your first message to Claude Code."
exit 0
