import { Download, RefreshCw } from "lucide-react"
import styles from "./UpdateNotification.module.css"

export default function UpdateNotification({ update, onInstall }) {
    if (!update || update.status === "idle" || update.status === "checking") {
        return null
    }

    const isInstalling = update.status === "installing"
    const isDownloaded = update.status === "downloaded"
    const progress = Math.min(100, Math.max(0, update.percent || 0))

    return (
        <aside className={styles.notification} aria-live='polite'>
            <div className={styles.icon} aria-hidden='true'>
                {isInstalling ? <RefreshCw size={20} className={styles.spinning} /> : <Download size={20} />}
            </div>
            <div className={styles.content}>
                <strong>Nouvelle version disponible</strong>
                {isDownloaded || isInstalling ? (
                    <p>La version {update.version} est prête à être installée.</p>
                ) : (
                    <>
                        <p>Téléchargement de la version {update.version} en arrière-plan.</p>
                        <div className={styles.progressTrack} aria-label={`Téléchargement à ${progress}%`}>
                            <span style={{ width: `${progress}%` }} />
                        </div>
                        <small>{progress}% téléchargé</small>
                    </>
                )}
                {(isDownloaded || isInstalling) && (
                    <button
                        type='button'
                        className={styles.installButton}
                        onClick={onInstall}
                        disabled={isInstalling}
                    >
                        {isInstalling ? "Installation en cours..." : "Redémarrer et mettre à jour"}
                    </button>
                )}
            </div>
        </aside>
    )
}
