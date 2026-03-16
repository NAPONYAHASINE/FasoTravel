/**
 * @file TransportCompanyManagement.tsx
 * @description Gestion des sociétés de transport (Admin)
 * 
 * ADMIN gère les SOCIÉTÉS de transport (pas les opérateurs individuels)
 * - Création de nouvelles sociétés
 * - Suspension/réactivation
 * - Modification commission plateforme
 * - Vue performance globale
 */

import { useState } from 'react';
import { 
  Building2, 
  Plus, 
  Search, 
  MoreVertical, 
  CheckCircle, 
  XCircle, 
  Pause, 
  Play,
  Mail,
  Phone,
  MapPin,
  Star,
  Edit,
  Trash2,
  History,
  Eye,
  Coffee,
  Wifi,
  Armchair,
  Plug,
  Snowflake,
  Tv,
  ShieldCheck
} from 'lucide-react';
import { useAdminApp } from '../../context/AdminAppContext';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import { CreateCompanyModal } from '../modals/CreateCompanyModal';
import { EditCompanyModal } from '../modals/EditCompanyModal';
import { CompanyHistoryModal } from '../modals/CompanyHistoryModal';
import { ConfirmWrapper } from '../modals/ConfirmWrapper';
import { TransportCompany } from '../../shared/types/standardized';
import { StatCard } from '../ui/stat-card';
import { PAGE_CLASSES } from '../../lib/design-system';

