import { useState } from 'react';
import { MapPin, Plus, Edit, Trash2, Phone, User, CheckCircle, XCircle, Clock, Package } from "lucide-react";
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/back-button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { FormDialog } from '../../components/forms/FormDialog';
import { useFilteredData } from '../../hooks/useFilteredData';
import { toast } from 'sonner'; // ✅ AJOUTÉ: import toast
import type { Station } from '../../contexts/DataContext';

export default function StationsPage() {
  const { 
    stations, 
    managers, 
    cashiers, // ✅ AJOUTÉ: Pour vérifier cashiers liés
    trips, // ✅ AJOUTÉ: Pour vérifier trips en cours
    scheduleTemplates, // ✅ AJOUTÉ: Pour vérifier horaires configurés
    addStation, 
    updateStation, 
    deleteStation,
    deleteScheduleTemplate // ✅ AJOUTÉ: Pour suppression cascade horaires
  } = useFilteredData();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStation, setEditingStation] = useState<Station | null>(null);
  
  const [formData, setFormData] = useState({
    name: '',
    city: '',
    region: '',
    address: '',
    phone: '',
    managerId: '',
    status: 'active' as 'active' | 'inactive',
    // ✅ NOUVEAUX CHAMPS
    openTime: '07:00',
    closeTime: '19:00',
    baggagePrice: '500',
  });

  const resetForm = () => {
    setFormData({
      name: '',
      city: '',
      region: '',
      address: '',
      phone: '',
      managerId: '',
      status: 'active',
      // ✅ NOUVEAUX CHAMPS
      openTime: '07:00',
      closeTime: '19:00',
      baggagePrice: '500',
    });
  };

  const handleAdd = () => {
    if (!formData.name.trim() || !formData.city.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const manager = managers.find((m: any) => m.id === formData.managerId);

    // 🚀 BACKEND-READY: Créer la gare via votre API NestJS
    // const response = await fetch('/api/stations', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     name: formData.name,
    //     city: formData.city,
    //     region: formData.region,
    //     address: formData.address,
    //     phone: formData.phone,
    //     managerId: formData.managerId && formData.managerId !== 'none' ? formData.managerId : null,
    //     managerName: manager?.name || null,
    //     status: formData.status,
    //     workingHours: {
    //       openTime: formData.openTime,
    //       closeTime: formData.closeTime,
    //     },
    //     baggagePrice: parseInt(formData.baggagePrice) || 500,
    //   })
    // });
    //
    // if (!response.ok) {
    //   toast.error('Erreur lors de la création de la gare');
    //   return;
    // }

    addStation({
      name: formData.name,
      city: formData.city,
      region: formData.region,
      address: formData.address,
      phone: formData.phone,
      managerId: formData.managerId && formData.managerId !== 'none' ? formData.managerId : undefined,
      managerName: manager?.name || undefined,
      status: formData.status,
      workingHours: {
        openTime: formData.openTime,
        closeTime: formData.closeTime,
      },
      baggagePrice: parseInt(formData.baggagePrice) || 500,
    });

    toast.success('Gare ajoutée avec succès');
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = (station: Station) => {
    setEditingStation(station);
    setFormData({
      name: station.name,
      city: station.city,
      region: station.region,
      address: station.address,
      phone: station.phone,
      managerId: station.managerId || '',
      status: station.status,
      // ✅ NOUVEAUX CHAMPS
      openTime: station.workingHours?.openTime || '07:00',
      closeTime: station.workingHours?.closeTime || '19:00',
      baggagePrice: station.baggagePrice?.toString() || '500',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingStation) return;

    if (!formData.name.trim() || !formData.city.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    const manager = managers.find((m: any) => m.id === formData.managerId);

    // 🚀 BACKEND-READY: Mettre à jour la gare via votre API NestJS
    // const response = await fetch(`/api/stations/${editingStation.id}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     name: formData.name,
    //     city: formData.city,
    //     region: formData.region,
    //     address: formData.address,
    //     phone: formData.phone,
    //     managerId: formData.managerId && formData.managerId !== 'none' ? formData.managerId : null,
    //     managerName: manager?.name || null,
    //     status: formData.status,
    //     workingHours: {
    //       openTime: formData.openTime,
    //       closeTime: formData.closeTime,
    //     },
    //     baggagePrice: parseInt(formData.baggagePrice) || 500,
    //   })
    // });
    //
    // if (!response.ok) {
    //   toast.error('Erreur lors de la mise à jour de la gare');
    //   return;
    // }

    updateStation(editingStation.id, {
      name: formData.name,
      city: formData.city,
      region: formData.region,
      address: formData.address,
      phone: formData.phone,
      managerId: formData.managerId && formData.managerId !== 'none' ? formData.managerId : undefined,
      managerName: manager?.name || undefined,
      status: formData.status,
      workingHours: {
        openTime: formData.openTime,
        closeTime: formData.closeTime,
      },
      baggagePrice: parseInt(formData.baggagePrice) || 500,
    });

    toast.success('Gare mise à jour avec succès');
    setIsEditDialogOpen(false);
    setEditingStation(null);
    resetForm();
  };

  const handleDelete = (station: Station) => {
    // ✅ VALIDATIONS: Vérifier les dépendances avant suppression
    const linkedManagers = managers.filter(m => m.gareId === station.id);
    const linkedCashiers = cashiers.filter(c => c.gareId === station.id);
    const linkedTrips = trips.filter(
      t => t.gareId === station.id && 
      ['scheduled', 'boarding', 'departed'].includes(t.status)
    );
    const linkedSchedules = scheduleTemplates.filter(s => s.gareId === station.id);
    
    // Bloquer si managers liés
    if (linkedManagers.length > 0) {
      toast.error(
        `Impossible de supprimer cette gare: ${linkedManagers.length} manager(s) affecté(s) à cette gare. ` +
        `Veuillez d'abord réaffecter ou supprimer les managers.`
      );
      return;
    }
    
    // Bloquer si cashiers liés
    if (linkedCashiers.length > 0) {
      toast.error(
        `Impossible de supprimer cette gare: ${linkedCashiers.length} caissier(s) affecté(s) à cette gare. ` +
        `Veuillez d'abord réaffecter ou supprimer les caissiers.`
      );
      return;
    }
    
    // Bloquer si trips en cours
    if (linkedTrips.length > 0) {
      toast.error(
        `Impossible de supprimer cette gare: ${linkedTrips.length} trajet(s) en cours ou programmé(s). ` +
        `Annulez ou attendez la fin des trajets avant de supprimer la gare.`
      );
      return;
    }
    
    // Demander confirmation si horaires configurés (suppression en cascade)
    if (linkedSchedules.length > 0) {
      const confirmed = confirm(
        `Cette gare a ${linkedSchedules.length} horaire(s) configuré(s).\n\n` +
        `La suppression de la gare supprimera également ces horaires.\n\n` +
        `Voulez-vous vraiment continuer ?`
      );
      
      if (!confirmed) {
        return;
      }
      
      // Supprimer les horaires liés en cascade
      linkedSchedules.forEach(schedule => {
        deleteScheduleTemplate(schedule.id);
      });
      
      toast.info(`${linkedSchedules.length} horaire(s) supprimé(s) en cascade`);
    }
    
    // Demander confirmation finale
    if (confirm(`Êtes-vous sûr de vouloir supprimer la gare "${station.name}" ?`)) {
      // 🚀 BACKEND-READY: Supprimer la gare via votre API NestJS
      // const response = await fetch(`/api/stations/${station.id}`, {
      //   method: 'DELETE'
      // });
      //
      // if (!response.ok) {
      //   toast.error('Erreur lors de la suppression de la gare');
      //   return;
      // }

      deleteStation(station.id);
      toast.success('Gare supprimée avec succès');
    }
  };

  const activeStations = stations.filter(s => s.status === 'active');
  const inactiveStations = stations.filter(s => s.status === 'inactive');

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Gares
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez les gares de votre réseau de transport
          </p>
        </div>
        <Button
          onClick={() => {
            resetForm();
            setIsAddDialogOpen(true);
          }}
          className="bg-[#f59e0b] hover:bg-[#d97706]"
        >
          <Plus className="mr-2" size={20} />
          Nouvelle gare
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total des gares</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {stations.length}
              </p>
            </div>
            <MapPin className="text-gray-400" size={32} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gares actives</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {activeStations.length}
              </p>
            </div>
            <CheckCircle className="text-green-600 dark:text-green-400" size={32} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Gares inactives</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {inactiveStations.length}
              </p>
            </div>
            <XCircle className="text-red-600 dark:text-red-400" size={32} />
          </div>
        </Card>
      </div>

      {/* Stations Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {stations.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            <MapPin size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg">Aucune gare enregistrée</p>
            <p className="text-sm">Ajoutez votre première gare pour commencer</p>
          </div>
        ) : (
          stations.map((station: any) => (
            <Card key={station.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {station.name}
                    </h3>
                    <Badge
                      className={
                        station.status === 'active'
                          ? 'bg-green-100 text-green-800 border-green-200 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800'
                          : 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/20 dark:text-red-400 dark:border-red-800'
                      }
                    >
                      {station.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    {station.city}, {station.region}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
                  <span>{station.address}</span>
                </div>

                {station.phone && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Phone size={16} className="text-gray-500 dark:text-gray-400" />
                    <span>{station.phone}</span>
                  </div>
                )}

                {station.managerName && (
                  <div className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-400">
                    <User size={16} className="text-gray-500 dark:text-gray-400" />
                    <span>Manager: {station.managerName}</span>
                  </div>
                )}

                {/* ✅ NOUVEAUX CHAMPS: Affichage horaires et prix bagage */}
                {station.workingHours && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Clock size={16} className="text-gray-500 dark:text-gray-400" />
                    <span>
                      {station.workingHours.openTime} - {station.workingHours.closeTime}
                    </span>
                  </div>
                )}

                {station.baggagePrice && (
                  <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                    <Package size={16} className="text-gray-500 dark:text-gray-400" />
                    <span>Bagage: {station.baggagePrice.toLocaleString('fr-FR')} F</span>
                  </div>
                )}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(station)}
                  className="flex-1"
                >
                  <Edit size={16} className="mr-1" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(station)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </Card>
          ))
        )}
      </div>

      {/* Add Dialog */}
      <FormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title="Nouvelle gare"
        description="Ajoutez une nouvelle gare à votre réseau"
        onSubmit={handleAdd}
        submitLabel="Créer la gare"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nom de la gare *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Gare Routière de Ouagadougou"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="city">Ville *</Label>
              <Input
                id="city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ex: Ouagadougou"
              />
            </div>

            <div>
              <Label htmlFor="region">Région</Label>
              <Input
                id="region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="Ex: Centre"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="address">Adresse</Label>
            <Input
              id="address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Ex: Avenue Kwame Nkrumah"
            />
          </div>

          <div>
            <Label htmlFor="phone">Téléphone</Label>
            <Input
              id="phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ex: +226 25 30 60 70"
            />
          </div>

          <div>
            <Label htmlFor="manager">Manager</Label>
            <Select
              value={formData.managerId}
              onValueChange={(value) => setFormData({ ...formData, managerId: value })}
            >
              <SelectTrigger style={{ color: 'rgb(10, 10, 10)' }} className="dark:!text-white">
                <SelectValue placeholder="Sélectionnez un manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {managers
                  .filter(m => m.status === 'active')
                  .map(manager => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'inactive') => 
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger style={{ color: 'rgb(10, 10, 10)' }} className="dark:!text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ✅ NOUVEAUX CHAMPS: Horaires et tarification */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Horaires de travail
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="openTime">Heure d'ouverture</Label>
                <Input
                  id="openTime"
                  type="time"
                  value={formData.openTime}
                  onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="closeTime">Heure de fermeture</Label>
                <Input
                  id="closeTime"
                  type="time"
                  value={formData.closeTime}
                  onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Les caissiers doivent être en ligne pendant ces heures pour éviter le surbooking
            </p>
          </div>

          <div>
            <Label htmlFor="baggagePrice">Prix du bagage (FCFA)</Label>
            <Input
              id="baggagePrice"
              type="number"
              min="0"
              step="100"
              value={formData.baggagePrice}
              onChange={(e) => setFormData({ ...formData, baggagePrice: e.target.value })}
              placeholder="Ex: 500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tarif unique pour éviter les duplications et confusions
            </p>
          </div>
        </div>
      </FormDialog>

      {/* Edit Dialog */}
      <FormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Modifier la gare"
        description="Modifiez les informations de la gare"
        onSubmit={handleUpdate}
        submitLabel="Enregistrer"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Nom de la gare *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Gare Routière de Ouagadougou"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-city">Ville *</Label>
              <Input
                id="edit-city"
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                placeholder="Ex: Ouagadougou"
              />
            </div>

            <div>
              <Label htmlFor="edit-region">Région</Label>
              <Input
                id="edit-region"
                value={formData.region}
                onChange={(e) => setFormData({ ...formData, region: e.target.value })}
                placeholder="Ex: Centre"
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-address">Adresse</Label>
            <Input
              id="edit-address"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              placeholder="Ex: Avenue Kwame Nkrumah"
            />
          </div>

          <div>
            <Label htmlFor="edit-phone">Téléphone</Label>
            <Input
              id="edit-phone"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ex: +226 25 30 60 70"
            />
          </div>

          <div>
            <Label htmlFor="edit-manager">Manager</Label>
            <Select
              value={formData.managerId}
              onValueChange={(value) => setFormData({ ...formData, managerId: value })}
            >
              <SelectTrigger style={{ color: 'rgb(10, 10, 10)' }} className="dark:!text-white">
                <SelectValue placeholder="Sélectionnez un manager" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">Aucun</SelectItem>
                {managers
                  .filter(m => m.status === 'active')
                  .map(manager => (
                    <SelectItem key={manager.id} value={manager.id}>
                      {manager.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'inactive') => 
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger style={{ color: 'rgb(10, 10, 10)' }} className="dark:!text-white">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ✅ NOUVEAUX CHAMPS: Horaires et tarification */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <h4 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Horaires de travail
            </h4>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-openTime">Heure d'ouverture</Label>
                <Input
                  id="edit-openTime"
                  type="time"
                  value={formData.openTime}
                  onChange={(e) => setFormData({ ...formData, openTime: e.target.value })}
                />
              </div>

              <div>
                <Label htmlFor="edit-closeTime">Heure de fermeture</Label>
                <Input
                  id="edit-closeTime"
                  type="time"
                  value={formData.closeTime}
                  onChange={(e) => setFormData({ ...formData, closeTime: e.target.value })}
                />
              </div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Les caissiers doivent être en ligne pendant ces heures pour éviter le surbooking
            </p>
          </div>

          <div>
            <Label htmlFor="edit-baggagePrice">Prix du bagage (FCFA)</Label>
            <Input
              id="edit-baggagePrice"
              type="number"
              min="0"
              step="100"
              value={formData.baggagePrice}
              onChange={(e) => setFormData({ ...formData, baggagePrice: e.target.value })}
              placeholder="Ex: 500"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Tarif unique pour éviter les duplications et confusions
            </p>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}



