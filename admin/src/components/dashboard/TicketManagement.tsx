/**
 * TicketManagement - Gestion des BILLETS
 * Version 2.0 - Backend-ready, composant SÉPARÉ de BookingManagement
 * 
 * ⚠️ RAPPEL CRITIQUE: BILLETS ≠ RÉSERVATIONS
 * 
 * BILLETS (ce composant):
 * - ACTIF: Billet valide, date de départ pas encore passée
 * - EMBARQUÉ: Passager actuellement dans le car
 * - EXPIRÉ: Date de départ passée (trajet terminé ou absent)
 * - ANNULÉ: Billet annulé manuellement
 * 
 * RÉSERVATIONS (BookingManagement):
 * - EN_ATTENTE: En attente de paiement
 * - CONFIRMÉ: Payé, génère un billet ACTIF
 * - TERMINÉ: Voyage terminé
 * - ANNULÉ: Annulé
 */

import { useState, useMemo } from 'react';
import { Ticket as TicketIcon, Search, Download, Eye, CheckCircle, UserCheck, Clock, XCircle } from 'lucide-react';
import { exportToCSV } from '../../lib/exportUtils';
import { useTickets } from '../../hooks/useTickets';
import type { Ticket } from '../../shared/types/standardized';
import { PAYMENT_METHOD_LABELS, STATUS_LABELS } from '../../lib/constants';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { StatCard } from '../ui/stat-card';
import { PAGE_CLASSES } from '../../lib/design-system';

type TicketStatusFilter = 'all' | 'active' | 'boarded' | 'expired' | 'cancelled';

