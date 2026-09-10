import styles from "./Auth.module.css"
import { useEffect, useState } from "react"
import { useNavigate } from "react-router-dom"
import { register, login, verify_email, resend_verification } from "../../utils/api/Auth.api"
import { getAccount } from "../../utils/api/Account.api"

const EMAIL_VERIFICATION = true

export default function Auth() {
    const navigate = useNavigate()

    // UI
    const [screen, set_screen] = useState("welcome")
    const [auth_type, set_auth_type] = useState("register")
    const [is_loading, set_is_loading] = useState(false)
    const [verification_user_id, set_verification_user_id] = useState("")
    const [verification_code, set_verification_code] = useState("")
    const [verification_error, set_verification_error] = useState("")
    const [resend_loading, set_resend_loading] = useState(false)
    const [resend_message, set_resend_message] = useState("")
    const [resend_cooldown, set_resend_cooldown] = useState(0)

    // Fields
    const [email, set_email] = useState("")
    const [pseudo, set_pseudo] = useState("")
    const [password, set_password] = useState("")
    const [password_confirm, set_password_confirm] = useState("")
    const [register_checkbox, set_register_checkbox] = useState(false)

    // Errors
    const [errors, set_errors] = useState({
        email: "",
        pseudo: "",
        password: "",
        password_confirm: "",
        register_checkbox: "",
        form: ""
    })

    useEffect(() => {
        async function redirect_if_connected() {
            const token = localStorage.getItem("modyx_token")

            if (!token) {
                return
            }

            const response = await getAccount()

            if (response.success) {
                navigate("/dashboard", { replace: true })
            }
        }

        redirect_if_connected()
    }, [navigate])

    useEffect(() => {
        if (resend_cooldown <= 0) {
            return
        }

        const timer = setInterval(() => {
            set_resend_cooldown((current) => Math.max(0, current - 1))
        }, 1000)

        return () => clearInterval(timer)
    }, [resend_cooldown])

    function is_register_button() {
        const valid_email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

        if (!email.trim()) {
            return false
        }

        if (!valid_email) {
            return false
        }

        if (!pseudo.trim()) {
            return false
        }

        if (!password) {
            return false
        }

        if (!password_confirm) {
            return false
        }

        if (password_confirm !== password) {
            return false
        }

        if (!register_checkbox) {
            return false
        }

        return true
    }

    function is_login_button() {
        const valid_email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)

        if (!email.trim()) {
            return false
        }

        if (!valid_email) {
            return false
        }

        if (!password) {
            return false
        }

        return true
    }

    async function handle_register() {
        set_is_loading(true)

        const response = await register(pseudo, email, password)

        if (response.success === true) {
            if (EMAIL_VERIFICATION && !response.data.access_token) {
                set_verification_user_id(response.data.user_id)
                set_verification_code("")
                set_verification_error("")
            } else {
                localStorage.setItem("modyx_token", response.data.access_token)
                localStorage.setItem("modyx_user_id", response.data.user_id)
                navigate("/dashboard", { replace: true })
            }
        } else {
            set_errors(response.display_errors || {
                email: "",
                pseudo: "",
                password: "",
                password_confirm: "",
                register_checkbox: "",
                form: response.error || "Une erreur est survenue"
            })
        }

        set_is_loading(false)
    }

    async function handle_verify_email() {
        if (!/^\d{6}$/.test(verification_code)) {
            set_verification_error("Entre le code à 6 chiffres reçu par email.")
            return
        }

        set_is_loading(true)
        const response = await verify_email(verification_user_id, verification_code)

        if (response.success === true) {
            localStorage.setItem("modyx_token", response.data.access_token)
            localStorage.setItem("modyx_user_id", response.data.user_id)
            navigate("/dashboard", { replace: true })
        } else {
            set_verification_error(response.error || "Code de vérification invalide")
        }

        set_is_loading(false)
    }

    async function handle_resend_verification() {
        if (!verification_user_id || resend_cooldown > 0 || resend_loading) {
            return
        }

        set_resend_loading(true)
        set_resend_message("")
        set_verification_error("")

        const response = await resend_verification(verification_user_id)

        if (response.success) {
            set_verification_code("")
            set_resend_message("Un nouveau code a été envoyé.")
            set_resend_cooldown(60)
        } else {
            set_verification_error(response.error)
            if (response.retry_after > 0) {
                set_resend_cooldown(response.retry_after)
            }
        }

        set_resend_loading(false)
    }

    async function handle_login() {
        set_is_loading(true)

        const response = await login(email, password)

        if (response.success === true) {
            const token = response.data.access_token
            localStorage.setItem("modyx_token", token)
            localStorage.setItem("modyx_user_id", response.data.user_id)
            navigate("/dashboard", { replace: true })
        } else {
            set_errors(response.display_errors || {
                email: "",
                pseudo: "",
                password: "",
                password_confirm: "",
                register_checkbox: "",
                form: response.error || "Une erreur est survenue"
            })
        }

        set_is_loading(false)
    }

    return (
        <div className={styles.container}>

            {screen == "welcome" && (
                <div className={styles.screen}>
                    <button
                        className={styles.welcome_cta}
                        onClick={() => set_screen("auth")}
                    >
                        Commencer
                    </button>
                </div>
            )}

            {screen == "auth" && (
                <div className={styles.screen}>
                    <div className={styles.auth_form}>

                        {!verification_user_id && auth_type == "login" && (
                            <div className={styles.header}>
                                <h1>Connexion</h1>
                                <p>Connecte-toi à ton compte Modyx</p>
                            </div>
                        )}

                        {!verification_user_id && auth_type == "register" && (
                            <div className={styles.header}>
                                <h1>Inscription</h1>
                                <p>Crée-toi un compte Modyx</p>
                            </div>
                        )}

                        <form className={styles.form} noValidate>
                            {verification_user_id && (
                                <div className={styles.verification_panel}>
                                    <div className={styles.header}>
                                        <h1>Vérifie ton email</h1>
                                        <p>Entre le code à 6 chiffres envoyé à {email}.</p>
                                    </div>
                                    <label className={styles.field}>
                                        <span>Code de vérification</span>
                                        <input
                                            type="text"
                                            inputMode="numeric"
                                            autoComplete="one-time-code"
                                            maxLength={6}
                                            value={verification_code}
                                            onChange={(event) => {
                                                set_verification_code(event.target.value.replace(/\D/g, ""))
                                                set_verification_error("")
                                            }}
                                            placeholder="000000"
                                        />
                                    </label>
                                    <button
                                        type="button"
                                        className={styles.submit_button}
                                        disabled={is_loading || verification_code.length !== 6}
                                        onClick={handle_verify_email}
                                    >
                                        {is_loading ? <span className={styles.loader}></span> : "Vérifier mon email"}
                                    </button>
                                    <button
                                        type="button"
                                        className={styles.resend_button}
                                        disabled={resend_loading || resend_cooldown > 0}
                                        onClick={handle_resend_verification}
                                    >
                                        {resend_loading
                                            ? "Envoi..."
                                            : resend_cooldown > 0
                                                ? `Renvoyer le code (${resend_cooldown}s)`
                                                : "Renvoyer le code"}
                                    </button>
                                    <span className={styles.success_message}>{resend_message}</span>
                                    <span className={styles.field_error}>{verification_error}</span>
                                </div>
                            )}

                            {!verification_user_id && <label className={styles.field}>
                                <span>Email</span>

                                <input
                                    type="text"
                                    value={email}
                                    onChange={(event) => set_email(event.target.value)}
                                    placeholder="Entrez votre email"
                                />

                                <span className={styles.field_error}>
                                    {errors.email}
                                </span>
                            </label>}

                            {!verification_user_id && auth_type == "register" && (
                                <label className={styles.field}>
                                    <span>Pseudo</span>

                                    <input
                                        type="text"
                                        value={pseudo}
                                        onChange={(event) => set_pseudo(event.target.value)}
                                        placeholder="Choisissez un pseudo"
                                    />

                                    <span className={styles.field_error}>
                                        {errors.pseudo}
                                    </span>
                                </label>
                            )}

                            {!verification_user_id && <label className={styles.field}>
                                <span>Mot de passe</span>

                                <input
                                    type="password"
                                    value={password}
                                    onChange={(event) => set_password(event.target.value)}
                                    placeholder="Entrez votre mot de passe"
                                />

                                <span className={styles.field_error}>
                                    {errors.password}
                                </span>
                            </label>}

                            {!verification_user_id && auth_type == "register" && (
                                <label className={styles.field}>
                                    <span>Confirmation</span>

                                    <input
                                        type="password"
                                        value={password_confirm}
                                        onChange={(event) => set_password_confirm(event.target.value)}
                                        placeholder="Confirmez votre mot de passe"
                                    />

                                    <span className={styles.field_error}>
                                        {errors.password_confirm}
                                    </span>
                                </label>
                            )}

                            {!verification_user_id && <div className={styles.meta_row}>
                                {auth_type == "login" && (
                                    <a href="#" className={styles.link}>
                                        Mot de passe oublié ?
                                    </a>
                                )}

                                {auth_type == "register" && (
                                    <label className={styles.checkbox_register}>
                                        <input
                                            type="checkbox"
                                            checked={register_checkbox}
                                            onChange={(event) =>
                                                set_register_checkbox(event.target.checked)
                                            }
                                        />

                                        <span className={styles.checkbox_custom}></span>

                                        <span className={styles.checkbox_text}>
                                            J'accepte les{" "}
                                            <a href="#" className={styles.link}>
                                                Conditions d'utilisation
                                            </a>{" "}
                                            et la{" "}
                                            <a href="#" className={styles.link}>
                                                Politique de confidentialité
                                            </a>
                                        </span>

                                        <span className={styles.field_error}>
                                            {errors.register_checkbox}
                                        </span>
                                    </label>
                                )}
                            </div>}

                            {!verification_user_id && auth_type == "register" && (
                                <div className={styles.footer_button_container}>
                                    <button
                                        type="button"
                                        className={styles.submit_button}
                                        disabled={!is_register_button()}
                                        onClick={handle_register}
                                    >
                                        {is_loading ? (
                                            <span className={styles.loader}></span>
                                        ) : (
                                            "S'inscrire"
                                        )}
                                    </button>

                                    <span className={styles.field_error}>
                                        {errors.form}
                                    </span>
                                </div>
                            )}

                            {!verification_user_id && auth_type == "login" && (
                                <div className={styles.footer_button_container}>
                                    <button
                                        type="button"
                                        className={styles.submit_button}
                                        disabled={!is_login_button()}
                                        onClick={handle_login}
                                    >
                                        {is_loading ? (
                                            <span className={styles.loader}></span>
                                        ) : (
                                            "Se connecter"
                                        )}
                                    </button>

                                    <span className={styles.field_error}>
                                        {errors.form}
                                    </span>
                                </div>
                            )}

                            {!verification_user_id && auth_type == "register" && (
                                <p className={styles.footer_text}>
                                    Déjà un compte ?{" "}
                                    <a
                                        href="#"
                                        className={styles.link}
                                        onClick={() => set_auth_type("login")}
                                    >
                                        Se connecter
                                    </a>
                                </p>
                            )}

                            {!verification_user_id && auth_type == "login" && (
                                <p className={styles.footer_text}>
                                    Pas encore de compte ?{" "}
                                    <a
                                        href="#"
                                        className={styles.link}
                                        onClick={() => set_auth_type("register")}
                                    >
                                        Créer un compte
                                    </a>
                                </p>
                            )}

                        </form>
                    </div>
                </div>
            )}

        </div>
    )
}