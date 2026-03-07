import { useState, useMemo } from 'react';
import { Plus, Trash2, Edit2, Check, Upload } from "lucide-react";
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/back-button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { useData } from '../../contexts/DataContext';
import { toast } from 'sonner';
import { createLogger } from '../../utils/logger';
import { uploadFile, validateFile, type UploadedFile } from '../../utils/fileUpload';

const logger = createLogger('PromotionsPage', 'general');

export default function PromotionsPage() {
  const { promotions, addPromotion, updatePromotion, deletePromotion, trips } = useData();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'draft' | 'active' | 'paused' | 'expired'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [uploadedPromoFile, setUploadedPromoFile] = useState<UploadedFile | null>(null);
  const [isPromoUploading, setIsPromoUploading] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    discountType: 'PERCENTAGE' as 'PERCENTAGE' | 'FIXED_AMOUNT',
    discountValue: 0,
    tripId: '',
    startDate: '',
    endDate: '',
    maxUses: '',
    maxUsesPerUser: '',
    status: 'draft' as 'draft' | 'active' | 'paused' | 'expired',
    mediaUrl: '',
    mediaType: '' as '' | 'image' | 'video'
  });

  const filteredPromotions = useMemo(() => {
    return promotions.filter(promo => {
      const matchesStatus = filterStatus === 'all' || promo.status === filterStatus;
      const matchesSearch = promo.title.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesStatus && matchesSearch;
    });
  }, [promotions, filterStatus, searchTerm]);

  // ✅ Statistiques
  const stats = useMemo(() => {
    const active = promotions.filter(p => p.status === 'active').length;
    const totalDiscount = promotions
      .filter(p => p.status === 'active')
      .reduce((sum, p) => sum + (p.discount_value || 0), 0);
    
    return { active, totalDiscount };
  }, [promotions]);

  const handleReset = () => {
    setFormData({
      title: '',
      description: '',
      discountType: 'PERCENTAGE',
      discountValue: 0,
      tripId: '',
      startDate: '',
      endDate: '',
      maxUses: '',
      maxUsesPerUser: '',
      status: 'draft',
      mediaUrl: '',
      mediaType: ''
    });
    setUploadedPromoFile(null);
    setEditingId(null);
  };

  // ✅ NOUVEAU: Handler pour uploader une image/vidéo à la promotion
  const handlePromoFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation
    const validation = validateFile(file);
    if (!validation.valid) {
      toast.error(validation.error || 'Erreur de validation');
      e.target.value = '';
      return;
    }

    setIsPromoUploading(true);
    try {
      const uploaded = await uploadFile(file);
      setUploadedPromoFile(uploaded);
      setFormData(prev => ({
        ...prev,
        mediaUrl: uploaded.url,
        mediaType: uploaded.type
      }));
      toast.success('Media uploader avec succès !');
      logger.info('✅ Promo media uploadée', { type: uploaded.type });
    } catch (error) {
      logger.error('Erreur upload promo media', error);
      toast.error('Erreur lors de l\'upload');
    } finally {
      setIsPromoUploading(false);
      e.target.value = '';
    }
  };

  const triggerPromoFileInput = () => {
    document.getElementById('promo-file-input')?.click();
  };

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette promotion ?')) {
      deletePromotion(id);
      toast.success('Promotion supprimée');
    }
  };

  const handleEdit = (promo: typeof promotions[0]) => {
    setFormData({
      title: promo.title,
      description: promo.description || '',
      discountType: promo.discount_type,
      discountValue: promo.discount_value,
      tripId: promo.trip_id || '',
      startDate: promo.start_date,
      endDate: promo.end_date,
      maxUses: promo.max_uses?.toString() || '',
      maxUsesPerUser: (promo as any).max_uses_per_user?.toString() || '',
      status: promo.status,
      mediaUrl: promo.mediaUrl || '',
      mediaType: promo.mediaType || ''
    });
    
    // Charger la media si elle existe
    if (promo.mediaUrl && promo.mediaType) {
      setUploadedPromoFile({
        url: promo.mediaUrl,
        type: promo.mediaType
      });
    } else {
      setUploadedPromoFile(null);
    }
    
    setEditingId(promo.promotion_id);
    setIsDialogOpen(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validation
    if (!formData.title.trim()) {
      toast.error('Veuillez saisir un titre');
      return;
    }

    if (!formData.startDate || !formData.endDate) {
      toast.error('Veuillez sélectionner les dates');
      return;
    }

    if (new Date(formData.endDate) <= new Date(formData.startDate)) {
      toast.error('La date de fin doit être après la date de début');
      return;
    }

    if (formData.discountValue <= 0) {
      toast.error('La réduction doit être supérieure à zéro');
      return;
    }

    try {
      if (editingId) {
        // ✅ Mise à jour
        updatePromotion(editingId, {
          title: formData.title,
          description: formData.description || undefined,
          discount_type: formData.discountType,
          discount_value: formData.discountValue,
          trip_id: formData.tripId || undefined,
          start_date: formData.startDate,
          end_date: formData.endDate,
          max_uses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
          max_uses_per_user: formData.maxUsesPerUser ? parseInt(formData.maxUsesPerUser) : undefined,
          status: formData.status,
          mediaUrl: formData.mediaUrl || undefined,
          mediaType: (formData.mediaType as any) || undefined
        });
        logger.info('✅ Promotion mise à jour', { id: editingId, title: formData.title });
        toast.success('Promotion mise à jour');
      } else {
        // ✅ Création
        addPromotion({
          title: formData.title,
          description: formData.description || undefined,
          discount_type: formData.discountType,
          discount_value: formData.discountValue,
          trip_id: formData.tripId || undefined,
          start_date: formData.startDate,
          end_date: formData.endDate,
          max_uses: formData.maxUses ? parseInt(formData.maxUses) : undefined,
          max_uses_per_user: formData.maxUsesPerUser ? parseInt(formData.maxUsesPerUser) : undefined,
          status: formData.status,
          mediaUrl: formData.mediaUrl || undefined,
          mediaType: (formData.mediaType as any) || undefined
        });
        logger.info('✅ Promotion créée', { title: formData.title });
        toast.success('Promotion créée');
      }

      setIsDialogOpen(false);
      handleReset();
    } catch (error) {
      logger.error('❌ Erreur', error);
      toast.error('Erreur lors de la sauvegarde');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-7xl mx-auto">
        {/* ✅ Back + Title */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <BackButton />
            <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Promotions</h1>
          </div>
          <Button
            onClick={() => {
              handleReset();
              setIsDialogOpen(true);
            }}
            className="gap-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700 text-white"
          >
            <Plus className="w-4 h-4" />
            Nouvelle
          </Button>
        </div>

        {/* ✅ Stats - Dashboard du responsable */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Promotions actives</p>
                <p className="text-4xl font-bold text-blue-600 dark:text-blue-400 mt-2">{stats.active}</p>
              </div>
              <div className="w-14 h-14 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Réduction totale</p>
                <p className="text-4xl font-bold text-green-600 dark:text-green-400 mt-2">{(stats.totalDiscount / 1000).toFixed(0)}K</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">FCFA</p>
              </div>
              <div className="w-14 h-14 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
          </Card>

          <Card className="p-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 font-medium">Total promotions</p>
                <p className="text-4xl font-bold text-purple-600 dark:text-purple-400 mt-2">{promotions.length}</p>
              </div>
              <div className="w-14 h-14 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center">
                <svg className="w-7 h-7 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                </svg>
              </div>
            </div>
          </Card>
        </div>

        {/* ✅ Filters */}
        <Card className="p-4 mb-6 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 shadow-sm">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">Rechercher</Label>
              <Input
                placeholder="Titre de la promotion..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mt-1 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
            </div>
            <div>
              <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">Statut</Label>
              <select
                aria-label="Filtrer par statut"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value as any)}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">Tous</option>
                <option value="draft">Brouillon</option>
                <option value="active">Actif</option>
                <option value="paused">En pause</option>
                <option value="expired">Expiré</option>
              </select>
            </div>
          </div>
        </Card>

        {/* ✅ List */}
        <div className="space-y-3">
          {filteredPromotions.length === 0 ? (
            <Card className="p-8 text-center bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
              <p className="text-gray-500 dark:text-gray-400">Aucune promotion trouvée</p>
            </Card>
          ) : (
            filteredPromotions.map(promo => (
              <Card key={promo.promotion_id} className="p-4 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:shadow-md dark:hover:shadow-lg dark:hover:shadow-gray-700/50 transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2 flex-wrap">
                      <h3 className="font-semibold text-gray-800 dark:text-white">{promo.title}</h3>
                      <div className="flex gap-2 flex-wrap">
                        <Badge
                          variant={
                            promo.status === 'active' ? 'default' :
                            promo.status === 'draft' ? 'secondary' :
                            promo.status === 'paused' ? 'outline' :
                            'destructive'
                          }
                        >
                          {promo.status === 'active' ? 'Actif' :
                           promo.status === 'draft' ? 'Brouillon' :
                           promo.status === 'paused' ? 'En pause' :
                           'Expiré'}
                        </Badge>

                        {/* ✅ Badge d'approbation admin */}
                        <Badge
                          variant={
                            promo.approval_status === 'active_approved' ? 'default' :
                            promo.approval_status === 'pending_validation' ? 'outline' :
                            'destructive'
                          }
                          className={
                            promo.approval_status === 'pending_validation' 
                              ? 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700'
                              : promo.approval_status === 'active_approved'
                              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300'
                              : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300'
                          }
                        >
                          {promo.approval_status === 'pending_validation' ? '⏳ En attente' :
                           promo.approval_status === 'active_approved' ? '✓ Approuvée' :
                           '✕ Rejetée'}
                        </Badge>
                      </div>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{promo.description}</p>
                    
                    {/* ✅ Raison de rejet si applicable */}
                    {promo.approval_status === 'rejected' && promo.rejection_reason && (
                      <p className="text-sm text-red-600 dark:text-red-400 mb-2">
                        <span className="font-semibold">Raison du rejet:</span> {promo.rejection_reason}
                      </p>
                    )}

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm text-gray-700 dark:text-gray-300">
                      <div>
                        <span className="font-semibold text-blue-600 dark:text-blue-400">
                          {promo.discount_type === 'PERCENTAGE' ? `${promo.discount_value}%` : `${promo.discount_value.toLocaleString('fr-FR')} FCFA`}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Début:</span> {new Date(promo.start_date).toLocaleDateString('fr-FR')}
                      </div>
                      <div>
                        <span className="text-gray-600 dark:text-gray-400">Fin:</span> {new Date(promo.end_date).toLocaleDateString('fr-FR')}
                      </div>
                      {promo.trip_id && (
                        <div className="text-gray-600 dark:text-gray-400">
                          Trajet spécifique
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleEdit(promo)}
                      className="gap-1 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-800/50 text-blue-700 dark:text-blue-300"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => handleDelete(promo.promotion_id)}
                      className="gap-1 bg-red-600 hover:bg-red-700 dark:bg-red-600 dark:hover:bg-red-700 text-white"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* ✅ Dialog Add/Edit */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>{editingId ? 'Modifier' : 'Nouvelle'} Promotion</DialogTitle>
            <DialogDescription>
              Créez ou modifiez une promotion pour attirer les clients
              {!editingId && (
                <div className="mt-2 p-3 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-700 rounded text-orange-700 dark:text-orange-300 text-sm">
                  ℹ️ Toute nouvelle promotion sera soumise à validation administrateur avant d'être activée
                </div>
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4 overflow-y-auto flex-1 pr-4">
            {/* ✅ Titre */}
            <div>
              <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">Titre *</Label>
              <Input
                placeholder="ex: Réduction hiver 25%"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="mt-1 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
            </div>

            {/* ✅ Description */}
            <div>
              <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">Description</Label>
              <textarea
                placeholder="Description détaillée de la promotion..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows={2}
              />
            </div>

            {/* ✅ NOUVEAU: Image/Vidéo pour la promotion (affichage dans Stories) */}
            <div>
              <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">Image/Vidéo pour Stories (optionnel)</Label>
              <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">Cette image/vidéo sera affichée dans les Stories pour rediriger vers votre promotion</p>
              
              {/* Input file caché */}
              <input
                type="file"
                id="promo-file-input"
                title="Uploader une image ou vidéo pour votre promotion"
                aria-label="Fichier media promo"
                className="hidden"
                accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm"
                onChange={handlePromoFileUpload}
                disabled={isPromoUploading}
              />

              {/* Zone upload */}
              <div 
                onClick={triggerPromoFileInput}
                className={`mt-2 border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer ${
                  uploadedPromoFile 
                    ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                    : isPromoUploading
                      ? 'border-yellow-500 bg-yellow-50 dark:bg-yellow-900/10'
                      : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                }`}
              >
                {isPromoUploading ? (
                  <>
                    <div className="animate-spin mx-auto mb-2 w-6 h-6 border-3 border-blue-500 border-t-transparent rounded-full" />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Upload en cours...</p>
                  </>
                ) : uploadedPromoFile ? (
                  <div className="flex flex-col items-center justify-center gap-2">
                    {uploadedPromoFile.type === 'image' ? (
                      <img 
                        src={uploadedPromoFile.url} 
                        alt="Preview" 
                        className="w-16 h-16 object-cover rounded"
                      />
                    ) : (
                      <video 
                        src={uploadedPromoFile.url} 
                        className="w-16 h-16 object-cover rounded"
                      />
                    )}
                    <p className="text-sm text-green-600 dark:text-green-400">✓ {uploadedPromoFile.type === 'image' ? 'Image' : 'Vidéo'} uploadée</p>
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setUploadedPromoFile(null);
                        setFormData(prev => ({ ...prev, mediaUrl: '', mediaType: '' }));
                      }}
                      className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 px-2 py-1 rounded"
                    >
                      Supprimer
                    </button>
                  </div>
                ) : (
                  <>
                    <Upload className="mx-auto mb-2 text-gray-400" size={24} />
                    <p className="text-sm text-gray-600 dark:text-gray-400">Cliquez pour uploader</p>
                    <p className="text-xs text-gray-500 dark:text-gray-500">JPG, PNG, WebP ou MP4 (max 10MB images, 100MB vidéos)</p>
                  </>
                )}
              </div>
            </div>

            {/* ✅ Réduction */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">Type *</Label>
                <select
                  aria-label="Type de réduction"
                  value={formData.discountType}
                  onChange={(e) => setFormData({ ...formData, discountType: e.target.value as any })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="PERCENTAGE">Pourcentage %</option>
                  <option value="FIXED_AMOUNT">Montant fixe FCFA</option>
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">Valeur *</Label>
                <Input
                  type="number"
                  placeholder="0"
                  min="0"
                  step={formData.discountType === 'PERCENTAGE' ? '1' : '100'}
                  value={formData.discountValue}
                  onChange={(e) => setFormData({ ...formData, discountValue: parseFloat(e.target.value) || 0 })}
                  className="mt-1 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>

            {/* ✅ Dates */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">Début *</Label>
                <Input
                  type="date"
                  value={formData.startDate}
                  onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                  className="mt-1 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">Fin *</Label>
                <Input
                  type="date"
                  value={formData.endDate}
                  onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                  className="mt-1 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
              </div>
            </div>

            {/* ✅ Trajet et Utilisations */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">Trajet spécifique (optionnel)</Label>
                <select
                  aria-label="Sélectionner un trajet spécifique"
                  value={formData.tripId}
                  onChange={(e) => setFormData({ ...formData, tripId: e.target.value })}
                  className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Global (tous les trajets)</option>
                  {trips.map(trip => (
                    <option key={trip.id} value={trip.id}>
                      {trip.departure} → {trip.arrival}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">Nombre d'utilisations total *</Label>
                <Input
                  type="number"
                  placeholder="Illimité"
                  min="1"
                  value={formData.maxUses}
                  onChange={(e) => setFormData({ ...formData, maxUses: e.target.value })}
                  className="mt-1 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
                />
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  ℹ️ Nombre total de billet(s) pouvant bénéficier de cette promo. Exemple: 100 = 100 passagers max (n'importe qui peut l'utiliser)
                </p>
              </div>
            </div>

            {/* ✅ Limite par utilisateur */}
            <div>
              <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">Limite d'utilisation par utilisateur (optionnel)</Label>
              <Input
                type="number"
                placeholder="Illimité (par défaut)"
                min="1"
                value={formData.maxUsesPerUser}
                onChange={(e) => setFormData({ ...formData, maxUsesPerUser: e.target.value })}
                className="mt-1 placeholder:text-gray-500 dark:placeholder:text-gray-400 text-gray-900 dark:text-white bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600"
              />
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                ℹ️ Nombre maximum de fois qu'UN utilisateur peut utiliser cette promo. Exemple: 5 = chaque passager peut l'utiliser max 5 fois
              </p>
            </div>

            {/* ✅ Statut */}
            <div>
              <Label className="text-sm font-medium text-gray-800 dark:text-gray-200">Statut *</Label>
              <select
                aria-label="Sélectionner le statut de la promotion"
                value={formData.status}
                onChange={(e) => setFormData({ ...formData, status: e.target.value as any })}
                className="w-full mt-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-medium focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="draft">Brouillon</option>
                <option value="active">Actif</option>
                <option value="paused">En pause</option>
                <option value="expired">Expiré</option>
              </select>
            </div>

            {/* ✅ Actions */}
            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setIsDialogOpen(false);
                  handleReset();
                }}
              >
                Annuler
              </Button>
              <Button type="submit" className="gap-2">
                <Check className="w-4 h-4" />
                {editingId ? 'Mettre à jour' : 'Créer'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
