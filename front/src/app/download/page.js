import { Download, ExternalLink, MonitorDown } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import styles from './page.module.css'

const RELEASES_API_URL = 'https://api.github.com/repos/Arthur640-ctrl/Modyx-Releases/releases/latest'
const RELEASES_URL = 'https://github.com/Arthur640-ctrl/Modyx-Releases/releases'

async function getLatestRelease() {
  const response = await fetch(RELEASES_API_URL, {
    headers: {
      Accept: 'application/vnd.github+json',
    },
    next: { revalidate: 300 },
  })

  if (!response.ok) {
    throw new Error(`GitHub a répondu avec le statut ${response.status}`)
  }

  const release = await response.json()
  const assets = (release.assets || []).filter((asset) => asset.name.toLowerCase().endsWith('.exe'))

  return {
    name: release.name || release.tag_name,
    tagName: release.tag_name,
    publishedAt: release.published_at,
    htmlUrl: release.html_url,
    assets,
  }
}

function formatReleaseDate(date) {
  if (!date) return ''

  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(date))
}

export default async function DownloadPage() {
  let release = null
  let error = null

  try {
    release = await getLatestRelease()
  } catch (fetchError) {
    error = fetchError
  }

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <section className={styles.hero}>
          <span className={styles.eyebrow}><MonitorDown size={16} /> Application Windows</span>
          <h1>Téléchargez Modyx</h1>
          <p>
            Installez la dernière version de Modyx pour créer vos modpacks Minecraft
            directement depuis votre ordinateur.
          </p>
        </section>

        {error && (
          <section className={styles.status_card} role="alert">
            <h2>Le téléchargement est temporairement indisponible</h2>
            <p>La dernière release n&apos;a pas pu être récupérée. Vous pouvez consulter les releases GitHub directement.</p>
            <a className={styles.secondary_button} href={RELEASES_URL} target="_blank" rel="noopener noreferrer">
              Voir les releases GitHub <ExternalLink size={17} />
            </a>
          </section>
        )}

        {release && (
          <section className={styles.release_card} aria-label={`Version ${release.name}`}>
            <div className={styles.release_header}>
              <div>
                <span className={styles.release_label}>Dernière version</span>
                <h2>{release.name}</h2>
                <p>
                  {release.tagName}
                  {release.publishedAt && ` · publiée le ${formatReleaseDate(release.publishedAt)}`}
                </p>
              </div>
              <ExternalLink className={styles.github_icon} size={32} aria-hidden="true" />
            </div>

            {release.assets.length > 0 ? (
              <div className={styles.asset_list}>
                {release.assets.map((asset) => (
                  <a
                    className={styles.asset}
                    href={asset.browser_download_url}
                    key={asset.id}
                  >
                    <div className={styles.asset_info}>
                      <Download size={20} />
                      <span>
                        <strong>{asset.name}</strong>
                        <small>{(asset.size / (1024 * 1024)).toFixed(1)} Mo · Windows</small>
                      </span>
                    </div>
                    <span className={styles.asset_action}>Télécharger</span>
                  </a>
                ))}
              </div>
            ) : (
              <p className={styles.empty_state}>Aucun installateur Windows n&apos;est disponible dans cette release.</p>
            )}

            <a className={styles.release_link} href={release.htmlUrl} target="_blank" rel="noopener noreferrer">
              Consulter la release sur GitHub <ExternalLink size={15} />
            </a>
          </section>
        )}

        <p className={styles.note}>
          Modyx est actuellement disponible uniquement pour Windows via un installateur .exe.
        </p>
      </main>
      <Footer />
    </div>
  )
}
