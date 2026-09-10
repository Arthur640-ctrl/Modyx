/* eslint-disable no-unused-vars */
import * as ReactRouter from "react-router-dom"
import { useEffect, useState } from "react"

import Auth from "./pages/auth/Auth.jsx"
import Dashboard from "./pages/dashboard/Dashboard.jsx"
import { getAccount } from "./utils/api/Account.api"

import Home from "./pages/dashboard/home/Home.jsx"
import Modpacks from "./pages/dashboard/modpacks/Modpacks.jsx"
import Editor from "./pages/dashboard/modpacks/editor/Editor.jsx"
import UpdateNotification from "./components/UpdateNotification.jsx"


function ProtectedDashboardLayout() {
    const [isChecking, set_is_checking] = useState(true)
    const [isAuthenticated, set_is_authenticated] = useState(false)

    useEffect(() => {
        async function check_auth() {
            const response = await getAccount()
            if (response.success) {
                set_is_authenticated(true)
            }
            set_is_checking(false)
        }
        check_auth()
    }, [])

    if (isChecking) return <div>Chargement...</div>
    if (!isAuthenticated) return <ReactRouter.Navigate to='/' replace />

    // Structure des routes enfants
    return (
        <Dashboard>
            <ReactRouter.Outlet />
        </Dashboard>
    )
}

export default function App() {
    const [update, set_update] = useState({
        status: "checking",
        required: true,
        currentVersion: "...",
        version: null,
        latestVersion: null,
        percent: 0
    })

    const installUpdate = async () => {
        if (!window.modyx?.installUpdate) {
            return
        }

        set_update((current) => (
            current
                ? { ...current, status: "installing" }
                : current
        ))

        try {
            await window.modyx.installUpdate()
        } catch (error) {
            console.error("Impossible d'installer la mise à jour :", error)
            set_update((current) => (
                current
                    ? { ...current, status: "ready" }
                    : current
            ))
        }
    }

    useEffect(() => {
        const unsubscribe = window.modyx?.onUpdateState?.((nextUpdate) => {
            set_update((current) => ({
                ...current,
                ...nextUpdate,
                currentVersion: nextUpdate?.currentVersion ?? current.currentVersion,
                latestVersion: nextUpdate?.latestVersion ?? nextUpdate?.version ?? current.latestVersion,
                version: nextUpdate?.version ?? current.version,
                percent: nextUpdate?.percent ?? current.percent ?? 0
            }))
        })

        return () => {
            unsubscribe?.()
        }
    }, [])

    useEffect(() => {
        if (!window.modyx?.installUpdate) {
            return
        }

        if (!update || !["ready", "downloaded"].includes(update.status)) {
            return
        }

        const timer = window.setTimeout(() => {
            void installUpdate()
        }, 800)

        return () => {
            window.clearTimeout(timer)
        }
    }, [update?.status, update?.version])

    const shouldBlockApp = Boolean(update) && update.status !== "idle"

    if (shouldBlockApp) {
        return <UpdateNotification update={update} onInstall={installUpdate} />
    }

    return (
        <>
            <ReactRouter.Routes>
                <ReactRouter.Route path='/' element={<Auth />} />

                <ReactRouter.Route path='/dashboard' element={<ProtectedDashboardLayout />}>

                    {/* /dashboard redirige vers /dashboard/home */}
                    <ReactRouter.Route index element={<ReactRouter.Navigate to='home' replace />} />

                    <ReactRouter.Route path='home' element={<Home />} />
                    <ReactRouter.Route path='modpacks' element={<Modpacks />} />
                    <ReactRouter.Route path='modpacks/editor' element={<Editor />} />

                </ReactRouter.Route>

                <ReactRouter.Route path='*' element={<ReactRouter.Navigate to='/' replace />} />
            </ReactRouter.Routes>
        </>
    )
}