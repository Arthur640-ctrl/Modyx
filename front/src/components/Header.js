'use client'

import { useState } from 'react'
import Link from 'next/link'
import { Download, Menu, X } from 'lucide-react'
import styles from './Header.module.css'

const navLinks = [
  { href: '/', label: 'Accueil' },
  { href: '/download', label: 'Télécharger' },
  { href: '/pricing', label: 'Tarifs' },
  { href: '/about', label: 'À propos' },
]

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false)

  function closeMenu() {
    setMenuOpen(false)
  }

  return (
    <header className={styles.header}>
      <div className={styles.container}>
        {/* Logo */}
        <Link
          href="/"
          className={styles.brand}
          onClick={closeMenu}
          aria-label="Modyx — Accueil"
        >
          <span className={styles.brand_title}>Modyx</span>
        </Link>

        {/* Navigation desktop */}
        <nav className={styles.nav} aria-label="Navigation principale">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.nav_link}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Actions desktop */}
        <div className={styles.actions}>
          <Link href="/download" className={styles.btn_download}>
            <Download size={16} aria-hidden="true" />
            <span>Télécharger</span>
          </Link>
        </div>

        {/* Bouton menu mobile */}
        <button
          type="button"
          className={styles.menu_toggle}
          onClick={() => setMenuOpen((open) => !open)}
          aria-label={menuOpen ? 'Fermer le menu' : 'Ouvrir le menu'}
          aria-expanded={menuOpen}
          aria-controls="mobile-navigation"
        >
          {menuOpen ? (
            <X size={22} />
          ) : (
            <Menu size={22} />
          )}
        </button>
      </div>

      {/* Navigation mobile */}
      <div
        id="mobile-navigation"
        className={`${styles.mobile_menu} ${
          menuOpen ? styles.mobile_menu_open : ''
        }`}
        aria-hidden={!menuOpen}
        inert={!menuOpen}
      >
        <nav className={styles.mobile_nav} aria-label="Navigation mobile">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={styles.mobile_nav_link}
              onClick={closeMenu}
              tabIndex={menuOpen ? 0 : -1}
            >
              {link.label}
            </Link>
          ))}

          <Link
            href="/download"
            className={styles.mobile_download}
            onClick={closeMenu}
            tabIndex={menuOpen ? 0 : -1}
          >
            <Download size={17} aria-hidden="true" />
            Télécharger Modyx
          </Link>
        </nav>
      </div>
    </header>
  )
}
