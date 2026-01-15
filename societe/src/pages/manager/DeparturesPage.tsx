import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Clock, Bus, Users, Printer } from 'lucide-react@0.487.0';
import { useAuth } from '../../contexts/AuthContext';
import { useFilteredData } from '../../hooks/useFilteredData';
import { Button } from '../../components/ui/button';
import { Card } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { 
  filterByToday, 
  getSoldSeatsCount, 
  getTripValidTickets, 
  calculateTripOccupancy 
} from '../../utils/statsUtils';
import { formatCurrency, calculatePercentage } from '../../utils/formatters';
import { formatDateTime, formatTime } from '../../utils/dateUtils';
import { getTripStatusLabel } from '../../utils/labels';
import { getOccupancyColor } from '../../utils/styleUtils';

export default function DeparturesPage() {
  const { user } = useAuth();
  const { trips, tickets } = useFilteredData();
  const [printContent, setPrintContent] = useState<string | null>(null);
  const navigate = useNavigate();

  // ✅ REFACTORISÉ: Filter trips for today only
  const todayTrips = useMemo(() => {
    return filterByToday(trips, 'departureTime')
      .filter(trip => trip.gareId === user?.gareId)
      .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
  }, [trips, user?.gareId]);

  const handlePrintAll = () => {
    window.print();
  };

  const handlePrintOne = (tripId: string) => {
    const trip = todayTrips.find(t => t.id === tripId);
    if (!trip) return;

    const tripTickets = getTripValidTickets(tickets, tripId);
    
    // Create print content in HTML
    const content = `
      <div style="font-family: Arial, sans-serif; padding: 20px;">
        <h1 style="text-align: center; color: #333; margin-bottom: 30px;">🚌 Liste des Passagers</h1>
        <div style="margin: 20px 0;">
          <p style="margin: 10px 0;"><strong>Trajet :</strong> ${trip.departure} → ${trip.arrival}</p>
          <p style="margin: 10px 0;"><strong>Départ :</strong> ${formatDateTime(trip.departureTime)}</p>
          <p style="margin: 10px 0;"><strong>Bus :</strong> ${trip.busNumber}</p>
          <p style="margin: 10px 0;"><strong>Passagers :</strong> ${tripTickets.length}/${trip.totalSeats}</p>
        </div>
        <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
          <thead>
            <tr>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left; background-color: #f59e0b; color: white;">N°</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left; background-color: #f59e0b; color: white;">Siège</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left; background-color: #f59e0b; color: white;">Nom du passager</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left; background-color: #f59e0b; color: white;">Téléphone</th>
              <th style="border: 1px solid #ddd; padding: 10px; text-align: left; background-color: #f59e0b; color: white;">Prix</th>
            </tr>
          </thead>
          <tbody>
            ${tripTickets.map((ticket, index) => `
              <tr style="${index % 2 === 0 ? 'background-color: #f9f9f9;' : ''}">
                <td style="border: 1px solid #ddd; padding: 10px;">${index + 1}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${ticket.seatNumber}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${ticket.passengerName}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${ticket.passengerPhone}</td>
                <td style="border: 1px solid #ddd; padding: 10px;">${formatCurrency(ticket.price)}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div style="margin-top: 30px; text-align: center; font-size: 12px; color: #666;">
          <p>Imprimé le ${formatDateTime(new Date().toISOString())}</p>
          <p>FasoTravel Dashboard - ${trip.gareName}</p>
        </div>
      </div>
    `;
    
    // Set content and trigger print
    setPrintContent(content);
    
    // Print after a small delay to ensure content is rendered
    setTimeout(() => {
      window.print();
      setPrintContent(null);
    }, 100);
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      boarding: { label: '🟡 Embarquement', className: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' },
      scheduled: { label: '🔵 Programmé', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
      departed: { label: '⚪ Parti', className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' },
      arrived: { label: '🟢 Arrivé', className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
      cancelled: { label: '🔴 Annulé', className: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
    };
    return <Badge className={configs[status as keyof typeof configs]?.className || configs.scheduled.className}>
      {configs[status as keyof typeof configs]?.label || status}
    </Badge>;
  };

  // ✅ CORRIGÉ: Séparer les départs selon leur heure ET statut
  const now = new Date();
  
  const upcomingDepartures = useMemo(() => {
    return todayTrips.filter(trip => {
      return trip.status === 'scheduled' || trip.status === 'boarding';
    });
  }, [todayTrips]);
  
  const pastDepartures = useMemo(() => {
    return todayTrips.filter(trip => {
      return trip.status === 'departed' || trip.status === 'arrived' || trip.status === 'cancelled';
    });
  }, [todayTrips]);

  // ✅ Compter les VRAIS tickets pour les départs d'aujourd'hui
  const todayTripIds = new Set(todayTrips.map(t => t.id));
  const totalPassengers = tickets.filter(t => 
    todayTripIds.has(t.tripId) && (t.status === 'valid' || t.status === 'used')
  ).length;

  const totalCapacity = todayTrips.reduce((acc, trip) => acc + trip.totalSeats, 0);

  return (
    <div className="p-6 space-y-6">
      {/* Print content area - hidden on screen, visible when printing */}
      {printContent && (
        <div 
          className="print:block hidden"
          dangerouslySetInnerHTML={{ __html: printContent }}
        />
      )}
      
      {/* Main content - visible on screen, hidden when printing */}
      <div className="print:hidden">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate('/manager')}
          className="mb-4"
        >
          <ArrowLeft size={16} className="mr-2" />
          Retour
        </Button>
      
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              Départs du Jour
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Supervision et impression des listes d'embarquement
            </p>
          </div>
          <Button onClick={handlePrintAll} className="bg-[#f59e0b] hover:bg-[#d97706]">
            <Printer size={16} className="mr-2" />
            Tout imprimer
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Départs à venir</p>
                <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{upcomingDepartures.length}</p>
              </div>
              <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
                <Clock className="text-blue-600 dark:text-blue-400" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Partis aujourd'hui</p>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{pastDepartures.length}</p>
              </div>
              <div className="w-12 h-12 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Bus className="text-gray-600 dark:text-gray-400" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Passagers totaux</p>
                <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                  {totalPassengers}
                </p>
              </div>
              <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                <Users className="text-green-600 dark:text-green-400" size={24} />
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400">Taux de remplissage</p>
                <p className="text-2xl font-bold text-[#f59e0b]">
                  {totalCapacity > 0 ? Math.round((totalPassengers / totalCapacity) * 100) : 0}%
                </p>
              </div>
              <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
                <Bus className="text-[#f59e0b]" size={24} />
              </div>
            </div>
          </Card>
        </div>

        {/* Départs à venir */}
        <div>
          <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
            Départs à venir
          </h2>
          {upcomingDepartures.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {upcomingDepartures.map(trip => {
                const soldSeats = getSoldSeatsCount(trip);
                const tripTickets = getTripValidTickets(tickets, trip.id);
                
                return (
                  <Card key={trip.id} className="p-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                            {trip.departure} → {trip.arrival}
                          </h3>
                          {getStatusBadge(trip.status)}
                        </div>

                        <div className="grid grid-cols-4 gap-4">
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Heure de départ</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {formatTime(trip.departureTime)}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Véhicule</p>
                            <p className="font-semibold text-gray-900 dark:text-white">{trip.busNumber}</p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Passagers</p>
                            <p className="font-semibold text-green-600 dark:text-green-400">
                              {soldSeats}/{trip.totalSeats}
                            </p>
                          </div>
                          <div>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Taux</p>
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {calculatePercentage(soldSeats, trip.totalSeats)}%
                            </p>
                          </div>
                        </div>

                        {/* Barre de progression */}
                        <div className="mt-3">
                          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-[#dc2626] via-[#f59e0b] to-[#16a34a]"
                              style={{ width: `${calculateTripOccupancy(trip)}%` }}
                            />
                          </div>
                        </div>
                      </div>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handlePrintOne(trip.id)}
                        className="ml-4"
                      >
                        <Printer size={16} className="mr-2" />
                        Imprimer ({tripTickets.length})
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          ) : (
            <Card className="p-12 text-center">
              <Clock className="mx-auto text-gray-400 mb-4" size={48} />
              <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                Aucun départ à venir
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                Tous les départs d'aujourd'hui sont partis ou il n'y a pas de départ programmé
              </p>
            </Card>
          )}
        </div>

        {/* Partis aujourd'hui */}
        {pastDepartures.length > 0 && (
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              Partis aujourd'hui
            </h2>
            <div className="grid grid-cols-1 gap-4">
              {pastDepartures.map(trip => {
                const soldSeats = getSoldSeatsCount(trip);
                
                return (
                  <Card key={trip.id} className="p-4 bg-gray-50 dark:bg-gray-800/50">
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-3 mb-1">
                          <h3 className="font-bold text-gray-900 dark:text-white">
                            {trip.departure} → {trip.arrival}
                          </h3>
                          {getStatusBadge(trip.status)}
                        </div>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {formatTime(trip.departureTime)} • {trip.busNumber} • {soldSeats}/{trip.totalSeats} passagers
                        </p>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}