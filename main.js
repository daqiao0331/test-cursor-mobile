// Serene · 静观 —— Electron 主进程
// 负责：全屏窗口、扫描 exe 旁的 videos/ 目录、系统文件选择对话框

const { app, BrowserWindow, ipcMain, dialog, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const { pathToFileURL } = require("url");

const VIDEO_EXTS = new Set([".mp4", ".webm", ".mov", ".mkv", ".m4v", ".avi", ".ogv"]);

// 打包后以 exe 所在目录为根（便携模式：videos/ 放 exe 旁边即可）
function appDir() {
  return app.isPackaged ? path.dirname(process.execPath) : __dirname;
}

function scanVideosFolder() {
  const dir = path.join(appDir(), "videos");
  let files;
  try {
    files = fs.readdirSync(dir);
  } catch {
    return { dir, items: [] };
  }
  const items = files
    .filter((f) => VIDEO_EXTS.has(path.extname(f).toLowerCase()))
    .sort((a, b) => a.localeCompare(b, "zh"))
    .map((f) => ({
      name: path.parse(f).name,
      url: pathToFileURL(path.join(dir, f)).href,
      source: "folder",
    }));
  return { dir, items };
}

function createWindow() {
  const win = new BrowserWindow({
    fullscreen: true,
    autoHideMenuBar: true,
    backgroundColor: "#06090c",
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });
  win.loadFile(path.join(__dirname, "renderer", "index.html"));
  return win;
}

app.whenReady().then(() => {
  const win = createWindow();

  ipcMain.handle("scan-videos", () => scanVideosFolder());

  ipcMain.handle("pick-videos", async () => {
    const r = await dialog.showOpenDialog(win, {
      title: "选择风景视频",
      properties: ["openFile", "multiSelections"],
      filters: [
        { name: "视频文件", extensions: ["mp4", "webm", "mov", "mkv", "m4v", "avi", "ogv"] },
      ],
    });
    if (r.canceled) return [];
    return r.filePaths.map((p) => ({
      name: path.parse(p).name,
      url: pathToFileURL(p).href,
      source: "picked",
    }));
  });

  ipcMain.handle("toggle-fullscreen", () => {
    win.setFullScreen(!win.isFullScreen());
    return win.isFullScreen();
  });

  ipcMain.handle("open-external", (_e, url) => {
    if (/^https?:\/\//i.test(url)) shell.openExternal(url);
  });

  ipcMain.handle("quit", () => app.quit());
});

app.on("window-all-closed", () => app.quit());
