import { useState, useEffect } from 'react';
import { toast } from 'sonner';
import { createLogger } from './logger';

// Logger pour le Service Worker
const logger = createLogger('ServiceWorker', 'general');

export function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      navigator.serviceWorker
        .register('/sw.js')
        .then((registration) => {
          logger.info('✅ Service Worker enregistré', { scope: registration.scope });

          // Vérifier les mises à jour toutes les heures
          setInterval(() => {
            registration.update();
          }, 60 * 60 * 1000);

          // Écouter les mises à jour
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // Nouvelle version disponible
                  logger.info('Nouvelle version disponible');
                  toast.info('Nouvelle version disponible !', {
                    description: 'Actualisez pour profiter des dernières améliorations',
                    duration: 10000,
                    action: {
                      label: 'Actualiser',
                      onClick: () => {
                        newWorker.postMessage({ type: 'SKIP_WAITING' });
                        window.location.reload();
                      }
                    }
                  });
                }
              });
            }
          });
        })
        .catch((error) => {
          logger.error('❌ Erreur Service Worker', error);
        });

      // Détecter si l'app est installée
      let deferredPrompt: any;
      
      window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;
        
        // Afficher bouton d'installation après 30 secondes
        setTimeout(() => {
          toast.info('Installer FasoTravel', {
            description: 'Accédez rapidement au dashboard depuis votre écran d\'accueil',
            duration: 15000,
            action: {
              label: 'Installer',
              onClick: async () => {
                if (deferredPrompt) {
                  deferredPrompt.prompt();
                  const { outcome } = await deferredPrompt.userChoice;
                  logger.info('Réponse installation PWA', { outcome });
                  deferredPrompt = null;
                }
              }
            }
          });
        }, 30000);
      });

      // Détecter installation réussie
      window.addEventListener('appinstalled', () => {
        logger.info('✅ PWA installée avec succès');
        toast.success('FasoTravel installé avec succès !');
        deferredPrompt = null;
      });
    });
  }
}

// Hook pour détecter si online/offline
export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connexion rétablie', {
        description: 'Vous êtes de nouveau en ligne'
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast.warning('Hors ligne', {
        description: 'Certaines fonctionnalités sont limitées',
        duration: 5000
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return isOnline;
}