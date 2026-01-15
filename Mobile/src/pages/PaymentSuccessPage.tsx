import type { Page } from '../App';
/**
 * PaymentSuccessPage - Confirmation de paiement
 * 
 * DEV NOTES:
 * - Affiche après paiement réussi
 * - Event: payment_confirmed, ticket_created
 * - CTA: Voir mon billet, Retour à l'accueil
 * - PEAK-END LAW: Expérience de fin optimisée avec confetti, message personnalisé et partage
 */

import { CheckCircle, Share2, Download, Sparkles } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { feedback } from '../lib/interactions';

interface PaymentSuccessPageProps {
  reservationData: any;
  onNavigate: (page: Page, data?: any) => void;
}

export function PaymentSuccessPage({ reservationData, onNavigate }: PaymentSuccessPageProps) {
  const [showConfetti, setShowConfetti] = useState(true);

  useEffect(() => {
    // Track payment success event
    console.log('Payment success event:', reservationData);
    
    // Success feedback
    feedback.success();
    
    // Hide confetti after animation
    const timer = setTimeout(() => setShowConfetti(false), 5000);
    return () => clearTimeout(timer);
  }, [reservationData]);

  const handleShare = () => {
    feedback.tap();
    if (navigator.share) {
      navigator.share({
        title: 'TransportBF - Réservation confirmée',
        text: `Mon voyage ${reservationData.outbound?.trip?.from_stop_name} → ${reservationData.outbound?.trip?.to_stop_name} est réservé !`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-amber-50 to-red-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800 flex items-center justify-center px-4 sm:px-6 py-8 relative overflow-hidden">
      {/* Confetti Animation */}
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {[...Array(50)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 sm:w-3 sm:h-3 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#dc2626', '#f59e0b', '#16a34a'][Math.floor(Math.random() * 3)],
              }}
              initial={{ y: -20, opacity: 1 }}
              animate={{ 
                y: window.innerHeight + 20, 
                x: Math.random() * 200 - 100,
                rotate: Math.random() * 360,
                opacity: 0
              }}
              transition={{ 
                duration: 2 + Math.random() * 2,
                delay: Math.random() * 0.5,
                ease: "easeOut"
              }}
            />
          ))}
        </div>
      )}

      <motion.div 
        className="max-w-md w-full text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        {/* Success Icon with Animation */}
        <motion.div 
          className="mb-6"
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15, delay: 0.2 }}
        >
          <motion.div 
            className="w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-green-400 to-green-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-2xl"
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <CheckCircle className="w-12 h-12 sm:w-16 sm:h-16 text-white" strokeWidth={2} />
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <Sparkles className="w-5 h-5 text-amber-500" />
              <h1 className="text-2xl sm:text-3xl text-gray-900 dark:text-white">Félicitations !</h1>
              <Sparkles className="w-5 h-5 text-amber-500" />
            </div>
            <p className="text-base sm:text-lg text-green-600 dark:text-green-400 mb-2">
              Votre réservation est confirmée
            </p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Merci de voyager avec TransportBF 🚌
            </p>
          </motion.div>
        </motion.div>

        {/* Ticket Info */}
        <motion.div 
          className="bg-white dark:bg-gray-800 rounded-2xl p-5 sm:p-6 mb-4 sm:mb-6 shadow-2xl border-2 border-gray-100 dark:border-gray-700"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <div className="mb-4">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">Numéro de billet</p>
            <p className="text-xl sm:text-2xl text-amber-600 dark:text-amber-500">{reservationData.ticketId || 'AC7H851940'}</p>
          </div>

          <div className="pt-4 border-t border-gray-200 dark:border-gray-700 space-y-3 text-xs sm:text-sm">
            {/* Round trip info */}
            {reservationData.is_round_trip && (
              <div className="bg-gradient-to-r from-amber-50 to-green-50 dark:from-amber-900/20 dark:to-green-900/20 rounded-lg p-3 mb-2">
                <p className="text-amber-700 dark:text-amber-400 text-center">
                  🔄 Billet Aller-Retour
                </p>
              </div>
            )}

            {/* Outbound */}
            {reservationData.outbound && (
              <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-red-600 dark:text-red-400 mb-2">🚌 Trajet Aller</p>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Trajet</span>
                  <span className="text-gray-900 dark:text-gray-100 text-right">
                    {reservationData.outbound.trip?.from_stop_name} → {reservationData.outbound.trip?.to_stop_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Sièges</span>
                  <span className="text-gray-900 dark:text-gray-100">{reservationData.outbound.seats?.join(', ')}</span>
                </div>
              </div>
            )}

            {/* Return */}
            {reservationData.return && (
              <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-green-600 dark:text-green-400 mb-2">🔄 Trajet Retour</p>
                <div className="flex justify-between mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Trajet</span>
                  <span className="text-gray-900 dark:text-gray-100 text-right">
                    {reservationData.return.trip?.from_stop_name} → {reservationData.return.trip?.to_stop_name}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Sièges</span>
                  <span className="text-gray-900 dark:text-gray-100">{reservationData.return.seats?.join(', ')}</span>
                </div>
              </div>
            )}

            {/* Passengers */}
            {reservationData.passengers && (
              <div className="pb-3 border-b border-gray-200 dark:border-gray-700">
                <p className="text-gray-600 dark:text-gray-400 mb-2">Passagers</p>
                {reservationData.passengers.map((p: any, i: number) => (
                  <p key={i} className="text-gray-900 dark:text-gray-100 text-xs">• {p.name}</p>
                ))}
              </div>
            )}

            {/* Old format support */}
            {reservationData.passenger_name && (
              <>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Passager</span>
                  <span className="text-gray-900 dark:text-gray-100">{reservationData.passenger_name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600 dark:text-gray-400">Siège</span>
                  <span className="text-gray-900 dark:text-gray-100">{reservationData.seat}</span>
                </div>
              </>
            )}

            <div className="flex justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
              <span className="text-gray-900 dark:text-gray-100">Montant payé</span>
              <span className="text-lg sm:text-xl text-green-600 dark:text-green-400">
                {(reservationData.total_price || reservationData.price)?.toLocaleString()} FCFA
              </span>
            </div>
          </div>
        </motion.div>

        {/* Personalized Message */}
        <motion.div 
          className="bg-gradient-to-r from-amber-50 to-green-50 dark:from-amber-900/20 dark:to-green-900/20 border-2 border-amber-200 dark:border-amber-800 rounded-xl p-4 mb-4 text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1 }}
        >
          <p className="text-sm text-gray-800 dark:text-gray-200 mb-2">
            🎉 <strong>Voyage réussi garanti !</strong>
          </p>
          <p className="text-xs text-gray-700 dark:text-gray-300">
            Votre billet est maintenant disponible dans "Mes billets". 
            Présentez-le au conducteur lors de l'embarquement. Bon voyage !
          </p>
        </motion.div>

        {/* Info Message */}
        <motion.div 
          className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-3 sm:p-4 mb-4 sm:mb-6 text-left"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
        >
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300">
            📧 Un email de confirmation a été envoyé à votre adresse.
          </p>
          <p className="text-xs sm:text-sm text-blue-800 dark:text-blue-300 mt-2">
            📱 Vous pouvez également accéder à votre billet depuis "Mes billets".
          </p>
        </motion.div>

        {/* Actions */}
        <motion.div 
          className="space-y-2 sm:space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2 }}
        >
          <Button
            onClick={() => {
              feedback.tap();
              onNavigate('ticket-detail', reservationData.ticketId || 'AC7H851940');
            }}
            className="w-full bg-gradient-to-r from-red-600 via-amber-500 to-green-600 hover:from-red-700 hover:via-amber-600 hover:to-green-700 py-5 sm:py-6 text-base sm:text-lg shadow-lg"
          >
            <Download className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
            Voir mon billet
          </Button>

          <div className="grid grid-cols-2 gap-2">
            <Button
              onClick={handleShare}
              variant="outline"
              className="py-4 sm:py-5 border-2 dark:border-gray-700 dark:text-gray-200"
            >
              <Share2 className="w-4 h-4 mr-1.5" />
              Partager
            </Button>
            <Button
              onClick={() => {
                feedback.tap();
                onNavigate('home');
              }}
              variant="outline"
              className="py-4 sm:py-5 border-2 dark:border-gray-700 dark:text-gray-200"
            >
              Accueil
            </Button>
          </div>

          {/* First trip badge */}
          <motion.div
            className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 1.5 }}
          >
            <div className="flex items-center justify-center gap-2 text-amber-600 dark:text-amber-400">
              <Sparkles className="w-4 h-4" />
              <p className="text-xs sm:text-sm">Merci d'avoir effectué votre voyage avec nous !</p>
            </div>
          </motion.div>
        </motion.div>
      </motion.div>
    </div>
  );
}
