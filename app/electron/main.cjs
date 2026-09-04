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


// ============================================================
// CONFIGURATION
// ============================================================

const isDev = !app.isPackaged;

const logFile = path.join(
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
log(`Executable : ${process.execPath}`);
log(`AppPath : ${app.getAppPath()}`);
log(`UserData : ${app.getPath("userData")}`);
log("========================================");


// ============================================================
// IPC — LIENS EXTERNES
// ============================================================

ipcMain.handle(
    "open-external",
    async (_event, url) => {

        let parsedUrl;

        try {

            parsedUrl = new URL(url);

        } catch {

            throw new Error(
                "URL invalide"
            );

        }


        if (
            !["http:", "https:"].includes(
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


// ============================================================
// FENÊTRE PRINCIPALE
// ============================================================

function createWindow() {

    const win = new BrowserWindow({

        width: 1200,
        height: 800,

        autoHideMenuBar: true,

        webPreferences: {

            contextIsolation: true,
            nodeIntegration: false,

            preload: path.join(
                __dirname,
                "preload.cjs"
            )

        }

    });


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


// ============================================================
// AUTO UPDATER
// ============================================================

function setupAutoUpdater() {

    log("[Updater] Initialisation...");


    // --------------------------------------------------------
    // Configuration
    // --------------------------------------------------------

    autoUpdater.autoDownload = true;

    /*
     * IMPORTANT :
     *
     * On désactive l'installation automatique
     * lorsque app.quit() est appelé.
     *
     * L'installation sera déclenchée explicitement
     * après update-downloaded.
     */

    autoUpdater.autoInstallOnAppQuit = false;


    // --------------------------------------------------------
    // Logger electron-updater
    // --------------------------------------------------------

    autoUpdater.logger = {

        info(message) {

            log(
                `[Updater][INFO] ${message}`
            );

        },

        warn(message) {

            log(
                `[Updater][WARN] ${message}`
            );

        },

        error(message) {

            log(
                `[Updater][ERROR] ${message}`
            );

        },

        debug(message) {

            log(
                `[Updater][DEBUG] ${message}`
            );

        }

    };


    // --------------------------------------------------------
    // Checking
    // --------------------------------------------------------

    autoUpdater.on(
        "checking-for-update",
        () => {

            log(
                "[Updater] Recherche de mise à jour..."
            );

        }
    );


    // --------------------------------------------------------
    // Update disponible
    // --------------------------------------------------------

    autoUpdater.on(
        "update-available",
        (info) => {

            log(
                `[Updater] Mise à jour disponible : ${info.version}`
            );

        }
    );


    // --------------------------------------------------------
    // Pas de mise à jour
    // --------------------------------------------------------

    autoUpdater.on(
        "update-not-available",
        (info) => {

            log(
                `[Updater] Aucune mise à jour disponible. Version distante : ${info.version}`
            );

        }
    );


    // --------------------------------------------------------
    // Progression
    // --------------------------------------------------------

    autoUpdater.on(
        "download-progress",
        (progress) => {

            log(
                `[Updater] Téléchargement : ${Math.round(progress.percent)}%`
            );

        }
    );


    // --------------------------------------------------------
    // Mise à jour téléchargée
    // --------------------------------------------------------

    autoUpdater.on(
        "update-downloaded",
        (info) => {

            log(
                `[Updater] Mise à jour téléchargée : ${info.version}`
            );


            log(
                "[Updater] Installation explicite..."
            );


            /*
             * Petit délai afin de laisser les derniers
             * handlers / écritures se terminer proprement.
             */

            setTimeout(() => {

                try {

                    log(
                        "[Updater] Appel de quitAndInstall(true, true)..."
                    );


                    /*
                     * electron-updater 6.x :
                     *
                     *   true  = silent
                     *   true  = forceRunAfter
                     *
                     * Cela donne :
                     *
                     *   installation silencieuse
                     *   puis relance automatique de Modyx
                     */

                    autoUpdater.quitAndInstall(
                        true,
                        true
                    );


                } catch (error) {

                    log(
                        `[Updater] ERREUR quitAndInstall : ${error?.message || error}`
                    );


                    if (error?.stack) {

                        log(
                            `[Updater] Stack : ${error.stack}`
                        );

                    }

                }

            }, 1000);

        }
    );


    // --------------------------------------------------------
    // Erreur updater
    // --------------------------------------------------------

    autoUpdater.on(
        "error",
        (error) => {

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


    // --------------------------------------------------------
    // Lancer la recherche
    // --------------------------------------------------------

    log(
        "[Updater] Lancement de checkForUpdates()..."
    );


    autoUpdater
        .checkForUpdates()
        .catch((error) => {

            log(
                `[Updater] checkForUpdates() a échoué : ${error?.message || error}`
            );


            if (error?.stack) {

                log(
                    `[Updater] Stack : ${error.stack}`
                );

            }

        });

}


// ============================================================
// APPLICATION READY
// ============================================================

app.whenReady().then(() => {

    log(
        "[App] Electron est prêt."
    );


    createWindow();


    if (!isDev) {

        setupAutoUpdater();

    } else {

        log(
            "[Updater] Désactivé en développement."
        );

    }

});


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
