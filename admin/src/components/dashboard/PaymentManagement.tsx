import { useState, useCallback } from 'react';
import { CreditCard, Search, CheckCircle, XCircle, Clock, Download, Eye, DollarSign, RefreshCw, ChevronLeft, ChevronRight, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import { exportToCSV } from '../../lib/exportUtils';
import { usePayments, usePaymentActions } from '../../hooks/usePayments';
import { PAYMENT_METHOD_LABELS, STATUS_LABELS } from '../../lib/constants';
import type { Payment, PaymentStatus, PaymentMethod } from '../../types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { StatCard } from '../ui/stat-card';
import { PAGE_CLASSES, COMPONENTS } from '../../lib/design-system';
import { toast } from 'sonner@2.0.3';
import React from 'react';

/**
 * PaymentManagement - Admin Version
 * Version 4.0 - Backend-ready COMPLET
 * 
 * Améliorations v4:
 * - Pagination côté serveur (page, limit, totalPages)
 * - Actions d'écriture: Rembourser, Relancer paiement échoué
 * - Stats depuis le backend (RevenueStats) au lieu de calculs client
 * - Filtres envoyés au service (backend-ready)
 */
export function PaymentManagement() {
  // 🔥 HOOKS BACKEND-READY
  const {
    payments,
    stats: revenueStats,
    loading,
    error,
    pagination,
    setPage,
    setFilters,
    refresh,
  } = usePayments({ loadStats: true, paginated: true, limit: 10 });

  const { refundPayment, retryPayment, actionLoading } = usePaymentActions();

  // UI State
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<PaymentStatus | 'all'>('all');
  const [methodFilter, setMethodFilter] = useState<PaymentMethod | 'all'>('all');
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [showRefundModal, setShowRefundModal] = useState(false);
  const [refundReason, setRefundReason] = useState('');

  // ==================== HANDLERS ====================

  const handleViewDetails = (payment: Payment) => {
    setSelectedPayment(payment);
    setShowDetailsModal(true);
  };

  const handleSearchChange = useCallback((value: string) => {
    setSearchTerm(value);
    setFilters({
      search: value || undefined,
      status: statusFilter,
      method: methodFilter,
    });
  }, [statusFilter, methodFilter, setFilters]);

  const handleStatusFilterChange = useCallback((value: PaymentStatus | 'all') => {
    setStatusFilter(value);
    setFilters({
      search: searchTerm || undefined,
      status: value,
      method: methodFilter,
    });
  }, [searchTerm, methodFilter, setFilters]);

  const handleMethodFilterChange = useCallback((value: PaymentMethod | 'all') => {
    setMethodFilter(value);
    setFilters({
      search: searchTerm || undefined,
      status: statusFilter,
      method: value,
    });
  }, [searchTerm, statusFilter, setFilters]);

  const handleRefund = async () => {
    if (!selectedPayment || !refundReason.trim()) return;
    try {
      await refundPayment(selectedPayment.id, refundReason);
      toast.success(`Paiement ${selectedPayment.id.slice(0, 12)} remboursé avec succès`);
      setShowRefundModal(false);
      setShowDetailsModal(false);
      setRefundReason('');
      setSelectedPayment(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors du remboursement');
    }
  };

  const handleRetry = async (payment: Payment) => {
    try {
      await retryPayment(payment.id);
      toast.success(`Paiement ${payment.id.slice(0, 12)} relancé avec succès`);
      setShowDetailsModal(false);
      setSelectedPayment(null);
      await refresh();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de la relance');
    }
  };

  const handleExport = () => {
    const exportData = payments.map(p => ({
      ID: p.id,
      'Réservation': p.bookingId,
      Montant: p.amount,
      Devise: p.currency,
      Méthode: PAYMENT_METHOD_LABELS[p.method],
      Statut: STATUS_LABELS.payment[p.status],
      Référence: p.transactionId || '',
      Date: new Date(p.createdAt).toLocaleString('fr-FR')
    }));
    exportToCSV(exportData, 'paiements');
  };

  // ==================== HELPERS ====================

  const getPaymentMethodIcon = (method: PaymentMethod) => {
    switch (method) {
      case 'cash':
        return <DollarSign className="h-4 w-4" />;
      default:
        return <CreditCard className="h-4 w-4" />;
    }
  };

  const getStatusBadgeClasses = (status: PaymentStatus) => {
    switch (status) {
      case 'completed': return 'bg-green-500 text-white';
      case 'pending': return 'bg-yellow-500 text-white';
      case 'failed': return 'bg-red-500 text-white';
      case 'refunded': return 'bg-indigo-500 text-white';
      default: return 'bg-gray-500 text-white';
    }
  };

  // Stats depuis le backend (plus de calcul client)
  const pendingPayments = revenueStats
    ? revenueStats.totalPayments - revenueStats.successfulPayments - revenueStats.failedPayments - revenueStats.refundedPayments
    : 0;

  const successRate = revenueStats && revenueStats.totalPayments > 0
    ? ((revenueStats.successfulPayments / revenueStats.totalPayments) * 100).toFixed(1)
    : '0.0';

  return (
    <div className={PAGE_CLASSES.container}>
      {/* Header */}
      <div className={PAGE_CLASSES.header}>
        <div className={PAGE_CLASSES.headerContent}>
          <div className={PAGE_CLASSES.headerTexts}>
            <h1 className="text-3xl text-gray-900 dark:text-white mb-2">Gestion des Paiements</h1>
            <p className="text-gray-600 dark:text-gray-400">Tous les paiements et revenus de la plateforme</p>
          </div>
          <div className={PAGE_CLASSES.headerActions}>
            <button
              onClick={() => refresh()}
              className={COMPONENTS.buttonSecondary}
            >
              <RefreshCw className="h-4 w-4" />
              Actualiser
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <p className="text-red-900 dark:text-red-100">Erreur: {error}</p>
          </div>
        </div>
      )}

      {/* Stats Cards — Design-system StatCard */}
      <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 mb-8">
        <StatCard
          title="Revenu Total"
          value={`${revenueStats?.totalRevenue?.toLocaleString() || '0'} FCFA`}
          icon={DollarSign}
          color="yellow"
          subtitle={`+${revenueStats?.todayRevenue?.toLocaleString() || '0'} aujourd'hui`}
        />
        <StatCard
          title="Réussis"
          value={revenueStats?.successfulPayments ?? 0}
          icon={CheckCircle}
          color="green"
          subtitle={`${successRate}% taux de succès`}
        />
        <StatCard
          title="En Attente"
          value={pendingPayments}
          icon={Clock}
          color="yellow"
          subtitle="En cours"
        />
        <StatCard
          title="Échoués"
          value={revenueStats?.failedPayments ?? 0}
          icon={XCircle}
          color="red"
          subtitle="Nécessitent action"
        />
        <StatCard
          title="Remboursés"
          value={revenueStats?.refundedPayments ?? 0}
          icon={RotateCcw}
          color="purple"
          subtitle="Total"
        />
      </div>

      {/* Filtres */}
      <div className={PAGE_CLASSES.searchSection}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                placeholder="Rechercher par ID paiement, réservation, utilisateur, référence..."
                value={searchTerm}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dc2626] bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors"
              />
            </div>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <select
              value={statusFilter}
              onChange={(e) => handleStatusFilterChange(e.target.value as PaymentStatus | 'all')}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dc2626] bg-white dark:bg-gray-700 dark:text-white transition-colors"
            >
              <option value="all">Tous les statuts</option>
              <option value="pending">En Attente</option>
              <option value="completed">Complété</option>
              <option value="failed">Échoué</option>
              <option value="refunded">Remboursé</option>
            </select>

            <select
              value={methodFilter}
              onChange={(e) => handleMethodFilterChange(e.target.value as PaymentMethod | 'all')}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dc2626] bg-white dark:bg-gray-700 dark:text-white transition-colors"
            >
              <option value="all">Toutes méthodes</option>
              <option value="mobile_money">Mobile Money</option>
              <option value="card">Carte Bancaire</option>
              <option value="cash">Espèces</option>
            </select>

            <button 
              className="px-4 py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors" 
              onClick={handleExport}
              title="Exporter en CSV"
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
                <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">ID Paiement</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Réservation</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Montant</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Méthode</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Statut</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Date</th>
                <th className="px-6 py-3 text-right text-xs text-gray-600 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {payments.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-600 dark:text-gray-400">
                    Aucun paiement trouvé
                  </td>
                </tr>
              ) : (
                (() => {
                  // Sort: pending/failed payments always first
                  const sorted = [...payments].sort((a, b) => {
                    const isPendingA = a.status === 'pending' || a.status === 'failed';
                    const isPendingB = b.status === 'pending' || b.status === 'failed';
                    if (isPendingA && !isPendingB) return -1;
                    if (!isPendingA && isPendingB) return 1;
                    return 0;
                  });
                  const pendingIdx = sorted.filter(p => p.status === 'pending' || p.status === 'failed').length;
                  return sorted.flatMap((payment, index) => {
                    const rows: React.ReactNode[] = [];
                    if (pendingIdx > 0 && index === pendingIdx) {
                      rows.push(
                        <tr key={`separator-${payment.id}`}>
                          <td colSpan={7} className="px-0 py-1">
                            <div className="flex items-center gap-3">
                              <div className="flex-1 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-transparent rounded-full" />
                              <span className="text-xs text-red-500 whitespace-nowrap">{pendingIdx} à traiter ci-dessus</span>
                              <div className="flex-1 h-0.5 bg-gradient-to-l from-red-500 via-red-400 to-transparent rounded-full" />
                            </div>
                          </td>
                        </tr>
                      );
                    }
                    rows.push(
                      <tr key={payment.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors ${(payment.status === 'pending' || payment.status === 'failed') ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm text-gray-900 dark:text-white">{payment.id.slice(0, 12)}...</div>
                          {payment.transactionId && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Réf: {payment.transactionId}
                            </div>
                          )}
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm text-gray-900 dark:text-white">{payment.bookingId.slice(0, 12)}...</div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-gray-900 dark:text-white">{payment.amount.toLocaleString()} {payment.currency}</div>
                          {payment.platformFee && (
                            <div className="text-xs text-gray-500 dark:text-gray-400">
                              Commission: {payment.platformFee.toLocaleString()} FCFA
                            </div>
                          )}
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                            {getPaymentMethodIcon(payment.method)}
                            <span className="text-sm">{PAYMENT_METHOD_LABELS[payment.method]}</span>
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span 
                            className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeClasses(payment.status)}`}
                          >
                            {STATUS_LABELS.payment[payment.status]}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {formatDistanceToNow(new Date(payment.createdAt), { addSuffix: true, locale: fr })}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex justify-end gap-1">
                            <button 
                              className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                              onClick={() => handleViewDetails(payment)}
                              title="Voir détails"
                            >
                              <Eye className="h-4 w-4" />
                            </button>
                            {payment.status === 'failed' && (
                              <button 
                                className="p-2 text-yellow-600 dark:text-yellow-400 hover:text-yellow-900 dark:hover:text-yellow-300 hover:bg-yellow-50 dark:hover:bg-yellow-900/30 rounded-lg transition-colors"
                                onClick={() => handleRetry(payment)}
                                disabled={actionLoading}
                                title="Relancer le paiement"
                              >
                                <RefreshCw className={`h-4 w-4 ${actionLoading ? 'animate-spin' : ''}`} />
                              </button>
                            )}
                            {payment.status === 'completed' && (
                              <button 
                                className="p-2 text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 rounded-lg transition-colors"
                                onClick={() => {
                                  setSelectedPayment(payment);
                                  setShowRefundModal(true);
                                }}
                                disabled={actionLoading}
                                title="Rembourser"
                              >
                                <RotateCcw className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                    return rows;
                  });
                })()
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
          <div>
            {pagination.total > 0 ? (
              <>
                Affichage de {((pagination.page - 1) * pagination.limit) + 1} à{' '}
                {Math.min(pagination.page * pagination.limit, pagination.total)} sur{' '}
                {pagination.total} paiements
              </>
            ) : (
              'Aucun résultat'
            )}
          </div>
          
          {pagination.totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage(pagination.page - 1)}
                disabled={pagination.page <= 1 || loading}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              
              {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map(page => (
                <button
                  key={page}
                  onClick={() => setPage(page)}
                  disabled={loading}
                  className={`px-3 py-1 rounded-lg transition-colors ${
                    page === pagination.page
                      ? 'bg-[#dc2626] text-white'
                      : 'border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300'
                  }`}
                >
                  {page}
                </button>
              ))}
              
              <button
                onClick={() => setPage(pagination.page + 1)}
                disabled={pagination.page >= pagination.totalPages || loading}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* ==================== MODALE DÉTAILS ==================== */}
      <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Détails du Paiement</DialogTitle>
            <DialogDescription>
              Informations complètes sur le paiement
            </DialogDescription>
          </DialogHeader>
          {selectedPayment && (
            <div className="space-y-4 mt-2">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">ID Paiement</span>
                  <span className="text-sm text-gray-900 dark:text-white font-mono">{selectedPayment.id}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Réservation</span>
                  <span className="text-sm text-gray-900 dark:text-white font-mono">{selectedPayment.bookingId}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Utilisateur</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {selectedPayment.userName || selectedPayment.userId}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Société</span>
                  <span className="text-sm text-gray-900 dark:text-white">
                    {selectedPayment.companyName || selectedPayment.companyId}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Montant total</span>
                  <span className="text-sm text-gray-900 dark:text-white">{selectedPayment.amount.toLocaleString()} {selectedPayment.currency}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Méthode</span>
                  <span className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                    {getPaymentMethodIcon(selectedPayment.method)}
                    {PAYMENT_METHOD_LABELS[selectedPayment.method]}
                  </span>
                </div>
                
                {selectedPayment.platformFee != null && (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Commission plateforme</span>
                    <span className="text-sm text-gray-900 dark:text-white">{selectedPayment.platformFee.toLocaleString()} FCFA</span>
                  </div>
                )}
                {selectedPayment.companyAmount != null && (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Montant société</span>
                    <span className="text-sm text-gray-900 dark:text-white">{selectedPayment.companyAmount.toLocaleString()} FCFA</span>
                  </div>
                )}

                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Statut</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium w-fit ${getStatusBadgeClasses(selectedPayment.status)}`}>
                    {STATUS_LABELS.payment[selectedPayment.status]}
                  </span>
                </div>
                
                {selectedPayment.paymentGateway && (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Passerelle</span>
                    <span className="text-sm text-gray-900 dark:text-white">{selectedPayment.paymentGateway}</span>
                  </div>
                )}
                {selectedPayment.transactionId && (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Référence transaction</span>
                    <span className="text-sm text-gray-900 dark:text-white font-mono">{selectedPayment.transactionId}</span>
                  </div>
                )}
                <div className="flex flex-col">
                  <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Créé le</span>
                  <span className="text-sm text-gray-900 dark:text-white">{new Date(selectedPayment.createdAt).toLocaleString('fr-FR')}</span>
                </div>
                {selectedPayment.processedAt && (
                  <div className="flex flex-col">
                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Traité le</span>
                    <span className="text-sm text-gray-900 dark:text-white">{new Date(selectedPayment.processedAt).toLocaleString('fr-FR')}</span>
                  </div>
                )}
                {selectedPayment.refundedAt && (
                  <div className="flex flex-col col-span-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Remboursé le</span>
                    <span className="text-sm text-gray-900 dark:text-white">{new Date(selectedPayment.refundedAt).toLocaleString('fr-FR')}</span>
                  </div>
                )}
                {selectedPayment.refundReason && (
                  <div className="flex flex-col col-span-2">
                    <span className="text-xs text-gray-500 dark:text-gray-400 mb-1">Motif du remboursement</span>
                    <span className="text-sm text-gray-900 dark:text-white">{selectedPayment.refundReason}</span>
                  </div>
                )}
              </div>

              {/* Actions dans la modale */}
              <div className="flex justify-end gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                {selectedPayment.status === 'failed' && (
                  <button
                    onClick={() => handleRetry(selectedPayment)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-yellow-500 hover:bg-yellow-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCw className="h-4 w-4" />}
                    Relancer le paiement
                  </button>
                )}
                {selectedPayment.status === 'completed' && (
                  <button
                    onClick={() => setShowRefundModal(true)}
                    disabled={actionLoading}
                    className="px-4 py-2 bg-indigo-500 hover:bg-indigo-600 text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Rembourser
                  </button>
                )}
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                >
                  Fermer
                </button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* ==================== MODALE REMBOURSEMENT ==================== */}
      <Dialog open={showRefundModal} onOpenChange={setShowRefundModal}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rembourser le paiement</DialogTitle>
            <DialogDescription>
              Cette action remboursera {selectedPayment?.amount.toLocaleString()} {selectedPayment?.currency} au client.
              Cette opération est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-2">
            {selectedPayment && (
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Paiement:</span>
                    <span className="ml-2 text-gray-900 dark:text-white font-mono">{selectedPayment.id.slice(0, 12)}...</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Montant:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{selectedPayment.amount.toLocaleString()} {selectedPayment.currency}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Client:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{selectedPayment.userName || selectedPayment.userId}</span>
                  </div>
                  <div>
                    <span className="text-gray-500 dark:text-gray-400">Méthode:</span>
                    <span className="ml-2 text-gray-900 dark:text-white">{PAYMENT_METHOD_LABELS[selectedPayment.method]}</span>
                  </div>
                </div>
              </div>
            )}

            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                Motif du remboursement *
              </label>
              <textarea
                value={refundReason}
                onChange={(e) => setRefundReason(e.target.value)}
                placeholder="Indiquez la raison du remboursement..."
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dc2626] bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => {
                  setShowRefundModal(false);
                  setRefundReason('');
                }}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              >
                Annuler
              </button>
              <button
                onClick={handleRefund}
                disabled={!refundReason.trim() || actionLoading}
                className="px-4 py-2 bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-lg transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {actionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RotateCcw className="h-4 w-4" />}
                Confirmer le remboursement
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default PaymentManagement;