/**
 * @file SalesPage.tsx
 * @description Ventes de billets (Manager)
 */

import { useApp } from '../../contexts/AppContext';
import { Card, Table, Badge } from '../../components/ui';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export default function SalesPage() {
  const { tickets, currentUser } = useApp();

  // Filter tickets for this station
  const myTickets = tickets.filter((t: any) => t.cashierStationId === currentUser?.gareId);

  const columns = [
    { key: 'id', header: 'N° Billet', render: (t: any) => <span className="font-mono text-sm">{t.id.slice(0, 8)}</span> },
    { key: 'passenger', header: 'Passager', render: (t: any) => t.passengerName || '-' },
    { key: 'amount', header: 'Montant', render: (t: any) => formatCurrency(t.totalAmount) },
    { key: 'cashier', header: 'Caissier', render: (t: any) => t.cashierName || '-' },
    { key: 'date', header: 'Date', render: (t: any) => formatDateTime(t.purchaseDate) },
    {
      key: 'status',
      header: 'Statut',
      render: (t: any) => (
        <Badge variant={t.status === 'confirmed' ? 'success' : 'info'}>{t.status}</Badge>
      )
    }
  ];

  const totalRevenue = myTickets.reduce((sum: number, t: any) => sum + t.totalAmount, 0);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Ventes de Billets</h1>
        <p className="text-gray-600 mt-1">Revenus: {formatCurrency(totalRevenue)}</p>
      </div>

      <Card>
        <Table data={myTickets} columns={columns} emptyMessage="Aucune vente" />
      </Card>
    </div>
  );
}
