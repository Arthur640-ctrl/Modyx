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
