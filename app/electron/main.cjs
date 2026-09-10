const {
    app,
    BrowserWindow,
    ipcMain,
    shell
} = require("electron");

const path = require("path");
const fs = require("fs");

const {
    autoUpdater
} = require("electron-updater");

const UPDATE_STATUS = Object.freeze({
    IDLE: "idle",
    CHECKING: "checking",
    DOWNLOADING: "downloading",
    READY: "ready",
    INSTALLING: "installing",
    ERROR: "error"
});

const BLOCKING_UPDATE_STATUSES = new Set([
    UPDATE_STATUS.CHECKING,
    UPDATE_STATUS.DOWNLOADING,
    UPDATE_STATUS.READY,
    UPDATE_STATUS.INSTALLING,
    UPDATE_STATUS.ERROR
]);

let mainWindow = null;
let updateState = {
    status: UPDATE_STATUS.IDLE,
    version: null,
    currentVersion: app.getVersion(),
    latestVersion: null,
    percent: 0,
    required: false,
    error: null
};
let installRequested = false;
let appReadyForDisplay = false;

const logFile = path.join(app.getPath("userData"), "modyx.log");

if (!app.requestSingleInstanceLock()) {
    console.log("[App] Une autre instance de Modyx est déjà ouverte. Fermeture de l'instance en cours.");
    app.quit();
}

app.on("second-instance", () => {
    if (mainWindow) {
        if (mainWindow.isMinimized()) {
            mainWindow.restore();
        }
        mainWindow.show();
        mainWindow.focus();
    }
});


// ============================================================
// CONFIGURATION
// ============================================================

const isDev = !app.isPackaged;


// ============================================================
// LOGGER
// ============================================================

function log(message) {

    const line =
        `[${new Date().toISOString()}] ${message}\n`;

    console.log(message);

    try {

        fs.appendFileSync(
            logFile,
            line,
            "utf8"
        );

    } catch (error) {

        console.error(
            "[Logger] Impossible d'écrire le log :",
            error
        );

    }

}


// ============================================================
// INFORMATIONS DE DÉMARRAGE
// ============================================================

log("========================================");
log("Modyx démarrage");
log(`Version : ${app.getVersion()}`);
log(`Packaged : ${app.isPackaged}`);
log(`Mode : ${isDev ? "development" : "production"}`);
log(`UserData : ${app.getPath("userData")}`);
log("========================================");


// ============================================================
// IPC — OUVERTURE DE LIENS EXTERNES
// ============================================================

ipcMain.handle(
    "open-external",
    async (_event, url) => {

        let parsedUrl;

        try {

            parsedUrl =
                new URL(url);

        } catch {

            throw new Error(
                "URL invalide"
            );

        }


        if (
            ![
                "http:",
                "https:"
            ].includes(
                parsedUrl.protocol
            ) ||
            parsedUrl.pathname !== "/pricing"
        ) {

            throw new Error(
                "URL externe non autorisée"
            );

        }


        await shell.openExternal(
            parsedUrl.toString()
        );

    }
);

function requestInstall() {
    const canInstall = [UPDATE_STATUS.READY, "downloaded"].includes(updateState.status);

    if (installRequested || !canInstall) {
        return false;
    }

    installRequested = true;
    setUpdateState(
        UPDATE_STATUS.INSTALLING,
        {
            required: true,
            percent: 100
        }
    );

    log("[Updater] Installation automatique demandée.");
    log("[Updater] Appel de quitAndInstall(true, true)...");

    try {
        autoUpdater.quitAndInstall(true, true);
        return true;
    } catch (error) {
        installRequested = false;
        setUpdateState(
            UPDATE_STATUS.READY,
            {
                required: true,
                percent: 100,
                error: error?.message || String(error)
            }
        );
        log(`[Updater] ERREUR installation : ${error?.message || error}`);
        throw error;
    }
}

ipcMain.handle(
    "install-update",
    () => requestInstall()
);


// ============================================================
// FENÊTRE PRINCIPALE
// ============================================================

function createWindow() {
    const win =
        new BrowserWindow({
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
        }
    });

    win.on("closed", () => {
        if (mainWindow === win) {
            mainWindow = null;
        }
    });

    // --------------------------------------------------------
    // DEVELOPMENT
    // --------------------------------------------------------

    if (isDev) {
        log("[Window] Chargement du serveur Vite...");
        win.loadURL("http://localhost:5173");
        win.webContents.openDevTools({ mode: "detach" });
        win.show();
        return;
    }

    // --------------------------------------------------------
    // PRODUCTION
    // --------------------------------------------------------

    const indexPath = path.join(app.getAppPath(), "dist", "index.html");
    log(`[Window] Chargement de ${indexPath}`);
    win.loadFile(indexPath);
}

function sendUpdateEvent(channel, payload) {
    if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send(channel, payload);
    }
}

function applyWindowVisibilityForUpdate() {
    if (!mainWindow || mainWindow.isDestroyed()) {
        return;
    }

    const shouldBlockApp =
        updateState.required ||
        BLOCKING_UPDATE_STATUSES.has(updateState.status);

    if (shouldBlockApp) {
        mainWindow.hide();
        return;
    }

    if (!appReadyForDisplay) {
        appReadyForDisplay = true;
    }

    if (!mainWindow.isVisible()) {
        mainWindow.show();
    }
}

