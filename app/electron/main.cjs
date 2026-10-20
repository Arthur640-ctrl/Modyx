const {
    app,
    BrowserWindow,
    ipcMain,
    shell,
    dialog
} = require("electron");

const path = require("path");
const fs = require("fs");

const { autoUpdater } = require("electron-updater");

const UPDATE_STATUS = Object.freeze({
    IDLE: "idle",
    CHECKING: "checking",
    DOWNLOADING: "downloading",
    AVAILABLE: "available",
    DOWNLOADED: "downloaded",
    INSTALLING: "installing",
    ERROR: "error"
});

let mainWindow = null;
let updateState = {
    status: UPDATE_STATUS.IDLE,
    currentVersion: app.getVersion(),
    latestVersion: null,
    version: null,
    percent: 0,
    error: null,
    releaseNotes: null,
    releaseDate: null,
    isManualCheck: false
};
let updateCheckInterval = null;
let isUpdatePendingInstall = false;

const logFile = path.join(app.getPath("userData"), "modyx.log");

if (!app.requestSingleInstanceLock()) {
    console.log("[App] Une autre instance de Modyx est déjà ouverte. Fermeture de l'instance en cours.");
    app.quit();
}

app.on("second-instance", () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) mainWindow.restore();
        mainWindow.show();
        mainWindow.focus();
    }
});

const isDev = !app.isPackaged;

function log(message) {
    const line = `[${new Date().toISOString()}] ${message}\n`;
    console.log(message);
    try {
        fs.appendFileSync(logFile, line, "utf8");
    } catch (error) {
        console.error("[Logger] Impossible d'écrire le log :", error);
    }
}

log("========================================");
log("Modyx démarrage");
log(`Version : ${app.getVersion()}`);
log(`Packaged : ${app.isPackaged}`);
log(`Mode : ${isDev ? "development" : "production"}`);
log(`UserData : ${app.getPath("userData")}`);
log("========================================");

ipcMain.handle("open-external", async (_event, url) => {
    let parsedUrl;
    try {
        parsedUrl = new URL(url);
    } catch {
        throw new Error("URL invalide");
    }
    if (!["http:", "https:"].includes(parsedUrl.protocol) || parsedUrl.pathname !== "/pricing") {
        throw new Error("URL externe non autorisée");
    }
    await shell.openExternal(parsedUrl.toString());
});

ipcMain.handle("get-update-state", () => updateState);

ipcMain.handle("check-for-updates", async (event, isManual = false) => {
    if (isDev) {
        log("[Updater] Vérification manuelle ignorée en développement");
        return { success: false, reason: "dev" };
    }

    if ([UPDATE_STATUS.CHECKING, UPDATE_STATUS.DOWNLOADING].includes(updateState.status)) {
        log("[Updater] Vérification déjà en cours");
        return { success: false, reason: "already-checking" };
    }

    updateState = {
        ...updateState,
        status: UPDATE_STATUS.CHECKING,
        isManualCheck: isManual,
        error: null
    };
    sendUpdateEvent("update-state", updateState);
    log("[Updater] Recherche de mise à jour..." + (isManual ? " (manuelle)" : ""));

    try {
        const result = await autoUpdater.checkForUpdates();
        if (!result || !result.updateInfo) {
            setUpdateState(UPDATE_STATUS.IDLE, {
                latestVersion: updateState.currentVersion,
                version: null,
                percent: 0,
                error: null,
                releaseNotes: null,
                releaseDate: null
            });
            log("[Updater] Aucune mise à jour disponible");
            return { success: true, hasUpdate: false };
        }
        return { success: true, hasUpdate: true };
    } catch (error) {
        log(`[Updater] Erreur lors de la vérification : ${error?.message || error}`);
        setUpdateState(UPDATE_STATUS.ERROR, { error: error?.message || String(error) });
        return { success: false, reason: "error", error: error?.message || String(error) };
    }
});

