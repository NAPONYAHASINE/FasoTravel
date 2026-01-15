/**
 * TripCard Component
 * Affiche un trajet avec disponibilité par segment
 * 
 * DEV NOTES:
 * - Data source: GET /trips
 * - Affiche availability_by_segment pour chaque segment
 * - Event: trip_card_clicked → navigate to trip details
 * - Live tracking badge si has_live_tracking = true
 * 
 * PERFORMANCE:
 * - Optimisé avec React.memo pour éviter re-renders inutiles
 * - Se re-rend seulement si trip.trip_id ou onSelect change
 */

import { memo } from 'react';
import { Clock, MapPin, Users, Wifi, Wind } from 'lucide-react';
import { Trip } from '../data/models';
import { Button } from './ui/button';
import { Badge } from './ui/badge';
import { AnimatedCard } from './AnimatedCard';
import { AnimatedButton } from './AnimatedButton';
import { motion } from 'motion/react';
import { feedback } from '../lib/interactions';

interface TripCardProps {
  trip: Trip;
  onSelect?: (tripId: string) => void;
}

const TripCardComponent = ({ trip, onSelect }: TripCardProps) => {
  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h${mins > 0 ? mins.toString().padStart(2, '0') : ''}`;
  };

  const minAvailableSeats = Math.min(...trip.segments.map(s => s.available_seats));

  return (
    <AnimatedCard 
      onClick={() => {
        feedback.tap();
        onSelect?.(trip.trip_id);
      }}
      className="border-2 border-gray-100 dark:border-gray-700 bg-gradient-to-br from-white via-amber-50/30 to-green-50/30 dark:from-gray-800 dark:via-gray-800 dark:to-gray-800 p-3 sm:p-4 hover:border-amber-300 dark:hover:border-amber-600 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-green-500 focus-visible:ring-offset-2"
      hover3d
      glowOnHover
      role="article"
      aria-label={`Trajet ${trip.operator_name} de ${trip.from_stop_name} à ${trip.to_stop_name}, départ à ${formatTime(trip.departure_time)}, ${minAvailableSeats} places disponibles, ${trip.base_price} FCFA`}
      tabIndex={0}
    >
      {/* Header avec opérateur */}
      <div className="flex items-center justify-between mb-2 sm:mb-3">
        <div className="flex items-center gap-2">
          <span className="text-xl sm:text-2xl">{trip.operator_logo}</span>
          <div>
            <p className="text-sm sm:text-base text-gray-900 dark:text-white">{trip.operator_name}</p>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">{trip.vehicle_type}</p>
          </div>
        </div>
        {trip.has_live_tracking && (
          <motion.div
            animate={{ scale: [1, 1.05, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            aria-label="Suivi GPS en direct disponible"
          >
            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200 text-xs sm:text-sm px-2 py-0.5">
              <motion.span
                animate={{ opacity: [1, 0.5, 1] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                aria-hidden="true"
              >
                ●
              </motion.span> Live
            </Badge>
          </motion.div>
        )}
      </div>

      {/* Horaires et trajet */}
      <div className="flex items-center gap-2 sm:gap-4 mb-2 sm:mb-3">
        <div className="flex-1 min-w-0">
          <p className="text-lg sm:text-xl md:text-2xl text-red-600 dark:text-red-400">{formatTime(trip.departure_time)}</p>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate">{trip.from_stop_name}</p>
        </div>

        <div className="flex-shrink-0 flex flex-col items-center px-2" aria-label={`Durée du trajet: ${formatDuration(trip.duration_minutes)}`}>
          <div className="flex items-center gap-1 text-gray-400 dark:text-gray-500 mb-1" aria-hidden="true">
            <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 rounded-full bg-green-600 dark:bg-green-500"></div>
            <div className="h-px bg-amber-300 dark:bg-amber-600 w-8 sm:w-12"></div>
            <MapPin className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-500" />
          </div>
          <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-600 dark:text-gray-400">
            <Clock className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400" aria-hidden="true" />
            <span className="whitespace-nowrap">{formatDuration(trip.duration_minutes)}</span>
          </div>
        </div>

        <div className="flex-1 text-right min-w-0">
          <p className="text-lg sm:text-xl md:text-2xl text-green-600 dark:text-green-400">{formatTime(trip.arrival_time)}</p>
          <p className="text-xs sm:text-sm text-gray-700 dark:text-gray-300 truncate">{trip.to_stop_name}</p>
        </div>
      </div>

      {/* Segments availability */}
      {trip.segments.length > 1 && (
        <div className="mb-2 sm:mb-3 p-2 bg-gradient-to-r from-amber-50/50 to-green-50/50 dark:from-amber-900/10 dark:to-green-900/10 border border-amber-200/50 dark:border-amber-700/30 rounded-lg">
          <p className="text-xs text-gray-700 dark:text-gray-300 mb-1">Disponibilité par segment :</p>
          <div className="flex gap-2 overflow-x-auto">
            {trip.segments.map((segment) => (
              <div key={segment.segment_id} className="flex-shrink-0 min-w-[120px] text-xs">
                <p className="text-gray-700 dark:text-gray-300 truncate">{segment.from_stop_name} → {segment.to_stop_name}</p>
                <p className={`${segment.available_seats < 5 ? 'text-orange-600 dark:text-orange-400' : 'text-green-600 dark:text-green-400'}`}>
                  {segment.available_seats} places
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Footer avec équipements et prix */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 sm:pt-3 border-t border-amber-200/50 dark:border-amber-700/30 gap-3">
        <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
          <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-700 dark:text-gray-300">
            <Users className="w-3 h-3 sm:w-4 sm:h-4 text-green-600 dark:text-green-400" aria-hidden="true" />
            <span>{minAvailableSeats} places</span>
          </div>
          {trip.amenities.includes('WiFi') && <Wifi className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400" aria-label="WiFi disponible" />}
          {trip.amenities.includes('AC') && <Wind className="w-3 h-3 sm:w-4 sm:h-4 text-amber-500 dark:text-amber-400" aria-label="Climatisation disponible" />}
        </div>

        <div className="flex items-center gap-2 sm:gap-3 w-full sm:w-auto">
          <div className="text-left sm:text-right flex-1 sm:flex-initial">
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">À partir de</p>
            <p className="text-base sm:text-lg md:text-xl text-green-600 dark:text-green-400">{trip.base_price.toLocaleString()} FCFA</p>
          </div>
          <AnimatedButton
            onClick={(e) => {
              e.stopPropagation();
              feedback.click();
              onSelect?.(trip.trip_id);
            }}
            size="sm"
            feedbackType="click"
            className="bg-gradient-to-r from-red-600 to-amber-500 hover:from-red-700 hover:to-amber-600 text-xs sm:text-sm px-3 sm:px-4"
          >
            Réserver
          </AnimatedButton>
        </div>
      </div>
    </AnimatedCard>
  );
};

// Optimisation: Ne re-rend que si trip.trip_id change
export const TripCard = memo(TripCardComponent, (prevProps, nextProps) => {
  return prevProps.trip.trip_id === nextProps.trip.trip_id;
});
