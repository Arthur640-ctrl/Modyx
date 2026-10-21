import styles from './Settings.module.css'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getAccount, updateAccountSettings } from '../../../utils/api/Account.api'
import pkg from '../../../../package.json'
import { useMinecraft } from '../../../context/useMinecraft.js'
import { FolderOpen, RefreshCw, HardDrive, CheckCircle, AlertCircle } from "lucide-react"

export default function Settings() {
    const navigate = useNavigate()
    const { config, detectedPaths, isLoading, error, modsPath, isConfigured, refreshPaths, autoDetect, pickFolder, setPath } = useMinecraft()

    const [account_data, set_account_data] = useState({})
    const [form_data, set_form_data] = useState({
        pseudo: "",
        email: "",
        password: "",
    })

    const [active_tab, set_active_tab] = useState("general")
    const [notice_error, set_notice_error] = useState("")
    const [mc_notice, set_mc_notice] = useState({ type: "", message: "" })
    const [mc_saving, set_mc_saving] = useState(false)
    const [selectedPath, set_selected_path] = useState(config?.path || "")

    const changed_fields = {
        pseudo: form_data.pseudo !== (account_data.pseudo ?? ""),
        email: form_data.email !== (account_data.email ?? ""),
        password: form_data.password !== "",
    }

    const [saving, set_saving] = useState(false)

    const unsaved = Object.values(changed_fields).some(Boolean)

    const handle_change = (field, value) => {
        set_form_data(prev => ({
            ...prev,
            [field]: value,
        }))

        set_notice_error("")
    }

    const handle_save = async () => {
        if (!unsaved || saving) return

        set_saving(true)
        set_notice_error("")

        try {
            for (const field of ["pseudo", "email", "password"]) {
                if (!changed_fields[field]) continue

                const result = await updateAccountSettings(
                    field,
                    form_data[field]
                )

                if (!result.success) {
                    const error = result.error
                    set_notice_error(
                        typeof error === "string"
                            ? error
                            : error?.message ?? "Une erreur est survenue."
                    )
                    break
                }

                if (field !== "password") {
                    set_account_data(prev => ({
                        ...prev,
                        [field]: form_data[field],
                    }))
                } else {
                    set_form_data(prev => ({
                        ...prev,
                        password: "",
                    }))
                }
            }
        } catch {
            set_notice_error("Une erreur inattendue est survenue.")
        } finally {
            set_saving(false)
        }
    }

    const handle_mc_refresh = async () => {
        set_mc_notice({ type: "info", message: "Recherche en cours..." })
        await refreshPaths()
        set_mc_notice({ type: "success", message: "Liste actualisée" })
        setTimeout(() => set_mc_notice({ type: "", message: "" }), 3000)
    }

    const handle_mc_auto_detect = async () => {
        set_mc_notice({ type: "info", message: "Auto-détection en cours..." })
        set_mc_saving(true)
        const result = await autoDetect()
        set_mc_saving(false)
        if (result) {
            set_selected_path(result.path)
            set_mc_notice({ type: "success", message: `Détecté : ${result.customLabel}` })
        } else {
            set_mc_notice({ type: "error", message: "Aucune installation trouvée" })
        }
        setTimeout(() => set_mc_notice({ type: "", message: "" }), 5000)
    }

    const handle_mc_pick_folder = async () => {
        set_mc_notice({ type: "info", message: "Sélection du dossier..." })
        const result = await pickFolder()
        if (result) {
            set_selected_path(result.path)
            if (result.valid) {
                set_mc_notice({ type: "success", message: "Dossier valide sélectionné" })
            } else {
                set_mc_notice({ type: "warning", message: "Dossier sélectionné (structure Minecraft non détectée)" })
            }
        }
        setTimeout(() => set_mc_notice({ type: "", message: "" }), 5000)
    }

    const handle_mc_save = async () => {
        if (!selectedPath.trim()) {
            set_mc_notice({ type: "error", message: "Aucun chemin sélectionné" })
            return
        }
        set_mc_saving(true)
        set_mc_notice({ type: "info", message: "Sauvegarde..." })
        const success = await setPath(selectedPath, "custom", "Dossier personnalisé")
        set_mc_saving(false)
        if (success) {
            set_mc_notice({ type: "success", message: "Configuration sauvegardée" })
        } else {
            set_mc_notice({ type: "error", message: "Échec de la sauvegarde" })
        }
        setTimeout(() => set_mc_notice({ type: "", message: "" }), 5000)
    }

    const handle_mc_select_detected = (path, label, launcherType) => {
        set_selected_path(path)
        set_mc_notice({ type: "info", message: `Sélectionné : ${label}. Cliquez sur Enregistrer pour confirmer.` })
    }

    // General
    const handle_logout = async () => {
        localStorage.removeItem("modyx_token")
        localStorage.removeItem("modyx_user_id")
        navigate("/", { replace: true })
    }

    // Load account
    async function load_account() {
        const response = await getAccount()
        const account = response.data

        set_account_data(account)
        set_form_data({
            pseudo: account.pseudo ?? "",
            email: account.email ?? "",
            password: ""
        })
    }


    useEffect(() => {
        load_account()
    }, [navigate])

    return (
        <div className={styles.screen}>

            <div className={styles.title}>
                <h1>Paramètres</h1>
            </div>

            <div className={styles.settings_content}>

                <div className={styles.sidebar}>

                    <div
                        className={active_tab === 'general' ? styles.sidebar_tab_active : styles.sidebar_tab}
                        onClick={() => set_active_tab('general')}
                    >
                        Général
                    </div>

                    <div
                        className={active_tab === 'account' ? styles.sidebar_tab_active : styles.sidebar_tab}
                        onClick={() => set_active_tab('account')}
                    >
                        Compte
                    </div>

                    <div
                        className={active_tab === 'minecraft' ? styles.sidebar_tab_active : styles.sidebar_tab}
                        onClick={() => set_active_tab('minecraft')}
                    >
                        Minecraft
                    </div>

                </div>

                <div className={styles.content}>
                    {active_tab == "general" && (
                        <section className={styles.section}>
                            <h2>Général</h2>
                            <p>Paramètres général</p>
                            
                            <div className={styles.field}>
                                
                                <div className={styles.field_title}>
                                    <p>Version</p>
                                    <span>Version de l'application Modyx</span>
                                </div>

                                <div className={styles.field_content}>
                                    <input type="text" className={styles.input_info} readOnly value={pkg.version} />
                                </div>
                                
                            </div>

                            <div className={styles.field}>
                                
                                <div className={styles.field_title}>
                                    <p>Se déconnecter</p>
                                    <span>Se déconnecter de son compte Modyx</span>
                                </div>

                                <div className={styles.field_content}>
                                    <button className={styles.danger_button} onClick={handle_logout}>Se déconnecter</button>
                                </div>
                                
                            </div>

                        </section>
                    )}

                    {active_tab == "account" && (
                        <section className={styles.section}>
                            <h2>Compte</h2>
                            <p>Paramètres de votre compte Modyx</p>

                            <div className={styles.field}>
                                
                                <div className={styles.field_title}>
                                    <p>Pseudo</p>
                                    <span>Votre pseudo enregistré sur la platforme</span>
                                </div>

                                <div className={styles.field_content}>
                                    <input
                                        type="text"
                                        className={styles.input_info}
                                        value={form_data.pseudo}
                                        onChange={(e) => handle_change("pseudo", e.target.value)}
                                    />
                                </div>
                                
                            </div>

                            <div className={styles.field}>
                                
                                <div className={styles.field_title}>
                                    <p>Email</p>
                                    <span>Votre email enregistrée sur la platforme</span>
                                </div>

                                <div className={styles.field_content}>
                                    <input
                                        type="email"
                                        className={styles.input_info}
                                        value={form_data.email}
                                        onChange={(e) => handle_change("email", e.target.value)}
                                    />
                                </div>
                                
                            </div>

                            <div className={styles.field}>
                                
                                <div className={styles.field_title}>
                                    <p>Nouveau mot de passe</p>
                                    <span>Définissez un nouveau mot de passe, votre ancien serra perdu</span>
                                </div>

                                <div className={styles.field_content}>
                                    <input
                                        type="password"
                                        className={styles.input_info}
                                        value={form_data.password}
                                        onChange={(e) => handle_change("password", e.target.value)}
                                    />
                                </div>
                                
                            </div>

                            <div className={styles.field}>
                                
                                <div className={styles.field_title}>
                                    <p>ID Utilisateur</p>
                                    <span>L'ID de votre compte sur la platforme</span>
                                </div>

                                <div className={styles.field_content}>
                                    <input type="text" className={styles.input_info} defaultValue={account_data.user_id} readOnly/>
                                </div>
                                
                            </div>

                            
                        </section>
                    )}

                    {active_tab == "minecraft" && (
                        <section className={styles.section}>
                            <h2>Minecraft</h2>
                            <p>Configuration du dossier mods pour l'installation des modpacks</p>

                            <div className={styles.field}>
                                <div className={styles.field_title}>
                                    <p>Dossier mods actuel</p>
                                    <span>{isConfigured ? "Configuré" : "Non configuré"}</span>
                                </div>
                                <div className={styles.field_content}>
                                    {isConfigured ? (
                                        <div className={styles.path_display}>
                                            <HardDrive size={16} />
                                            <code>{modsPath}</code>
                                        </div>
                                    ) : (
                                        <span className={styles.empty_path}>Aucun dossier configuré</span>
                                    )}
                                </div>
                            </div>

                            <div className={styles.field}>
                                <div className={styles.field_title}>
                                    <p>Actions</p>
                                    <span>Détecter ou choisir le dossier mods</span>
                                </div>
                                <div className={styles.field_content}>
                                    <div className={styles.action_buttons}>
                                        <button
                                            className={styles.action_button}
                                            onClick={handle_mc_auto_detect}
                                            disabled={isLoading || mc_saving}
                                        >
                                            <RefreshCw size={16} className={isLoading ? styles.spinning : ""} />
                                            Auto-détecter
                                        </button>
                                        <button
                                            className={styles.action_button}
                                            onClick={handle_mc_pick_folder}
                                            disabled={mc_saving}
                                        >
                                            <FolderOpen size={16} />
                                            Choisir manuellement
                                        </button>
                                    </div>
                                </div>
                            </div>

                            {mc_notice.message && (
                                <div className={`${styles.mc_notice} ${styles[`mc_notice_${mc_notice.type}`]}`}>
                                    {mc_notice.type === "success" && <CheckCircle size={16} />}
                                    {mc_notice.type === "error" && <AlertCircle size={16} />}
                                    {mc_notice.type === "warning" && <AlertCircle size={16} />}
                                    {mc_notice.type === "info" && <RefreshCw size={16} />}
                                    <span>{mc_notice.message}</span>
                                </div>
                            )}

                            {detectedPaths.length > 0 && (
                                <div className={styles.field}>
                                    <div className={styles.field_title}>
                                        <p>Installations détectées</p>
                                        <span>Cliquez pour sélectionner</span>
                                    </div>
                                    <div className={styles.field_content}>
                                        <div className={styles.detected_list}>
                                            {detectedPaths.map((detected, idx) => (
                                                <button
                                                    key={`${detected.path}-${idx}`}
                                                    className={`${styles.detected_item} ${selectedPath === detected.path ? styles.detected_selected : ""}`}
                                                    onClick={() => handle_mc_select_detected(detected.path, detected.label, detected.launcherType)}
                                                    disabled={mc_saving}
                                                >
                                                    <div className={styles.detected_info}>
                                                        <span className={styles.detected_label}>{detected.label}</span>
                                                        <span className={styles.detected_path}>{detected.path}</span>
                                                    </div>
                                                    <div className={styles.detected_badges}>
                                                        <span className={`${styles.launcher_badge} ${styles[`launcher_${detected.launcherType}`]}`}>
                                                            {detected.launcherType}
                                                        </span>
                                                        {detected.valid && <CheckCircle size={14} className={styles.valid_icon} />}
                                                    </div>
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className={styles.field}>
                                <div className={styles.field_title}>
                                    <p>Chemin sélectionné</p>
                                    <span>{selectedPath ? "Prêt à sauvegarder" : "Aucun chemin sélectionné"}</span>
                                </div>
                                <div className={styles.field_content}>
                                    <input
                                        type="text"
                                        className={styles.input_info}
                                        value={selectedPath}
                                        onChange={(e) => set_selected_path(e.target.value)}
                                        placeholder="Chemin vers le dossier mods..."
                                        readOnly
                                    />
                                </div>
                            </div>

                            <div className={styles.field}>
                                <div className={styles.field_content}>
                                    <button
                                        className={styles.save_button}
                                        onClick={handle_mc_save}
                                        disabled={!selectedPath.trim() || mc_saving}
                                    >
                                        {mc_saving ? "Sauvegarde..." : "Enregistrer la configuration"}
                                    </button>
                                </div>
                            </div>
                        </section>
                    )}

                    {unsaved && (
                        <div className={`${styles.unsaved_notice} ${notice_error !== "" ? styles.unsaved_notice_error : ''}`}>
                            <div className={styles.unsaved_notice_content}>
                                <span>Des changements ont été effectués mais n'ont pas été enregistrés.</span>
                                <button className={styles.save_button} onClick={handle_save}>
                                    Enregistrer
                                </button>
                            </div>
                            
                            {notice_error !== "" && (
                                <span className={styles.unsaved_notice_error_message}>{notice_error}</span>
                            )}
                        </div>
                    )}
                 
                </div>

                

            </div>
        </div>
    )
}