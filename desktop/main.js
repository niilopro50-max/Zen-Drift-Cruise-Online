import { app, BrowserWindow, dialog, shell } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createWriteStream } from "node:fs";
import { unlink } from "node:fs/promises";
import { createHash } from "node:crypto";
import { Readable, Transform } from "node:stream";
import { pipeline } from "node:stream/promises";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ONLINE_GAME_URL = "https://zen-drift-cruise-online.onrender.com/play?desktop=1";

const GITHUB_RELEASES_API = "https" + String.fromCharCode(58,47,47) + "api.github.com/repos/niilopro50-max/Zen-Drift-Cruise-Online/releases/latest";
let serverInstance = null;
let mainWindow = null;

app.setName("Zen Drift Cruise");

function parseVersion(version) {
  const match = String(version)
    .replace(/^v/i, "")
    .match(/^(\d+)\.(\d+)\.(\d+)/);

  return match ? match.slice(1).map(Number) : null;
}

function isNewerVersion(latest, current) {
  const a = parseVersion(latest);
  const b = parseVersion(current);

  if (!a || !b) return false;

  for (let i = 0; i < 3; i++) {
    if (a[i] > b[i]) return true;
    if (a[i] < b[i]) return false;
  }

  return false;
}

async function downloadUpdate(asset) {
  const result = await dialog.showSaveDialog(mainWindow, {
    title: "Download Zen Drift Cruise update",
    defaultPath: path.join(app.getPath("downloads"), asset.name),
    buttonLabel: "Save update",
    filters: [{ name: "macOS Disk Image", extensions: ["dmg"] }]
  });

  if (result.canceled || !result.filePath) return;

  let filePath = result.filePath;

  if (!filePath.toLowerCase().endsWith(".dmg")) {
    filePath += ".dmg";
  }

  try {
    const response = await fetch(asset.browser_download_url, {
      headers: { "User-Agent": "Zen-Drift-Cruise" },
      signal: AbortSignal.timeout(180000)
    });

    if (!response.ok || !response.body) {
      throw new Error(`Download failed: HTTP ${response.status}`);
    }

    const hash = createHash("sha256");

    const hashTransform = new Transform({
      transform(chunk, encoding, callback) {
        hash.update(chunk);
        callback(null, chunk);
      }
    });

    await pipeline(
      Readable.fromWeb(response.body),
      hashTransform,
      createWriteStream(filePath)
    );

    const actualHash = hash.digest("hex");
    const expectedHash = asset.digest?.replace(/^sha256:/, "");

    if (!expectedHash || actualHash !== expectedHash) {
      await unlink(filePath).catch(() => {});
      throw new Error("The downloaded file failed its SHA-256 verification.");
    }

    const finished = await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Download complete",
      message: "Zen Drift Cruise update downloaded and verified.",
      detail:
        "Close the game, open the downloaded DMG, and drag Zen Drift Cruise into Applications to replace the previous version.",
      buttons: ["Show in Finder", "Close"],
      defaultId: 0
    });

    if (finished.response === 0) {
      shell.showItemInFolder(filePath);
    }
  } catch (error) {
    console.error("Update download failed:", error);

    await dialog.showMessageBox(mainWindow, {
      type: "error",
      title: "Update download failed",
      message: "The update could not be downloaded.",
      detail: String(error?.message || error)
    });
  }
}

async function checkForUpdates() {
  if (!app.isPackaged) return;

  // This DMG updater is specifically for Apple Silicon Macs.
  if (process.platform !== "darwin" || process.arch !== "arm64") return;

  try {
    const response = await fetch(GITHUB_RELEASES_API, {
      headers: {
        Accept: "application/vnd.github+json",
        "User-Agent": "Zen-Drift-Cruise"
      },
      signal: AbortSignal.timeout(15000)
    });

    if (!response.ok) {
      throw new Error(`GitHub responded with HTTP ${response.status}`);
    }

    const release = await response.json();

    if (!release.tag_name) return;

    const currentVersion = app.getVersion();

    if (!isNewerVersion(release.tag_name, currentVersion)) return;

    const asset = release.assets?.find(item =>
      item.name.toLowerCase().endsWith("-arm64.dmg") &&
      item.browser_download_url &&
      item.digest?.startsWith("sha256:")
    );

    if (!asset) {
      console.warn("No verified Apple Silicon DMG found in the latest release.");
      return;
    }

    const result = await dialog.showMessageBox(mainWindow, {
      type: "info",
      title: "Update available",
      message: "A new version of Zen Drift Cruise is available.",
      detail:
        `Installed version: ${currentVersion}\n` +
        `New version: ${release.tag_name}\n\n` +
        "Would you like to download the update?",
      buttons: ["Download update", "Later"],
      defaultId: 0,
      cancelId: 1
    });

    if (result.response === 0) {
      await downloadUpdate(asset);
    }
  } catch (error) {
    console.warn("Could not check for updates:", error);
  }
}

async function createWindow() {
  if (!serverInstance) {
    process.env.ZEN_DESKTOP_MODE = "1";

    const { startHttpServer } = await import("../desktop-server.mjs");
    serverInstance = await startHttpServer();
  }

  const window = new BrowserWindow({
    width: 1440,
    height: 900,
    minWidth: 900,
    minHeight: 600,
    show: false,
    backgroundColor: "#090909",
    title: "Zen Drift Cruise",
    autoHideMenuBar: true,
    icon: path.join(__dirname, "../icons/icon-512.png"),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true
    }
  });

  mainWindow = window;

  window.once("ready-to-show", () => window.show());

  window.on("closed", () => {
    if (mainWindow === window) mainWindow = null;
  });

  try {
    await window.loadURL(ONLINE_GAME_URL);
  } catch (error) {
    console.warn("Online game unavailable; opening the bundled copy:", error);
    await window.loadURL(`http://127.0.0.1:${serverInstance.port}/play?desktop=1`);
  }
}

app.whenReady().then(async () => {
  try {
    await createWindow();
    checkForUpdates();
  } catch (error) {
    dialog.showErrorBox(
      "Zen Drift Cruise",
      `The game could not start:\n${error?.stack || error}`
    );

    app.quit();
  }
});

app.on("activate", () => {
  if (!mainWindow) {
    createWindow().catch(error => {
      dialog.showErrorBox("Zen Drift Cruise", String(error));
    });
  }
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
  if (serverInstance?.server.listening) {
    serverInstance.server.close();
  }
});
