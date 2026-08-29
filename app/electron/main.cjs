const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("path");

ipcMain.handle("open-external", async (_event, url) => {
    const parsedUrl = new URL(url);

    if (!["http:", "https:"].includes(parsedUrl.protocol) || parsedUrl.pathname !== "/pricing") {
        throw new Error("URL externe non autorisee");
    }

    await shell.openExternal(parsedUrl.toString());
});

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(__dirname, "preload.cjs")
        }
    });

    win.loadURL("http://localhost:5173");

    // Ouvre automatiquement les DevTools
    win.webContents.openDevTools({
        mode: "detach" // ouvre dans une fenêtre séparée
    });
}

app.whenReady().then(createWindow);

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
});