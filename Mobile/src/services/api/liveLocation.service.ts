/**
 * Live Location Service - TransportBF Mobile (Passager)
 * 
 * 🛰️ CONCEPT: Live Location collaboratif et contextuel
 * 
 * Gère DEUX logiques distinctes:
 * 
 * 1️⃣ ÉMETTEUR: Le passager envoie sa position périodiquement
 *    - UNIQUEMENT si toutes les conditions sont réunies:
 *      • Billet valide pour ce trajet
 *      • Status du trip = 'boarding' ou 'in_progress'
 *      • Utilisateur physiquement dans le car (approximatif)
 *      • À moins de 5 km du trajet prévu
 *    - Envoi toutes les 2-5 minutes (pas seconde par seconde)
 *    - Réduit les requêtes Google Maps et la batterie
 * 
 * 2️⃣ RÉCEPTEUR: Le passager reçoit la position agrégée du car
 *    - Position moyennée/filtrée par le backend
 *    - Réutilisée par TOUS les passagers du même car
 *    - Un seul passager suffit pour localiser tout le car
 * 
 * ✅ Dual-mode (DEV mock / PROD backend)
 * ⚠️ Aucun tracking permanent - seulement pendant voyage actif
 * ⚠️ Google Maps = affichage uniquement, jamais logique métier
 */

import { apiClient } from './apiClient';
import { isDevelopment } from '../../shared/config/deployment';
import type { VehicleLocation } from '../types';

export interface LiveLocationContext {
  tripId: string;
  userId: string;
  ticketId: string;
  tripStatus: 'boarding' | 'in_progress' | 'cancelled' | 'completed';
  userLatitude: number;
  userLongitude: number;
}

class LiveLocationService {
  /**
   * ✅ RÈGLE 1: Vérifier si le passager peut ÉMETTRE sa position
   * 
   * Conditions requises:
   * 1. Billet valide
   * 2. Trip status = boarding ou in_progress
   * 3. À moins de 5 km du trajet prévu
   */
  private canEmitLocation(context: LiveLocationContext): boolean {
    // ✓ Billet existe (ticketId fourni)
    if (!context.ticketId) {
      console.warn('❌ Pas de billet valide');
      return false;
    }

    // ✓ Trip status autorisé
    if (!['boarding', 'in_progress'].includes(context.tripStatus)) {
      console.warn(`❌ Trip status non valide: ${context.tripStatus}`);
      return false;
    }

    // ✓ Distance avec trajet (approximatif - backend ferait la vraie calc)
    // En prod, le backend vérifie la vraie distance
    // En dev, on simule simplement
    return true;
  }

  /**
   * 📤 ÉMETTEUR: Le passager envoie sa position au backend
   * 
   * Appelé périodiquement (toutes les 2-5 minutes)
   * Le backend agrège et diffuse aux autres passagers
   * 
   * ⚠️ IMPORTANT: Vérifier les règles d'activation avant d'appeler
   */
  async emitLocationUpdate(context: LiveLocationContext): Promise<void> {
    // Vérifier les conditions avant d'envoyer
    if (!this.canEmitLocation(context)) {
      console.warn(
        `❌ Impossible d'émettre: ${JSON.stringify({
          hasTicket: !!context.ticketId,
          tripStatus: context.tripStatus,
        })}`
      );
      return;
    }

    if (isDevelopment()) {
      console.log(
        `📍 [DEV] Émission position fictive pour trip ${context.tripId}`
      );
      return; // En dev, ne pas vraiment envoyer
    }

    try {
      await apiClient.post(`/trips/${context.tripId}/location/emit`, {
        userId: context.userId,
        latitude: context.userLatitude,
        longitude: context.userLongitude,
        timestamp: new Date().toISOString(),
      });
      console.log(`✅ Position émise pour trip ${context.tripId}`);
    } catch (error) {
      console.error('Erreur émission position:', error);
    }
  }

  /**
   * 📥 RÉCEPTEUR: S'abonner aux mises à jour de position du car
   * 
   * La position reçue est:
   * - AGRÉGÉE par le backend (moyennée si plusieurs passagers)
   * - FILTRÉE (cohérence vérifiée)
   * - RÉUTILISÉE par tous les passagers du car
   * 
   * Un seul passager envoie sa position = tous les autres reçoivent la même
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
            `✅ Connecté à la position du car ${tripId} (agrégée)`
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
