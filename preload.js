const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("serene", {
  scanVideos: () => ipcRenderer.invoke("scan-videos"),
  pickVideos: () => ipcRenderer.invoke("pick-videos"),
  toggleFullscreen: () => ipcRenderer.invoke("toggle-fullscreen"),
  openExternal: (url) => ipcRenderer.invoke("open-external", url),
  quit: () => ipcRenderer.invoke("quit"),
});
