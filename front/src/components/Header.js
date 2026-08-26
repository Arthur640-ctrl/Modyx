// src/components/Header.js
'use client' // Requis car on utilise l'état local pour le dropdown sur mobile/desktop

import { useState } from 'react'
import Link from 'next/link'
import { Download, ChevronDown, HelpCircle, FileText, Shield, Terminal } from 'lucide-react'
import styles from './Header.module.css'

export default function Header() {
  const [dropdownOpen, setDropdownOpen] = useState(false)

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        
        {/* LOGO / ACCUEIL */}
        <Link href="/" className={styles.brand}>
          <span className={styles.brand_title}>Modyx</span>
        </Link>

        {/* NAVIGATION PRINCIPALE */}
        <nav className={styles.nav}>
          <Link href="/" className={styles.nav_link}>
            Accueil
          </Link>

          <Link href="/download" className={styles.nav_link}>
            Télécharger
          </Link>
          
          <Link href="/pricing" className={styles.nav_link}>
            Tarifs
          </Link>

          <Link href="/about" className={styles.nav_link}>
            À propos
          </Link>

        </nav>

        {/* CTA BOUTON DROIT */}
        <div className={styles.actions}>
          <a href="#download" className={styles.btn_download}>
            <Download size={16} />
            <span>Télécharger</span>
          </a>
        </div>

      </div>
    </header>
  )
}