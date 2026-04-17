import { useState, useEffect, useCallback } from 'react';
import { Package, Coffee, Wifi, Crown, Shield, Plus, Edit, Trash2 } from 'lucide-react';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/back-button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { FormDialog } from '../../components/forms/FormDialog';
import { useAuth } from '../../contexts/AuthContext';
import { operatorServiceService } from '../../services/api';
import type { OperatorServiceItem, CreateOperatorServiceDto, UpdateOperatorServiceDto } from '../../services/api/operatorService.service';
import { toast } from 'sonner';

const SERVICE_TYPE_OPTIONS = [
  { value: 'BAGGAGE', label: 'Bagages', icon: Package },
  { value: 'FOOD', label: 'Restauration', icon: Coffee },
  { value: 'COMFORT', label: 'Confort', icon: Wifi },
  { value: 'ENTERTAINMENT', label: 'Divertissement', icon: Crown },
  { value: 'OTHER', label: 'Autre', icon: Shield },
] as const;

const SERVICE_TYPE_MAP: Record<string, { label: string; icon: React.ElementType }> = {
  BAGGAGE: { label: 'Bagages', icon: Package },
  FOOD: { label: 'Restauration', icon: Coffee },
  COMFORT: { label: 'Confort', icon: Wifi },
  ENTERTAINMENT: { label: 'Divertissement', icon: Crown },
  OTHER: { label: 'Autre', icon: Shield },
};

