"use client";

import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";
import { ArrowUpRight, ChevronDown } from "lucide-react";

import Header from "../../components/Header";
import Footer from "../../components/Footer";
import styles from "./page.module.css";

const API_URL =
  "https://api.github.com/repos/Arthur640-ctrl/Modyx-Releases/releases?per_page=30";

function formatDate(date) {
  if (!date) return "";

  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(date));
}

export default function ChangelogPage() {
  const [releases, setReleases] = useState([]);
  const [expandedId, setExpandedId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  useEffect(() => {
    const controller = new AbortController();

    async function fetchReleases() {
      try {
        const response = await fetch(API_URL, {
          signal: controller.signal,
          headers: {
            Accept: "application/vnd.github+json",
          },
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error("Impossible de charger les versions.");
        }

        const data = await response.json();

        setReleases(
          data.filter((release) => !release.draft)
        );
      } catch (err) {
        if (err.name !== "AbortError") {
          setError(true);
        }
      } finally {
        if (!controller.signal.aborted) {
          setLoading(false);
        }
      }
    }

    fetchReleases();

    return () => controller.abort();
  }, []);

  return (
    <div className={styles.page}>
      <Header />

      <main className={styles.main}>
        <h1 className={styles.title}>Changelog</h1>

        <section className={styles.history}>
          {loading ? (
            <p className={styles.message}>
              Chargement des versions…
            </p>
          ) : error ? (
            <div className={styles.message}>
              <p>Impossible de charger les versions.</p>
              <button
                className={styles.retry}
                onClick={() => window.location.reload()}
              >
                Réessayer
              </button>
            </div>
          ) : releases.length === 0 ? (
            <p className={styles.message}>
              Aucune version publiée pour le moment.
            </p>
          ) : (
            releases.map((release) => {
              const isOpen = expandedId === release.id;
              const date =
                release.published_at || release.created_at;

              return (
                <article
                  key={release.id}
                  className={styles.release}
                >
                  <button
                    type="button"
                    className={styles.release_button}
                    aria-expanded={isOpen}
                    aria-controls={`release-${release.id}`}
                    onClick={() =>
                      setExpandedId((current) =>
                        current === release.id
                          ? null
                          : release.id
                      )
                    }
                  >
                    <span className={styles.release_version}>
                      {release.name || release.tag_name}
                    </span>

                    <span className={styles.release_date}>
                      {formatDate(date)}
                    </span>

                    <ChevronDown
                      size={16}
                      className={`${styles.chevron} ${
                        isOpen ? styles.chevron_open : ""
                      }`}
                    />
                  </button>

                  {isOpen && (
                    <div
                      id={`release-${release.id}`}
                      className={styles.release_content}
                    >
                      {release.body?.trim() ? (
                        <div className={styles.markdown}>
                          <ReactMarkdown>
                            {release.body}
                          </ReactMarkdown>
                        </div>
                      ) : (
                        <p className={styles.message}>
                          Aucune note de version disponible.
                        </p>
                      )}

                      <a
                        href={release.html_url}
                        target="_blank"
                        rel="noreferrer"
                        className={styles.github_link}
                      >
                        Voir sur GitHub
                        <ArrowUpRight size={15} />
                      </a>
                    </div>
                  )}
                </article>
              );
            })
          )}
        </section>

        <section className={styles.cta}>
          <div>
            <h2>Prêt à créer ton prochain modpack ?</h2>
            <p>
              Télécharge Modyx et donne vie à tes idées.
            </p>
          </div>

          <a href="/download" className={styles.cta_button}>
            Télécharger Modyx
            <ArrowUpRight size={16} />
          </a>
        </section>
      </main>

      <Footer />
    </div>
  );
}
