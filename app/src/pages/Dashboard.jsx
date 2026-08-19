import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"

import { getAccount } from "../utils/api/Account.api"
import { logout } from "../utils/api/Auth.api"

export default function Dashboard() {
    const navigate = useNavigate()
    const [account, set_account] = useState(null)

    useEffect(() => {
        async function load_account() {
            const response = await getAccount()

            if (!response.success) {
                localStorage.removeItem("modyx_token")
                navigate("/", { replace: true })
                return
            }

            set_account(response.data)
        }

        load_account()
    }, [navigate])


    if (!account) {
        return <div>Chargement du dashboard...</div>
    }

    return (
        <div style={{ padding: 24, color: "#f7f7f7" }}>
            <h1>Dashboard</h1>
            <p>Bienvenue, {account.pseudo}</p>
            <button onClick={logout}>Se déconnecter</button>
        </div>
    )
}
