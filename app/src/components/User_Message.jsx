import styles from "./User_Message.module.css"

export default function User_Message({ content }) {
    return (
        <div className={`${styles.message}`}>
            <p className={styles.role}>Vous</p>
            <div className={styles.message_content}>
                {content}
            </div>
        </div>
    )
}