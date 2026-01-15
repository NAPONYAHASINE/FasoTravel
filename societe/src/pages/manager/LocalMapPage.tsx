import { useMemo, useState } from 'react';
import { MapPin, Radio, Navigation, Clock, Users, Bus, Filter, ArrowLeft, AlertTriangle } from 'lucide-react@0.487.0';
import { useNavigate } from 'react-router-dom';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { Badge } from '../../components/ui/badge';
import { BackButton } from '../../components/ui/back-button';
import { useFilteredData } from '../../hooks/useFilteredData';
import { useAuth } from '../../contexts/AuthContext';
import { formatTime, filterByToday } from '../../utils/dateUtils';
import { getSoldSeatsCount, getActiveLocalTrips } from '../../utils/statsUtils';
import { getLocalTripStatusBadgeClass } from '../../utils/styleUtils';
import { getLocalTripStatusLabel } from '../../utils/labels';
import type { Trip } from '../../contexts/DataContext';

interface LocalTrip {
  id: string;
  route: string;
  busNumber: string;
  status: 'at_station' | 'boarding' | 'en_route' | 'delayed';
  departureTime: string;
  passengers: number;
  capacity: number;
  location: string;
  eta?: string;
  gpsPosition?: { lat: number; lng: number };
}

export default function LocalMapPage() {
  const { user } = useAuth();
  const { trips } = useFilteredData();
  const navigate = useNavigate();
  
  // ✅ REFACTORISÉ: Utilise la fonction centralisée avec fenêtre de 2h
  const localTrips = useMemo(() => {
    const activeTrips = getActiveLocalTrips(trips, 2);
    
    return activeTrips.map(trip => {
      // Calculer statut basé sur le trip
      let status: LocalTrip['status'] = 'at_station';
      
      if (trip.status === 'boarding') {
        status = 'boarding';
      } else if (trip.status === 'departed') {
        status = 'en_route';
        
        // Vérifier si retardé (si estimatedArrival existe et dépasse arrivalTime)
        if (trip.estimatedArrival) {
          const eta = new Date(trip.estimatedArrival);
          const scheduledArrival = new Date(trip.arrivalTime);
          if (eta > scheduledArrival) {
            status = 'delayed';
          }
        }
      } else if (trip.status === 'scheduled') {
        status = 'at_station'; // Départ imminent
      }
      
      return {
        id: trip.id,
        route: `${trip.departure} → ${trip.arrival}`,
        busNumber: trip.busNumber || 'N/A',
        status,
        departureTime: formatTime(trip.departureTime),
        passengers: getSoldSeatsCount(trip),
        capacity: trip.totalSeats,
        // TODO: Position GPS = moyenne des positions des passagers (agrégation)
        location: trip.currentLocation 
          ? `GPS: ${trip.currentLocation.lat.toFixed(4)}, ${trip.currentLocation.lng.toFixed(4)}`
          : (status === 'en_route' ? 'En route' : trip.gareName),
        eta: trip.estimatedArrival
          ? formatTime(trip.estimatedArrival)
          : undefined,
        gpsPosition: trip.currentLocation,
      };
    });
  }, [trips]);
  
  const atStation = localTrips.filter(t => t.status === 'at_station' || t.status === 'boarding');
  const onRoute = localTrips.filter(t => t.status === 'en_route');
  const delayed = localTrips.filter(t => t.status === 'delayed');
  const totalPassengers = localTrips.reduce((acc, t) => acc + t.passengers, 0);

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Suivi des Trajets Locaux
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Suivez en temps réel les trajets partant de votre gare
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">À la gare</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{atStation.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <MapPin className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En route</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{onRoute.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Navigation className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Retardés</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">{delayed.length}</p>
            </div>
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/20 rounded-full flex items-center justify-center">
              <AlertTriangle className="text-red-600 dark:text-red-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total passagers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {totalPassengers}
              </p>
            </div>
            <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
              <Bus className="text-gray-600 dark:text-gray-400" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Carte Google Maps - Placeholder */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Carte temps réel
          </h2>
          <Badge className="bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400">
            🗺️ Google Maps - À intégrer
          </Badge>
        </div>
        {/* TODO: Intégrer Google Maps avec marqueurs basés sur agrégation GPS des passagers */}
        <div className="relative h-96 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex items-center justify-center">
          <div className="text-center">
            <MapPin className="mx-auto mb-4 text-gray-400 dark:text-gray-600" size={64} />
            <p className="text-lg font-semibold text-gray-600 dark:text-gray-400 mb-2">
              Carte Google Maps
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500 mb-1">
              En attente de l'intégration de l'API
            </p>
            <p className="text-xs text-gray-400 dark:text-gray-600">
              Position des trajets = agrégation GPS des passagers
            </p>
          </div>
        </div>
      </Card>

      {/* Liste détaillée */}
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">
          Tous les trajets en cours
        </h2>
        {localTrips.length === 0 ? (
          <Card className="p-8 text-center">
            <Clock className="mx-auto mb-4 text-gray-400" size={48} />
            <p className="text-gray-600 dark:text-gray-400">
              Aucun trajet en cours ou à venir dans les 2 prochaines heures
            </p>
          </Card>
        ) : (
          localTrips.map((trip) => (
            <Card key={trip.id} className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {trip.route}
                    </h3>
                    <Badge className={getLocalTripStatusBadgeClass(trip.status)}>
                      {getLocalTripStatusLabel(trip.status)}
                    </Badge>
                  </div>
                  <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Bus</p>
                      <p className="font-medium text-gray-900 dark:text-white">{trip.busNumber}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Départ</p>
                      <p className="font-medium text-gray-900 dark:text-white">{trip.departureTime}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Position</p>
                      <p className="font-medium text-gray-900 dark:text-white text-xs">{trip.location}</p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Passagers</p>
                      <p className="font-medium text-green-600 dark:text-green-400">
                        {trip.passengers}/{trip.capacity}
                      </p>
                    </div>
                    {trip.eta && (
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">ETA</p>
                        <p className="font-medium text-blue-600 dark:text-blue-400">{trip.eta}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}