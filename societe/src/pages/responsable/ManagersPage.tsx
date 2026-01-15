import { useState } from 'react';
import { UserCheck, Plus, Edit, Trash2, Phone, Mail, MapPin, CheckCircle, XCircle, Lock, Eye, EyeOff } from "lucide-react@0.487.0";
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/back-button';
import { Input } from '../../components/ui/input';
import { PasswordInput } from '../../components/ui/password-input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select';
import { FormDialog } from '../../components/forms/FormDialog';
import { useFilteredData } from '../../hooks/useFilteredData';
import { toast } from 'sonner@2.0.3';
import type { Manager } from '../../contexts/DataContext';

export default function ManagersPage() {
  const { 
    managers, 
    stations, 
    cashiers, // ✅ AJOUTÉ: Pour vérifier cashiers sous responsabilité
    addManager, 
    updateManager, 
    deleteManager 
  } = useFilteredData();
  
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingManager, setEditingManager] = useState<Manager | null>(null);
  const [showPasswords, setShowPasswords] = useState<Record<string, boolean>>({}); // ✅ Toggle pour chaque manager
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    gareId: '',
    status: 'active' as 'active' | 'inactive',
    password: '', // ✅ Mot de passe (uniquement en mode création)
    passwordConfirm: '', // ✅ Confirmation mot de passe
  });

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      phone: '',
      gareId: '',
      status: 'active',
      password: '',
      passwordConfirm: '',
    });
  };

  const handleAdd = () => {
    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!formData.gareId) {
      toast.error('Veuillez sélectionner une gare');
      return;
    }

    // ✅ Validation du mot de passe
    if (!formData.password.trim()) {
      toast.error('Veuillez saisir un mot de passe');
      return;
    }

    if (formData.password.length < 8) {
      toast.error('Le mot de passe doit contenir au moins 8 caractères');
      return;
    }

    if (formData.password !== formData.passwordConfirm) {
      toast.error('Les mots de passe ne correspondent pas');
      return;
    }

    const gare = stations.find(s => s.id === formData.gareId);
    if (!gare) {
      toast.error('Gare invalide');
      return;
    }

    // 🚀 BACKEND-READY: Appeler votre API NestJS
    // const response = await fetch('/api/auth/register', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     email: formData.email,
    //     password: formData.password,
    //     name: formData.name,
    //     role: 'manager',
    //     gareId: gare.id,
    //     gareName: gare.name,
    //   })
    // });
    // 
    // if (!response.ok) {
    //   const error = await response.json();
    //   toast.error('Erreur lors de la création du compte: ' + error.message);
    //   return;
    // }
    //
    // const { user } = await response.json();
    //
    // // Créer le profil manager
    // const managerResponse = await fetch('/api/managers', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     userId: user.id,
    //     name: formData.name,
    //     email: formData.email,
    //     phone: formData.phone,
    //     gareId: gare.id,
    //     gareName: gare.name,
    //     status: formData.status,
    //     joinedDate: new Date().toISOString().split('T')[0],
    //   })
    // });

    addManager({
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      gareId: gare.id,
      gareName: gare.name,
      status: formData.status,
      joinedDate: new Date().toISOString().split('T')[0],
      password: formData.password, // ✅ Ajouté
    });

    toast.success('Manager ajouté avec succès');
    setIsAddDialogOpen(false);
    resetForm();
  };

  const handleEdit = (manager: Manager) => {
    setEditingManager(manager);
    setFormData({
      name: manager.name,
      email: manager.email,
      phone: manager.phone,
      gareId: manager.gareId,
      status: manager.status,
      password: '', // ✅ Réinitialiser les champs mot de passe (non utilisés en mode édition)
      passwordConfirm: '',
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdate = () => {
    if (!editingManager) return;

    if (!formData.name.trim() || !formData.email.trim() || !formData.phone.trim()) {
      toast.error('Veuillez remplir tous les champs obligatoires');
      return;
    }

    if (!formData.gareId) {
      toast.error('Veuillez sélectionner une gare');
      return;
    }

    const gare = stations.find(s => s.id === formData.gareId);
    if (!gare) {
      toast.error('Gare invalide');
      return;
    }

    // ✅ Validation du mot de passe (optionnel)
    if (formData.password.trim()) {
      if (formData.password.length < 8) {
        toast.error('Le mot de passe doit contenir au moins 8 caractères');
        return;
      }

      if (formData.password !== formData.passwordConfirm) {
        toast.error('Les mots de passe ne correspondent pas');
        return;
      }
    }

    // Préparer les données de mise à jour
    const updateData: any = {
      name: formData.name,
      email: formData.email,
      phone: formData.phone,
      gareId: gare.id,
      gareName: gare.name,
      status: formData.status,
    };

    // ✅ Ajouter le mot de passe seulement s'il est rempli
    if (formData.password.trim()) {
      updateData.password = formData.password;
    }

    updateManager(editingManager.id, updateData);

    toast.success('Manager mis à jour avec succès');
    setIsEditDialogOpen(false);
    setEditingManager(null);
    resetForm();
  };

  const handleDelete = (manager: Manager) => {
    // ✅ VALIDATION: Vérifier cashiers sous responsabilité
    const linkedCashiers = cashiers.filter(c => c.managerId === manager.id);
    
    if (linkedCashiers.length > 0) {
      toast.error(
        `Impossible de supprimer ce manager: ${linkedCashiers.length} caissier(s) sous sa responsabilité. ` +
        `Veuillez d'abord réaffecter ou supprimer les caissiers.`
      );
      return;
    }
    
    // Demander confirmation finale
    if (confirm(`Êtes-vous sûr de vouloir supprimer le manager "${manager.name}" ?`)) {
      deleteManager(manager.id);
      toast.success('Manager supprimé avec succès');
    }
  };

  const handleResetPassword = (manager: Manager) => {
    // 🚀 BACKEND-READY: Appeler votre API NestJS
    // const response = await fetch('/api/auth/reset-password', {
    //   method: 'POST',
    //   headers: { 'Content-Type': 'application/json' },
    //   body: JSON.stringify({
    //     email: manager.email,
    //     redirectUrl: `${window.location.origin}/reset-password`,
    //   })
    // });
    //
    // if (!response.ok) {
    //   const error = await response.json();
    //   toast.error('Erreur lors de l\'envoi de l\'email: ' + error.message);
    //   return;
    // }
    
    toast.success(`Email de réinitialisation envoyé à ${manager.email}`);
  };

  const activeManagers = managers.filter(m => m.status === 'active');
  const inactiveManagers = managers.filter(m => m.status === 'inactive');

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Managers de Gare
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Gérez les responsables de vos gares
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
          Nouveau manager
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total managers</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">
                {managers.length}
              </p>
            </div>
            <UserCheck className="text-gray-400" size={32} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Managers actifs</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {activeManagers.length}
              </p>
            </div>
            <CheckCircle className="text-green-600 dark:text-green-400" size={32} />
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Managers inactifs</p>
              <p className="text-2xl font-bold text-red-600 dark:text-red-400">
                {inactiveManagers.length}
              </p>
            </div>
            <XCircle className="text-red-600 dark:text-red-400" size={32} />
          </div>
        </Card>
      </div>

      {/* Managers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {managers.length === 0 ? (
          <div className="col-span-full text-center py-12 text-gray-500 dark:text-gray-400">
            <UserCheck size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-lg">Aucun manager enregistré</p>
            <p className="text-sm">Ajoutez votre premier manager pour commencer</p>
          </div>
        ) : (
          managers.map((manager) => (
            <Card key={manager.id} className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h3 className="font-bold text-gray-900 dark:text-white">
                      {manager.name}
                    </h3>
                    <Badge
                      className={
                        manager.status === 'active'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400'
                          : 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400'
                      }
                    >
                      {manager.status === 'active' ? 'Actif' : 'Inactif'}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">
                    Depuis le {new Date(manager.joinedDate).toLocaleDateString('fr-FR')}
                  </p>
                </div>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
                  <span>{manager.gareName}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Mail size={16} className="text-gray-500 dark:text-gray-400" />
                  <span>{manager.email}</span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Phone size={16} className="text-gray-500 dark:text-gray-400" />
                  <span>{manager.phone}</span>
                </div>

                {/* ✅ Affichage du mot de passe avec toggle */}
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <Lock size={16} className="text-gray-500 dark:text-gray-400" />
                  <span className="flex-1 font-mono">
                    {showPasswords[manager.id] ? manager.password : '••••••••'}
                  </span>
                  <button
                    type="button"
                    onClick={() => setShowPasswords(prev => ({ ...prev, [manager.id]: !prev[manager.id] }))}
                    className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
                    title={showPasswords[manager.id] ? 'Masquer le mot de passe' : 'Afficher le mot de passe'}
                  >
                    {showPasswords[manager.id] ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>

                {/* ✅ Indication de connexion configurée */}
                <div className="flex items-center gap-2 text-sm text-blue-600 dark:text-blue-400 pt-2">
                  <Lock size={16} />
                  <span className="font-medium">Accès configuré</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-200 dark:border-gray-700">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleEdit(manager)}
                  className="flex-1"
                >
                  <Edit size={16} className="mr-1" />
                  Modifier
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleDelete(manager)}
                  className="text-red-600 hover:text-red-700 dark:text-red-400"
                  title="Supprimer"
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
        title="Nouveau manager"
        description="Ajoutez un nouveau manager de gare"
        onSubmit={handleAdd}
        submitLabel="Créer le manager"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="name">Nom complet *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Marie Kaboré"
            />
          </div>

          <div>
            <Label htmlFor="email">Email *</Label>
            <Input
              id="email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Ex: marie.kabore@tsr.bf"
            />
          </div>

          <div>
            <Label htmlFor="phone">Téléphone *</Label>
            <Input
              id="phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ex: +226 70 11 22 33"
            />
          </div>

          <div>
            <Label htmlFor="gare">Gare affectée *</Label>
            <Select
              value={formData.gareId}
              onValueChange={(value) => setFormData({ ...formData, gareId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une gare" />
              </SelectTrigger>
              <SelectContent>
                {stations
                  .filter(s => s.status === 'active')
                  .map(station => (
                    <SelectItem key={station.id} value={station.id}>
                      {station.name}
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
              <SelectTrigger className="text-gray-900 dark:text-white">
                <SelectValue>
                  <span className="text-gray-900 dark:text-white">
                    {formData.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label htmlFor="password">Mot de passe *</Label>
            <PasswordInput
              id="password"
              value={formData.password}
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              placeholder="Minimum 8 caractères"
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
              <Lock size={12} className="inline mr-1" />
              Ces identifiants permettront au manager de se connecter à l'application
            </p>
          </div>

          <div>
            <Label htmlFor="passwordConfirm">Confirmez le mot de passe *</Label>
            <PasswordInput
              id="passwordConfirm"
              value={formData.passwordConfirm}
              onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
              placeholder="Retapez le mot de passe"
            />
          </div>
        </div>
      </FormDialog>

      {/* Edit Dialog */}
      <FormDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        title="Modifier le manager"
        description="Modifiez les informations du manager"
        onSubmit={handleUpdate}
        submitLabel="Enregistrer"
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="edit-name">Nom complet *</Label>
            <Input
              id="edit-name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="Ex: Marie Kaboré"
            />
          </div>

          <div>
            <Label htmlFor="edit-email">Email *</Label>
            <Input
              id="edit-email"
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              placeholder="Ex: marie.kabore@tsr.bf"
            />
          </div>

          <div>
            <Label htmlFor="edit-phone">Téléphone *</Label>
            <Input
              id="edit-phone"
              type="tel"
              value={formData.phone}
              onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              placeholder="Ex: +226 70 11 22 33"
            />
          </div>

          <div>
            <Label htmlFor="edit-gare">Gare affectée *</Label>
            <Select
              value={formData.gareId}
              onValueChange={(value) => setFormData({ ...formData, gareId: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="Sélectionnez une gare" />
              </SelectTrigger>
              <SelectContent>
                {stations
                  .filter(s => s.status === 'active')
                  .map(station => (
                    <SelectItem key={station.id} value={station.id}>
                      {station.name}
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
              <SelectTrigger className="text-gray-900 dark:text-white">
                <SelectValue>
                  <span className="text-gray-900 dark:text-white">
                    {formData.status === 'active' ? 'Actif' : 'Inactif'}
                  </span>
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Actif</SelectItem>
                <SelectItem value="inactive">Inactif</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* ✅ Champs pour modifier le mot de passe (optionnels) */}
          <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Modifier le mot de passe (optionnel)
            </p>
            
            <div className="space-y-3">
              <div>
                <Label htmlFor="edit-password">Nouveau mot de passe</Label>
                <PasswordInput
                  id="edit-password"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  placeholder="Laisser vide pour ne pas changer"
                />
              </div>

              <div>
                <Label htmlFor="edit-passwordConfirm">Confirmer le nouveau mot de passe</Label>
                <PasswordInput
                  id="edit-passwordConfirm"
                  value={formData.passwordConfirm}
                  onChange={(e) => setFormData({ ...formData, passwordConfirm: e.target.value })}
                  placeholder="Confirmer le nouveau mot de passe"
                />
              </div>
            </div>
          </div>
        </div>
      </FormDialog>
    </div>
  );
}