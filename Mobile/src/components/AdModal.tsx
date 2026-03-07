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
import { useState, useEffect } from 'react';
import { X, ExternalLink, ChevronRight } from 'lucide-react';
import { Button } from './ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { API_ENDPOINTS, buildUrl, shouldUseMock, getDefaultHeaders, ADS_CONFIG } from '../lib/config';

export interface Advertisement {
  id: string;
  title: string;
  description: string;
  
  // Media
  media_type: 'image' | 'video' | 'gradient';
  media_url?: string;
  gradient?: string;
  emoji?: string;
  
  // Actions
  cta_text?: string;          // "Voir l'offre", "Réserver maintenant", etc.
  action_type: 'internal' | 'external' | 'none';
  action_url?: string;        // URL externe ou route interne
  internal_page?: string;     // Page de l'app (ex: 'operators', 'search-results')
  internal_data?: any;        // Données à passer (ex: opérateur spécifique)
  
  // Ciblage
  target_pages?: string[];    // Pages où afficher ['home', 'tickets']
  target_new_users?: boolean; // Uniquement nouveaux utilisateurs
  priority: number;           // 1-10 (10 = haute priorité)
  
  // Programmation
  start_date: string;
  end_date: string;
  max_impressions?: number;   // Limite d'affichages
  max_clicks?: number;        // Limite de clics
  
  // Statistiques (en lecture seule)
  impressions_count: number;
  clicks_count: number;
  
