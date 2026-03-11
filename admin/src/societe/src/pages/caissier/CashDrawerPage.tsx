/**
 * @file CashDrawerPage.tsx
 * @description Gestion de la caisse (Caissier)
 */

import { useApp } from '../../contexts/AppContext';
import { Card, Table, Badge } from '../../components/ui';
import { formatCurrency, formatDateTime } from '../../utils/formatters';

export default function CashDrawerPage() {
  const { cashTransactions, currentUser } = useApp();

  // Filter transactions for this cashier
  const myTransactions = cashTransactions.filter((t: any) => t.cashierId === currentUser?.id);

  const columns = [
    { key: 'type', header: 'Type', render: (t: any) => <span className="capitalize">{t.type}</span> },
    {
      key: 'amount',
      header: 'Montant',
      render: (t: any) => (
        <span className={t.type === 'refund' ? 'text-red-600' : 'text-green-600'}>
          {t.type === 'refund' ? '-' : '+'}{formatCurrency(t.amount)}
        </span>
      )
    },
    { key: 'description', header: 'Description', render: (t: any) => t.description || '-' },
    { key: 'date', header: 'Date', render: (t: any) => formatDateTime(t.createdAt) },
    {
      key: 'verified',
      header: 'Vérifié',
      render: (t: any) => (
        <Badge variant={t.verified ? 'success' : 'warning'}>
          {t.verified ? 'Oui' : 'En attente'}
        </Badge>
      )
    }
  ];

  const totalSales = myTransactions
    .filter((t: any) => t.type === 'sale')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const totalRefunds = myTransactions
    .filter((t: any) => t.type === 'refund')
    .reduce((sum: number, t: any) => sum + t.amount, 0);

  const balance = totalSales - totalRefunds;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion de Caisse</h1>
        <p className="text-gray-600 mt-1">Caissier: {currentUser?.name}</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <p className="text-sm text-gray-600">Ventes</p>
          <p className="text-2xl font-bold text-green-600">{formatCurrency(totalSales)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Remboursements</p>
          <p className="text-2xl font-bold text-red-600">{formatCurrency(totalRefunds)}</p>
        </Card>
        <Card>
          <p className="text-sm text-gray-600">Solde</p>
          <p className="text-2xl font-bold text-gray-900">{formatCurrency(balance)}</p>
        </Card>
      </div>

      <Card title="Transactions">
        <Table data={myTransactions} columns={columns} emptyMessage="Aucune transaction" />
      </Card>
    </div>
  );
}
