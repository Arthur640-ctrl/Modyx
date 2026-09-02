import {
    ChevronDown,
    ExternalLink,
    FolderOpen,
    MoreHorizontal,
    PencilLine,
    Plus,
    Search,
    SendHorizonal,
    Settings,
    Share2,
    Sparkles,
    Trash2
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import { useLocation, useNavigate, useSearchParams } from "react-router-dom"
import styles from "./Editor.module.css"
import {
    send_modpack_chat,
    get_modpack,
    stream_agent_run,
    search_modrinth_projects,
    add_mod_to_modpack,
    remove_mod_from_modpack
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
    const [mod_add_modal_open, set_mod_add_modal_open] = useState(false)
    const [mod_search_query, set_mod_search_query] = useState("")
    const [mod_search_results, set_mod_search_results] = useState([])
    const [mod_search_loading, set_mod_search_loading] = useState(false)

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

    useEffect(() => {
        if (!mod_add_modal_open) return

        const delayed_search = setTimeout(async () => {
            const query = mod_search_query.trim()

            if (!query) {
                set_mod_search_results([])
                set_mod_search_loading(false)
                return
            }

            set_mod_search_loading(true)

            const result = await search_modrinth_projects(query, 20)

            if (result.success) {
                set_mod_search_results(result.data?.hits || [])
            } else {
                console.error("Failed to search mods:", result.error)
                set_mod_search_results([])
            }

            set_mod_search_loading(false)
        }, 300)

        return () => clearTimeout(delayed_search)
    }, [mod_add_modal_open, mod_search_query])


    // Code
    const [sidebar_screen, set_sidebar_screen] = useState("")
    const [active_sidebar_tab, set_active_sidebar_tab] = useState("mods")
    const [mod_search, set_mod_search] = useState("")
    const [prompt, set_prompt] = useState("")

    const mod_entries = Array.isArray(modpack_data?.state?.mods)
        ? modpack_data.state.mods
        : []

    const filtered_mod_entries = mod_entries.filter((mod) => {
        const search = mod_search.trim().toLowerCase()

        if (!search) return true

        return [mod.title, mod.mod_id, mod.version_id]
            .filter(Boolean)
            .some((value) => value.toLowerCase().includes(search))
    })

    async function remove_mod_from_list(mod_to_remove) {
        if (!modpack_id || !mod_to_remove?.mod_id) return

        const result = await remove_mod_from_modpack(
            modpack_id,
            mod_to_remove.mod_id,
            mod_to_remove.version_id || null
        )

        if (!result.success) {
            console.error("Failed to remove mod:", result.error)
            return
        }

        const modpack_result = await get_modpack(modpack_id)

        if (modpack_result.success) {
            set_modpack_data(modpack_result.data)
        }
    }

    async function add_mod_to_pack(mod) {
        if (!modpack_id || !mod?.mod_id) return

        const result = await add_mod_to_modpack(
            modpack_id,
            mod.mod_id,
            mod.version_id || null,
            mod.title || mod.slug || ""
        )

        if (!result.success) {
            console.error("Failed to add mod:", result.error)
            return
        }

        set_mod_add_modal_open(false)
        set_mod_search_query("")
        set_mod_search_results([])

        const modpack_result = await get_modpack(modpack_id)

        if (modpack_result.success) {
            set_modpack_data(modpack_result.data)
        }
    }

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

            {mod_add_modal_open && (
                <div className={styles.mod_modal_backdrop} role="presentation" onClick={() => set_mod_add_modal_open(false)}>
                    <div className={styles.mod_modal} role="dialog" aria-modal="true" aria-labelledby="mod-modal-title" onClick={(event) => event.stopPropagation()}>
                        <div className={styles.mod_modal_header}>
                            <h2 id="mod-modal-title">Ajouter un mod</h2>
                            <button type="button" className={styles.mod_modal_close_button} onClick={() => set_mod_add_modal_open(false)}>
                                Fermer
                            </button>
                        </div>

                        <div className={styles.mod_modal_search_wrapper}>
                            <Search size={14} className={styles.mod_search_icon} />
                            <input
                                type="search"
                                value={mod_search_query}
                                onChange={(event) => set_mod_search_query(event.target.value)}
                                placeholder="Rechercher un mod Modrinth"
                                className={styles.mod_search_input}
                                autoFocus
                            />
                        </div>

                        <div className={styles.mod_modal_list}>
                            {mod_search_loading && (
                                <div className={styles.empty_mod_state}>Recherche en cours...</div>
                            )}

                            {!mod_search_loading && mod_search_results.length === 0 && mod_search_query.trim() && (
                                <div className={styles.empty_mod_state}>Aucun mod trouvé.</div>
                            )}

                            {!mod_search_loading && !mod_search_query.trim() && (
                                <div className={styles.empty_mod_state}>Tapez un nom de mod pour commencer.</div>
                            )}

                            {!mod_search_loading && mod_search_results.map((mod) => (
                                <div key={mod.mod_id} className={styles.mod_modal_item}>
                                    <div className={styles.mod_modal_identity}>
                                        <span className={styles.mod_name}>{mod.title || mod.slug || "Mod sans nom"}</span>
                                        <span className={styles.mod_id}>{mod.mod_id || "ID introuvable"}</span>
                                    </div>

                                    <button
                                        type="button"
                                        className={styles.mod_modal_add_button}
                                        onClick={() => add_mod_to_pack(mod)}
                                    >
                                        Ajouter
                                    </button>
                                </div>
                            ))}
                        </div>
                    </div>
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
                <aside className={styles.sidebar_container}>
                    <div className={styles.sidebar_tabs}>
                        {[
                            { id: "mods", label: "Mods" },
                            { id: "settings", label: "Paramètres" }
                        ].map((tab) => (
                            <button
                                key={tab.id}
                                type="button"
                                className={
                                    active_sidebar_tab === tab.id
                                        ? styles.sidebar_tab_active
                                        : styles.sidebar_tab
                                }
                                onClick={() => set_active_sidebar_tab(tab.id)}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>

                    {active_sidebar_tab === "mods" && (
                        <div className={styles.mod_list_panel}>
                            <div className={styles.mod_search_wrapper}>
                                <div className={styles.mod_search_field}>
                                    <Search size={14} className={styles.mod_search_icon} />
                                    <input
                                        type="search"
                                        value={mod_search}
                                        onChange={(event) => set_mod_search(event.target.value)}
                                        placeholder="Rechercher un mod"
                                        className={styles.mod_search_input}
                                    />
                                </div>

                                <button
                                    type="button"
                                    className={styles.add_mod_button}
                                    onClick={() => set_mod_add_modal_open(true)}
                                    title="Ajouter un mod"
                                    aria-label="Ajouter un mod"
                                >
                                    <Plus size={16} />
                                </button>
                            </div>

                            <div className={styles.mod_list}>
                                {filtered_mod_entries.length > 0 ? (
                                    filtered_mod_entries.map((mod, index) => (
                                        <div
                                            key={`${mod.mod_id ?? "mod"}-${mod.version_id ?? index}`}
                                            className={styles.mod_row}
                                            title={`version_id: ${mod.version_id ?? "N/A"}\nmod_id: ${mod.mod_id ?? "N/A"}`}
                                        >
                                            <div className={styles.mod_identity}>
                                                <span className={styles.mod_name}>{mod.title || "Mod sans nom"}</span>
                                                <span className={styles.mod_id}>{mod.mod_id || "ID introuvable"}</span>
                                            </div>

                                            <button
                                                type="button"
                                                className={styles.delete_mod_button}
                                                onClick={() => remove_mod_from_list(mod)}
                                                title="Supprimer le mod"
                                                aria-label={`Supprimer ${mod.title || "le mod"}`}
                                            >
                                                <Trash2 size={14} />
                                            </button>
                                        </div>
                                    ))
                                ) : (
                                    <div className={styles.empty_mod_state}>
                                        Aucun mod ne correspond à votre recherche.
                                    </div>
                                )}
                            </div>
                        </div>
                    )}

                    {active_sidebar_tab !== "mods" && (
                        <div className={styles.empty_tab_state}>
                            Cet onglet est vide pour le moment.
                        </div>
                    )}
                </aside>

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
