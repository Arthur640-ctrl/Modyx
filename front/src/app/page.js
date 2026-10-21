import Link from 'next/link'
import { 
    ChevronDown,
    MoveUpRight,
    Layers3,
    Boxes,
    WandSparkles
} from "lucide-react"
import styles from "./page.module.css"
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const faqs = [
    {
        question: "Faut-il s'y connaître en mods Minecraft pour utiliser Modyx ?",
        answer: "Pas besoin d'être un expert ! Décrivez simplement le type d'aventure que vous souhaitez vivre : exploration, magie, technologie, survie ou une combinaison de plusieurs styles. L'assistant IA vous accompagne dans la création de votre modpack et vous aide à affiner vos idées.",
    },
    {
        question: "Comment créer mon premier modpack avec Modyx ?",
        answer: "Téléchargez Modyx, créez votre compte, puis choisissez une version de Minecraft et un loader disponibles dans l'application. Décrivez ensuite le modpack que vous imaginez à l'assistant IA et laissez-vous guider à travers les étapes de création.",
    },
    {
        question: "Quelles versions de Minecraft et quels loaders sont compatibles ?",
        answer: "Modyx propose la prise en charge des versions de Minecraft de la 1.0 à la version la plus récente, ainsi que des loaders Forge, NeoForge, Fabric et Quilt. La disponibilité des mods varie toutefois selon la version et le loader : certaines combinaisons offrent moins de possibilités que d'autres.",
    },
    {
        question: "Les modpacks générés par Modyx sont-ils garantis compatibles ?",
        answer: "La compatibilité dépend des versions de Minecraft, des loaders, des dépendances et des mods sélectionnés. Modyx vous aide à construire votre modpack, mais certaines incompatibilités peuvent subsister. Nous vous recommandons de vérifier le résultat et de tester votre modpack avant de l'utiliser dans votre partie principale.",
    },
    {
        question: "Où télécharger Modyx ?",
        answer: "Rendez-vous sur notre page de téléchargement pour obtenir l'application et suivre les instructions d'installation. Vous pourrez ensuite créer votre compte et commencer à concevoir votre premier modpack.",
    },
    {
        question: "Modyx est-il gratuit ?",
        answer: "Oui ! Vous bénéficiez de 50 crédits gratuits pour découvrir Modyx et tester la création de modpacks avec l'assistant IA. Si vous souhaitez aller plus loin, vous pourrez consulter les offres disponibles dans l'application.",
    },
];


