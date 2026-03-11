/**
 * @file PassengerManagement.tsx
 * @description Gestion des passagers (utilisateurs app mobile)
 * 
 * ADMIN supervise les PASSAGERS de l'app mobile
 * - Liste tous les utilisateurs
 * - Suspension/Réactivation
 * - Historique réservations
 * - Support
 */

import { useState } from 'react';
import {
  Users,
  Search,
  Filter,
  MoreVertical,
  CheckCircle,
  XCircle,
  Phone,
  Mail,
  Calendar,
  Shield,
  Ban,
  Play,
  Download,
  Edit,
  Key,
  Eye,
  Trash2,
} from 'lucide-react';
import { useAdminApp } from '../../context/AdminAppContext';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card';
import { PassengerUser } from '../../shared/types/standardized';
import { ConfirmWrapper } from '../modals/ConfirmWrapper';
import { EditPassengerModal } from '../modals/EditPassengerModal';
import { ResetPasswordModal } from '../modals/ResetPasswordModal';
import { PassengerDetailsModal } from '../modals/PassengerDetailsModal';
import { exportToCSV } from '../../lib/exportUtils';
import { StatCard } from '../ui/stat-card';
import { PAGE_CLASSES } from '../../lib/design-system';
import { toast } from 'sonner@2.0.3';