  // Admin
  created_by: string;
  is_active: boolean;
}

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

    // Récupérer les annonces actives depuis l'API
    const ad = await fetchTargetedAd();
    
    if (ad) {
      setCurrentAd(ad);
      
      // Délai avant affichage (moins agressif)
      setTimeout(() => {
        setIsVisible(true);
        trackImpression(ad.id);
        localStorage.setItem('last_ad_shown', Date.now().toString());
      }, ADS_CONFIG.DISPLAY_DELAY);
    }
  };

  const fetchTargetedAd = async (): Promise<Advertisement | null> => {
    try {
      // MODE DEV: Utiliser données mock
      if (shouldUseMock()) {
        return getMockAd(currentPage, isNewUser);
      }

      // MODE PROD: Vraie requête API
      const url = buildUrl(API_ENDPOINTS.ads.active, {
        page: currentPage,
        user_id: userId,
        is_new: isNewUser
      });
      
      const response = await fetch(url, {
        method: 'GET',
        headers: getDefaultHeaders(false)
      });
      
      if (!response.ok) return null;
      
      const ads: Advertisement[] = await response.json();
      
      // Sélectionner annonce selon priorité et ciblage
      return selectBestAd(ads);
      
    } catch (error) {
      console.error('Error fetching ads:', error);
      return null;
    }
  };

  const selectBestAd = (ads: Advertisement[]): Advertisement | null => {
    if (ads.length === 0) return null;
    
    // Filtrer les annonces valides
    const validAds = ads.filter(ad => {
      // Vérifier dates
      const now = new Date();
      const start = new Date(ad.start_date);
      const end = new Date(ad.end_date);
      if (now < start || now > end) return false;
      
      // Vérifier limites
      if (ad.max_impressions && ad.impressions_count >= ad.max_impressions) return false;
      if (ad.max_clicks && ad.clicks_count >= ad.max_clicks) return false;
      
      // Vérifier si pas déjà vue récemment
      const viewedAds = JSON.parse(localStorage.getItem('viewed_ads') || '[]');
      const recentlyViewed = viewedAds.find((v: any) => 
        v.ad_id === ad.id && Date.now() - v.timestamp < 24 * 60 * 60 * 1000
      );
      if (recentlyViewed) return false;
      
      return true;
    });
    
    if (validAds.length === 0) return null;
    
    // Trier par priorité (décroissant)
    validAds.sort((a, b) => b.priority - a.priority);
    
    // Retourner la plus prioritaire
    return validAds[0];
  };

  const trackImpression = async (adId: string) => {
    // Stocker localement
    const viewedAds = JSON.parse(localStorage.getItem('viewed_ads') || '[]');
    viewedAds.push({ ad_id: adId, timestamp: Date.now() });
    localStorage.setItem('viewed_ads', JSON.stringify(viewedAds.slice(-50))); // Garder 50 dernières

    // Envoyer au backend (skip si mode mock)
    if (shouldUseMock()) return;
    
    try {
      await fetch(API_ENDPOINTS.ads.impression(adId), {
        method: 'POST',
        headers: getDefaultHeaders(false),
        body: JSON.stringify({ 
          user_id: userId, 
          page: currentPage,
          device_type: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
        })
      });
    } catch (error) {
      console.error('Error tracking impression:', error);
    }
  };

  const trackClick = async (adId: string) => {
    // Skip si mode mock
    if (shouldUseMock()) return;
    
    try {
      await fetch(API_ENDPOINTS.ads.click(adId), {
        method: 'POST',
        headers: getDefaultHeaders(false),
        body: JSON.stringify({ 
          user_id: userId, 
          page: currentPage,
          action_type: currentAd?.action_type,
          device_type: /mobile/i.test(navigator.userAgent) ? 'mobile' : 'desktop'
        })
      });
    } catch (error) {
      console.error('Error tracking click:', error);
    }
  };

  const handleAdClick = () => {
    if (!currentAd) return;
    
    trackClick(currentAd.id);
    
    if (currentAd.action_type === 'internal' && currentAd.internal_page) {
      // Navigation interne
  onNavigate?.(currentAd.internal_page as Page, currentAd.internal_data);
      handleClose();
    } else if (currentAd.action_type === 'external' && currentAd.action_url) {
      // Ouvrir URL externe
      window.open(currentAd.action_url, '_blank');
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
              {currentAd.media_type === 'image' && currentAd.media_url && (
                <div className="relative w-full h-64 bg-gray-100">
                  <img
                    src={currentAd.media_url}
                    alt={currentAd.title}
                    className="w-full h-full object-cover"
                  />
                  
                  {/* Badge "Publicité" */}
                  <div className="absolute top-3 left-3 bg-black/70 text-white text-xs px-3 py-1 rounded-full">
                    Publicité
                  </div>
                </div>
              )}

              {currentAd.media_type === 'gradient' && (
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
                  
                  {currentAd.action_type !== 'none' && (
                    <Button
                      onClick={handleAdClick}
                      className="flex-1 bg-gradient-to-r from-red-600 via-amber-500 to-green-600 hover:from-red-700 hover:via-amber-600 hover:to-green-700 text-white"
                    >
                      {currentAd.cta_text || 'En savoir plus'}
                      {currentAd.action_type === 'external' ? (
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

/**
 * Mock data pour développement
 */
function getMockAd(currentPage: string, isNewUser?: boolean): Advertisement | null {
  const mockAds: Advertisement[] = [
    {
      id: 'ad-1',
      title: '🎉 Promotion Ouaga-Bobo',
      description: 'Profitez de -30% sur tous les trajets Ouagadougou ↔ Bobo-Dioulasso ce mois-ci !',
      media_type: 'gradient',
      gradient: 'linear-gradient(135deg, #EF2B2D 0%, #FCD116 50%, #009E49 100%)',
      emoji: '🚌',
      cta_text: 'Voir les offres',
      action_type: 'internal',
      internal_page: 'search-results',
      internal_data: {
        from: 'ouaga-1',
        to: 'bobo-1',
        type: 'ALLER_SIMPLE'
      },
      target_pages: ['home', 'tickets'],
      target_new_users: false,
      priority: 8,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      impressions_count: 245,
      clicks_count: 32,
      created_by: 'admin',
      is_active: true
    },
    {
      id: 'ad-2',
      title: 'Nouveau : Tracking en temps réel',
      description: 'Suivez votre bus en direct sur la carte ! Disponible sur tous nos trajets premium.',
      media_type: 'gradient',
      gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      emoji: '📍',
      cta_text: 'Découvrir',
      action_type: 'internal',
      internal_page: 'operators',
      target_pages: ['home', 'search-results'],
      target_new_users: true,
      priority: 6,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      impressions_count: 120,
      clicks_count: 18,
      created_by: 'admin',
      is_active: true
    },
    {
      id: 'ad-3',
      title: 'Parrainage : 5000 FCFA offerts',
      description: 'Parrainez vos amis et recevez 5000 FCFA pour chaque inscription réussie !',
      media_type: 'gradient',
      gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
      emoji: '🎁',
      cta_text: 'Parrainer',
      action_type: 'internal',
      internal_page: 'profile',
      target_pages: ['tickets', 'profile'],
      target_new_users: false,
      priority: 5,
      start_date: '2026-01-01',
      end_date: '2026-12-31',
      impressions_count: 89,
      clicks_count: 12,
      created_by: 'admin',
      is_active: true
    }
  ];

  // Filtrer par page
  const targetedAds = mockAds.filter(ad => 
    !ad.target_pages || ad.target_pages.includes(currentPage)
  );

  // Filtrer par nouveaux utilisateurs
  const filteredAds = targetedAds.filter(ad =>
    !ad.target_new_users || (ad.target_new_users && isNewUser)
  );

  // Retourner aléatoirement parmi les annonces ciblées
  if (filteredAds.length === 0) return null;
  
  // Pondération par priorité
  const weightedAds = filteredAds.flatMap(ad => 
    Array(ad.priority).fill(ad)
  );
  
  return weightedAds[Math.floor(Math.random() * weightedAds.length)];
}