export default function LandingPage() {
    
    return (
        <div className={styles.page}>
            <Header />

            {/* Hero */}
            <section className={styles.hero}>

                <div className={styles.hero_content}>

                    <h1 className={styles.hero_title}>
                        Imaginez votre modpack.
                        <br />
                        <span className={styles.hero_title_accent}>
                            Modyx lui donne vie.
                        </span>
                    </h1>

                    <p className={styles.hero_subtitle}>
                        Décrivez le modpack Minecraft que vous imaginez.
                        L'IA vous aide à trouver les mods, construire votre pack et l'affiner au fil de la conversation.
                    </p>

                    <div className={styles.hero_cta_group}>
                        <Link href="/download" className={styles.btn_primary}>
                            Télécharger Modyx
                            <MoveUpRight className={styles.btn_icon} size={18} />
                        </Link>

                        <a href="#features" className={styles.btn_secondary}>
                            Découvrir comment ça marche
                        </a>
                    </div>

                </div>

                {/*
                <div className={styles.hero_demo}>
                    <video
                        className={styles.hero_video}
                        src="/modyx-demo.mp4"
                        poster="/modyx-poster.webp"
                        autoPlay
                        muted
                        loop
                        playsInline
                        aria-label="Démonstration de l'application Modyx"
                    />
                </div>
                */}

            </section>


            
            {/* Features */}
            <section className={styles.features} id='features'>

                <p className={styles.features_eyebrow}>
                    COMMENT ÇA MARCHE
                </p>

                <h2 className={styles.features_title}>
                    De l'idée au modpack. <br />
                    <span className={styles.features_title_accent}>
                        En trois étapes.
                    </span>
                </h2>

                <p className={styles.features_description}>
                    Imaginez votre aventure. Modyx vous aide à lui donner vie.
                </p>

                <div className={styles.features_container}>

                    <div className={styles.step}>
                        <span className={styles.step_number}>01</span>
                        <h3>Installez Modyx</h3>
                        <p>
                            Téléchargez l'application et créez votre compte
                            pour commencer. <br />
                            <a href="/download" className={styles.features_download}>
                                Télécharger Modyx
                                <MoveUpRight size={17}/>
                            </a>
                        </p>
                    </div>

                    <div className={styles.step}>
                        <span className={styles.step_number}>02</span>
                        <h3>Configurez votre modpack</h3>
                        <p>
                            Sélectionnez la version de Minecraft et le loader
                            adaptés à votre projet.
                        </p>
                    </div>

                    <div className={styles.step}>
                        <span className={styles.step_number}>03</span>
                        <h3>Créez avec l'IA</h3>
                        <p>
                            Décrivez votre idée à l'assistant Modyx, demandez
                            des modifications et faites évoluer votre modpack
                            au fil de la conversation.
                        </p>
                    </div>

                </div>
            </section>
      
            {/* Technical */}
                <section
                    className={styles.technical_section}
                    id="compatibility"
                    aria-labelledby="technical-title"
                >
                    <div className={styles.technical_inner}>
                        <div className={styles.technical_heading}>

                            <h2 className={styles.technical_title} id="technical-title">
                                Votre aventure,<br />
                                <span className={styles.technical_accent}>
                                    Vos paramètres.
                                </span>
                            </h2>

                            <p className={styles.technical_description}>
                                Gardez la main sur les choix essentiels de votre modpack, de sa configuration à son évolution.
                            </p>
                        </div>

                        <div className={styles.technical_list}>
                            <div className={styles.technical_row}>
                                <div className={styles.technical_icon}>
                                    <Layers3 size={21} />
                                </div>

                                <div className={styles.technical_copy}>
                                    <h3>Version de Minecraft</h3>
                                    <p>
                                        Choisissez une version parmi celles proposées dans l'application.
                                    </p>
                                </div>

                                <span className={styles.technical_index}>
                                    01
                                </span>
                            </div>

                            <div className={styles.technical_row}>
                                <div className={styles.technical_icon}>
                                    <Boxes size={21} />
                                </div>

                                <div className={styles.technical_copy}>
                                    <h3>Loader du modpack</h3>
                                    <p>
                                        Configurez le loader disponible qui correspond à votre projet.
                                    </p>
                                </div>

                                <span className={styles.technical_index}>
                                    02
                                </span>
                            </div>

                            <div className={styles.technical_row}>
                                <div className={styles.technical_icon}>
                                    <WandSparkles size={21} />
                                </div>

                                <div className={styles.technical_copy}>
                                    <h3>Création assistée par l'IA</h3>
                                    <p>
                                        Faites évoluer votre sélection et votre idée en échangeant avec l'assistant.
                                    </p>
                                </div>

                                <span className={styles.technical_index}>
                                    03
                                </span>
                            </div>
                        </div>
                    </div>
                </section>
                
                {/* FAQ */}
                <section
                    className={styles.faq_section}
                    id="faq"
                    aria-labelledby="faq-title"
                >
                    <div className={styles.faq_layout}>
                        <div className={styles.faq_intro}>
            
                            <h2
                                className={styles.faq_title}
                                id="faq-title"
                            >
                                Quelques réponses.
                                <br />
                                <span className={styles.faq_accent}>
                                    Avant de vous lancer.
                                </span>
                            </h2>

                            <p className={styles.faq_description}>
                                Tout ce qu'il faut savoir pour commencer avec Modyx.
                            </p>

                            <Link
                                href="/download"
                                className={styles.inline_link}
                            >
                                Télécharger Modyx
                                <MoveUpRight size={17} />
                            </Link>
                        </div>

                        <div className={styles.faq_list}>
                            {faqs.map((faq) => (
                                <details
                                    className={styles.faq_item}
                                    key={faq.question}
                                >
                                    <summary>
                                        <span>{faq.question}</span>
                                        <ChevronDown
                                            className={styles.faq_chevron}
                                            size={19}
                                        />
                                    </summary>

                                    <p>{faq.answer}</p>
                                </details>
                            ))}
                        </div>
                    </div>
                </section>

                {/* CTA */}
                <section
                    className={styles.final_cta}
                    aria-labelledby="final-cta-title"
                >
                    <div className={styles.final_cta_content}>

                        <h2
                            className={styles.final_cta_title}
                            id="final-cta-title"
                        >
                            Et si votre prochaine aventure<br />
                            <span className={styles.faq_accent}>
                                commençait maintenant ?
                            </span>
                        </h2>

                        <p className={styles.final_cta_description}>
                            Votre idée est le point de départ. Modyx vous
                            accompagne pour lui donner forme.
                        </p>

                        <Link
                            href="/download"
                            className={styles.btn_primary}
                        >
                            Télécharger Modyx
                            <MoveUpRight
                                className={styles.btn_icon}
                                size={18}
                            />
                        </Link>
                    </div>
                </section>

            <Footer />
        </div>
    )
}