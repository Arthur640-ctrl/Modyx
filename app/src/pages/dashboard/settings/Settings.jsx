import styles from './Settings.module.css'
import { useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { getAccount, updateAccountSettings } from '../../../utils/api/Account.api'
import pkg from '../../../../package.json'

export default function Settings() {
    const navigate = useNavigate()

    const [account_data, set_account_data] = useState({})
    const [form_data, set_form_data] = useState({
        pseudo: "",
        email: "",
        password: "",
    })

    const [active_tab, set_active_tab] = useState("general")
    const [notice_error, set_notice_error] = useState("")

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