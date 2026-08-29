const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("modyx", {
    openExternal: (url) => ipcRenderer.invoke("open-external", url)
});
