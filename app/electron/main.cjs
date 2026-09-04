const {
    app,
    BrowserWindow,
    ipcMain,
    shell
} = require("electron");

const path = require("path");
const { autoUpdater } = require("electron-updater");

const isDev = !app.isPackaged;

console.log("🔥 MAIN.CJS CHARGE");
console.log("🔥 VERSION :", app.getVersion());
console.log("🔥 PACKAGED :", app.isPackaged);

ipcMain.handle("open-external", async (_event, url) => {
    const parsedUrl = new URL(url);

    if (
        !["http:", "https:"].includes(parsedUrl.protocol) ||
        parsedUrl.pathname !== "/pricing"
    ) {
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

    if (isDev) {
        // =========================
        // DEVELOPMENT
        // =========================

        win.loadURL("http://localhost:5173");

        win.webContents.openDevTools({
            mode: "detach"
        });

    } else {

        win.webContents.openDevTools({
            mode: "detach"
        });
        // =========================
        // PRODUCTION
        // =========================

        win.loadFile(
            path.join(__dirname, "../dist/index.html")
        );
    }
}

function setupAutoUpdater() {

    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;

    autoUpdater.on("checking-for-update", () => {
        console.log("[Updater] Recherche de mise à jour...");
    });

    autoUpdater.on("update-available", (info) => {
        console.log(
            `[Updater] Mise à jour disponible : ${info.version}`
        );
    });

    autoUpdater.on("update-not-available", () => {
        console.log("[Updater] Application à jour.");
    });

    autoUpdater.on("download-progress", (progress) => {
        console.log(
            `[Updater] Téléchargement : ${Math.round(progress.percent)}%`
        );
    });

    autoUpdater.on("update-downloaded", (info) => {
        console.log(
            `[Updater] Mise à jour téléchargée : ${info.version}`
        );

        // Pour l'instant, on n'installe PAS automatiquement.
        // On pourra ensuite afficher un bouton
        // "Redémarrer pour mettre à jour".
    });

    autoUpdater.on("error", (error) => {
        console.error(
            "[Updater] Erreur :",
            error
        );
    });

    autoUpdater.checkForUpdates();
}

app.whenReady().then(() => {

    createWindow();

    if (!isDev) {
        setupAutoUpdater();
    }
});

app.on("window-all-closed", () => {
    if (process.platform !== "darwin") {
        app.quit();
    }
})