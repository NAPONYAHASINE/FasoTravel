import { Clock, MapPin, Bus, Users, DollarSign } from 'lucide-react';
import { Card } from '../ui/card';
import { Badge } from '../ui/badge';
import type { Trip } from '../../contexts/DataContext';

interface TripCardProps {
  trip: Trip;
  onClick?: (trip: Trip) => void;
}

export function TripCard({ trip, onClick }: TripCardProps) {
  return (
    <Card
      className="p-4 cursor-pointer hover:shadow-lg transition-shadow"
      onClick={() => onClick?.(trip)}
    >
      <div className="space-y-3">
        {/* Route */}
        <div className="flex items-center gap-2">
          <MapPin size={18} className="text-blue-600" />
          <div className="flex-1">
            <p className="font-semibold text-gray-900 dark:text-white">
              {trip.departure} → {trip.arrival}
            </p>
          </div>
        </div>

        {/* Time */}
        <div className="flex items-center gap-2">
          <Clock size={18} className="text-orange-600" />
          <div className="flex-1">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {trip.departureTime} - {trip.arrivalTime}
            </p>
          </div>
        </div>

        {/* Bus Info */}
        <div className="flex items-center gap-2">
          <Bus size={18} className="text-green-600" />
          <div className="flex-1">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              Bus: {trip.busNumber}
            </p>
          </div>
        </div>

        {/* Seats */}
        <div className="flex items-center gap-2">
          <Users size={18} className="text-purple-600" />
          <div className="flex-1">
            <p className="text-sm text-gray-700 dark:text-gray-300">
              {trip.availableSeats}/{trip.totalSeats} places disponibles
            </p>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center gap-2">
          <DollarSign size={18} className="text-green-600" />
          <div className="flex-1">
            <p className="text-sm font-semibold text-gray-900 dark:text-white">
              {trip.price.toLocaleString('fr-FR', {
                style: 'currency',
                currency: 'XOF',
              })}
            </p>
          </div>
        </div>

        {/* Status Badge */}
          <Badge
            variant={
              trip.status === 'scheduled'
                ? 'default'
                : trip.status === 'departed' || trip.status === 'boarding'
                  ? 'secondary'
                  : 'outline'
            }
          >
            {trip.status}
          </Badge>
      </div>
    </Card>
  );
}
