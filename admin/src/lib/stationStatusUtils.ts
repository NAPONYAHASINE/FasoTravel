/**
 * @file stationStatusUtils.ts
 * @description Calcul automatique du statut des gares basé sur:
 * 1. Heures d'ouverture
 * 2. Connexion internet (heartbeat des CAISSIERS de l'App Société)
 * 
 * 🏗️ ARCHITECTURE APP SOCIÉTÉ:
 * L'Application Société est divisée en 3 modules:
 * - Module RESPONSABLE (CEO de la société) → Connexion Internet PAS importante
 * - Module MANAGER (Gestionnaire de gare) → Connexion Internet PAS importante
 * - Module CAISSIER (Vente de billets physiques) → ⚡ C'EST LÀ que la connexion est CRITIQUE
 * 
 * 💡 LOGIQUE ANTI-SURBOOKING:
 * - PENDANT heures d'ouverture: statut = connexion internet (évite divergences caisse/online)
 *   → Si AU MOINS UN caissier est connecté = ACTIVE (ventes online autorisées)
 *   → Si AUCUN caissier connecté = INACTIVE (ventes online bloquées)
 * - EN DEHORS heures d'ouverture: statut = toujours ACTIVE (caisse fermée, pas de risque)
 */

import type { Station } from '../shared/types/standardized';

// ============================================================================
// CONSTANTES
// ============================================================================

/**
 * Délai maximum depuis le dernier heartbeat pour considérer la connexion comme active
 * Si l'App Société n'envoie pas de ping pendant 30 secondes, elle est considérée déconnectée
 */
export const HEARTBEAT_TIMEOUT_SECONDS = 30;

// ============================================================================
// FONCTIONS PRINCIPALES
// ============================================================================

/**
 * Vérifie si une gare est actuellement dans ses heures d'ouverture
 * @param station - La gare à vérifier
 * @param now - Date actuelle (optionnel, pour tests)
 * @returns true si la gare est ouverte, false sinon
 */
export function isStationOpen(station: Station, now: Date = new Date()): boolean {
  // Si pas d'heures définies, on considère que la gare est ouverte 24/7
  if (!station.openingTime || !station.closingTime) {
    return true;
  }

  const currentTime = now.getHours() * 60 + now.getMinutes(); // Minutes depuis minuit
  
  // Parse opening and closing times (format HH:MM)
  const [openHour, openMin] = station.openingTime.split(':').map(Number);
  const [closeHour, closeMin] = station.closingTime.split(':').map(Number);
  
  const openingMinutes = openHour * 60 + openMin;
  const closingMinutes = closeHour * 60 + closeMin;
  
  // Cas normal: ouverture < fermeture (ex: 08:00 - 18:00)
  if (openingMinutes < closingMinutes) {
    return currentTime >= openingMinutes && currentTime < closingMinutes;
  }
  
  // Cas spécial: fermeture après minuit (ex: 20:00 - 02:00)
  return currentTime >= openingMinutes || currentTime < closingMinutes;
}

/**
 * Vérifie si l'App Société de cette gare est connectée à Internet
 * @param station - La gare à vérifier
 * @param now - Date actuelle (optionnel, pour tests)
 * @returns true si connectée (heartbeat récent), false sinon
 */
export function isStationConnected(station: Station, now: Date = new Date()): boolean {
  // Méthode 1: Backend calcule et envoie directement isConnected
  if (typeof station.isConnected === 'boolean') {
    return station.isConnected;
  }
  
  // Méthode 2: On calcule localement depuis le lastHeartbeat
  if (!station.lastHeartbeat) {
    return false; // Jamais reçu de heartbeat = déconnectée
  }
  
  const lastHeartbeatTime = new Date(station.lastHeartbeat).getTime();
  const currentTime = now.getTime();
  const timeDiffSeconds = (currentTime - lastHeartbeatTime) / 1000;
  
  return timeDiffSeconds <= HEARTBEAT_TIMEOUT_SECONDS;
}

/**
 * Calcule le statut automatique d'une gare
 * 
 * LOGIQUE ANTI-SURBOOKING:
 * - PENDANT heures d'ouverture: active SI connectée, inactive SI déconnectée
 * - EN DEHORS heures d'ouverture: toujours active (caisse fermée, pas de risque de divergence)
 * 
 * @param station - La gare
 * @param now - Date actuelle (optionnel, pour tests)
 * @returns 'active' ou 'inactive'
 */
