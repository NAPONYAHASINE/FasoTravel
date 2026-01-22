import { useState, useMemo } from 'react';
import { Printer, Search, Download, Users } from "lucide-react";
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/back-button';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { useFilteredData } from '../../hooks/useFilteredData';
import { toast } from 'sonner';
import type { Trip } from '../../contexts/DataContext';
import { formatTime, formatDate } from '../../utils/dateUtils';
import { getSoldSeatsCount, calculateTripOccupancy, getTripValidTickets, getUpcomingTrips24h } from '../../utils/statsUtils';
import { getPaymentMethodLabel, getSalesChannelLabel, getTripStatusLabel } from '../../utils/labels';
import { getTripStatusBadgeInfo, getOccupancyColor } from '../../utils/styleUtils';
import { calculatePercentage } from '../../utils/formatters';

export default function PassengerListsPage() {
  const { trips, tickets } = useFilteredData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTrip, setSelectedTrip] = useState<Trip | null>(null);

  // ✅ REFACTORISÉ: Utilise la fonction centralisée
  const upcomingTrips = useMemo(() => {
    return getUpcomingTrips24h(trips);
  }, [trips]);

  // ✅ Filtrer par recherche
  const filteredTrips = useMemo(() => {
    if (!searchQuery) return upcomingTrips;
    const query = searchQuery.toLowerCase();
    return upcomingTrips.filter(trip =>
      trip.departure.toLowerCase().includes(query) ||
      trip.arrival.toLowerCase().includes(query) ||
      trip.busNumber.toLowerCase().includes(query)
    );
  }, [upcomingTrips, searchQuery]);

  // ✅ REFACTORISÉ: Obtenir la vraie liste de passagers pour le trajet sélectionné
  const passengers = useMemo(() => {
    if (!selectedTrip) return [];
    
    return getTripValidTickets(tickets, selectedTrip.id)
      .sort((a: any, b: any) => a.seatNumber.toString().localeCompare(b.seatNumber.toString()))
      .map(ticket => ({
        seatNumber: ticket.seatNumber,
        name: ticket.passengerName,
        phone: ticket.passengerPhone,
        ticketNumber: ticket.id.substring(0, 12),
        paymentMethod: ticket.paymentMethod,
        soldBy: ticket.cashierName,
        salesChannel: ticket.salesChannel
      }));
  }, [selectedTrip, tickets]);

  const handlePrint = () => {
    if (!selectedTrip) {
      toast.error('Veuillez sélectionner un trajet');
      return;
    }
    window.print();
    toast.success(`📄 Impression de la liste pour ${selectedTrip.departure} → ${selectedTrip.arrival}`);
  };

  const handleExport = () => {
    if (!selectedTrip) {
      toast.error('Veuillez sélectionner un trajet');
      return;
    }
    toast.info('📥 Export Excel - Fonctionnalité à venir');
  };

  return (
    <div className="p-6 space-y-6">
      <BackButton />

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Listes de Passagers
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Consultez et imprimez les listes de passagers pour les trajets à venir
        </p>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
          <Input
            type="text"
            placeholder="Rechercher par trajet ou numéro de bus..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Trips List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Liste des trajets */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Users size={24} />
            Trajets des prochaines 24h
          </h2>

          {filteredTrips.length === 0 ? (
            <Card className="p-12 text-center">
              <Users size={48} className="mx-auto mb-3 opacity-30 text-gray-400" />
              <p className="text-lg text-gray-500 dark:text-gray-400">
                {searchQuery ? 'Aucun trajet trouvé' : 'Aucun trajet prévu dans les 24h'}
              </p>
            </Card>
          ) : (
            filteredTrips.map((trip: any) => {
              const soldSeats = getSoldSeatsCount(trip);
              const occupancy = calculateTripOccupancy(trip);
              const isSelected = selectedTrip?.id === trip.id;

              return (
                <Card
                  key={trip.id}
                  className={`p-4 cursor-pointer transition-all ${
                    isSelected 
                      ? 'border-[#f59e0b] bg-yellow-50 dark:bg-yellow-900/20' 
                      : 'hover:border-[#f59e0b]'
                  }`}
                  onClick={() => setSelectedTrip(trip)}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div>
                      <h3 className="font-bold text-lg text-gray-900 dark:text-white">
                        {trip.departure} → {trip.arrival}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Bus {trip.busNumber}
                      </p>
                    </div>
                    <Badge className={getTripStatusBadgeInfo(trip.status).color}>
                      {getTripStatusLabel(trip.status)}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Départ</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatTime(trip.departureTime)}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Date</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatDate(trip.departureTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-gray-200 dark:border-gray-700">
                    <div>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mb-1">Occupation</p>
                      <div className="flex items-center gap-2">
                        <div className={`w-2 h-2 rounded-full ${getOccupancyColor(occupancy)}`}></div>
                        <span className="font-bold text-gray-900 dark:text-white">
                          {soldSeats}/{trip.totalSeats}
                        </span>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          ({calculatePercentage(soldSeats, trip.totalSeats)}%)
                        </span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-gray-600 dark:text-gray-400">Passagers</p>
                      <p className="font-bold text-[#f59e0b]">{soldSeats}</p>
                    </div>
                  </div>
                </Card>
              );
            })
          )}
        </div>

        {/* Passenger List */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Liste des Passagers
            </h2>
            {selectedTrip && passengers.length > 0 && (
              <div className="flex gap-2">
                <Button
                  onClick={handlePrint}
                  variant="outline"
                  size="sm"
                >
                  <Printer className="mr-2" size={18} />
                  Imprimer
                </Button>
                <Button
                  onClick={handleExport}
                  variant="outline"
                  size="sm"
                >
                  <Download className="mr-2" size={18} />
                  Exporter
                </Button>
              </div>
            )}
          </div>

          {!selectedTrip ? (
            <Card className="p-12 text-center">
              <Users size={48} className="mx-auto mb-3 opacity-30 text-gray-400" />
              <p className="text-lg text-gray-500 dark:text-gray-400">
                Sélectionnez un trajet
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Cliquez sur un trajet pour voir la liste des passagers
              </p>
            </Card>
          ) : passengers.length === 0 ? (
            <Card className="p-12 text-center">
              <Users size={48} className="mx-auto mb-3 opacity-30 text-gray-400" />
              <p className="text-lg text-gray-500 dark:text-gray-400">
                Aucun passager
              </p>
              <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                Ce trajet n'a pas encore de réservations
              </p>
            </Card>
          ) : (
            <div className="space-y-3">
              {/* Summary Card */}
              <Card className="p-4 bg-gradient-to-r from-[#f59e0b] to-[#d97706] text-white">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm opacity-90">
                      {selectedTrip.departure} → {selectedTrip.arrival}
                    </p>
                    <p className="font-bold text-xl">
                      {passengers.length} passagers
                    </p>
                  </div>
                  <Users size={32} className="opacity-80" />
                </div>
              </Card>

              {/* Passengers */}
              <div className="space-y-2">
                {passengers.map((passenger, index) => (
                  <Card key={index} className="p-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="bg-[#f59e0b] text-white w-10 h-10 rounded-lg flex items-center justify-center font-bold">
                          {passenger.seatNumber}
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 dark:text-white">
                            {passenger.name}
                          </h4>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            {passenger.phone}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-gray-600 dark:text-gray-400">
                          {getSalesChannelLabel(passenger.salesChannel)}
                        </p>
                        <p className="text-sm font-medium text-gray-900 dark:text-white">
                          {getPaymentMethodLabel(passenger.paymentMethod)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}


