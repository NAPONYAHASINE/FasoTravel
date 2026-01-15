/**
 * RatingReviewPage - Évaluation d'un trajet
 * 
 * Affiche après la fin d'un trajet (embarqué) pour recueillir:
 * - Note globale (1-5 étoiles)
 * - Notes aspects (confort, propreté, timing, comportement chauffeur, rapport qualité-prix)
 * - Commentaire détaillé
 * 
 * DEV NOTES:
 * - Endpoint: POST /api/reviews (créer avis)
 * - Notification déclenche cette page
 * - Avis anonyme mais on sait: quel trajet, quelle compagnie, quel utilisateur
 * - Moyennes mises à jour côté backend (avg rating sur table operators)
 * - Avis stockés en PENDING → APPROVED par modérateur
 */

import type { Page } from '../App';
import { useState } from 'react';
import { ArrowLeft, Star, MessageSquare, Send, AlertCircle } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion } from 'motion/react';
import { feedback } from '../lib/interactions';

interface RatingReviewPageProps {
  onNavigate: (page: Page, data?: any) => void;
  tripData?: {
    trip_id: string;
    operator_id: string;
    operator_name: string;
    from_stop_name: string;
    to_stop_name: string;
    departure_time: string;
    arrival_time: string;
    ticket_id: string;
  };
}

interface AspectRating {
  cleanliness?: number;
  comfort?: number;
  timing?: number;
  driver_behaviour?: number;
  value_for_money?: number;
}

const ASPECTS = [
  { key: 'cleanliness', label: '🧹 Propreté', emoji: '🧹' },
  { key: 'comfort', label: '💺 Confort', emoji: '💺' },
  { key: 'timing', label: '⏰ Ponctualité', emoji: '⏰' },
  { key: 'driver_behaviour', label: '👨‍✈️ Comportement chauffeur', emoji: '👨‍✈️' },
  { key: 'value_for_money', label: '💰 Rapport qualité-prix', emoji: '💰' }
];

