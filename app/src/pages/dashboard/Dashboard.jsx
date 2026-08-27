import styles from './Dashboard.module.css'
import { useEffect, useState } from "react"
import { useNavigate, NavLink, Outlet } from "react-router-dom"
import { Home, LogOut, Plus, LibraryBig, Coins } from "lucide-react"

import { getAccount } from "../../utils/api/Account.api"

const NAV_ITEMS = [
  { id: 'home', label: 'Accueil', icon: Home, path: '/dashboard/home' },
  { id: 'modpacks', label: 'Modpacks', icon: LibraryBig, path: '/dashboard/modpacks' },
]

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

        const interval = setInterval(load_account, 30_000)

        return () => clearInterval(interval)
    }, [navigate])

    if (!account) {
        return <div className={styles.loading}>Chargement du dashboard...</div>
    }

    const credits_balance = Math.max(0, Number(account.credits_balance_this_month) || 0)
    const credits_used = Math.max(0, Number(account.credits_used_this_month) || 0)
    const credits_limit = Math.max(0, Number(account.monthly_credits_limit_plan) || 0)
    const credits_percent = credits_limit > 0
        ? Math.min(100, Math.round((credits_used / credits_limit) * 100 * 10) / 10)
        : 0
    const plan_display_name = account.plan_display_name || "Plan gratuit"

    const handleLogout = async () => {
        localStorage.removeItem("modyx_token")
        navigate("/", { replace: true })
    }

    return (
        <div className={styles.main}>
        <aside className={styles.sidebar}>
            
            {/* Header */}
            <div className={styles.sidebarHeader}>
            <h1 className={styles.logo}>
                MOD<span className={styles.logoAccent}>YX</span>
            </h1>
            <button type="button" className={styles.tokenBalance} title="Crédits restants">
                <Coins size={16} />
                <span>{credits_balance}</span>
            </button>
            </div>

            {/* New Modpack CTA Button */}
            <div className={styles.ctaContainer}>
            <button
                type="button"
                className={styles.ctaButton}
                onClick={() => navigate('/dashboard/modpacks?newModpack=1')}
            >
                <Plus size={18} />
                <span>Nouveau Modpack</span>
            </button>
            </div>

            {/* Navigation Items */}
            <nav className={styles.sidebarNav}>
            {NAV_ITEMS.map((item) => (
                <NavLink 
                key={item.id} 
                to={item.path} 
                className={({ isActive }) => 
                    isActive ? `${styles.navItem} ${styles.active}` : styles.navItem
                }
                >
                <item.icon size={20} />
                <span>{item.label}</span>
                </NavLink>
            ))}
            </nav>

            <div className={styles.usageCard}>
                <div className={styles.usageHeader}>
                    <span>Crédits utilisés</span>
                    <strong>{credits_percent} %</strong>
                </div>
                <div
                    className={styles.usageTrack}
                    role="progressbar"
                    aria-label="Pourcentage de crédits utilisés"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={credits_percent}
                >
                    <div className={styles.usageProgress} style={{ width: `${credits_percent}%` }} />
                </div>
                
                <span className={styles.usageDetails}>{credits_used} / {credits_limit} crédits</span>
            </div>

            {/* Footer: Account */}
            <div className={styles.sidebarFooter}>
            <div className={styles.accountCard}>
                <div className={styles.avatar}>
                {account?.email?.charAt(0)?.toUpperCase() || 'U'}
                </div>
                <div className={styles.accountInfo}>
                <span className={styles.accountName}>{account?.pseudo || 'Utilisateur'}</span>
                <span className={styles.accountEmail}>{account?.email || 'email@exemple.com'}</span>
                <span className={styles.accountPlan}>{plan_display_name}</span>
                </div>
                <button onClick={handleLogout} className={styles.logoutBtn} title="Déconnexion">
                <LogOut size={18} />
                </button>
            </div>
            <button type="button" className={styles.changePlanButton}>
                Changer de plan
            </button>
            </div>

        </aside>

        {/* Content Area */}
        <main className={styles.content}>
            <Outlet />
        </main>
        </div>
    )
}