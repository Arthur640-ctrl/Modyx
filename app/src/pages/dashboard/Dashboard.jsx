import styles from './Dashboard.module.css'
import { useEffect, useState } from "react"
import { useNavigate, NavLink, Outlet } from "react-router-dom"
import { Home, Search, Server, User, LogOut, Bell, Plus, Settings } from "lucide-react"

import { getAccount } from "../../utils/api/Account.api"

const NAV_ITEMS = [
  { id: 'home', label: 'Accueil', icon: Home, path: '/dashboard/home' },
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
  }, [navigate])

  if (!account) {
    return <div className={styles.loading}>Chargement du dashboard...</div>
  }

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
          <Bell className={styles.iconNotification} size={20} />
        </div>

        {/* New Modpack CTA Button */}
        <div className={styles.ctaContainer}>
          <button className={styles.ctaButton}>
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

        {/* Footer: Account */}
        <div className={styles.sidebarFooter}>
          <div className={styles.accountCard}>
            <div className={styles.avatar}>
              {account?.email?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div className={styles.accountInfo}>
              <span className={styles.accountName}>{account?.pseudo || 'Utilisateur'}</span>
              <span className={styles.accountEmail}>{account?.email || 'email@exemple.com'}</span>
            </div>
            <button onClick={handleLogout} className={styles.logoutBtn} title="Déconnexion">
              <LogOut size={18} />
            </button>
          </div>
        </div>

      </aside>

      {/* Content Area */}
      <main className={styles.content}>
        <Outlet />
      </main>
    </div>
  )
}