ipcMain.handle("install-update", async () => {
    if (updateState.status !== UPDATE_STATUS.DOWNLOADED) {
        log("[Updater] Tentative d'installation mais mise à jour non prête");
        return { success: false, reason: "not-ready" };
    }

    isUpdatePendingInstall = true;
    setUpdateState(UPDATE_STATUS.INSTALLING, { percent: 100 });
    log("[Updater] Installation de la mise à jour demandée, redémarrage...");

    setTimeout(() => {
        try {
            autoUpdater.quitAndInstall(false, true);
        } catch (error) {
            isUpdatePendingInstall = false;
            setUpdateState(UPDATE_STATUS.DOWNLOADED, {
                error: error?.message || String(error),
                required: true
            });
            log(`[Updater] ERREUR redémarrage : ${error?.message || error}`);
        }
    }, 800);

    return { success: true };
});

ipcMain.handle("dismiss-update", () => {
    if (updateState.status === UPDATE_STATUS.AVAILABLE || updateState.status === UPDATE_STATUS.DOWNLOADED) {
        setUpdateState(UPDATE_STATUS.IDLE, { error: null });
    }
    return { success: true };
});

function sendUpdateEvent(channel, payload) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, payload);
    }
}

function setUpdateState(status, details = {}) {
    const previousStatus = updateState.status;
    updateState = {
        ...updateState,
        ...details,
        status,
        currentVersion: app.getVersion(),
        latestVersion: details.version ?? details.latestVersion ?? updateState.latestVersion ?? updateState.version,
        version: details.version ?? updateState.version,
        error: details.error ?? (status === UPDATE_STATUS.ERROR ? details.error : null)
    };

    if (mainWindow && !mainWindow.isDestroyed()) {
        sendUpdateEvent("update-state", updateState);
    }

    log(`[Updater] État: ${previousStatus} -> ${status}${details.version ? ` (v${details.version})` : ""}${details.percent !== undefined ? ` ${details.percent}%` : ""}`);
}

function setupAutoUpdater() {
    log("[Updater] Initialisation...");

    autoUpdater.autoDownload = true;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.autoInstallEvent = "onNextLaunch";
    autoUpdater.allowPrerelease = false;
    autoUpdater.forceDevUpdateConfig = isDev;

    autoUpdater.on("checking-for-update", () => {
        if (updateState.status !== UPDATE_STATUS.CHECKING) {
            setUpdateState(UPDATE_STATUS.CHECKING, {
                version: null,
                latestVersion: null,
                percent: 0,
                error: null
            });
        }
        log("[Updater] Recherche de mise à jour...");
    });

    autoUpdater.on("update-available", (info) => {
        const version = info?.version || "inconnue";
        setUpdateState(UPDATE_STATUS.AVAILABLE, {
            version,
            latestVersion: version,
            percent: 0,
            releaseNotes: info?.releaseNotes || null,
            releaseDate: info?.releaseDate || null,
            error: null
        });
        sendUpdateEvent("update-available", { version, releaseNotes: info?.releaseNotes, releaseDate: info?.releaseDate });
        log(`[Updater] Mise à jour disponible : ${version} - Téléchargement automatique démarré`);
    });

    autoUpdater.on("update-not-available", (info) => {
        if (updateState.isManualCheck) {
            dialog.showMessageBox(mainWindow, {
                type: "info",
                title: "Modyx à jour",
                message: `Vous utilisez la dernière version (${app.getVersion()}).`,
                buttons: ["OK"]
            }).catch(() => {});
        }
        setUpdateState(UPDATE_STATUS.IDLE, {
            latestVersion: info?.version || updateState.currentVersion,
            version: null,
            percent: 0,
            error: null,
            releaseNotes: null,
            releaseDate: null
        });
        log(`[Updater] Modyx est à jour. Version distante : ${info?.version}`);
    });

    autoUpdater.on("download-progress", (progress) => {
        const percent = Math.round(progress.percent || 0);
        setUpdateState(UPDATE_STATUS.DOWNLOADING, {
            version: updateState.latestVersion || updateState.version,
            percent,
            error: null
        });
        sendUpdateEvent("update-progress", { percent });
    });

    autoUpdater.on("update-downloaded", (info) => {
        const version = info?.version || updateState.latestVersion || updateState.version;
        setUpdateState(UPDATE_STATUS.DOWNLOADED, {
            version,
            latestVersion: version,
            percent: 100,
            releaseNotes: info?.releaseNotes || updateState.releaseNotes,
            releaseDate: info?.releaseDate || updateState.releaseDate,
            error: null
        });
        sendUpdateEvent("update-downloaded", { version, releaseNotes: info?.releaseNotes, releaseDate: info?.releaseDate });
        log(`[Updater] Mise à jour téléchargée : ${version} - Prête à installer`);
    });

    autoUpdater.on("error", (error) => {
        const isNetworkError = error?.message?.includes("net::") || error?.message?.includes("ENOTFOUND") || error?.message?.includes("ETIMEDOUT");
        const message = isNetworkError
            ? "Impossible de contacter le serveur de mise à jour. Vérifiez votre connexion."
            : error?.message || String(error);

        if ([UPDATE_STATUS.CHECKING, UPDATE_STATUS.DOWNLOADING, UPDATE_STATUS.AVAILABLE].includes(updateState.status)) {
            setUpdateState(UPDATE_STATUS.ERROR, { error: message });
        } else if (updateState.status === UPDATE_STATUS.DOWNLOADED) {
            setUpdateState(UPDATE_STATUS.DOWNLOADED, { error: message });
        }
        log(`[Updater] ERREUR : ${message}`);
        if (error?.stack) log(`[Updater] Stack : ${error.stack}`);
    });

    log("[Updater] Lancement de la vérification initiale...");
    autoUpdater.checkForUpdates().catch(err => {
        log(`[Updater] checkForUpdates() initial a échoué : ${err?.message || err}`);
    });

    startPeriodicCheck();
}

