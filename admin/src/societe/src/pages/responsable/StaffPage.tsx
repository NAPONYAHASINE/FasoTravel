/**
 * @file StaffPage.tsx
 * @description Gestion du personnel (managers + caissiers)
 */

import { useApp } from '../../contexts/AppContext';
import { Card, Table, Badge } from '../../components/ui';
import { Users } from 'lucide-react';

// Types are defined in AppContext
interface Manager {
  id: string;
  name: string;
  email: string;
  gareName: string;
  phone?: string;
  status: 'active' | 'inactive';
}

interface Cashier {
  id: string;
  name: string;
  email: string;
  gareName: string;
  shiftStartTime?: string;
  shiftEndTime?: string;
  status: 'active' | 'inactive';
}

export default function StaffPage() {
  const { managers, cashiers } = useApp();

  const managerColumns = [
    { key: 'name', header: 'Nom', render: (m: Manager) => <span className="font-medium">{m.name}</span> },
    { key: 'email', header: 'Email', render: (m: Manager) => m.email },
    { key: 'gare', header: 'Gare', render: (m: Manager) => m.gareName },
    { key: 'phone', header: 'Téléphone', render: (m: Manager) => m.phone || '-' },
    {
      key: 'status',
      header: 'Statut',
      render: (m: Manager) => (
        <Badge variant={m.status === 'active' ? 'success' : 'default'}>
          {m.status === 'active' ? 'Actif' : 'Inactif'}
        </Badge>
      )
    }
  ];

  const cashierColumns = [
    { key: 'name', header: 'Nom', render: (c: Cashier) => <span className="font-medium">{c.name}</span> },
    { key: 'email', header: 'Email', render: (c: Cashier) => c.email },
    { key: 'gare', header: 'Gare', render: (c: Cashier) => c.gareName },
    { key: 'shift', header: 'Horaires', render: (c: Cashier) => c.shiftStartTime && c.shiftEndTime ? `${c.shiftStartTime} - ${c.shiftEndTime}` : '-' },
    {
      key: 'status',
      header: 'Statut',
      render: (c: Cashier) => (
        <Badge variant={c.status === 'active' ? 'success' : 'default'}>
          {c.status === 'active' ? 'Actif' : 'Inactif'}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion du Personnel</h1>
        <p className="text-gray-600 mt-1">{managers.length} managers, {cashiers.length} caissiers</p>
      </div>

      <Card title="Managers de gare" subtitle={`${managers.length} managers`}>
        <Table data={managers} columns={managerColumns} emptyMessage="Aucun manager" />
      </Card>

      <Card title="Caissiers" subtitle={`${cashiers.length} caissiers`}>
        <Table data={cashiers} columns={cashierColumns} emptyMessage="Aucun caissier" />
      </Card>
    </div>
  );
}