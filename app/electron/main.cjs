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

let mainWindow = null;
let updateState = {
    status: "idle",
    version: null,
    percent: 0
};
let installRequested = false;


// ============================================================
// CONFIGURATION
// ============================================================

const isDev =
    !app.isPackaged;


const logFile =
    path.join(
        app.getPath("userData"),
        "modyx.log"
    );


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

ipcMain.handle(
    "install-update",
    () => {
        if (
            updateState.status !== "downloaded" ||
            installRequested
        ) {
            return false;
        }

        installRequested = true;
        setUpdateState(
            "installing"
        );

        log(
            "[Updater] Installation demandée par l'utilisateur."
        );
        log(
            "[Updater] Appel de quitAndInstall(true, true)..."
        );

        try {
            autoUpdater.quitAndInstall(
                true,
                true
            );
        } catch (error) {
            installRequested = false;
            setUpdateState(
                "downloaded"
            );
            log(
                `[Updater] ERREUR installation : ${error?.message || error}`
            );
            throw error;
        }

        return true;
    }
);


// ============================================================
// FENÊTRE PRINCIPALE
// ============================================================

function createWindow() {
    const win =
        new BrowserWindow({

            width: 1200,
            height: 800,

            autoHideMenuBar: true,

            webPreferences: {

                contextIsolation: true,

                nodeIntegration: false,

                preload:
                    path.join(
                        __dirname,
                        "preload.cjs"
                    )

            }

        });

    mainWindow = win;

    win.webContents.on(
        "did-finish-load",
        () => {
            if (
                updateState.status !== "idle"
            ) {
                win.webContents.send(
                    "update-state",
                    updateState
                );
            }
        }
    );

    win.on(
        "closed",
        () => {
            if (
                mainWindow === win
            ) {
                mainWindow = null;
            }
        }
    );


    // --------------------------------------------------------
    // DEVELOPMENT
    // --------------------------------------------------------

    if (isDev) {

        log(
            "[Window] Chargement du serveur Vite..."
        );

        win.loadURL(
            "http://localhost:5173"
        );

        win.webContents.openDevTools({
            mode: "detach"
        });

        return;

    }


    // --------------------------------------------------------
    // PRODUCTION
    // --------------------------------------------------------

    const indexPath =
        path.join(
            app.getAppPath(),
            "dist",
            "index.html"
        );


    log(
        `[Window] Chargement de ${indexPath}`
    );


    win.loadFile(
        indexPath
    );

}

function sendUpdateEvent(channel, payload) {
    if (
        mainWindow &&
        !mainWindow.isDestroyed()
    ) {
        mainWindow.webContents.send(
            channel,
            payload
        );
    }
}

function setUpdateState(status, details = {}) {
    updateState = {
        ...updateState,
        ...details,
        status
    };

    sendUpdateEvent(
        "update-state",
        updateState
    );
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

    autoUpdater.on(
        "checking-for-update",
        () => {

            setUpdateState(
                "checking",
                {
                    percent: 0
                }
            );

            log(
                "[Updater] Recherche de mise à jour..."
            );

        }
    );


    // ========================================================
    // UPDATE DISPONIBLE
    // ========================================================

    autoUpdater.on(
        "update-available",
        (info) => {

            setUpdateState(
                "downloading",
                {
                    version: info.version,
                    percent: 0
                }
            );
            sendUpdateEvent(
                "update-available",
                {
                    version: info.version
                }
            );

            log(
                `[Updater] Mise à jour disponible : ${info.version}`
            );

        }
    );


    // ========================================================
    // AUCUNE UPDATE
    // ========================================================

    autoUpdater.on(
        "update-not-available",
        (info) => {

            setUpdateState(
                "idle",
                {
                    version: null,
                    percent: 0
                }
            );

            log(
                `[Updater] Modyx est à jour. Version distante : ${info.version}`
            );

        }
    );


    // ========================================================
    // PROGRESSION
    // ========================================================

    autoUpdater.on(
        "download-progress",
        (progress) => {

            setUpdateState(
                "downloading",
                {
                    percent: Math.round(progress.percent)
                }
            );
            sendUpdateEvent(
                "update-progress",
                {
                    percent: Math.round(progress.percent)
                }
            );

            log(
                `[Updater] Téléchargement : ${Math.round(progress.percent)}%`
            );

        }
    );


    // ========================================================
    // UPDATE TÉLÉCHARGÉE
    // ========================================================

    autoUpdater.on(
        "update-downloaded",
        (info) => {

            setUpdateState(
                "downloaded",
                {
                    version: info.version,
                    percent: 100
                }
            );
            sendUpdateEvent(
                "update-downloaded",
                {
                    version: info.version
                }
            );

            log(
                `[Updater] Mise à jour téléchargée : ${info.version}`
            );

            log(
                "[Updater] En attente de confirmation utilisateur..."
            );

        }
    );


    // ========================================================
    // ERREUR
    // ========================================================

    autoUpdater.on(
        "error",
        (error) => {

            setUpdateState(
                "idle",
                {
                    version: null,
                    percent: 0
                }
            );

            log(
                `[Updater] ERREUR : ${error?.message || error}`
            );


            if (error?.stack) {

                log(
                    `[Updater] Stack : ${error.stack}`
                );

            }

        }
    );


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
