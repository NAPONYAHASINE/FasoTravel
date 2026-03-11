/**
 * @file RoutesPage.tsx
 * @description Gestion des trajets (Routes)
 */

import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card, Button, Table, Modal, Badge } from '../../components/ui';
import { Plus, Edit, Trash } from 'lucide-react';
import { formatDistance } from '../../utils/formatters';

interface Route {
  id: string;
  name: string;
  startStationName: string;
  endStationName: string;
  distanceKm: number;
  estimatedDurationMinutes: number;
  isExpress: boolean;
  status: 'active' | 'inactive';
}

export default function RoutesPage() {
  const { routes, createRoute, updateRoute, deleteRoute, stations } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<Route | null>(null);

  const handleCreate = () => {
    setSelectedRoute(null);
    setIsModalOpen(true);
  };

  const handleEdit = (route: Route) => {
    setSelectedRoute(route);
    setIsModalOpen(true);
  };

  const columns = [
    {
      key: 'name',
      header: 'Nom du trajet',
      render: (route: Route) => <span className="font-medium">{route.name}</span>
    },
    {
      key: 'stations',
      header: 'Départ → Arrivée',
      render: (route: Route) => (
        <span className="text-sm">
          {route.startStationName} → {route.endStationName}
        </span>
      )
    },
    {
      key: 'distance',
      header: 'Distance',
      render: (route: Route) => formatDistance(route.distanceKm)
    },
    {
      key: 'duration',
      header: 'Durée estimée',
      render: (route: Route) => `${Math.floor(route.estimatedDurationMinutes / 60)}h ${route.estimatedDurationMinutes % 60}min`
    },
    {
      key: 'express',
      header: 'Type',
      render: (route: Route) => (
        <Badge variant={route.isExpress ? 'info' : 'default'}>
          {route.isExpress ? 'Express' : 'Standard'}
        </Badge>
      )
    },
    {
      key: 'status',
      header: 'Statut',
      render: (route: Route) => (
        <Badge variant={route.status === 'active' ? 'success' : 'default'}>
          {route.status === 'active' ? 'Actif' : 'Inactif'}
        </Badge>
      )
    },
    {
      key: 'actions',
      header: 'Actions',
      render: (route: Route) => (
        <div className="flex items-center gap-2">
          <Button size="sm" variant="ghost" icon={<Edit className="w-4 h-4" />} onClick={() => handleEdit(route)}>
            Modifier
          </Button>
          <Button
            size="sm"
            variant="danger"
            icon={<Trash className="w-4 h-4" />}
            onClick={() => deleteRoute(route.id)}
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
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Trajets</h1>
          <p className="text-gray-600 mt-1">{routes.length} trajets configurés</p>
        </div>
        <Button icon={<Plus className="w-5 h-5" />} onClick={handleCreate}>
          Nouveau trajet
        </Button>
      </div>

      <Card>
        <Table data={routes} columns={columns} emptyMessage="Aucun trajet configuré" />
      </Card>

      {/* Modal Create/Edit */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedRoute ? 'Modifier le trajet' : 'Nouveau trajet'}
      >
        <p className="text-gray-600">Formulaire de création/modification à implémenter</p>
      </Modal>
    </div>
  );
}