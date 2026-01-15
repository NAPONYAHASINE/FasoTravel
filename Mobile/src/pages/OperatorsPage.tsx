import type { Page } from '../App';
/**
 * OperatorsPage - Liste des compagnies de transport
 * 
 * DEV NOTES:
 * - Endpoint: GET /operators
 * - Event: operator_clicked
 * - Permet de choisir une compagnie avant de réserver
 */

import { ArrowLeft, Star, Bus, ChevronRight, Loader2 } from 'lucide-react';
import { motion } from 'motion/react';
import { feedback } from '../lib/interactions';
import { useOperators, useOperatorStories } from '../lib/hooks';
import { OperatorStoriesViewer } from '../components/OperatorStoriesViewer';
import { OperatorLogo } from '../components/OperatorLogo';
import { useState } from 'react';
import { markStoryAsViewed } from '../lib/api';

interface OperatorsPageProps {
  onNavigate: (page: Page, data?: any) => void;
  onBack?: () => void;
}

export function OperatorsPage({ onNavigate, onBack }: OperatorsPageProps) {
  const { operators, isLoading, error } = useOperators();
  const [selectedOperatorForStories, setSelectedOperatorForStories] = useState<string | null>(null);
  const [storiesOpen, setStoriesOpen] = useState(false);
  
  const { stories, refetch: refetchStories } = useOperatorStories(selectedOperatorForStories);
  
  const handleOperatorLogoClick = (operatorId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Empêche la navigation vers la page détail
    feedback.tap();
    setSelectedOperatorForStories(operatorId);
    setStoriesOpen(true);
  };

  const handleCloseStories = () => {
    setStoriesOpen(false);
    setTimeout(() => setSelectedOperatorForStories(null), 300);
  };

  const handleStoryView = async (storyId: string) => {
    if (!selectedOperatorForStories) return;
    try {
      await markStoryAsViewed(selectedOperatorForStories, storyId);
      refetchStories(); // Refresh pour mettre à jour les indicateurs
    } catch (error) {
      console.error('Failed to mark story as viewed:', error);
    }
  };

  const selectedOperator = operators.find(op => op.operator_id === selectedOperatorForStories);

  return (
    <div className="min-h-screen bg-white dark:bg-gray-900 pb-20 md:pb-8">
      {/* Header */}
      <motion.div 
        className="bg-gradient-to-r from-red-600 via-amber-500 to-green-600 text-white px-4 sm:px-6 py-6 sm:py-8 sticky top-0 z-10 shadow-lg"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <motion.button
              onClick={() => {
                feedback.tap();
                onBack?.();
              }}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/30 transition-all"
              whileHover={{ scale: 1.1, x: -5 }}
              whileTap={{ scale: 0.95 }}
            >
              <ArrowLeft className="w-5 h-5" />
            </motion.button>
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
            >
              <h1 className="text-xl sm:text-2xl">Nos compagnies partenaires</h1>
              <p className="text-sm opacity-90 mt-1">
                {isLoading ? 'Chargement...' : `${operators.length} sociétés de transport`}
              </p>
            </motion.div>
          </div>
        </div>
      </motion.div>

      {/* Operators Grid */}
      <motion.div 
        className="max-w-4xl mx-auto px-4 sm:px-6 py-6 sm:py-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        {/* Loading State */}
        {isLoading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-8 h-8 text-green-600 dark:text-green-400 animate-spin" />
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-200 dark:border-red-700 rounded-2xl p-6 text-center">
            <p className="text-red-800 dark:text-red-400">{error}</p>
          </div>
        )}

        {/* Operators Grid */}
        {!isLoading && !error && (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {operators
              .sort((a, b) => (b.rating || 0) - (a.rating || 0)) // Trier par rating décroissant
              .map((operator, index) => (
            <motion.button
              key={operator.operator_id}
              onClick={() => {
                feedback.tap();
                onNavigate('operator-detail', operator.operator_id);
              }}
              className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-2xl p-6 shadow-lg hover:shadow-xl transition-all text-left group"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + index * 0.05 }}
              whileHover={{ scale: 1.02, y: -4 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Logo & Name */}
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  {/* Logo with Stories Circle */}
                  <div
                    onClick={(e) => {
                      if (operator.stories_count && operator.stories_count > 0) {
                        handleOperatorLogoClick(operator.operator_id, e);
                      }
                    }}
                    className={`relative transition-transform ${
                      operator.stories_count && operator.stories_count > 0 
                        ? 'cursor-pointer hover:scale-110' 
                        : 'cursor-default'
                    }`}
                  >
                    {/* Gradient Ring (if has unread stories) */}
                    {operator.has_unread_stories && operator.stories_count && operator.stories_count > 0 && (
                      <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-red-600 via-amber-500 to-green-600 animate-pulse" />
                    )}
                    
                    {/* Gray Ring (if has only read stories) */}
                    {!operator.has_unread_stories && operator.stories_count && operator.stories_count > 0 && (
                      <div className="absolute -inset-1 rounded-full bg-gray-300 dark:bg-gray-600" />
                    )}
                    
                    {/* Logo Container */}
                    <OperatorLogo
                      logo={operator.operator_logo}
                      logoUrl={operator.logo_url}
                      name={operator.name}
                      size="md"
                      showBorder
                      borderStyle="colored"
                    />

                    {/* Stories Count Badge */}
                    {operator.stories_count && operator.stories_count > 0 && (
                      <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-red-600 text-white rounded-full flex items-center justify-center text-xs border-2 border-white dark:border-gray-900">
                        {operator.stories_count}
                      </div>
                    )}
                  </div>
                  
                  <div>
                    <h3 className="text-base text-gray-900 dark:text-white group-hover:text-red-600 dark:group-hover:text-red-400 transition-colors">
                      {operator.name}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{operator.total_trips} trajets</p>
                  </div>
                </div>
                <motion.div
                  whileHover={{ x: 5 }}
                >
                  <ChevronRight className="w-5 h-5 text-gray-400 dark:text-gray-500 group-hover:text-red-600 dark:group-hover:text-red-400 transition-all" />
                </motion.div>
              </div>

              {/* Rating */}
              <div className="flex items-center gap-2">
                <div className="flex items-center gap-1">
                  <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                  <span className="text-sm text-gray-900 dark:text-white">{operator.rating}</span>
                </div>
                <span className="text-xs text-gray-400 dark:text-gray-500">• Excellent service</span>
              </div>
            </motion.button>
            ))}
          </div>
        )}

        {/* Info Banner */}
        {!isLoading && !error && operators.length > 0 && (
          <motion.div 
          className="mt-8 bg-gradient-to-r from-red-50 via-amber-50 to-green-50 dark:from-red-900/20 dark:via-amber-900/20 dark:to-green-900/20 border-2 border-amber-200 dark:border-amber-700 rounded-2xl p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 + operators.length * 0.05 }}
        >
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center flex-shrink-0">
              <Bus className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <div>
              <h3 className="text-base text-gray-900 dark:text-white mb-2">Pourquoi choisir une compagnie ?</h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                En sélectionnant une compagnie, vous découvrez leurs politiques, services et équipements. 
                Vous pouvez ensuite réserver directement avec eux en toute confiance.
              </p>
            </div>
          </div>
          </motion.div>
        )}
      </motion.div>

      {/* Stories Viewer Modal */}
      {storiesOpen && selectedOperator && stories.length > 0 && (
        <OperatorStoriesViewer
          operatorId={selectedOperator.operator_id}
          operatorName={selectedOperator.name}
          operatorLogo={selectedOperator.operator_logo}
          stories={stories}
          onClose={handleCloseStories}
          onStoryView={handleStoryView}
        />
      )}
    </div>
  );
}
