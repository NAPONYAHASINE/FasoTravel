/**
 * AdModal - Système de publicités interstitielles
 * 
 * FEATURES:
 * - Affichage automatique géré par fréquence
 * - Support images, vidéos, gradients
 * - Redirection interne (navigation app) ou externe (URL)
 * - Tracking impressions et clics
 * - Ciblage par page, temps, utilisateur
 * - Priorisation des annonces
 * - Limite de fréquence (pas de spam)
 * 
 * DEV NOTES:
 * - Endpoints API:
 *   - GET /api/ads/active - Récupère annonces actives
 *   - POST /api/ads/:id/impression - Track vue
 *   - POST /api/ads/:id/click - Track clic
 * - Admin dashboard pour créer/gérer annonces
 */
import './styles.css';
import type { Page } from '../App';
import type { Advertisement } from '../data/models';
import { useState, useEffect } from 'react';
import { X, ExternalLink, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { ADS_CONFIG } from '../lib/config';
import { adsService } from '../services/api/ads.service';

interface AdModalProps {
  currentPage: string;        // Page actuelle pour ciblage
  onNavigate?: (page: Page, data?: any) => void;
  userId?: string;            // Pour personnalisation
  isNewUser?: boolean;        // Si utilisateur récent
}

export function AdModal({ currentPage, onNavigate, userId, isNewUser }: AdModalProps) {
  const [currentAd, setCurrentAd] = useState<Advertisement | null>(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    loadAndShowAd();
  }, [currentPage]);

  const loadAndShowAd = async () => {
    // Vérifier la fréquence d'affichage (ne pas spammer)
    const lastAdShown = localStorage.getItem('last_ad_shown');
    
    if (lastAdShown) {
      const timeSinceLastAd = Date.now() - Number(lastAdShown);
      if (timeSinceLastAd < ADS_CONFIG.MIN_FREQUENCY) {
        return; // Trop tôt pour afficher une pub
      }
    }

    try {
      // Récupère les annonces ciblées via le service (mock ou API)
      const ads = await adsService.getActiveAds({
        page: currentPage,
        userId,
        isNewUser,
      });

      const ad = selectBestAd(ads);

      if (ad) {
        setCurrentAd(ad);

        // Délai avant affichage (moins agressif)
        setTimeout(() => {
          setIsVisible(true);
          handleImpression(ad.id);
          localStorage.setItem('last_ad_shown', Date.now().toString());
        }, ADS_CONFIG.DISPLAY_DELAY);
      }
    } catch (error) {
      console.error('Error loading ads:', error);
    }
  };

  const selectBestAd = (ads: Advertisement[]): Advertisement | null => {
    if (ads.length === 0) return null;

    // Filtrer les annonces pas vues récemment
    const viewedAds = JSON.parse(localStorage.getItem('viewed_ads') || '[]');
    const validAds = ads.filter(ad => {
      const recentlyViewed = viewedAds.find((v: any) =>
        v.ad_id === ad.id && Date.now() - v.timestamp < 24 * 60 * 60 * 1000
      );
      return !recentlyViewed;
    });

    if (validAds.length === 0) return null;

    // Trier par priorité
    validAds.sort((a, b) => b.priority - a.priority);
    return validAds[0];
  };

  const handleImpression = async (adId: string) => {
    // Stocker localement
    const viewedAds = JSON.parse(localStorage.getItem('viewed_ads') || '[]');
    viewedAds.push({ ad_id: adId, timestamp: Date.now() });
    localStorage.setItem('viewed_ads', JSON.stringify(viewedAds.slice(-50)));

    // Track via service
    adsService.trackImpression(adId, { userId, page: currentPage }).catch(() => {});
  };

  const handleAdClick = () => {
    if (!currentAd) return;
    
    // Track via service
    adsService.trackClick(currentAd.id, {
      userId,
      page: currentPage,
      actionType: currentAd.actionType,
    }).catch(() => {});
    
    if (currentAd.actionType === 'internal' && currentAd.internalPage) {
      onNavigate?.(currentAd.internalPage as Page, currentAd.internalData);
      handleClose();
    } else if (currentAd.actionType === 'external' && currentAd.actionUrl) {
      window.open(currentAd.actionUrl, '_blank');
      handleClose();
    }
  };

  const handleClose = () => {
    setIsVisible(false);
    setTimeout(() => setCurrentAd(null), 300); // Attendre fin de l'animation
  };

  if (!currentAd || !isVisible) return null;

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
          onClick={handleClose}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="relative w-full max-w-md"
            onClick={(e: React.MouseEvent) => e.stopPropagation()}
          >
            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute -top-10 right-0 text-white hover:text-gray-300 transition-colors z-10"
              aria-label="Fermer"
            >
              <X className="w-8 h-8" />
            </button>

            {/* Ad Card */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl overflow-hidden">
              {/* Media Section */}
              {currentAd.mediaType === 'image' && currentAd.mediaUrl && (
                <div className="relative w-full h-64 bg-gray-100">
                  <img
                    src={currentAd.mediaUrl}
                    alt={currentAd.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Badge "Publicité" */}
                  <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
                    Publicité
                  </div>
                </div>
              )}

              {currentAd.mediaType === 'gradient' && (
                <div
                  style={{ background: currentAd.gradient || 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}
                  className="relative w-full h-64 flex items-center justify-center"
                >
                  {currentAd.emoji && (
                    <span className="text-8xl">{currentAd.emoji}</span>
                  )}
                  
                  <div className="absolute top-3 left-3 bg-white/20 dark:bg-black/40 backdrop-blur-sm text-white text-xs px-3 py-1 rounded-full">
                    Publicité
                  </div>
                </div>
              )}

              {/* Content Section */}
              <div className="p-6">
                <h3 className="text-2xl text-gray-900 dark:text-white mb-3">
                  {currentAd.title}
                </h3>
                <p className="text-base text-gray-600 dark:text-gray-300 leading-relaxed mb-6">
                  {currentAd.description}
                </p>

                {/* Actions */}
                <div className="flex gap-3">
                  <Button
                    onClick={handleClose}
                    variant="outline"
                    className="flex-1"
                  >
                    Passer
                  </Button>
                  
                  {currentAd.actionType !== 'none' && (
                    <Button
                      onClick={handleAdClick}
                      className="flex-1 bg-gradient-to-r from-red-600 via-amber-500 to-green-600 hover:from-red-700 hover:via-amber-600 hover:to-green-700 text-white"
                    >
                      {currentAd.ctaText || 'En savoir plus'}
                      {currentAd.actionType === 'external' ? (
                        <ExternalLink className="w-4 h-4 ml-2" />
                      ) : (
                        <ChevronRight className="w-4 h-4 ml-2" />
                      )}
                    </Button>
                  )}
                </div>

                {/* Small text */}
                <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-4">
                  Cette annonce aide à financer TransportBF
                </p>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