export default function ServicesPage() {
  const { user } = useAuth();
  const operatorId = user?.societyId || '';

  const [services, setServices] = useState<OperatorServiceItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingService, setEditingService] = useState<OperatorServiceItem | null>(null);

  const [formData, setFormData] = useState({
    serviceName: '',
    serviceType: 'OTHER' as string,
    description: '',
    price: '',
    isActive: true,
  });

  const resetForm = () => {
    setFormData({
      serviceName: '',
      serviceType: 'OTHER',
      description: '',
      price: '',
      isActive: true,
    });
  };

  const loadServices = useCallback(async () => {
    if (!operatorId) return;
    setLoading(true);
    try {
      const data = await operatorServiceService.list(operatorId);
      setServices(data);
    } catch {
      toast.error('Erreur lors du chargement des services');
    }
    setLoading(false);
  }, [operatorId]);

  useEffect(() => { loadServices(); }, [loadServices]);

  const handleAdd = async () => {
    if (!formData.serviceName.trim()) {
      toast.error('Nom du service requis');
      return;
    }
    if (!formData.price || Number(formData.price) < 0) {
      toast.error('Prix invalide');
      return;
    }

    const dto: CreateOperatorServiceDto = {
      operatorId,
      serviceName: formData.serviceName.trim(),
      serviceType: formData.serviceType,
      description: formData.description.trim() || undefined,
      price: Number(formData.price),
      currency: 'XOF',
      isActive: formData.isActive,
    };

    try {
      await operatorServiceService.create(dto);
      toast.success('Service créé avec succès');
      setIsAddOpen(false);
      resetForm();
      loadServices();
    } catch {
      toast.error('Erreur lors de la création');
    }
  };

  const handleEdit = async () => {
    if (!editingService) return;
    if (!formData.serviceName.trim()) {
      toast.error('Nom du service requis');
      return;
    }

    const dto: UpdateOperatorServiceDto = {
      serviceName: formData.serviceName.trim(),
      serviceType: formData.serviceType,
      description: formData.description.trim() || undefined,
      price: Number(formData.price),
      isActive: formData.isActive,
    };

    try {
      await operatorServiceService.update(editingService.id, dto);
      toast.success('Service modifié');
      setIsEditOpen(false);
      setEditingService(null);
      resetForm();
      loadServices();
    } catch {
      toast.error('Erreur lors de la modification');
    }
  };

  const handleDelete = async (svc: OperatorServiceItem) => {
    if (!confirm(`Supprimer le service "${svc.serviceName}" ?`)) return;
    try {
      await operatorServiceService.delete(svc.id);
      toast.success('Service supprimé');
      loadServices();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  const openEdit = (svc: OperatorServiceItem) => {
    setEditingService(svc);
    setFormData({
      serviceName: svc.serviceName,
      serviceType: svc.serviceType,
      description: svc.description || '',
      price: String(svc.price),
      isActive: svc.isActive,
    });
    setIsEditOpen(true);
  };

  const renderForm = () => (
    <div className="space-y-4">
      <div>
        <Label>Nom du service *</Label>
        <Input
          value={formData.serviceName}
          onChange={e => setFormData(f => ({ ...f, serviceName: e.target.value }))}
          placeholder="Ex: Bagage supplémentaire"
        />
      </div>

      <div>
        <Label>Type</Label>
        <Select value={formData.serviceType} onValueChange={v => setFormData(f => ({ ...f, serviceType: v }))}>
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {SERVICE_TYPE_OPTIONS.map(opt => (
              <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div>
        <Label>Description</Label>
        <Input
          value={formData.description}
          onChange={e => setFormData(f => ({ ...f, description: e.target.value }))}
          placeholder="Description optionnelle"
        />
      </div>

      <div>
        <Label>Prix (FCFA) *</Label>
        <Input
          type="number"
          value={formData.price}
          onChange={e => setFormData(f => ({ ...f, price: e.target.value }))}
          placeholder="0"
        />
      </div>

      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          checked={formData.isActive}
          onChange={e => setFormData(f => ({ ...f, isActive: e.target.checked }))}
          className="rounded"
        />
        <Label className="mb-0">Actif</Label>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <BackButton />
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Services</h1>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Gérez les services proposés aux voyageurs ({services.length} service{services.length !== 1 ? 's' : ''})
            </p>
          </div>
        </div>
        <Button onClick={() => { resetForm(); setIsAddOpen(true); }}>
          <Plus className="w-4 h-4 mr-2" />
          Ajouter
        </Button>
      </div>

      {/* Services List */}
      {loading ? (
        <Card className="p-8 text-center text-gray-500">Chargement...</Card>
      ) : services.length === 0 ? (
        <Card className="p-8 text-center">
          <Package className="w-12 h-12 text-gray-300 mx-auto mb-3" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-1">Aucun service</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Ajoutez des services comme les bagages, la restauration ou le Wi-Fi pour vos voyageurs.
          </p>
          <Button onClick={() => { resetForm(); setIsAddOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Créer un service
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {services.map(svc => {
            const typeInfo = SERVICE_TYPE_MAP[svc.serviceType] || SERVICE_TYPE_MAP.OTHER;
            const Icon = typeInfo.icon;
            return (
              <Card key={svc.id} className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-50 to-green-50 dark:from-red-900/20 dark:to-green-900/20 flex items-center justify-center">
                      <Icon className="w-6 h-6 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">{svc.serviceName}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {typeInfo.label}
                        {svc.description && ` — ${svc.description}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <div className="font-bold text-gray-900 dark:text-white text-lg">
                        {Number(svc.price).toLocaleString('fr-FR')} FCFA
                      </div>
                    </div>
                    <Badge className={svc.isActive
                      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                      : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'
                    }>
                      {svc.isActive ? 'Actif' : 'Inactif'}
                    </Badge>
                    <div className="flex gap-1">
                      <Button size="sm" variant="outline" onClick={() => openEdit(svc)}>
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleDelete(svc)}>
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      )}

      {/* Add Dialog */}
      <FormDialog
        open={isAddOpen}
        onOpenChange={setIsAddOpen}
        title="Nouveau service"
        description="Ajoutez un service proposé aux voyageurs"
        onSubmit={handleAdd}
        submitLabel="Créer"
      >
        {renderForm()}
      </FormDialog>

      {/* Edit Dialog */}
      <FormDialog
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        title="Modifier le service"
        onSubmit={handleEdit}
        submitLabel="Enregistrer"
      >
        {renderForm()}
      </FormDialog>
    </div>
  );
}