export function RatingReviewPage({ onNavigate, tripData }: RatingReviewPageProps) {
  const [overallRating, setOverallRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [aspectRatings, setAspectRatings] = useState<AspectRating>({});
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleRatingClick = (rating: number) => {
    setOverallRating(rating);
    feedback.tap();
  };

  const handleAspectRating = (aspect: string, rating: number) => {
    setAspectRatings(prev => ({
      ...prev,
      [aspect]: rating === (prev as any)[aspect] ? 0 : rating
    }));
    feedback.tap();
  };

  const handleSubmit = async () => {
    // Validation
    if (overallRating === 0) {
      setSubmitError('Veuillez donner une note générale');
      feedback.error();
      return;
    }

    if (comment.trim().length < 10) {
      setSubmitError('Le commentaire doit contenir au moins 10 caractères');
      feedback.error();
      return;
    }

    setIsSubmitting(true);
    setSubmitError(null);
    feedback.tap();

    try {
      // Construire le payload
      const reviewData = {
        trip_id: tripData?.trip_id,
        operator_id: tripData?.operator_id,
        rating: overallRating,
        comment: comment.trim(),
        aspects: Object.keys(aspectRatings).length > 0 ? aspectRatings : undefined,
        is_verified_traveler: true // Backend vérife que l'utilisateur a vraiment pris ce trajet
      };

      // TODO: Connecter à la vraie API
      // const response = await fetch('/api/reviews', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify(reviewData)
      // });

      // Pour le moment, simuler succès
      console.log('Submitting review:', reviewData);
      await new Promise(resolve => setTimeout(resolve, 1500)); // Simuler délai API

      feedback.success();
      setIsSuccess(true);

      // Rediriger après 2 secondes
      setTimeout(() => {
        onNavigate('tickets');
      }, 2000);
    } catch (error) {
      console.error('Error submitting review:', error);
      setSubmitError('Erreur lors de l\'envoi de l\'avis. Veuillez réessayer.');
      feedback.error();
      setIsSubmitting(false);
    }
  };

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-green-50 to-white dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="text-center max-w-md"
        >
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 1, delay: 0.2 }}
            className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-6"
          >
            <Star className="w-8 h-8 text-green-600 dark:text-green-400 fill-green-600" />
          </motion.div>
          
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
            Merci pour votre avis !
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-2">
            Votre évaluation aidera à améliorer nos services.
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-500">
            Retour à vos billets...
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-4">
          <button
            onClick={() => {
              feedback.tap();
              onNavigate('tickets');
            }}
            className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
            aria-label="Retour"
          >
            <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">
              Évaluez votre trajet
            </h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Aidez-nous à améliorer nos services
            </p>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Trip Info Card */}
        {tripData && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white dark:bg-gray-800 rounded-2xl p-5 mb-8 shadow-sm border border-gray-200 dark:border-gray-700"
          >
            <div className="flex items-start gap-4">
              <div className="flex-1">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">
                  {tripData.operator_name}
                </h3>
                <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 mb-2">
                  <span className="font-medium">{tripData.from_stop_name}</span>
                  <span className="text-gray-400">→</span>
                  <span className="font-medium">{tripData.to_stop_name}</span>
                </div>
                <p className="text-sm text-gray-500 dark:text-gray-500">
                  {new Date(tripData.departure_time).toLocaleDateString('fr-FR')} •{' '}
                  {new Date(tripData.departure_time).toLocaleTimeString('fr-FR', {
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <Bus className="w-10 h-10 text-red-600/20 dark:text-red-400/20" />
            </div>
          </motion.div>
        )}

        {/* Error Alert */}
        {submitError && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 mb-6 flex items-start gap-3"
          >
            <AlertCircle className="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-800 dark:text-red-300">{submitError}</p>
          </motion.div>
        )}

        {/* Rating Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-8 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <label className="block text-lg font-bold text-gray-900 dark:text-white mb-6">
            ⭐ Quelle est votre note globale ?
          </label>
          
          <div className="flex justify-center gap-3 mb-4">
            {[1, 2, 3, 4, 5].map(star => (
              <motion.button
                key={star}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleRatingClick(star)}
                onMouseEnter={() => setHoverRating(star)}
                onMouseLeave={() => setHoverRating(0)}
                className="p-2 transition-transform"
              >
                <Star
                  className={`w-12 h-12 transition-all ${
                    star <= (hoverRating || overallRating)
                      ? 'fill-amber-400 text-amber-400 dark:text-amber-300 dark:fill-amber-300'
                      : 'text-gray-300 dark:text-gray-600'
                  }`}
                />
              </motion.button>
            ))}
          </div>

          <div className="text-center">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {overallRating === 0
                ? 'Cliquez pour noter'
                : `Vous avez donné ${overallRating} ${overallRating === 1 ? 'étoile' : 'étoiles'}`}
            </p>
          </div>
        </motion.div>

        {/* Aspect Ratings */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-8 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <label className="block text-lg font-bold text-gray-900 dark:text-white mb-6">
            📊 Évaluation par aspects (optionnel)
          </label>

          <div className="space-y-5">
            {ASPECTS.map(aspect => (
              <div key={aspect.key}>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-medium text-gray-900 dark:text-white">
                    {aspect.label}
                  </label>
                  <span className="text-xs text-gray-500 dark:text-gray-400">
                    {(aspectRatings as any)[aspect.key] || '—'}
                  </span>
                </div>
                
                <div className="flex gap-1.5">
                  {[1, 2, 3, 4, 5].map(star => (
                    <motion.button
                      key={star}
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      onClick={() => handleAspectRating(aspect.key, star)}
                      className="flex-1 py-2 rounded-lg transition-all"
                    >
                      <Star
                        className={`w-5 h-5 mx-auto transition-all ${
                          star <= ((aspectRatings as any)[aspect.key] || 0)
                            ? 'fill-amber-400 text-amber-400 dark:text-amber-300 dark:fill-amber-300'
                            : 'text-gray-200 dark:text-gray-700'
                        }`}
                      />
                    </motion.button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        {/* Comment Section */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-white dark:bg-gray-800 rounded-2xl p-8 mb-8 shadow-sm border border-gray-200 dark:border-gray-700"
        >
          <label className="block text-lg font-bold text-gray-900 dark:text-white mb-4">
            💬 Laissez un commentaire détaillé
          </label>
          
          <div className="relative">
            <textarea
              value={comment}
              onChange={(e) => {
                setComment(e.target.value);
                setSubmitError(null);
              }}
              placeholder="Parlez-nous de votre expérience (ponctualité, cleanliness, courtoisie du chauffeur, etc.)..."
              className="w-full h-32 p-4 rounded-xl border border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent resize-none"
            />
            <MessageSquare className="absolute bottom-3 right-3 w-5 h-5 text-gray-400 pointer-events-none" />
          </div>

          <div className="mt-2 flex items-center justify-between">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Minimum 10 caractères
            </p>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400">
              {comment.length}/500
            </p>
          </div>
        </motion.div>

        {/* Info Box */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 mb-8"
        >
          <p className="text-sm text-blue-800 dark:text-blue-300">
            <span className="font-semibold">🔒 Votre avis est confidentiel</span> : Votre nom n'apparaîtra pas, 
            mais on saura de quel trajet et quelle compagnie il s'agit pour améliorer le service.
          </p>
        </motion.div>

        {/* Action Buttons */}
        <div className="flex gap-3 mb-8">
          <Button
            onClick={() => {
              feedback.tap();
              onNavigate('tickets');
            }}
            variant="outline"
            className="flex-1 py-3 rounded-xl"
            disabled={isSubmitting}
          >
            Plus tard
          </Button>
          
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting || overallRating === 0}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-red-600 via-amber-500 to-green-600 hover:from-red-700 hover:via-amber-600 hover:to-green-700 text-white font-semibold flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Envoi...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Envoyer mon avis
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// Icon de bus
function Bus(props: any) {
  return (
    <svg
      {...props}
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M8 6h8M6 6h12v10H6V6zm2 14v2m8-2v2M6 18h12" />
    </svg>
  );
}
