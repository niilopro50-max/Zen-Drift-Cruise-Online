import http from "node:http";
import { readFileSync } from "node:fs";
import { execFile } from "node:child_process";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { renderCustom, markHtml, esc, clip } from "./widgetKit.ts";

const ACCENT = "#ea580c";
const GAME_HTML = readFileSync(new URL("./game/index.html", import.meta.url), "utf8");

// State management for the local drift cruise session
let localPort = Number(process.env.PORT) || 48291;
const listenHost = process.env.PORT ? "0.0.0.0" : "127.0.0.1";
let sessionActive = false;
let sessionStartTime = 0;
let lastHeartbeat = 0;
let lastResetId = 0;
let lastTelemetry = {
  speed: 0,
  driftAngle: 0,
  duration: 0,
  distanceKm: 0,
  inMud: false,
  surface: "Wet Asphalt (Sunset Sheen)",
  roadside: "Lush Touge Pine Forest All Around Road",
};
let currentAmbiance = {
  sunsetEnabled: true,
  timeOfDay: "sunset",
  rainEnabled: true,
  weatherPreset: "Golden Sunset Rain & Wet Asphalt",
  rainDensity: 85,
  soundtrack: "Chill Lo-fi Beat Loop (48kHz)",
  roadFriction: 82,
  curvePreset: "Frequent Winding Touge (High Frequency)",
  curveMultiplier: 1.7,
  mudDrag: "Heavy Mud Resistance (-70% Speed Drag)",
  forest: "Lush Touge Pine Forest All Around Road",
  treeDensity: 90,
};



function startHttpServer() {
  const server = http.createServer((req, res) => {
    const url = new URL(req.url || "/", "http://127.0.0.1:" + localPort);

    if (req.method === "GET" && url.pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
      res.end(GAME_HTML);
      return;
    }

    if (req.method === "GET" && url.pathname === "/api/state") {
      res.writeHead(200, {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      });
      res.end(
        JSON.stringify({
          ...currentAmbiance,
          resetId: lastResetId,
        }),
      );
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/toggle-sunset") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const data = JSON.parse(body);
          if (typeof data.sunsetEnabled === "boolean") {
            currentAmbiance.sunsetEnabled = data.sunsetEnabled;
            currentAmbiance.timeOfDay = data.sunsetEnabled ? "sunset" : "night";
            if (currentAmbiance.sunsetEnabled) {
              currentAmbiance.weatherPreset = currentAmbiance.rainEnabled
                ? "Golden Sunset Rain & Wet Asphalt"
                : "Golden Sunset • Dry Asphalt";
            } else {
              currentAmbiance.weatherPreset = currentAmbiance.rainEnabled
                ? "Night Rain & Wet Asphalt"
                : "Clear Starry Night (Dry Asphalt)";
            }
          }
        } catch (_) {}
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(
          JSON.stringify({
            ok: true,
            sunsetEnabled: currentAmbiance.sunsetEnabled,
            timeOfDay: currentAmbiance.timeOfDay,
            weatherPreset: currentAmbiance.weatherPreset,
          }),
        );
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/toggle-rain") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const data = JSON.parse(body);
          if (typeof data.rainEnabled === "boolean") {
            currentAmbiance.rainEnabled = data.rainEnabled;
            currentAmbiance.roadFriction = data.rainEnabled ? 82 : 93;
            if (!data.rainEnabled) currentAmbiance.rainDensity = 0;
            else if (currentAmbiance.rainDensity === 0) currentAmbiance.rainDensity = 85;

            if (currentAmbiance.sunsetEnabled) {
              currentAmbiance.weatherPreset = data.rainEnabled
                ? "Golden Sunset Rain & Wet Asphalt"
                : "Golden Sunset • Dry Asphalt";
            } else {
              currentAmbiance.weatherPreset = data.rainEnabled
                ? "Night Rain & Wet Asphalt"
                : "Clear Starry Night (Dry Asphalt)";
            }
          }
        } catch (_) {}
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(
          JSON.stringify({
            ok: true,
            rainEnabled: currentAmbiance.rainEnabled,
            weatherPreset: currentAmbiance.weatherPreset,
          }),
        );
      });
      return;
    }

    if (req.method === "POST" && url.pathname === "/api/heartbeat") {
      let body = "";
      req.on("data", (chunk) => {
        body += chunk;
      });
      req.on("end", () => {
        try {
          const data = JSON.parse(body);
          lastHeartbeat = Date.now();
          if (data.restarted) {
            sessionStartTime = Date.now();
          }
          if (typeof data.speed === "number") lastTelemetry.speed = data.speed;
          if (typeof data.driftAngle === "number") lastTelemetry.driftAngle = data.driftAngle;
          if (typeof data.duration === "number") lastTelemetry.duration = data.duration;
          if (typeof data.distanceKm === "number") lastTelemetry.distanceKm = data.distanceKm;
          if (typeof data.inMud === "boolean") lastTelemetry.inMud = data.inMud;
          if (typeof data.sunsetEnabled === "boolean") {
            currentAmbiance.sunsetEnabled = data.sunsetEnabled;
            currentAmbiance.timeOfDay = data.sunsetEnabled ? "sunset" : "night";
          }
          if (typeof data.rainEnabled === "boolean") {
            currentAmbiance.rainEnabled = data.rainEnabled;
            currentAmbiance.roadFriction = data.rainEnabled ? 82 : 93;
          }
          if (typeof data.surface === "string") lastTelemetry.surface = data.surface;
          if (typeof data.roadside === "string") lastTelemetry.roadside = data.roadside;
        } catch (_) {}
        res.writeHead(200, {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        });
        res.end(JSON.stringify({ ok: true }));
      });
      return;
    }

    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("Not Found");
  });

  const announce = () => {
    const addr = server.address();
    if (addr && typeof addr === "object") {
      localPort = addr.port;
      console.log(`Zen Drift HTTP server listening on ${listenHost}:${localPort}`);
    }
  };

  server.on("error", (error: Error & { code?: string }) => {
    if (error.code === "EADDRINUSE") {
      console.log("Port busy. Selecting another port...");
      server.listen(0, listenHost, announce);
    } else {
      console.error("HTTP server error:", error);
    }
  });

  server.listen(localPort, listenHost, announce);
}

