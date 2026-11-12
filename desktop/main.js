import { app, BrowserWindow, dialog } from "electron";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

let serverInstance = null;
let mainWindow = null;

app.setName("Zen Drift Cruise");

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

  await window.loadURL(
    `http://127.0.0.1:${serverInstance.port}/play?desktop=1`
  );
}

app.whenReady().then(async () => {
  try {
    await createWindow();
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
