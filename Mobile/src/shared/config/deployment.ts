/**
 * 🌍 DEPLOYMENT CONFIG - PARTAGÉ MOBILE & SOCIETE
 * 
 * Une seule source de vérité pour isDevelopment()
 */

/**
 * Vérifie si on est en mode développement/local
 * ✅ FONCTION UNIFIÉE pour Mobile & Societe
 * 
 * En mode APK sans backend déployé, on force le mode dev via VITE_FORCE_DEV_MODE=true
 * pour utiliser les données mockées (localStorage). Quand le backend sera en production,
 * il suffira de retirer cette variable et rebuild.
 */
export const isDevelopment = (): boolean => {
  // VITE_FORCE_DEV_MODE=true → forcer le mode dev même en build production (APK sans backend)
  if (import.meta.env.VITE_FORCE_DEV_MODE === 'true') return true;
  return !import.meta.env.PROD;
};

/**
 * Alias pour cohérence Societe (isLocalMode = isDevelopment)
 */
export const isLocalMode = (): boolean => {
  return isDevelopment();
};

/**
 * Environnement actuel
 */
const _forceDevMode = import.meta.env.VITE_FORCE_DEV_MODE === 'true';
export const DEPLOYMENT_MODE = (import.meta.env.PROD && !_forceDevMode) ? 'PRODUCTION' : 'LOCAL' as const;

export type DeploymentMode = typeof DEPLOYMENT_MODE;

/**
 * Export pour rétro-compatibilité
 */
export const isProduction = (): boolean => !isDevelopment();
