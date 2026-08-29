import { API_URL } from "./api"
export async function register(pseudo, email, password) {

    const data = {
        "pseudo": pseudo,
        "email": email,
        "password": password
    }

    try {
        const response = await fetch(`${API_URL}/auth/register`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })

        const response_data = await response.json()

        if (response_data.error == "not") {
            return {
                "success": true,
                "data": response_data.data
            }
        } else {
            return {
                "success": false,
                "error": response_data.detail?.message,
                "display_errors": response_data.detail?.displayed_errors
            }
        }
    } catch (error) {
        return {
            "success": false,
            "error": error,
            "display_errors": {
                "email": "",
                "pseudo": "",
                "password": "",
                "password_confirm": "",
                "register_checkbox": "",
                "form": error
            }
        }
    }
}

export async function verify_email(user_id, code) {
    try {
        const response = await fetch(`${API_URL}/auth/verify-email`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                user_id,
                code
            })
        })

        const response_data = await response.json()

        if (response.ok && response_data.error === "not") {
            return {
                success: true,
                data: response_data.data
            }
        }

        return {
            success: false,
            error: response_data.detail?.message || "Code de vérification invalide"
        }
    } catch (error) {
        return {
            success: false,
            error: error.message || "Network error"
        }
    }
}

export async function resend_verification(user_id) {
    try {
        const response = await fetch(`${API_URL}/auth/resend-verification`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ user_id })
        })

        const response_data = await response.json()

        if (response.ok && response_data.error === "not") {
            return {
                success: true,
                data: response_data.data
            }
        }

        return {
            success: false,
            error: response_data.detail?.message || "Impossible de renvoyer le code",
            retry_after: response_data.detail?.retry_after || 0
        }
    } catch (error) {
        return {
            success: false,
            error: error.message || "Network error",
            retry_after: 0
        }
    }
}

export async function login(email, password) {

    const data = {
        "email": email,
        "password": password
    }

    try {
        const response = await fetch(`${API_URL}/auth/login`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(data)
        })

        const response_data = await response.json()

        if (response_data.error == "not") {
            return {
                "success": true,
                "data": response_data.data
            }
        } else {
            return {
                "success": false,
                "error": response_data.detail?.message,
                "display_errors": response_data.detail?.displayed_errors
            }
        }
    } catch (error) {
        return {
            "success": false,
            "error": error,
            "display_errors": {
                "email": "",
                "pseudo": "",
                "password": "",
                "password_confirm": "",
                "register_checkbox": "",
                "form": error
            }
        }
    }
}