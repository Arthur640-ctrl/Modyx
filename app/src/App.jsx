import {
    Routes,
    Route,
    Navigate
} from "react-router-dom"
import { useEffect, useState } from "react"

import Auth from "./pages/Auth"
import Dashboard from "./pages/Dashboard"
import { getAccount } from "./utils/api/Account.api"

function ProtectedDashboard() {
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

    if (isChecking) {
        return <div>Chargement...</div>
    }

    if (!isAuthenticated) {
        return <Navigate to="/" replace />
    }

    return <Dashboard />
}

export default function App() {
    return (
        <Routes>
            <Route path="/" element={<Auth />} />
            <Route path="/dashboard" element={<ProtectedDashboard />} />
            <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
    )
}