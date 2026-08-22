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

export async function get_modpack(modpack_id) {
    const token = localStorage.getItem("modyx_token")

    if (!token) {
        return {
            success: false,
            error: "No token found",
            data: null
        }
    }

    try {
        const response = await fetch(`${API_URL}/modpacks/${modpack_id}`, {
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
                error: response_data.detail || "Failed to get modpack",
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

export async function send_modpack_chat(prompt, modpack_id) {
    const token = localStorage.getItem("modyx_token")

    if (!token) {
        return {
            success: false,
            error: "No token found",
            data: null
        }
    }

    try {
        const response = await fetch(`${API_URL}/modpacks/chat`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${token}`
            },
            body: JSON.stringify({
                prompt,
                modpack_id
            })
        })

        const response_data = await response.json()

        if (!response.ok) {
            return {
                success: false,
                error: response_data.detail || "Failed to send message",
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

export async function stream_agent_run(agent_run_id, on_message) {
    const token = localStorage.getItem("modyx_token")

    if (!token) {
        return {
            success: false,
            error: "No token found"
        }
    }

    try {
        const response = await fetch(
            `${API_URL}/modpacks/stream/${agent_run_id}`,
            {
                method: "GET",
                headers: {
                    "Authorization": `Bearer ${token}`,
                    "Accept": "text/event-stream"
                }
            }
        )

        if (!response.ok) {
            return {
                success: false,
                error: "Failed to connect to stream"
            }
        }

        const reader = response.body.getReader()
        const decoder = new TextDecoder()

        let buffer = ""

        while (true) {
            const { value, done } = await reader.read()

            if (done) break

            buffer += decoder.decode(value, {
                stream: true
            })

            const events = buffer.split("\n\n")

            buffer = events.pop()

            for (const event of events) {

                if (!event.startsWith("data:")) {
                    continue
                }

                const json = event.slice(5).trim()

                if (!json) {
                    continue
                }

                try {
                    const data = JSON.parse(json)

                    // console.log(
                    //     "[MODYX STREAM]",
                    //     data
                    // )

                    on_message(data)

                } catch (error) {
                    console.error(
                        "[MODYX STREAM] Invalid JSON:",
                        json
                    )
                }
            }
        }

        return {
            success: true
        }

    } catch (error) {
        return {
            success: false,
            error: error.message || "Stream connection failed"
        }
    }
}