/**
 * StoriesCircle - Annonces circulaires type Instagram Stories
 * 
 * BACKEND INTEGRATION:
 * - Utilise le hook useStories() pour récupérer les stories depuis l'API
 * - Les administrateurs peuvent créer des stories via le backend (API POST /api/stories)
 * - Les stories sont récupérées depuis la base de données
 * - Event: story_viewed, story_clicked (à implémenter avec analytics)
 * 
 * ADMIN WORKFLOW:
 * 1. Admin se connecte au dashboard admin
 * 2. Admin crée une story (titre, description, emoji, gradient, catégorie, durée)
 * 3. Story est stockée dans la DB avec is_active=true
 * 4. Story apparaît ici automatiquement pour tous les utilisateurs
 * 5. Story expire automatiquement selon expires_at
 */

import { motion } from 'motion/react';
import { useState } from 'react';
import { X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { feedback } from '../lib/interactions';
import { useStories } from '../lib/hooks';

// Map category to description
const getCategoryDescription = (category: string): string => {
  const descriptions: Record<string, string> = {
    'PROMO': '🎁 Profitez de nos offres promotionnelles !',
    'NEW': '✨ Découvrez nos nouveautés',
    'DESTINATION': '🏖️ Explorez le Burkina Faso',
    'TIPS': '💡 Conseils pour voyager en toute sécurité',
    'PARTNERS': '🤝 Nos partenaires de confiance',
    'ANNOUNCEMENT': '📢 Informations importantes'
  };
  return descriptions[category] || 'Découvrez plus...';
};

export function StoriesCircle() {
  const { stories, isLoading, error } = useStories();
  const [selectedStory, setSelectedStory] = useState<typeof stories[0] | null>(null);

  const handleStoryClick = (story: typeof stories[0]) => {
    feedback.tap();
    setSelectedStory(story);
    // TODO: Implement analytics event tracking
    // trackEvent('story_viewed', { story_id: story.id, category: story.category });
  };

  const handleClose = () => {
    feedback.tap();
    setSelectedStory(null);
  };

  const handleNext = () => {
    if (!selectedStory) return;
    const currentIndex = stories.findIndex(s => s.id === selectedStory.id);
    const nextIndex = (currentIndex + 1) % stories.length;
    setSelectedStory(stories[nextIndex]);
  };

  const handlePrev = () => {
    if (!selectedStory) return;
    const currentIndex = stories.findIndex(s => s.id === selectedStory.id);
    const prevIndex = currentIndex === 0 ? stories.length - 1 : currentIndex - 1;
    setSelectedStory(stories[prevIndex]);
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="flex gap-3 overflow-x-auto pb-2 px-1">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex-shrink-0 flex flex-col items-center gap-2">
            <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse" />
            <div className="w-12 h-3 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        ))}
      </div>
    );
  }

  // Show error or empty state
  if (error || stories.length === 0) {
    return null; // Don't show anything if no stories
  }

  return (
    <>
      {/* Stories Circles */}
      <div className="flex gap-3 overflow-x-auto pb-2 px-1 scrollbar-hide">
        {stories.map((story, index) => (
          <motion.button
            key={story.id}
            onClick={() => handleStoryClick(story)}
            className="flex-shrink-0 flex flex-col items-center gap-2"
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            aria-label={story.title}
            title={story.title}
          >
            <div className={`w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br ${story.gradient} p-0.5 shadow-lg`}>
              <div className="w-full h-full rounded-full bg-white dark:bg-gray-900 flex items-center justify-center">
                <span className="text-2xl sm:text-3xl">{story.emoji || '📢'}</span>
              </div>
            </div>
            <span className="text-xs text-gray-700 dark:text-gray-300 max-w-[70px] truncate">
              {story.title}
            </span>
          </motion.button>
        ))}
      </div>

      {/* Story Viewer Modal */}
      {selectedStory && (
        <motion.div
          className="fixed inset-0 z-50 bg-black/95 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          {/* Progress Bar */}
          <div className="absolute top-4 left-4 right-4 flex gap-1">
            {stories.map((story) => (
              <div
                key={story.id}
                className={`h-1 flex-1 rounded-full ${
                  story.id === selectedStory.id ? 'bg-white' : 'bg-white/30'
                }`}
              />
            ))}
          </div>

          {/* Close Button */}
          <motion.button
            onClick={handleClose}
            className="absolute top-6 right-6 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
          >
            <X className="w-6 h-6" />
          </motion.button>

          {/* Navigation Arrows */}
          {stories.length > 1 && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30"
                aria-label="Story précédente"
                title="Story précédente"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>

              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30"
                aria-label="Story suivante"
                title="Story suivante"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}

          {/* Story Content */}
          <motion.div
            className={`w-full max-w-md mx-4 aspect-[9/16] rounded-3xl bg-gradient-to-br ${selectedStory.gradient} p-8 flex flex-col items-center justify-center text-white shadow-2xl`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            <span className="text-8xl mb-6">{selectedStory.emoji || '📢'}</span>
            <h2 className="text-3xl mb-4 text-center">{selectedStory.title}</h2>
            <p className="text-center text-white/90 mb-8">
              {selectedStory.description || getCategoryDescription(selectedStory.category)}
            </p>
            {selectedStory.link_url ? (
              <motion.a
                href={selectedStory.link_url}
                className="px-8 py-3 bg-white text-gray-900 rounded-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                En savoir plus
              </motion.a>
            ) : (
              <motion.button
                className="px-8 py-3 bg-white text-gray-900 rounded-full"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
              >
                Fermer
              </motion.button>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* Hide scrollbar */}
      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  );
}
