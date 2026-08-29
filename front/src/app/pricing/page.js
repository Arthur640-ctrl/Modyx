'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { ArrowRight, Download, Users } from 'lucide-react'
import Header from '../../components/Header'
import Footer from '../../components/Footer'
import styles from './page.module.css'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://127.0.0.1:8000'

export default function PricingPage() {
  const [data, setData] = useState(null)
  const [error, setError] = useState('')
  const [userValidation, setUserValidation] = useState(null)
  const [userId] = useState(() => (
    typeof window === 'undefined'
      ? ''
      : new URLSearchParams(window.location.search).get('user_id') || ''
  ))

  useEffect(() => {
    const requests = [
      fetch(`${API_URL}/global/`).then((response) => {
        if (!response.ok) throw new Error('Impossible de charger les plans')
        return response.json()
      }),
    ]

    if (userId) {
      requests.push(
        fetch(`${API_URL}/global/validate-user/${encodeURIComponent(userId)}`)
          .then((response) => {
            if (!response.ok) throw new Error('Impossible de vérifier le compte')
            return response.json()
          })
      )
    }

    Promise.all(requests)
      .then(([globalData, validationData]) => {
        setData(globalData)
        setUserValidation(userId ? validationData.valid : false)
      })
      .catch((fetchError) => setError(fetchError.message))
  }, [userId])

  return (
    <div className={styles.page}>
      <Header />
      <main className={styles.main}>
        <section className={styles.hero}>
          <span className={styles.eyebrow}>Modyx Premium</span>
          <h1>Choisissez le plan qui vous convient.</h1>
          <p>Des crédits supplémentaires pour créer davantage de modpacks avec Modyx.</p>
          {data?.stats && (
            <div className={styles.stats}>
              <span><Users size={16} /> {data.stats.accounts_count} comptes Modyx</span>
              <span>{data.stats.plans_count} plans disponibles</span>
            </div>
          )}
        </section>

        {error && <p className={styles.error}>{error}</p>}
        {userId && userValidation === false && (
          <p className={styles.error}>
            Ce compte Modyx est introuvable. Téléchargez l&apos;application pour créer un compte.
          </p>
        )}
        {!data && !error && <p className={styles.loading}>Chargement des plans...</p>}
        {data && (
          <section className={styles.plans} aria-label="Plans Modyx">
            {data.plans.map((plan) => {
              const paymentUrl = `https://checkout.lemonsqueezy.com/buy/${plan.variant_id}?checkout[custom][user_id]=${encodeURIComponent(userId)}`
              
              return (
                <article className={styles.plan} key={plan.plan_code}>
                  <div>
                    <h2>{plan.display_name}</h2>
                    <p className={styles.price}>
                      {(plan.price_cents / 100).toFixed(2).replace('.', ',')} € <small>/ mois</small>
                    </p>
                    <p className={styles.credits}>{plan.monthly_credits_limit} crédits mensuels</p>
                  </div>
                  {userId && userValidation === true ? (
                    <a className={styles.planButton} href={paymentUrl}>
                      Choisir ce plan <ArrowRight size={17} />
                    </a>
                  ) : (
                    <Link className={styles.planButton} href="/download">
                      Télécharger l&apos;application <Download size={17} />
                    </Link>
                  )}
                </article>
              )
            })}
          </section>
        )}
      </main>
      <Footer />
    </div>
  )
}