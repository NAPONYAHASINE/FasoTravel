import type { Page } from '../App';
/**
 * TripDetailPage - Détail du trajet
 * 
 * DEV NOTES:
 * - Endpoint: GET /trips/{id}
 * - Affiche carte segmentée (MapSegment placeholder)
 * - Liste des escales avec horaires
 * - Disponibilité par segment (availability_by_segment)
 * - Options: siège, bagage
 * - CTA: Réserver → navigation vers sélection siège
 */

import { useState } from 'react';
import { ArrowLeft, MapPin, Clock, Users, Wifi, Wind, Package, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { useTripById, useOperatorById } from '../lib/hooks';
import { feedback } from '../lib/interactions';
import { motion } from 'motion/react';
import { RouteMap } from '../components/RouteMap';

interface TripDetailPageProps {
  tripId: string;
  isRoundTrip?: boolean;
  returnDate?: string;
  passengers?: number;
  onNavigate: (page: Page, data?: any) => void;
  onBack: () => void;
}

export function TripDetailPage({ tripId, isRoundTrip = false, returnDate, passengers = 1, onNavigate, onBack }: TripDetailPageProps) {
  const { trip, isLoading, error } = useTripById(tripId);
  const { operator } = useOperatorById(trip?.operator_id || null);
  const [selectedBaggage, setSelectedBaggage] = useState(false);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-green-600 dark:text-green-400 animate-spin" />
      </div>
    );
  }

  // Error or not found
  if (error || !trip) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 dark:text-gray-400 mb-4">{error || 'Trajet non trouvé'}</p>
          <Button onClick={onBack}>Retour</Button>
        </div>
      </div>
    );
  }

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fr-FR', { 
      weekday: 'long', 
      day: 'numeric', 
      month: 'long' 
    });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`;
  };

  const minAvailableSeats = Math.min(...trip.segments.map(s => s.available_seats));

  const handleBooking = () => {
    feedback.success();
    // Navigate to seat selection
    onNavigate('seat-selection', {
      tripId,
      passengers,
      isRoundTrip,
      returnDate
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <motion.div 
        className="bg-gradient-to-r from-red-600 via-amber-500 to-green-600 px-6 py-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <div className="max-w-4xl mx-auto">
          <motion.button
            onClick={() => {
              feedback.tap();
              onBack();
            }}
            className="text-white mb-4 flex items-center gap-2 min-h-[44px] -ml-2 px-2"
            whileHover={{ x: -5 }}
            whileTap={{ scale: 0.95 }}
          >
            <ArrowLeft className="w-5 h-5" />
            <span>Retour</span>
          </motion.button>
          
          <motion.div 
            className="text-white"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <h1 className="text-2xl mb-1">{trip.from_stop_name} → {trip.to_stop_name}</h1>
            <p className="text-sm opacity-90">{formatDate(trip.departure_time)}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Content */}
      <motion.div 
        className="px-6 py-6 pb-24"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.2 }}
      >
        <div className="max-w-4xl mx-auto space-y-6">
          {/* Operator Card */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <span className="text-3xl">{trip.operator_logo}</span>
                <div>
                  <h2 className="text-xl text-gray-900 dark:text-white">{trip.operator_name}</h2>
                  <p className="text-gray-600 dark:text-gray-400">{trip.vehicle_type}</p>
                </div>
              </div>
              {trip.has_live_tracking && (
                <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                  Suivi en direct
                </Badge>
              )}
            </div>

            {/* Amenities */}
            <div className="flex flex-wrap gap-2">
              {trip.amenities.includes('WiFi') && (
                <Badge variant="outline" className="flex items-center gap-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                  <Wifi className="w-3 h-3" />
                  WiFi
                </Badge>
              )}
              {trip.amenities.includes('AC') && (
                <Badge variant="outline" className="flex items-center gap-1 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">
                  <Wind className="w-3 h-3" />
                  Climatisation
                </Badge>
              )}
              {trip.amenities.includes('USB') && (
                <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Prises USB</Badge>
              )}
              {trip.amenities.includes('Toilet') && (
                <Badge variant="outline" className="border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300">Toilettes</Badge>
              )}
            </div>
          </motion.div>

          {/* Map avec RouteMap Component */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <h3 className="text-lg text-gray-900 dark:text-white mb-4">Itinéraire</h3>
            
            {/* ✅ PRÊT POUR BACKEND: RouteMap reçoit waypoints depuis GET /trips/:id/route */}
            <RouteMap
              totalDistance={trip.segments.reduce((sum, s) => sum + s.distance_km, 0)}
              // waypoints={routeWaypoints} // À ajouter quand le backend fournira les coordonnées GPS
            />
          </motion.div>

          {/* Stops Timeline */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <h3 className="text-lg text-gray-900 dark:text-white mb-4">Arrêts et horaires</h3>
            
            <div className="space-y-4">
              {/* Départ */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-green-600 dark:bg-green-500"></div>
                  <div className="w-0.5 h-full bg-green-200 dark:bg-green-800 flex-1"></div>
                </div>
                <div className="flex-1 pb-4">
                  <p className="text-lg text-gray-900 dark:text-white">{trip.from_stop_name}</p>
                  <p className="text-green-600 dark:text-green-400">{formatTime(trip.departure_time)}</p>
                </div>
              </div>

              {/* Intermediate stops */}
              {trip.segments.slice(0, -1).map((segment, index) => (
                <div key={segment.segment_id} className="flex gap-4">
                  <div className="flex flex-col items-center">
                    <div className="w-3 h-3 rounded-full bg-amber-400 dark:bg-amber-500"></div>
                    <div className="w-0.5 h-full bg-green-200 dark:bg-green-800 flex-1"></div>
                  </div>
                  <div className="flex-1 pb-4">
                    <p className="text-gray-900 dark:text-white">{segment.to_stop_name}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400">{formatTime(segment.arrival_time)}</p>
                    <div className="mt-1 flex items-center gap-2">
                      <Users className="w-4 h-4 text-gray-400 dark:text-gray-500" />
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        {segment.available_seats} places disponibles
                      </span>
                    </div>
                  </div>
                </div>
              ))}

              {/* Arrivée */}
              <div className="flex gap-4">
                <div className="flex flex-col items-center">
                  <div className="w-4 h-4 rounded-full bg-red-600 dark:bg-red-500"></div>
                </div>
                <div className="flex-1">
                  <p className="text-lg text-gray-900 dark:text-white">{trip.to_stop_name}</p>
                  <p className="text-red-600 dark:text-red-400">{formatTime(trip.arrival_time)}</p>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Trip Info Summary */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <h3 className="text-lg text-gray-900 dark:text-white mb-4">Informations du voyage</h3>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Durée</p>
                  <p className="text-gray-900 dark:text-white">{formatDuration(trip.duration_minutes)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Places disponibles</p>
                  <p className="text-gray-900 dark:text-white">{minAvailableSeats} sièges</p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <MapPin className="w-5 h-5 text-red-600 dark:text-red-400" />
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Distance</p>
                  <p className="text-gray-900 dark:text-white">
                    {trip.segments.reduce((sum, s) => sum + s.distance_km, 0)} km
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-2xl">💰</span>
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">À partir de</p>
                  <p className="text-xl text-green-600 dark:text-green-400">{trip.base_price.toLocaleString()} FCFA</p>
                </div>
              </div>
            </div>
          </motion.div>



          {/* Baggage Option */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 border border-gray-100 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <h3 className="text-lg text-gray-900 dark:text-white mb-4">Options supplémentaires</h3>
            
            <label className="flex items-center justify-between p-4 border border-gray-200 dark:border-gray-700 rounded-xl cursor-pointer hover:border-green-300 dark:hover:border-green-600 transition-colors">
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-green-600 dark:text-green-400" />
                <div>
                  <p className="text-gray-900 dark:text-white">Bagage supplémentaire</p>
                  <p className="text-sm text-gray-600 dark:text-gray-400">+{operator?.baggage_price?.toLocaleString() || 0} FCFA</p>
                </div>
              </div>
              <input
                type="checkbox"
                checked={selectedBaggage}
                onChange={(e) => {
                  feedback.tap();
                  setSelectedBaggage(e.target.checked);
                }}
                className="w-5 h-5 text-green-600 rounded"
              />
            </label>
          </motion.div>

          {/* Book Button */}
          <motion.div 
            className="bg-white dark:bg-gray-800 rounded-2xl p-6 sticky bottom-20 md:bottom-6 shadow-lg border border-gray-100 dark:border-gray-700"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Prix {isRoundTrip ? 'trajet aller' : 'total'}</p>
                <p className="text-2xl text-gray-900 dark:text-white">
                  {((trip.base_price * passengers) + (selectedBaggage ? (operator?.baggage_price || 0) : 0)).toLocaleString()} FCFA
                </p>
                {isRoundTrip && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {passengers} passager{passengers > 1 ? 's' : ''} • Retour à sélectionner après
                  </p>
                )}
              </div>
              <Button
                onClick={handleBooking}
                className="bg-gradient-to-r from-red-600 via-amber-500 to-green-600 hover:from-red-700 hover:via-amber-600 hover:to-green-700 px-8"
              >
                {isRoundTrip ? 'Continuer →' : 'Réserver'}
              </Button>
            </div>

            {minAvailableSeats < 5 && (
              <p className="text-sm text-orange-600 dark:text-orange-400 text-center">
                ⚠️ Plus que {minAvailableSeats} places disponibles !
              </p>
            )}
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