export function TransportCompanyManagement() {
  const { transportCompanies, approveCompany, suspendCompany, createCompany, updateCompany, deleteCompany, refreshCompanies: _refreshCompanies } = useAdminApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'suspended'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [confirmDialog, setConfirmDialog] = useState<{show: boolean, action: string, companyId: string, reason?: string}>(
    { show: false, action: '', companyId: '', reason: '' }
  );
  const [loading, setLoading] = useState(false);
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<TransportCompany | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);

  const handleCreateCompany = async (data: any) => {
    try {
      setLoading(true);
      await createCompany(data);
      setShowCreateModal(false);
    } catch (error) {
      console.error('Erreur lors de la création de la société:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditCompany = async (data: any) => {
    try {
      setLoading(true);
      if (selectedCompany) {
        await updateCompany(selectedCompany.id, data);
      }
      setShowEditModal(false);
      setSelectedCompany(null);
    } catch (error) {
      console.error('Erreur lors de la modification de la société:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmAction = async () => {
    try {
      setLoading(true);
      if (confirmDialog.action === 'suspend') {
        await suspendCompany(confirmDialog.companyId, confirmDialog.reason || 'Non spécifiée');
      } else if (confirmDialog.action === 'reactivate') {
        await approveCompany(confirmDialog.companyId);
      } else if (confirmDialog.action === 'delete') {
        await deleteCompany(confirmDialog.companyId);
      }
      setConfirmDialog({show: false, action: '', companyId: '', reason: ''});
    } catch (error) {
      console.error('Erreur lors de l\'action:', error);
    } finally {
      setLoading(false);
    }
  };

  // Filter companies
  const filteredCompanies = transportCompanies.filter(company => {
    const matchesSearch = company.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         company.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || company.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedCompanies = [...filteredCompanies];

  const stats = {
    total: transportCompanies.length,
    active: transportCompanies.filter(c => c.status === 'active').length,
    suspended: transportCompanies.filter(c => c.status === 'suspended').length
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-500">Actif</Badge>;
      case 'suspended':
        return <Badge className="bg-red-500">Suspendu</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  const AMENITY_OPTIONS = [
    { value: 'wifi', label: 'Wi-Fi', icon: Wifi },
    { value: 'coffee', label: 'Café', icon: Coffee },
    { value: 'ac', label: 'Climatisation', icon: Snowflake },
    { value: 'usb', label: 'Prises USB', icon: Plug },
    { value: 'toilet', label: 'Toilettes', icon: Armchair },
    { value: 'tv', label: 'Télévision', icon: Tv },
    { value: 'luggage', label: 'Bagages inclus', icon: ShieldCheck }
  ];

  return (
    <div className={PAGE_CLASSES.container}>
      {/* Header */}
      <div className={PAGE_CLASSES.header}>
        <div className={PAGE_CLASSES.headerContent}>
          <div className={PAGE_CLASSES.headerTexts}>
            <h1 className="text-3xl text-gray-900 dark:text-white mb-2">Sociétés de Transport</h1>
            <p className="text-gray-600 dark:text-gray-400">Gestion des opérateurs de la plateforme</p>
          </div>
          <div className={PAGE_CLASSES.headerActions}>
            <Button className="bg-red-600 hover:bg-red-700" onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle Société
            </Button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard title="Total Sociétés" value={stats.total} icon={Building2} color="red" />
        <StatCard title="Actives" value={stats.active} icon={CheckCircle} color="green" />
        <StatCard title="Suspendues" value={stats.suspended} icon={Pause} color="red" subtitle="Nécessitent attention" />
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
                placeholder="Rechercher une société..."
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

      {/* Companies List */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {sortedCompanies.map((company) => (
            <Card key={company.id} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-4">
                    {/* Logo */}
                    <div className="w-16 h-16 bg-gradient-to-br from-red-100 to-yellow-100 dark:from-red-900/30 dark:to-yellow-900/30 rounded-lg flex items-center justify-center">
                      {company.logo ? (
                        <img src={company.logo} alt={company.name} className="w-12 h-12 object-contain" />
                      ) : (
                        <Building2 className="w-8 h-8 text-red-600" />
                      )}
                    </div>

                    {/* Info */}
                    <div>
                      <h3 className="text-lg text-gray-900 dark:text-white mb-1">{company.name}</h3>
                      {getStatusBadge(company.status)}
                    </div>
                  </div>

                  {/* Actions Menu */}
                  <div className={`relative ${openMenuId === company.id ? 'z-50' : ''}`}>
                    <button 
                      onClick={() => setOpenMenuId(openMenuId === company.id ? null : company.id)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                      title="Actions"
                    >
                      <MoreVertical className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {openMenuId === company.id && (
                      <>
                        <div 
                          className="fixed inset-0 z-10" 
                          onClick={() => setOpenMenuId(null)}
                        />
                        <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20">
                          <button
                            onClick={() => {
                              setSelectedCompany(company);
                              setShowDetailsModal(true);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2 rounded-t-lg"
                          >
                            <Eye className="w-4 h-4" />
                            Voir détails
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCompany(company);
                              setShowEditModal(true);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <Edit className="w-4 h-4" />
                            Modifier
                          </button>
                          <button
                            onClick={() => {
                              setSelectedCompany(company);
                              setShowHistoryModal(true);
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2"
                          >
                            <History className="w-4 h-4" />
                            Historique
                          </button>
                          <div className="border-t border-gray-200 dark:border-gray-700" />
                          <button
                            onClick={() => {
                              setConfirmDialog({show: true, action: 'delete', companyId: company.id});
                              setOpenMenuId(null);
                            }}
                            className="w-full px-4 py-2 text-left text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2 rounded-b-lg"
                          >
                            <Trash2 className="w-4 h-4" />
                            Supprimer
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                </div>

                {/* Stats Grid */}
                <div className="grid grid-cols-3 gap-4 mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Véhicules</div>
                    <div className="text-xl text-gray-900 dark:text-white">{company.totalVehicles || 0}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Routes</div>
                    <div className="text-xl text-gray-900 dark:text-white">{company.totalRoutes || 0}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Trajets</div>
                    <div className="text-xl text-gray-900 dark:text-white">{company.totalTrips || 0}</div>
                  </div>
                </div>

                {/* Amenities / Services supplémentaires */}
                {company.amenities && company.amenities.length > 0 && (
                  <div className="mb-4 pb-4 border-b border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">Services proposés</div>
                    <div className="flex flex-wrap gap-2">
                      {company.amenities.map((amenity) => {
                        const amenityConfig = AMENITY_OPTIONS.find(a => a.value === amenity);
                        const Icon = amenityConfig?.icon || ShieldCheck;
                        return (
                          <span
                            key={amenity}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full text-xs"
                          >
                            <Icon className="w-3 h-3" />
                            {amenityConfig?.label || amenity}
                          </span>
                        );
                      })}
                    </div>
                  </div>
                )}

                {/* Contact Info */}
                <div className="space-y-2 mb-4">
                  {company.legalName && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">Nom légal:</span> {company.legalName}
                    </div>
                  )}
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Mail className="w-4 h-4" />
                    <span>{company.email}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <Phone className="w-4 h-4" />
                    <span>{company.phone}</span>
                  </div>
                  {company.address && (
                    <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                      <MapPin className="w-4 h-4" />
                      <span>{company.address}</span>
                    </div>
                  )}
                  {company.registrationNumber && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">N° Enregistrement:</span> {company.registrationNumber}
                    </div>
                  )}
                  {company.taxId && (
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      <span className="font-medium">IFU:</span> {company.taxId}
                    </div>
                  )}
                  {company.contactPersonName && (
                    <div className="text-sm text-gray-600 dark:text-gray-400 mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                      <div className="font-medium mb-1">Personne de contact:</div>
                      <div className="pl-2 space-y-1">
                        <div>{company.contactPersonName}</div>
                        {company.contactPersonPhone && <div>{company.contactPersonPhone}</div>}
                        {company.contactPersonEmail && <div>{company.contactPersonEmail}</div>}
                      </div>
                    </div>
                  )}
                </div>

                {/* Rating & Commission */}
                <div className="flex items-center justify-between mb-4">
                  {company.rating && (
                    <div className="flex items-center gap-1">
                      <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                      <span className="text-sm text-gray-900 dark:text-white">{company.rating.toFixed(1)}</span>
                    </div>
                  )}
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Commission: <span className="text-gray-900 dark:text-white">{company.commission}%</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                  {company.status === 'active' && (
                    <Button
                      onClick={() => setConfirmDialog({show: true, action: 'suspend', companyId: company.id})}
                      variant="outline"
                      className="flex-1 border-red-600 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20"
                    >
                      <Pause className="w-4 h-4 mr-2" />
                      Suspendre
                    </Button>
                  )}

                  {company.status === 'suspended' && (
                    <Button
                      onClick={async () => {
                        try {
                          setLoading(true);
                          await approveCompany(company.id);
                        } catch (error) {
                          console.error('Erreur lors de la réactivation:', error);
                        } finally {
                          setLoading(false);
                        }
                      }}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      disabled={loading}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      Réactiver
                    </Button>
                  )}

                  <Button variant="outline" className="flex-1" onClick={() => {
                    setSelectedCompany(company);
                    setShowDetailsModal(true);
                  }}>
                    <Eye className="w-4 h-4 mr-2" />
                    Voir Détails
                  </Button>
                </div>
              </CardContent>
            </Card>
        ))}
      </div>

      {/* Empty State */}
      {filteredCompanies.length === 0 && (
        <Card>
          <CardContent className="py-12">
            <div className="text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg text-gray-900 dark:text-white mb-2">Aucune société trouvée</h3>
              <p className="text-gray-600 dark:text-gray-400">Essayez de modifier vos filtres de recherche</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Create Company Modal */}
      <CreateCompanyModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSubmit={handleCreateCompany}
        loading={loading}
      />

      {/* Edit Company Modal */}
      {selectedCompany && (
        <EditCompanyModal
          isOpen={showEditModal}
          onClose={() => {
            setShowEditModal(false);
            setSelectedCompany(null);
          }}
          onSubmit={handleEditCompany}
          loading={loading}
          company={selectedCompany}
        />
      )}

      {/* Company History Modal */}
      {selectedCompany && (
        <CompanyHistoryModal
          isOpen={showHistoryModal}
          onClose={() => {
            setShowHistoryModal(false);
            setSelectedCompany(null);
          }}
          company={selectedCompany}
        />
      )}

      {/* Confirm Dialog */}
      <ConfirmWrapper
        isOpen={confirmDialog.show}
        onClose={() => setConfirmDialog({show: false, action: '', companyId: '', reason: ''})}
        onConfirm={handleConfirmAction}
        title={
          confirmDialog.action === 'delete'
            ? 'Supprimer la société'
            : confirmDialog.action === 'reactivate'
            ? 'Réactiver la société'
            : 'Suspendre la société'
        }
        message={
          confirmDialog.action === 'delete'
            ? 'Êtes-vous sûr de vouloir supprimer définitivement cette société ? Cette action est irréversible.'
            : confirmDialog.action === 'reactivate'
            ? 'Êtes-vous sûr de vouloir réactiver cette société ?'
            : 'Êtes-vous sûr de vouloir suspendre cette société ?'
        }
        type={confirmDialog.action === 'reactivate' ? 'success' : 'danger'}
        loading={loading}
      />

      {/* Details Modal (Simple for now) */}
      {showDetailsModal && selectedCompany && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div 
              className="p-6 text-white sticky top-0 z-10"
              style={{ background: 'linear-gradient(to right, #dc2626, #f59e0b, #16a34a)' }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Building2 size={24} />
                  <h2 className="text-2xl">{selectedCompany.name}</h2>
                </div>
                <button
                  onClick={() => setShowDetailsModal(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  title="Fermer"
                >
                  <XCircle size={20} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-6 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations générales</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Nom commercial:</span>
                      <p className="text-gray-900 dark:text-white">{selectedCompany.name}</p>
                    </div>
                    {selectedCompany.legalName && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Nom juridique:</span>
                        <p className="text-gray-900 dark:text-white">{selectedCompany.legalName}</p>
                      </div>
                    )}
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Statut:</span>
                      <div className="mt-1">{getStatusBadge(selectedCompany.status)}</div>
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Contact</h3>
                  <div className="space-y-3">
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                      <p className="text-gray-900 dark:text-white">{selectedCompany.email}</p>
                    </div>
                    <div>
                      <span className="text-sm text-gray-600 dark:text-gray-400">Téléphone:</span>
                      <p className="text-gray-900 dark:text-white">{selectedCompany.phone}</p>
                    </div>
                    {selectedCompany.address && (
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Adresse:</span>
                        <p className="text-gray-900 dark:text-white">{selectedCompany.address}</p>
                      </div>
                    )}
                  </div>
                </div>

                {selectedCompany.registrationNumber && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Informations légales</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">N° Enregistrement:</span>
                        <p className="text-gray-900 dark:text-white">{selectedCompany.registrationNumber}</p>
                      </div>
                      {selectedCompany.taxId && (
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">IFU:</span>
                          <p className="text-gray-900 dark:text-white">{selectedCompany.taxId}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedCompany.contactPersonName && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personne de contact</h3>
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">Nom:</span>
                        <p className="text-gray-900 dark:text-white">{selectedCompany.contactPersonName}</p>
                      </div>
                      {selectedCompany.contactPersonPhone && (
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Téléphone:</span>
                          <p className="text-gray-900 dark:text-white">{selectedCompany.contactPersonPhone}</p>
                        </div>
                      )}
                      {selectedCompany.contactPersonEmail && (
                        <div>
                          <span className="text-sm text-gray-600 dark:text-gray-400">Email:</span>
                          <p className="text-gray-900 dark:text-white">{selectedCompany.contactPersonEmail}</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Services proposés */}
              {selectedCompany.amenities && selectedCompany.amenities.length > 0 && (
                <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Services proposés</h3>
                  <div className="flex flex-wrap gap-3">
                    {selectedCompany.amenities.map((amenity) => {
                      const amenityConfig = AMENITY_OPTIONS.find(a => a.value === amenity);
                      const Icon = amenityConfig?.icon || ShieldCheck;
                      return (
                        <span
                          key={amenity}
                          className="inline-flex items-center gap-2 px-4 py-2 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-lg text-sm"
                        >
                          <Icon className="w-4 h-4" />
                          {amenityConfig?.label || amenity}
                        </span>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Statistiques</h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">{selectedCompany.totalVehicles || 0}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Véhicules</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">{selectedCompany.totalRoutes || 0}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Routes</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">{selectedCompany.totalTrips || 0}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Trajets</div>
                  </div>
                  <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-lg text-center">
                    <div className="text-2xl font-semibold text-gray-900 dark:text-white">{selectedCompany.commission}%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">Commission</div>
                  </div>
                </div>
              </div>

              <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  variant="outline"
                  onClick={() => setShowDetailsModal(false)}
                  className="flex-1"
                >
                  Fermer
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default TransportCompanyManagement;