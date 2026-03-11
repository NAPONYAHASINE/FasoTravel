/**
 * @file TicketsPage.tsx
 * @description Gestion des billets
 */

import { useApp } from '../../contexts/AppContext';
import { Card, Table, Badge } from '../../components/ui';
import { Ticket as TicketIcon } from 'lucide-react';
import { formatCurrency, formatDateTime, getTicketStatusLabel } from '../../utils/formatters';

export default function TicketsPage() {
  const { tickets } = useApp();

  const getStatusVariant = (status: string): 'success' | 'warning' | 'danger' | 'info' | 'default' => {
    switch (status) {
      case 'confirmed': return 'success';
      case 'booked': return 'info';
      case 'used': return 'default';
      case 'cancelled': return 'danger';
      case 'refunded': return 'warning';
      default: return 'default';
    }
  };

  const columns = [
    {
      key: 'id',
      header: 'N° Billet',
      render: (ticket: any) => (
        <div className="flex items-center gap-2">
          <TicketIcon className="w-4 h-4 text-fasotravel-yellow" />
          <span className="font-mono text-sm">{ticket.id.slice(0, 8)}</span>
        </div>
      )
    },
    { key: 'passenger', header: 'Passager', render: (ticket: any) => ticket.passengerName || '-' },
    { key: 'seat', header: 'Siège', render: (ticket: any) => ticket.seatNumber },
    { key: 'amount', header: 'Montant', render: (ticket: any) => <span className="font-semibold">{formatCurrency(ticket.totalAmount)}</span> },
    {
      key: 'payment',
      header: 'Paiement',
      render: (ticket: any) => (
        <Badge size="sm" variant={ticket.paymentStatus === 'paid' ? 'success' : 'warning'}>
          {ticket.paymentStatus === 'paid' ? 'Payé' : 'En attente'}
        </Badge>
      )
    },
    { key: 'date', header: "Date d'achat", render: (ticket: any) => formatDateTime(ticket.purchaseDate) },
    {
      key: 'status',
      header: 'Statut',
      render: (ticket: any) => (
        <Badge variant={getStatusVariant(ticket.status)}>
          {getTicketStatusLabel(ticket.status)}
        </Badge>
      )
    }
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Gestion des Billets</h1>
        <p className="text-gray-600 mt-1">{tickets.length} billets vendus</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Billets confirmés</p>
          <p className="text-2xl font-bold text-green-600">
            {tickets.filter((t: any) => t.status === 'confirmed').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">En attente</p>
          <p className="text-2xl font-bold text-blue-600">
            {tickets.filter((t: any) => t.status === 'booked').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Utilisés</p>
          <p className="text-2xl font-bold text-gray-600">
            {tickets.filter((t: any) => t.status === 'used').length}
          </p>
        </div>
        <div className="bg-white p-4 rounded-lg border border-gray-200">
          <p className="text-sm text-gray-600">Annulés</p>
          <p className="text-2xl font-bold text-red-600">
            {tickets.filter((t: any) => t.status === 'cancelled').length}
          </p>
        </div>
      </div>

      <Card>
        <Table data={tickets} columns={columns} emptyMessage="Aucun billet vendu" />
      </Card>
    </div>
  );
}
