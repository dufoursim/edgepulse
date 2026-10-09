<p align="center">
  <img src="docs/logo.png" alt="EdgePulse" width="460">
</p>

<p align="center"><b>Utilisation de Claude Code en temps réel sur le CORSAIR XENEON EDGE.</b></p>

<p align="center">
  <img src="https://img.shields.io/badge/version-0.1.1-2ea44f" alt="version 0.1.1">
  <img src="https://img.shields.io/badge/iCUE-5.45%2B-7b4dff" alt="iCUE 5.45+">
  <img src="https://img.shields.io/badge/Claude%20Code-Pro%20%7C%20Max-d97757" alt="Claude Code Pro | Max">
  <img src="https://img.shields.io/badge/GitHub-Codespaces-24292f" alt="GitHub Codespaces">
  <img src="https://img.shields.io/badge/license-MIT-2b90d9" alt="license MIT">
</p>

<p align="center"><b>Français</b> · <a href="README.en.md">English</a></p>

EdgePulse est un widget iCUE qui affiche tes limites d'utilisation de Claude Code (session de 5 heures et semaine) dans un double halo lumineux qui s'adapte à la situation : calme, attention, critique, pause forcée, semaine critique et réinitialisation.

> **Fonctionne avec Claude Code dans GitHub Codespaces, ouvert dans VS Code sur ton PC.** Le relais s'installe dans tes Codespaces, et VS Code transmet les données au widget sur ton XENEON EDGE. Claude Code installé directement sur Windows n'est pas encore pris en charge.

<p align="center">
  <img src="docs/apercu.webp" alt="Les six états d'EdgePulse sur une tuile M" width="760">
</p>
<p align="center">
  <img src="docs/apercu-s.webp" alt="EdgePulse sur des tuiles S" width="760">
</p>

## Comment ça marche

1. Claude Code transmet tes limites à sa ligne d'état (`statusLine`).
2. La ligne d'état EdgePulse les garde et démarre un petit relais local sur le port 4747.
3. VS Code redirige ce port vers ton PC (Codespaces, conteneurs, SSH).
4. Le widget lit `http://localhost:4747/usage` et affiche les données.

Le widget s'affiche en français ou en anglais selon la langue de Windows.

Aucun identifiant n'est lu ni transmis : EdgePulse utilise seulement les données que Claude Code fournit officiellement à sa ligne d'état. Fonctionne avec un abonnement Pro ou Max.

## Installation

**👉 Suis le [guide d'installation complet](docs/INSTALLATION.md).** En résumé :

1. **Le relais** : copie le contenu du dossier `relay/` dans ton dépôt GitHub `dotfiles` et active les dotfiles dans tes paramètres Codespaces.
2. **La vérification** : envoie un message à Claude Code, puis ouvre `http://localhost:4747/usage` sur ton PC.
3. **Le widget** : télécharge le fichier `.icuewidget` dans les [Releases](../../releases) et importe-le dans iCUE, sur une tuile S ou M.

## Prérequis

- CORSAIR XENEON EDGE et iCUE 5.45 ou plus récent
- Abonnement Claude **Pro ou Max**
- Claude Code dans **GitHub Codespaces**, ouvert avec **VS Code de bureau**

## Contenu du dépôt

| Dossier | Contenu |
|---|---|
| `widget/` | Le widget iCUE |
| `relay/` | Le relais à copier dans ton dépôt `dotfiles` (installation et désinstallation) |
| `docs/` | Le guide d'installation |

## Avertissement

EdgePulse est un projet indépendant, non affilié à Anthropic, CORSAIR ou Elgato. « Claude Code » sert seulement à décrire ce que le widget mesure.

## Licence

MIT
