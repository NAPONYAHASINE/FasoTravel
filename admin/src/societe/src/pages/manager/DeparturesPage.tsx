/**
 * @file DeparturesPage.tsx
 * @description Gestion des départs (Manager de gare)
 */

import { useApp } from '../../contexts/AppContext';
import { Card, Table, Badge } from '../../components/ui';
import { formatDateTime } from '../../utils/formatters';

export default function DeparturesPage() {
  const { trips, currentUser } = useApp();

  // Filter trips for this manager's station
  const myTrips = trips.filter((t: any) => t.gareId === currentUser?.gareId);

  const columns = [
    { key: 'route', header: 'Trajet', render: (trip: any) => <span className="font-medium">{trip.routeName}</span> },
    { key: 'departure', header: 'Heure de départ', render: (trip: any) => formatDateTime(trip.departureTime) },
    { key: 'driver', header: 'Conducteur', render: (trip: any) => trip.driverName || '-' },
    { key: 'vehicle', header: 'Véhicule', render: (trip: any) => trip.vehicleRegistration || '-' },
    { key: 'passengers', header: 'Passagers', render: (trip: any) => `${trip.currentPassengers}/${trip.capacity}` },
    {
      key: 'status',
      header: 'Statut',
      render: (trip: any) => (
        <Badge variant={trip.status === 'scheduled' ? 'info' : trip.status === 'in-progress' ? 'warning' : 'success'}>
          {trip.status}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Départs</h1>
        <p className="text-gray-600 mt-1">Gare: {currentUser?.gareName}</p>
      </div>

      <Card>
        <Table data={myTrips} columns={columns} emptyMessage="Aucun départ programmé" />
      </Card>
    </div>
  );
}
