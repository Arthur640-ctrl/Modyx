import styles from './page.module.css'
import Header from '@/components/Header'

export const metadata = {
  title: 'Mentions Légales & CGU — Modyx',
  description: 'Conditions Générales d\'Utilisation, Mentions Légales et Politique de Confidentialité de Modyx.',
}

export default function LegalPage() {
  return (
    <div className={styles.wrapper}>

        <Header/>

      <main className={styles.container}>
        <header className={styles.header}>
          <h1 className={styles.title}>Conditions Générales & Mentions Légales</h1>
          <p className={styles.last_updated}>Dernière mise à jour : 26 août 2026</p>
        </header>

        {/* SOMMAIRE RAPIDE */}
        <nav className={styles.summary}>
          <span>Accès rapide :</span>
          <a href="#mentions-legales">1. Mentions Légales</a>
          <a href="#cgu">2. CGU & Responsabilité</a>
          <a href="#disclaimer">3. Avertissement Minecraft</a>
          <a href="#rgpd">4. Protection des Données (RGPD)</a>
        </nav>

        <hr className={styles.divider} />

        {/* SECTION 1 : MENTIONS LÉGALES */}
        <section id="mentions-legales" className={styles.section}>
          <h2>1. Mentions Légales</h2>
          <p>
            Conformément aux dispositions de l'article 6 de la loi n° 2004-575 du 21 juin 2004 pour la confiance dans l'économie numérique (LCEN), il est précisé aux utilisateurs du site Modyx l'identité des différents intervenants dans le cadre de sa réalisation et de son suivi :
          </p>

          <div className={styles.info_card}>
            <h3>Éditeur du site</h3>
            <p><strong>Nom / Développeur :</strong> [Votre Prénom Nom] (Projet indépendant)</p>
            <p><strong>Adresse de contact :</strong> [votre-email@domaine.com]</p>
            <p><strong>Statut :</strong> [Éditeur particulier à titre non professionnel / Micro-entreprise [Nom] - SIRET : XXXXXXXXXXXXXX]</p>
          </div>

          <div className={styles.info_card}>
            <h3>Hébergement</h3>
            <p>Le site Modyx est hébergé par la société <strong>OVH SAS</strong></p>
            <p><strong>Adresse :</strong> 2 rue Kellermann - 59100 Roubaix - France</p>
            <p><strong>Site Internet :</strong> <a href="https://www.ovhcloud.com" target="_blank" rel="noopener noreferrer">https://www.ovhcloud.com</a></p>
          </div>
        </section>

        {/* SECTION 2 : CGU & LIMITATION DE RESPONSABILITÉ */}
        <section id="cgu" className={styles.section}>
          <h2>2. Conditions Générales d'Utilisation (CGU)</h2>
          
          <h3>2.1. Objet du Service</h3>
          <p>
            Modyx est un outil assisté par intelligence artificielle (IA) conçu pour aider les utilisateurs à rechercher, sélectionner et assembler des modpacks pour le jeu Minecraft. Le Service est fourni « en l'état » (as is) et selon la disponibilité.
          </p>

          <h3>2.2. Limitation de Responsabilité & Garanties (Exonération Totale)</h3>
          <p>
            L'utilisateur reconnaît et accepte expressément que l'utilisation de Modyx se fait à ses risques et périls. Dans les limites autorisées par la loi applicables :
          </p>
          <ul>
            <li>
              <strong>Résultats de l'IA :</strong> Modyx utilise des algorithmes probabilistes pour proposer des combinaisons de mods. L'Éditeur ne garantit en aucun cas que la sélection générée sera exempte de bugs, d'erreurs logiques ou d'incompatibilités.
            </li>
            <li>
              <strong>Crashs et Défaillances Techniques :</strong> L'Éditeur ne saurait être tenu responsable des dysfonctionnements du jeu Minecraft, des erreurs d'environnement Java, des ralentissements du système ou des pertes d'accès survenus suite à l'installation d'un modpack généré via le Service.
            </li>
            <li>
              <strong>Pertes de Données et Sauvegardes :</strong> L'Éditeur décline toute responsabilité en cas de corruption de monde (world corruption), de suppression ou de perte de fichiers de sauvegarde. Il incombe exclusivement à l'utilisateur de procéder à des sauvegardes régulières de son dossier <code>.minecraft</code> avant toute modification.
            </li>
            <li>
              <strong>Fichiers Tiers :</strong> Modyx référence et automatise le téléchargement de fichiers tiers (mods créés par la communauté). L'Éditeur n'héberge pas et ne modifie pas le code source de ces mods et ne pourra pas être tenu responsable de leur contenu ou de leur comportement.
            </li>
          </ul>

          <h3>2.3. Propriété Intellectuelle du Service</h3>
          <p>
            L'ensemble de la structure du site Modyx (design, code source, logos, textes et fonctionnalités) est la propriété exclusive de son Éditeur. Toute reproduction, distribution ou rétro-ingénierie non autorisée est strictement interdite.
          </p>

          <h3>2.4. Usage Abusif & Interdictions</h3>
          <p>
            Il est strictement interdit d'utiliser le Service pour : effectuer des attaques par déni de service (DDoS), automatiser des requêtes de manière abusive visant à surcharger les API de l'IA, ou tenter de contourner les mesures de sécurité du site. L'Éditeur se réserve le droit de restreindre ou supprimer l'accès à tout utilisateur ne respectant pas ces règles, sans préavis ni indemnité.
          </p>
        </section>

        {/* SECTION 3 : DISCLAIMER MINECRAFT / MOJANG */}
        <section id="disclaimer" className={styles.section}>
          <h2>3. Avertissement Légal & Relation avec Mojang AB</h2>
          <div className={styles.warning_box}>
            <p>
              <strong>Modyx N'EST PAS UN PRODUIT OFFICIEL MINECRAFT.</strong>
            </p>
            <p>
              Modyx n'est en aucun cas affilié, associé, sponsorisé, approuvé ni officiellement lié à <strong>Mojang AB</strong>, <strong>Microsoft Corporation</strong>, ou à l'une de leurs filiales. 
            </p>
            <p>
              « Minecraft » est une marque déposée appartenant à Mojang Synergies AB. Tous les noms de mods, logos, marques et actifs visuels cités appartiennent à leurs propriétaires respectifs et sont utilisés uniquement à des fins d'identification et d'indexation.
            </p>
          </div>
        </section>

        {/* SECTION 4 : RGPD & DONNÉES */}
        <section id="rgpd" className={styles.section}>
          <h2>4. Politique de Confidentialité & Protection des Données (RGPD)</h2>
          
          <h3>4.1. Collecte des Données Personnellement Identifiables</h3>
          <p>
            Dans le cadre de l'utilisation du Service, Modyx peut être amené à collecter les données suivantes :
          </p>
          <ul>
            <li><strong>Lors de la création de compte / Inscription :</strong> Adresse e-mail, nom d'utilisateur et mot de passe (haché de manière sécurisée).</li>
            <li><strong>Historique d'utilisation :</strong> Prompts transmis à l'IA et configurations de modpacks enregistrées pour votre compte.</li>
            <li><strong>Données Techniques :</strong> Adresse IP, type de navigateur et journaux de connexion (logs) à des fins strictes de sécurité et de prévention des fraudes.</li>
          </ul>

          <h3>4.2. Finalité du Traitement</h3>
          <p>Vos données sont traitées exclusivement pour :</p>
          <ul>
            <li>Assurer le fonctionnement de votre compte utilisateur et la sauvegarde de vos modpacks.</li>
            <li>Traiter et exécuter vos requêtes de génération de packs via nos API.</li>
            <li>Garantir la sécurité de l'infrastructure et prévenir la fraude.</li>
          </ul>
          <p><strong>Aucune donnée personnelle n'est ni vendue, ni louée, ni transmise à des tiers à des fins publicitaires.</strong></p>

          <h3>4.3. Durée de Conservation</h3>
          <p>
            Les données liées à votre compte sont conservées tant que celui-ci reste actif. En cas d'inactivité prolongée supérieure à 24 mois ou sur demande de suppression, vos données personnelles seront effacées.
          </p>

          <h3>4.4. Vos Droits (Conformément au RGPD)</h3>
          <p>
            Conformément à la réglementation européenne en vigueur (RGPD), vous disposez des droits suivants concernant vos données :
          </p>
          <ul>
            <li><strong>Droit d'accès et de rectification :</strong> Vous pouvez demander une copie de vos données ou leur correction.</li>
            <li><strong>Droit à l'effacement (Droit à l'oubli) :</strong> Vous pouvez exiger la suppression définitive de votre compte et de vos données associées.</li>
            <li><strong>Droit d'opposition et de limitation :</strong> Vous pouvez vous opposer au traitement de certaines données.</li>
          </ul>
          <p>
            Pour exercer l'un de ces droits, contactez l'Éditeur à l'adresse e-mail suivante : <strong>[votre-email@domaine.com]</strong>. Une réponse vous sera apportée sous 30 jours maximum.
          </p>
        </section>
      </main>
    </div>
  )
}