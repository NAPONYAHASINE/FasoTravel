import { useState } from 'react';
import { AlertTriangle, Clock, CheckCircle, XCircle, AlertCircle, Filter, Search } from "lucide-react@0.487.0";
import { Card } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Badge } from '../../components/ui/badge';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/back-button';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '../../components/ui/dialog';
import { Textarea } from '../../components/ui/textarea';
import { formatDateTime } from '../../utils/dateUtils';
import { getIncidentTypeInfo, getIncidentSeverityInfo, getIncidentValidationInfo } from '../../utils/labels';

export default function IncidentsPage() {
  const { incidents, trips, updateIncident } = useData();
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<string | null>(null);
  const [validationDialogOpen, setValidationDialogOpen] = useState(false);
  const [selectedIncident, setSelectedIncident] = useState<typeof incidents[0] | null>(null);
  const [validationComment, setValidationComment] = useState('');

  // Enrichir les incidents avec les données du voyage
  const enrichedIncidents = incidents.map(incident => {
    const trip = trips.find(t => t.id === incident.tripId);
    return {
      ...incident,
      route: trip ? `${trip.departure} - ${trip.arrival}` : 'N/A',
      departureTime: trip?.departureTime || '',
      busNumber: trip?.busNumber || 'N/A'
    };
  });

  const filteredIncidents = enrichedIncidents.filter(incident => {
    const matchesSearch = 
      incident.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      incident.route.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesType = filterType ? incident.type === filterType : true;
    const matchesStatus = filterStatus ? incident.validationStatus === filterStatus : true;
    
    return matchesSearch && matchesType && matchesStatus;
  });

  const handleValidateClick = (incident: typeof enrichedIncidents[0]) => {
    setSelectedIncident(incident);
    setValidationDialogOpen(true);
    setValidationComment('');
  };

  const handleValidate = (action: 'validated' | 'rejected') => {
    if (!selectedIncident || !user) return;

    updateIncident(selectedIncident.id, {
      validationStatus: action,
      validatedBy: user.id,
      validatedByName: user.name,
      validatedAt: new Date().toISOString(),
      validationComment: validationComment.trim() || undefined,
      status: action === 'validated' ? 'in_progress' : 'closed'
    });

    setValidationDialogOpen(false);
    setSelectedIncident(null);
    setValidationComment('');
  };

  const stats = {
    total: incidents.length,
    pending: incidents.filter(i => i.validationStatus === 'pending').length,
    validated: incidents.filter(i => i.validationStatus === 'validated').length,
    rejected: incidents.filter(i => i.validationStatus === 'rejected').length
  };

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      {/* En-tête */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          Incidents Signalés
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Consultez et validez les incidents signalés par les passagers
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
            </div>
            <AlertTriangle className="text-gray-400" size={32} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">En attente</p>
              <p className="text-2xl font-bold text-orange-600">{stats.pending}</p>
            </div>
            <Clock className="text-orange-400" size={32} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Validés</p>
              <p className="text-2xl font-bold text-green-600">{stats.validated}</p>
            </div>
            <CheckCircle className="text-green-400" size={32} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Rejetés</p>
              <p className="text-2xl font-bold text-red-600">{stats.rejected}</p>
            </div>
            <XCircle className="text-red-400" size={32} />
          </div>
        </Card>
      </div>

      {/* Filtres */}
      <div className="flex flex-col gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 dark:text-gray-400" size={20} />
          <Input
            placeholder="Rechercher un incident..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <div className="flex flex-wrap gap-2">
          <div className="flex gap-2">
            <Button
              variant={filterStatus === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus(null)}
              className={filterStatus === null ? 'tf-btn-primary' : ''}
            >
              Tous les statuts
            </Button>
            <Button
              variant={filterStatus === 'pending' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('pending')}
              className={filterStatus === 'pending' ? 'tf-btn-primary' : ''}
            >
              En attente
            </Button>
            <Button
              variant={filterStatus === 'validated' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('validated')}
              className={filterStatus === 'validated' ? 'tf-btn-primary' : ''}
            >
              Validés
            </Button>
            <Button
              variant={filterStatus === 'rejected' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterStatus('rejected')}
              className={filterStatus === 'rejected' ? 'tf-btn-primary' : ''}
            >
              Rejetés
            </Button>
          </div>

          <div className="flex gap-2">
            <Button
              variant={filterType === null ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType(null)}
              className={filterType === null ? 'tf-btn-primary' : ''}
            >
              Tous les types
            </Button>
            <Button
              variant={filterType === 'delay' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('delay')}
              className={filterType === 'delay' ? 'tf-btn-primary' : ''}
            >
              Retards
            </Button>
            <Button
              variant={filterType === 'breakdown' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('breakdown')}
              className={filterType === 'breakdown' ? 'tf-btn-primary' : ''}
            >
              Pannes
            </Button>
            <Button
              variant={filterType === 'accident' ? 'default' : 'outline'}
              size="sm"
              onClick={() => setFilterType('accident')}
              className={filterType === 'accident' ? 'tf-btn-primary' : ''}
            >
              Accidents
            </Button>
          </div>
        </div>
      </div>

      {/* Liste des incidents */}
      <div className="space-y-4">
        {filteredIncidents.map(incident => {
          const typeInfo = getIncidentTypeInfo(incident.type);
          const severityInfo = getIncidentSeverityInfo(incident.severity);
          const validationInfo = getIncidentValidationInfo(incident.validationStatus);
          const TypeIcon = typeInfo.icon;
          const ValidationIcon = validationInfo.icon;

          return (
            <Card key={incident.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div className={`p-2 rounded-lg ${typeInfo.color}`}>
                      <TypeIcon size={20} />
                    </div>
                    <div>
                      <h3 className="font-bold text-gray-900 dark:text-white">
                        {incident.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {incident.route} • Bus {incident.busNumber} • Départ: {formatDateTime(incident.departureTime)}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 mb-3">
                    <Badge className={typeInfo.color}>{typeInfo.label}</Badge>
                    <Badge className={severityInfo.color}>{severityInfo.label}</Badge>
                    <div className={`flex items-center gap-1 ${validationInfo.color}`}>
                      <ValidationIcon size={16} />
                      <span className="text-sm font-medium">{validationInfo.label}</span>
                    </div>
                  </div>

                  <p className="text-gray-700 dark:text-gray-300 mb-3">
                    {incident.description}
                  </p>

                  <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                    <span>Signalé par: {incident.reportedBy}</span>
                    <span>•</span>
                    <span>{formatDateTime(incident.reportedAt)}</span>
                    {incident.gareName && (
                      <>
                        <span>•</span>
                        <span>{incident.gareName}</span>
                      </>
                    )}
                  </div>

                  {/* Validation info */}
                  {incident.validationStatus !== 'pending' && incident.validatedByName && (
                    <div className="mt-3 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                        {incident.validationStatus === 'validated' ? '✅ Validé' : '❌ Rejeté'} par {incident.validatedByName}
                      </p>
                      {incident.validationComment && (
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {incident.validationComment}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {formatDateTime(incident.validatedAt!)}
                      </p>
                    </div>
                  )}
                </div>

                {/* Action buttons */}
                {incident.validationStatus === 'pending' && (
                  <div className="ml-4">
                    <Button
                      size="sm"
                      className="bg-purple-600 hover:bg-purple-700"
                      onClick={() => handleValidateClick(incident)}
                    >
                      Traiter
                    </Button>
                  </div>
                )}
              </div>
            </Card>
          );
        })}

        {filteredIncidents.length === 0 && (
          <Card className="p-12 text-center">
            <AlertTriangle size={48} className="mx-auto mb-4 text-gray-300 dark:text-gray-600" />
            <p className="text-gray-500 dark:text-gray-400">Aucun incident trouvé</p>
          </Card>
        )}
      </div>

      {/* Dialog de validation */}
      <Dialog open={validationDialogOpen} onOpenChange={setValidationDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Valider l'incident</DialogTitle>
            <DialogDescription>
              Confirmez-vous que cet incident est réel ? Cette action informera l'équipe admin FasoTravel.
            </DialogDescription>
          </DialogHeader>

          {selectedIncident && (
            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-1">
                  {selectedIncident.title}
                </h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  {selectedIncident.description}
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Commentaire (optionnel)
                </label>
                <Textarea
                  placeholder="Ajoutez des informations supplémentaires..."
                  value={validationComment}
                  onChange={(e) => setValidationComment(e.target.value)}
                  rows={3}
                />
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setValidationDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              variant="outline"
              className="bg-red-50 hover:bg-red-100 text-red-700 border-red-200"
              onClick={() => handleValidate('rejected')}
            >
              <XCircle size={16} className="mr-2" />
              Rejeter
            </Button>
            <Button
              className="bg-green-600 hover:bg-green-700"
              onClick={() => handleValidate('validated')}
            >
              <CheckCircle size={16} className="mr-2" />
              Valider
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}