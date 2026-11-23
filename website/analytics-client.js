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
    #zd-admin-layer{position:fixed;z-index:1100;inset:0;display:grid;place-items:center;padding:18px;background:rgba(0,0,0,.78);backdrop-filter:blur(12px)}
    .zd-admin-card{position:relative;width:min(760px,100%);max-height:min(88vh,900px);overflow:auto;padding:clamp(24px,5vw,42px);background:linear-gradient(145deg,#181a1c,#0d0f10);border:1px solid rgba(255,118,43,.58);box-shadow:0 30px 100px #000b}
    .zd-admin-close{position:absolute;top:14px;right:16px;width:42px;height:42px;border:1px solid #ffffff30;background:#ffffff08;color:white;font-size:23px;cursor:pointer}
    .zd-admin-eyebrow{margin:0 0 9px!important;color:#ff9a62!important;font-size:11px!important;font-weight:900;letter-spacing:.22em;text-transform:uppercase}
    .zd-admin-card h2{margin:0 52px 10px 0;font-size:clamp(28px,6vw,42px);line-height:1;letter-spacing:-.06em;text-transform:uppercase}
    .zd-admin-form{display:grid;gap:13px;max-width:440px;margin-top:24px}
    .zd-admin-form label{display:grid;gap:8px;color:#d9d4cc;font-size:13px;font-weight:750}
    .zd-admin-form input{width:100%;min-height:48px;padding:0 13px;border:1px solid #ffffff35;background:#080a0b;color:#fff;font:inherit;font-size:16px}
    .zd-password-row{display:flex;gap:8px}.zd-password-row input{flex:1;min-width:0}.zd-password-row button{padding:0 12px;border:1px solid #ffffff35;background:#ffffff08;color:#fff;cursor:pointer}
    .zd-admin-error{min-height:22px;color:#ffb49b!important}
    .zd-admin-stats{display:grid;grid-template-columns:repeat(auto-fit,minmax(140px,1fr));gap:10px;margin:24px 0}
    .zd-stat{padding:15px;border:1px solid #ffffff18;background:#ffffff06}.zd-stat span{display:block;color:#c5c0b8;font-size:12px}.zd-stat strong{display:block;margin-top:7px;font-size:clamp(21px,4vw,32px);letter-spacing:-.04em}
    .zd-admin-columns{display:grid;grid-template-columns:1fr 1fr;gap:12px}.zd-admin-section{padding:17px;border:1px solid #ffffff18;background:#ffffff05}.zd-admin-section h3{margin:0 0 12px;font-size:14px;letter-spacing:.09em;text-transform:uppercase}.zd-admin-list{display:grid;gap:10px;margin:0;padding:0;list-style:none}.zd-admin-list li{display:flex;justify-content:space-between;gap:12px;color:#d9d4cc;font-size:14px}.zd-admin-list b{color:#ffb487}.zd-admin-foot{display:flex;align-items:center;justify-content:space-between;gap:14px;margin-top:20px}
    @media(max-width:620px){#zd-analytics-consent{left:12px;bottom:12px;width:calc(100vw - 24px)}.zd-admin-stats{grid-template-columns:repeat(2,minmax(0,1fr))}.zd-admin-columns{grid-template-columns:1fr}.zd-admin-card{padding:25px 19px}}
  `;
  const style = document.createElement("style");
  style.textContent = STYLE;
  document.head.append(style);

  const CONSENT_KEY = "zen-drift-analytics-choice";
  const ID_KEY = "zen-drift-analytics-session";
  const consent = document.createElement("aside");
  consent.id = "zd-analytics-consent";
  consent.setAttribute("aria-label", "Analytics preferences");
  consent.hidden = true;
  consent.innerHTML = `<strong>Help improve Zen Drift Cruise</strong><p>With your permission, we count anonymous page visits, active time and download link clicks. We do not collect names, email addresses or IP addresses. Read the <a href="/privacy">privacy policy</a>.</p><div class="zd-consent-actions"><button type="button" data-choice="yes">Allow stats</button><button type="button" data-choice="no">No thanks</button></div>`;
  document.body.append(consent);

  const layer = document.createElement("div");
  layer.id = "zd-admin-layer";
  layer.hidden = true;
  layer.innerHTML = `<section class="zd-admin-card" role="dialog" aria-modal="true" aria-labelledby="zd-admin-title"><button class="zd-admin-close" type="button" aria-label="Close">×</button><p class="zd-admin-eyebrow">Zen Drift Cruise · Private area</p><h2 id="zd-admin-title">Website insights</h2><p class="zd-admin-intro">Sign in to see anonymous activity from visitors who allowed statistics.</p><form class="zd-admin-form"><label for="zd-admin-password">Owner password</label><div class="zd-password-row"><input id="zd-admin-password" type="password" autocomplete="current-password" required maxlength="256"><button type="button" data-show-password>Show</button></div><button class="zd-admin-button" type="submit">Open dashboard</button><p class="zd-admin-error" role="status" aria-live="polite"></p></form><div class="zd-admin-dashboard" hidden><div class="zd-admin-stats"><div class="zd-stat"><span>Visitor sessions</span><strong data-stat="unique_sessions">—</strong></div><div class="zd-stat"><span>Page views</span><strong data-stat="page_views">—</strong></div><div class="zd-stat"><span>Active in 7 days</span><strong data-stat="active_last_7d">—</strong></div><div class="zd-stat"><span>Average active time</span><strong data-stat="average_seconds">—</strong></div><div class="zd-stat"><span>Total active time</span><strong data-stat="total_seconds">—</strong></div></div><div class="zd-admin-columns"><section class="zd-admin-section"><h3>Pages viewed</h3><ul class="zd-admin-list" data-list="pages"></ul></section><section class="zd-admin-section"><h3>Download link clicks</h3><ul class="zd-admin-list" data-list="downloads"></ul></section></div><div class="zd-admin-foot"><p data-updated>Stats reflect visitors who opted in.</p><button class="zd-admin-button" type="button" data-refresh>Refresh</button><button class="zd-admin-button" type="button" data-logout>Sign out</button></div></div></section>`;
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
    let choice = null;
    try { choice = localStorage.getItem(CONSENT_KEY); } catch {}
    consent.hidden = !(force || (choice !== "yes" && choice !== "no"));
  }

  consent.addEventListener("click", (event) => {
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
      layer.querySelector('[data-stat="average_seconds"]').textContent = average >= 60 ? `${Math.floor(average / 60)}m ${average % 60}s` : `${average}s`;
      const total = Number(data.total_seconds || 0);
      layer.querySelector('[data-stat="total_seconds"]').textContent = total >= 3600 ? `${Math.floor(total / 3600)}h ${Math.floor(total % 3600 / 60)}m` : total >= 60 ? `${Math.floor(total / 60)}m ${total % 60}s` : `${total}s`;
      const pageNames = { "/": "Home", "/play": "Online game", "/download": "Downloads" };
      const fillList = (selector, record, labels) => {
        const list = layer.querySelector(selector);
        list.replaceChildren();
        const entries = Object.entries(record || {}).sort((a, b) => Number(b[1]) - Number(a[1]));
        if (!entries.length) entries.push(["No data yet", 0]);
        for (const [key, value] of entries) {
          const row = document.createElement("li");
          const label = document.createElement("span");
          const count = document.createElement("b");
          label.textContent = labels[key] || key;
          count.textContent = Number(value || 0).toLocaleString();
          row.append(label, count);
          list.append(row);
        }
      };
      fillList('[data-list="pages"]', data.pages, pageNames);
      fillList('[data-list="downloads"]', data.downloads, { zip: "Game ZIP", apk: "Android APK", macos: "macOS app", windows: "Windows app", other: "Other" });
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
  if (resetPreferences) resetPreferences.hidden = false;
})();
