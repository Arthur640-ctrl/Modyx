import { API_URL } from "./api"

export async function get_modpacks_list() {
    const token = localStorage.getItem("modyx_token")

    if (!token) {
        return {
            success: false,
            error: "No token found"
        }
    }

    try {
        const response = await fetch(`${API_URL}/modpacks/`, {
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

export async function get_minecraft_versions() {
    const token = localStorage.getItem("modyx_token")

    if (!token) {
        return {
            success: false,
            error: "No token found"
        }
    }

    try {
        const response = await fetch(`${API_URL}/utils/minecraft/versions`, {
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

export async function create_modpack(name, minecraft_version, loader) {
    const token = localStorage.getItem("modyx_token")

    if (!token) {
        return {
            success: false,
            error: "No token found",
            data: null
        }
    }

    try {
        const response = await fetch(`${API_URL}/modpacks/new`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                name,
                minecraft_version,
                loader
            })
        })

        const response_data = await response.json()

        if (!response.ok) {
            return {
                success: false,
                error: response_data.detail || "Modpack creation failed",
                data: null
            }
        }

        return {
            success: true,
            data: response_data.data
        }
    } catch (error) {
        return {
            success: false,
            error: error.message || "Network error",
            data: null
        }
    }
}