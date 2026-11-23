(() => {
  const STYLE = `
    #zd-analytics-consent,#zd-admin-layer{font-family:Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;color:#f5f0e8}
    #zd-analytics-consent{position:fixed;z-index:1000;left:20px;bottom:20px;width:min(440px,calc(100vw - 40px));padding:20px;background:rgba(15,17,19,.97);border:1px solid rgba(255,255,255,.18);box-shadow:0 20px 70px #0009;backdrop-filter:blur(18px)}
    #zd-analytics-consent[hidden],#zd-admin-layer[hidden],[hidden]{display:none!important}
    #zd-analytics-consent strong{display:block;margin-bottom:7px;font-size:15px}
    #zd-analytics-consent p,#zd-admin-layer p{margin:0;color:#c5c0b8;font-size:14px;line-height:1.6}
    .zd-consent-actions{display:flex;gap:9px;margin-top:15px}
    .zd-consent-actions button,.zd-admin-button{min-height:42px;padding:0 15px;border:1px solid #ff762b;background:#ff762b;color:#160c06;font:inherit;font-size:12px;font-weight:800;letter-spacing:.06em;text-transform:uppercase;cursor:pointer}
    .zd-consent-actions button+button{border-color:#777;background:transparent;color:#f5f0e8}
    #zd-analytics-consent a{color:#ffb487;font-size:13px}
    #zd-admin-layer{position:fixed;z-index:1100;inset:0;display:grid;place-items:center;padding:clamp(8px,2vw,22px);background:rgba(0,0,0,.82);backdrop-filter:blur(14px)}
    .zd-admin-card{position:relative;width:min(1080px,100%);max-height:min(92vh,1000px);overflow:auto;overscroll-behavior:contain;padding:clamp(22px,4vw,42px);background:radial-gradient(ellipse at 50% -20%,#ff762b20,transparent 52%),linear-gradient(145deg,#181a1c,#0d0f10);border:1px solid rgba(255,118,43,.58);box-shadow:0 30px 100px #000b;scrollbar-color:#ff762b55 #ffffff0a;scrollbar-width:thin}
    .zd-admin-close{position:absolute;top:14px;right:16px;width:42px;height:42px;border:1px solid #ffffff30;background:#ffffff08;color:white;font-size:23px;cursor:pointer}
    .zd-admin-eyebrow{margin:0 0 9px!important;color:#ff9a62!important;font-size:11px!important;font-weight:900;letter-spacing:.22em;text-transform:uppercase}
    .zd-admin-card h2{margin:0 52px 10px 0;font-size:clamp(28px,6vw,42px);line-height:1;letter-spacing:-.06em;text-transform:uppercase}
    .zd-admin-form{display:grid;gap:13px;max-width:440px;margin-top:24px}
    .zd-admin-form label{display:grid;gap:8px;color:#d9d4cc;font-size:13px;font-weight:750}
    .zd-admin-form input{width:100%;min-height:48px;padding:0 13px;border:1px solid #ffffff35;background:#080a0b;color:#fff;font:inherit;font-size:16px}
    .zd-password-row{display:flex;gap:8px}.zd-password-row input{flex:1;min-width:0}.zd-password-row button{padding:0 12px;border:1px solid #ffffff35;background:#ffffff08;color:#fff;cursor:pointer}
    .zd-admin-error{min-height:22px;color:#ffb49b!important}
    .zd-dashboard-heading{display:flex;align-items:end;justify-content:space-between;gap:18px;margin:24px 0 12px}.zd-dashboard-heading h3,.zd-admin-section h3{margin:0;font-size:13px;letter-spacing:.14em;text-transform:uppercase}.zd-dashboard-heading span{color:#a9a39a;font-size:11px;letter-spacing:.12em;text-transform:uppercase}
    .zd-admin-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(158px,1fr));gap:12px;margin:0 0 30px}
    .zd-stat{display:grid;justify-items:center;align-content:start;gap:11px;min-width:0;padding:18px 12px 16px;border:1px solid #ffffff16;background:linear-gradient(155deg,#ffffff0a,#ffffff03);text-align:center}
    .zd-stat-ring{--ring-color:#ff762b;position:relative;display:grid;place-items:center;width:clamp(112px,12vw,142px);aspect-ratio:1;border-radius:50%;background:conic-gradient(from -90deg,var(--ring-color),var(--ring-color));box-shadow:0 0 28px color-mix(in srgb,var(--ring-color) 14%,transparent)}
    .zd-stat-ring:before{position:absolute;inset:7px;border:1px solid #ffffff10;border-radius:50%;background:#121416;content:""}
    .zd-stat-ring strong{position:relative;z-index:1;max-width:88%;overflow:hidden;font-size:clamp(20px,2.6vw,29px);letter-spacing:-.06em;text-overflow:ellipsis;white-space:nowrap}
    .zd-stat-label{color:#e7e0d7;font-size:11px;font-weight:800;letter-spacing:.09em;text-transform:uppercase}
    .zd-stat-hint{color:#938d85;font-size:10px}
    .zd-admin-columns{display:grid;grid-template-columns:1fr 1fr;gap:14px}.zd-admin-section{min-width:0;padding:19px;border:1px solid #ffffff18;background:#ffffff05}.zd-admin-section h3{margin:0 0 5px}.zd-chart-subtitle{margin:0 0 17px!important;color:#948e86!important;font-size:11px!important}
    .zd-chart-layout{display:grid;grid-template-columns:minmax(130px,190px) 1fr;align-items:center;gap:18px;min-height:180px}
    .zd-donut{width:min(100%,180px);margin:auto;overflow:visible;transform:rotate(-90deg)}.zd-donut-track{fill:none;stroke:#ffffff0d;stroke-width:16}.zd-donut-slice{fill:none;stroke-width:16;stroke-linecap:butt;transition:stroke-dasharray .6s ease,stroke-dashoffset .6s ease}.zd-donut-total{fill:#fff;font:800 15px Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;text-anchor:middle}.zd-donut-caption{fill:#a9a39a;font:700 5px Inter,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;letter-spacing:1px;text-anchor:middle}
    .zd-chart-legend{display:grid;gap:11px;margin:0;padding:0;list-style:none}.zd-chart-legend li{display:grid;grid-template-columns:9px 1fr auto;align-items:center;gap:9px;min-width:0;color:#d9d4cc;font-size:12px}.zd-chart-legend li span:nth-child(2){overflow:hidden;text-overflow:ellipsis;white-space:nowrap}.zd-chart-legend b{color:#fff;font-variant-numeric:tabular-nums}.zd-legend-dot{width:8px;height:8px;border-radius:50%;box-shadow:0 0 10px currentColor}.zd-chart-empty{grid-column:1/-1;display:grid;place-items:center;min-height:125px;color:#aaa39a;text-align:center;font-size:12px}
    .zd-admin-foot{display:flex;align-items:center;flex-wrap:wrap;gap:10px;margin-top:22px;padding-top:16px;border-top:1px solid #ffffff14}.zd-admin-foot p{flex:1 1 250px;font-size:11px!important}.zd-admin-foot .zd-admin-button{min-height:38px}.zd-admin-foot [data-logout]{border-color:#ffffff35;background:transparent;color:#f5f0e8}
    @media(max-width:720px){.zd-admin-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.zd-admin-columns{grid-template-columns:1fr}.zd-chart-layout{grid-template-columns:minmax(110px,150px) 1fr;min-height:145px}.zd-donut{max-width:145px}}
    @media(max-width:420px){#zd-admin-layer{padding:0;place-items:stretch}.zd-admin-card{width:100%;max-height:100dvh;padding:24px 16px;border-right:0;border-left:0}.zd-admin-stats{gap:8px}.zd-stat{padding:14px 7px}.zd-stat-ring{width:clamp(100px,33vw,128px)}.zd-chart-layout{grid-template-columns:110px 1fr;gap:10px}.zd-chart-legend{gap:8px}.zd-chart-legend li{font-size:11px}.zd-admin-foot{align-items:stretch}.zd-admin-foot .zd-admin-button{flex:1}}
  `;
  const style = document.createElement("style");
  style.textContent = STYLE;
  document.head.append(style);

  const CONSENT_KEY = "zen-drift-analytics-choice";
  const ID_KEY = "zen-drift-analytics-session";
  const analyticsConfigured = window.ZEN_ANALYTICS_CONFIGURED === true;
  const consent = document.createElement("aside");
  consent.id = "zd-analytics-consent";
  consent.setAttribute("aria-label", "Analytics preferences");
  consent.hidden = true;
  consent.innerHTML = `<strong>Help improve Zen Drift Cruise</strong><p>With your permission, we count anonymous page visits, active time and download link clicks. We do not collect names, email addresses or IP addresses. Read the <a href="/privacy">privacy policy</a>.</p><div class="zd-consent-actions"><button type="button" data-choice="yes">Allow stats</button><button type="button" data-choice="no">No thanks</button></div>`;
  document.body.append(consent);

  const layer = document.createElement("div");
  layer.id = "zd-admin-layer";
  layer.hidden = true;
  layer.innerHTML = `<section class="zd-admin-card" role="dialog" aria-modal="true" aria-labelledby="zd-admin-title"><button class="zd-admin-close" type="button" aria-label="Close">×</button><p class="zd-admin-eyebrow">Zen Drift Cruise · Private area</p><h2 id="zd-admin-title">Website insights</h2><p class="zd-admin-intro">Sign in to see anonymous activity from visitors who allowed statistics.</p><form class="zd-admin-form"><label for="zd-admin-password">Owner password</label><div class="zd-password-row"><input id="zd-admin-password" type="password" autocomplete="current-password" required maxlength="256"><button type="button" data-show-password>Show</button></div><button class="zd-admin-button" type="submit">Open dashboard</button><p class="zd-admin-error" role="status" aria-live="polite"></p></form><div class="zd-admin-dashboard" hidden><div class="zd-dashboard-heading"><h3>Live overview</h3><span>Opt-in visitor activity</span></div><div class="zd-admin-stats"><div class="zd-stat"><div class="zd-stat-ring" style="--ring-color:#ff762b"><strong data-stat="unique_sessions">—</strong></div><span class="zd-stat-label">Visitor sessions</span><span class="zd-stat-hint">Anonymous browsers</span></div><div class="zd-stat"><div class="zd-stat-ring" style="--ring-color:#ffd166"><strong data-stat="page_views">—</strong></div><span class="zd-stat-label">Page views</span><span class="zd-stat-hint">Total visits to pages</span></div><div class="zd-stat"><div class="zd-stat-ring" style="--ring-color:#70d6a4"><strong data-stat="active_last_7d">—</strong></div><span class="zd-stat-label">Last 7 days</span><span class="zd-stat-hint">Active sessions</span></div><div class="zd-stat"><div class="zd-stat-ring" style="--ring-color:#66c7ed"><strong data-stat="average_seconds">—</strong></div><span class="zd-stat-label">Average time</span><span class="zd-stat-hint">Active per session</span></div><div class="zd-stat"><div class="zd-stat-ring" style="--ring-color:#bc9cff"><strong data-stat="total_seconds">—</strong></div><span class="zd-stat-label">Time on site</span><span class="zd-stat-hint">Total active time</span></div></div><div class="zd-dashboard-heading"><h3>Traffic charts</h3><span>Where activity goes</span></div><div class="zd-admin-columns"><section class="zd-admin-section"><h3>Pages viewed</h3><p class="zd-chart-subtitle">Share of all page views</p><div class="zd-chart-layout" data-chart="pages"></div></section><section class="zd-admin-section"><h3>Downloads</h3><p class="zd-chart-subtitle">Share of download link clicks</p><div class="zd-chart-layout" data-chart="downloads"></div></section></div><div class="zd-admin-foot"><p data-updated>Stats reflect visitors who opted in.</p><button class="zd-admin-button" type="button" data-refresh>Refresh</button><button class="zd-admin-button" type="button" data-logout>Sign out</button></div></div></section>`;
  document.body.append(layer);

  const modal = layer.querySelector(".zd-admin-card");
  const form = layer.querySelector(".zd-admin-form");
  const error = layer.querySelector(".zd-admin-error");
  const dashboard = layer.querySelector(".zd-admin-dashboard");
  const loginIntro = layer.querySelector(".zd-admin-intro");
  let previousFocus = null;
  let lastEngagementAt = Date.now();

  function createId() {
    if (window.crypto?.randomUUID) return crypto.randomUUID();
    return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (char) => {
      const random = Math.random() * 16 | 0;
      return (char === "x" ? random : (random & 3 | 8)).toString(16);
    });
  }

  function getSessionId() {
    try {
      let id = sessionStorage.getItem(ID_KEY);
      if (!id) { id = createId(); sessionStorage.setItem(ID_KEY, id); }
      return id;
    } catch { return createId(); }
  }

  function deviceKind() {
    if (/iPad|Tablet/i.test(navigator.userAgent)) return "tablet";
    if (/Android|iPhone|iPod|Mobile/i.test(navigator.userAgent)) return "mobile";
    return "desktop";
  }

  function sendEvent(event, extra = {}, keepalive = false) {
    if (!analyticsConfigured) return;
    let consentChoice = null;
    try { consentChoice = localStorage.getItem(CONSENT_KEY); } catch {}
    if (consentChoice !== "yes") return;
    const page = window.ZEN_ANALYTICS_PAGE;
    if (!["/", "/play", "/download"].includes(page)) return;
    const payload = {
      session_id: getSessionId(), event, page,
      device: deviceKind(), referrer: event === "page_view" && document.referrer ? (() => { try { return new URL(document.referrer).hostname; } catch { return ""; } })() : undefined,
      ...extra,
    };
    const body = JSON.stringify(payload);
    if (keepalive && navigator.sendBeacon) {
      navigator.sendBeacon("/api/analytics/collect", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/analytics/collect", { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive }).catch(() => {});
    }
  }

  function showConsent(force = false) {
    if (!analyticsConfigured && !force) { consent.hidden = true; return; }
    let choice = null;
    try { choice = localStorage.getItem(CONSENT_KEY); } catch {}
    consent.hidden = !(force || (choice !== "yes" && choice !== "no"));
  }

  consent.addEventListener("click", (event) => {
    if (!analyticsConfigured) return;
    const button = event.target.closest("[data-choice]");
    if (!button) return;
    try { localStorage.setItem(CONSENT_KEY, button.dataset.choice === "yes" ? "yes" : "no"); } catch {}
    consent.hidden = true;
    lastEngagementAt = Date.now();
    if (button.dataset.choice === "yes") sendEvent("page_view");
  });

  function openAdmin() {
    previousFocus = document.activeElement;
    layer.hidden = false;
    document.body.style.overflow = "hidden";
    error.textContent = "";
    layer.querySelector("#zd-admin-password").focus();
  }

  function closeAdmin() {
    layer.hidden = true;
    document.body.style.overflow = "";
    if (previousFocus && previousFocus.focus) previousFocus.focus();
  }

  function formatDuration(seconds, compact = false) {
    const value = Math.max(0, Math.floor(Number(seconds) || 0));
    if (value >= 3600) return `${Math.floor(value / 3600)}h ${Math.floor(value % 3600 / 60)}m`;
    if (value >= 60) return `${Math.floor(value / 60)}m ${value % 60}s`;
    return compact ? `${value}s` : `${value} sec`;
  }

  function renderDonut(selector, record, labels, colors) {
    const container = layer.querySelector(selector);
    container.replaceChildren();
    const rows = Object.entries(labels).map(([key, label]) => ({
      key, label, value: Math.max(0, Number(record?.[key]) || 0), color: colors[key],
    })).filter((row) => row.value > 0);
    const total = rows.reduce((sum, row) => sum + row.value, 0);
    if (!total) {
      const empty = document.createElement("div");
      empty.className = "zd-chart-empty";
      empty.textContent = "No opt-in activity yet";
      container.append(empty);
      return;
    }
    const ns = "http://www.w3.org/2000/svg";
    const svg = document.createElementNS(ns, "svg");
    svg.setAttribute("class", "zd-donut");
    svg.setAttribute("viewBox", "0 0 120 120");
    svg.setAttribute("role", "img");
    svg.setAttribute("aria-label", `${total.toLocaleString()} total`);
    const track = document.createElementNS(ns, "circle");
    track.setAttribute("class", "zd-donut-track");
    track.setAttribute("cx", "60"); track.setAttribute("cy", "60"); track.setAttribute("r", "46");
    track.setAttribute("pathLength", "100");
    svg.append(track);
    let offset = 0;
    for (const row of rows) {
      const percent = row.value / total * 100;
      const slice = document.createElementNS(ns, "circle");
      slice.setAttribute("class", "zd-donut-slice");
      slice.setAttribute("cx", "60"); slice.setAttribute("cy", "60"); slice.setAttribute("r", "46");
      slice.setAttribute("pathLength", "100");
      slice.setAttribute("stroke", row.color);
      slice.setAttribute("stroke-dasharray", `${percent} ${100 - percent}`);
      slice.setAttribute("stroke-dashoffset", `${-offset}`);
      svg.append(slice);
      offset += percent;
    }
    const center = document.createElementNS(ns, "g");
    center.setAttribute("transform", "rotate(90 60 60)");
    const centerTotal = document.createElementNS(ns, "text");
    centerTotal.setAttribute("class", "zd-donut-total"); centerTotal.setAttribute("x", "60"); centerTotal.setAttribute("y", "58");
    centerTotal.textContent = total.toLocaleString();
    const centerCaption = document.createElementNS(ns, "text");
    centerCaption.setAttribute("class", "zd-donut-caption"); centerCaption.setAttribute("x", "60"); centerCaption.setAttribute("y", "69");
    centerCaption.textContent = "TOTAL";
    center.append(centerTotal, centerCaption); svg.append(center);
    const legend = document.createElement("ul");
    legend.className = "zd-chart-legend";
    for (const row of rows) {
      const item = document.createElement("li");
      const dot = document.createElement("span");
      dot.className = "zd-legend-dot"; dot.style.color = row.color; dot.style.background = row.color;
      const name = document.createElement("span"); name.textContent = row.label;
      const value = document.createElement("b"); value.textContent = `${row.value.toLocaleString()} · ${Math.round(row.value / total * 100)}%`;
      item.append(dot, name, value); legend.append(item);
    }
    container.append(svg, legend);
  }

  layer.querySelector(".zd-admin-close").addEventListener("click", closeAdmin);
  layer.addEventListener("click", (event) => { if (event.target === layer) closeAdmin(); });
  document.addEventListener("keydown", (event) => { if (event.key === "Escape" && !layer.hidden) closeAdmin(); });
  layer.querySelector("[data-show-password]").addEventListener("click", (event) => {
    const input = layer.querySelector("#zd-admin-password");
    const visible = input.type === "text";
    input.type = visible ? "password" : "text";
    event.currentTarget.textContent = visible ? "Show" : "Hide";
  });

  async function loadStats() {
    error.textContent = "Loading your dashboard…";
    try {
      const response = await fetch("/api/analytics/stats", { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not load the stats.");
      layer.querySelector('[data-stat="unique_sessions"]').textContent = Number(data.unique_sessions || 0).toLocaleString();
      layer.querySelector('[data-stat="page_views"]').textContent = Number(data.page_views || 0).toLocaleString();
      layer.querySelector('[data-stat="active_last_7d"]').textContent = Number(data.active_last_7d || 0).toLocaleString();
      const average = Number(data.average_seconds || 0);
      layer.querySelector('[data-stat="average_seconds"]').textContent = formatDuration(average, true);
      const total = Number(data.total_seconds || 0);
      layer.querySelector('[data-stat="total_seconds"]').textContent = formatDuration(total, true);
      const pageNames = { "/": "Home", "/play": "Online game", "/download": "Downloads" };
      renderDonut('[data-chart="pages"]', data.pages, pageNames, { "/": "#ff762b", "/play": "#ffd166", "/download": "#66c7ed" });
      renderDonut('[data-chart="downloads"]', data.downloads, { zip: "Game ZIP", apk: "Android APK", macos: "macOS app", windows: "Windows app", other: "Other" }, { zip: "#ff762b", apk: "#70d6a4", macos: "#66c7ed", windows: "#bc9cff", other: "#ffd166" });
      layer.querySelector("[data-updated]").textContent = `Updated ${new Date(data.generated_at || Date.now()).toLocaleString()}. Visitors are anonymous sessions, not verified individuals.`;
      error.textContent = "";
      form.hidden = true;
      loginIntro.hidden = true;
      dashboard.hidden = false;
    } catch (cause) {
      error.textContent = cause.message || "Could not load the stats.";
      if (error.textContent.includes("Sign in")) {
        form.hidden = false;
        dashboard.hidden = true;
        loginIntro.hidden = false;
      }
    }
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    error.textContent = "Signing in…";
    const password = layer.querySelector("#zd-admin-password").value;
    try {
      const response = await fetch("/api/analytics/login", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ password }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not sign in.");
      layer.querySelector("#zd-admin-password").value = "";
      await loadStats();
    } catch (cause) { error.textContent = cause.message || "Could not sign in."; }
  });

  layer.querySelector("[data-refresh]").addEventListener("click", loadStats);
  layer.querySelector("[data-logout]").addEventListener("click", async () => {
    await fetch("/api/analytics/logout", { method: "POST" }).catch(() => {});
    dashboard.hidden = true;
    form.hidden = false;
    loginIntro.hidden = false;
    error.textContent = "Signed out.";
  });

  const trigger = document.querySelector("#hero-title");
  let clicks = 0;
  let clickTimer;
  trigger?.addEventListener("click", () => {
    clicks++;
    clearTimeout(clickTimer);
    if (clicks >= 3) { clicks = 0; openAdmin(); }
    else clickTimer = setTimeout(() => { clicks = 0; }, 1600);
  });

  document.querySelectorAll("[data-analytics-preferences]").forEach((button) => button.addEventListener("click", () => showConsent(true)));
  showConsent();
  let hasConsent = false;
  try { hasConsent = localStorage.getItem(CONSENT_KEY) === "yes"; } catch {}
  if (hasConsent) {
    sendEvent("page_view");
    const flush = () => {
      if (document.visibilityState !== "visible") return;
      const now = Date.now();
      const seconds = Math.floor((now - lastEngagementAt) / 1000);
      if (seconds >= 5) {
        sendEvent("engagement", { seconds: Math.min(seconds, 60) }, true);
        lastEngagementAt = now;
      }
    };
    setInterval(flush, 15000);
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "hidden") flush();
      else lastEngagementAt = Date.now();
    });
    addEventListener("pagehide", flush);
    document.addEventListener("click", (event) => {
      const anchor = event.target.closest("a[href]");
      if (!anchor) return;
      const href = anchor.getAttribute("href") || "";
      let item = null;
      if (/\.zip(?:$|\?)/i.test(href)) item = "zip";
      else if (/\.apk(?:$|\?)/i.test(href)) item = "apk";
      else if (/\.dmg(?:$|\?)/i.test(href)) item = "macos";
      else if (/\.exe(?:$|\?)/i.test(href)) item = "windows";
      if (item) sendEvent("download_click", { item }, true);
    }, true);
  }

  const resetPreferences = document.querySelector("[data-analytics-preferences]");
  if (resetPreferences && analyticsConfigured) resetPreferences.hidden = false;
  if (!analyticsConfigured) {
    loginIntro.textContent = "This dashboard is waiting for its password and database key to be added in the website host settings.";
  }
})();
