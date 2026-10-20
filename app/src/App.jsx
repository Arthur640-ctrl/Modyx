import * as ReactRouter from "react-router-dom"
import { useEffect, useState, useCallback } from "react"

import Auth from "./pages/auth/Auth.jsx"
import Dashboard from "./pages/dashboard/Dashboard.jsx"
import { getAccount } from "./utils/api/Account.api"

import Home from "./pages/dashboard/home/Home.jsx"
import Modpacks from "./pages/dashboard/modpacks/Modpacks.jsx"
import Editor from "./pages/dashboard/modpacks/editor/Editor.jsx"
import Settings from "./pages/dashboard/settings/Settings.jsx"
import UpdateNotification from "./components/UpdateNotification.jsx"

function ProtectedDashboardLayout() {
    const [isChecking, setIsChecking] = useState(true)
    const [isAuthenticated, setIsAuthenticated] = useState(false)

    useEffect(() => {
        async function checkAuth() {
            const response = await getAccount()
            if (response.success) {
                setIsAuthenticated(true)
            }
            setIsChecking(false)
        }
        checkAuth()
    }, [])

    if (isChecking) return <div>Chargement...</div>
    if (!isAuthenticated) return <ReactRouter.Navigate to='/' replace />

    return (
        <Dashboard>
            <ReactRouter.Outlet />
        </Dashboard>
    )
}

export default function App() {
    const [update, setUpdate] = useState({
        status: "idle",
        currentVersion: "...",
        version: null,
        latestVersion: null,
        percent: 0,
        error: null,
        releaseNotes: null,
        releaseDate: null,
        isManualCheck: false
    })

    const installUpdate = useCallback(async () => {
        if (!window.modyx?.installUpdate) return

        try {
            await window.modyx.installUpdate()
        } catch (error) {
            console.error("Impossible d'installer la mise à jour :", error)
        }
    }, [])

    const dismissUpdate = useCallback(async () => {
        if (!window.modyx?.dismissUpdate) return
        await window.modyx.dismissUpdate()
        setUpdate(prev => ({ ...prev, status: "idle", error: null }))
    }, [])

    const checkForUpdates = useCallback(async (isManual = true) => {
        if (!window.modyx?.checkForUpdates) return

        setUpdate(prev => ({ ...prev, status: "checking", isManualCheck: isManual, error: null }))

        try {
            const result = await window.modyx.checkForUpdates(isManual)
            if (!result.success) {
                if (result.reason !== "already-checking") {
                    setUpdate(prev => ({
                        ...prev,
                        status: result.reason === "dev" ? "idle" : "error",
                        error: result.error || "Échec de la vérification"
                    }))
                }
            }
        } catch (error) {
            console.error("Erreur vérification MAJ :", error)
            setUpdate(prev => ({ ...prev, status: "error", error: error?.message || String(error) }))
        }
    }, [])

    useEffect(() => {
        let mounted = true

        const readCurrentState = async () => {
            if (!window.modyx?.getUpdateState) return
            try {
                const state = await window.modyx.getUpdateState()
                if (mounted) {
                    setUpdate(prev => ({
                        ...prev,
                        ...state,
                        currentVersion: state?.currentVersion ?? prev.currentVersion,
                        latestVersion: state?.latestVersion ?? state?.version ?? prev.latestVersion,
                        version: state?.version ?? prev.version,
                        percent: state?.percent ?? prev.percent ?? 0,
                        releaseNotes: state?.releaseNotes ?? prev.releaseNotes,
                        releaseDate: state?.releaseDate ?? prev.releaseDate
                    }))
                }
            } catch (error) {
                console.error("Impossible de lire l'état de mise à jour :", error)
            }
        }

        const unsubState = window.modyx?.onUpdateState?.((next) => {
            if (!mounted) return
            setUpdate(prev => ({
                ...prev,
                ...next,
                currentVersion: next?.currentVersion ?? prev.currentVersion,
                latestVersion: next?.latestVersion ?? next?.version ?? prev.latestVersion,
                version: next?.version ?? prev.version,
                percent: next?.percent ?? prev.percent ?? 0,
                releaseNotes: next?.releaseNotes ?? prev.releaseNotes,
                releaseDate: next?.releaseDate ?? prev.releaseDate,
                isManualCheck: next?.isManualCheck ?? prev.isManualCheck
            }))
        })

        const unsubAvailable = window.modyx?.onUpdateAvailable?.((info) => {
            if (!mounted) return
            setUpdate(prev => ({
                ...prev,
                status: "available",
                version: info?.version,
                latestVersion: info?.version,
                releaseNotes: info?.releaseNotes,
                releaseDate: info?.releaseDate,
                error: null
            }))
        })

        const unsubProgress = window.modyx?.onUpdateProgress?.(({ percent }) => {
            if (!mounted) return
            setUpdate(prev => ({ ...prev, percent }))
        })

        const unsubDownloaded = window.modyx?.onUpdateDownloaded?.((info) => {
            if (!mounted) return
            setUpdate(prev => ({
                ...prev,
                status: "downloaded",
                version: info?.version,
                latestVersion: info?.version,
                percent: 100,
                releaseNotes: info?.releaseNotes ?? prev.releaseNotes,
                releaseDate: info?.releaseDate ?? prev.releaseDate,
                error: null
            }))
        })

        void readCurrentState()

        return () => {
            mounted = false
            unsubState?.()
            unsubAvailable?.()
            unsubProgress?.()
            unsubDownloaded?.()
        }
    }, [])

    const isBlocking = update.status === "downloading" || update.status === "installing"
    const showToast = update.status === "available" || update.status === "downloaded" || update.status === "error"
    const showCheckingToast = update.status === "checking" && update.isManualCheck

    return (
        <>
            <ReactRouter.Routes>
                <ReactRouter.Route path='/' element={<Auth />} />
                <ReactRouter.Route path='/dashboard' element={<ProtectedDashboardLayout />}>
                    <ReactRouter.Route index element={<ReactRouter.Navigate to='home' replace />} />
                    <ReactRouter.Route path='home' element={<Home />} />
                    <ReactRouter.Route path='modpacks' element={<Modpacks />} />
                    <ReactRouter.Route path='modpacks/editor' element={<Editor />} />
                    <ReactRouter.Route path='settings' element={<Settings />} />
                </ReactRouter.Route>
                <ReactRouter.Route path='*' element={<ReactRouter.Navigate to='/' replace />} />
            </ReactRouter.Routes>

            {isBlocking && (
                <UpdateNotification
                    update={update}
                    onInstall={installUpdate}
                />
            )}

            {(showToast || showCheckingToast) && (
                <UpdateNotification
                    update={update}
                    onInstall={installUpdate}
                    onDismiss={dismissUpdate}
                    onCheckNow={() => checkForUpdates(true)}
                />
            )}
        </>
    )
}