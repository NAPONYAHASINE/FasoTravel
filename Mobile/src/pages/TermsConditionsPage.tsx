import type { Page } from '../App';
/**
 * TermsConditionsPage - Conditions d'utilisation et politique de confidentialité
 * 
 * DEV NOTES:
 * - Affiche conditions légales complètes
 * - Tabs pour basculer entre Conditions et Politique de confidentialité
 * - Navigable, avec retour à ProfilePage
 */

import { useState } from 'react';
import { ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { feedback } from '../lib/interactions';

interface TermsConditionsPageProps {
  onNavigate?: (page: Page) => void;
  onBack: () => void;
}

type TabType = 'terms' | 'privacy';

export function TermsConditionsPage({ onNavigate, onBack }: TermsConditionsPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('terms');

  const handleTabChange = (tab: TabType) => {
    feedback.tap();
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900">
      {/* Header */}
      <motion.div
        className="bg-gradient-to-r from-red-600 via-amber-500 to-green-600 px-6 py-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.button
            onClick={() => {
              feedback.tap();
              onBack();
            }}
            className="text-white mb-4 flex items-center gap-2 hover:opacity-80 transition-opacity"
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </motion.button>

          <motion.div
            className="text-white"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-xl sm:text-2xl mb-1">Conditions légales</h1>
            <p className="text-xs sm:text-sm opacity-90">Conditions d'utilisation et politique de confidentialité</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Tabs */}
      <motion.div
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="max-w-4xl mx-auto px-6 py-0">
          <div className="flex gap-0">
            <button
              onClick={() => handleTabChange('terms')}
              className={`flex-1 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'terms'
                  ? 'text-green-600 dark:text-green-400 border-green-600 dark:border-green-400'
                  : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Conditions d'utilisation
            </button>
            <button
              onClick={() => handleTabChange('privacy')}
              className={`flex-1 px-4 py-4 text-sm font-medium border-b-2 transition-colors ${
                activeTab === 'privacy'
                  ? 'text-green-600 dark:text-green-400 border-green-600 dark:border-green-400'
                  : 'text-gray-600 dark:text-gray-400 border-transparent hover:text-gray-900 dark:hover:text-gray-200'
              }`}
            >
              Politique de confidentialité
            </button>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div
        className="px-6 py-8 pb-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="max-w-4xl mx-auto prose dark:prose-invert prose-sm sm:prose-base max-w-none">
          {activeTab === 'terms' && (
            <motion.div
              key="terms"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <section>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Conditions d'utilisation
                </h2>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    <strong>Dernière mise à jour :</strong> 27 novembre 2025
                  </p>
                </div>

                <div className="space-y-5 text-gray-700 dark:text-gray-300">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      1. Acceptation des conditions
                    </h3>
                    <p>
                      En accédant et en utilisant l'application FasoTravel, vous acceptez d'être lié par ces conditions
                      d'utilisation. Si vous n'acceptez pas ces conditions, veuillez cesser d'utiliser l'application.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      2. Licence d'utilisation
                    </h3>
                    <p>
                      FasoTravel vous accorde une licence limitée, non exclusive et révocable pour utiliser l'application
                      à des fins personnelles et non commerciales. Vous ne pouvez pas reproduire, distribuer ou transmettre
                      le contenu sans autorisation préalable.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      3. Comptes utilisateur
                    </h3>
                    <p>
                      Vous êtes responsable de maintenir la confidentialité de votre mot de passe et de votre compte. Vous
                      acceptez d'être responsable de toutes les activités qui se produisent sous votre compte.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      4. Réservation et paiement
                    </h3>
                    <p>
                      Les billets réservés via FasoTravel sont soumis aux conditions de la société de transport. Les
                      paiements doivent être effectués en totalité avant la confirmation de la réservation. FasoTravel ne
                      peut pas être tenue responsable des erreurs de transport ou d'horaires fournies par les opérateurs.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      5. Annulations et remboursements
                    </h3>
                    <p>
                      Les conditions d'annulation et de remboursement dépendent des règles de la société de transport. Les
                      demandes d'annulation doivent être soumises au moins 1 heure avant le départ.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      6. Limitation de responsabilité
                    </h3>
                    <p>
                      FasoTravel n'est pas responsable des dommages directs, indirects, accessoires ou consécutifs résultant
                      de l'utilisation ou de l'impossibilité d'utiliser l'application ou les services.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      7. Modifications des conditions
                    </h3>
                    <p>
                      FasoTravel se réserve le droit de modifier ces conditions à tout moment. Les modifications prendront
                      effet immédiatement. L'utilisation continue de l'application après les modifications constitue votre
                      acceptation des nouvelles conditions.
                    </p>
                  </div>
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'privacy' && (
            <motion.div
              key="privacy"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <section>
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-4">
                  Politique de confidentialité
                </h2>

                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4 mb-6">
                  <p className="text-sm text-blue-700 dark:text-blue-400">
                    <strong>Dernière mise à jour :</strong> 27 novembre 2025
                  </p>
                </div>

                <div className="space-y-5 text-gray-700 dark:text-gray-300">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      1. Informations que nous collectons
                    </h3>
                    <p>
                      Nous collectons les informations que vous nous fournissez directement, telles que votre nom, adresse
                      e-mail, numéro de téléphone et historique de réservation. Nous pouvons également collecter automatiquement
                      des informations sur votre appareil et votre utilisation de l'application.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      2. Géolocalisation
                    </h3>
                    <p>
                      Nous collectons votre position approximative pour afficher les gares et véhicules à proximité. Ces
                      données sont conservées pendant 7 jours maximum et peuvent être supprimées à tout moment via vos paramètres
                      de confidentialité.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      3. Utilisation des données
                    </h3>
                    <p>
                      Nous utilisons vos données pour traiter vos réservations, améliorer nos services, vous envoyer des
                      notifications concernant vos voyages, et à des fins analytiques. Nous ne partagerons jamais vos données
                      personnelles avec des tiers sans votre consentement, sauf si cela est requis par la loi.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      4. Sécurité des données
                    </h3>
                    <p>
                      Vos données sont protégées par un chiffrement SSL/TLS. Nous mettons en œuvre des mesures de sécurité
                      standard pour protéger vos informations personnelles contre l'accès, l'altération ou la destruction non
                      autorisée.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      5. Cookies et technologies de suivi
                    </h3>
                    <p>
                      FasoTravel utilise des cookies et des technologies similaires pour améliorer votre expérience. Vous
                      pouvez contrôler les cookies via les paramètres de votre navigateur.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      6. Vos droits RGPD
                    </h3>
                    <p>
                      Conformément au RGPD, vous avez le droit d'accéder, de corriger, de supprimer vos données personnelles
                      et de vous opposer au traitement. Pour exercer ces droits, veuillez nous contacter via la page d'aide et
                      support.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      7. Durée de conservation
                    </h3>
                    <p>
                      Vos données sont conservées aussi longtemps que nécessaire pour fournir nos services. Les données de
                      géolocalisation sont supprimées après 7 jours. Vous pouvez demander la suppression complète de votre compte.
                    </p>
                  </div>

                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                      8. Modifications de cette politique
                    </h3>
                    <p>
                      FasoTravel peut mettre à jour cette politique de confidentialité à tout moment. Nous vous notifierons de
                      tout changement important. L'utilisation continue de l'application après les modifications constitue votre
                      acceptation des mises à jour.
                    </p>
                  </div>
                </div>
              </section>
            </motion.div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