function formatDuration(sec: number): string {
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

const SUNSET_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 2v2M4.93 4.93l1.41 1.41M20 12h2M19.07 4.93l-1.41 1.41M2 18h20M16 18a4 4 0 0 0-8 0"/>
</svg>`;

const MOON_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
</svg>`;

const RAIN_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
  <path d="M4 14.899A7 7 0 1 1 15.71 8h1.79a4.5 4.5 0 0 1 2.5 8.242"/><path d="M16 14v6"/><path d="M8 14v6"/><path d="M12 16v6"/>
</svg>`;

const CHECK_ICON = `<svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="var(--good)" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m3 8.4 3.3 3.2L13 4.8"/></svg>`;

const REFRESH_ICON = `<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>`;

const server = new McpServer({
  name: "zen-drift",
  version: "1.0.0",
});

/* -------------------------------------------------------------------------- */
/* Tool 1: launch_cruise (act)                                                */
/* -------------------------------------------------------------------------- */
server.registerTool(
  "launch_cruise",
  {
    title: "Launch Cruise",
    description:
      "Launch the chill drift cruise game in a dedicated Mac window with live odometer distance counter in km, choice of golden sunset or clear starry night, combined with rain or dry asphalt. Features pine forests all around the road, winding curves, roadside trees, lofi music, mud slowdown drag, P-key sunset toggle, and R-key restart. Use when the user asks to drive, drift at sunset, drift in the rain, chill out in the forest, or play the drift game.",
    inputSchema: {
      sunset: z
        .boolean()
        .optional()
        .describe("Whether to cruise at golden sunset (true) or deep night (false). Defaults to true for sunset"),
      rain: z
        .boolean()
        .optional()
        .describe("Whether to have rain (true for wet rain drift, false for clear dry asphalt. Defaults to true)"),
      weather: z
        .string()
        .optional()
        .describe("Weather condition preset (e.g. 'Golden Sunset Rain', 'Golden Sunset Clear', 'Night Rain', 'Clear Starry Night')"),
      forest: z
        .string()
        .optional()
        .describe("Forest style all around the road (e.g. 'Dense Touge Pines All Around Road', 'Lush Mountain Pines')"),
      soundtrack: z
        .string()
        .optional()
        .describe("Soundtrack mode (e.g. 'Chill Lo-fi Beat Loop (48kHz)', 'Ambient Night Engine')"),
      curves: z
        .string()
        .optional()
        .describe("Road curvature preset (e.g. 'Frequent Winding Curves', 'Tight Mountain Touge')"),
      mud_effect: z
        .string()
        .optional()
        .describe("Off-road mud physics effect (e.g. 'Heavy Mud Drag (-70% Speed Drag)', 'Deep Mud Slurry')"),
    } as any,
  },
  async (args: any) => {
    let sunsetChoice = true;
    if (args?.sunset !== undefined) {
      if (typeof args.sunset === "boolean") {
        sunsetChoice = args.sunset;
      } else {
        const s = String(args.sunset).toLowerCase().trim();
        sunsetChoice = s === "true" || s === "1" || s === "yes" || s.includes("sunset") || s.includes("golden") || s.includes("dusk");
      }
    }

    let rainChoice = true;
    if (args?.rain !== undefined) {
      if (typeof args.rain === "boolean") {
        rainChoice = args.rain;
      } else {
        const s = String(args.rain).toLowerCase().trim();
        rainChoice = s === "true" || s === "1" || s === "yes" || s.includes("rain") || s === "on";
      }
    } else if (args?.weather) {
      const w = String(args.weather).toLowerCase();
      if (w.includes("clear") || w.includes("dry") || w.includes("no rain")) {
        rainChoice = false;
      }
      if (w.includes("night") || w.includes("star") || w.includes("midnight")) {
        sunsetChoice = false;
      }
    }

    let defaultPreset = "Golden Sunset Rain & Wet Asphalt";
    if (sunsetChoice && !rainChoice) defaultPreset = "Golden Sunset • Dry Asphalt";
    else if (!sunsetChoice && rainChoice) defaultPreset = "Night Rain & Wet Asphalt";
    else if (!sunsetChoice && !rainChoice) defaultPreset = "Clear Starry Night (Dry Asphalt)";

    const weather = args?.weather?.trim() || defaultPreset;
    const forest = args?.forest?.trim() || currentAmbiance.forest;
    const soundtrack = args?.soundtrack?.trim() || currentAmbiance.soundtrack;
    const curves = args?.curves?.trim() || currentAmbiance.curvePreset;
    const mudEffect = args?.mud_effect?.trim() || currentAmbiance.mudDrag;

    currentAmbiance.sunsetEnabled = sunsetChoice;
    currentAmbiance.timeOfDay = sunsetChoice ? "sunset" : "night";
    currentAmbiance.rainEnabled = rainChoice;
    currentAmbiance.rainDensity = rainChoice ? 85 : 0;
    currentAmbiance.weatherPreset = weather;
    currentAmbiance.forest = forest;
    currentAmbiance.soundtrack = soundtrack;
    currentAmbiance.curvePreset = curves;
    currentAmbiance.curveMultiplier = 1.7;
    currentAmbiance.mudDrag = mudEffect;
    currentAmbiance.roadFriction = rainChoice ? 82 : 93;

    const targetUrl = "http://127.0.0.1:" + localPort;
    await new Promise<void>((resolve, reject) => {
      execFile("/usr/bin/open", [targetUrl], (error) => {
        if (error) {
          reject(new Error(`Could not open the cruise window: ${error.message}`));
          return;
        }
        resolve();
      });
    });

    sessionActive = true;
    sessionStartTime = Date.now();
    lastHeartbeat = Date.now();
    lastTelemetry.distanceKm = 0;

    const CSS = `
    .zc-res { font: 13px/1.4 -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; padding: 12px 14px 14px; }
    .zc-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px; }
    .zc-lbl { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--ink-3); margin-bottom: 2px; }
    .zc-tit { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink-1); font-variant-numeric: tabular-nums; line-height: 1.15; }
    .zc-badge { display: inline-flex; align-items: center; gap: 6px; padding: 3px 8px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 18%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 38%, transparent); color: var(--accent); font-size: 10.5px; font-weight: 600; letter-spacing: 0.04em; }
    .zc-matrix { border-top: 1px solid var(--line); margin-top: 4px; }
    .zc-rw { display: flex; align-items: center; justify-content: space-between; height: 30px; border-bottom: 1px solid var(--line); gap: 12px; }
    .zc-rk { font-size: 12px; color: var(--ink-3); flex: none; width: 84px; }
    .zc-rv { flex: 1; min-width: 0; text-align: right; font-size: 12.5px; font-weight: 500; color: var(--ink-1); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .zc-ft { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
    .zc-keys { display: inline-flex; align-items: center; gap: 3px; }
    .zc-k { font-size: 11px; font-weight: 600; padding: 2px 5px; border-radius: 4px; background: var(--fill-1); border: 1px solid var(--line); color: var(--ink-2); font-variant-numeric: tabular-nums; }
    .zc-k.zc-sun { color: var(--accent); font-weight: 700; border-color: color-mix(in srgb, var(--accent) 45%, transparent); }
    .zc-k.zc-rain { color: #38bdf8; font-weight: 700; border-color: rgba(56,189,248,0.4); }
    .zc-k.zc-rst { color: var(--bad); font-weight: 700; border-color: color-mix(in srgb, var(--bad) 40%, transparent); }
    .zc-div { font-size: 11px; color: var(--ink-4); margin: 0 1px; }
    .zc-sub { font-size: 10.5px; color: var(--ink-4); margin-left: 2px; }
    .zc-note { font-size: 11.5px; color: var(--accent); font-weight: 500; display: inline-flex; align-items: center; gap: 5px; }
    .zc-err-note { font-size: 12px; color: var(--ink-3); }
    .zc-err-note span { color: var(--accent); font-weight: 500; }
    `;

    const skyStatusStr = sunsetChoice
      ? (rainChoice ? "Golden Sunset Rain (Wet Sheen)" : "Golden Sunset (Dry Asphalt)")
      : (rainChoice ? "Night Rain (Wet Asphalt)" : "Clear Night (Dry Road)");

    const footerContent = `<div class="zc-keys">
          <span class="zc-k">WASD</span>
          <span class="zc-sub">drive</span>
          <span class="zc-div">•</span>
          <span class="zc-k zc-sun">P</span>
          <span class="zc-sub">sunset</span>
          <span class="zc-div">•</span>
          <span class="zc-k zc-rain">T</span>
          <span class="zc-sub">rain</span>
          <span class="zc-div">•</span>
          <span class="zc-k zc-rst">R</span>
          <span class="zc-sub">restart</span>
        </div>
        <div class="zc-note">${CHECK_ICON}<span>Window active</span></div>`;

    const badgeIcon = sunsetChoice ? SUNSET_ICON : MOON_ICON;
    const badgeText = sunsetChoice
      ? (rainChoice ? "GOLDEN SUNSET • RAIN" : "GOLDEN SUNSET • DRY")
      : (rainChoice ? "NIGHT RAIN • TOUGE" : "CLEAR NIGHT • DRY");

    const body = `
    <div class="zc-res">
      <div class="zc-top">
        <div>
          <div class="zc-lbl">EXPERIENCE</div>
          <div class="zc-tit">Zen Cruise</div>
        </div>
        <div class="zc-badge">
          ${badgeIcon}
          <span>${badgeText}</span>
        </div>
      </div>
      <div class="zc-matrix">
        <div class="zc-rw">
          <span class="zc-rk">Sky & Road</span>
          <span class="zc-rv" style="color:var(--accent); font-weight:600;">${esc(skyStatusStr)}</span>
        </div>
        <div class="zc-rw">
          <span class="zc-rk">Odometer</span>
          <span class="zc-rv" style="color:var(--accent); font-weight:600;">0.00 km (Starting line)</span>
        </div>
        <div class="zc-rw">
          <span class="zc-rk">Sunset Mode</span>
          <span class="zc-rv">${sunsetChoice ? "Active (Warm Horizon)" : "Disabled (Starry Night)"}</span>
        </div>
        <div class="zc-rw">
          <span class="zc-rk">Rain Mode</span>
          <span class="zc-rv">${rainChoice ? "Active (Wet Traction)" : "Disabled (Dry Pavement)"}</span>
        </div>
        <div class="zc-rw">
          <span class="zc-rk">Forest</span>
          <span class="zc-rv">${esc(clip(forest, 32))}</span>
        </div>
        <div class="zc-rw">
          <span class="zc-rk">Road Curves</span>
          <span class="zc-rv">${esc(clip(curves, 30))}</span>
        </div>
        <div class="zc-rw">
          <span class="zc-rk">Soundtrack</span>
          <span class="zc-rv">${esc(clip(soundtrack, 32))}</span>
        </div>
      </div>
      <div class="zc-ft">
        ${footerContent}
      </div>
    </div>`;

    const card = renderCustom({
      accent: ACCENT,
      css: CSS,
      body,
      height: 305,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            status: "launched",
            sessionActive: true,
            sunsetEnabled: sunsetChoice,
            timeOfDay: sunsetChoice ? "sunset" : "night",
            rainEnabled: rainChoice,
            distanceKm: 0,
            distance: "0.00 km",
            weather,
            forest,
            soundtrack,
            curves,
            mud_effect: mudEffect,
            controls: "WASD drive / Space brake / P toggle sunset / T toggle rain / R restart",
            url: targetUrl,
            _voiceos_glance: {
              blocks: [{ type: "widget", html: card.html, height: card.height }],
            },
          }),
        },
      ],
    };
  },
);

