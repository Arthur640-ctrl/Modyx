
"use client"

import { useEffect, useState } from "react"
import {
  ArrowRight,
  Check,
  Coins,
  CreditCard,
  Sparkles,
  Zap,
  X
} from "lucide-react"
import { useSearchParams } from "next/navigation"
import Header from "../../components/Header"
import Footer from "../../components/Footer"
import styles from "./page.module.css"

const formatPrice = (price) =>
    new Intl.NumberFormat("fr-FR", {
        style: "currency",
        currency: "EUR",
    }).format(price)

function formatCredits(amount) {
    return new Intl.NumberFormat("fr-FR").format(amount)
}

function PricingCard({ plan, is_user, user_plan }) {
    const recommended = plan.id === "starter"
    const possessed = is_user === true && user_plan == plan.id

    var accent = false

    if (is_user === false || !is_user) {
        accent = recommended
    } else {
        accent = possessed
    }

    // Correction ici : on affiche les variables locales, pas plan.possessed ou plan.accent
    console.log(`Pour ${plan.id} | is_user : ${is_user} | Recommended : ${recommended} | Possessed : ${possessed} | Accent : ${accent}`)

    const isFree = Number(plan.price) === 0

  return (
    <article
      className={`${styles.plan} ${accent ? styles.plan_featured : ""}`}
    >
      <div className={styles.plan_top}>
        <div>
          <h3>{plan.name}</h3>
          {plan.description && (
            <p className={styles.plan_description}>
              {plan.description}
            </p>
          )}
        </div>
        

        {recommended && is_user == false && (
          <span className={styles.recommended}>
            Recommandé
          </span>
        )}

        {is_user == true && user_plan == plan.id && (
          <span className={styles.recommended}>
            Vous possédez
          </span>
        )}
      </div>

      <div className={styles.price}>
        <span className={styles.price_amount}>
          {formatPrice(Number(plan.price))}
        </span>
        <span className={styles.price_period}>
          {isFree ? "pour toujours" : "/ mois"}
        </span>
      </div>

      <div className={styles.credits}>
        <Coins size={17} />
        <strong>{formatCredits(plan.credits)}</strong>
        <span>
          {plan.credits_period === "monthly"
            ? "crédits / mois"
            : "crédits inclus"}
        </span>
      </div>

      <div className={styles.plan_divider} />

      <p className={styles.features_label}>Inclus dans cette offre</p>

      <ul className={styles.feature_list}>
        {(plan.features || []).map((feature, index) => (
          <li key={`${plan.id}-${index}`}>
            
            {feature.included == true ? (
                <Check size={15}/>
            ) : (
                <X size={15}/>
            )}
            
            <span>{feature.content}</span>
          </li>
        ))}
      </ul>

      <div className={styles.plan_action}>
        {isFree ? (
            is_user === true && user_plan == plan.id ? (
                <span className={styles.free_label}>
                    Vous possédez
                </span>
            ) : (
                <span className={styles.free_label}>
                    Offre gratuite
                </span>
            )
            
        ) : (
            is_user === true && user_plan == plan.id ? (
                <div className={styles.plan_possessed}>
                    Vous possédez
                </div>
            ) : (
                <button
                    type="button"
                    className={`${styles.button} ${styles.button_secondary}`}
                    disabled
                    title="Le paiement sera disponible prochainement."
                >
                    Bientôt disponible
                    <ArrowRight size={16} />
                </button>
            )
        )}
      </div>
    </article>
  )
}

function BundleRow({ bundle }) {
  return (
    <article className={styles.bundle_row}>
      <div className={styles.bundle_identity}>
        <div className={styles.bundle_icon}>
          <Zap size={18} />
        </div>

        <div className={styles.bundle_info}>
          <h3>{bundle.name}</h3>
          {bundle.description && (
            <p>{bundle.description}</p>
          )}
        </div>
      </div>

      <div className={styles.bundle_credits}>
        <Coins size={16} />
        <strong>+{formatCredits(bundle.credits)}</strong>
        <span>crédits</span>
      </div>

      <div className={styles.bundle_price}>
        {formatPrice(Number(bundle.price))}
      </div>

      <button
        type="button"
        className={styles.bundle_button}
        disabled
        title="Le paiement sera disponible prochainement."
        aria-label={`Acheter le bundle ${bundle.name} — bientôt disponible`}
      >
        <span>Bientôt</span>
        <ArrowRight size={15} />
      </button>
    </article>
  )
}

function PricingSkeleton() {
  return (
    <div className={styles.loading} role="status">
      <span className={styles.loading_dot} />
      Chargement des offres…
    </div>
  )
}

