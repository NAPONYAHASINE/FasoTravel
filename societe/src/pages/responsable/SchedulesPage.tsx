import { useState, useEffect } from 'react';
import { Calendar, Plus, Pencil, Trash2, Clock, MapPin, Users, ChevronDown } from 'lucide-react@0.487.0';
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/back-button';
import { Badge } from '../../components/ui/badge';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { FormDialog } from '../../components/forms/FormDialog';
import { useFilteredData } from '../../hooks/useFilteredData';
import { toast } from 'sonner@2.0.3';
import type { ScheduleTemplate } from '../../contexts/DataContext';

const DAYS_OF_WEEK = [
  { value: 0, label: 'Dim', full: 'Dimanche' },
  { value: 1, label: 'Lun', full: 'Lundi' },
  { value: 2, label: 'Mar', full: 'Mardi' },
  { value: 3, label: 'Mer', full: 'Mercredi' },
  { value: 4, label: 'Jeu', full: 'Jeudi' },
  { value: 5, label: 'Ven', full: 'Vendredi' },
  { value: 6, label: 'Sam', full: 'Samedi' },
];

export default function SchedulesPage() {
  const {
    scheduleTemplates,
    routes,
    stations,
    addScheduleTemplate,
    updateScheduleTemplate,
    deleteScheduleTemplate,
    generateTripsFromTemplates,
  } = useFilteredData();

  // 🚀 BACKEND-READY: Charger les horaires depuis votre API NestJS
  // useEffect(() => {
  //   const fetchScheduleTemplates = async () => {
  //     const response = await fetch('/api/schedule-templates?orderBy=departureTime');
  //
  //     if (!response.ok) {
  //       toast.error('Erreur lors du chargement des horaires');
  //       return;
  //     }
  //
  //     const data = await response.json();
  //     // Mettre à jour le state ou contexte avec les données
  //   };
  //
  //   fetchScheduleTemplates();
  // }, []);

  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingTemplate, setEditingTemplate] = useState<ScheduleTemplate | null>(null);
  const [selectedDays, setSelectedDays] = useState<number[]>([0, 1, 2, 3, 4, 5, 6]);
  const [daysToGenerate, setDaysToGenerate] = useState<7 | 14 | 28>(7);
  const [showDaysDropdown, setShowDaysDropdown] = useState(false);

  const [formData, setFormData] = useState({
    routeId: '',
    gareId: '',
    departureTime: '',
    serviceClass: 'standard' as 'standard' | 'vip',
    totalSeats: 45,
  });

  const resetForm = () => {
    setFormData({
      routeId: '',
      gareId: '',
      departureTime: '',
      serviceClass: 'standard',
      totalSeats: 45,
    });
    setSelectedDays([0, 1, 2, 3, 4, 5, 6]);
  };

  const handleAddTemplate = () => {
    if (!formData.routeId || !formData.gareId || !formData.departureTime) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (selectedDays.length === 0) {
      toast.error('Veuillez sélectionner au moins un jour');
      return;
    }

    const gare = stations.find(s => s.id === formData.gareId);
    if (!gare) {
      toast.error('Gare introuvable');
      return;
    }

    // 🚀 BACKEND-READY: Créer l'horaire via votre API NestJS
    // const response = await fetch('/api/schedule-templates', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     routeId: formData.routeId,
    //     gareId: formData.gareId,
    //     gareName: gare.name,
    //     departureTime: formData.departureTime,
    //     serviceClass: formData.serviceClass,
    //     totalSeats: formData.totalSeats,
    //     daysOfWeek: selectedDays,
    //     status: 'active',
    //   })
    // });
    //
    // if (!response.ok) {
    //   toast.error('Erreur lors de la création de l\'horaire');
    //   return;
    // }

    addScheduleTemplate({
      ...formData,
      daysOfWeek: selectedDays,
      gareName: gare.name,
      status: 'active',
    });

    toast.success('Horaire récurrent créé avec succès');
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEditTemplate = () => {
    if (!editingTemplate) return;

    if (!formData.routeId || !formData.gareId || !formData.departureTime) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (selectedDays.length === 0) {
      toast.error('Veuillez sélectionner au moins un jour');
      return;
    }

    const gare = stations.find(s => s.id === formData.gareId);
    if (!gare) {
      toast.error('Gare introuvable');
      return;
    }

    // 🚀 BACKEND-READY: Mettre à jour l'horaire via votre API NestJS
    // const response = await fetch(`/api/schedule-templates/${editingTemplate.id}`, {
    //   method: 'PUT',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     routeId: formData.routeId,
    //     gareId: formData.gareId,
    //     gareName: gare.name,
    //     departureTime: formData.departureTime,
    //     serviceClass: formData.serviceClass,
    //     totalSeats: formData.totalSeats,
    //     daysOfWeek: selectedDays,
    //   })
    // });
    //
    // if (!response.ok) {
    //   toast.error('Erreur lors de la modification de l\'horaire');
    //   return;
    // }

    updateScheduleTemplate(editingTemplate.id, {
      ...formData,
      daysOfWeek: selectedDays,
      gareName: gare.name,
    });

    toast.success('Horaire récurrent modifié avec succès');
    setIsEditDialogOpen(false);
    setEditingTemplate(null);
    resetForm();
  };

  const handleDeleteTemplate = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cet horaire récurrent ?')) {
      // 🚀 BACKEND-READY: Supprimer l'horaire via votre API NestJS
      // const response = await fetch(`/api/schedule-templates/${id}`, {
      //   method: 'DELETE'
      // });
      //
      // if (!response.ok) {
      //   toast.error('Erreur lors de la suppression de l\'horaire');
      //   return;
      // }

      deleteScheduleTemplate(id);
      toast.success('Horaire récurrent supprimé');
    }
  };

  const openEditDialog = (template: ScheduleTemplate) => {
    setEditingTemplate(template);
    setFormData({
      routeId: template.routeId,
      gareId: template.gareId,
      departureTime: template.departureTime,
      serviceClass: template.serviceClass,
      totalSeats: template.totalSeats,
    });
    setSelectedDays(template.daysOfWeek);
    setIsEditDialogOpen(true);
  };

  const toggleDay = (day: number) => {
    if (selectedDays.includes(day)) {
      setSelectedDays(selectedDays.filter(d => d !== day));
    } else {
      setSelectedDays([...selectedDays, day].sort());
    }
  };

  const handleGenerateTrips = () => {
    // 🚀 BACKEND-READY: Générer les départs via votre API NestJS
    // const response = await fetch('/api/trips/generate-from-templates', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({ daysCount: daysToGenerate })
    // });
    //
    // if (!response.ok) {
    //   toast.error('Erreur lors de la génération des départs');
    //   return;
    // }

    generateTripsFromTemplates(daysToGenerate);
    toast.success(`Départs générés pour les ${daysToGenerate} prochains jours`);
  };

  // Group templates by route
  const templatesByRoute = scheduleTemplates.reduce((acc, template) => {
    const route = routes.find(r => r.id === template.routeId);
    if (!route) return acc;
    
    const key = `${route.departure} → ${route.arrival}`;
    if (!acc[key]) {
      acc[key] = [];
    }
    acc[key].push(template);
    return acc;
  }, {} as Record<string, ScheduleTemplate[]>);

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Horaires Récurrents
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez les horaires fixes pour génération automatique des départs
          </p>
        </div>
        <div className="flex gap-3">
          <div className="relative">
            <Button
              variant="outline"
              className="border-[#f59e0b] text-[#f59e0b] hover:bg-[#f59e0b]/10 p-0 overflow-hidden"
            >
              <div
                onClick={handleGenerateTrips}
                className="flex items-center px-4 py-2 flex-1"
              >
                <Calendar className="mr-2" size={20} />
                Générer départs ({daysToGenerate}j)
              </div>
              <div
                onClick={(e) => {
                  e.stopPropagation();
                  setShowDaysDropdown(!showDaysDropdown);
                }}
                className="border-l border-[#f59e0b]/30 px-3 py-2 hover:bg-[#f59e0b]/10 cursor-pointer transition-colors"
              >
                <ChevronDown size={20} />
              </div>
            </Button>
            {showDaysDropdown && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setShowDaysDropdown(false)}
                />
                <div className="absolute right-0 top-full mt-2 w-40 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg z-20">
                  <div
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-t-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDaysToGenerate(7);
                      setShowDaysDropdown(false);
                    }}
                  >
                    7 jours
                  </div>
                  <div
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDaysToGenerate(14);
                      setShowDaysDropdown(false);
                    }}
                  >
                    14 jours
                  </div>
                  <div
                    className="px-4 py-2 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-b-lg transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      setDaysToGenerate(28);
                      setShowDaysDropdown(false);
                    }}
                  >
                    28 jours
                  </div>
                </div>
              </>
            )}
          </div>
          <Button
            onClick={() => setIsAddDialogOpen(true)}
            className="bg-[#f59e0b] hover:bg-[#d97706]"
          >
            <Plus className="mr-2" size={20} />
            Nouvel horaire
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total horaires</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{scheduleTemplates.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Clock className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Routes couvertes</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{Object.keys(templatesByRoute).length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <MapPin className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Horaires actifs</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {scheduleTemplates.filter(t => t.status === 'active').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <Calendar className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Classe VIP</p>
              <p className="text-2xl font-bold text-[#f59e0b]">
                {scheduleTemplates.filter(t => t.serviceClass === 'vip').length}
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
              <Users className="text-[#f59e0b]" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Templates by route */}
      <div className="space-y-6">
        {Object.entries(templatesByRoute).map(([routeKey, templates]) => (
          <Card key={routeKey} className="p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-4">
              {routeKey}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {templates.map((template) => {
                const route = routes.find(r => r.id === template.routeId);
                if (!route) return null;

                return (
                  <Card key={template.id} className="p-4 border-l-4 border-l-[#f59e0b]">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2">
                        <Clock className="text-[#f59e0b]" size={20} />
                        <span className="text-xl font-bold text-gray-900 dark:text-white">
                          {template.departureTime}
                        </span>
                      </div>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => openEditDialog(template)}
                          className="h-8 w-8 p-0"
                        >
                          <Pencil size={16} />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                        >
                          <Trash2 size={16} />
                        </Button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Classe</span>
                        <Badge className={template.serviceClass === 'vip'
                          ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400'
                          : 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400'
                        }>
                          {template.serviceClass === 'vip' ? '⭐ VIP' : 'Standard'}
                        </Badge>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Places</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white">
                          {template.totalSeats} sièges
                        </span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 dark:text-gray-400">Gare</span>
                        <span className="text-sm font-medium text-gray-900 dark:text-white truncate max-w-[150px]">
                          {template.gareName.split(' ')[0]}
                        </span>
                      </div>

                      <div className="pt-2 border-t border-gray-200 dark:border-gray-700">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">Jours de service</p>
                        <div className="flex gap-1 flex-wrap">
                          {DAYS_OF_WEEK.map(day => (
                            <div
                              key={day.value}
                              className={`text-xs px-2 py-1 rounded ${
                                template.daysOfWeek.includes(day.value)
                                  ? 'bg-[#f59e0b] text-white'
                                  : 'bg-gray-100 dark:bg-gray-800 text-gray-400'
                              }`}
                            >
                              {day.label}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </Card>
                );
              })}
            </div>
          </Card>
        ))}

        {Object.keys(templatesByRoute).length === 0 && (
          <Card className="p-12 text-center">
            <Calendar className="mx-auto text-gray-400 mb-4" size={48} />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              Aucun horaire récurrent
            </h3>
            <p className="text-gray-600 dark:text-gray-400 mb-4">
              Créez votre premier horaire pour générer automatiquement les départs
            </p>
            <Button onClick={() => setIsAddDialogOpen(true)} className="bg-[#f59e0b] hover:bg-[#d97706]">
              <Plus className="mr-2" size={20} />
              Créer un horaire
            </Button>
          </Card>
        )}
      </div>

      {/* Add Dialog */}
      <FormDialog
        open={isAddDialogOpen}
        onOpenChange={setIsAddDialogOpen}
        title="Créer un nouvel horaire récurrent"
        description="Les départs seront générés automatiquement selon cet horaire"
        onSubmit={handleAddTemplate}
      >
        <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
          <div>
            <Label htmlFor="route">Route *</Label>
            <Select value={formData.routeId} onValueChange={(value) => setFormData({ ...formData, routeId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une route" />
              </SelectTrigger>
              <SelectContent>
                {routes.filter(r => r.status === 'active').map(route => (
                  <SelectItem key={route.id} value={route.id}>
                    {route.departure} → {route.arrival}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="gare">Gare de départ *</Label>
            <Select value={formData.gareId} onValueChange={(value) => setFormData({ ...formData, gareId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une gare" />
              </SelectTrigger>
              <SelectContent>
                {stations.filter(s => s.status === 'active').map(station => (
                  <SelectItem key={station.id} value={station.id}>
                    {station.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="time">Heure de départ *</Label>
            <Input
              id="time"
              type="time"
              value={formData.departureTime}
              onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="class">Classe de service *</Label>
            <Select value={formData.serviceClass} onValueChange={(value: 'standard' | 'vip') => setFormData({ ...formData, serviceClass: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="vip">VIP ⭐</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="seats">Nombre de places *</Label>
            <Input
              id="seats"
              type="number"
              min="1"
              max="100"
              value={formData.totalSeats}
              onChange={(e) => setFormData({ ...formData, totalSeats: parseInt(e.target.value) || 45 })}
            />
          </div>

          <div>
            <Label>Jours de service *</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedDays.includes(day.value)
                      ? 'bg-[#f59e0b] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {day.full}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FormDialog>

      {/* Edit Dialog */}
      <FormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Modifier l'horaire récurrent"
        onSubmit={handleEditTemplate}
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-route">Route *</Label>
            <Select value={formData.routeId} onValueChange={(value) => setFormData({ ...formData, routeId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une route" />
              </SelectTrigger>
              <SelectContent>
                {routes.filter(r => r.status === 'active').map(route => (
                  <SelectItem key={route.id} value={route.id}>
                    {route.departure} → {route.arrival}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-gare">Gare de départ *</Label>
            <Select value={formData.gareId} onValueChange={(value) => setFormData({ ...formData, gareId: value })}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner une gare" />
              </SelectTrigger>
              <SelectContent>
                {stations.filter(s => s.status === 'active').map(station => (
                  <SelectItem key={station.id} value={station.id}>
                    {station.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-time">Heure de départ *</Label>
            <Input
              id="edit-time"
              type="time"
              value={formData.departureTime}
              onChange={(e) => setFormData({ ...formData, departureTime: e.target.value })}
            />
          </div>

          <div>
            <Label htmlFor="edit-class">Classe de service *</Label>
            <Select value={formData.serviceClass} onValueChange={(value: 'standard' | 'vip') => setFormData({ ...formData, serviceClass: value })}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="standard">Standard</SelectItem>
                <SelectItem value="vip">VIP ⭐</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="edit-seats">Nombre de places *</Label>
            <Input
              id="edit-seats"
              type="number"
              min="1"
              max="100"
              value={formData.totalSeats}
              onChange={(e) => setFormData({ ...formData, totalSeats: parseInt(e.target.value) || 45 })}
            />
          </div>

          <div>
            <Label>Jours de service *</Label>
            <div className="flex gap-2 mt-2 flex-wrap">
              {DAYS_OF_WEEK.map(day => (
                <button
                  key={day.value}
                  type="button"
                  onClick={() => toggleDay(day.value)}
                  className={`px-4 py-2 rounded-lg transition-colors ${
                    selectedDays.includes(day.value)
                      ? 'bg-[#f59e0b] text-white'
                      : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-700'
                  }`}
                >
                  {day.full}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}