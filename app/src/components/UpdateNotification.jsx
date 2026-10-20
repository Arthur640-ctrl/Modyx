/* eslint-disable no-unused-vars */
import * as Icons from "lucide-react"
import { useState, useEffect } from "react"
import styles from "./UpdateNotification.module.css"

const { Download, RefreshCw, ShieldCheck, X, AlertTriangle } = Icons

const STATUS_LABELS = {
    checking: "Recherche de mise à jour…",
    downloading: "Téléchargement de la mise à jour…",
    available: "Mise à jour prête",
    downloaded: "Mise à jour prête",
    installing: "Installation de la mise à jour…",
    error: "Erreur lors de la mise à jour"
}

function getStatusIcon(status, spinningClass) {
    switch (status) {
        case "checking":
            return <RefreshCw size={18} className={spinningClass} />
        case "downloading":
            return <Download size={18} />
        case "available":
        case "downloaded":
            return <ShieldCheck size={18} />
        case "installing":
            return <RefreshCw size={18} className={spinningClass} />
        case "error":
            return <AlertTriangle size={18} />
        default:
            return null
    }
}

export default function UpdateNotification({ update, onInstall, onDismiss, onCheckNow }) {
    const status = update?.status
    const isIdle = !update || status === "idle"
    const isChecking = status === "checking"
    const isDownloading = status === "downloading"
    const isReady = status === "available" || status === "downloaded"
    const isInstalling = status === "installing"
    const isError = status === "error"

    const currentVersion = update?.currentVersion ?? "..."
    const nextVersion = update?.version ?? update?.latestVersion ?? "…"
    const releaseNotes = update?.releaseNotes
    const percent = Math.min(100, Math.max(0, Number(update?.percent || 0)))

    const showFullScreen = isDownloading || isInstalling
    const showToast = isReady || isError
    const showCheckingToast = isChecking && update?.isManualCheck
    const isVisible = showFullScreen || showToast || showCheckingToast

    const statusIcon = getStatusIcon(status, styles.spinning)

    if (!isVisible) return null

    if (showFullScreen) {
        return (
            <div className={styles.overlay} aria-live='polite' role='dialog' aria-modal='true'>
                <div className={styles.panel}>
                    <div className={styles.brand}>
                        <div className={styles.logo} aria-hidden='true'>
                            {statusIcon}
                        </div>
                        <div>
                            <p className={styles.eyebrow}>Modyx</p>
                            <h1>{isInstalling ? "Installation en cours" : "Mise à jour en cours"}</h1>
                        </div>
                    </div>

                    <p className={styles.description}>
                        {isInstalling
                            ? "L'application va redémarrer pour appliquer la mise à jour."
                            : "Le téléchargement se termine, l'installation suivra automatiquement."}
                    </p>

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
                            {statusIcon}
                        </div>
                        <p>{STATUS_LABELS[status]}</p>
                    </div>

                    <div className={styles.progressTrack} aria-label={`Progression à ${percent}%`}>
                        <span style={{ width: `${percent}%` }} />
                    </div>
                    <div className={styles.progressMeta}>
                        <small>{percent}%</small>
                        <small>{isInstalling ? "Installation…" : "Téléchargement…"}</small>
                    </div>

                    {releaseNotes && (
                        <details className={styles.releaseNotes}>
                            <summary>Notes de version</summary>
                            <div className={styles.releaseNotesContent} dangerouslySetInnerHTML={{ __html: releaseNotes }} />
                        </details>
                    )}
                </div>
            </div>
        )
    }

    if (showToast || showCheckingToast) {
        const isSuccess = isReady
        const isWarning = isError
        const isDownloaded = status === "downloaded"
        const isAvailable = status === "available"

        return (
            <div className={`${styles.toast} ${isSuccess ? styles.toastSuccess : ""} ${isWarning ? styles.toastError : ""} ${showCheckingToast ? styles.toastChecking : ""}`} role='status' aria-live='polite'>
                <div className={styles.toastIcon} aria-hidden='true'>
                    {statusIcon}
                </div>
                <div className={styles.toastContent}>
                    <div className={styles.toastHeader}>
                        <strong>{isDownloaded ? "Mise à jour prête" : isAvailable ? "Téléchargement en cours" : isError ? "Erreur de mise à jour" : "Vérification…"}</strong>
                        <button className={styles.toastClose} onClick={onDismiss} aria-label='Fermer'>
                            <X size={14} />
                        </button>
                    </div>
                    <p className={styles.toastMessage}>
                        {isDownloaded && `Version ${nextVersion} téléchargée — s'installera au prochain redémarrage`}
                        {isAvailable && `Version ${nextVersion} en cours de téléchargement…`}
                        {isError && update?.error}
                        {showCheckingToast && "Recherche de mise à jour en cours…"}
                    </p>
                    {releaseNotes && (
                        <details className={styles.toastReleaseNotes}>
                            <summary>Notes de version</summary>
                            <div className={styles.toastReleaseNotesContent} dangerouslySetInnerHTML={{ __html: releaseNotes }} />
                        </details>
                    )}
                    <div className={styles.toastActions}>
                        {isDownloaded && (
                            <button className={styles.btnPrimary} onClick={onInstall}>
                                <RefreshCw size={14} /> Redémarrer maintenant
                            </button>
                        )}
                        {isAvailable && (
                            <button className={styles.btnGhost} onClick={onDismiss}>
                                Masquer
                            </button>
                        )}
                        {isError && (
                            <>
                                <button className={styles.btnSecondary} onClick={onCheckNow}>
                                    <RefreshCw size={14} /> Réessayer
                                </button>
                                <button className={styles.btnGhost} onClick={onDismiss}>
                                    Ignorer
                                </button>
                            </>
                        )}
                        {showCheckingToast && (
                            <button className={styles.btnGhost} onClick={onDismiss}>
                                Masquer
                            </button>
                        )}
                    </div>
                </div>
            </div>
        )
    }

    return null
}