/* -------------------------------------------------------------------------- */
/* Tool 2: get_cruise_status (read)                                           */
/* -------------------------------------------------------------------------- */
server.registerTool(
  "get_cruise_status",
  {
    title: "Cruise Status",
    description:
      "Check whether the drift cruise session is active, viewing distance traveled in kilometers (km), sunset state (golden sunset vs night), rain condition (rain vs clear dry asphalt), surface condition (asphalt vs off-road mud drag), forest density, speed, cruise duration, and lofi audio. Use when the user asks for drift status, distance in km, cruise time, sunset state, weather, surface conditions, or speed.",
    inputSchema: {} as any,
  },
  async () => {
    const isRunning =
      sessionActive &&
      (Date.now() - lastHeartbeat < 7000 || Date.now() - sessionStartTime < 15000);

    const elapsedSeconds =
      isRunning && sessionStartTime > 0
        ? Math.floor((Date.now() - sessionStartTime) / 1000)
        : 0;

    const timerStr = isRunning ? formatDuration(elapsedSeconds) : "00:00";
    const distanceStr = isRunning ? `${lastTelemetry.distanceKm.toFixed(2)} km` : "0.00 km";
    const sunsetStatus = currentAmbiance.sunsetEnabled ? "Golden Sunset Active" : "Deep Starry Night";
    const rainStatus = currentAmbiance.rainEnabled ? "Active (Wet Asphalt)" : "Disabled (Dry Asphalt)";
    const surfaceStr = isRunning
      ? (lastTelemetry.inMud
          ? "Deep Mud & Trees (-70% Drag)"
          : (currentAmbiance.rainEnabled ? "Wet Asphalt (Smooth Sheen)" : "Dry Asphalt (High Grip)"))
      : "Parked • Dry Asphalt";
    const roadsideStr = isRunning
      ? "Lush Touge Pine Forest All Around Road"
      : "Mountain Forest • Standby";
    const weatherStr = `${currentAmbiance.weatherPreset} • ${currentAmbiance.roadFriction}% grip`;
    const audioStr = `${currentAmbiance.soundtrack} • Looping`;
    const speedStr = isRunning
      ? `${lastTelemetry.speed} mph${lastTelemetry.inMud ? " (Mud drag)" : (currentAmbiance.rainEnabled ? " (Wet drift)" : " (Dry grip)")}`
      : "0 mph";

    const items = isRunning
      ? [
          {
            id: "cruise_session_1",
            distanceKm: lastTelemetry.distanceKm,
            distance: distanceStr,
            sunset: currentAmbiance.sunsetEnabled,
            rain: currentAmbiance.rainEnabled,
            timeOfDay: currentAmbiance.timeOfDay,
            surface: surfaceStr,
            roadside: roadsideStr,
            speed: lastTelemetry.speed,
            driftAngle: lastTelemetry.driftAngle,
            inMud: lastTelemetry.inMud,
          },
        ]
      : [];

    const CSS = `
    .st-card { font: 13px/1.4 -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; padding: 12px 14px 10px; }
    .st-hd { display: flex; align-items: center; gap: 10px; margin-bottom: 2px; }
    .st-timer { font-size: 24px; font-weight: 700; letter-spacing: -0.02em; font-variant-numeric: tabular-nums; color: var(--ink-1); line-height: 1; }
    .st-dist-pill { display: inline-flex; align-items: center; gap: 4px; padding: 2px 8px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 15%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 30%, transparent); font-size: 11.5px; font-weight: 700; color: var(--accent); font-variant-numeric: tabular-nums; }
    .st-pill { display: inline-flex; align-items: center; gap: 5px; padding: 2px 7px; border-radius: 999px; font-size: 11px; font-weight: 600; letter-spacing: 0.04em; text-transform: uppercase; margin-left: auto; }
    .st-pill.sunset { background: color-mix(in srgb, var(--accent) 18%, transparent); color: var(--accent); }
    .st-pill.night { background: color-mix(in srgb, #38bdf8 18%, transparent); color: #38bdf8; }
    .st-pill.mud { background: color-mix(in srgb, #f97316 20%, transparent); color: #f97316; border: 1px solid color-mix(in srgb, #f97316 40%, transparent); }
    .st-pill.parked { background: var(--fill-2); color: var(--ink-3); opacity: 0.6; }
    .st-dot { width: 6px; height: 6px; border-radius: 50%; background: var(--accent); }
    .st-dot.night-dot { background: #38bdf8; }
    .st-dot.mud-dot { background: #f97316; box-shadow: 0 0 6px #f97316; }
    .st-dot.parked-dot { background: var(--ink-4); }
    .st-sub { font-size: 11.5px; color: var(--ink-3); margin-top: 3px; margin-bottom: 4px; }
    .st-div { height: 1px; background: var(--line); margin: 6px 0 2px; }
    .st-list { display: flex; flex-direction: column; }
    .st-rw { display: flex; align-items: center; justify-content: space-between; height: 28px; gap: 8px; border-bottom: 1px solid var(--line); }
    .st-rw:last-child { border-bottom: none; }
    .st-k { font-size: 12px; color: var(--ink-3); flex: none; width: 72px; }
    .st-v { font-size: 12.5px; font-weight: 500; color: var(--ink-1); flex: 1; min-width: 0; text-align: right; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; font-variant-numeric: tabular-nums; }
    .st-v.mud-warn { color: #f97316; font-weight: 600; }
    .st-ft { display: flex; align-items: center; justify-content: space-between; padding-top: 6px; margin-top: 2px; border-top: 1px solid var(--line); font-size: 11px; color: var(--ink-4); }
    .st-key { font-weight: 700; color: var(--accent); padding: 1px 4px; border-radius: 3px; background: var(--fill-1); border: 1px solid var(--line); font-variant-numeric: tabular-nums; }
    `;

    let statePill = `<span class="st-pill parked"><span class="st-dot parked-dot"></span>PARKED</span>`;
    if (isRunning) {
      if (lastTelemetry.inMud) {
        statePill = `<span class="st-pill mud"><span class="st-dot mud-dot"></span>MUD & TREES</span>`;
      } else if (currentAmbiance.sunsetEnabled) {
        statePill = currentAmbiance.rainEnabled
          ? `<span class="st-pill sunset"><span class="st-dot"></span>SUNSET RAIN</span>`
          : `<span class="st-pill sunset"><span class="st-dot"></span>SUNSET CLEAR</span>`;
      } else {
        statePill = currentAmbiance.rainEnabled
          ? `<span class="st-pill night"><span class="st-dot night-dot"></span>NIGHT RAIN</span>`
          : `<span class="st-pill night"><span class="st-dot night-dot"></span>CLEAR NIGHT</span>`;
      }
    }

    const subtitleHtml = !isRunning
      ? `<div class="st-sub">No active drift session • Say launch cruise to drive</div>`
      : (lastTelemetry.inMud
          ? `<div class="st-sub" style="color:#f97316">Bogged in mud near roadside pines • Steer onto asphalt or press R</div>`
          : `<div class="st-sub">Cruise active • ${esc(distanceStr)} traveled • [P] sunset • [T] rain • [R] restart</div>`);

    const surfaceClass = lastTelemetry.inMud ? "st-v mud-warn" : "st-v";

    const body = `
    <div class="st-card">
      <div class="st-hd">
        ${markHtml()}
        <span class="st-timer">${timerStr}</span>
        <span class="st-dist-pill">${esc(distanceStr)}</span>
        ${statePill}
      </div>
      ${subtitleHtml}
      <div class="st-div"></div>
      <div class="st-list">
        <div class="st-rw">
          <span class="st-k">Distance</span>
          <span class="st-v" style="color:var(--accent);font-weight:600;">${esc(distanceStr)}</span>
        </div>
        <div class="st-rw">
          <span class="st-k">Horizon</span>
          <span class="st-v">${esc(clip(sunsetStatus, 30))}</span>
        </div>
        <div class="st-rw">
          <span class="st-k">Rain</span>
          <span class="st-v">${esc(clip(rainStatus, 30))}</span>
        </div>
        <div class="st-rw">
          <span class="st-k">Surface</span>
          <span class="${surfaceClass}">${esc(clip(surfaceStr, 32))}</span>
        </div>
        <div class="st-rw">
          <span class="st-k">Velocity</span>
          <span class="st-v">${esc(clip(speedStr, 30))}</span>
        </div>
        <div class="st-rw">
          <span class="st-k">Weather</span>
          <span class="st-v">${esc(clip(weatherStr, 30))}</span>
        </div>
      </div>
      <div class="st-ft">
        <span>Sunset: <span class="st-key">P</span> · Rain: <span class="st-key">T</span></span>
        <span>Quick restart: <span class="st-key">R</span></span>
      </div>
    </div>`;

    const card = renderCustom({
      accent: ACCENT,
      css: CSS,
      body,
      height: isRunning ? 275 : 250,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            running: isRunning,
            distanceKm: isRunning ? lastTelemetry.distanceKm : 0,
            distance: distanceStr,
            sunsetEnabled: currentAmbiance.sunsetEnabled,
            timeOfDay: currentAmbiance.timeOfDay,
            rainEnabled: currentAmbiance.rainEnabled,
            sessionSeconds: elapsedSeconds,
            items,
            surface: surfaceStr,
            roadside: roadsideStr,
            inMud: lastTelemetry.inMud,
            speed: isRunning ? lastTelemetry.speed : 0,
            driftAngle: isRunning ? lastTelemetry.driftAngle : 0,
            weather: weatherStr,
            audio: audioStr,
            controls: "WASD drive / Space brake / P toggle sunset / T toggle rain / R restart",
            _voiceos_glance: {
              blocks: [{ type: "widget", html: card.html, height: card.height }],
            },
          }),
        },
      ],
    };
  },
);

