
import {
  Download,
  ExternalLink,
  Monitor,
  Terminal,
} from "lucide-react";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import styles from "./page.module.css";

const RELEASES_API_URL = "https://api.github.com/repos/Arthur640-ctrl/Modyx-Releases/releases/latest"

const RELEASES_URL = "https://github.com/Arthur640-ctrl/Modyx-Releases/releases"

function getPlatform(name) {
  const file = name.toLowerCase()

  if (/\.(exe|msi|msix|appx)$/.test(file)) return "windows"

  if (
    /\.(appimage|deb|rpm|tar\.gz|tar\.xz|tgz|tar\.bz2)$/.test(file)
  ) {
    return "linux"
  }

  return null
}

function getFormat(name) {
  const file = name.toLowerCase();

  if (file.endsWith(".exe")) return "EXE";
  if (file.endsWith(".msi")) return "MSI";
  if (file.endsWith(".msix")) return "MSIX";
  if (file.endsWith(".appx")) return "APPX";
  if (file.endsWith(".appimage")) return "AppImage";
  if (file.endsWith(".deb")) return "DEB";
  if (file.endsWith(".rpm")) return "RPM";
  if (file.endsWith(".tar.gz")) return "TAR.GZ";
  if (file.endsWith(".tar.xz")) return "TAR.XZ";
  if (file.endsWith(".tgz")) return "TGZ";
  if (file.endsWith(".tar.bz2")) return "TAR.BZ2";

  return "Fichier";
}

function formatSize(bytes) {
  if (!bytes) return "—";

  return bytes >= 1024 ** 3
    ? `${(bytes / 1024 ** 3).toFixed(2)} Go`
    : `${(bytes / 1024 ** 2).toFixed(1)} Mo`;
}

function formatDate(date) {
  if (!date) return null;

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

async function getLatestRelease() {
  const response = await fetch(RELEASES_API_URL, {
    headers: {
      Accept: "application/vnd.github+json",
    },
    next: { revalidate: 300 },
  });

  if (!response.ok) {
    throw new Error("Impossible de récupérer la release.");
  }

  const data = await response.json();

  const assets = (data.assets || [])
    .map((asset) => ({
      ...asset,
      platform: getPlatform(asset.name),
    }))
    .filter((asset) => asset.platform);

  return {
    name: data.name || data.tag_name,
    tagName: data.tag_name,
    publishedAt: data.published_at,
    url: data.html_url,
    assets,
  };
}

export default async function DownloadPage() {
  let release = null;

  try {
    release = await getLatestRelease();
  } catch {
    // Le lien vers GitHub reste accessible en cas d'erreur.
  }

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <div className={styles.heading}>
          <div>
            <h1>Téléchargements</h1>
            <p>
              Téléchargez Modyx pour votre système d'exploitation.
            </p>
          </div>

          <a
            href={RELEASES_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={styles.github_link}
          >
            Toutes les versions
            <ExternalLink size={15} />
          </a>
        </div>

        {release ? (
          <>
            {/* <div className={styles.version_bar}>
              <div className={styles.version_info}>
                <span className={styles.status_dot} />
                <span className={styles.version_label}>
                  Dernière version
                </span>
                <span className={styles.version_number}>
                  {release.tagName}
                </span>
              </div>

              {release.publishedAt && (
                <span className={styles.release_date}>
                  Publiée le {formatDate(release.publishedAt)}
                </span>
              )}
            </div> */}

            <div className={styles.table_wrapper}>
              <table className={styles.table}>
                <thead>
                  <tr>
                    <th>Plateforme</th>
                    <th>Fichier</th>
                    <th>Format</th>
                    <th>Taille</th>
                    <th aria-label="Télécharger" />
                  </tr>
                </thead>

                <tbody>
                  {release.assets.map((asset) => {
                    const isWindows = asset.platform === "windows";
                    const PlatformIcon = isWindows ? Monitor : Terminal;

                    return (
                      <tr key={asset.id}>
                        <td>
                          <div className={styles.platform}>
                            <PlatformIcon size={17} />
                            <span>
                              {isWindows ? "Windows" : "Linux"}
                            </span>
                          </div>
                        </td>

                        <td>
                          <span className={styles.filename}>
                            {asset.name}
                          </span>
                        </td>

                        <td>
                          <span className={styles.format}>
                            {getFormat(asset.name)}
                          </span>
                        </td>

                        <td className={styles.size}>
                          {formatSize(asset.size)}
                        </td>

                        <td className={styles.action_cell}>
                          <a
                            href={asset.browser_download_url}
                            className={styles.download_button}
                            aria-label={`Télécharger ${asset.name}`}
                          >
                            <Download size={16} />
                            <span>Télécharger</span>
                          </a>
                        </td>
                      </tr>
                    );
                  })}

                  {release.assets.length === 0 && (
                    <tr>
                      <td colSpan={5} className={styles.empty_state}>
                        Aucun installateur Windows ou Linux reconnu
                        dans cette version. Consultez les fichiers
                        disponibles sur GitHub.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className={styles.table_footer}>
              <span>
                {release.assets.length} fichier
                {release.assets.length > 1 ? "s" : ""} disponible
                {release.assets.length > 1 ? "s" : ""}
              </span>

              <a
                href={release.url}
                target="_blank"
                rel="noopener noreferrer"
              >
                Notes de version
                <ExternalLink size={14} />
              </a>
            </div>
          </>
        ) : (
          <div className={styles.error_state}>
            <p>
              Impossible de récupérer les téléchargements pour le
              moment.
            </p>
            <a href={RELEASES_URL} target="_blank" rel="noopener noreferrer">
              Accéder aux releases GitHub
              <ExternalLink size={15} />
            </a>
          </div>
        )}

      </main>

      <Footer />
    </div>
  );
}
