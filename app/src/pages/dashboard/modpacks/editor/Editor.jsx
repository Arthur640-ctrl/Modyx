import {
    ChevronDown,
    ExternalLink,
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
    const chat_messages_ref = useRef(null)
    const should_auto_scroll_ref = useRef(true)
    const is_streaming_ref = useRef(false)
    const [modpack_id, set_modpack_id] = useState("")
    const [modpack_data, set_modpack_data] = useState({})
    const [stream_messages, set_stream_messages] = useState([])
    const [stream_user_message, set_stream_user_message] = useState(null)
    const [is_streaming, set_is_streaming] = useState(false)
    const [credits_error, set_credits_error] = useState(null)

    function scroll_chat_to_bottom(force = false) {
        const chat_messages = chat_messages_ref.current

        if (!chat_messages) return
        if (!force && !should_auto_scroll_ref.current) return

        chat_messages.scrollTo({
            top: chat_messages.scrollHeight,
            behavior: "auto"
        })
    }

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

    function reset_prompt_textarea() {
        if (!textarea_ref.current) return

        textarea_ref.current.style.height = "48px"
        textarea_ref.current.style.overflowY = "hidden"
        textarea_ref.current.focus()
    }

    function handle_chat_scroll() {
        const chat_messages = chat_messages_ref.current

        if (!chat_messages || !is_streaming_ref.current) return

        const distance_from_bottom =
            chat_messages.scrollHeight -
            (chat_messages.scrollTop + chat_messages.clientHeight)

        should_auto_scroll_ref.current = distance_from_bottom <= 24
    }

    useEffect(() => {
        is_streaming_ref.current = is_streaming
    }, [is_streaming])

    useEffect(() => {
        const animation_frame = requestAnimationFrame(() => {
            if (is_streaming) {
                scroll_chat_to_bottom()
                return
            }

            scroll_chat_to_bottom(true)
        })

        return () => cancelAnimationFrame(animation_frame)
    }, [
        modpack_data.conversation?.history,
        stream_messages.length,
        stream_user_message,
        is_streaming
    ])

    async function send_prompt() {
        const value = prompt.trim()

        if (!value || !modpack_id || is_streaming) return

        set_prompt("")
        set_stream_user_message(value)
        set_is_streaming(true)
        should_auto_scroll_ref.current = true
        reset_prompt_textarea()

        requestAnimationFrame(() => {
            scroll_chat_to_bottom(true)
        })

        const result = await send_modpack_chat(value, modpack_id)

        if (!result.success) {
            console.error("Failed to send prompt:", result.error)
            set_stream_user_message(null)
            set_is_streaming(false)
            if (result.status === 402 || result.error?.error === 402) {
                set_credits_error(result.error)
            }
            return
        }

        const agent_run_id = result.data.agent_run

        try {
            await stream_agent_run(
                agent_run_id,
                (stream) => {
                    set_stream_messages(stream)

                    requestAnimationFrame(() => {
                        scroll_chat_to_bottom()
                    })
                }
            )
        } finally {
            set_stream_user_message(null)
            set_stream_messages([])
            set_is_streaming(false)
            should_auto_scroll_ref.current = true
        }

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
    }

    function open_pricing() {
        const pricing_url = "http://localhost:3000/pricing"
        const user_id = localStorage.getItem("modyx_user_id")
        const url = user_id
            ? `${pricing_url}?user_id=${encodeURIComponent(user_id)}`
            : pricing_url

        if (window.modyx?.openExternal) {
            window.modyx.openExternal(url).catch((error) => {
                console.error("Impossible d'ouvrir la page des plans :", error)
            })
            return
        }

        window.open(url, "_blank", "noopener,noreferrer")
    }

    function format_retry_date(value) {
        if (!value) return "la prochaine période de facturation"

        const date = new Date(value)
        if (Number.isNaN(date.getTime())) return "la prochaine période de facturation"

        return date.toLocaleDateString("fr-FR", {
            day: "numeric",
            month: "long",
            year: "numeric"
        })
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

            {credits_error && (
                <div className={styles.credit_modal_backdrop} role="presentation">
                    <section className={styles.credit_modal} role="dialog" aria-modal="true" aria-labelledby="credit-modal-title">
                        <h2 id="credit-modal-title">Crédits insuffisants</h2>
                        <p>
                            Vous n'avez plus assez de crédits pour lancer l'assistant.
                            Vous pouvez upgrader votre plan ou attendre le renouvellement du
                            {` ${format_retry_date(credits_error.retry_at)}.`}
                        </p>
                        <div className={styles.credit_modal_actions}>
                            <button type="button" className={styles.credit_upgrade_button} onClick={open_pricing}>
                                Upgrader mon plan <ExternalLink size={16} />
                            </button>
                            <button type="button" className={styles.credit_close_button} onClick={() => set_credits_error(null)}>
                                Fermer
                            </button>
                        </div>
                    </section>
                </div>
            )}

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

                    <div
                        ref={chat_messages_ref}
                        className={styles.chat_messages}
                        onScroll={handle_chat_scroll}
                    >
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
                            disabled={!prompt.trim() || is_streaming}
                        >
                            <SendHorizonal size={18} />
                        </button>
                    </div>

                </div>
            </div>
        </div>
    )
}
