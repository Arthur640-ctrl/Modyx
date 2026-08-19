import styles from './Home.module.css'
import { Plus, ChevronRight, Dot, Download, SignalHigh } from "lucide-react"

export default function Home() {
    return (
        <div className={styles.screen}>
            <div className={styles.home_header}>
                <h1>Accueil</h1>
                <button className={styles.cta_new_modpack}>
                    <div className={styles.cta_new_modpack_plus_container}>
                        <div className={styles.cta_new_modpack_plus}>
                            <Plus />
                        </div>
                    </div>
                    
                    <div className={styles.cta_new_modpack_text}>
                        <h3>NOUVEAU MODPACK</h3>
                        <p>Créer un nouveau modpack avec l'AI</p>
                    </div>
                    <div className={styles.cta_new_modpack_chevron}>
                        <ChevronRight />
                    </div>
                </button>
            </div>

            {/* Modpack list */}
            <div className={styles.modpacks_list}>
                <div className={styles.modpacks_list_header}>
                    <span>MES MODPACKS</span>
                    <a href="">Voir tout</a>
                </div>

                <div className={styles.modpacks_list_view}>
                    <div className={styles.modpack}>
                        <div className={styles.modpack_logo_container}>
                            <div>

                            </div>
                        </div>

                        <div className={styles.modpack_infos_container}>
                            <div className={styles.modpack_title}>
                                <span>Aventure Ultime</span>
                            </div>
                            <div className={styles.modpack_infos}>
                                <span>1.20.1</span>
                                <Dot/>
                                <span>45 mods</span>
                            </div>
                            <div className={styles.modpack_state}>
                                Chargé
                            </div>
                        </div>

                        <div className={styles.modpack_actions}>
                            <button>
                                <Download/> 
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Servers list */}
            <div className={styles.servers_list}>
                <div className={styles.servers_list_header}>
                    <span>SERVEURS ACTIFS</span>
                    <a href="">Voir tout</a>
                </div>

                <div className={styles.servers_list_view}>
                    <div className={styles.server}>
                        <div className={styles.server_logo_container}>
                            <div>

                            </div>
                        </div>

                        <div className={styles.server_infos_container}>
                            <div className={styles.server_title}>
                                <span>Serveur famille</span>
                            </div>
                            <div className={styles.server_infos}>
                                <span>1.20.1</span>
                                <Dot/>
                                <span>Vanilla</span>
                            </div>
                            <div className={styles.server_players}>
                                <div className={styles.server_players_icon}>
                                    <SignalHigh size={20}/>
                                </div>
                                <div className={styles.server_player_text}>
                                    12/20 joueurs en ligne
                                </div>
                            </div>
                        </div>

                        <div className={styles.server_arrow}>
                            <ChevronRight/>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}