/* -------------------------------------------------------------------------- */
/* Tool 3: toggle_rain (act)                                                  */
/* -------------------------------------------------------------------------- */
server.registerTool(
  "toggle_rain",
  {
    title: "Toggle Rain",
    description:
      "Turn rain on or off during the drift cruise, switching between wet asphalt rain and clear dry asphalt while preserving the sunset or night horizon. Use when the user asks to turn off rain, turn on rain, stop raining, make it rain, or toggle rain at sunset or night.",
    inputSchema: {
      enable_rain: z
        .boolean()
        .optional()
        .describe("Set true for rain ON (wet asphalt), false for rain OFF (dry asphalt). If omitted, toggles state."),
      intensity: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe("Rain intensity percentage from 0 to 100 when enabling rain (default 85)"),
    } as any,
  },
  async (args: any) => {
    let newRainState: boolean;
    if (args?.enable_rain !== undefined) {
      if (typeof args.enable_rain === "boolean") {
        newRainState = args.enable_rain;
      } else {
        const s = String(args.enable_rain).toLowerCase().trim();
        newRainState = s === "true" || s === "1" || s === "yes" || s.includes("rain") || s === "on";
      }
    } else {
      newRainState = !currentAmbiance.rainEnabled;
    }

    const density =
      typeof args?.intensity === "number"
        ? Math.min(Math.max(args.intensity, 0), 100)
        : (newRainState ? 85 : 0);

    currentAmbiance.rainEnabled = newRainState;
    currentAmbiance.rainDensity = newRainState ? Math.max(density, 20) : 0;
    currentAmbiance.roadFriction = newRainState ? 82 : 93;

    if (currentAmbiance.sunsetEnabled) {
      currentAmbiance.weatherPreset = newRainState
        ? "Golden Sunset Rain & Wet Asphalt"
        : "Golden Sunset • Dry Asphalt";
    } else {
      currentAmbiance.weatherPreset = newRainState
        ? "Night Rain & Wet Asphalt"
        : "Clear Starry Night (Dry Asphalt)";
    }

    const CSS = `
    .tr-card { font: 13px/1.4 -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; padding: 12px 14px 14px; }
    .tr-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px; }
    .tr-lbl { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); margin-bottom: 2px; }
    .tr-tit { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink-1); line-height: 1.15; }
    .tr-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 18%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 38%, transparent); color: var(--accent); font-size: 10.5px; font-weight: 600; }
    .tr-box { background: var(--fill-1); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; margin: 8px 0 10px; }
    .tr-desc { font-size: 12.5px; color: var(--ink-2); line-height: 1.4; margin-bottom: 6px; }
    .tr-stats { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
    .tr-stat { display: flex; flex-direction: column; }
    .tr-sv { font-size: 15px; font-weight: 700; color: var(--ink-1); font-variant-numeric: tabular-nums; }
    .tr-sl { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-3); margin-top: 1px; }
    .tr-div { width: 1px; height: 24px; background: var(--line); }
    .tr-ft { display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--line); font-size: 11.5px; color: var(--ink-3); }
    .tr-k { font-size: 11px; font-weight: 700; padding: 2px 5px; border-radius: 4px; background: var(--fill-2); border: 1px solid var(--line); color: var(--accent); font-variant-numeric: tabular-nums; }
    `;

    const badgeIcon = newRainState ? RAIN_ICON : SUNSET_ICON;
    const badgeText = newRainState ? "RAIN ACTIVE" : "DRY ROAD";
    const modeTitle = newRainState ? "Rain Turned On" : "Rain Turned Off";
    const descText = newRainState
      ? `Rain activated on ${currentAmbiance.sunsetEnabled ? "golden sunset" : "night"} touge with wet asphalt reflections.`
      : `Rain cleared on ${currentAmbiance.sunsetEnabled ? "golden sunset" : "night"} touge with dry pavement high grip.`;

    const body = `
    <div class="tr-card">
      <div class="tr-top">
        <div>
          <div class="tr-lbl">WEATHER CONTROL</div>
          <div class="tr-tit">${modeTitle}</div>
        </div>
        <div class="tr-badge">
          ${badgeIcon}
          <span>${badgeText}</span>
        </div>
      </div>
      <div class="tr-box">
        <div class="tr-desc">${esc(descText)}</div>
        <div class="tr-stats">
          <div class="tr-stat">
            <span class="tr-sv" style="color:var(--accent);">${newRainState ? "Rain & Wet" : "Clear & Dry"}</span>
            <span class="tr-sl">Condition</span>
          </div>
          <div class="tr-div"></div>
          <div class="tr-stat">
            <span class="tr-sv">${currentAmbiance.roadFriction}% Grip</span>
            <span class="tr-sl">Traction</span>
          </div>
          <div class="tr-div"></div>
          <div class="tr-stat">
            <span class="tr-sv">${currentAmbiance.sunsetEnabled ? "Sunset" : "Night"}</span>
            <span class="tr-sl">Horizon</span>
          </div>
        </div>
      </div>
      <div class="tr-ft">
        <span>In-game quick toggle:</span>
        <span>Press <span class="tr-k">T</span> or click Rain pill</span>
      </div>
    </div>`;

    const card = renderCustom({
      accent: ACCENT,
      css: CSS,
      body,
      height: 210,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            rainEnabled: newRainState,
            sunsetEnabled: currentAmbiance.sunsetEnabled,
            weatherPreset: currentAmbiance.weatherPreset,
            rainDensity: currentAmbiance.rainDensity,
            roadFriction: currentAmbiance.roadFriction,
            surface: newRainState ? "Wet Asphalt (Smooth Sheen)" : "Dry Asphalt (High Grip)",
            shortcut: "T",
            _voiceos_glance: {
              blocks: [{ type: "widget", html: card.html, height: card.height }],
            },
          }),
        },
      ],
    };
  },
);

