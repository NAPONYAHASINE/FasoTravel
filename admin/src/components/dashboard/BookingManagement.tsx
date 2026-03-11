import { useState, useMemo } from 'react';
import { 
  Search, 
  Filter, 
  Download, 
  Eye, 
  Users, 
  BookOpen, 
  CheckCircle2, 
  XCircle, 
  Plane, 
  CalendarX,
  AlertCircle 
} from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '../ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { useAdminApp } from '../../context/AdminAppContext';
import { exportToCSV } from '../../lib/utils';
import { PAGE_CLASSES, COMPONENTS } from '../../lib/design-system';
import { toast } from 'sonner@2.0.3';
import { useBookings } from '../../hooks/useBookings';
import type { BookingStatus } from '../../shared/types/standardized';

/**
 * BookingManagement - Admin Version
 * Version 2.0 - Backend-ready avec ZÉRO données hardcodées
 * Vue globale de supervision des réservations de tous les passagers
 * Note: L'Admin supervise les réservations mais ne les gère pas directement
 */
export function BookingManagement() {
  const { passengers } = useAdminApp();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<BookingStatus | 'all'>('all');
  const [selectedBooking, setSelectedBooking] = useState<any>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  // 🔥 HOOK BACKEND-READY - Toute la logique métier externalisée
  const { bookings, stats, loading, error } = useBookings({ loadStats: true });

  const getStatusLabel = (status: BookingStatus) => {
    switch (status) {
      case 'EN_ATTENTE': return 'En attente';
      case 'CONFIRMÉ': return 'Confirmé';
      case 'TERMINÉ': return 'Terminé';
      case 'ANNULÉ': return 'Annulé';
    }
  };

  const formatCurrency = (amount: number) => {
    return `${amount.toLocaleString()} FCFA`;
  };

  const handleViewDetails = (booking: any) => {
    setSelectedBooking(booking);
    setShowDetailsModal(true);
  };

  const handleExport = () => {
    const exportData = filteredBookings.map(b => ({
      'ID': b.booking_id,
      'Passager': b.passenger_name,
      'Email': b.passenger_email,
      'Téléphone': b.passenger_phone,
      'Société': b.company_name,
      'Trajet': b.trip_route,
      'Places': b.num_passengers,
      'Sièges': b.selected_seats.join(', '),
      'Montant': `${b.total_amount} ${b.currency}`,
      'Statut': getStatusLabel(b.status),
      'Date': new Date(b.created_at).toLocaleString('fr-FR')
    }));
    exportToCSV(exportData, 'reservations');
    toast.success('Export terminé avec succès');
  };

  // Filtrage
  const filteredBookings = useMemo(() => {
    // ✅ Vérification de sécurité : bookings doit être un tableau
    if (!bookings || !Array.isArray(bookings)) {
      return [];
    }
    
    return bookings.filter(booking => {
      const searchLower = searchTerm?.toLowerCase() || '';
      const matchesSearch = 
        booking.booking_id?.toLowerCase().includes(searchLower) ||
        booking.passenger_name?.toLowerCase().includes(searchLower) ||
        booking.passenger_email?.toLowerCase().includes(searchLower) ||
        booking.trip_route?.toLowerCase().includes(searchLower) ||
        booking.company_name?.toLowerCase().includes(searchLower);
      
      const matchesStatus = statusFilter === 'all' || booking.status === statusFilter;
      
      return matchesSearch && matchesStatus;
    });
  }, [bookings, searchTerm, statusFilter]);

  const getStatusBadgeColor = (status: BookingStatus) => {
    switch (status) {
      case 'EN_ATTENTE': return 'bg-yellow-200 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-300 border border-yellow-400 dark:border-yellow-700';
      case 'CONFIRMÉ': return 'bg-green-200 dark:bg-green-900/30 text-green-900 dark:text-green-300 border border-green-400 dark:border-green-700';
      case 'TERMINÉ': return 'bg-gray-200 dark:bg-gray-900/30 text-gray-900 dark:text-gray-300 border border-gray-400 dark:border-gray-700';
      case 'ANNULÉ': return 'bg-red-200 dark:bg-red-900/30 text-red-900 dark:text-red-300 border border-red-400 dark:border-red-700';
    }
  };

  return (
    <>
      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Total Billets
              </CardTitle>
              <BookOpen className="h-5 w-5 text-gray-400" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {(stats.total ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Toutes réservations confondues
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                En attente
              </CardTitle>
              <CheckCircle2 className="h-5 w-5 text-yellow-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
                {(stats.enAttente ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                En attente de paiement
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Confirmés
              </CardTitle>
              <Plane className="h-5 w-5 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {(stats.confirmé ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Payées et confirmées
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Terminés
              </CardTitle>
              <XCircle className="h-5 w-5 text-gray-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600 dark:text-gray-400">
                {(stats.terminé ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Voyages terminés
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-400">
                Annulés
              </CardTitle>
              <XCircle className="h-5 w-5 text-red-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600 dark:text-red-400">
                {(stats.annulé ?? 0).toLocaleString()}
              </div>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {(stats.total ?? 0) > 0 ? (((stats.annulé ?? 0) / (stats.total ?? 1)) * 100).toFixed(1) : '0.0'}% du total
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Supervision des Réservations</CardTitle>
          <CardContent>Vue globale des réservations de tous les passagers de la plateforme</CardContent>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher par ID, nom, email, trajet, société..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className={COMPONENTS.input.replace('w-full', 'w-full pl-12')}
                />
              </div>
            </div>
            
            <div className="flex gap-2">
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value as any)}
                  className="pl-10 pr-8 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 dark:text-white appearance-none transition-colors"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="EN_ATTENTE">En attente</option>
                  <option value="CONFIRMÉ">Confirmé</option>
                  <option value="TERMINÉ">Terminé</option>
                  <option value="ANNULÉ">Annulé</option>
                </select>
              </div>

              <button className="flex items-center gap-2 px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors dark:text-white" onClick={handleExport}>
                <Download size={18} />
                Exporter
              </button>
            </div>
          </div>
        </CardContent>
        <CardContent>
          {/* Info Banner */}
          <div className="mb-6 bg-blue-200 dark:bg-blue-900/30 border-l-4 border-blue-600 dark:border-blue-500 p-4 rounded-lg">
            <div className="flex items-start gap-3">
              <AlertCircle className="text-blue-800 dark:text-blue-400 mt-0.5" size={20} />
              <div className="flex-1">
                <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                  Vue de supervision administrative
                </h4>
                <p className="text-xs text-blue-800 dark:text-blue-300 mb-3">
                  Cette section affiche toutes les réservations effectuées sur la plateforme FasoTravel. 
                  Les passagers gèrent leurs réservations via l'application mobile.
                </p>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="flex items-start gap-2">
                    <CheckCircle2 className="text-yellow-600 mt-0.5 flex-shrink-0" size={14} />
                    <div>
                      <span className="font-medium text-blue-900 dark:text-blue-200">En attente:</span>
                      <span className="text-blue-800 dark:text-blue-300"> Billet valide, date non passée</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <Plane className="text-green-600 mt-0.5 flex-shrink-0" size={14} />
                    <div>
                      <span className="font-medium text-blue-900 dark:text-blue-200">Confirmé:</span>
                      <span className="text-blue-800 dark:text-blue-300"> Passager dans le car</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="text-gray-600 mt-0.5 flex-shrink-0" size={14} />
                    <div>
                      <span className="font-medium text-blue-900 dark:text-blue-200">Terminé:</span>
                      <span className="text-blue-800 dark:text-blue-300"> Date de départ passée</span>
                    </div>
                  </div>
                  <div className="flex items-start gap-2">
                    <XCircle className="text-red-600 mt-0.5 flex-shrink-0" size={14} />
                    <div>
                      <span className="font-medium text-blue-900 dark:text-blue-200">Annulé:</span>
                      <span className="text-blue-800 dark:text-blue-300"> Billet annulé manuellement</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md overflow-hidden transition-colors border border-gray-200 dark:border-gray-700">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      ID Réservation
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Passager
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Société / Trajet
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Places
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Montant
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Statut
                    </th>
                    <th className="px-6 py-4 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-4 text-right text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {filteredBookings.length === 0 ? (
                    <tr>
                      <td colSpan={8} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        <BookOpen className="mx-auto mb-3 text-gray-400" size={48} />
                        <p className="text-lg mb-1">Aucune réservation trouvée</p>
                        <p className="text-sm">
                          {searchTerm || statusFilter !== 'all'
                            ? 'Essayez de modifier vos filtres'
                            : 'Aucune réservation enregistrée'}
                        </p>
                      </td>
                    </tr>
                  ) : (
                    filteredBookings.map((booking) => (
                      <tr key={booking.booking_id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                        <td className="px-6 py-4">
                          <div className="font-mono text-sm text-gray-900 dark:text-white font-medium">
                            {booking.booking_id}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white font-medium">
                            {booking.passenger_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {booking.passenger_email}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">
                            {booking.company_name}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {booking.trip_route}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-1 mb-1">
                            <Users className="text-gray-400" size={16} />
                            <span className="text-sm dark:text-gray-300 font-medium">{booking.num_passengers}</span>
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {booking.selected_seats.join(', ')}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white font-semibold">
                            {formatCurrency(booking.total_amount)}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(booking.status)}`}>
                            {getStatusLabel(booking.status)}
                          </span>
                        </td>
                        
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {new Date(booking.created_at).toLocaleDateString('fr-FR')}
                          </div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">
                            {new Date(booking.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                          </div>
                        </td>
                        
                        <td className="px-6 py-4 text-right">
                          <button className="p-2 text-gray-600 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors" onClick={() => handleViewDetails(booking)}>
                            <Eye size={18} />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {filteredBookings.length > 0 && (
              <div className="px-6 py-4 bg-gray-50 dark:bg-gray-700 border-t border-gray-200 dark:border-gray-600">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Affichage de <span className="font-semibold text-gray-900 dark:text-white">{filteredBookings.length}</span> sur <span className="font-semibold text-gray-900 dark:text-white">{bookings?.length ?? 0}</span> réservations
                  </div>
                  {stats && (
                    <div className="text-xs text-gray-500 dark:text-gray-400">
                      Taux de conversion: <span className="font-semibold text-green-600 dark:text-green-400">{stats.conversionRate ?? 0}%</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>

        {/* Details Modal */}
        {showDetailsModal && selectedBooking && (
          <Dialog open={showDetailsModal} onOpenChange={setShowDetailsModal}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Détails de la Réservation</DialogTitle>
                <DialogDescription>
                  Informations détaillées sur la réservation {selectedBooking.booking_id}
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 dark:text-gray-400">ID Réservation</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">{selectedBooking.booking_id}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Passager</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">{selectedBooking.passenger_name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Email</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">{selectedBooking.passenger_email}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Téléphone</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">{selectedBooking.passenger_phone}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Société</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">{selectedBooking.company_name}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Trajet</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">{selectedBooking.trip_route}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Places</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">{selectedBooking.num_passengers}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Sièges</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">{selectedBooking.selected_seats.join(', ')}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Montant</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">{formatCurrency(selectedBooking.total_amount)}</span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Statut</span>
                  <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusBadgeColor(selectedBooking.status)}`}>
                    {getStatusLabel(selectedBooking.status)}
                  </span>
                </div>
                <div className="flex flex-col">
                  <span className="text-sm text-gray-500 dark:text-gray-400">Date</span>
                  <span className="text-sm text-gray-900 dark:text-white font-medium">{new Date(selectedBooking.created_at).toLocaleString('fr-FR')}</span>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </Card>
    </>
  );
}

export default BookingManagement;