function startPeriodicCheck() {
    if (updateCheckInterval) clearInterval(updateCheckInterval);
    updateCheckInterval = setInterval(() => {
        if (updateState.status === UPDATE_STATUS.IDLE || updateState.status === UPDATE_STATUS.ERROR) {
            log("[Updater] Vérification périodique...");
            autoUpdater.checkForUpdates().catch(err => {
                log(`[Updater] Vérification périodique échouée : ${err?.message || err}`);
            });
        }
    }, 4 * 60 * 60 * 1000);
    updateCheckInterval.unref();
}

function createWindow() {
    const win = new BrowserWindow({
        width: 1200,
        height: 800,
        show: false,
        autoHideMenuBar: true,
        webPreferences: {
            contextIsolation: true,
            nodeIntegration: false,
            preload: path.join(__dirname, "preload.cjs")
        }
    });

    mainWindow = win;

    win.webContents.on("did-finish-load", () => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            win.webContents.send("update-state", updateState);
            win.show();
        }
    });

    win.on("closed", () => {
        if (mainWindow === win) mainWindow = null;
    });

    if (isDev) {
        log("[Window] Chargement du serveur Vite...");
        win.loadURL("http://localhost:5173");
        win.webContents.openDevTools({ mode: "detach" });
        return;
    }

    const indexPath = path.join(app.getAppPath(), "dist", "index.html");
    log(`[Window] Chargement de ${indexPath}`);
    win.loadFile(indexPath);
}

app.whenReady().then(() => {
    log("[App] Electron est prêt.");

    if (!isDev) {
        setupAutoUpdater();
    } else {
        log("[Updater] Désactivé en développement.");
        setUpdateState(UPDATE_STATUS.IDLE, { latestVersion: app.getVersion() });
    }

    createWindow();
});

app.on("window-all-closed", () => {
    if (updateCheckInterval) clearInterval(updateCheckInterval);
    if (process.platform !== "darwin") app.quit();
});

app.on("before-quit", () => {
    if (updateCheckInterval) clearInterval(updateCheckInterval);
});