/* -------------------------------------------------------------------------- */
/* Tool 4: toggle_sunset (act)                                                */
/* -------------------------------------------------------------------------- */
server.registerTool(
  "toggle_sunset",
  {
    title: "Toggle Sunset",
    description:
      "Switch between a warm Golden Sunset and Deep Night ambiance, pairing seamlessly with either rain or dry roads. Use when the user asks to turn on sunset, turn off sunset, switch to sunset, switch to night, or toggle sunset time of day.",
    inputSchema: {
      enable_sunset: z
        .boolean()
        .optional()
        .describe("Set true for Golden Sunset sky, false for Deep Night. If omitted, toggles between sunset and night."),
    } as any,
  },
  async (args: any) => {
    let newSunsetState: boolean;
    if (args?.enable_sunset !== undefined) {
      if (typeof args.enable_sunset === "boolean") {
        newSunsetState = args.enable_sunset;
      } else {
        const s = String(args.enable_sunset).toLowerCase().trim();
        newSunsetState = s === "true" || s === "1" || s === "yes" || s.includes("sunset") || s.includes("golden") || s.includes("dusk");
      }
    } else {
      newSunsetState = !currentAmbiance.sunsetEnabled;
    }

    currentAmbiance.sunsetEnabled = newSunsetState;
    currentAmbiance.timeOfDay = newSunsetState ? "sunset" : "night";

    if (newSunsetState) {
      currentAmbiance.weatherPreset = currentAmbiance.rainEnabled
        ? "Golden Sunset Rain & Wet Asphalt"
        : "Golden Sunset • Dry Asphalt";
    } else {
      currentAmbiance.weatherPreset = currentAmbiance.rainEnabled
        ? "Night Rain & Wet Asphalt"
        : "Clear Starry Night (Dry Asphalt)";
    }

    const CSS = `
    .ts-card { font: 13px/1.4 -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; padding: 12px 14px 14px; }
    .ts-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px; }
    .ts-lbl { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); margin-bottom: 2px; }
    .ts-tit { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink-1); line-height: 1.15; }
    .ts-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 18%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 38%, transparent); color: var(--accent); font-size: 10.5px; font-weight: 600; }
    .ts-box { background: var(--fill-1); border: 1px solid var(--line); border-radius: 8px; padding: 10px 12px; margin: 8px 0 10px; }
    .ts-desc { font-size: 12.5px; color: var(--ink-2); line-height: 1.4; margin-bottom: 6px; }
    .ts-stats { display: flex; align-items: center; justify-content: space-between; margin-top: 4px; }
    .ts-stat { display: flex; flex-direction: column; }
    .ts-sv { font-size: 15px; font-weight: 700; color: var(--ink-1); font-variant-numeric: tabular-nums; }
    .ts-sl { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-3); margin-top: 1px; }
    .ts-div { width: 1px; height: 24px; background: var(--line); }
    .ts-ft { display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--line); font-size: 11.5px; color: var(--ink-3); }
    .ts-k { font-size: 11px; font-weight: 700; padding: 2px 5px; border-radius: 4px; background: var(--fill-2); border: 1px solid var(--line); color: var(--accent); font-variant-numeric: tabular-nums; }
    `;

    const badgeIcon = newSunsetState ? SUNSET_ICON : MOON_ICON;
    const badgeText = newSunsetState ? "GOLDEN SUNSET" : "DEEP NIGHT";
    const modeTitle = newSunsetState ? "Golden Sunset Active" : "Night Sky Active";
    const descText = newSunsetState
      ? (currentAmbiance.rainEnabled
          ? "Warm golden hour sunset skies with illuminated rain streaks and glowing wet asphalt."
          : "Golden sunset skies casting warm horizon light across dry asphalt and mountain pines.")
      : (currentAmbiance.rainEnabled
          ? "Deep midnight sky with slick wet asphalt reflections under car headlights."
          : "Cool dark starry night sky with crisp dry road grip.");

    const body = `
    <div class="ts-card">
      <div class="ts-top">
        <div>
          <div class="ts-lbl">TIME OF DAY</div>
          <div class="ts-tit">${modeTitle}</div>
        </div>
        <div class="ts-badge">
          ${badgeIcon}
          <span>${badgeText}</span>
        </div>
      </div>
      <div class="ts-box">
        <div class="ts-desc">${esc(descText)}</div>
        <div class="ts-stats">
          <div class="ts-stat">
            <span class="ts-sv" style="color:var(--accent);">${newSunsetState ? "Sunset" : "Night"}</span>
            <span class="ts-sl">Horizon</span>
          </div>
          <div class="ts-div"></div>
          <div class="ts-stat">
            <span class="ts-sv">${currentAmbiance.rainEnabled ? "Rain ON" : "Dry / Clear"}</span>
            <span class="ts-sl">Rain State</span>
          </div>
          <div class="ts-div"></div>
          <div class="ts-stat">
            <span class="ts-sv">${currentAmbiance.roadFriction}%</span>
            <span class="ts-sl">Traction</span>
          </div>
        </div>
      </div>
      <div class="ts-ft">
        <span>In-game quick toggle:</span>
        <span>Press <span class="ts-k">P</span> or click Sunset pill</span>
      </div>
    </div>`;

    const card = renderCustom({
      accent: ACCENT,
      css: CSS,
      body,
      height: 210,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            sunsetEnabled: newSunsetState,
            timeOfDay: newSunsetState ? "sunset" : "night",
            rainEnabled: currentAmbiance.rainEnabled,
            weatherPreset: currentAmbiance.weatherPreset,
            roadFriction: currentAmbiance.roadFriction,
            shortcut: "P",
            _voiceos_glance: {
              blocks: [{ type: "widget", html: card.html, height: card.height }],
            },
          }),
        },
      ],
    };
  },
);