function setUpdateState(status, details = {}) {
    updateState = {
        ...updateState,
        ...details,
        status,
        currentVersion: app.getVersion(),
        latestVersion: details.version ?? updateState.latestVersion ?? updateState.version,
        required: details.required ?? updateState.required ?? false,
        error: details.error ?? null
    };

    if (mainWindow && !mainWindow.isDestroyed()) {
        applyWindowVisibilityForUpdate();
        sendUpdateEvent("update-state", updateState);
    }
}


// ============================================================
// AUTO UPDATER
// ============================================================

function setupAutoUpdater() {

    log(
        "[Updater] Initialisation..."
    );


    // ========================================================
    // CONFIGURATION
    // ========================================================

    // Télécharger automatiquement
    // lorsqu'une nouvelle version est trouvée.
    autoUpdater.autoDownload = true;


    // IMPORTANT :
    //
    // On NE laisse PAS electron-updater attendre
    // la fermeture normale de l'application.
    //
    // On déclenchera nous-mêmes quitAndInstall()
    // lorsque le téléchargement est terminé.
    //
    autoUpdater.autoInstallOnAppQuit = false;


    // ========================================================
    // CHECK
    // ========================================================

    autoUpdater.on("checking-for-update", () => {
        setUpdateState(UPDATE_STATUS.CHECKING, {
            version: null,
            latestVersion: null,
            percent: 0,
            required: false,
            error: null
        });

        log("[Updater] Recherche de mise à jour...");
    });

    // ========================================================
    // UPDATE DISPONIBLE
    // ========================================================

    autoUpdater.on("update-available", (info) => {
        setUpdateState(UPDATE_STATUS.DOWNLOADING, {
            version: info.version,
            latestVersion: info.version,
            percent: 0,
            required: true,
            error: null
        });

        sendUpdateEvent("update-available", { version: info.version });
        log(`[Updater] Mise à jour disponible : ${info.version}`);
    });

    // ========================================================
    // AUCUNE UPDATE
    // ========================================================

    autoUpdater.on("update-not-available", (info) => {
        setUpdateState(UPDATE_STATUS.IDLE, {
            version: null,
            latestVersion: info?.version || null,
            percent: 0,
            required: false,
            error: null
        });

        log(`[Updater] Modyx est à jour. Version distante : ${info.version}`);
    });

    // ========================================================
    // PROGRESSION
    // ========================================================

    autoUpdater.on("download-progress", (progress) => {
        const percent = Math.round(progress.percent || 0);

        setUpdateState(UPDATE_STATUS.DOWNLOADING, {
            version: updateState.version ?? updateState.latestVersion ?? app.getVersion(),
            percent,
            required: true,
            error: null
        });

        sendUpdateEvent("update-progress", { percent });
        log(`[Updater] Téléchargement : ${percent}%`);
    });

    // ========================================================
    // UPDATE TÉLÉCHARGÉE
    // ========================================================

    autoUpdater.on("update-downloaded", (info) => {
        const nextVersion = info.version || updateState.latestVersion || updateState.version;

        setUpdateState(UPDATE_STATUS.READY, {
            version: nextVersion,
            latestVersion: nextVersion,
            percent: 100,
            required: true,
            error: null
        });

        sendUpdateEvent("update-downloaded", { version: nextVersion });
        log(`[Updater] Mise à jour téléchargée : ${nextVersion}`);
        log("[Updater] Installation automatique en cours...");

        setTimeout(() => {
            requestInstall();
        }, 750);
    });

    // ========================================================
    // ERREUR
    // ========================================================

    autoUpdater.on("error", (error) => {
        const isMandatoryUpdateFailure = updateState.required || installRequested;

        setUpdateState(
            isMandatoryUpdateFailure ? UPDATE_STATUS.ERROR : UPDATE_STATUS.IDLE,
            {
                version: updateState.version ?? null,
                latestVersion: updateState.latestVersion ?? null,
                percent: 0,
                required: isMandatoryUpdateFailure,
                error: error?.message || String(error)
            }
        );

        log(`[Updater] ERREUR : ${error?.message || error}`);

        if (error?.stack) {
            log(`[Updater] Stack : ${error.stack}`);
        }
    });


    // ========================================================
    // LANCER LA RECHERCHE
    // ========================================================

    log(
        "[Updater] Lancement de checkForUpdates()..."
    );


    autoUpdater
        .checkForUpdates()
        .catch(
            (error) => {

                log(
                    `[Updater] checkForUpdates() a échoué : ${error?.message || error}`
                );


                if (error?.stack) {

                    log(
                        `[Updater] Stack : ${error.stack}`
                    );

                }

            }
        );

}


// ============================================================
// APPLICATION READY
// ============================================================

app.whenReady().then(
    () => {

        log(
            "[App] Electron est prêt."
        );


        createWindow();


        // ====================================================
        // AUTO UPDATE
        // ====================================================

        if (!isDev) {

            setupAutoUpdater();

        } else {

            log(
                "[Updater] Désactivé en développement."
            );

        }

    }
);


// ============================================================
// FERMETURE
// ============================================================

app.on(
    "window-all-closed",
    () => {

        if (
            process.platform !== "darwin"
        ) {

            app.quit();

        }

    }
);