export function PassengerManagement() {
  const { 
    passengers, 
    suspendPassenger, 
    reactivatePassenger,
    updatePassenger,
    resetPassengerPassword,
    deletePassenger,
  } = useAdminApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'suspended'>('all');
  const [confirmDialog, setConfirmDialog] = useState<{
    show: boolean;
    action: 'suspend' | 'reactivate' | 'delete';
    passengerId: string;
    reason?: string;
  }>({ show: false, action: 'suspend', passengerId: '', reason: '' });
  const [loading, setLoading] = useState(false);
  const [editPassenger, setEditPassenger] = useState<PassengerUser | null>(null);
  const [resetPasswordPassenger, setResetPasswordPassenger] = useState<PassengerUser | null>(null);
  const [viewPassenger, setViewPassenger] = useState<PassengerUser | null>(null);

  const handleConfirmAction = async () => {
    try {
      setLoading(true);
      if (confirmDialog.action === 'suspend') {
        await suspendPassenger(confirmDialog.passengerId, confirmDialog.reason || 'Non spécifiée');
      } else if (confirmDialog.action === 'reactivate') {
        await reactivatePassenger(confirmDialog.passengerId);
      } else if (confirmDialog.action === 'delete') {
        await deletePassenger(confirmDialog.passengerId);
        toast.success('Passager supprimé avec succès');
      }
      setConfirmDialog({ show: false, action: 'suspend', passengerId: '', reason: '' });
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
      toast.error('Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    const exportData = filteredPassengers.map(p => ({
      Nom: p.name,
      Email: p.email,
      Téléphone: p.phone,
      Statut: p.status,
      'Email vérifié': p.emailVerified ? 'Oui' : 'Non',
      'Tél vérifié': p.phoneVerified ? 'Oui' : 'Non',
      Réservations: p.totalBookings,
      Inscription: new Date(p.createdAt).toLocaleDateString('fr-FR')
    }));
    exportToCSV(exportData, 'passagers');
  };

  // Filter passengers
  const filteredPassengers = passengers.filter(passenger => {
    const matchesSearch = 
      passenger.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      passenger.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      passenger.phone.includes(searchQuery);
    const matchesStatus = statusFilter === 'all' || passenger.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const stats = {
    total: passengers.length,
    active: passengers.filter(p => p.status === 'active').length,
    verified: passengers.filter(p => p.phoneVerified && p.emailVerified).length,
    suspended: passengers.filter(p => p.status === 'suspended').length
  };

  const getStatusBadge = (passenger: PassengerUser) => {
    if (passenger.status === 'suspended') {
      return <Badge className="bg-red-500">Suspendu</Badge>;
    }
    if (passenger.status === 'active') {
      return <Badge className="bg-green-500">Actif</Badge>;
    }
    return <Badge>{passenger.status}</Badge>;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className={PAGE_CLASSES.container}>
      {/* Header */}
      <div className={PAGE_CLASSES.header}>
        <div className={PAGE_CLASSES.headerContent}>
          <div className={PAGE_CLASSES.headerTexts}>
            <h1 className="text-3xl text-gray-900 dark:text-white mb-2">Gestion des Passagers</h1>
            <p className="text-gray-600 dark:text-gray-400">Utilisateurs de l'application mobile FasoTravel</p>
          </div>
          <div className={PAGE_CLASSES.headerActions}>
            <button onClick={handleExport} className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center gap-2">
              <Download className="w-4 h-4" />
              Exporter
            </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={PAGE_CLASSES.statsGrid}>
        <StatCard title="Total Passagers" value={stats.total} icon={Users} color="red" />
        <StatCard title="Actifs" value={stats.active} icon={CheckCircle} color="green" />
        <StatCard title="Vérifiés" value={stats.verified} icon={Shield} color="blue" />
        <StatCard title="Suspendus" value={stats.suspended} icon={Ban} color="red" />
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Rechercher par nom, email ou téléphone..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400"
              />
            </div>

            {/* Status Filter */}
            <div className="flex gap-2">
              {(['all', 'active', 'suspended'] as const).map((status) => (
                <Button
                  key={status}
                  variant={statusFilter === status ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(status)}
                  className={statusFilter === status ? 'bg-red-600 hover:bg-red-700' : ''}
                >
                  {status === 'all' ? 'Tous' : 
                   status === 'active' ? 'Actifs' : 'Suspendus'}
                </Button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Passengers Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Passager
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Contact
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Vérification
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Statut
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Inscription
                  </th>
                  <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Dernière Connexion
                  </th>
                  <th className="px-6 py-3 text-right text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                {filteredPassengers.map((passenger) => (
                  <tr key={passenger.id} className="hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                    {/* Passenger Info */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        {/* Avatar */}
                        <div className="w-10 h-10 bg-gradient-to-br from-red-400 to-yellow-400 rounded-full flex items-center justify-center">
                          <span className="text-white text-sm">
                            {passenger.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                          </span>
                        </div>
                        <div>
                          <div className="text-sm text-gray-900 dark:text-white">{passenger.name}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">ID: {passenger.id}</div>
                        </div>
                      </div>
                    </td>

                    {/* Contact */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Mail className="w-3 h-3" />
                          <span className="truncate max-w-[200px]">{passenger.email}</span>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                          <Phone className="w-3 h-3" />
                          <span>{passenger.phone}</span>
                        </div>
                      </div>
                    </td>

                    {/* Verification */}
                    <td className="px-6 py-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          {passenger.phoneVerified ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
                          <span className="text-xs text-gray-600 dark:text-gray-400">Téléphone</span>
                        </div>
                        <div className="flex items-center gap-2">
                          {passenger.emailVerified ? (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          ) : (
                            <XCircle className="w-4 h-4 text-gray-300" />
                          )}
                          <span className="text-xs text-gray-600 dark:text-gray-400">Email</span>
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-6 py-4">
                      {getStatusBadge(passenger)}
                    </td>

                    {/* Created At */}
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                        <Calendar className="w-4 h-4" />
                        <span>{formatDate(passenger.createdAt)}</span>
                      </div>
                    </td>

                    {/* Last Login */}
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-300">
                        {passenger.lastLoginAt ? formatDate(passenger.lastLoginAt) : 'Jamais'}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {passenger.status === 'active' ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmDialog({ show: true, action: 'suspend', passengerId: passenger.id })}
                            className="border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Ban className="w-3 h-3 mr-1" />
                            Suspendre
                          </Button>
                        ) : (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setConfirmDialog({ show: true, action: 'reactivate', passengerId: passenger.id })}
                            className="border-green-600 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20"
                          >
                            <Play className="w-3 h-3 mr-1" />
                            Réactiver
                          </Button>
                        )}
                        <button
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          onClick={() => setViewPassenger(passenger)}
                        >
                          <Eye className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" />
                        </button>
                        <button
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          onClick={() => setEditPassenger(passenger)}
                        >
                          <Edit className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" />
                        </button>
                        <button
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          onClick={() => setResetPasswordPassenger(passenger)}
                        >
                          <Key className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" />
                        </button>
                        <button
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          onClick={() => setConfirmDialog({ show: true, action: 'delete', passengerId: passenger.id })}
                        >
                          <Trash2 className="w-4 h-4 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Empty State */}
      {filteredPassengers.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg text-gray-900 dark:text-white mb-2">Aucun passager trouvé</h3>
              <p className="text-gray-600 dark:text-gray-400">Essayez de modifier vos filtres de recherche</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Confirm Dialog */}
      <ConfirmWrapper
        isOpen={confirmDialog.show}
        onClose={() => setConfirmDialog({ show: false, action: 'suspend', passengerId: '', reason: '' })}
        onConfirm={handleConfirmAction}
        title={
          confirmDialog.action === 'suspend' ? 'Suspendre le passager' : 
          confirmDialog.action === 'reactivate' ? 'Réactiver le passager' : 
          'Supprimer le passager'
        }
        message={
          confirmDialog.action === 'suspend' ? 'Êtes-vous sûr de vouloir suspendre ce passager ? Il ne pourra plus utiliser l\'application.' : 
          confirmDialog.action === 'reactivate' ? 'Êtes-vous sûr de vouloir réactiver ce passager ?' : 
          'Êtes-vous sûr de vouloir supprimer définitivement ce passager ? Cette action est irréversible.'
        }
        type={confirmDialog.action === 'delete' ? 'danger' : confirmDialog.action === 'suspend' ? 'danger' : 'success'}
        loading={loading}
      />

      {/* Edit Passenger Modal */}
      <EditPassengerModal
        isOpen={editPassenger !== null}
        onClose={() => setEditPassenger(null)}
        passenger={editPassenger}
        onSave={async (id, updates) => {
          try {
            await updatePassenger(id, updates);
            toast.success('Passager modifié avec succès');
            setEditPassenger(null);
          } catch (error: any) {
            toast.error(error.message || 'Erreur lors de la modification');
          }
        }}
      />

      {/* Reset Password Modal */}
      <ResetPasswordModal
        isOpen={resetPasswordPassenger !== null}
        onClose={() => setResetPasswordPassenger(null)}
        passenger={resetPasswordPassenger}
        onReset={async (id) => {
          const tempPassword = await resetPassengerPassword(id);
          toast.success('Mot de passe réinitialisé avec succès');
          return tempPassword;
        }}
      />

      {/* Passenger Details Modal */}
      <PassengerDetailsModal
        isOpen={viewPassenger !== null}
        onClose={() => setViewPassenger(null)}
        passenger={viewPassenger}
      />
    </div>
  );
}

export default PassengerManagement;