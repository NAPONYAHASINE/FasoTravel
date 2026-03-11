/**
 * @file StationsPage.tsx
 * @description Gestion des gares (Stations)
 */

import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card, Button, Table, Modal, Badge } from '../../components/ui';
import { Plus, Edit, Trash, MapPin } from 'lucide-react';
import { formatCoordinates } from '../../utils/formatters';

export default function StationsPage() {
  const { stations, deleteStation } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const columns = [
    {
      key: 'name',
      header: 'Nom de la gare',
      render: (station: any) => (
        <div className="flex items-center gap-2">
          <MapPin className="w-4 h-4 text-fasotravel-red" />
          <span className="font-medium">{station.name}</span>
        </div>
      )
    },
    {
      key: 'city',
      header: 'Ville',
      render: (station: any) => station.city
    },
    {
      key: 'capacity',
      header: 'Capacité',
      render: (station: any) => `${station.capacity} véhicules`
    },
    {
      key: 'coordinates',
      header: 'Coordonnées GPS',
      render: (station: any) => (
        <span className="text-xs font-mono text-gray-600">
          {formatCoordinates(station.latitude, station.longitude)}
        </span>
      )
    },
    {
      key: 'contact',
      header: 'Contact',
      render: (station: any) => (
        <div className="text-sm">
          {station.contactPerson && <div>{station.contactPerson}</div>}
          {station.contactPhone && <div className="text-gray-600">{station.contactPhone}</div>}
        </div>
      )
    },
    {
      key: 'status',
      header: 'Statut',
      render: (station: any) => (
        <Badge variant={station.status === 'active' ? 'success' : 'default'}>
          {station.status === 'active' ? 'Actif' : 'Inactif'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (station: any) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" icon={<Edit className="w-4 h-4" />}>
            Modifier
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon={<Trash className="w-4 h-4" />}
            onClick={() => deleteStation(station.id)}
          >
            Supprimer
          </Button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Gares</h1>
          <p className="text-gray-600 mt-1">{stations.length} gares enregistrées</p>
        </div>
        <Button icon={<Plus className="w-5 h-5" />} onClick={() => setIsModalOpen(true)}>
          Nouvelle gare
        </Button>
      </div>

      <Card>
        <Table data={stations} columns={columns} emptyMessage="Aucune gare enregistrée" />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Nouvelle gare">
        <p className="text-gray-600">Formulaire de création à implémenter</p>
      </Modal>
    </div>
  );
}
