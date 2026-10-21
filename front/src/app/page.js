import Link from 'next/link'
import { 
    ChevronRight,
} from "lucide-react"
import styles from "./page.module.css"
import Header from '@/components/Header'
import Footer from '@/components/Footer'

export default function LandingPage() {
    
    return (
        <div className={styles.page}>
            <Header />

            {/* Hero */}
            <section className={styles.hero}>
                <h1 className={styles.hero_title}>
                    Imaginez votre modpack. <br />
                    <span className={styles.hero_title_gradient}>L'IA fait le reste.</span>
                </h1>

                <p className={styles.hero_subtitle}>
                    Fini les incompatibilités, les crashs Java au lancement et les heures de recherche. 
                    Décrivez votre vision, l'IA de Modyx s'occupe de trouver les mods, résoudre les dépendances et builder votre pack.
                </p>

                <div className={styles.hero_cta_group}>
                    <Link href="/download" className={styles.btn_primary}>
                        <span>Télécharger</span>
                        <ChevronRight className={styles.btn_icon} size={18} />
                    </Link>

                    <a href="#features" className={styles.btn_secondary}>
                        En savoir plus
                    </a>
                </div>
            </section>


            <Footer />
        </div>
    )
}