export function TicketManagement() {
  const { tickets, stats: _stats, loading: _loading, error } = useTickets({ loadStats: true });
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<TicketStatusFilter>('all');
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleViewDetails = (ticket: Ticket) => {
    setSelectedTicket(ticket);
    setShowDetailsModal(true);
  };

  const handleExport = () => {
    const exportData = filteredTickets.map(t => ({
      'ID Billet': t.id,
      'Réservation': t.bookingId,
      'Passager': t.passengerName || '',
      'Siège': t.seatNumber,
      'Trajet': `${t.departure || ''} → ${t.destination || ''}`,
      'Société': t.companyName || '',
      'Montant': t.totalAmount,
      'Statut': STATUS_LABELS.ticket[t.status] || t.status,
      'Date départ': t.departureDate || '',
      'Heure départ': t.departureTime || '',
      'Date achat': new Date(t.purchaseDate).toLocaleString('fr-FR')
    }));
    exportToCSV(exportData, 'billets');
  };

  // Filtrage
  const filteredTickets = useMemo(() => {
    if (!tickets || !Array.isArray(tickets)) return [];
    
    return tickets.filter(ticket => {
      const searchLower = searchTerm?.toLowerCase() || '';
      const matchesSearch = 
        ticket.id?.toLowerCase().includes(searchLower) ||
        ticket.bookingId?.toLowerCase().includes(searchLower) ||
        ticket.passengerName?.toLowerCase().includes(searchLower) ||
        ticket.departure?.toLowerCase().includes(searchLower) ||
        ticket.destination?.toLowerCase().includes(searchLower) ||
        ticket.companyName?.toLowerCase().includes(searchLower);
      
      const matchesStatus = statusFilter === 'all' || ticket.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [tickets, searchTerm, statusFilter]);

  // Compteurs par statut
  const countByStatus = useMemo(() => ({
    active: tickets.filter(t => t.status === 'active').length,
    boarded: tickets.filter(t => t.status === 'boarded').length,
    expired: tickets.filter(t => t.status === 'expired').length,
    cancelled: tickets.filter(t => t.status === 'cancelled').length,
  }), [tickets]);

  const getStatusBadgeClasses = (status: Ticket['status']) => {
    switch (status) {
      case 'active': return 'bg-green-500 text-white';
      case 'boarded': return 'bg-blue-500 text-white';
      case 'expired': return 'bg-gray-500 text-white';
      case 'cancelled': return 'bg-red-500 text-white';
    }
  };

  const getStatusIcon = (status: Ticket['status']) => {
    switch (status) {
      case 'active': return <CheckCircle className="h-4 w-4" />;
      case 'boarded': return <UserCheck className="h-4 w-4" />;
      case 'expired': return <Clock className="h-4 w-4" />;
      case 'cancelled': return <XCircle className="h-4 w-4" />;
    }
  };

  return (
    <div className={PAGE_CLASSES.container}>
      {/* Header */}
      <div className={PAGE_CLASSES.header}>
        <div className={PAGE_CLASSES.headerContent}>
          <div className={PAGE_CLASSES.headerTexts}>
            <div className="flex items-center gap-3 mb-2">
              <TicketIcon className="h-8 w-8 text-[#009e49]" />
              <h1 className="text-3xl text-gray-900 dark:text-white">Gestion des Billets</h1>
            </div>
            <p className="text-gray-600 dark:text-gray-400">
              Tous les billets de transport émis sur la plateforme
              <span className="text-xs ml-2 text-amber-600 dark:text-amber-400">(≠ Réservations)</span>
            </p>
          </div>
        </div>
      </div>

      {/* Loading / Error states */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <p className="text-red-900 dark:text-red-100">Erreur: {error}</p>
        </div>
      )}

      {/* Stats Cards - Statuts BILLETS */}
      <div className={PAGE_CLASSES.statsGrid}>
        <StatCard title="Actifs" value={countByStatus.active} icon={CheckCircle} color="green" subtitle="Billets valides" />
        <StatCard title="Embarqués" value={countByStatus.boarded} icon={UserCheck} color="blue" subtitle="En voyage actuellement" />
        <StatCard title="Expirés" value={countByStatus.expired} icon={Clock} color="gray" subtitle="Voyages passés" />
        <StatCard title="Annulés" value={countByStatus.cancelled} icon={XCircle} color="red" subtitle="Billets annulés" />
      </div>

      {/* Filtres */}
      <div className={PAGE_CLASSES.searchSection}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                placeholder="Rechercher par ID billet, réservation, passager, trajet, société..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009e49] bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value as TicketStatusFilter)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#009e49] bg-white dark:bg-gray-700 dark:text-white transition-colors"
            >
              <option value="all">Tous les statuts</option>
              <option value="active">Actif</option>
              <option value="boarded">Embarqué</option>
              <option value="expired">Expiré</option>
              <option value="cancelled">Annulé</option>
            </select>

            <button 
              className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" 
              onClick={handleExport}
              title="Exporter"
            >
              <Download className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={PAGE_CLASSES.tableContainer}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">ID Billet</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Passager</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Trajet</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Société</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Siège</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Départ</th>
                <th className="px-6 py-3 text-right text-xs text-gray-600 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredTickets.length === 0 ? (
                <tr>
                  <td colSpan={9} className="px-6 py-8 text-center text-gray-600 dark:text-gray-400">
                    Aucun billet trouvé
                  </td>
                </tr>
              ) : (
                filteredTickets.map((ticket) => (
                  <tr key={ticket.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-mono text-sm text-gray-900 dark:text-white">{ticket.id}</div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">
                        Rés: {ticket.bookingId}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">{ticket.passengerName}</div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {ticket.departure} → {ticket.destination}
                      </div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-700 dark:text-gray-300">{ticket.companyName}</div>
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200 rounded text-sm font-mono">
                        {ticket.seatNumber}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      <div className="text-gray-900 dark:text-white">{ticket.totalAmount.toLocaleString()} FCFA</div>
                      {ticket.paymentMethod && (
                        <div className="text-xs text-gray-500 dark:text-gray-400">
                          {PAYMENT_METHOD_LABELS[ticket.paymentMethod] || ticket.paymentMethod}
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses(ticket.status)}`}>
                        {getStatusIcon(ticket.status)}
                        {STATUS_LABELS.ticket[ticket.status] || ticket.status}
                      </span>
                    </td>
                    
                    <td className="px-6 py-4">
                      {ticket.departureDate && (
                        <div>
                          <div className="text-sm text-gray-900 dark:text-white">{ticket.departureDate}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{ticket.departureTime}</div>
                        </div>
                      )}
                    </td>
                    
                    <td className="px-6 py-4 text-right">
                      <button 
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        onClick={() => handleViewDetails(ticket)}
                        title="Voir les détails"
                      >
                        <Eye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredTickets.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
            <div>
              Affichage de {filteredTickets.length} sur {tickets.length} billets
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Détails du Billet</DialogTitle>
            <DialogDescription>
              Informations détaillées sur le billet {selectedTicket?.id}
            </DialogDescription>
          </DialogHeader>
          {selectedTicket && (
            <div className="grid grid-cols-2 gap-4 mt-2">
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400">ID Billet</span>
                <span className="text-sm text-gray-900 dark:text-white font-mono">{selectedTicket.id}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400">Réservation</span>
                <span className="text-sm text-gray-900 dark:text-white font-mono">{selectedTicket.bookingId}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400">Passager</span>
                <span className="text-sm text-gray-900 dark:text-white">{selectedTicket.passengerName}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400">Trajet</span>
                <span className="text-sm text-gray-900 dark:text-white">{selectedTicket.departure} → {selectedTicket.destination}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400">Société</span>
                <span className="text-sm text-gray-900 dark:text-white">{selectedTicket.companyName}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400">Siège</span>
                <span className="text-sm text-gray-900 dark:text-white font-mono">{selectedTicket.seatNumber}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400">Montant</span>
                <span className="text-sm text-gray-900 dark:text-white">{selectedTicket.totalAmount.toLocaleString()} FCFA</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400">Méthode de paiement</span>
                <span className="text-sm text-gray-900 dark:text-white">{selectedTicket.paymentMethod ? (PAYMENT_METHOD_LABELS[selectedTicket.paymentMethod] || selectedTicket.paymentMethod) : '—'}</span>
              </div>
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400">Statut</span>
                <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium w-fit ${getStatusBadgeClasses(selectedTicket.status)}`}>
                  {getStatusIcon(selectedTicket.status)}
                  {STATUS_LABELS.ticket[selectedTicket.status] || selectedTicket.status}
                </span>
              </div>
              {selectedTicket.departureDate && (
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Départ</span>
                  <span className="text-sm text-gray-900 dark:text-white">{selectedTicket.departureDate} à {selectedTicket.departureTime}</span>
                </div>
              )}
              <div className="flex flex-col">
                <span className="text-sm text-gray-500 dark:text-gray-400">Date d'achat</span>
                <span className="text-sm text-gray-900 dark:text-white">{new Date(selectedTicket.purchaseDate).toLocaleString('fr-FR')}</span>
              </div>
              {selectedTicket.qrCode && (
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 dark:text-gray-400">QR Code</span>
                  <span className="text-sm text-gray-900 dark:text-white font-mono">{selectedTicket.qrCode}</span>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default TicketManagement;