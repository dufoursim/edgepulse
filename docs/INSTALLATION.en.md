# EdgePulse installation guide

[Français](INSTALLATION.md) · **English**

This guide takes you from zero to a working EdgePulse widget on your XENEON EDGE. Allow about 15 minutes the first time.

## Contents

1. [Before you start](#1-before-you-start)
2. [How EdgePulse works](#2-how-edgepulse-works)
3. [Step 1: install the relay in your Codespaces](#3-step-1-install-the-relay-in-your-codespaces)
4. [Step 2: check that the relay works](#4-step-2-check-that-the-relay-works)
5. [Step 3: install the widget in iCUE](#5-step-3-install-the-widget-in-icue)
6. [Understanding the display](#6-understanding-the-display)
7. [Widget settings](#7-widget-settings)
8. [Updating](#8-updating)
9. [Uninstalling](#9-uninstalling)
10. [Troubleshooting](#10-troubleshooting)
11. [Privacy](#11-privacy)
12. [Known limitations](#12-known-limitations)

---

## 1. Before you start

Make sure you have all of this:

| Item | Details |
|---|---|
| Display | CORSAIR XENEON EDGE |
| Software | iCUE 5.45 or newer, on Windows |
| Claude subscription | **Pro or Max**. Usage limits don't exist with an API key. |
| Work environment | Claude Code used in **GitHub Codespaces** |
| Editor | **VS Code installed on your PC** (desktop app), with the GitHub Codespaces extension |
| Account | A GitHub account |

> **Important:** VS Code must be the desktop app. If you open your Codespace in the web browser, VS Code can't bring the data to `localhost` on your PC, and the widget won't receive anything.

## 2. How EdgePulse works

EdgePulse has two parts: a **relay** that lives in your Codespace, and a **widget** that lives in iCUE.

```
 GitHub Codespace (in the cloud)                  Your Windows PC
┌────────────────────────────────────┐          ┌──────────────────────────┐
│ Claude Code                        │          │ VS Code                  │
│   │ sends its limits to its        │          │   forwards port 4747     │
│   ▼ status line                    │          │   to localhost           │
│ statusline.py (EdgePulse)          │  ─────►  │          │               │
│   │ stores them and starts         │  port    │          ▼               │
│   ▼                                │  4747    │ EdgePulse widget (iCUE)  │
│ relay.py: http://127.0.0.1:4747    │          │   on the XENEON EDGE     │
└────────────────────────────────────┘          └──────────────────────────┘
```

1. Each time Claude Code receives a response, it sends your limits (5 hour session and week) to its **status line**.
2. The EdgePulse status line stores those limits and starts the relay if it isn't already running.
3. The relay serves the data on port 4747 of the Codespace.
4. VS Code automatically forwards that port to `localhost:4747` on your PC.
5. The widget reads `http://localhost:4747/usage` every 3 seconds.

Your limits belong to your Claude account: no matter which Codespace you work in, the percentages are the same.

## 3. Step 1: install the relay in your Codespaces

We use GitHub's **dotfiles** feature: a repository named `dotfiles` that GitHub copies into every new Codespace before running its `install.sh` script. You set this up only once.

Pick the case that matches yours.

### Case A: you don't have a `dotfiles` repository yet

1. **Download EdgePulse.** On the project page, click **Code**, then **Download ZIP**, and unzip the file.
2. **Create your repository.** On GitHub, click **New repository**.
   - Name: exactly `dotfiles`
   - Visibility: **Public** (simplest, the files contain nothing secret)
   - Click **Create repository**.
3. **Upload the files.** On the new repository's page, click **uploading an existing file**. Open EdgePulse's `relay` folder and drag **its contents**: `install.sh`, `uninstall.sh` and the `edgepulse` folder. Click **Commit changes**.
4. **Check.** At the root of your repository, you should see `install.sh`, `uninstall.sh` and the `edgepulse` folder directly.

> **Common mistake:** GitHub doesn't unzip `.zip` files. If you upload the zip as is, nothing will work. Upload the unzipped files.

> **Another common mistake:** if you see a `relay` folder at the root of your repository, you dragged the folder instead of its contents. The files must be directly at the root.

### Case B: you already have a `dotfiles` repository with your own `install.sh`

GitHub only runs one install script. You need to call EdgePulse's from yours.

1. Copy the `edgepulse` folder to the root of your `dotfiles` repository.
2. Copy EdgePulse's `install.sh`, renaming it `install-edgepulse.sh`.
3. Also copy `uninstall.sh`, renaming it `uninstall-edgepulse.sh`.
4. Add this line at the end of **your** `install.sh`:
   ```bash
   bash "$(dirname "${BASH_SOURCE[0]}")/install-edgepulse.sh"
   ```

### Enable dotfiles (cases A and B)

1. Open `https://github.com/settings/codespaces`. This is in **your account** settings, not a repository's: at the top left, you should see your name and "Your personal account".
2. In the **Dotfiles** section, check **Automatically install dotfiles**.
3. In the list that appears, choose your `dotfiles` repository.

All your **new** Codespaces will now install EdgePulse automatically.

### Install in an existing Codespace

Dotfiles only apply to Codespaces created after you enable them. For an existing Codespace, open a terminal in it and run (replace `<your-account>` with your GitHub username):

```bash
git clone https://github.com/<your-account>/dotfiles ~/dotfiles && bash ~/dotfiles/install.sh
```

You should see:

```
EdgePulse: installing...
EdgePulse: status line connected to Claude Code.
EdgePulse: done. The relay will start with your first message to Claude Code.
```

> **Already had a custom status line?** EdgePulse keeps it and keeps showing it. The message "your existing status line is kept" confirms it.

### Relay message language

The relay shows its messages in the Codespace's language (usually English). To force a language in all your Codespaces, add a user secret named `EDGEPULSE_LANG` with the value `fr` or `en` in `https://github.com/settings/codespaces`, under **Codespace user secrets**. The widget always follows the Windows language.

## 4. Step 2: check that the relay works

Do this check **before** installing the widget: if something is off, it's much easier to spot here.

1. **Restart Claude Code.** Close any open session (`/exit`), then run `claude` in a Codespace terminal.
2. **Look at the status line** at the bottom of the terminal. You should see:
   ```
   EdgePulse · waiting for limits
   ```
3. **Send a message** to Claude Code, for example "Hello". After the response, the line becomes:
   ```
   EdgePulse · 5h 12% · 7d 8%
   ```
4. **Check on your PC.** Open `http://localhost:4747/usage` in your Windows browser. You should see text starting with:
   ```json
   {"app": "edgepulse", "version": 1, "received_at": ..., "rate_limits": {...
   ```
5. **If the page doesn't load**, open the **PORTS** tab in VS Code (next to TERMINAL). Port 4747 should be listed. If it isn't, click **Forward a Port** and type `4747`.

If steps 3 and 4 work, the relay is ready.

## 5. Step 3: install the widget in iCUE

1. **Download the widget.** On the project page, open **Releases** (right column) and download the `EdgePulse-vX.Y.Z.icuewidget` file from the latest version.
2. **Open iCUE** and go to your XENEON EDGE section, where you manage widgets.
3. **Import the widget** with the widgets **+** button, then choose the `.icuewidget` file.
4. **Place EdgePulse on a tile** of size **S** (840 × 344) or **M** (840 × 688). The widget detects the size on its own.
5. **Accept the network permission** if iCUE asks for it on the XENEON EDGE. Without it, the widget can't read `localhost:4747`.

On first launch, the widget may show **DEMO** for a few seconds while it finds the relay. Once found, the indicator switches to **COMFORTABLE** (or the state matching your usage).

> **Tip:** the preview in the iCUE window is only an image. The real widget runs on the XENEON EDGE, and that's where the network permission is requested.

## 6. Understanding the display

### The double halo

- **Inner, thick ring**: your 5 hour session.
- **Outer, thin ring**: your 7 day window.
- **Small markers** on the inner ring: the 70% and 90% thresholds.

### The six states

| State | When | What changes |
|---|---|---|
| **COMFORTABLE** | Session under 70% | Teal, slow animations, percentage in the center |
| **HEADS UP** | Session from 70 to 89% | Amber, the center shows the estimated time left at your pace |
| **CRITICAL** | Session at 90% or more | Coral, pulsing border, advice to wrap up your task |
| **PAUSED** | Session at 100% | Animations stopped, countdown until you're back |
| **WEEK CRITICAL** | Week at 90% or more, and closer to its limit than the session | The outer ring takes center stage |
| **BACK ON** | Right after the session resets | Teal wave, then back to calm |

### Connection states

| Indicator | Meaning |
|---|---|
| **DEMO** | Relay not found. The six states cycle as an example. |
| **WAITING** | Relay found, but no limits received yet. Send a message to Claude Code. |
| **OFFLINE** | The relay stopped responding (Codespace stopped or VS Code closed). The last values stay on screen, dimmed. |

### Pace (M tile)

The widget remembers how your session evolves and calculates when you'd hit the limit if you keep the same pace. The estimate appears after a few minutes of use.

## 7. Widget settings

In iCUE, select the widget to see its settings.

| Setting | Default | Use |
|---|---|---|
| **Port du relais** (relay port) | 4747 | Change only if port 4747 is already taken on your PC (see troubleshooting) |
| **Animations** | On | Turn off for a static display |
| **Opacité du fond** (background opacity) | 100% | Lower it to let the iCUE wallpaper show through |

The widget language follows Windows (French or English).

## 8. Updating

**The widget:** in iCUE, remove the old widget, delete it from the list, then import the new `.icuewidget` file. Set your settings again if needed.

**The relay:** replace the files in your `dotfiles` repository with those from the new version's `relay` folder. New Codespaces will get the update. For an existing Codespace:

```bash
cd ~/dotfiles && git pull && bash install.sh
```

## 9. Uninstalling

**The widget:** in iCUE, remove it from its tile, then delete it from the widget list.

**The relay, in a Codespace:**

```bash
bash ~/dotfiles/uninstall.sh
```

(in case B, `bash ~/dotfiles/uninstall-edgepulse.sh`)

This script restores your status line from before EdgePulse if there was one, stops the relay and deletes the `~/.edgepulse` folder.

**For future Codespaces:** remove the EdgePulse files from your `dotfiles` repository, or uncheck **Automatically install dotfiles** in `https://github.com/settings/codespaces`.

## 10. Troubleshooting

### The widget stays on DEMO

1. Is your Codespace open in **desktop VS Code** (not in the browser)?
2. Have you sent at least one message to Claude Code since opening the Codespace? The relay starts with the first message.
3. Does `http://localhost:4747/usage` open in your Windows browser? If not, redo [step 2](#4-step-2-check-that-the-relay-works).
4. Did you accept the iCUE network permission on the XENEON EDGE?

### The status line doesn't show "EdgePulse"

1. Restart Claude Code: the settings are only read when a session starts.
2. Check that `~/.claude/settings.json` contains a `statusLine` block mentioning `edgepulse`:
   ```bash
   grep -A3 statusLine ~/.claude/settings.json
   ```
3. Run the installation again: `bash ~/dotfiles/install.sh`.

### The status line stays on "waiting for limits"

1. You need a **Pro or Max** subscription and to be signed in with that account in Claude Code (`/login`). With an API key, Claude Code doesn't send limits.
2. Limits arrive after the **first response** of the session.
3. Check your Claude Code version with `claude --version` and update it if needed.

### Port 4747 is already taken on my PC

VS Code then picks another local port, shown in the **PORTS** tab ("Forwarded Address" column). Enter that number in the widget's relay port setting.

### The widget shows OFFLINE

**OFFLINE** means the widget has received data before, but can't find the relay anymore. Three possible causes:

1. **Your Codespace stopped** (after a period of inactivity) or VS Code is closed. Reopen your Codespace and send a message to Claude Code.
2. **The relay is asleep.** It starts with the first message sent to Claude Code. Send a message, even a short one.
3. **This Codespace was created before you enabled dotfiles.** Dotfiles only install when a Codespace is created, so EdgePulse isn't there yet. To check, run this in a Codespace terminal:
   ```bash
   ls ~/.edgepulse
   ```
   If you get "No such file or directory", install EdgePulse in this Codespace (only once):
   ```bash
   git clone https://github.com/<your-account>/dotfiles ~/dotfiles && bash ~/dotfiles/install.sh
   ```
   Then restart Claude Code and send a message.

If you switch Codespaces, close the old one in VS Code: two Codespaces forwarding port 4747 at the same time can interfere with each other.

### Python not found

The relay needs `python3`, included in the default Codespaces images. If you use a custom image without Python, the installer says so and stops without changing anything.

## 11. Privacy

- EdgePulse **reads no credentials**: it only uses the data Claude Code officially provides to its status line.
- The relay only exposes: the limits (percentages and reset times), the model name, the context fill level and the session's API equivalent. **No folder paths, no conversation content.**
- The relay only listens on `127.0.0.1` in your Codespace, and VS Code only forwards it to your own PC.
- The widget contacts no Internet service.

## 12. Known limitations

- **Claude Code must run in GitHub Codespaces** for this version. Other remote environments opened in VS Code (dev containers, SSH, WSL) should work by running `install.sh` manually, but they haven't been tested yet. Claude Code installed directly on Windows isn't supported yet.
- **Data updates when you use Claude Code.** Your claude.ai usage counts toward the same limits, but the widget only sees it on your next Claude Code message.
- **The plan (Pro or Max) isn't shown**: Claude Code doesn't send that information.
- **The Claude Code extension for VS Code** (the graphical panel) might not call the status line. The terminal always works.
