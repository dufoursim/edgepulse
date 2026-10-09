(function () {
  "use strict";

  /* ---------- Variables globales d'iCUE ----------
     iCUE peut déclarer ses variables avec « let » : elles existent dans la portée
     globale sans être sur window. Function() s'exécute dans la portée globale. */
  function hasGlobal(name) {
    try { return Function("return typeof " + name + ' !== "undefined"')(); } catch (e) { return false; }
  }
  function readGlobal(name) {
    try { return Function("return typeof " + name + ' !== "undefined" ? ' + name + " : undefined")(); } catch (e) { return undefined; }
  }
  function writeGlobal(name, value) {
    try { Function("v", name + " = v;")(value); } catch (e) { /* ignoré */ }
    try { window[name] = value; } catch (e) { /* ignoré */ }
  }

  /* ---------- Langue ---------- */
  const LANG = String(navigator.language || "fr").toLowerCase().startsWith("fr") ? "fr" : "en";
  const TXT = {
    fr: {
      tagline: "Utilisation de Claude Code",
      live: "EN DIRECT", demo: "DÉMO", offline: "HORS LIGNE", waiting: "EN ATTENTE", connecting: "CONNEXION",
      lvl: { calme: "CONFORTABLE", attention: "ATTENTION", critique: "CRITIQUE", limite: "EN PAUSE", semaine: "SEMAINE CRITIQUE", reset: "C'EST REPARTI" },
      session5h: "SESSION 5 H", session: "SESSION", week: "SEMAINE",
      atRate: "AU RYTHME ACTUEL", leftAbout: "IL TE RESTE ENVIRON", backIn: "RETOUR DANS", newSession: "NOUVELLE SESSION",
      resetIn: (d) => "Réinit. dans <b>" + d + "</b>",
      resetAt: (d) => "Réinit. <b>" + d + "</b>",
      usedOfSession: (p) => p + " % de la session utilisés",
      usedResetIn: (p, d) => p + " % utilisés · réinit. " + d,
      limitReached: "Limite de session atteinte",
      available: "de ta session disponible",
      freshWindow: "Nouvelle fenêtre au prochain message",
      rhythm: "RYTHME", last60: "60 dernières min",
      etaAt: (h) => "Limite atteinte vers <b>" + h + "</b> à ce rythme",
      etaNone: "Aucune limite en vue avant la réinitialisation",
      etaIdle: "Pas d'activité récente",
      ago: (d) => "il y a " + d, now: "à l'instant",
      context: (p) => "contexte " + p + " %",
      tips: {
        calme: ["Tout roule", "Rythme normal. Rien à surveiller pour l'instant."],
        attention: ["Ton rythme est soutenu", "Garde l'œil sur le temps restant estimé au centre."],
        critique: ["Conclus ta tâche en cours", "Bon moment pour demander un résumé ou faire un commit avant la coupure."],
        limite: ["Pause forcée", "Le halo affiche le compte à rebours jusqu'au retour."],
        semaine: ["La semaine te bloquera en premier", "C'est la limite hebdomadaire qui est la plus proche."],
        reset: ["C'est reparti", "Ta session de 5 heures est de nouveau disponible."]
      },
      demoTip: ["Mode démo", "Relais introuvable sur le port {port}. Ouvre ton Codespace dans VS Code et envoie un message à Claude Code."],
      offlineTip: ["Codespace déconnecté", "Dernières valeurs reçues {ago}. Elles reviendront au prochain message."],
      waitingTip: ["Relais trouvé", "Envoie un message à Claude Code pour recevoir tes limites."],
      notFound: (p) => "localhost:" + p + " introuvable"
    },
    en: {
      tagline: "Claude Code usage",
      live: "LIVE", demo: "DEMO", offline: "OFFLINE", waiting: "WAITING", connecting: "CONNECTING",
      lvl: { calme: "COMFORTABLE", attention: "HEADS UP", critique: "CRITICAL", limite: "PAUSED", semaine: "WEEK CRITICAL", reset: "BACK ON" },
      session5h: "5 H SESSION", session: "SESSION", week: "WEEK",
      atRate: "AT CURRENT PACE", leftAbout: "ABOUT", backIn: "BACK IN", newSession: "NEW SESSION",
      resetIn: (d) => "Resets in <b>" + d + "</b>",
      resetAt: (d) => "Resets <b>" + d + "</b>",
      usedOfSession: (p) => p + "% of session used",
      usedResetIn: (p, d) => p + "% used · resets in " + d,
      limitReached: "Session limit reached",
      available: "of your session available",
      freshWindow: "New window on your next message",
      rhythm: "PACE", last60: "last 60 min",
      etaAt: (h) => "Limit reached around <b>" + h + "</b> at this pace",
      etaNone: "No limit in sight before reset",
      etaIdle: "No recent activity",
      ago: (d) => d + " ago", now: "just now",
      context: (p) => "context " + p + "%",
      tips: {
        calme: ["All good", "Normal pace. Nothing to watch for now."],
        attention: ["Your pace is high", "Keep an eye on the estimated time left in the center."],
        critique: ["Wrap up your current task", "Good time to ask for a summary or commit before the cutoff."],
        limite: ["Forced break", "The halo counts down until you're back."],
        semaine: ["The week will stop you first", "Your weekly limit is the closest one."],
        reset: ["Back on", "Your 5 hour session is available again."]
      },
      demoTip: ["Demo mode", "No relay found on port {port}. Open your Codespace in VS Code and send a message to Claude Code."],
      offlineTip: ["Codespace disconnected", "Last values received {ago}. They'll come back with your next message."],
      waitingTip: ["Relay found", "Send a message to Claude Code to receive your limits."],
      notFound: (p) => "localhost:" + p + " not found"
    }
  };
  const L = TXT[LANG];

  /* ---------- Réglages ---------- */
  const settings = { relayPort: "4747", animations: true, bgOpacity: 100 };
  function applySettings(incoming) {
    const src = incoming && typeof incoming === "object" ? incoming : {};
    for (const key of Object.keys(settings)) {
      let v = src[key];
      if (v === undefined) v = readGlobal(key);
      if (v !== undefined && v !== null && v !== "") settings[key] = v;
    }
    const app = document.getElementById("app");
    const anim = settings.animations === true || settings.animations === "true";
    app.dataset.anim = anim ? "on" : "off";
    const op = Math.max(0, Math.min(100, Number(settings.bgOpacity)));
    document.documentElement.style.setProperty("--bg-opacity", String((isNaN(op) ? 100 : op) / 100));
    render();
  }
  function port() {
    const p = parseInt(String(settings.relayPort).trim(), 10);
    return p > 0 && p < 65536 ? p : 4747;
  }

  /* ---------- Stockage local ---------- */
  function load(key, fallback) {
    try { const v = localStorage.getItem("edgepulse:" + key); return v ? JSON.parse(v) : fallback; } catch (e) { return fallback; }
  }
  function save(key, value) {
    try { localStorage.setItem("edgepulse:" + key, JSON.stringify(value)); } catch (e) { /* ignoré */ }
  }

  /* ---------- Connexion au relais ---------- */
  let data = load("last", null);   // dernières données reçues
  let history = load("history", []); // [{t, p, r}] : session de 5 h dans le temps
  let conn = data ? "offline" : "connecting";
  let fails = 0;
  let everReached = false;

  function recordHistory(d) {
    const fh = d.rate_limits && d.rate_limits.five_hour;
    if (!fh || typeof fh.used_percentage !== "number") return;
    const t = (d.received_at || Date.now() / 1000) * 1000;
    const last = history[history.length - 1];
    if (last && last.p === fh.used_percentage && last.r === fh.resets_at) return;
    if (last && t < last.t) return;
    history.push({ t: t, p: fh.used_percentage, r: fh.resets_at });
    const cutoff = Date.now() - 6 * 3600 * 1000;
    history = history.filter((h) => h.t >= cutoff).slice(-600);
    save("history", history);
  }

  async function poll() {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 2500);
    try {
      const r = await fetch("http://localhost:" + port() + "/usage", { cache: "no-store", signal: ctrl.signal });
      const j = await r.json();
      everReached = true;
      fails = 0;
      if (j && j.status === "ok" && j.rate_limits) {
        data = j;
        save("last", j);
        recordHistory(j);
        conn = "live";
      } else {
        conn = data ? "live" : "waiting";
      }
    } catch (e) {
      fails++;
      if (data) { if (fails >= 3) conn = "offline"; }
      else if (fails >= 2) conn = everReached ? "waiting" : "demo";
    } finally {
      clearTimeout(timer);
    }
    render();
  }

  /* ---------- Formatage ---------- */
  function dur(ms) {
    const m = Math.max(0, Math.round(ms / 60000));
    if (m < 60) return LANG === "fr" ? m + " min" : m + "m";
    const h = Math.floor(m / 60), r = m % 60;
    if (h >= 24) {
      const j = Math.floor(h / 24), hh = h % 24;
      return LANG === "fr" ? j + " j " + hh + " h" : j + "d " + hh + "h";
    }
    return LANG === "fr" ? h + " h " + String(r).padStart(2, "0") : h + "h " + String(r).padStart(2, "0") + "m";
  }
  function clock(ms) {
    const d = new Date(ms);
    if (LANG === "fr") return d.getHours() + " h " + String(d.getMinutes()).padStart(2, "0");
    return d.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
  }
  function dayTime(ms) {
    const d = new Date(ms);
    if (LANG === "fr") {
      const jour = d.toLocaleDateString("fr-CA", { weekday: "long" });
      const mm = d.getMinutes();
      return jour + " " + String(d.getHours()).padStart(2, "0") + " h" + (mm ? " " + String(mm).padStart(2, "0") : "");
    }
    return d.toLocaleDateString("en-US", { weekday: "short" }) + " " + d.toLocaleTimeString("en-US", { hour: "numeric", minute: d.getMinutes() ? "2-digit" : undefined });
  }

  /* ---------- Couleurs ---------- */
  const TEAL = "#5EC8B8", AMBER = "#F2B04C", CORAL = "#FF6B5A";
  function colorOf(p) { return p >= 90 ? CORAL : p >= 70 ? AMBER : TEAL; }
  const LEVEL = {
    calme: { accent: TEAL, glow: "rgba(94,200,184,0.28)", tint: "#121724" },
    attention: { accent: AMBER, glow: "rgba(242,176,76,0.30)", tint: "#1A1710" },
    critique: { accent: CORAL, glow: "rgba(255,107,90,0.38)", tint: "#1E1012" },
    limite: { accent: CORAL, glow: "rgba(255,107,90,0.18)", tint: "#140C0E" },
    semaine: { accent: CORAL, glow: "rgba(255,107,90,0.30)", tint: "#1A1012" },
    reset: { accent: TEAL, glow: "rgba(94,200,184,0.40)", tint: "#0F1C1C" }
  };

  /* ---------- Rythme ---------- */
  function pace(now, current) {
    const win = history.filter((h) => h.r === current.r);
    if (!win.length) return null;
    const horizon = now - 30 * 60000;
    let base = null;
    for (const h of win) { if (h.t <= horizon) base = h; }
    if (!base) base = win[0];
    const minutes = (now - base.t) / 60000;
    if (minutes < 3) return null;
    const rate = (current.p - base.p) / minutes; // % par minute
    return rate > 0.005 ? rate : 0;
  }
  function buckets(now, current) {
    const n = 20, size = 3 * 60000, start = now - n * size;
    const out = new Array(n).fill(0);
    for (let i = 1; i < history.length; i++) {
      const a = history[i - 1], b = history[i];
      if (b.t < start) continue;
      const delta = b.r === a.r ? b.p - a.p : b.p;
      if (delta <= 0) continue;
      const idx = Math.min(n - 1, Math.floor((b.t - start) / size));
      if (idx >= 0) out[idx] += delta;
    }
    return out;
  }

  /* ---------- Démo ---------- */
  const DEMO = [
    { s: 38, w: 22, eta: null }, { s: 76, w: 41, eta: 52 }, { s: 94, w: 58, eta: 9 },
    { s: 100, w: 63, eta: null }, { s: 30, w: 92, eta: null }, { s: -1, w: 63, eta: null }
  ];
  function demoData(now) {
    const sc = DEMO[Math.floor(now / 4000) % DEMO.length];
    const expired = sc.s < 0;
    return {
      fake: true, eta: sc.eta,
      rate_limits: {
        five_hour: { used_percentage: expired ? 72 : sc.s, resets_at: Math.floor((expired ? now - 30000 : now + (sc.s >= 100 ? 72 : 190) * 60000) / 1000) },
        seven_day: { used_percentage: sc.w, resets_at: Math.floor((now + 3 * 86400000) / 1000) }
      },
      model: "Opus", context_used_percentage: 34, received_at: Math.floor(now / 1000) - 40
    };
  }

  /* ---------- Rendu ---------- */
  const $ = (id) => document.getElementById(id);
  const C1 = 2 * Math.PI * 156, C2 = 2 * Math.PI * 194;
  let prevLevel = null;

  function setTick(id, pct, show) {
    const el = $(id);
    if (!show) { el.style.opacity = "0"; return; }
    const a = (pct / 100) * 2 * Math.PI - Math.PI / 2;
    el.setAttribute("x1", 210 + 136 * Math.cos(a)); el.setAttribute("y1", 210 + 136 * Math.sin(a));
    el.setAttribute("x2", 210 + 178 * Math.cos(a)); el.setAttribute("y2", 210 + 178 * Math.sin(a));
    el.style.opacity = "0.9";
  }

  function render() {
    const app = $("app");
    if (!app) return;
    const now = Date.now();
    app.dataset.layout = window.innerWidth / Math.max(1, window.innerHeight) > 1.8 ? "s" : "m";
    app.dataset.conn = conn;

    const d = conn === "demo" || (!data && conn !== "waiting") ? demoData(now) : data;
    const rl = (d && d.rate_limits) || {};
    const fh = rl.five_hour || {}, sd = rl.seven_day || {};
    const sReset = (fh.resets_at || 0) * 1000, wReset = (sd.resets_at || 0) * 1000;
    const sExpired = !!sReset && now >= sReset;
    const wExpired = !!wReset && now >= wReset;
    const s = d ? (sExpired ? 0 : Math.round(fh.used_percentage || 0)) : 0;
    const w = d && typeof sd.used_percentage === "number" ? (wExpired ? 0 : Math.round(sd.used_percentage)) : null;

    let level = "calme";
    if (sExpired) level = now - sReset < 120000 ? "reset" : "calme";
    else if (s >= 100) level = "limite";
    else if (w !== null && w >= 90 && w >= s) level = "semaine";
    else if (s >= 90) level = "critique";
    else if (s >= 70) level = "attention";
    if (!d) level = "calme";

    if (level === "reset" && prevLevel && prevLevel !== "reset") {
      const f = $("flash"); f.classList.remove("go"); void f.offsetWidth; f.classList.add("go");
    }
    prevLevel = level;
    app.dataset.level = level;

    const lv = LEVEL[level];
    const root = document.documentElement.style;
    root.setProperty("--accent", lv.accent); root.setProperty("--glow", lv.glow); root.setProperty("--tint", lv.tint);
    root.setProperty("--sess", colorOf(s)); root.setProperty("--week", w === null ? TEAL : colorOf(w));

    // Anneaux
    const weekFocus = level === "semaine";
    const sa = $("sessArc"), wa = $("weekArc");
    sa.setAttribute("stroke-dasharray", (C1 * Math.min(100, s) / 100) + " " + C1);
    wa.setAttribute("stroke-dasharray", (C2 * Math.min(100, w || 0) / 100) + " " + C2);
    const sw = weekFocus ? 14 : 30, ww = weekFocus ? 26 : 10;
    sa.setAttribute("stroke-width", sw); $("sessTrack").setAttribute("stroke-width", sw);
    wa.setAttribute("stroke-width", ww); $("weekTrack").setAttribute("stroke-width", ww);
    sa.style.opacity = s <= 0 ? 0 : level === "limite" ? 0.45 : weekFocus ? 0.6 : 1;
    wa.style.opacity = !w ? 0 : weekFocus ? 1 : 0.85;
    setTick("tick70", 70, !weekFocus && level !== "limite");
    setTick("tick90", 90, !weekFocus && level !== "limite");

    // Rythme et estimation
    const current = { p: s, r: fh.resets_at };
    let rate = d && !d.fake && !sExpired ? pace(now, current) : null;
    let etaMin = null;
    if (d && d.fake) etaMin = d.eta;
    else if (rate) etaMin = (100 - s) / rate;
    const untilReset = sReset - now;
    const etaBeforeReset = etaMin !== null && etaMin * 60000 < untilReset;

    // Centre
    let label = L.session5h, big = String(s), unit = "%", sub = "", long = false;
    if (!d) { big = "…"; unit = ""; }
    else if (level === "reset" || (sExpired && level === "calme")) {
      label = level === "reset" ? L.newSession : L.session5h;
      big = level === "reset" ? "100" : "0"; sub = level === "reset" ? L.available : L.freshWindow;
    } else if (level === "limite") {
      label = L.backIn; big = dur(untilReset); unit = ""; long = true; sub = L.limitReached;
    } else if (level === "semaine") {
      label = L.week; big = String(w); sub = L.resetAt(dayTime(wReset));
    } else if ((level === "attention" || level === "critique") && etaBeforeReset) {
      label = level === "critique" ? L.leftAbout : L.atRate;
      if (etaMin < 60) { big = String(Math.max(1, Math.round(etaMin))); unit = "min"; }
      else { big = dur(etaMin * 60000); unit = ""; long = true; }
      sub = level === "critique" ? L.usedResetIn(s, dur(untilReset)) : L.usedOfSession(s);
    } else {
      sub = sReset ? L.resetIn(dur(untilReset)) : "";
    }
    $("cLabel").textContent = label;
    $("cBig").textContent = big;
    $("cBig").style.fontSize = long ? (app.dataset.layout === "s" ? "52px" : "80px") : "";
    $("cUnit").textContent = unit;
    $("cSub").innerHTML = sub;

    // Carte A (M : semaine, ou session si la semaine est en vedette)
    const aIsSession = weekFocus;
    $("mALabel").textContent = aIsSession ? L.session5h : L.week;
    $("mAVal").textContent = aIsSession ? s : (w === null ? "…" : w);
    $("mAFill").style.width = (aIsSession ? s : (w || 0)) + "%";
    $("mAFill").style.background = aIsSession ? "var(--sess)" : "var(--week)";
    $("mAFill").style.boxShadow = "0 0 12px " + (aIsSession ? "var(--sess)" : "var(--week)");
    $("mASub").innerHTML = aIsSession ? (sReset ? L.resetIn(dur(untilReset)) : "") : (wReset ? L.resetAt(dayTime(wReset)) : "");

    // Disposition S : la carte A affiche la semaine, la carte B la session
    if (app.dataset.layout === "s") {
      $("mALabel").textContent = L.week;
      $("mAVal").textContent = w === null ? "…" : w;
      $("mAFill").style.width = (w || 0) + "%";
      $("mAFill").style.background = "var(--week)";
      $("mAFill").style.boxShadow = "0 0 12px var(--week)";
      $("mASub").innerHTML = wReset ? L.resetAt(dayTime(wReset)) : "";
    }
    $("mBLabel").textContent = L.session;
    $("mBVal").textContent = s;
    $("mBFill").style.width = s + "%";
    $("mBSub").innerHTML = sExpired ? L.freshWindow : (sReset ? L.resetIn(dur(untilReset)) : "");

    // Rythme
    const vals = d && d.fake ? [8,12,10,18,22,16,28,34,30,26,40,46,38,52,48,44,58,62,54,50].map((v) => v * (0.3 + s / 120)) : buckets(now, current);
    const max = Math.max(2, ...vals);
    const barsEl = $("bars");
    if (barsEl.children.length !== vals.length) barsEl.innerHTML = vals.map(() => "<i></i>").join("");
    vals.forEach((v, i) => {
      const el = barsEl.children[i];
      el.style.height = Math.max(3, Math.round((v / max) * 54)) + "px";
      el.className = i >= vals.length - 2 ? "now" : "";
    });
    $("rLabel").textContent = L.rhythm;
    $("rSpan").textContent = L.last60;
    $("rSub").innerHTML = !d ? "" : sExpired ? L.etaIdle : s >= 100 ? L.limitReached : etaBeforeReset ? L.etaAt(clock(now + etaMin * 60000)) : rate === 0 ? L.etaIdle : L.etaNone;

    // Carte conseil, selon la connexion
    let tip = L.tips[level];
    const agoTxt = d && d.received_at ? (now / 1000 - d.received_at < 60 ? L.now : L.ago(dur(now - d.received_at * 1000))) : "";
    if (conn === "demo") tip = [L.demoTip[0], L.demoTip[1].replace("{port}", port())];
    else if (conn === "offline") tip = [L.offlineTip[0], L.offlineTip[1].replace("{ago}", agoTxt)];
    else if (conn === "waiting" && !data) tip = L.waitingTip;
    $("tipTitle").textContent = tip[0];
    $("tipText").textContent = tip[1];

    // État et pied
    const etat = conn === "demo" ? L.demo : conn === "offline" ? L.offline : conn === "waiting" && !data ? L.waiting : conn === "connecting" ? L.connecting : L.lvl[level];
    $("etat").textContent = etat;
    $("tagline").textContent = L.tagline;
    const model = d && d.model ? d.model : "";
    $("footL").textContent = conn === "demo" ? L.notFound(port()) : [model, agoTxt].filter(Boolean).join(" · ");
    $("footR").textContent = d && typeof d.context_used_percentage === "number" && conn !== "demo" ? L.context(Math.round(d.context_used_percentage)) : "";
  }

  /* ---------- Démarrage ---------- */
  writeGlobal("icueEvents", {
    onICUEInitialized: function (payload) { applySettings(payload && payload.settings); },
    onDataUpdated: function (payload) { applySettings(payload && payload.settings); }
  });

  document.documentElement.lang = LANG;
  applySettings();
  poll();
  setInterval(poll, 3000);
  setInterval(render, 1000);
  window.addEventListener("resize", render);
  // Relecture régulière des réglages, au cas où iCUE ne déclencherait pas d'événement
  setInterval(() => { if (hasGlobal("iCUE_initialized")) applySettings(); }, 5000);
})();
