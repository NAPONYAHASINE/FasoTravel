/**
 * 🌍 DEPLOYMENT CONFIG - PARTAGÉ MOBILE & SOCIETE
 * 
 * Une seule source de vérité pour isDevelopment()
 */

/**
 * Vérifie si on est en mode développement/local
 * ✅ FONCTION UNIFIÉE pour Mobile & Societe
 */
export const isDevelopment = (): boolean => {
  // TODO: Remettre !import.meta.env.PROD quand le backend sera connecté
  return true;
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
export const DEPLOYMENT_MODE = import.meta.env.PROD ? 'PRODUCTION' : 'LOCAL' as const;

export type DeploymentMode = typeof DEPLOYMENT_MODE;

/**
 * Export pour rétro-compatibilité
 */
export const isProduction = (): boolean => !isDevelopment();
