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

export async function logout() {
    localStorage.removeItem("modyx_token")
    navigate("/", { replace: true })

    return true
}