/* -------------------------------------------------------------------------- */
/* Tool 5: set_ambiance (act)                                                 */
/* -------------------------------------------------------------------------- */
server.registerTool(
  "set_ambiance",
  {
    title: "Set Ambiance",
    description:
      "Adjust sunset state, rain state, rain intensity, road wetness reflections, curve frequency, forest style, mud drag, and lofi soundtrack during the drift cruise. Use when the user wants to set sunset, rain, weather preset, or music.",
    inputSchema: {
      sunset: z
        .boolean()
        .optional()
        .describe("Choose time of day: true for golden sunset, false for deep night"),
      rain: z
        .boolean()
        .optional()
        .describe("Choose whether rain is active: true for wet asphalt rain, false for clear dry road"),
      weather_preset: z
        .string()
        .optional()
        .describe("Proposed weather ambiance preset (e.g. 'Golden Sunset Rain & Wet Asphalt', 'Golden Sunset • Dry Asphalt', 'Night Rain', 'Clear Starry Night')"),
      rain_density: z
        .number()
        .min(0)
        .max(100)
        .optional()
        .describe("Rain density percentage from 0 to 100 (0 turns rain off)"),
      forest_style: z
        .string()
        .optional()
        .describe("Forest style all around the road (e.g. 'Dense Touge Pines All Around Road', 'Lush Mountain Pines')"),
      soundtrack: z
        .string()
        .optional()
        .describe("Soundtrack or audio ambiance mode"),
      curve_style: z
        .string()
        .optional()
        .describe("Curve frequency style (e.g. 'Frequent Winding Curves', 'Tight Mountain Touge', 'Gentle Sweeps')"),
      mud_drag: z
        .string()
        .optional()
        .describe("Off-road mud resistance style (e.g. 'Heavy Mud Drag (-70% Speed Drag)', 'Deep Mud Slurry')"),
    } as any,
  },
  async (args: any) => {
    const prevPreset = currentAmbiance.weatherPreset;

    let sunsetChoice = currentAmbiance.sunsetEnabled;
    if (args?.sunset !== undefined) {
      if (typeof args.sunset === "boolean") sunsetChoice = args.sunset;
      else {
        const s = String(args.sunset).toLowerCase().trim();
        sunsetChoice = s === "true" || s === "1" || s === "yes" || s.includes("sunset") || s.includes("golden");
      }
    }

    let rainChoice = currentAmbiance.rainEnabled;
    if (args?.rain !== undefined) {
      if (typeof args.rain === "boolean") {
        rainChoice = args.rain;
      } else {
        const s = String(args.rain).toLowerCase().trim();
        rainChoice = s === "true" || s === "1" || s === "yes" || s.includes("rain") || s === "on";
      }
    } else if (typeof args?.rain_density === "number") {
      rainChoice = args.rain_density > 0;
    }

    const newDensity =
      typeof args?.rain_density === "number"
        ? Math.min(Math.max(args.rain_density, 0), 100)
        : (rainChoice ? (currentAmbiance.rainDensity || 85) : 0);

    let defaultPreset = "Golden Sunset Rain & Wet Asphalt";
    if (sunsetChoice && !rainChoice) defaultPreset = "Golden Sunset • Dry Asphalt";
    else if (!sunsetChoice && rainChoice) defaultPreset = "Night Rain & Wet Asphalt";
    else if (!sunsetChoice && !rainChoice) defaultPreset = "Clear Starry Night (Dry Asphalt)";

    const newPreset = args?.weather_preset?.trim() || defaultPreset;
    const newForest = args?.forest_style?.trim() || currentAmbiance.forest;
    const newSoundtrack = args?.soundtrack?.trim() || currentAmbiance.soundtrack;
    const newCurves = args?.curve_style?.trim() || currentAmbiance.curvePreset;
    const newMud = args?.mud_drag?.trim() || currentAmbiance.mudDrag;

    currentAmbiance.sunsetEnabled = sunsetChoice;
    currentAmbiance.timeOfDay = sunsetChoice ? "sunset" : "night";
    currentAmbiance.rainEnabled = rainChoice;
    currentAmbiance.rainDensity = rainChoice ? Math.max(newDensity, 20) : 0;
    currentAmbiance.weatherPreset = newPreset;
    currentAmbiance.forest = newForest;
    currentAmbiance.soundtrack = newSoundtrack;
    currentAmbiance.curvePreset = newCurves;
    currentAmbiance.mudDrag = newMud;
    currentAmbiance.roadFriction = rainChoice
      ? Math.max(50, Math.round(100 - currentAmbiance.rainDensity * 0.22))
      : 93;

    if (newCurves.toLowerCase().includes("gentle") || newCurves.toLowerCase().includes("straight")) {
      currentAmbiance.curveMultiplier = 0.9;
    } else {
      currentAmbiance.curveMultiplier = 1.7;
    }

    const CSS = `
    .amb-card { font: 13px/1.4 -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; padding: 12px 14px 14px; }
    .amb-lbl { font-size: 11px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); margin-bottom: 8px; }
    .amb-box { display: flex; align-items: center; gap: 8px; background: var(--fill-1); padding: 8px 10px; border-radius: 6px; border: 1px solid var(--line); margin-bottom: 10px; }
    .amb-from { flex: 1; min-width: 0; font-size: 12.5px; color: var(--ink-3); overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .amb-arr { color: var(--ink-4); font-size: 13px; flex: none; }
    .amb-to { flex: 1; min-width: 0; font-size: 12.5px; color: var(--ink-1); font-weight: 600; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .amb-slider-row { margin-bottom: 8px; }
    .amb-sl-hd { display: flex; justify-content: space-between; align-items: center; font-size: 11px; color: var(--ink-3); margin-bottom: 5px; }
    .amb-sl-val { font-size: 12px; font-weight: 600; color: var(--accent); font-variant-numeric: tabular-nums; }
    .amb-track { height: 4px; background: var(--track); border-radius: 2px; overflow: hidden; }
    .amb-fill { height: 100%; background: var(--accent); border-radius: 2px; }
    .amb-ft { display: flex; align-items: center; justify-content: space-between; margin-top: 10px; }
    .amb-meta { font-size: 12px; color: var(--ink-3); display: flex; align-items: center; gap: 8px; }
    .amb-pill { font-size: 10.5px; font-weight: 600; padding: 2px 7px; border-radius: 999px; background: var(--fill-2); color: var(--ink-2); font-variant-numeric: tabular-nums; }
    .amb-tree-badge { font-size: 11px; color: var(--good); font-weight: 500; }
    .amb-sun-badge { font-size: 11px; color: var(--accent); font-weight: 600; }
    `;

    const body = `
    <div class="amb-card">
      <div class="amb-lbl">AMBIANCE UPDATED</div>
      <div class="amb-box">
        <div class="amb-from">${esc(clip(prevPreset, 24))}</div>
        <span class="amb-arr">→</span>
        <div class="amb-to">${esc(clip(newPreset, 24))}</div>
      </div>
      <div class="amb-slider-row">
        <div class="amb-sl-hd">
          <span>${rainChoice ? "Rain Density" : "Weather State"}</span>
          <span class="amb-sl-val">${rainChoice ? `${currentAmbiance.rainDensity}%` : "Clear / Dry"}</span>
        </div>
        <div class="amb-track">
          <div class="amb-fill" style="width:${rainChoice ? currentAmbiance.rainDensity : 0}%;"></div>
        </div>
      </div>
      <div class="amb-ft">
        <div class="amb-meta">
          <span class="amb-pill">${currentAmbiance.roadFriction}% grip</span>
          <span class="amb-sun-badge">${sunsetChoice ? "Sunset Active" : "Night Active"}</span>
          <span class="amb-tree-badge">Forest All Around</span>
        </div>
      </div>
    </div>`;

    const card = renderCustom({
      accent: ACCENT,
      css: CSS,
      body,
      height: 220,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            updated: true,
            previousPreset: prevPreset,
            sunsetEnabled: currentAmbiance.sunsetEnabled,
            timeOfDay: currentAmbiance.timeOfDay,
            rainEnabled: currentAmbiance.rainEnabled,
            weatherPreset: newPreset,
            rainDensity: currentAmbiance.rainDensity,
            forest: newForest,
            soundtrack: newSoundtrack,
            curvePreset: newCurves,
            mudDrag: newMud,
            roadFriction: currentAmbiance.roadFriction,
            _voiceos_glance: {
              blocks: [{ type: "widget", html: card.html, height: card.height }],
            },
          }),
        },
      ],
    };
  },
);

