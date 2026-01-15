/**
 * OperatorStoriesViewer - Visualiseur de stories pour compagnies
 * 
 * BACKEND INTEGRATION:
 * - GET /operators/{operator_id}/stories - Récupère les stories d'une compagnie
 * - POST /operators/{operator_id}/stories/{story_id}/view - Marque une story comme vue
 * - Stories expirées automatiquement après 24h
 * 
 * FEATURES:
 * - Affichage type Instagram avec timer auto
 * - Navigation swipe gauche/droite
 * - Progress bar multi-segments
 * - Tap gauche = story précédente, tap droit = story suivante
 * - Auto-progression toutes les 5 secondes
 */

import { motion, AnimatePresence } from 'motion/react';
import { useState, useEffect, useCallback } from 'react';
import { X, ChevronLeft, ChevronRight, MapPin, Tag, Calendar } from 'lucide-react';
import { feedback } from '../lib/interactions';
import type { OperatorStory } from '../lib/api';

interface OperatorStoriesViewerProps {
  operatorId: string;
  operatorName: string;
  operatorLogo: string;
  stories: OperatorStory[];
  initialStoryIndex?: number;
  onClose: () => void;
  onStoryView?: (storyId: string) => void;
}

export function OperatorStoriesViewer({
  operatorId,
  operatorName,
  operatorLogo,
  stories,
  initialStoryIndex = 0,
  onClose,
  onStoryView,
}: OperatorStoriesViewerProps) {
  const [currentIndex, setCurrentIndex] = useState(initialStoryIndex);
  const [progress, setProgress] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  
  const currentStory = stories[currentIndex];
  const storyDuration = (currentStory?.duration_seconds || 5) * 1000; // Convert to ms

  // Mark story as viewed
  useEffect(() => {
    if (currentStory && !currentStory.is_viewed) {
      onStoryView?.(currentStory.id);
      // ✅ BACKEND: POST /operators/{operator_id}/stories/{story_id}/view
    }
  }, [currentStory, onStoryView]);

  // Auto-progress timer
  useEffect(() => {
    if (isPaused) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        const newProgress = prev + (100 / storyDuration) * 50; // Update every 50ms
        
        if (newProgress >= 100) {
          handleNext();
          return 0;
        }
        
        return newProgress;
      });
    }, 50);

    return () => clearInterval(interval);
  }, [currentIndex, isPaused, storyDuration]);

  const handleNext = useCallback(() => {
    if (currentIndex < stories.length - 1) {
      feedback.tap();
      setCurrentIndex((prev) => prev + 1);
      setProgress(0);
    } else {
      // Last story - close viewer
      onClose();
    }
  }, [currentIndex, stories.length, onClose]);

  const handlePrev = useCallback(() => {
    if (currentIndex > 0) {
      feedback.tap();
      setCurrentIndex((prev) => prev - 1);
      setProgress(0);
    }
  }, [currentIndex]);

  const handleAreaClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    if (x < width / 3) {
      handlePrev();
    } else {
      handleNext();
    }
  };

  const getStoryBackground = () => {
    if (currentStory.media_url) {
      return {
        backgroundImage: `url(${currentStory.media_url})`,
        backgroundSize: 'cover',
        backgroundPosition: 'center',
      };
    }
    
    return {
      background: currentStory.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    };
  };

  const getTypeLabel = (type: OperatorStory['type']) => {
    const labels = {
      PROMOTIONS: { text: 'Promotion', icon: Tag, color: 'bg-red-500' },
      PROMO: { text: 'Promotion', icon: Tag, color: 'bg-red-500' },
      NEW_ROUTE: { text: 'Nouveau trajet', icon: MapPin, color: 'bg-green-500' },
      ANNOUNCEMENT: { text: 'Annonce', icon: Calendar, color: 'bg-amber-500' },
      EVENT: { text: 'Événement', icon: Calendar, color: 'bg-blue-500' },
      ACHIEVEMENT: { text: 'Actualité', icon: Tag, color: 'bg-purple-500' },
      ALERTE: { text: 'Alerte', icon: Calendar, color: 'bg-red-500' },
      ACTUALITE: { text: 'Actualité', icon: Calendar, color: 'bg-blue-500' },
    };
    return labels[type] || { text: type, icon: Tag, color: 'bg-gray-500' };
  };

  if (!currentStory) {
    console.error('❌ OperatorStoriesViewer: No stories to display', { stories, currentIndex });
    return (
      <motion.div
        className="fixed inset-0 z-50 bg-black flex items-center justify-center"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
      >
        <div className="text-white text-center">
          <p className="text-2xl mb-4">❌ Pas de stories disponibles</p>
          <p className="text-gray-400 mb-6">Les stories sont peut-être expirées</p>
          <button
            onClick={onClose}
            className="px-6 py-2 bg-white text-black rounded-lg"
          >
            Fermer
          </button>
        </div>
      </motion.div>
    );
  }

  const typeInfo = getTypeLabel(currentStory.type);
  const TypeIcon = typeInfo.icon;

  return (
    <AnimatePresence>
      <motion.div
        className="fixed inset-0 z-50 bg-black"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onMouseDown={() => setIsPaused(true)}
        onMouseUp={() => setIsPaused(false)}
        onTouchStart={() => setIsPaused(true)}
        onTouchEnd={() => setIsPaused(false)}
      >
        {/* Progress Bars */}
        <div className="absolute top-0 left-0 right-0 z-20 flex gap-1 p-2">
          {stories.map((story, index) => (
            <div key={story.id} className="flex-1 h-1 bg-white/30 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white rounded-full"
                initial={{ width: '0%' }}
                animate={{
                  width: index < currentIndex ? '100%' : index === currentIndex ? `${progress}%` : '0%',
                }}
                transition={{ duration: 0.1 }}
              />
            </div>
          ))}
        </div>

        {/* Header */}
        <div className="absolute top-4 left-0 right-0 z-20 px-4 pt-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-xl border-2 border-white/40">
                {operatorLogo}
              </div>
              <div className="text-white">
                <p className="font-medium">{operatorName}</p>
                <p className="text-xs opacity-80">
                  {new Date(currentStory.created_at).toLocaleDateString('fr-FR', { 
                    day: 'numeric', 
                    month: 'short' 
                  })}
                </p>
              </div>
            </div>

            <motion.button
              onClick={onClose}
              className="w-10 h-10 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30"
              whileHover={{ scale: 1.1 }}
              whileTap={{ scale: 0.9 }}
            >
              <X className="w-5 h-5" />
            </motion.button>
          </div>
        </div>

        {/* Story Content */}
        <motion.div
          key={currentStory.id}
          className="absolute inset-0 flex items-center justify-center"
          style={getStoryBackground()}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.05 }}
          transition={{ duration: 0.3 }}
          onClick={handleAreaClick}
        >
          {/* Overlay gradient for readability */}
          {currentStory.media_url && (
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-black/50" />
          )}

          {/* Content */}
          <div className="relative z-10 px-8 text-center text-white max-w-lg">
            {currentStory.emoji && (
              <motion.div
                className="text-8xl mb-6"
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.2, type: 'spring' }}
              >
                {currentStory.emoji}
              </motion.div>
            )}

            {/* Type Badge */}
            <motion.div
              className={`inline-flex items-center gap-2 ${typeInfo.color} text-white px-4 py-2 rounded-full text-xs mb-4`}
              initial={{ y: -20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.1 }}
            >
              <TypeIcon className="w-4 h-4" />
              {typeInfo.text}
            </motion.div>

            <motion.h2
              className="text-3xl sm:text-4xl mb-4 drop-shadow-lg"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2 }}
            >
              {currentStory.title}
            </motion.h2>

            {currentStory.subtitle && (
              <motion.p
                className="text-xl mb-4 text-white/90 drop-shadow"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3 }}
              >
                {currentStory.subtitle}
              </motion.p>
            )}

            {currentStory.description && (
              <motion.p
                className="text-base mb-8 text-white/80 drop-shadow"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.4 }}
              >
                {currentStory.description}
              </motion.p>
            )}

            {currentStory.cta_text && (
              <motion.a
                href={currentStory.cta_link || '#'}
                className="inline-block px-8 py-4 bg-white text-gray-900 rounded-full hover:bg-gray-100 transition-all shadow-xl"
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.5 }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={(e) => {
                  e.stopPropagation();
                  feedback.tap();
                }}
              >
                {currentStory.cta_text}
              </motion.a>
            )}
          </div>

          {/* Navigation Hint (invisible tap zones) */}
          <div className="absolute inset-0 flex pointer-events-auto">
            <div className="flex-1" /> {/* Left 1/3 = Previous */}
            <div className="flex-1" /> {/* Middle 1/3 = Ignored */}
            <div className="flex-1" /> {/* Right 1/3 = Next */}
          </div>
        </motion.div>

        {/* Desktop Navigation Arrows */}
        <div className="hidden md:block">
          {currentIndex > 0 && (
            <motion.button
              onClick={handlePrev}
              className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 z-20"
              whileHover={{ scale: 1.1, x: -5 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronLeft className="w-6 h-6" />
            </motion.button>
          )}

          {currentIndex < stories.length - 1 && (
            <motion.button
              onClick={handleNext}
              className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center text-white hover:bg-white/30 z-20"
              whileHover={{ scale: 1.1, x: 5 }}
              whileTap={{ scale: 0.9 }}
            >
              <ChevronRight className="w-6 h-6" />
            </motion.button>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
