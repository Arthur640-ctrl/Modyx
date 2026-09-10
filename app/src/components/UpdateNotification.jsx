import { Download, RefreshCw, ShieldCheck } from "lucide-react"
import styles from "./UpdateNotification.module.css"

const STATUS_LABELS = {
    checking: "Recherche de mise à jour...",
    downloading: "Téléchargement de la mise à jour...",
    ready: "Préparation de l'installation...",
    installing: "Installation de la mise à jour...",
    error: "Une erreur est survenue pendant la mise à jour."
}

export default function UpdateNotification({ update, onInstall }) {
    if (!update || update.status === "idle") {
        return null
    }

    const isInstalling = update.status === "installing"
    const isDownloading = update.status === "downloading"
    const isReady = update.status === "ready"
    const nextVersion = update.version ?? update.latestVersion ?? "..."
    const currentVersion = update.currentVersion ?? "..."
    const progress = Math.min(100, Math.max(0, Number(update.percent || 0)))
    const statusLabel = STATUS_LABELS[update.status] ?? "Mise à jour en cours..."

    return (
        <div className={styles.overlay} aria-live='polite'>
            <div className={styles.panel}>
                <div className={styles.brand}>
                    <div className={styles.logo} aria-hidden='true'>
                        {isInstalling ? <RefreshCw size={28} className={styles.spinning} /> : <ShieldCheck size={28} />}
                    </div>
                    <div>
                        <p className={styles.eyebrow}>Modyx</p>
                        <h1>Mise à jour obligatoire</h1>
                    </div>
                </div>

                <p className={styles.description}>Une nouvelle version de Modyx est disponible.</p>

                <div className={styles.versionGrid}>
                    <div className={styles.versionCard}>
                        <span>Version actuelle</span>
                        <strong>{currentVersion}</strong>
                    </div>
                    <div className={styles.versionCard}>
                        <span>Nouvelle version</span>
                        <strong>{nextVersion}</strong>
                    </div>
                </div>

                <div className={styles.statusRow}>
                    <div className={styles.statusIcon} aria-hidden='true'>
                        <Download size={18} />
                    </div>
                    <p>{statusLabel}</p>
                </div>

                {(isDownloading || isReady || isInstalling) && (
                    <>
                        <div className={styles.progressTrack} aria-label={`Téléchargement à ${progress}%`}>
                            <span style={{ width: `${progress}%` }} />
                        </div>
                        <div className={styles.progressMeta}>
                            <small>{progress}%</small>
                            <small>{isInstalling ? "Installation..." : isReady ? "Téléchargement terminé" : "En cours"}</small>
                        </div>
                    </>
                )}

                {update.status === "error" && (
                    <button type='button' className={styles.retryButton} onClick={onInstall}>
                        Réessayer
                    </button>
                )}
            </div>
        </div>
    )
}
