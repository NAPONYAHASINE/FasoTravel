/**
 * StoriesCircle - Annonces circulaires type Instagram Stories
 * 
 * BACKEND INTEGRATION:
 * - Utilise le hook useStories() pour récupérer les stories depuis l'API
 * - Les administrateurs créent des stories via le backend (POST /admin/stories)
 * - GET /stories/active retourne les stories actives
 * 
 * CTA SUPPORT:
 * - actionType 'internal' → navigation vers une page de l'app (internalPage)
 * - actionType 'external' → ouverture d'un lien (actionUrl)
 * - actionType 'none' → bouton "Fermer"
 */

import { motion } from 'motion/react';
import { useState } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import { feedback } from '../lib/interactions';
import { useStories } from '../lib/hooks';
import type { Page } from '../App';

interface StoriesCircleProps {
  onNavigate?: (page: Page, data?: any) => void;
}


export function StoriesCircle({ onNavigate }: StoriesCircleProps) {
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
          <div className="absolute top-4 left-4 right-4 flex gap-1 pt-safe-area">
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
            className="absolute right-6 w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30"
            style={{ top: 'max(1.5rem, calc(env(safe-area-inset-top) + 1.5rem))' }}
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
            className={`w-full max-w-md mx-4 aspect-[9/16] rounded-3xl overflow-hidden shadow-2xl relative ${
              selectedStory.mediaType === 'gradient'
                ? `bg-gradient-to-br ${selectedStory.gradient}`
                : 'bg-black'
            }`}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
          >
            {selectedStory.mediaType === 'image' && selectedStory.mediaUrl && (
              <img
                src={selectedStory.mediaUrl}
                alt={selectedStory.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            {selectedStory.mediaType === 'video' && selectedStory.mediaUrl && (
              <video
                src={selectedStory.mediaUrl}
                autoPlay
                muted
                loop
                playsInline
                className="absolute inset-0 w-full h-full object-cover"
              />
            )}
            <div className="relative z-10 w-full h-full p-8 flex flex-col items-center justify-center text-white">
              {selectedStory.mediaType === 'gradient' && (
                <span className="text-8xl mb-6">{selectedStory.emoji || '📢'}</span>
              )}
              <h2 className="text-3xl mb-4 text-center drop-shadow-lg">{selectedStory.title}</h2>
              <p className="text-center text-white/90 mb-8 drop-shadow-md">
                {selectedStory.description}
              </p>
            {/* CTA based on actionType */}
            {selectedStory.actionType === 'internal' && selectedStory.internalPage ? (
              <motion.button
                onClick={() => {
                  feedback.tap();
                  onNavigate?.(selectedStory.internalPage as Page);
                  handleClose();
                }}
                className="px-8 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {selectedStory.ctaText || 'Voir →'}
              </motion.button>
            ) : selectedStory.actionType === 'external' && selectedStory.actionUrl ? (
              <motion.a
                href={selectedStory.actionUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="px-8 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100 inline-block"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {selectedStory.ctaText || 'En savoir plus'}
              </motion.a>
            ) : (
              <motion.button
                className="px-8 py-3 bg-white text-gray-900 rounded-full font-semibold hover:bg-gray-100"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
              >
                Fermer
              </motion.button>
            )}
            </div>
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
