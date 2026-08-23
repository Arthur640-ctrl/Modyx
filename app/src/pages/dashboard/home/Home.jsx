import styles from './Home.module.css'
import { Plus, ChevronRight, Dot, PencilLine, SignalHigh } from "lucide-react"
import { Link, useNavigate } from "react-router-dom"
import { useEffect, useState } from 'react'
import { get_modpacks_list } from '../../../utils/api/Modpacks.api'

export default function Home() {
    const navigate = useNavigate()
    const [modpacks, set_modpacks] = useState([])

    useEffect(() => {
        async function load_modpacks() {
            const result = await get_modpacks_list()

            if (!result.success) {
                console.error(result.error)
                return
            }

            set_modpacks(result.data)
        }

        load_modpacks()
    }, [])

    function open_new_modpack_popup() {
        navigate('/dashboard/modpacks?newModpack=1')
    }

    function get_recent_modpacks() {
        return [...modpacks]
            .sort((first_modpack, second_modpack) => {
                const first_date = new Date(
                    first_modpack.updated_at || first_modpack.created_at || 0
                ).getTime()
                const second_date = new Date(
                    second_modpack.updated_at || second_modpack.created_at || 0
                ).getTime()

                return second_date - first_date
            })
            .slice(0, 5)
    }

    const recent_modpacks = get_recent_modpacks()

    return (
        <div className={styles.screen}>
            <div className={styles.home_header}>
                <h1>Accueil</h1>
                <button
                    type="button"
                    className={styles.cta_new_modpack}
                    onClick={open_new_modpack_popup}
                >
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
                    <a href="">
                        <Link to="/dashboard/modpacks">Voir tout</Link>
                    </a>
                </div>

                <div className={styles.modpacks_list_view}>
                    {recent_modpacks.length > 0 ? (
                        recent_modpacks.map((modpack) => (
                            <div
                                key={modpack.id}
                                className={styles.modpack}
                                onClick={() => navigate('/dashboard/modpacks/editor', {
                                    state: { modpack_id: modpack.id }
                                })}
                            >
                                <div className={styles.modpack_logo_container}>
                                    <div />
                                </div>

                                <div className={styles.modpack_infos_container}>
                                    <div className={styles.modpack_title}>
                                        <span>{modpack.display_name}</span>
                                    </div>
                                    <div className={styles.modpack_infos}>
                                        <span>{modpack.minecraft_version}</span>
                                        <Dot />
                                        <span>{modpack.mods_count ?? 0} mods</span>
                                    </div>
                                    <div className={styles.modpack_state}>
                                        {modpack.relation === 'owned' ? 'Disponible' : 'Partagé'}
                                    </div>
                                </div>

                                <div className={styles.modpack_actions}>
                                    <button
                                        type="button"
                                        title="Éditer le modpack"
                                        onClick={(event) => {
                                            event.stopPropagation()
                                            navigate('/dashboard/modpacks/editor', {
                                                state: { modpack_id: modpack.id }
                                            })
                                        }}
                                    >
                                        <PencilLine />
                                    </button>
                                </div>
                            </div>
                        ))
                    ) : (
                        <div className={styles.empty_state}>Aucun modpack récent.</div>
                    )}
                </div>
            </div>

            {/* Servers list
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
            </div> */}
        </div>
    )
}