import styles from './Dashboard.module.css'
import { useEffect, useState } from "react"
import { useNavigate, NavLink, Outlet } from "react-router-dom"
import { Home, LogOut, Plus, LibraryBig, Coins } from "lucide-react"

import { getAccount } from "../../utils/api/Account.api"

const NAV_ITEMS = [
  { id: 'home', label: 'Accueil', icon: Home, path: '/dashboard/home' },
  { id: 'modpacks', label: 'Modpacks', icon: LibraryBig, path: '/dashboard/modpacks' },
]

const PRICING_URL = import.meta.env.VITE_FRONTEND_URL || "http://localhost:3000/pricing"

export default function Dashboard() {
    const navigate = useNavigate()
    const [account, set_account] = useState(null)

    useEffect(() => {
        async function load_account() {
            const response = await getAccount()

            if (!response.success) {
                localStorage.removeItem("modyx_token")
                localStorage.removeItem("modyx_user_id")
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

    const credits_total = account.plan.credits_availble.total
    const credits_limit_plan = account.plan.credits_availble.plan_limit_total
    const credits_used_plan = account.plan.plan_credits_used.plan_credits_used_this_month
    const plan_credits_usage_percent = Math.round((credits_used_plan / credits_limit_plan) * 100 * 100) / 100

    const plan_display_name = account.plan.plan_display_name

    const handleLogout = async () => {
        localStorage.removeItem("modyx_token")
        localStorage.removeItem("modyx_user_id")
        navigate("/", { replace: true })
    }

    const openPricing = () => {
        const query = account?.user_id ? `?user_id=${encodeURIComponent(account.user_id)}` : ""
        const pricingUrl = `${PRICING_URL}${query}`

        if (window.modyx?.openExternal) {
            window.modyx.openExternal(pricingUrl).catch((error) => {
                console.error("Impossible d'ouvrir le navigateur externe :", error)
            })
            return
        }

        window.open(pricingUrl, "_blank", "noopener,noreferrer")
    }

    return (
        <div className={styles.main}>
        <aside className={styles.sidebar}>
            
            {/* Header */}
            <div className={styles.sidebarHeader}>
            <h1 className={styles.logo}>
                MOD<span className={styles.logoAccent}>YXXXXX</span>
            </h1>
            <div className={styles.tooltipContainer}>
                <button
                    type='button'
                    className={styles.tokenBalance}
                    aria-describedby='credits-balance-tooltip'
                >
                    <Coins size={16} />
                    <span>{credits_total}</span>
                </button>
                <span id='credits-balance-tooltip' className={`${styles.tooltip} ${styles.balanceTooltip}`} role='tooltip'>
                    Crédit restant de l&apos;abonnement et des bundles
                </span>
            </div>
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
                    <span className={styles.tooltipContainer}>
                        <span>Crédits utilisés (abonnement)</span>
                        <span className={styles.tooltip} role='tooltip'>
                            Utilisation de l&apos;abonnement actuel, les crédits ajoutés via les bundles n&apos;apparaissent pas et ne sont pas comptabilisés ici
                        </span>
                    </span>
                    <strong>{plan_credits_usage_percent} %</strong>
                </div>
                <div
                    className={styles.usageTrack}
                    role="progressbar"
                    aria-label="Pourcentage de crédits utilisés"
                    aria-valuemin="0"
                    aria-valuemax="100"
                    aria-valuenow={plan_credits_usage_percent}
                >
                    <div className={styles.usageProgress} style={{ width: `${plan_credits_usage_percent}%` }} />
                </div>
                
                <span className={styles.usageDetails}>{credits_used_plan} / {credits_limit_plan} crédits</span>
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
            <button type="button" className={styles.changePlanButton} onClick={openPricing}>
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