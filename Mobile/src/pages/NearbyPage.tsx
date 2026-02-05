import type { Page } from '../App';
/**
 * NearbyPage - Gares à proximité
 * 
 * BACKEND INTEGRATION:
 * - Utilise le hook useNearbyStations() pour récupérer les gares depuis l'API
 * - Endpoint: GET /api/stations/nearby?lat=&lon=&radius=5
 * - Demande permission géolocalisation (navigator.geolocation)
 * - Consent explicite requis (stocker consent_timestamp)
 * 
 * GOOGLE MAPS INTEGRATION:
 * - Intégrer Google Maps API pour afficher la carte interactive
 * - Ajouter des markers pour chaque station
 * - Permettre le clic sur les markers pour voir les détails
 * - Ajouter un bouton "Itinéraire" qui ouvre Google Maps avec directions
 * 
 * TODO:
 * 1. Ajouter GOOGLE_MAPS_API_KEY dans les variables d'environnement
 * 2. Installer @react-google-maps/api ou @googlemaps/js-api-loader
 * 3. Remplacer le placeholder par une vraie carte Google Maps
 * 4. Implémenter les événements analytics (nearby_permission_granted, etc.)
 */

import '../components/styles.css';
import { useEffect, useState, useRef } from 'react';
import { MapPin, Navigation, Clock, Map, Search, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { t } from '../lib/i18n';
import { useGeolocation } from '../lib/useGeolocation';
import { GeolocationPrompt } from '../components/GeolocationPrompt';
import { motion, PanInfo } from 'motion/react';
import { feedback } from '../lib/interactions';
import { useNearbyStations, useVehicleLiveTracking, useEmitLocation, useMyTickets, useReportIncident, useShareLocation } from '../lib/hooks';

interface NearbyPageProps {
  trackingTripId?: string; // For tracking specific vehicle from ticket detail
  onNavigate: (page: Page, data?: any) => void;
}

export function NearbyPage({ trackingTripId, onNavigate }: NearbyPageProps) {
  const [geolocationState, geolocationActions] = useGeolocation();
  const { hasPermission, userPosition, isLoading: geoLoading, errorMessage, isGeolocationBlocked } = geolocationState;
  const { requestLocationPermission, useDefaultLocation, checkGeolocationAvailability } = geolocationActions;
  const progressBarRef = useRef<HTMLDivElement>(null);

  // If the user comes from a ticket we track that trip, otherwise if the user has any EMBARKED ticket
  // auto-enable tracking for that trip so Nearby page shows the vehicle immediately.
  const { tickets } = useMyTickets();
  const embarkedTicket = tickets.find(t => t.status === 'EMBARKED') || null;
  const autoTripId = trackingTripId || embarkedTicket?.trip_id || null;
  const { location: vehicleLocation, isLoading: trackingLoading, error: trackingError } = useVehicleLiveTracking(autoTripId, !!autoTripId);

  // Fetch nearby stations from API
  const { nearbyStations, isLoading: stationsLoading, error: stationsError } = useNearbyStations(
    userPosition?.lat || null,
    userPosition?.lon || null,
    5 // 5km radius
  );

  // API Hooks pour incidents et location sharing
  const { reportIncident, isLoading: reportingIncident, error: incidentError } = useReportIncident();
  const { shareLocation, isLoading: sharingLocation, error: locationShareError } = useShareLocation();

  // Emit location when EMBARKED (collaboratif)
  const { isLoading: isEmittingLocation, error: emitError } = useEmitLocation(
    embarkedTicket?.status === 'EMBARKED' ? embarkedTicket?.ticket_id : null,
    autoTripId,
    embarkedTicket?.status === 'EMBARKED' ? 'in_progress' : null,
    userPosition ? { lat: userPosition.lat, lon: userPosition.lon } : null
  );

  // Check geolocation availability on mount
  useEffect(() => {
    checkGeolocationAvailability();
  }, [checkGeolocationAvailability]);

  // Apply progress bar width using ref
  useEffect(() => {
    if (progressBarRef.current && vehicleLocation?.progress_percent !== undefined) {
      const progress = Math.min(vehicleLocation.progress_percent, 100);
      progressBarRef.current.style.width = `${progress}%`;
    }
  }, [vehicleLocation?.progress_percent]);

  const handleUseDefault = () => {
    // Use Ouagadougou as default
    useDefaultLocation(12.3714, -1.5197);
  };

  const openGoogleMapsDirections = (lat: number, lon: number) => {
    // Open Google Maps with directions from user location to station
    if (userPosition) {
      const url = `https://www.google.com/maps/dir/?api=1&origin=${userPosition.lat},${userPosition.lon}&destination=${lat},${lon}&travelmode=driving`;
      window.open(url, '_blank');
    } else {
      // If no user position, just open the destination
      const url = `https://www.google.com/maps/search/?api=1&query=${lat},${lon}`;
      window.open(url, '_blank');
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  // ========== BOTTOM SHEET STATE & HANDLERS ==========
  const sheetRef = useRef<HTMLDivElement | null>(null);
  const [sheetHeight, setSheetHeight] = useState<number>(() => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    return Math.round(vh * 0.35);
  });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [showIncidentModal, setShowIncidentModal] = useState<boolean>(false);
  const [incidentText, setIncidentText] = useState<string>('');

  // Snap points - calculate dynamically
  const getSnapPoints = () => {
    const vh = typeof window !== 'undefined' ? window.innerHeight : 800;
    return {
      min: Math.round(vh * 0.35),
      mid: Math.round(vh * 0.60),
      max: Math.round(vh * 0.92)
    };
  };

  const snapPoints = getSnapPoints();

  const handleDrag = (_event: any, info: PanInfo) => {
    const newHeight = sheetHeight - info.delta.y;
    const constrained = Math.max(snapPoints.min, Math.min(snapPoints.max, newHeight));
    setSheetHeight(constrained);
  };

  const handleDragEnd = (_event: any, info: PanInfo) => {
    const velocity = info.velocity.y;
    let target = snapPoints.min;

    if (velocity < -500) {
      // Swipe up fast
      target = sheetHeight < snapPoints.mid ? snapPoints.mid : snapPoints.max;
    } else if (velocity > 500) {
      // Swipe down fast
      target = sheetHeight > snapPoints.mid ? snapPoints.mid : snapPoints.min;
    } else {
      // Snap to closest
      const dists = [
        { snap: snapPoints.min, dist: Math.abs(sheetHeight - snapPoints.min) },
        { snap: snapPoints.mid, dist: Math.abs(sheetHeight - snapPoints.mid) },
        { snap: snapPoints.max, dist: Math.abs(sheetHeight - snapPoints.max) }
      ];
      target = dists.reduce((prev, curr) => curr.dist < prev.dist ? curr : prev).snap;
    }

    setSheetHeight(target);
  };

  // Filter stations by operator name
  const filteredStations = (() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return nearbyStations || [];
    return (nearbyStations || []).filter((s: any) => {
      if (!s.next_departures) return false;
      return s.next_departures.some((trip: any) => 
        (trip.operator_name || '').toLowerCase().includes(q)
      );
    });
  })();

  // Send incident report - using hook
  const handleSendIncidentReport = async () => {
    if (!incidentText.trim()) {
      window.alert('Veuillez fournir une description de l\'incident.');
      return;
    }
    
    if (!autoTripId || !vehicleLocation) {
      window.alert('Impossible de créer l\'incident: données manquantes.');
      return;
    }

    // Validate coordinates are available
    if (!vehicleLocation.current_latitude || !vehicleLocation.current_longitude) {
      window.alert('Position non disponible. Veuillez vérifier l\'accès à la géolocalisation.');
      return;
    }

    const result = await reportIncident({
      trip_id: autoTripId,
      description: incidentText.trim(),
      timestamp: new Date().toISOString(),
      latitude: vehicleLocation.current_latitude,
      longitude: vehicleLocation.current_longitude
    });

    if (result) {
      window.alert('Incident signalé avec succès.');
      setIncidentText('');
      setShowIncidentModal(false);
    } else {
      window.alert(incidentError || 'Impossible d\'envoyer le signalement.');
    }
  };

  // Share location - using hook
  const handleShareLocation = async () => {
    if (!autoTripId || !vehicleLocation) {
      window.alert('Impossible de partager la position: données manquantes.');
      return;
    }

    // Validate coordinates are available
    if (!vehicleLocation.current_latitude || !vehicleLocation.current_longitude) {
      window.alert('Position non disponible. Veuillez vérifier l\'accès à la géolocalisation.');
      return;
    }

    const result = await shareLocation({
      trip_id: autoTripId,
      latitude: vehicleLocation.current_latitude,
      longitude: vehicleLocation.current_longitude,
      timestamp: new Date().toISOString()
    });

    if (result) {
      window.alert('Position partagée avec le chauffeur.');
    } else {
      window.alert(locationShareError || 'Impossible de partager la position.');
    }
  };

  return (
    <div className="fixed inset-0 w-screen h-screen overflow-hidden bg-gray-900">
      {/* 1. FULLSCREEN MAP EN FOND */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100 via-green-50 to-blue-100 overflow-hidden">
        <div id="nearby-map" className="w-full h-full flex items-center justify-center">
          <div className="text-center">
            <Map className="w-16 h-16 text-green-600 mx-auto mb-3 opacity-50" />
            <p className="text-gray-600 text-sm">Google Maps Placeholder</p>
          </div>
        </div>
      </div>

      {/* 2. BOUTONS FLOTTANTS (haut - flèche gauche, loupe droite) */}
      <div className="fixed top-6 left-6 z-20">
        {/* Bouton retour - GAUCHE */}
        <motion.button
          onClick={() => {
            feedback.tap();
            onNavigate('home');
          }}
          whileTap={{ scale: 0.9 }}
          title="Retour"
          aria-label="Retour"
          className="bg-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center text-gray-800 hover:bg-gray-100 transition font-bold text-lg"
        >
          ←
        </motion.button>
      </div>

      <div className="fixed top-6 right-6 z-20">
        {/* Bouton loupe - DROITE */}
        <motion.button
          onClick={() => {
            feedback.tap();
            const input = document.getElementById('nearby-search-input') as HTMLInputElement;
            if (input) input.focus();
          }}
          whileTap={{ scale: 0.9 }}
          title="Rechercher une compagnie"
          aria-label="Rechercher"
          className="bg-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center text-gray-800 hover:bg-gray-100 transition"
        >
          <Search className="w-5 h-5" />
        </motion.button>
      </div>

      {/* 3. BOTTOM SHEET DRAGGABLE */}
      <motion.div
        ref={sheetRef}
        drag="y"
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0}
        dragMomentum={false}
        onDragStart={() => setIsDragging(true)}
        onDrag={handleDrag}
        onDragEnd={() => {
          setIsDragging(false);
          handleDragEnd({} as any, { delta: { x: 0, y: 0 }, velocity: { x: 0, y: 0 } } as any);
        }}
        animate={{ height: Math.max(sheetHeight, 100) }}
        transition={{ type: 'spring', damping: 30, stiffness: 300 }}
        className="fixed bottom-0 left-0 right-0 z-30 bg-white dark:bg-gray-900 rounded-t-3xl shadow-2xl overflow-hidden"
        style={{ touchAction: 'none', maxHeight: '100vh' }}
      >
        {/* Poignée - ZONE DE DRAG */}
        <div className="pt-4 pb-3 flex justify-center cursor-grab active:cursor-grabbing border-b border-gray-200 dark:border-gray-700">
          <div className="w-12 h-1.5 bg-gray-300 dark:bg-gray-600 rounded-full" />
        </div>

        {/* Contenu - ZONE DE SCROLL */}
        <div className={`overflow-y-auto h-full pb-28 ${isDragging ? 'pointer-events-none' : 'pointer-events-auto'}`}>
          <div className="px-4 sm:px-6 py-4 space-y-4">

            {/* Search Input */}
            <div className="sticky top-0 bg-white dark:bg-gray-900 py-2 z-10">
              <input
                id="nearby-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher une compagnie..."
                className="w-full bg-gray-100 dark:bg-gray-800 border border-gray-300 dark:border-gray-700 rounded-full px-4 py-2 text-sm placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-green-500"
              />
            </div>

            {/* Small tracking banner */}
            {autoTripId && vehicleLocation && (
              <div className="bg-white dark:bg-gray-800 border border-green-200 dark:border-green-700 rounded-lg p-3 shadow-sm">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-lg">📍</span>
                    <div>
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">Suivi activé</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Suivi du véhicule en temps réel</p>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Position Card */}
            <div className="bg-white dark:bg-gray-800 border-2 border-gray-100 dark:border-gray-700 rounded-xl p-4 shadow-lg">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                <h2 className="text-lg text-gray-900 dark:text-white">{t('nearby.current_position')}</h2>
              </div>

              {!hasPermission ? (
                <GeolocationPrompt
                  isLoading={geoLoading}
                  errorMessage={errorMessage}
                  isGeolocationBlocked={isGeolocationBlocked}
                  hasPermission={hasPermission}
                  onRequestPermission={requestLocationPermission}
                  onUseDefault={handleUseDefault}
                  defaultLocationName="Ouagadougou"
                />
              ) : (
                <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-xl p-3">
                  <p className="text-sm text-green-800 dark:text-green-400">
                    Position actuelle: Ouagadougou Centre
                  </p>
                  {userPosition && (
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                      Lat: {userPosition.lat.toFixed(4)}, Lon: {userPosition.lon.toFixed(4)}
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Vehicle Tracking Card - EMBARKED only with Actions */}
            {embarkedTicket && embarkedTicket.status === 'EMBARKED' && vehicleLocation && (
              <div className="bg-white dark:bg-gray-800 border-2 border-green-100 dark:border-green-700 rounded-xl p-4 shadow-lg">
                <div className="flex items-center gap-2 mb-3">
                  <Navigation className="w-5 h-5 text-green-600 dark:text-green-400 animate-bounce" />
                  <h2 className="text-lg text-gray-900 dark:text-white">Suivi du véhicule</h2>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                    <p className="text-xs text-green-600 dark:text-green-400 mb-1">Position</p>
                    <p className="text-sm font-mono text-gray-900 dark:text-white">
                      {vehicleLocation.current_latitude?.toFixed(4)}, {vehicleLocation.current_longitude?.toFixed(4)}
                    </p>
                  </div>
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                    <p className="text-xs text-blue-600 dark:text-blue-400 mb-1">Progression</p>
                    <p className="text-sm font-semibold text-blue-900 dark:text-blue-300">
                      {vehicleLocation.progress_percent !== undefined ? vehicleLocation.progress_percent : 'N/A'}%
                    </p>
                  </div>
                </div>

                {vehicleLocation.progress_percent !== undefined && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Progression: {vehicleLocation.progress_percent}%</p>
                    <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                      <div 
                        ref={progressBarRef}
                        className="bg-gradient-to-r from-green-500 to-blue-500 h-2 rounded-full transition-all duration-300 progress-bar"
                      />
                    </div>
                  </div>
                )}

                {/* EMBARKED Actions - Incident & Share Location */}
                <div className="mt-4 space-y-2">
                  {/* Incident Button */}
                  <button
                    onClick={() => setShowIncidentModal(true)}
                    disabled={reportingIncident}
                    className="w-full bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium py-2 px-4 rounded-lg transition"
                  >
                    {reportingIncident ? '⏳ Envoi en cours...' : '⚠️ Signaler un incident'}
                  </button>

                  {/* Share Location Button - Enabled only if journey is near end (>70% progress) */}
                  {vehicleLocation.progress_percent !== undefined && vehicleLocation.progress_percent >= 70 && (
                    <button
                      onClick={handleShareLocation}
                      disabled={sharingLocation}
                      className="w-full bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 text-white font-medium py-2 px-4 rounded-lg transition"
                    >
                      {sharingLocation ? '⏳ Partage en cours...' : '📍 Partager ma position'}
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Incident Modal */}
            {showIncidentModal && (
              <div className="fixed inset-0 bg-black/50 z-50 flex items-end">
                <div className="bg-white dark:bg-gray-800 w-full rounded-t-3xl p-6 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">Signaler un incident</h3>
                    <button
                      onClick={() => setShowIncidentModal(false)}
                      title="Fermer"
                      aria-label="Fermer le modal"
                      className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <textarea
                    value={incidentText}
                    onChange={(e) => setIncidentText(e.target.value)}
                    placeholder="Décrivez l'incident..."
                    className="w-full border border-gray-300 dark:border-gray-700 rounded-lg p-3 bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    rows={4}
                  />

                  <div className="flex gap-2">
                    <button
                      onClick={() => setShowIncidentModal(false)}
                      className="flex-1 bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-white py-2 rounded-lg"
                    >
                      Annuler
                    </button>
                    <button
                      onClick={handleSendIncidentReport}
                      disabled={reportingIncident}
                      className="flex-1 bg-red-500 hover:bg-red-600 disabled:bg-red-300 text-white font-medium py-2 rounded-lg transition"
                    >
                      {reportingIncident ? '⏳ Envoi...' : 'Envoyer'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Stations List */}
            {hasPermission && (
              <div className="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-lg">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
                    <h2 className="text-lg text-gray-900 dark:text-white">
                      Gares à proximité ({filteredStations.length})
                    </h2>
                  </div>
                  {stationsLoading && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">Chargement...</div>
                  )}
                </div>

                {filteredStations.length === 0 && !stationsLoading ? (
                  <div className="text-center py-6">
                    <p className="text-sm text-gray-500 dark:text-gray-400">
                      {searchQuery ? 'Aucune gare trouvée' : 'Aucune gare à proximité'}
                    </p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredStations.map((item) => (
                      <div key={item.station.id} className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-green-300 dark:hover:border-green-600 transition">
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 dark:text-white">{item.station.name}</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">{item.station.address}</p>
                          </div>
                          <div className="flex items-center gap-1 text-green-600 dark:text-green-400 text-xs ml-2">
                            <Navigation className="w-3 h-3" />
                            {item.distance_km} km
                          </div>
                        </div>

                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mb-2 text-xs"
                          onClick={() => {
                            feedback.tap();
                            openGoogleMapsDirections(item.station.latitude, item.station.longitude);
                          }}
                        >
                          <Navigation className="w-3 h-3 mr-1" />
                          Itinéraire
                        </Button>

                        <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
                          <p className="text-xs text-gray-700 dark:text-gray-300 mb-2">Prochains départs:</p>
                          
                          {item.next_departures.length === 0 ? (
                            <p className="text-xs text-gray-400 dark:text-gray-500">Aucun départ</p>
                          ) : (
                            <div className="space-y-2">
                              {item.next_departures.slice(0, 3).map((trip) => (
                                <div key={trip.trip_id} className="flex items-center gap-2 bg-green-50 dark:bg-green-900/20 rounded p-2">
                                  <Clock className="w-3 h-3 text-green-600 dark:text-green-400 flex-shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <p className="text-xs text-gray-900 dark:text-white">{formatTime(trip.departure_time)}</p>
                                    <p className="text-xs text-gray-600 dark:text-gray-300 truncate">{trip.to_stop_name}</p>
                                  </div>
                                  <Button
                                    size="sm"
                                    className="bg-green-600 hover:bg-green-700 text-xs whitespace-nowrap"
                                    onClick={() => {
                                      feedback.tap();
                                      onNavigate('trip-detail', trip.trip_id);
                                    }}
                                  >
                                    Réserver
                                  </Button>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Espace vide pour éviter superposition avec navbar */}
            <div className="h-32" />

          </div>
        </div>
      </motion.div>
    </div>
  );
}
