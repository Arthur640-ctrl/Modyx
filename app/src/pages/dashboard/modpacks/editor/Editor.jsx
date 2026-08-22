import {
    ChevronDown,
    FolderOpen,
    MoreHorizontal,
    PencilLine,
    SendHorizonal,
    Settings,
    Share2,
    Sparkles
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import styles from "./Editor.module.css"
import {
    send_modpack_chat,
    get_modpack,
    stream_agent_run
} from "../../../../utils/api/Modpacks.api"
import User_Message from "../../../../components/User_Message.jsx"
import Assistant_Message from "../../../../components/Assistant_Message.jsx"

export default function Editor() {
    // Config
    const location = useLocation()
    const navigate = useNavigate()
    const textarea_ref = useRef(null)
    const [modpack_id, set_modpack_id] = useState("")
    const [modpack_data, set_modpack_data] = useState({})
    const [stream_messages, set_stream_messages] = useState([])
    const [stream_user_message, set_stream_user_message] = useState(null)

    useEffect(() => {
        const next_modpack_id = location.state?.modpack_id ?? null

        set_modpack_id(next_modpack_id)

        if (!next_modpack_id) {
            navigate("/dashboard/modpacks", { replace: true })
            return
        }

        async function load_modpack() {
            const result = await get_modpack(next_modpack_id)

            if (!result.success) {
                console.error("Failed to load modpack:", result.error)
                return
            }

            set_modpack_data(result.data)
        }

        load_modpack()

    }, [location.state, navigate])


    // Code
    const [sidebar_screen, set_sidebar_screen] = useState("")
    const [prompt, set_prompt] = useState("")

    async function send_prompt() {
        const value = prompt.trim()

        if (!value || !modpack_id) return

        // Message utilisateur temporaire
        set_stream_user_message(value)

        const result = await send_modpack_chat(value, modpack_id)

        if (!result.success) {
            console.error("Failed to send prompt:", result.error)
            set_stream_user_message(null)
            return
        }

        const agent_run_id = result.data.agent_run

        await stream_agent_run(
            agent_run_id,
            (stream) => {
                set_stream_messages(stream)
            }
        )

        // Reload modpack
        const modpack_result = await get_modpack(modpack_id)

        if (!modpack_result.success) {
            console.error(
                "Failed to reload modpack:",
                modpack_result.error
            )
        } else {
            set_modpack_data(modpack_result.data)
        }

        // Le stream est terminé
        set_stream_user_message(null)
        set_stream_messages([])

        set_prompt("")

        if (textarea_ref.current) {
            textarea_ref.current.style.height = "48px"
            textarea_ref.current.style.overflowY = "hidden"
            textarea_ref.current.focus()
        }
    }

    function handle_prompt_change(e) {
        const textarea = e.target

        const min_height = 48
        const max_height = 140

        // On reset pour obtenir le vrai scrollHeight
        textarea.style.height = "0px"

        const next_height = Math.min(
            Math.max(textarea.scrollHeight, min_height),
            max_height
        )

        textarea.style.height = `${next_height}px`

        textarea.style.overflowY =
            textarea.scrollHeight > max_height
                ? "auto"
                : "hidden"

        set_prompt(textarea.value)
    }

    return (
        <div className={styles.editor_screen}>

            <div>
                <div className={styles.header}>
                    <div className={styles.header_title}>
                        <FolderOpen size={18} />
                        <span>Edition : {modpack_data.display_name || "Null"}</span>
                    </div>
                </div>
            </div>

            <div className={styles.editor_container}>
                <div className={styles.chat_container}>

                    <div className={styles.chat_messages}>
                        {modpack_data.conversation?.history?.map((message, index) => (
                            message.role === "user" ? (
                                <User_Message
                                    key={index}
                                    content={message.content}
                                />
                            ) : (
                                <Assistant_Message
                                    key={index}
                                    agent_run={message.content.agent_run}
                                    summary={message.content.summary}
                                />
                            )
                        ))}

                        {stream_user_message && (
                            <User_Message
                                content={stream_user_message}
                            />
                        )}

                        {stream_messages.length > 0 && (
                            <Assistant_Message
                                agent_run={stream_messages}
                                summary={null}
                                stream={true}
                            />
                        )}
                    </div>

                    <div className={styles.prompt_bar}>
                        <textarea
                            ref={textarea_ref}
                            className={styles.prompt_input}
                            value={prompt}
                            onChange={handle_prompt_change}
                            onKeyDown={(e) => {
                                if (
                                    e.key === "Enter" &&
                                    !e.shiftKey &&
                                    !e.ctrlKey &&
                                    !e.metaKey
                                ) {
                                    e.preventDefault()
                                    send_prompt()
                                }
                            }}
                            placeholder="Écris ton prompt..."
                        />

                        <button
                            className={styles.send_button}
                            onClick={send_prompt}
                            title="Envoyer"
                            disabled={!prompt.trim()}
                        >
                            <SendHorizonal size={18} />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}
