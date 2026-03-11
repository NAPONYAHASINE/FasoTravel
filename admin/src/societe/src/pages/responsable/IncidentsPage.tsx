/**
 * @file IncidentsPage.tsx
 * @description Gestion des incidents
 */

import { useState } from 'react';
import { useApp } from '../../contexts/AppContext';
import { Card, Button, Table, Modal, Badge } from '../../components/ui';
import { Plus, AlertTriangle } from 'lucide-react';
import { formatDateTime, getIncidentSeverityLabel } from '../../utils/formatters';

export default function IncidentsPage() {
  const { incidents } = useApp();
  const [isModalOpen, setIsModalOpen] = useState(false);

  const getSeverityVariant = (severity: string): 'success' | 'warning' | 'danger' => {
    switch (severity) {
      case 'low': return 'success';
      case 'medium': return 'warning';
      case 'high':
      case 'critical': return 'danger';
      default: return 'warning';
    }
  };

  const getStatusVariant = (status: string): 'info' | 'warning' | 'success' => {
    switch (status) {
      case 'open': return 'info';
      case 'in-progress': return 'warning';
      case 'resolved': return 'success';
      default: return 'info';
    }
  };

  const columns = [
    {
      key: 'type',
      header: 'Type',
      render: (incident: any) => (
        <div className="flex items-center gap-2">
          <AlertTriangle className="w-4 h-4 text-fasotravel-red" />
          <span className="capitalize">{incident.type}</span>
        </div>
      )
    },
    { key: 'title', header: 'Titre', render: (incident: any) => <span className="font-medium">{incident.title}</span> },
    { key: 'gare', header: 'Gare', render: (incident: any) => incident.gareName || '-' },
    {
      key: 'severity',
      header: 'Gravité',
      render: (incident: any) => (
        <Badge variant={getSeverityVariant(incident.severity)}>
          {getIncidentSeverityLabel(incident.severity)}
        </Badge>
      )
    },
    {
      key: 'status',
      header: 'Statut',
      render: (incident: any) => (
        <Badge variant={getStatusVariant(incident.status)}>
          {incident.status === 'open' && 'Ouvert'}
          {incident.status === 'in-progress' && 'En cours'}
          {incident.status === 'resolved' && 'Résolu'}
        </Badge>
      )
    },
    { key: 'reporter', header: 'Rapporté par', render: (incident: any) => incident.reportedByName || '-' },
    { key: 'date', header: 'Date', render: (incident: any) => formatDateTime(incident.createdAt) }
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Gestion des Incidents</h1>
          <p className="text-gray-600 mt-1">
            {incidents.filter((i: any) => i.status !== 'resolved').length} incidents actifs
          </p>
        </div>
        <Button icon={<Plus className="w-5 h-5" />} onClick={() => setIsModalOpen(true)}>
          Signaler un incident
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Ouverts</p>
          <p className="text-2xl font-bold text-blue-600">
            {incidents.filter((i: any) => i.status === 'open').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">En cours</p>
          <p className="text-2xl font-bold text-yellow-600">
            {incidents.filter((i: any) => i.status === 'in-progress').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Résolus</p>
          <p className="text-2xl font-bold text-green-600">
            {incidents.filter((i: any) => i.status === 'resolved').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Critiques</p>
          <p className="text-2xl font-bold text-red-600">
            {incidents.filter((i: any) => i.severity === 'critical').length}
          </p>
        </div>
      </div>

      <Card>
        <Table data={incidents} columns={columns} emptyMessage="Aucun incident signalé" />
      </Card>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)} title="Signaler un incident">
        <p className="text-gray-600">Formulaire de création à implémenter</p>
      </Modal>
    </div>
  );
}
