import Link from 'next/link'
import { 
    ChevronRight,
    Box,
    Cpu,
    Zap,
    CheckCircle2,
    MessageSquare,
    Workflow,
    Gamepad2,
    ShieldCheck,
    Sparkles,
    Download,
    Gauge,
    Layers,
    Sliders
} from "lucide-react"
import styles from "./page.module.css"
import Header from '../../components/Header'
import Footer from '@/components/Footer'

export default function LandingPage() {
    const stats = [
        {
            icon: <Box size={20} />,
            value: "40 000+",
            label: "Mods Indexés",
            desc: "Fabric, Forge & NeoForge"
        },
        {
            icon: <Zap size={20} />,
            value: "< 30s",
            label: "Génération",
            desc: "Temps de réponse moyen"
        },
        {
            icon: <Cpu size={20} />,
            value: "99.9%",
            label: "Compatibilité",
            desc: "Des modpacks générés compatibles"
        },
        {
            icon: <CheckCircle2 size={20} />,
            value: "100%",
            label: "Gratuit",
            desc: "Quotas gratuit inclus"
        }
    ]

    const steps = [
        {
            number: "01",
            icon: <MessageSquare size={24} />,
            title: "Décrivez votre vision",
            desc: "Exprimez ce que vous souhaitez en français ou en anglais. Définissez le thème, certains mods, la difficulté ou le type de gameplay voulu."
        },
        {
            number: "02",
            icon: <Workflow size={24} />,
            title: "L'IA assemble & vérifie",
            desc: "Modyx sélectionne les mods compatibles, résout les dépendances obligatoires et élimine les risques de crash au lancement."
        },
        {
            number: "03",
            icon: <Gamepad2 size={24} />,
            title: "Chargez et jouez",
            desc: "En un clic charger le modpack sur votre ordinateur. Lancer votre jeu et jouez !"
        }
    ]

    const features = [
        {
            icon: <ShieldCheck size={22} />,
            title: "Résolution Anti-Crash",
            desc: "L'IA analyse l'arbre de dépendances et élimine les conflits de mods avant même le premier lancement."
        },
        {
            icon: <Sparkles size={22} />,
            title: "Compréhension Prompt-to-Pack",
            desc: "Décrivez l'ambiance ou le style de jeu voulu, Modyx traduit vos idées en une liste cohérente de mods."
        },
        {
            icon: <Download size={22} />,
            title: "Exportez ou Chargez",
            desc: "En un simple bouton, chargez votre modpacks dans le dossier mods. Si vous preferez vous pouvez meme télécharger le modpack compatible à vos launcher préférés."
        },
        {
            icon: <Gauge size={22} />,
            title: "Optimisation des FPS",
            desc: "Ajout automatique des mods de performance recommandés selon le loader et la version choisie."
        },
        {
            icon: <Layers size={22} />,
            title: "Fabric, Forge, NeoForge...",
            desc: "Bénéficiez du support complet de tous les loaders modernes et historiques de l'écosystème Minecraft."
        },
        {
            icon: <Sliders size={22} />,
            title: "Personnalisation Fine",
            desc: "Ajustez manuellement la liste suggérée par l'IA : ajoutez ou retirez des mods à tout moment."
        }
    ]

    return (
        <div className={styles.page}>
            <Header />

            {/* Hero */}
            <section className={styles.hero}>
                <h1 className={styles.hero_title}>
                    Imaginez votre modpack. <br />
                    <span className={styles.hero_title_gradient}>L'IA fait le reste.</span>
                </h1>

                <p className={styles.hero_subtitle}>
                    Fini les incompatibilités, les crashs Java au lancement et les heures de recherche. 
                    Décrivez votre vision, l'IA de Modyx s'occupe de trouver les mods, résoudre les dépendances et builder votre pack.
                </p>

                <div className={styles.hero_cta_group}>
                    <a href="#download" className={styles.btn_primary}>
                        <span>Télécharger</span>
                        <ChevronRight className={styles.btn_icon} size={18} />
                    </a>

                    <a href="#features" className={styles.btn_secondary}>
                        En savoir plus
                    </a>
                </div>
            </section>

            {/* Stats */}
            <section className={styles.stats_banner}>
                <div className={styles.stats_container}>
                    <div className={styles.stats_header}>
                        <span className={styles.stats_tagline}>PERFORMANCES & FIABILITÉ</span>
                        <h2 className={styles.stats_title}>Conçu pour une expérience sans crash</h2>
                    </div>

                    <div className={styles.stats_grid}>
                        {stats.map((stat, index) => (
                            <div key={index} className={styles.stat_card}>
                                <div className={styles.stat_top}>
                                    <div className={styles.icon_wrapper}>
                                        {stat.icon}
                                    </div>
                                    <span className={styles.value}>{stat.value}</span>
                                </div>
                                <div className={styles.stat_content}>
                                    <span className={styles.label}>{stat.label}</span>
                                    <span className={styles.desc}>{stat.desc}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Steps */}
            <section id="how-it-works" className={styles.steps_section}>
                <div className={styles.steps_container}>
                    <div className={styles.section_header}>
                        <span className={styles.section_tagline}>SIMPLICITÉ ABSOLUE</span>
                        <h2 className={styles.section_title}>Créer un modpack n'a jamais été aussi rapide</h2>
                        <p className={styles.section_subtitle}>
                            Trois étapes simples séparent votre idée de votre première partie.
                        </p>
                    </div>

                    <div className={styles.steps_grid}>
                        {steps.map((step, index) => (
                            <div key={index} className={styles.step_card}>
                                <div className={styles.step_top}>
                                    <span className={styles.step_number}>{step.number}</span>
                                    <div className={styles.step_icon_wrapper}>
                                        {step.icon}
                                    </div>
                                </div>
                                <h3 className={styles.step_title}>{step.title}</h3>
                                <p className={styles.step_desc}>{step.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* Features */}
            <section id="features" className={styles.features_section}>
                <div className={styles.features_container}>
                    <div className={styles.section_header}>
                        <span className={styles.section_tagline}>FONCTIONNALITÉS</span>
                        <h2 className={styles.section_title}>Tout ce dont vous avez besoin pour modder sans prise de tête</h2>
                        <p className={styles.section_subtitle}>
                            Modyx combine la puissance des LLM et la précision des API de modding pour une expérience parfaite.
                        </p>
                    </div>

                    <div className={styles.features_grid}>
                        {features.map((feature, index) => (
                            <div key={index} className={styles.feature_card}>
                                <div className={styles.feature_icon_wrapper}>
                                    {feature.icon}
                                </div>
                                <h3 className={styles.feature_title}>{feature.title}</h3>
                                <p className={styles.feature_desc}>{feature.desc}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </section>

            {/* CTA */}
            <section className={styles.cta_section}>
                <div className={styles.cta_container}>
                    <div className={styles.cta_card}>

                        <h2 className={styles.cta_title}>
                            Prêt à créer votre prochain modpack en quelques secondes ?
                        </h2>
                        
                        <p className={styles.cta_subtitle}>
                            Rejoignez la bêta de Modyx dès aujourd'hui. L'outil est 100% gratuit pour les premiers utilisateurs.
                        </p>

                        <div className={styles.cta_buttons}>
                            <a href="#download" className={styles.btn_primary}>
                                <span>Télécharger Modyx</span>
                                <ChevronRight className={styles.btn_icon} size={18} />
                            </a>
                        </div>
                    </div>
                </div>
            </section>

            <Footer />
        </div>
    )
}