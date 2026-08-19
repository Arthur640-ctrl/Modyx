const { app, BrowserWindow } = require("electron");

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        autoHideMenuBar: true
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