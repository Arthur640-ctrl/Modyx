import { Routes, Route, Navigate, Outlet } from "react-router-dom"
import { useEffect, useState } from "react"

import Auth from "./pages/auth/Auth.jsx"
import Dashboard from "./pages/dashboard/Dashboard.jsx"
import { getAccount } from "./utils/api/Account.api"

import Home from "./pages/dashboard/home/Home.jsx"
import Modpacks from "./pages/dashboard/modpacks/Modpacks.jsx"
import Editor from "./pages/dashboard/modpacks/editor/Editor.jsx"


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
    if (!isAuthenticated) return <Navigate to="/" replace />

    // Structure des routes enfants
    return (
        <Dashboard>
            <Outlet />
        </Dashboard>
    )
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Auth />} />
            
            <Route path="/dashboard" element={<ProtectedDashboardLayout />}>
                
                {/* /dashboard redirige vers /dashboard/home */}
                <Route index element={<Navigate to="home" replace />} />
                
                <Route path="home" element={<Home />} />
                <Route path="modpacks" element={<Modpacks />} />
                <Route path="modpacks/editor" element={<Editor />} />
                 
            </Route>

            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}