export default function PricingPage() {

    const search_params = useSearchParams()
    
    const [subscriptions, setSubscriptions] = useState([])
    const [bundles, setBundles] = useState([])
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")

    const [is_user, set_is_user] = useState(false)
    const [user_id, set_user_id] = useState("")
    const [user_plan, set_user_plan] = useState("")

    useEffect(() => {
        const controller = new AbortController()
        const url_user_id = search_params.get("user_id")

        async function loadData() {
            try {
                setLoading(true)

                // 1. Charger l'utilisateur si l'ID existe dans l'URL
                if (url_user_id) {
                    set_is_user(true)
                    const resUser = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/user/${url_user_id}`, {
                        signal: controller.signal
                    })
                    if (resUser.ok) {
                        const userData = await resUser.json()
                        set_user_plan(userData.plan_code)
                    }
                }

                // 2. Charger les plans
                const resPlans = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/subscription/list`, {
                    signal: controller.signal
                })
                const plansData = await resPlans.json()

                setBundles(plansData.bundles || [])
                setSubscriptions(plansData.plans || [])

            } catch (err) {
                if (err.name !== 'AbortError') {
                    setError("Erreur lors du chargement des données.")
                }
            } finally {
                setLoading(false)
            }
        }

        loadData()

        return () => controller.abort()
    }, [search_params])

    return (
        <div className={styles.page}>
            <Header />

            <main className={styles.main}>
                <section className={styles.heading}>

                    <h1>
                        Votre prochaine idée
                        <br />
                        <span>mérite de prendre vie.</span>
                    </h1>

                    <p>
                        Choisissez l’offre qui accompagne votre créativité.
                        Plus de possibilités pour imaginer, créer et explorer
                        vos prochains modpacks.
                    </p>
                </section>

                <section className={styles.pricing_section}>
                    <div className={styles.section_heading}>
                        <div>
                        <h2>Abonnements</h2>
                        <p>
                            Des crédits chaque mois et des fonctionnalités
                            adaptées à votre façon de créer.
                        </p>
                        </div>
                        <span className={styles.section_tag}>
                        Paiement mensuel
                        </span>
                    </div>

                    {loading ? (
                        <PricingSkeleton />
                    ) : error ? (
                        <div className={styles.error} role="alert">
                        <p>{error}</p>
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className={styles.retry_button}
                        >
                            Réessayer
                        </button>
                        </div>
                    ) : subscriptions.length > 0 ? (
                        <div className={styles.plans_grid}>
                        {subscriptions.map((plan) => (
                            <PricingCard key={plan.id} plan={plan} is_user={is_user} user_plan={user_plan} />
                        ))}
                        </div>
                    ) : (
                        <p className={styles.empty}>
                            Aucune offre d’abonnement n’est disponible pour le moment.
                        </p>
                    )}
                </section>

                <section className={styles.bundles_section}>
                    <div className={styles.section_heading}>
                        <div>
                        <h2>Besoin de quelques crédits en plus ?</h2>
                        <p>
                            Rechargez votre solde ponctuellement, sans souscrire
                            à un abonnement.
                        </p>
                        </div>
                        <span className={styles.section_tag}>
                        Achat unique
                        </span>
                    </div>

                    {loading ? (
                        <PricingSkeleton />
                    ) : error ? (
                        <p className={styles.empty}>
                        Les bundles ne peuvent pas être chargés pour le moment.
                        </p>
                    ) : bundles.length > 0 ? (
                        <div className={styles.bundle_list}>
                        {bundles.map((bundle) => (
                            <BundleRow key={bundle.id} bundle={bundle} />
                        ))}
                        </div>
                    ) : (
                        <p className={styles.empty}>
                        Aucun bundle n’est disponible pour le moment.
                        </p>
                    )}

                    <p className={styles.bundle_note}>
                        Les bundles ajoutent des crédits à votre solde.
                        Ils ne comprennent pas les fonctionnalités des abonnements.
                    </p>
                </section>

                <section className={styles.faq}>
                    <div>
                        <h2>Quelques précisions</h2>
                        <p>
                        Les informations essentielles avant de choisir votre offre.
                        </p>
                    </div>

                    <div className={styles.faq_list}>
                        <details className={styles.faq_item}>
                            <summary>Quelle est la différence entre un abonnement et un bundle ?</summary>
                            <p>
                                Un abonnement donne accès aux fonctionnalités de l’offre
                                et à un quota de crédits mensuels. Un bundle est un achat
                                ponctuel qui ajoute uniquement des crédits.
                            </p>
                        </details>

                        <details className={styles.faq_item}>
                        <summary>Puis-je résilier mon abonnement ?</summary>
                        <p>
                            Oui. Les abonnements peuvent être résiliés. Les modalités
                            précises de prise d’effet seront indiquées lors de la mise
                            en place du paiement.
                        </p>
                        </details>

                        <details className={styles.faq_item}>
                        <summary>Mes crédits sont-ils reportés au mois suivant ?</summary>
                        <p>
                            Non. Les crédits ne sont pas reportés au mois suivant. 
                            Les modalités précises seront indiquées lors de la mise
                            en place du paiement.
                        </p>
                        </details>

                        <details className={styles.faq_item}>
                        <summary>Le paiement est-il déjà disponible ?</summary>
                        <p>
                            Pas encore. Les offres sont présentées à titre informatif
                            et les achats seront activés lorsque le système de
                            paiement sera disponible.
                        </p>
                        </details>
                    </div>
                </section>

                <p className={styles.footer_note}>
                    Les tarifs sont affichés en euros. Les achats seront disponibles
                    très prochainement.
                </p>
            </main>

            <Footer />
        </div>
    )
}
