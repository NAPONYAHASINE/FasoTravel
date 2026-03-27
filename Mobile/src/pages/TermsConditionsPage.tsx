import type { Page } from '../App';
import { useEffect, useMemo, useState } from 'react';
import { ArrowLeft, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { feedback } from '../lib/interactions';
import { platformPolicyService } from '../services/api';
import type { PlatformPolicy } from '../services/api/platformPolicy.service';

interface TermsConditionsPageProps {
  onNavigate?: (page: Page) => void;
  onBack: () => void;
}

type TabType = 'terms' | 'privacy';

function formatPolicyDate(policy?: PlatformPolicy): string {
  const dateValue = policy?.updatedAt || policy?.publishedAt;
  if (!dateValue) return 'Date non renseignee';

  const date = new Date(dateValue);
  if (Number.isNaN(date.getTime())) return 'Date non renseignee';

  return date.toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
}

export function TermsConditionsPage({ onBack }: TermsConditionsPageProps) {
  const [activeTab, setActiveTab] = useState<TabType>('terms');
  const [policies, setPolicies] = useState<PlatformPolicy[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const loadPolicies = async () => {
      setLoading(true);
      try {
        const list = await platformPolicyService.getPublishedPolicies();
        if (mounted) {
          setPolicies(list);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };

    void loadPolicies();

    return () => {
      mounted = false;
    };
  }, []);

  const termsPolicy = useMemo(
    () => policies.find((p) => p.type === 'terms') || null,
    [policies]
  );
  const privacyPolicy = useMemo(
    () => policies.find((p) => p.type === 'privacy') || null,
    [policies]
  );

  const activePolicy = activeTab === 'terms' ? termsPolicy : privacyPolicy;

  const handleTabChange = (tab: TabType) => {
    feedback.tap();
    setActiveTab(tab);
  };

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 overflow-x-hidden">
      <motion.div
        className="bg-gradient-to-r from-red-600 via-amber-500 to-green-600 px-4 sm:px-6 py-6 sticky top-0 z-20"
        style={{ paddingTop: 'max(1.5rem, env(safe-area-inset-top))' }}
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
            <h1 className="text-xl sm:text-2xl mb-1">Conditions legales</h1>
            <p className="text-xs sm:text-sm opacity-90">Contenu synchronise depuis les politiques admin publiees</p>
          </motion.div>
        </div>
      </motion.div>

      <motion.div
        className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.15 }}
      >
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
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
              Politique de confidentialite
            </button>
          </div>
        </div>
      </motion.div>

      <motion.div
        className="px-4 sm:px-6 py-8 pb-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {loading ? (
            <div className="flex items-center justify-center py-16 text-gray-600 dark:text-gray-300">
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Chargement des politiques...
            </div>
          ) : (
            <>
              <section className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <p className="text-sm text-blue-700 dark:text-blue-400">
                  <strong>Derniere mise a jour :</strong> {formatPolicyDate(activePolicy || undefined)}
                </p>
                {activePolicy?.version && (
                  <p className="text-xs mt-1 text-blue-600 dark:text-blue-300">Version: {activePolicy.version}</p>
                )}
              </section>

              <section className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl p-5 sm:p-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900 dark:text-white mb-3">
                  {activePolicy?.title || 'Politique indisponible'}
                </h2>
                {activePolicy?.summary && (
                  <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{activePolicy.summary}</p>
                )}

                <div className="text-gray-700 dark:text-gray-300 text-sm sm:text-base leading-7 whitespace-pre-wrap">
                  {activePolicy?.content || 'Aucun contenu publie pour cette section.'}
                </div>
              </section>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}
