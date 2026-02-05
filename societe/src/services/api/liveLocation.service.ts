/**
 * Live Location Service - TransportBF Societe (Opérateur)
 * 
 * 🛰️ CONCEPT: Live Location collaboratif et contextuel
 * 
 * Rôle de l'OPÉRATEUR: RÉCEPTEUR UNIQUEMENT
 * 
 * L'opérateur reçoit les positions agrégées des cars:
 * - Position moyennée des passagers qui l'envoient
 * - Mise à jour en temps réel pour le suivi opérationnel
 * - Pas d'émission de position (les passagers envoient)
 * - Pas de tracking permanent (seulement voyage actif)
 * 
 * ✅ Dual-mode (DEV mock / PROD backend)
 * ⚠️ Agrégation backend uniquement, jamais côté opérateur
 * ⚠️ Google Maps = affichage uniquement, jamais logique métier
 */

import { isDevelopment } from '../../shared/config/deployment';
import type { VehicleLocation } from '../types';

class LiveLocationService {
  /**
   * 📥 RÉCEPTEUR: L'opérateur s'abonne à la position du car
   * 
   * La position reçue est:
   * - AGRÉGÉE par le backend (moyennée si plusieurs passagers envoient)
   * - FILTRÉE (cohérence vérifiée)
   * - MISE À JOUR en temps réel
   * 
   * L'opérateur voit l'avancement du trajet (pas les individus)
   * 
   * @param tripId - ID du trajet
   * @param callback - Fonction appelée quand la position du car change
   * @returns Fonction de désabonnement (cleanup)
   */
  onCarLocationUpdate(
    tripId: string,
    callback: (location: VehicleLocation) => void
  ): () => void {
    if (isDevelopment()) {
      // MODE DEV: Simule les updates toutes les 5 secondes
      const interval = setInterval(() => {
        callback(this.mockGetAggregatedLocation(tripId));
      }, 5000);

      return () => clearInterval(interval);
    }

    // MODE PROD: WebSocket avec reconnexion
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}/api/trips/${tripId}/location/subscribe`;

    let ws: WebSocket | null = null;
    let reconnectAttempts = 0;
    const MAX_RECONNECT_ATTEMPTS = 5;
    const RECONNECT_DELAY = 3000;

    const connect = () => {
      try {
        ws = new WebSocket(wsUrl);

        ws.onopen = () => {
          console.log(
            `✅ Opérateur connecté à la position du car ${tripId}`
          );
          reconnectAttempts = 0;
        };

        ws.onmessage = (event) => {
          try {
            // Position AGRÉGÉE du backend
            const aggregatedLocation = JSON.parse(
              event.data
            ) as VehicleLocation;
            callback(aggregatedLocation);
          } catch (error) {
            console.error('Erreur parsing position:', error);
          }
        };

        ws.onerror = (error) => {
          console.error('WebSocket erreur:', error);
        };

        ws.onclose = () => {
          console.warn(
            `❌ Déconnecté de la position du car ${tripId} (tentative ${reconnectAttempts}/${MAX_RECONNECT_ATTEMPTS})`
          );

          if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
            reconnectAttempts++;
            setTimeout(connect, RECONNECT_DELAY);
          }
        };
      } catch (error) {
        console.error('Erreur WebSocket:', error);
        if (reconnectAttempts < MAX_RECONNECT_ATTEMPTS) {
          reconnectAttempts++;
          setTimeout(connect, RECONNECT_DELAY);
        }
      }
    };

    connect();

    // Retourner fonction de cleanup
    return () => {
      if (ws) {
        ws.close();
      }
    };
  }

  /**
   * 🧠 Mock: Position agrégée simulée du car
   * Utilisée en DEV pour tester sans backend
   */
  private mockGetAggregatedLocation(tripId: string): VehicleLocation {
    // Simulation d'une position qui progresse le long de l'itinéraire
    const progress = Math.random() * 0.5 + 0.25; // Entre 25% et 75%
    const baseLatitude = 12.3656;
    const baseLongitude = -1.5197; // Ouagadougou

    return {
      tripId,
      latitude: baseLatitude + progress * 0.1,
      longitude: baseLongitude + progress * 0.1,
      heading: Math.floor(Math.random() * 360),
      speed: Math.floor(Math.random() * 100) + 40, // 40-140 km/h
      accuracy: 50,
      timestamp: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
  }
}

export const liveLocationService = new LiveLocationService();
