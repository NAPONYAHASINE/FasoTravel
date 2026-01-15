/**
 * RouteMap Component - Carte interactive de l'itinéraire
 * 
 * DEV NOTES:
 * - Endpoint: GET /trips/:id/route (retourne waypoints GPS)
 * - Prêt pour Google Maps / Mapbox / OpenStreetMap
 * - Affiche les arrêts intermédiaires avec markers
 * - Tracé de ligne entre les points
 * 
 * BACKEND PAYLOAD ATTENDU:
 * {
 *   "waypoints": [
 *     { "lat": 12.3714, "lng": -1.5197, "name": "Ouagadougou", "type": "start" },
 *     { "lat": 12.5000, "lng": -1.8000, "name": "Koudougou", "type": "stop" },
 *     { "lat": 11.1771, "lng": -4.2947, "name": "Bobo-Dioulasso", "type": "end" }
 *   ],
 *   "total_distance_km": 365
 * }
 */

import { MapPin } from 'lucide-react';
import { useEffect, useRef, useState } from 'react';

interface Waypoint {
  lat: number;
  lng: number;
  name: string;
  type: 'start' | 'stop' | 'end';
  arrival_time?: string;
}

interface RouteMapProps {
  waypoints?: Waypoint[];
  totalDistance?: number;
  className?: string;
}

export function RouteMap({ waypoints = [], totalDistance = 0, className = '' }: RouteMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const [mapError, setMapError] = useState<string | null>(null);

  // PLACEHOLDER: Ici vous intégrerez Google Maps, Mapbox ou OpenStreetMap
  useEffect(() => {
    if (!mapContainerRef.current || waypoints.length === 0) return;

    // TODO: Initialiser la carte ici
    // Exemple avec Google Maps:
    /*
    const map = new google.maps.Map(mapContainerRef.current, {
      center: { lat: waypoints[0].lat, lng: waypoints[0].lng },
      zoom: 8,
      styles: [...]  // Style personnalisé rouge/doré/vert
    });

    // Ajouter les markers
    waypoints.forEach((waypoint) => {
      new google.maps.Marker({
        position: { lat: waypoint.lat, lng: waypoint.lng },
        map: map,
        title: waypoint.name,
        icon: getMarkerIcon(waypoint.type)  // Différent selon start/stop/end
      });
    });

    // Tracer la route
    const path = waypoints.map(wp => ({ lat: wp.lat, lng: wp.lng }));
    new google.maps.Polyline({
      path: path,
      geodesic: true,
      strokeColor: '#059669',  // green-600
      strokeOpacity: 1.0,
      strokeWeight: 3,
      map: map
    });
    */

    console.log('[RouteMap] Waypoints reçus:', waypoints);
  }, [waypoints]);

  // Fonction helper pour obtenir la couleur du marker
  const getMarkerColor = (type: 'start' | 'stop' | 'end') => {
    switch (type) {
      case 'start':
        return 'bg-green-600 dark:bg-green-500';
      case 'end':
        return 'bg-red-600 dark:bg-red-500';
      case 'stop':
        return 'bg-amber-500 dark:bg-amber-400';
      default:
        return 'bg-gray-400';
    }
  };

  if (waypoints.length === 0) {
    // Mode placeholder si pas de données backend
    return (
      <div className={`bg-gradient-to-br from-green-50 via-amber-50 to-red-50 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 ${className}`}>
        <div className="text-center">
          <MapPin className="w-16 h-16 text-green-600 dark:text-green-400 mx-auto mb-3" />
          <p className="text-gray-700 dark:text-gray-300 mb-1">Carte interactive de l'itinéraire</p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            En attente des données GPS depuis le backend
          </p>
          {totalDistance > 0 && (
            <p className="text-sm text-gray-600 dark:text-gray-300 mt-2">
              Distance totale : {totalDistance} km
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 ${className}`}>
      {/* Carte Container */}
      <div 
        ref={mapContainerRef}
        className="w-full h-64 md:h-80 bg-gray-100 dark:bg-gray-900"
        style={{ minHeight: '256px' }}
      >
        {/* Fallback: Liste visuelle des waypoints en attendant la vraie carte */}
        <div className="h-full flex flex-col justify-center p-6 space-y-3">
          {waypoints.map((waypoint, index) => (
            <div key={index} className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${getMarkerColor(waypoint.type)}`}></div>
              <div className="flex-1">
                <p className="text-sm text-gray-900 dark:text-white">{waypoint.name}</p>
                {waypoint.arrival_time && (
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {new Date(waypoint.arrival_time).toLocaleTimeString('fr-FR', { 
                      hour: '2-digit', 
                      minute: '2-digit' 
                    })}
                  </p>
                )}
              </div>
              {index < waypoints.length - 1 && (
                <div className="text-xs text-gray-400">→</div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Footer avec distance */}
      {totalDistance > 0 && (
        <div className="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            📍 Distance totale : <span className="text-gray-900 dark:text-white">{totalDistance} km</span>
          </p>
        </div>
      )}

      {mapError && (
        <div className="px-4 py-3 bg-red-50 dark:bg-red-900/20 border-t border-red-200 dark:border-red-800">
          <p className="text-sm text-red-600 dark:text-red-400 text-center">
            ⚠️ {mapError}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * GUIDE D'INTÉGRATION BACKEND
 * 
 * 1. Installer la librairie de carte (exemple Google Maps):
 *    npm install @googlemaps/js-api-loader
 * 
 * 2. Créer un hook pour charger la route:
 *    export function useRouteMap(tripId: string) {
 *      const [waypoints, setWaypoints] = useState<Waypoint[]>([]);
 *      
 *      useEffect(() => {
 *        fetch(`/api/trips/${tripId}/route`)
 *          .then(res => res.json())
 *          .then(data => setWaypoints(data.waypoints));
 *      }, [tripId]);
 *      
 *      return { waypoints };
 *    }
 * 
 * 3. Utiliser dans TripDetailPage:
 *    const { waypoints } = useRouteMap(tripId);
 *    <RouteMap waypoints={waypoints} totalDistance={trip.total_distance} />
 * 
 * 4. API Key Google Maps:
 *    - Obtenir sur: https://console.cloud.google.com/
 *    - Ajouter dans .env: REACT_APP_GOOGLE_MAPS_API_KEY=xxx
 *    - Activer: Maps JavaScript API, Directions API
 * 
 * 5. Alternative OpenStreetMap (gratuit):
 *    - Utiliser Leaflet: npm install leaflet react-leaflet
 *    - Pas besoin d'API key
 *    - Bon pour le Burkina Faso (couverture correcte)
 */
