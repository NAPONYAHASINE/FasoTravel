import { Card } from '../../components/ui/card';
import { BackButton } from '../../components/ui/back-button';
import { useFilteredData } from '../../hooks/useFilteredData';
import { useAuth } from '../../contexts/AuthContext';
import { getSoldSeatsCount, calculateTripOccupancy } from '../../utils/statsUtils';

export default function DiagnosticDataPage() {
  const { user } = useAuth();
  const { trips, tickets } = useFilteredData();
  
  const now = new Date();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

  const upcomingTrips = trips.filter(trip => {
    const departureTime = new Date(trip.departureTime);
    return departureTime >= now && 
           departureTime <= in24Hours &&
           (trip.status === 'scheduled' || trip.status === 'boarding');
  });

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      <div>
        <h1 className="text-3xl text-gray-900 dark:text-white mb-2">
          Diagnostic des Données
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Vérification de la cohérence des données mockées
        </p>
      </div>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          🔍 Informations Utilisateur
        </h2>
        <div className="space-y-2 font-mono text-sm">
          <p><strong>ID:</strong> {user?.id}</p>
          <p><strong>Nom:</strong> {user?.name}</p>
          <p><strong>Role:</strong> {user?.role}</p>
          <p><strong>Gare ID:</strong> {user?.gareId}</p>
          <p><strong>Gare:</strong> {user?.gareName}</p>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          📅 Date Actuelle (Réelle)
        </h2>
        <div className="space-y-2 font-mono text-sm">
          <p><strong>Date actuelle:</strong> {now.toISOString()}</p>
          <p><strong>Heure locale:</strong> {now.toLocaleString('fr-FR')}</p>
          <p><strong>Date + 24h:</strong> {in24Hours.toISOString()}</p>
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          🚌 Tous les Trips Filtrés (par gareId={user?.gareId})
        </h2>
        <p className="mb-4 text-gray-600">Total: {trips.length} trips</p>
        <div className="space-y-3">
          {trips.length === 0 ? (
            <p className="text-red-500">❌ Aucun trip trouvé pour cette gare !</p>
          ) : (
            trips.map(trip => {
              const departureTime = new Date(trip.departureTime);
              const isInNext24h = departureTime >= now && departureTime <= in24Hours;
              const isUpcoming = trip.status === 'scheduled' || trip.status === 'boarding';
              
              return (
                <div key={trip.id} className={`p-3 rounded border ${isInNext24h && isUpcoming ? 'bg-green-50 border-green-500' : 'bg-gray-50 border-gray-300'}`}>
                  <p className="font-bold">{trip.id}</p>
                  <p><strong>Route:</strong> {trip.departure} → {trip.arrival}</p>
                  <p><strong>Départ:</strong> {departureTime.toLocaleString()}</p>
                  <p><strong>Status:</strong> {trip.status}</p>
                  <p><strong>Sièges:</strong> {trip.availableSeats}/{trip.totalSeats}</p>
                  <p><strong>Gare:</strong> {trip.gareId} ({trip.gareName})</p>
                  <p className={isInNext24h ? 'text-green-600' : 'text-red-600'}>
                    {isInNext24h ? '✅ Dans les 24h' : '❌ Hors 24h'}
                  </p>
                  <p className={isUpcoming ? 'text-green-600' : 'text-orange-600'}>
                    {isUpcoming ? '✅ Upcoming (scheduled/boarding)' : '❌ Pas upcoming ('+trip.status+')'}
                  </p>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          ✅ Trips Affichés dans PassengerListsPage
        </h2>
        <p className="mb-4 text-gray-600">Total: {upcomingTrips.length} trips</p>
        <div className="space-y-3">
          {upcomingTrips.length === 0 ? (
            <p className="text-red-500">❌ Aucun trip dans les 24h avec status scheduled/boarding !</p>
          ) : (
            upcomingTrips.map(trip => {
              const soldSeats = getSoldSeatsCount(trip);
              const occupancy = calculateTripOccupancy(trip);
              
              return (
                <div key={trip.id} className="p-3 rounded bg-green-50 border border-green-500">
                  <p className="font-bold">{trip.id}</p>
                  <p><strong>Route:</strong> {trip.departure} → {trip.arrival}</p>
                  <p><strong>Départ:</strong> {new Date(trip.departureTime).toLocaleString()}</p>
                  <p><strong>Sièges vendus:</strong> {soldSeats}/{trip.totalSeats} ({occupancy}%)</p>
                </div>
              );
            })
          )}
        </div>
      </Card>

      <Card className="p-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
          🎫 Tickets Filtrés (par gareId={user?.gareId})
        </h2>
        <p className="mb-4 text-gray-600">Total: {tickets.length} tickets</p>
        <div className="space-y-2 font-mono text-sm max-h-96 overflow-y-auto">
          {tickets.length === 0 ? (
            <p className="text-red-500">❌ Aucun ticket trouvé pour cette gare !</p>
          ) : (
            <div className="space-y-1">
              {tickets.slice(0, 20).map(ticket => (
                <div key={ticket.id} className="p-2 bg-gray-50 rounded text-xs">
                  <p><strong>{ticket.id}:</strong> Trip {ticket.tripId} | {ticket.passengerName} | Siège {ticket.seatNumber}</p>
                </div>
              ))}
              {tickets.length > 20 && (
                <p className="text-gray-500">... et {tickets.length - 20} autres tickets</p>
              )}
            </div>
          )}
        </div>
      </Card>
    </div>
  );
}



