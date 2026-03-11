/**
 * @file TripsPage.tsx
 * @description Gestion des voyages (Trips)
 */

import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card, Button, Table, Modal, Badge } from '../../components/ui';
import { Plus, Edit, Trash, Bus } from 'lucide-react';
import { formatDateTime, getTripStatusLabel } from '../../utils/formatters';

export default function TripsPage() {
  const { trips, deleteTrip } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getStatusVariant = (status: string): 'success' | 'warning' | 'info' | 'default' => {
    switch (status) {
      case 'completed': return 'success';
      case 'in-progress': return 'warning';
      case 'scheduled': return 'info';
      default: return 'default';
    }
  };

  const columns = [
    {
      key: 'route',
      header: 'Trajet',
      render: (trip: any) => (
        <div className="flex items-center gap-2">
          <Bus className="w-4 h-4 text-fasotravel-red" />
          <span className="font-medium">{trip.routeName}</span>
        </div>
      )
    },
    { key: 'departure', header: 'Départ', render: (trip: any) => formatDateTime(trip.departureTime) },
    { key: 'arrival', header: 'Arrivée', render: (trip: any) => formatDateTime(trip.arrivalTime) },
    { key: 'driver', header: 'Conducteur', render: (trip: any) => trip.driverName || '-' },
    { key: 'vehicle', header: 'Véhicule', render: (trip: any) => trip.vehicleRegistration || '-' },
    { key: 'passengers', header: 'Passagers', render: (trip: any) => `${trip.currentPassengers}/${trip.capacity}` },
    {
      key: 'status',
      header: 'Statut',
      render: (trip: any) => (
        <Badge variant={getStatusVariant(trip.status)}>
          {getTripStatusLabel(trip.status)}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (trip: any) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" icon={<Edit className="w-4 h-4" />}>Modifier</Button>
          <Button size="sm" variant="danger" icon={<Trash className="w-4 h-4" />} onClick={() => deleteTrip(trip.id)}>
            Annuler
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Voyages</h1>
          <p className="text-gray-600 mt-1">{trips.length} voyages programmés</p>
        </div>
        <Button icon={<Plus className="w-5 h-5" />} onClick={() => setIsModalOpen(true)}>
          Nouveau voyage
        </Button>
      </div>

      <Card>
        <Table data={trips} columns={columns} emptyMessage="Aucun voyage programmé" />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouveau voyage">
        <p className="text-gray-600">Formulaire de création à implémenter</p>
      </Modal>
    </div>
  );
}
