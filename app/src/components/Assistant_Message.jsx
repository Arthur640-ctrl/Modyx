import ReactMarkdown from "react-markdown"
import styles from "./Assistant_Message.module.css"
import { useState } from "react"
import { ChevronRight, Dot, Wrench, MessageSquare } from "lucide-react"

export default function Assistant_Message({ agent_run, summary }) {

    const [agent_steps_visible, set_agent_steps_visible] = useState(false)
    const steps = agent_run

    return (
        <div className={styles.message}>
            <div className={styles.message_content}>

                <button
                    className={styles.agent_role}
                    onClick={() => set_agent_steps_visible(!agent_steps_visible)}
                >
                    <span>Agent</span>

                    <div>
                        <ChevronRight
                            size={16}
                            className={
                                agent_steps_visible
                                    ? styles.chevron_active
                                    : ""
                            }
                        />
                    </div>
                </button>

                {agent_steps_visible && (
                    <div className={styles.agent_run}>
                        {steps.map((message, index) => (
                            message.role === "assistant" && (
                                <div key={index}>

                                    {message.content && (
                                        <div className={`${styles.agent_run_step} ${styles.step_content}`}>
                                            <Dot/>
                                            <div className={styles.step_content_content}>
                                                <div className={styles.step_content_content_header}>
                                                    <MessageSquare/>
                                                    <p>Réflexion : </p>
                                                </div>
                                                <div className={styles.step_content_content_content}>
                                                    <ReactMarkdown>
                                                        {message.content}
                                                    </ReactMarkdown>
                                                </div>
                                                
                                            </div>
                                        </div>
                                    )}

                                    {message.tool_calls?.map((tool, tool_index) => (
                                        <div className={`${styles.agent_run_step} ${styles.step_tool}`}>
                                            <Dot/>
                                            <div className={styles.step_tool_content}>
                                                <Wrench/>
                                                <p>Outils : </p>
                                                {tool.function.name}
                                            </div>
                                        </div>
                                    ))}

                                </div>
                            )
                        ))}
                    </div>
                )}

                <p className={styles.role}>
                    Réponse
                </p>

                <div className={styles.summary}>
                    <ReactMarkdown>
                        {summary || ""}
                    </ReactMarkdown>
                </div>

            </div>
        </div>
    )
}