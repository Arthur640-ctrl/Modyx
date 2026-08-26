// src/components/Footer.js
import Link from 'next/link'
import { ShieldAlert } from 'lucide-react'
import styles from './Footer.module.css'

export default function Footer() {
  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        
        {/* GRILLE DES LIENS */}
        <div className={styles.grid}>
          
          {/* COLONNE 1 : MARQUE & PRÉSENTATION */}
          <div className={styles.brand_col}>
            <Link href="/" className={styles.brand}>
              <span className={styles.brand_title}>Modyx</span>
            </Link>
            <p className={styles.brand_desc}>
              L'assistant IA qui génère et optimise vos modpacks Minecraft sur-mesure, sans crash ni prise de tête.
            </p>
            
            {/* RÉSEAUX & CONTACT */}
            <div className={styles.socials}>
                <ul className={styles.col_list}>
                    <li><a 
                        href="https://discord.gg/6j7PbnDswq" 
                        target="_blank" 
                        rel="noopener noreferrer"
                        title="Rejoindre notre Discord"
                    >
                        Discord
                    </a></li>
                </ul>
            </div>
          </div>

          {/* COLONNE 2 : PRODUIT */}
          <div className={styles.col}>
            <h4 className={styles.col_title}>Produit</h4>
            <ul className={styles.col_list}>
              <li><Link href="/#features">Fonctionnalités</Link></li>
              <li><Link href="/pricing">Tarifs</Link></li>
              <li><Link href="/#download">Télécharger</Link></li>
              <li><Link href="/changelog">Nouveautés (Changelog)</Link></li>
            </ul>
          </div>

          {/* COLONNE 3 : RESSOURCES & SUPPORT */}
          <div className={styles.col}>
            <h4 className={styles.col_title}>Ressources</h4>
            <ul className={styles.col_list}>
              <li><Link href="/faq">F.A.Q</Link></li>
              <li><Link href="/support">Support & Aide</Link></li>
              <li><Link href="/about">À propos</Link></li>
            </ul>
          </div>

          {/* COLONNE 4 : LÉGAL & SÉCURITÉ */}
          <div className={styles.col}>
            <h4 className={styles.col_title}>Légal</h4>
            <ul className={styles.col_list}>
              <li><Link href="/legal">Mentions Légales</Link></li>
              <li><Link href="/legal#cgu">Conditions (CGU)</Link></li>
              <li><Link href="/legal#rgpd">Confidentialité & RGPD</Link></li>
              <li><Link href="/legal#disclaimer">Avertissement Mojang</Link></li>
            </ul>
          </div>

        </div>

        {/* DISCLAIMER MINECRAFT RAPIDE */}
        <div className={styles.disclaimer_bar}>
          <ShieldAlert size={16} className={styles.disclaimer_icon} />
          <p>
            Modyx n'est pas affilié, associé ni approuvé par Mojang AB ou Microsoft Corporation. 
            Minecraft est une marque déposée de Mojang Synergies AB.
          </p>
        </div>

        {/* BAS DU FOOTER : COPYRIGHT */}
        <div className={styles.bottom_bar}>
          <p>© {new Date().getFullYear()} Modyx. Tous droits réservés.</p>
          <div className={styles.bottom_links}>
            <span>Fait avec passion pour les joueurs Minecraft</span>
          </div>
        </div>

      </div>
    </footer>
  )
}