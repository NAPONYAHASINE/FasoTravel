import { useState, useEffect } from 'react';
import { Navigation, Plus, Edit, Trash2, MapPin, Clock, DollarSign } from "lucide-react@0.487.0";
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/back-button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Textarea } from '../../components/ui/textarea';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { FormDialog } from '../../components/forms/FormDialog';
import { useFilteredData } from '../../hooks/useFilteredData';
import { toast } from 'sonner@2.0.3'; // ✅ AJOUTÉ
import type { Route } from '../../contexts/DataContext';

export default function RoutesPage() {
  const { 
    routes, 
    trips, // ✅ AJOUTÉ: Pour vérifier trips en cours
    scheduleTemplates, // ✅ AJOUTÉ: Pour vérifier horaires configurés
    pricingRules, // ✅ AJOUTÉ: Pour vérifier règles de prix
    addRoute, 
    updateRoute, 
    deleteRoute,
    deleteScheduleTemplate, // ✅ AJOUTÉ: Pour suppression cascade
    deletePricingRule // ✅ AJOUTÉ: Pour suppression cascade
  } = useFilteredData();

  // 🚀 BACKEND-READY: Charger les routes depuis votre API NestJS
  // useEffect(() => {
  //   const fetchRoutes = async () => {
  //     const response = await fetch('/api/routes?orderBy=departure');
  //
  //     if (!response.ok) {
  //       toast.error('Erreur lors du chargement des routes');
  //       return;
  //     }
  //
  //     const data = await response.json();
  //     // Mettre à jour le state ou contexte avec les données
  //   };
  //
  //   fetchRoutes();
  // }, []);
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingRoute, setEditingRoute] = useState<Route | null>(null);
  
  const [formData, setFormData] = useState({
    departure: '',
    arrival: '',
    distance: 0,
    duration: 0,
    basePrice: 0,
    description: '',
    status: 'active' as 'active' | 'inactive',
  });

  const resetForm = () => {
    setFormData({
      departure: '',
      arrival: '',
      distance: 0,
      duration: 0,
      basePrice: 0,
      description: '',
      status: 'active',
    });
  };

  const handleAdd = () => {
    if (!formData.departure.trim() || !formData.arrival.trim()) {
      toast.error('Veuillez remplir les villes de départ et d\'arrivée');
      return;
    }

    if (formData.distance <= 0 || formData.duration <= 0 || formData.basePrice <= 0) {
      toast.error('Veuillez entrer des valeurs valides pour la distance, durée et prix');
      return;
    }

    // 🚀 BACKEND-READY: Créer la route via votre API NestJS
    // const response = await fetch('/api/routes', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     departure: formData.departure,
    //     arrival: formData.arrival,
    //     distance: formData.distance,
    //     duration: formData.duration,
    //     basePrice: formData.basePrice,
    //     description: formData.description,
    //     status: formData.status,
    //   })
    // });
    //
    // if (!response.ok) {
    //   toast.error('Erreur lors de la création de la route');
    //   return;
    // }

    addRoute({
      departure: formData.departure,
      arrival: formData.arrival,
      distance: formData.distance,
      duration: formData.duration,
      basePrice: formData.basePrice,
      description: formData.description,
      status: formData.status,
    });

    toast.success('Route ajoutée avec succès');
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = (route: Route) => {
    setEditingRoute(route);
    setFormData({
      departure: route.departure,
      arrival: route.arrival,
      distance: route.distance,
      duration: route.duration,
      basePrice: route.basePrice,
      description: route.description || '',
      status: route.status,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingRoute) return;

    if (!formData.departure.trim() || !formData.arrival.trim()) {
      toast.error('Veuillez remplir les villes de départ et d\'arrivée');
      return;
    }

    if (formData.distance <= 0 || formData.duration <= 0 || formData.basePrice <= 0) {
      toast.error('Veuillez entrer des valeurs valides');
      return;
    }

    // 🚀 BACKEND-READY: Mettre à jour la route via votre API NestJS
    // const response = await fetch(`/api/routes/${editingRoute.id}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     departure: formData.departure,
    //     arrival: formData.arrival,
    //     distance: formData.distance,
    //     duration: formData.duration,
    //     basePrice: formData.basePrice,
    //     description: formData.description,
    //     status: formData.status,
    //   })
    // });
    //
    // if (!response.ok) {
    //   toast.error('Erreur lors de la modification de la route');
    //   return;
    // }

    updateRoute(editingRoute.id, {
      departure: formData.departure,
      arrival: formData.arrival,
      distance: formData.distance,
      duration: formData.duration,
      basePrice: formData.basePrice,
      description: formData.description,
      status: formData.status,
    });

    toast.success('Route mise à jour avec succès');
    setIsEditDialogOpen(false);
    setEditingRoute(null);
    resetForm();
  };

  const handleDelete = (route: Route) => {
    // ✅ VALIDATIONS: Vérifier les dépendances avant suppression
    const linkedTrips = trips.filter(
      t => t.routeId === route.id &&
      ['scheduled', 'boarding', 'departed'].includes(t.status)
    );
    const linkedSchedules = scheduleTemplates.filter(s => s.routeId === route.id);
    const linkedPricingRules = pricingRules.filter(p => p.routeId === route.id);
    
    // Bloquer si trips en cours
    if (linkedTrips.length > 0) {
      toast.error(
        `Impossible de supprimer cette route: ${linkedTrips.length} trajet(s) en cours ou programmé(s). ` +
        `Annulez ou attendez la fin des trajets avant de supprimer la route.`
      );
      return;
    }
    
    // Demander confirmation si horaires configurés (suppression en cascade)
    if (linkedSchedules.length > 0 || linkedPricingRules.length > 0) {
      const cascadeMsg = [
        linkedSchedules.length > 0 && `${linkedSchedules.length} horaire(s)`,
        linkedPricingRules.length > 0 && `${linkedPricingRules.length} règle(s) de prix`
      ].filter(Boolean).join(' et ');
      
      const confirmed = confirm(
        `Cette route a ${cascadeMsg}.\n\n` +
        `La suppression de la route supprimera également ces éléments.\n\n` +
        `Voulez-vous vraiment continuer ?`
      );
      
      if (!confirmed) {
        return;
      }
      
      // Supprimer les horaires liés en cascade
      linkedSchedules.forEach(schedule => {
        deleteScheduleTemplate(schedule.id);
      });
      
      // Supprimer les règles de prix liées en cascade
      linkedPricingRules.forEach(rule => {
        deletePricingRule(rule.id);
      });
      
      toast.info(`${cascadeMsg} supprimé(s) en cascade`);
    }
    
    // Demander confirmation finale
    if (confirm(`Êtes-vous sûr de vouloir supprimer la route "${route.departure} → ${route.arrival}" ?`)) {
      // 🚀 BACKEND-READY: Supprimer la route via votre API NestJS
      // const response = await fetch(`/api/routes/${route.id}`, {
      //   method: 'DELETE'
      // });
      //
      // if (!response.ok) {
      //   toast.error('Erreur lors de la suppression de la route');
      //   return;
      // }

      deleteRoute(route.id);
      toast.success('Route supprimée avec succès');
    }
  };

  const activeRoutes = routes.filter(r => r.status === 'active');
  const inactiveRoutes = routes.filter(r => r.status === 'inactive');

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Routes
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez les itinéraires de votre réseau de transport
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
          Nouvelle route
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total des routes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {routes.length}
              </p>
            </div>
            <Navigation className="text-gray-400" size={32} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Routes actives</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {activeRoutes.length}
              </p>
            </div>
            <Navigation className="text-green-600 dark:text-green-400" size={32} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Routes inactives</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {inactiveRoutes.length}
              </p>
            </div>
            <Navigation className="text-red-600 dark:text-red-400" size={32} />
          </div>
        </Card>
      </div>

      {/* Routes Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {routes.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            <Navigation size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg">Aucune route enregistrée</p>
            <p className="text-sm">Ajoutez votre première route pour commencer</p>
          </div>
        ) : (
          routes.map((route) => (
            <Card key={route.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                      {route.departure} → {route.arrival}
                    </h3>
                    <Badge
                      className={
                        route.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }
                    >
                      {route.status === 'active' ? 'Active' : 'Inactive'}
                    </Badge>
                  </div>
                  {route.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {route.description}
                    </p>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4 mb-4">
                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {route.distance}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">km</p>
                </div>

                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Clock size={16} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="text-lg font-bold text-gray-900 dark:text-white">
                    {Math.floor(route.duration / 60)}h{route.duration % 60 > 0 ? `${route.duration % 60}` : ''}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">durée</p>
                </div>

                <div className="text-center p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <DollarSign size={16} className="text-gray-500 dark:text-gray-400" />
                  </div>
                  <p className="text-lg font-bold text-[#f59e0b]">
                    {route.basePrice.toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-600 dark:text-gray-400">FCFA</p>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(route)}
                  className="flex-1"
                >
                  <Edit size={16} className="mr-1" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(route)}
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
        title="Nouvelle route"
        description="Ajoutez une nouvelle route à votre réseau"
        onSubmit={handleAdd}
        submitLabel="Créer la route"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="departure">Ville de départ *</Label>
              <Input
                id="departure"
                value={formData.departure}
                onChange={(e) => setFormData({ ...formData, departure: e.target.value })}
                placeholder="Ex: Ouagadougou"
              />
            </div>

            <div>
              <Label htmlFor="arrival">Ville d'arrivée *</Label>
              <Input
                id="arrival"
                value={formData.arrival}
                onChange={(e) => setFormData({ ...formData, arrival: e.target.value })}
                placeholder="Ex: Bobo-Dioulasso"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="distance">Distance (km) *</Label>
              <Input
                id="distance"
                type="number"
                value={formData.distance || ''}
                onChange={(e) => setFormData({ ...formData, distance: parseInt(e.target.value) || 0 })}
                placeholder="Ex: 365"
                min={1}
              />
            </div>

            <div>
              <Label htmlFor="duration">Durée (min) *</Label>
              <Input
                id="duration"
                type="number"
                value={formData.duration || ''}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                placeholder="Ex: 300"
                min={1}
              />
            </div>

            <div>
              <Label htmlFor="basePrice">Prix de base (FCFA) *</Label>
              <Input
                id="basePrice"
                type="number"
                value={formData.basePrice || ''}
                onChange={(e) => setFormData({ ...formData, basePrice: parseInt(e.target.value) || 0 })}
                placeholder="Ex: 5000"
                min={1}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Route principale vers Bobo"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'inactive') => 
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormDialog>

      {/* Edit Dialog */}
      <FormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Modifier la route"
        description="Modifiez les informations de la route"
        onSubmit={handleUpdate}
        submitLabel="Enregistrer"
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="edit-departure">Ville de départ *</Label>
              <Input
                id="edit-departure"
                value={formData.departure}
                onChange={(e) => setFormData({ ...formData, departure: e.target.value })}
                placeholder="Ex: Ouagadougou"
              />
            </div>

            <div>
              <Label htmlFor="edit-arrival">Ville d'arrivée *</Label>
              <Input
                id="edit-arrival"
                value={formData.arrival}
                onChange={(e) => setFormData({ ...formData, arrival: e.target.value })}
                placeholder="Ex: Bobo-Dioulasso"
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div>
              <Label htmlFor="edit-distance">Distance (km) *</Label>
              <Input
                id="edit-distance"
                type="number"
                value={formData.distance || ''}
                onChange={(e) => setFormData({ ...formData, distance: parseInt(e.target.value) || 0 })}
                placeholder="Ex: 365"
                min={1}
              />
            </div>

            <div>
              <Label htmlFor="edit-duration">Durée (min) *</Label>
              <Input
                id="edit-duration"
                type="number"
                value={formData.duration || ''}
                onChange={(e) => setFormData({ ...formData, duration: parseInt(e.target.value) || 0 })}
                placeholder="Ex: 300"
                min={1}
              />
            </div>

            <div>
              <Label htmlFor="edit-basePrice">Prix de base (FCFA) *</Label>
              <Input
                id="edit-basePrice"
                type="number"
                value={formData.basePrice || ''}
                onChange={(e) => setFormData({ ...formData, basePrice: parseInt(e.target.value) || 0 })}
                placeholder="Ex: 5000"
                min={1}
              />
            </div>
          </div>

          <div>
            <Label htmlFor="edit-description">Description</Label>
            <Textarea
              id="edit-description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="Ex: Route principale vers Bobo"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="edit-status">Statut</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'active' | 'inactive') => 
                setFormData({ ...formData, status: value })
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}