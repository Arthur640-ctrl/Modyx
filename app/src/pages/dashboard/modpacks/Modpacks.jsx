import styles from './Modpacks.module.css'
import { Dot, Edit, Download, ArrowUpToLine, ArrowLeftRight, Share2, House, ChevronRight, Plus } from "lucide-react"
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { get_modpacks_list, get_minecraft_versions, create_modpack } from '../../../utils/api/Modpacks.api'

export default function Home() {
    const navigate = useNavigate()
    
    // New modpack popup
    const [new_modpack_popup, set_new_modpack_popup] = useState(false)
    const [minecraft_version, set_minecraft_version] = useState("")
    const [loader, set_loader] = useState("")
    const [popup_is_loading, set_popup_is_loading] = useState(false)
    const [minecraft_versions, set_minecraft_versions] = useState([])
    const [modpack_name, set_modpack_name] = useState("")

    // Packs
    const [loaded_pack_id, set_loaded_pack_id] = useState("")
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

        async function load_minecraft_versions() {
            const result = await get_minecraft_versions()

            if (!result.success) {
                console.error(result.error)
                return
            }

            set_minecraft_versions(result.data)
        }

        load_minecraft_versions()
    }, [])

    function ma_fonction_de_modyx(modpack_id) {
        navigate('/dashboard/modpacks/editor', {
            state: {
                modpack_id
            }
        })
    }

    async function handle_create_modpack() {
        if (!modpack_name.trim()) {
            console.error("Le nom du modpack est requis")
            return
        }

        if (!minecraft_version) {
            console.error("La version Minecraft est requise")
            return
        }

        if (!loader) {
            console.error("Le loader est requis")
            return
        }

        set_popup_is_loading(true)

        const result = await create_modpack(
            modpack_name.trim(),
            minecraft_version,
            loader
        )

        set_popup_is_loading(false)

        if (!result.success) {
            console.error(result.error)
            return
        }

        set_new_modpack_popup(false)

        const modpacks_result = await get_modpacks_list()

        if (modpacks_result.success) {
            set_modpacks(modpacks_result.data)
        }

        set_modpack_name("")
        set_minecraft_version("")
        set_loader("")
    }

    return (
        <div className={styles.screen}>
            
            {/* New modpack popup */}
            {new_modpack_popup && (
                <div className={styles.popup_overlay} onClick={() => set_new_modpack_popup(false)}>
                    <div className={styles.popup} onClick={(e) => e.stopPropagation()}>
                        
                        <h2>Nouveau modpack</h2>
                        <p>Crée ton nouveau modpack.</p>

                        <div className={styles.popup_separator}></div>

                        <div className={styles.fields_list}>
                            {/* Nom */}
                            <label className={styles.field}>
                                <span>Nom</span>

                                <input
                                    type="text"
                                    placeholder="Choisissez un nom pour votre modpack"
                                    value={modpack_name}
                                    onChange={(e) => set_modpack_name(e.target.value)}
                                />
                            </label>

                            {/* Version Minecraft */}
                            <label className={styles.field}>
                                <span>Version Minecraft</span>

                                <select
                                    value={minecraft_version}
                                    onChange={(e) => set_minecraft_version(e.target.value)}
                                >
                                    <option value="" disabled>
                                        Sélectionnez une version
                                    </option>

                                    {minecraft_versions.map((version) => (
                                        <option key={version} value={version}>
                                            {version}
                                        </option>
                                    ))}
                                </select>
                            </label>

                            {/* Loader */}
                            <label className={styles.field}>
                                <span>Loader</span>

                                <select
                                    value={loader}
                                    onChange={(e) => set_loader(e.target.value)}
                                >
                                    <option value="" disabled>
                                        Sélectionnez un loader
                                    </option>

                                    <option value="fabric">Fabric</option>
                                    <option value="forge">Forge</option>
                                    <option value="neoforge">NeoForge</option>
                                    <option value="quilt">Quilt</option>
                                </select>
                            </label>
                        </div>

                        <div className={styles.popup_separator}></div>
                        
                        <button
                            type="button"
                            className={styles.popup_button}
                            onClick={handle_create_modpack}
                            disabled={popup_is_loading}
                        >
                            {popup_is_loading ? (
                                <span className={styles.loader}></span>
                            ) : (
                                "Créer le modpack"
                            )}
                        </button>
                    </div>
                </div>
            )}

            {/* Page */}
            <div className={styles.modpacks_header}>
                <h1>Modpacks</h1>
            </div>

            {/* Owned m odpack list */}
            <div className={styles.modpacks_list}>
                <div className={styles.modpacks_list_header}>
                    <span>MES MODPACKS</span>
                </div>

                <div className={styles.modpacks_list_view}>
                    <div className={styles.modpacks_list_view}>
                        {modpacks.map((modpack) => (
                            <div
                                key={modpack.id}
                                className={`${styles.modpack} ${
                                    modpack.id === loaded_pack_id
                                        ? styles.modpack_loaded
                                        : ""
                                }`}
                            >
                                <div className={styles.modpack_logo_container}>
                                    <div>

                                    </div>
                                </div>

                                <div className={styles.modpack_infos_container}>
                                    <div className={styles.modpack_title}>
                                        <span>{modpack.display_name}</span>

                                        <span
                                            className={styles.tooltip_wrapper}
                                            data-tooltip={
                                                modpack.relation === "owned"
                                                    ? "Ce modpack vous appartient"
                                                    : "Ce modpack est partagé avec vous"
                                            }
                                        >
                                            {modpack.relation === "owned" ? (
                                                <House
                                                    size={15}
                                                    className={styles.modpack_shared_icon}
                                                />
                                            ) : (
                                                <Share2
                                                    size={15}
                                                    className={styles.modpack_shared_icon}
                                                />
                                            )}
                                        </span>
                                    </div>

                                    <div className={styles.modpack_infos}>
                                        <span>{modpack.minecraft_version}</span>
                                        <Dot />
                                        <span>{modpack.loader}</span>
                                        <Dot />
                                        <span>{modpack.mods_count} mods</span>
                                    </div>

                                    <div className={styles.modpack_state}>
                                        {modpack.id === loaded_pack_id
                                            ? "Chargé"
                                            : "Disponible"}
                                    </div>
                                </div>

                                <div className={styles.modpack_actions}>
                                    {modpack.relation === "owned" && (
                                        <button
                                            type="button"
                                            title="Editer le modpack"
                                            onClick={() => ma_fonction_de_modyx(modpack.id)}
                                        >
                                            <Edit />
                                        </button>
                                    )}

                                    <button title="Télécharger le .mcpack">
                                        <Download />
                                    </button>

                                    {modpack.id === loaded_pack_id ? (
                                        <button title="Décharger le modpack">
                                            <ArrowUpToLine />
                                        </button>
                                    ) : (
                                        <button title="Décharger le modpack actuel et charger celui-ci">
                                            <ArrowLeftRight />
                                        </button>
                                    )}
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
                
                {modpacks.length == 0 && (
                    <div className={styles.modpacks_list_empty_container}>
                        <h1>Aucun modpacks</h1>
                        <a href="" onClick={() => set_new_modpack_popup(true)}>Créer un modpack</a>
                    </div>
                )}
                

                <div className={styles.separator}></div>

                <button className={styles.cta_new_modpack} onClick={() => set_new_modpack_popup(true)}>
                    <div className={styles.cta_new_modpack_text}>
                        <h3>NOUVEAU MODPACK</h3>
                        <p>Créer un nouveau modpack avec l'AI</p>
                    </div>
                </button>
            </div>

        </div>
    )
}