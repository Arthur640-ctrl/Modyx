const { contextBridge, ipcRenderer } = require("electron");

function subscribe(channel, listener) {
    const handler = (_event, payload) => {
        listener(payload);
    };
    ipcRenderer.on(channel, handler);
    return () => {
        ipcRenderer.removeListener(channel, handler);
    };
}

contextBridge.exposeInMainWorld("modyx", {
    openExternal: (url) => ipcRenderer.invoke("open-external", url),

    getUpdateState: () => ipcRenderer.invoke("get-update-state"),
    checkForUpdates: (isManual = false) => ipcRenderer.invoke("check-for-updates", isManual),
    installUpdate: () => ipcRenderer.invoke("install-update"),
    dismissUpdate: () => ipcRenderer.invoke("dismiss-update"),

    onUpdateState: (listener) => subscribe("update-state", listener),
    onUpdateAvailable: (listener) => subscribe("update-available", listener),
    onUpdateProgress: (listener) => subscribe("update-progress", listener),
    onUpdateDownloaded: (listener) => subscribe("update-downloaded", listener)
});