/* -------------------------------------------------------------------------- */
/* Tool 6: restart_cruise (act)                                               */
/* -------------------------------------------------------------------------- */
server.registerTool(
  "restart_cruise",
  {
    title: "Restart Cruise",
    description:
      "Respawn the drift car at the starting line, reset speed to zero, reset distance counter to 0.00 km, clear skid and mud tracks, and restart the cruise timer in the pine forest. Use when the user asks to restart the car, reset distance, reset the cruise, start over, or respawn with 'R'.",
    inputSchema: {
      reason: z
        .string()
        .optional()
        .describe("Optional note or reason for restarting (e.g. 'Stuck in deep mud', 'Fresh sunset run')"),
    } as any,
  },
  async (args: any) => {
    const reason = args?.reason?.trim() || "Fresh Touge Run";

    lastResetId = Date.now();
    sessionStartTime = Date.now();
    lastHeartbeat = Date.now();
    lastTelemetry = {
      speed: 0,
      driftAngle: 0,
      duration: 0,
      distanceKm: 0,
      inMud: false,
      surface: currentAmbiance.rainEnabled ? "Wet Asphalt (Sunset Sheen)" : "Dry Asphalt (High Grip)",
      roadside: "Lush Touge Pine Forest All Around Road",
    };

    const CSS = `
    .rc-card { font: 13px/1.4 -apple-system, BlinkMacSystemFont, "SF Pro Text", sans-serif; padding: 12px 14px 14px; }
    .rc-top { display: flex; align-items: flex-start; justify-content: space-between; margin-bottom: 8px; }
    .rc-lbl { font-size: 10px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: var(--accent); margin-bottom: 2px; }
    .rc-tit { font-size: 22px; font-weight: 700; letter-spacing: -0.02em; color: var(--ink-1); line-height: 1.15; }
    .rc-badge { display: inline-flex; align-items: center; gap: 5px; padding: 3px 8px; border-radius: 999px; background: color-mix(in srgb, var(--accent) 18%, transparent); border: 1px solid color-mix(in srgb, var(--accent) 38%, transparent); color: var(--accent); font-size: 10.5px; font-weight: 600; }
    .rc-box { background: var(--fill-1); border: 1px solid var(--line); border-radius: 8px; padding: 9px 12px; margin: 8px 0 10px; }
    .rc-stats { display: flex; align-items: center; justify-content: space-between; }
    .rc-stat { display: flex; flex-direction: column; }
    .rc-sv { font-size: 15px; font-weight: 700; color: var(--ink-1); font-variant-numeric: tabular-nums; }
    .rc-sl { font-size: 10px; text-transform: uppercase; letter-spacing: 0.06em; color: var(--ink-3); margin-top: 1px; }
    .rc-div { width: 1px; height: 26px; background: var(--line); }
    .rc-msg { font-size: 12px; color: var(--ink-2); line-height: 1.4; margin-bottom: 8px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .rc-ft { display: flex; align-items: center; justify-content: space-between; padding-top: 8px; border-top: 1px solid var(--line); font-size: 11.5px; color: var(--ink-3); }
    .rc-k { font-size: 11px; font-weight: 700; padding: 2px 5px; border-radius: 4px; background: var(--fill-2); border: 1px solid var(--line); color: var(--accent); font-variant-numeric: tabular-nums; }
    `;

    const body = `
    <div class="rc-card">
      <div class="rc-top">
        <div>
          <div class="rc-lbl">SESSION RESET</div>
          <div class="rc-tit">Cruise Restarted</div>
        </div>
        <div class="rc-badge">
          ${REFRESH_ICON}
          <span>STARTING LINE</span>
        </div>
      </div>
      <div class="rc-box">
        <div class="rc-stats">
          <div class="rc-stat">
            <span class="rc-sv">00:00</span>
            <span class="rc-sl">Timer</span>
          </div>
          <div class="rc-div"></div>
          <div class="rc-stat">
            <span class="rc-sv" style="color:var(--accent);">0.00 km</span>
            <span class="rc-sl">Odometer</span>
          </div>
          <div class="rc-div"></div>
          <div class="rc-stat">
            <span class="rc-sv">${currentAmbiance.sunsetEnabled ? "Sunset" : "Night"}</span>
            <span class="rc-sl">Horizon</span>
          </div>
          <div class="rc-div"></div>
          <div class="rc-stat">
            <span class="rc-sv">0 mph</span>
            <span class="rc-sl">Speed</span>
          </div>
        </div>
      </div>
      <div class="rc-msg">${esc(clip(reason, 55))} • Odometer reset to 0.00 km, car respawned at starting line.</div>
      <div class="rc-ft">
        <span>Quick restart in game window:</span>
        <span>Press <span class="rc-k">R</span> anytime</span>
      </div>
    </div>`;

    const card = renderCustom({
      accent: ACCENT,
      css: CSS,
      body,
      height: 205,
    });

    return {
      content: [
        {
          type: "text" as const,
          text: JSON.stringify({
            status: "restarted",
            reason,
            position: "track_start_centerline",
            speed: 0,
            distanceKm: 0,
            distance: "0.00 km",
            sunsetEnabled: currentAmbiance.sunsetEnabled,
            rainEnabled: currentAmbiance.rainEnabled,
            surface: currentAmbiance.rainEnabled ? "Wet Asphalt (Sunset Sheen)" : "Dry Asphalt (High Grip)",
            timer: "00:00",
            shortcut: "R",
            _voiceos_glance: {
              blocks: [{ type: "widget", html: card.html, height: card.height }],
            },
          }),
        },
      ],
    };
  },
);

startHttpServer();

await server.connect(new StdioServerTransport());
