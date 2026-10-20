import { API_URL } from "./api"

export async function getAccount() {
    const token = localStorage.getItem("modyx_token")

    if (!token) {
        return {
            success: false,
            error: "No token found"
        }
    }

    try {
        const response = await fetch(`${API_URL}/account/me`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            }
        })

        const response_data = await response.json()

        if (!response.ok) {
            return {
                success: false,
                error: response_data.detail || "Unauthorized",
                data: null
            }
        }

        return {
            success: true,
            data: response_data
        }
    } catch (error) {
        return {
            success: false,
            error,
            data: null
        }
    }
}

export async function updateAccountSettings(setting_key, new_value) {
    const token = localStorage.getItem("modyx_token")

    if (!token) {
        return {
            success: false,
            error: "No token found",
            data: null
        }
    }

    try {
        const response = await fetch(`${API_URL}/account/settings/update`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                setting_key,
                new_value
            })
        })

        const response_data = await response.json()

        if (!response.ok) {
            return {
                success: false,
                error: response_data.detail || "An error occurred",
                data: null
            }
        }

        return {
            success: true,
            data: response_data
        }
    } catch (error) {
        return {
            success: false,
            error: error.message || "Network error",
            data: null
        }
    }
}
