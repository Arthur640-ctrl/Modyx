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

            log(
                `[Updater] Mise à jour téléchargée : ${info.version}`
            );


            log(
                "[Updater] Installation immédiate..."
            );


            // Petit délai pour garantir que
            // tous les handles/fichiers sont libérés.
            setTimeout(
                () => {

                    try {

                        log(
                            "[Updater] Fermeture de Modyx et lancement de l'installeur..."
                        );


                        /*
                         * electron-updater 6.x
                         *
                         * quitAndInstall(
                         *     isSilent,
                         *     isForceRunAfter
                         * )
                         *
                         * true  = installation silencieuse
                         * true  = relancer Modyx après
                         *
                         */

                        autoUpdater.quitAndInstall(
                            true,
                            true
                        );


                    } catch (error) {

                        log(
                            `[Updater] ERREUR installation : ${error?.message || error}`
                        );


                        if (error?.stack) {

                            log(
                                `[Updater] Stack : ${error.stack}`
                            );

                        }

                    }

                },
                1000
            );

        }
    );


    // ========================================================
    // ERREUR
    // ========================================================

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
