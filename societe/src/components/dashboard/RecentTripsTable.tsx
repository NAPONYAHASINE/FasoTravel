import { useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { MapPin, Clock, Users, ArrowRight } from 'lucide-react';
import type { Trip } from '../../contexts/DataContext';
import { formatTime, getCurrentDate } from '../../utils/dateUtils';
import { getTripStatusLabel } from '../../utils/labels';
import { getTripStatusBadgeInfo } from '../../utils/styleUtils';
import { calculateTripOccupancy } from '../../utils/statsUtils';
import { Badge } from '../ui/badge';

export default function RecentTripsTable({ trips = [] }: { trips?: Trip[] }) {
  const navigate = useNavigate();
  
  // Get recent/active trips (departed, boarding, or upcoming)
  const recentTrips = useMemo(() => {
    const now = getCurrentDate();
    return trips
      .filter(t => {
        const departureTime = new Date(t.departureTime);
        return t.status === 'departed' || t.status === 'boarding' || 
               (t.status === 'scheduled' && departureTime > now);
      })
      .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime())
      .slice(0, 4);
  }, [trips]);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Départs Récents
        </h3>
        <button 
          onClick={() => navigate('/responsable/trafic')}
          className="text-sm text-[#f59e0b] hover:text-[#d97706] font-medium"
        >
          Voir tout
        </button>
      </div>

      <div className="space-y-3">
        {recentTrips.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            <MapPin size={48} className="mx-auto mb-2 opacity-20" />
            <p>Aucun départ récent</p>
          </div>
        ) : (
          recentTrips.map((trip) => {
            const occupancyRate = calculateTripOccupancy(trip);
            const statusInfo = getTripStatusBadgeInfo(trip.status);
            const departureTime = formatTime(trip.departureTime);
            
            // Determine color based on occupancy
            const fillColor = occupancyRate >= 80 ? '#16a34a' : occupancyRate >= 50 ? '#f59e0b' : '#dc2626';

            return (
              <div
                key={trip.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#f59e0b] dark:hover:border-[#f59e0b] transition-all hover:shadow-md cursor-pointer"
                onClick={() => navigate('/responsable/trafic')}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2 flex-1">
                    <MapPin size={16} className="text-gray-500 dark:text-gray-400 flex-shrink-0" />
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {trip.departure}
                    </span>
                    <ArrowRight size={14} className="text-gray-500 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white text-sm">
                      {trip.arrival}
                    </span>
                  </div>
                  <Badge className={statusInfo.color}>
                    {getTripStatusLabel(trip.status)}
                  </Badge>
                </div>

                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <div className="flex items-center gap-1">
                      <Clock size={14} />
                      <span>{departureTime}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Users size={14} />
                      <span>{trip.totalSeats - trip.availableSeats}/{trip.totalSeats}</span>
                    </div>
                  </div>
                  <span className="text-sm font-medium" style={{ color: fillColor }}>
                    {occupancyRate}%
                  </span>
                </div>

                {/* Barre de progression */}
                <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className="h-full transition-all duration-300 rounded-full"
                    style={{
                      width: `${occupancyRate}%`,
                      backgroundColor: fillColor
                    }}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

