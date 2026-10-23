
"use client"

import { ArrowUpRight } from "lucide-react"

import Header from "../../components/Header"
import Footer from "../../components/Footer"
import styles from "./page.module.css"

const DISCORD_URL = "https://discord.gg/6j7PbnDswq"

export default function SupportPage() {
    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.main}>
                <section className={styles.content}>

                <h1 className={styles.title}>
                    Support et aide
                </h1>

                <p className={styles.description}>
                    Une question sur Modyx, un problème technique
                    ou besoin d'aide pour créer ton modpack ?
                    Rejoins notre Discord pour obtenir de l'aide.
                </p>

                <a
                    href={DISCORD_URL}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={styles.button}
                >
                    Rejoindre le Discord
                    <ArrowUpRight size={17} />
                </a>

                <p className={styles.note}>
                    Assistance, questions et signalement de bugs :
                    tout se passe sur Discord.
                </p>

                </section>
            </main>

            <Footer />
        </div>
    )
}