export function calculateStationStatus(
  station: Station, 
  now: Date = new Date()
): 'active' | 'inactive' {
  const isOpen = isStationOpen(station, now);
  const isConnected = isStationConnected(station, now);
  
  if (isOpen) {
    // PENDANT heures d'ouverture: statut dépend de la connexion
    // Si déconnectée = on bloque les ventes en ligne pour éviter le surbooking
    return isConnected ? 'active' : 'inactive';
  } else {
    // EN DEHORS heures d'ouverture: toujours active
    // La caisse physique est fermée, donc pas de risque de divergence
    return 'active';
  }
}

/**
 * Obtient la raison du statut (pour affichage dans l'UI)
 * @param station - La gare
 * @param now - Date actuelle (optionnel, pour tests)
 * @returns Raison lisible du statut
 */
export function getStationStatusReason(
  station: Station, 
  now: Date = new Date()
): string {
  const isOpen = isStationOpen(station, now);
  const isConnected = isStationConnected(station, now);
  const status = calculateStationStatus(station, now);
  
  if (status === 'active') {
    if (isOpen && isConnected) {
      return 'Gare ouverte et connectée';
    } else if (!isOpen) {
      return 'Gare fermée (ventes en ligne autorisées)';
    } else {
      return 'Gare active';
    }
  } else {
    // inactive
    if (isOpen && !isConnected) {
      return '⚠️ Connexion perdue (ventes en ligne stoppées)';
    } else {
      return 'Gare inactive';
    }
  }
}

/**
 * Obtient un indicateur visuel du statut de connexion
 * @param station - La gare
 * @param now - Date actuelle (optionnel, pour tests)
 * @returns Objet avec couleur et texte
 */
export function getConnectionIndicator(
  station: Station,
  now: Date = new Date()
): { color: string; text: string; icon: string } {
  const isOpen = isStationOpen(station, now);
  const isConnected = isStationConnected(station, now);
  
  if (!isOpen) {
    return {
      color: 'gray',
      text: 'Fermée',
      icon: '🌙'
    };
  }
  
  if (isConnected) {
    return {
      color: 'green',
      text: 'Connectée',
      icon: '🟢'
    };
  } else {
    return {
      color: 'red',
      text: 'Déconnectée',
      icon: '🔴'
    };
  }
}

// ============================================================================
// HELPERS POUR MODE MOCK
// ============================================================================

/**
 * Génère un heartbeat récent ou ancien (pour simuler connexion/déconnexion)
 * @param isConnected - Si la gare doit être connectée
 * @returns ISO timestamp du dernier heartbeat
 */
export function generateMockHeartbeat(isConnected: boolean): string {
  const now = new Date();
  
  if (isConnected) {
    // Heartbeat récent (il y a 5-20 secondes)
    const secondsAgo = 5 + Math.random() * 15;
    return new Date(now.getTime() - secondsAgo * 1000).toISOString();
  } else {
    // Heartbeat ancien (il y a 60-300 secondes)
    const secondsAgo = 60 + Math.random() * 240;
    return new Date(now.getTime() - secondsAgo * 1000).toISOString();
  }
}

/**
 * Génère des heures d'ouverture réalistes
 * @returns { openingTime, closingTime } au format HH:MM
 */
export function generateMockOpeningHours(): { openingTime: string; closingTime: string } {
  // La plupart des gares ouvrent entre 05:00 et 07:00
  const openHour = 5 + Math.floor(Math.random() * 3);
  const openMinutes = Math.random() < 0.5 ? '00' : '30';
  
  // Et ferment entre 18:00 et 21:00
  const closeHour = 18 + Math.floor(Math.random() * 4);
  const closeMinutes = Math.random() < 0.5 ? '00' : '30';
  
  return {
    openingTime: `${String(openHour).padStart(2, '0')}:${openMinutes}`,
    closingTime: `${String(closeHour).padStart(2, '0')}:${closeMinutes}`
  };
}

// ============================================================================
// EXPORTS
// ============================================================================

export const StationStatusUtils = {
  isStationOpen,
  isStationConnected,
  calculateStationStatus,
  getStationStatusReason,
  getConnectionIndicator,
  generateMockHeartbeat,
  generateMockOpeningHours,
  HEARTBEAT_TIMEOUT_SECONDS,
};