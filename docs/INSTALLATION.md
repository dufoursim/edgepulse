# Guide d'installation d'EdgePulse

**Français** · [English](INSTALLATION.en.md)

Ce guide t'accompagne de zéro jusqu'à un widget EdgePulse fonctionnel sur ton XENEON EDGE. Compte environ 15 minutes la première fois.

## Sommaire

1. [Avant de commencer](#1-avant-de-commencer)
2. [Comment EdgePulse fonctionne](#2-comment-edgepulse-fonctionne)
3. [Étape 1 : installer le relais dans tes Codespaces](#3-étape-1--installer-le-relais-dans-tes-codespaces)
4. [Étape 2 : vérifier que le relais fonctionne](#4-étape-2--vérifier-que-le-relais-fonctionne)
5. [Étape 3 : installer le widget dans iCUE](#5-étape-3--installer-le-widget-dans-icue)
6. [Comprendre l'affichage](#6-comprendre-laffichage)
7. [Réglages du widget](#7-réglages-du-widget)
8. [Mettre à jour](#8-mettre-à-jour)
9. [Désinstaller](#9-désinstaller)
10. [Dépannage](#10-dépannage)
11. [Confidentialité](#11-confidentialité)
12. [Limites connues](#12-limites-connues)

---

## 1. Avant de commencer

Vérifie que tu as tout ceci :

| Élément | Détail |
|---|---|
| Écran | CORSAIR XENEON EDGE |
| Logiciel | iCUE 5.45 ou plus récent, sur Windows |
| Abonnement Claude | **Pro ou Max**. Les limites d'utilisation n'existent pas avec une clé API. |
| Environnement de travail | Claude Code utilisé dans **GitHub Codespaces** |
| Éditeur | **VS Code installé sur ton PC** (application de bureau), avec l'extension GitHub Codespaces |
| Compte | Un compte GitHub |

> **Important :** VS Code doit être l'application de bureau. Si tu ouvres ton Codespace dans le navigateur web, VS Code ne peut pas amener les données jusqu'à `localhost` sur ton PC, et le widget ne recevra rien.

## 2. Comment EdgePulse fonctionne

EdgePulse a deux morceaux : un **relais** qui vit dans ton Codespace, et un **widget** qui vit dans iCUE.

```
 GitHub Codespace (dans le nuage)                 Ton PC Windows
┌────────────────────────────────────┐          ┌──────────────────────────┐
│ Claude Code                        │          │ VS Code                  │
│   │ envoie ses limites à sa        │          │   redirige le port 4747  │
│   ▼ ligne d'état                   │          │   vers localhost         │
│ statusline.py (EdgePulse)          │  ─────►  │          │               │
│   │ enregistre et démarre          │  port    │          ▼               │
│   ▼                                │  4747    │ Widget EdgePulse (iCUE)  │
│ relay.py : http://127.0.0.1:4747   │          │   sur le XENEON EDGE     │
└────────────────────────────────────┘          └──────────────────────────┘
```

1. Chaque fois que Claude Code reçoit une réponse, il transmet tes limites (session de 5 heures et semaine) à sa **ligne d'état**.
2. La ligne d'état EdgePulse enregistre ces limites et démarre le relais s'il ne tourne pas déjà.
3. Le relais sert les données sur le port 4747 du Codespace.
4. VS Code redirige automatiquement ce port vers `localhost:4747` sur ton PC.
5. Le widget lit `http://localhost:4747/usage` toutes les 3 secondes.

Tes limites appartiennent à ton compte Claude : peu importe dans quel Codespace tu travailles, les pourcentages sont les mêmes.

## 3. Étape 1 : installer le relais dans tes Codespaces

On utilise la fonction **dotfiles** de GitHub : un dépôt nommé `dotfiles` que GitHub copie dans chaque nouveau Codespace, avant d'exécuter son script `install.sh`. Tu configures ça une seule fois.

Choisis le cas qui te correspond.

### Cas A : tu n'as pas encore de dépôt `dotfiles`

1. **Télécharge EdgePulse.** Sur la page du projet, clique sur **Code**, puis **Download ZIP**, et décompresse le fichier.
2. **Crée ton dépôt.** Sur GitHub, clique sur **New repository**.
   - Nom : exactement `dotfiles`
   - Visibilité : **Public** (le plus simple, les fichiers ne contiennent rien de secret)
   - Clique sur **Create repository**.
3. **Dépose les fichiers.** Sur la page du nouveau dépôt, clique sur **uploading an existing file**. Ouvre le dossier `relay` d'EdgePulse et glisse **son contenu** : `install.sh`, `uninstall.sh` et le dossier `edgepulse`. Clique sur **Commit changes**.
4. **Vérifie.** À la racine de ton dépôt, tu dois voir directement `install.sh`, `uninstall.sh` et le dossier `edgepulse`.

> **Erreur fréquente :** GitHub ne décompresse pas les fichiers `.zip`. Si tu déposes le zip tel quel, rien ne fonctionnera. Dépose les fichiers décompressés.

> **Autre erreur fréquente :** si tu vois un dossier `relay` à la racine de ton dépôt, tu as glissé le dossier au lieu de son contenu. Les fichiers doivent être directement à la racine.

### Cas B : tu as déjà un dépôt `dotfiles` avec ton propre `install.sh`

GitHub n'exécute qu'un seul script d'installation. Il faut donc appeler celui d'EdgePulse depuis le tien.

1. Copie le dossier `edgepulse` à la racine de ton dépôt `dotfiles`.
2. Copie `install.sh` d'EdgePulse en le renommant `install-edgepulse.sh`.
3. Copie aussi `uninstall.sh` en le renommant `uninstall-edgepulse.sh`.
4. Ajoute cette ligne à la fin de **ton** `install.sh` :
   ```bash
   bash "$(dirname "${BASH_SOURCE[0]}")/install-edgepulse.sh"
   ```

### Activer les dotfiles (cas A et B)

1. Ouvre `https://github.com/settings/codespaces`. C'est dans les paramètres de **ton compte**, pas dans ceux d'un dépôt : en haut à gauche, tu dois voir ton nom et « Your personal account ».
2. Dans la section **Dotfiles**, coche **Automatically install dotfiles**.
3. Dans la liste qui apparaît, choisis ton dépôt `dotfiles`.

Tous tes **nouveaux** Codespaces installeront maintenant EdgePulse automatiquement.

### Installer dans un Codespace déjà existant

Les dotfiles ne s'appliquent qu'aux Codespaces créés après l'activation. Pour un Codespace existant, ouvre un terminal dedans et lance (remplace `<ton-compte>` par ton nom d'utilisateur GitHub) :

```bash
git clone https://github.com/<ton-compte>/dotfiles ~/dotfiles && bash ~/dotfiles/install.sh
```

Tu dois voir :

```
EdgePulse : installation...
EdgePulse : ligne d'état branchée dans Claude Code.
EdgePulse : terminé. Le relais démarrera au premier message envoyé à Claude Code.
```

> **Tu avais déjà une ligne d'état personnalisée ?** EdgePulse la garde et continue de l'afficher. Le message « ta ligne d'état existante est conservée » le confirme.

### Messages du relais en français

Les Codespaces sont généralement configurés en anglais, donc le relais affiche ses messages en anglais (`EdgePulse: installing...`). Pour les avoir en français dans tous tes Codespaces :

1. Ouvre `https://github.com/settings/codespaces`.
2. Dans **Codespace user secrets**, clique sur **New secret**.
3. Nom : `EDGEPULSE_LANG`, valeur : `fr`.
4. Dans **Repository access**, choisis les dépôts où tu utilises Claude Code (ou tous), puis **Add secret**.

Les nouveaux Codespaces, et ceux que tu redémarres, afficheront ensuite les messages en français. Le widget, lui, suit toujours la langue de Windows.

## 4. Étape 2 : vérifier que le relais fonctionne

Fais cette vérification **avant** d'installer le widget : si quelque chose cloche, c'est beaucoup plus facile à repérer ici.

1. **Relance Claude Code.** Ferme toute session ouverte (`/exit`), puis lance `claude` dans un terminal du Codespace.
2. **Regarde la ligne d'état** en bas du terminal. Tu dois voir :
   ```
   EdgePulse · en attente des limites
   ```
   (en anglais : `EdgePulse · waiting for limits`)
3. **Envoie un message** à Claude Code, par exemple « Bonjour ». Après la réponse, la ligne devient :
   ```
   EdgePulse · 5 h 12 % · 7 j 8 %
   ```
   (en anglais : `EdgePulse · 5h 12% · 7d 8%`)
4. **Vérifie sur ton PC.** Ouvre `http://localhost:4747/usage` dans ton navigateur Windows. Tu dois voir du texte qui commence par :
   ```json
   {"app": "edgepulse", "version": 1, "received_at": ..., "rate_limits": {...
   ```
5. **Si la page ne charge pas**, ouvre l'onglet **PORTS** de VS Code (à côté de TERMINAL). Le port 4747 doit y apparaître. S'il n'y est pas, clique sur **Forward a Port** et tape `4747`.

Si les étapes 3 et 4 fonctionnent, le relais est prêt.

## 5. Étape 3 : installer le widget dans iCUE

1. **Télécharge le widget.** Sur la page du projet, ouvre **Releases** (colonne de droite) et télécharge le fichier `EdgePulse-vX.Y.Z.icuewidget` de la version la plus récente.
2. **Ouvre iCUE** et va dans la section de ton XENEON EDGE, là où tu gères les widgets.
3. **Importe le widget** avec le bouton **+** des widgets, puis choisis le fichier `.icuewidget`.
4. **Place EdgePulse sur une tuile** de taille **S** (840 × 344) ou **M** (840 × 688). Le widget détecte la taille tout seul.
5. **Accepte l'autorisation réseau** si iCUE la demande sur le XENEON EDGE. Sans elle, le widget ne peut pas lire `localhost:4747`.

Au premier lancement, le widget peut afficher **DÉMO** quelques secondes, le temps de trouver le relais. Dès qu'il le trouve, l'indicateur passe à **CONFORTABLE** (ou à l'état qui correspond à ton utilisation).

> **Astuce :** l'aperçu dans la fenêtre d'iCUE n'est qu'une image. Le widget réel tourne sur le XENEON EDGE, et c'est là que l'autorisation réseau est demandée.

## 6. Comprendre l'affichage

### Le double halo

- **Anneau intérieur, épais** : ta session de 5 heures.
- **Anneau extérieur, fin** : ta fenêtre de 7 jours.
- **Petits repères** sur l'anneau intérieur : les seuils de 70 % et 90 %.

### Les six états

| État | Quand | Ce qui change |
|---|---|---|
| **CONFORTABLE** | Session sous 70 % | Turquoise, animations lentes, pourcentage au centre |
| **ATTENTION** | Session de 70 à 89 % | Ambre, le centre affiche le temps restant estimé à ton rythme |
| **CRITIQUE** | Session à 90 % ou plus | Corail, contour qui pulse, conseil de conclure ta tâche |
| **EN PAUSE** | Session à 100 % | Animations arrêtées, compte à rebours jusqu'au retour |
| **SEMAINE CRITIQUE** | Semaine à 90 % ou plus, et plus proche de sa limite que la session | L'anneau extérieur prend la vedette |
| **C'EST REPARTI** | Juste après la réinitialisation de la session | Onde turquoise, puis retour au calme |

### Les états de connexion

| Indicateur | Signification |
|---|---|
| **DÉMO** | Relais introuvable. Les six états défilent en exemple. |
| **EN ATTENTE** | Relais trouvé, mais aucune limite reçue encore. Envoie un message à Claude Code. |
| **HORS LIGNE** | Le relais ne répond plus (Codespace arrêté ou VS Code fermé). Les dernières valeurs restent affichées, atténuées. |

### Le rythme (tuile M)

Le widget mémorise l'évolution de ta session et calcule l'heure à laquelle tu atteindrais la limite si tu continues au même rythme. L'estimation apparaît après quelques minutes d'utilisation.

## 7. Réglages du widget

Dans iCUE, sélectionne le widget pour voir ses réglages.

| Réglage | Par défaut | Usage |
|---|---|---|
| **Port du relais** | 4747 | À changer seulement si le port 4747 est déjà pris sur ton PC (voir le dépannage) |
| **Animations** | Activé | Désactive-le pour un affichage fixe |
| **Opacité du fond** | 100 % | Baisse-la pour laisser voir le fond d'écran d'iCUE |

La langue du widget suit celle de Windows (français ou anglais). Pour les messages du relais, voir [Messages du relais en français](#messages-du-relais-en-français).

## 8. Mettre à jour

**Le widget :** dans iCUE, retire l'ancien widget, supprime-le de la liste, puis importe le nouveau fichier `.icuewidget`. Remets tes réglages au besoin.

**Le relais :** remplace les fichiers de ton dépôt `dotfiles` par ceux du dossier `relay` de la nouvelle version. Les nouveaux Codespaces auront la mise à jour. Pour un Codespace existant :

```bash
cd ~/dotfiles && git pull && bash install.sh
```

## 9. Désinstaller

**Le widget :** dans iCUE, retire-le de sa tuile, puis supprime-le de la liste des widgets.

**Le relais, dans un Codespace :**

```bash
bash ~/dotfiles/uninstall.sh
```

(dans le cas B, `bash ~/dotfiles/uninstall-edgepulse.sh`)

Ce script remet ta ligne d'état d'avant EdgePulse s'il y en avait une, arrête le relais et supprime le dossier `~/.edgepulse`.

**Pour les futurs Codespaces :** retire les fichiers EdgePulse de ton dépôt `dotfiles`, ou décoche **Automatically install dotfiles** dans `https://github.com/settings/codespaces`.

## 10. Dépannage

### Le widget reste sur DÉMO

1. Ton Codespace est-il ouvert dans **VS Code de bureau** (pas dans le navigateur) ?
2. As-tu envoyé au moins un message à Claude Code depuis l'ouverture du Codespace ? Le relais démarre au premier message.
3. `http://localhost:4747/usage` s'ouvre-t-il dans ton navigateur Windows ? Si non, refais l'[étape 2](#4-étape-2--vérifier-que-le-relais-fonctionne).
4. As-tu accepté l'autorisation réseau d'iCUE sur le XENEON EDGE ?

### La ligne d'état n'affiche pas « EdgePulse »

1. Relance Claude Code : la configuration n'est lue qu'au démarrage d'une session.
2. Vérifie que `~/.claude/settings.json` contient un bloc `statusLine` qui mentionne `edgepulse` :
   ```bash
   grep -A3 statusLine ~/.claude/settings.json
   ```
3. Relance l'installation : `bash ~/dotfiles/install.sh`.

### La ligne d'état reste sur « en attente des limites »

1. Tu dois avoir un abonnement **Pro ou Max** et être connecté avec ce compte dans Claude Code (`/login`). Avec une clé API, Claude Code ne transmet pas de limites.
2. Les limites arrivent après la **première réponse** de la session.
3. Vérifie ta version de Claude Code avec `claude --version` et mets-la à jour au besoin.

### Le port 4747 est déjà pris sur mon PC

VS Code choisit alors un autre port local, visible dans l'onglet **PORTS** (colonne « Forwarded Address »). Entre ce numéro dans le réglage **Port du relais** du widget.

### Le widget affiche HORS LIGNE

C'est normal quand ton Codespace s'arrête (après une période d'inactivité) ou quand VS Code est fermé. Rouvre ton Codespace et envoie un message à Claude Code.

### Python est introuvable

Le relais a besoin de `python3`, présent dans les images Codespaces par défaut. Si tu utilises une image personnalisée sans Python, l'installation l'indique et s'arrête sans rien modifier.

## 11. Confidentialité

- EdgePulse **ne lit aucun identifiant** : il utilise seulement les données que Claude Code fournit officiellement à sa ligne d'état.
- Le relais n'expose que : les limites (pourcentages et heures de réinitialisation), le nom du modèle, le remplissage du contexte et l'équivalent API de la session. **Aucun chemin de dossier, aucun contenu de conversation.**
- Le relais écoute seulement sur `127.0.0.1` dans ton Codespace, et VS Code le redirige seulement vers ton propre PC.
- Le widget ne contacte aucun service Internet.

## 12. Limites connues

- **Claude Code doit tourner dans GitHub Codespaces** pour cette version. Les autres environnements distants ouverts dans VS Code (conteneurs de développement, SSH, WSL) devraient fonctionner en lançant `install.sh` manuellement, mais ils n'ont pas encore été testés. Claude Code installé directement sur Windows n'est pas encore pris en charge.
- **Les données se mettent à jour quand tu utilises Claude Code.** Ton utilisation sur claude.ai compte dans les mêmes limites, mais le widget ne la verra qu'au prochain message envoyé dans Claude Code.
- **Le forfait (Pro ou Max) n'est pas affiché** : Claude Code ne transmet pas cette information.
- **L'extension graphique de Claude Code pour VS Code** (le panneau) pourrait ne pas appeler la ligne d'état. Le terminal fonctionne toujours.
