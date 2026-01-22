import { useState } from 'react';
import { Plus, Upload, Eye, Trash2, Clock, Users, Target } from "lucide-react";
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

// Logger pour les stories
const logger = createLogger('StoriesPage', 'general');

export default function StoriesPage() {
  const { stories, addStory, deleteStory } = useData();
  
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [selectedStory, setSelectedStory] = useState<typeof stories[0] | null>(null);
  const [uploadedFile, setUploadedFile] = useState<{ url: string; type: 'image' | 'video'; duration?: number } | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    duration: '10',
    targeting: 'all' as 'all' | 'route' | 'city' | 'station',
    targetValue: '',
    actionType: 'none' as 'none' | 'book_route' | 'view_company',
    actionLabel: '',
    startDate: '',
    endDate: ''
  });

  const handleDelete = (id: string) => {
    if (confirm('Êtes-vous sûr de vouloir supprimer cette story ?')) {
      deleteStory(id);
    }
  };

  const handleView = (story: typeof stories[0]) => {
    setSelectedStory(story);
    setIsViewDialogOpen(true);
  };

  // ✅ Handler pour l'upload de fichier
  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validation du type de fichier
    const validImageTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    const validVideoTypes = ['video/mp4', 'video/webm'];
    const isImage = validImageTypes.includes(file.type);
    const isVideo = validVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      toast.error('Format de fichier non supporté. Utilisez JPG, PNG ou MP4.');
      e.target.value = ''; // Réinitialiser l'input
      return;
    }

    // Validation de la taille (différente pour images et vidéos)
    const maxImageSize = 10 * 1024 * 1024; // 10MB pour les images
    const maxVideoSize = 100 * 1024 * 1024; // 100MB pour les vidéos
    
    if (isImage && file.size > maxImageSize) {
      toast.error('Image trop volumineuse. Taille maximale : 10MB');
      e.target.value = ''; // Réinitialiser l'input
      return;
    }
    
    if (isVideo && file.size > maxVideoSize) {
      toast.error('Vidéo trop volumineuse. Taille maximale : 100MB');
      e.target.value = ''; // Réinitialiser l'input
      return;
    }

    setIsUploading(true);

    try {
      // 🚀 BACKEND-READY: Uploader le fichier via votre API NestJS
      // const formData = new FormData();
      // formData.append('file', file);
      // 
      // const response = await fetch('/api/stories/upload', {
      //   method: 'POST',
      //   body: formData
      // });
      // 
      // if (!response.ok) throw new Error('Upload failed');
      // const { url } = await response.json();

      // ⚠️ MOCK pour l'instant : Créer une URL locale temporaire
      const mockUrl = URL.createObjectURL(file);
      
      // ✅ Si c'est une vidéo, extraire automatiquement la durée
      if (isVideo) {
        const video = document.createElement('video');
        video.preload = 'metadata';
        
        video.onloadedmetadata = () => {
          // ✅ NE PAS révoquer l'URL - on en a besoin pour afficher la vidéo !
          const videoDuration = Math.round(video.duration);
          
          setUploadedFile({
            url: mockUrl,
            type: 'video',
            duration: videoDuration
          });
          
          toast.success(`Vidéo uploadée (${videoDuration}s) !`);
          setIsUploading(false);
          e.target.value = ''; // Réinitialiser l'input
        };
        
        video.onerror = () => {
          toast.error('Erreur lors de la lecture de la vidéo');
          URL.revokeObjectURL(mockUrl); // Nettoyer seulement en cas d'erreur
          setIsUploading(false);
          e.target.value = ''; // Réinitialiser l'input
        };
        
        video.src = mockUrl;
      } else {
        // ✅ Si c'est une image, pas de durée automatique
        setUploadedFile({
          url: mockUrl,
          type: 'image'
        });
        
        toast.success('Image uploadée avec succès !');
        setIsUploading(false);
        e.target.value = ''; // Réinitialiser l'input
      }
      
    } catch (error) {
      logger.error('Erreur lors de l\'upload', error);
      toast.error('Erreur lors de l\'upload du fichier');
      setIsUploading(false);
      e.target.value = ''; // Réinitialiser l'input
    }
  };

  // ✅ Handler pour déclencher l'input file
  const triggerFileInput = (e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    document.getElementById('story-file-input')?.click();
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // ✅ Validation : fichier obligatoire
    if (!uploadedFile) {
      toast.error('Veuillez uploader une image ou vidéo');
      return;
    }

    // ✅ Validation : titre obligatoire
    if (!formData.title.trim()) {
      toast.error('Veuillez saisir un titre');
      return;
    }

    // ✅ Validation : dates obligatoires
    if (!formData.startDate || !formData.endDate) {
      toast.error('Veuillez sélectionner les dates de début et fin');
      return;
    }

    // ✅ Validation : durée pour les images
    if (uploadedFile.type === 'image' && (!formData.duration || parseInt(formData.duration) < 5)) {
      toast.error('La durée doit être d\'au moins 5 secondes');
      return;
    }

    // ✅ Validation : ciblage spécifique
    if (formData.targeting !== 'all' && !formData.targetValue) {
      toast.error('Veuillez spécifier la cible');
      return;
    }

    // ✅ Déterminer le statut selon les dates
    const now = new Date();
    const start = new Date(formData.startDate);
    const end = new Date(formData.endDate);
    
    // Validation : date de fin après date de début
    if (end <= start) {
      toast.error('La date de fin doit être après la date de début');
      return;
    }
    
    let status: 'active' | 'scheduled' | 'expired' = 'active';
    if (start > now) {
      status = 'scheduled';
    } else if (end < now) {
      status = 'expired';
    }

    // ✅ Utiliser la durée de la vidéo si c'est une vidéo, sinon celle du formulaire
    const finalDuration = uploadedFile.type === 'video' && uploadedFile.duration 
      ? uploadedFile.duration 
      : parseInt(formData.duration);

    try {
      logger.debug('Création de story', {
        title: formData.title,
        mediaType: uploadedFile.type,
        duration: finalDuration,
        targeting: formData.targeting
      });

      addStory({
        title: formData.title,
        mediaUrl: uploadedFile.url,
        mediaType: uploadedFile.type,
        duration: finalDuration,
        targeting: formData.targeting,
        targetValue: formData.targetValue || undefined,
        actionType: formData.actionType !== 'none' ? formData.actionType : undefined,
        actionLabel: formData.actionLabel || undefined,
        startDate: formData.startDate,
        endDate: formData.endDate,
        status
      });

      logger.info('✅ Story créée avec succès', { 
        title: formData.title, 
        status 
      });
      setIsDialogOpen(false);
      resetForm();
      toast.success('Story créée avec succès !');
    } catch (error) {
      logger.error('❌ Erreur lors de la création de la story', error);
      toast.error('Erreur lors de la création de la story');
    }
  };

  const resetForm = () => {
    setFormData({
      title: '',
      duration: '10',
      targeting: 'all',
      targetValue: '',
      actionType: 'none',
      actionLabel: '', // ✅ Réinitialiser le texte du bouton CTA
      startDate: '',
      endDate: ''
    });
    setUploadedFile(null);
  };

  const getStatusBadge = (status: typeof stories[0]['status']) => {
    const configs = {
      active: { label: 'En cours', className: 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400' },
      scheduled: { label: 'Programmée', className: 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
      expired: { label: 'Terminée', className: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' }
    };
    return <Badge className={configs[status].className}>{configs[status].label}</Badge>;
  };

  const getTargetingLabel = (story: typeof stories[0]) => {
    if (story.targeting === 'all') return 'Tous les utilisateurs';
    if (story.targeting === 'route') return `Ligne: ${story.targetValue}`;
    if (story.targeting === 'city') return `Ville: ${story.targetValue}`;
    if (story.targeting === 'station') return `Station: ${story.targetValue}`;
    return '';
  };

  const totalViews = stories.reduce((acc: any, s: any) => acc + s.views, 0);
  const totalClicks = stories.reduce((acc: any, s: any) => acc + s.clicks, 0);
  const activeStories = stories.filter(s => s.status === 'active');

  return (
    <div className="p-6 space-y-6">
      <BackButton />
      
      {/* En-tête */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Stories & Marketing
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Créez des stories publicitaires avec ciblage personnalisé
          </p>
        </div>
        <Button onClick={() => setIsDialogOpen(true)} className="tf-btn-primary">
          <Plus size={20} className="mr-2" />
          Nouvelle story
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Stories actives</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">{activeStories.length}</p>
            </div>
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
              <Eye className="text-green-600 dark:text-green-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total stories</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stories.length}</p>
            </div>
            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/20 rounded-full flex items-center justify-center">
              <Upload className="text-blue-600 dark:text-blue-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Total vues</p>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">{totalViews.toLocaleString()}</p>
            </div>
            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/20 rounded-full flex items-center justify-center">
              <Users className="text-purple-600 dark:text-purple-400" size={24} />
            </div>
          </div>
        </Card>

        <Card className="p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Taux de clic</p>
              <p className="text-2xl font-bold text-[#f59e0b]">
                {totalViews > 0 ? ((totalClicks / totalViews) * 100).toFixed(1) : 0}%
              </p>
            </div>
            <div className="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/20 rounded-full flex items-center justify-center">
              <Target className="text-[#f59e0b]" size={24} />
            </div>
          </div>
        </Card>
      </div>

      {/* Grille des stories */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {stories.map(story => (
          <Card key={story.id} className="overflow-hidden hover:shadow-lg transition-shadow">
            {/* ✅ Aperçu média : vidéo ou image */}
            <div className="h-48 bg-gray-100 dark:bg-gray-800 relative overflow-hidden">
              {story.mediaType === 'video' ? (
                <video 
                  src={story.mediaUrl} 
                  className="w-full h-full object-cover"
                  muted
                  playsInline
                />
              ) : (
                <div 
                  className="w-full h-full bg-cover bg-center"
                  style={{ backgroundImage: `url(${story.mediaUrl})` }}
                />
              )}
              
              <div className="absolute top-3 right-3">
                {getStatusBadge(story.status)}
              </div>
              <div className="absolute bottom-3 left-3 bg-black/60 backdrop-blur-sm px-3 py-1 rounded-full">
                <div className="flex items-center gap-2 text-white text-sm">
                  <Clock size={14} />
                  <span>{story.duration}s</span>
                </div>
              </div>
            </div>

            {/* Contenu */}
            <div className="p-4">
              <h3 className="font-bold text-gray-900 dark:text-white mb-2">
                {story.title}
              </h3>

              <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 mb-3">
                <Target size={14} />
                <span>{getTargetingLabel(story)}</span>
              </div>

              <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Vues</p>
                  <p className="font-bold text-gray-900 dark:text-white">{story.views.toLocaleString()}</p>
                </div>
                <div>
                  <p className="text-gray-500 dark:text-gray-400">Clics</p>
                  <p className="font-bold text-gray-900 dark:text-white">{story.clicks}</p>
                </div>
              </div>

              <div className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                <p>Du {new Date(story.startDate).toLocaleDateString('fr-FR')}</p>
                <p>Au {new Date(story.endDate).toLocaleDateString('fr-FR')}</p>
              </div>

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleView(story)}
                  className="flex-1"
                >
                  <Eye size={16} className="mr-2" />
                  Voir
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDelete(story.id)}
                  className="text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20"
                >
                  <Trash2 size={16} />
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {/* Dialog Création */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Nouvelle story</DialogTitle>
            <DialogDescription>
              Créez une story publicitaire avec ciblage personnalisé
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Titre de la story *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Ex: Promotion Noël 2024"
                  required
                />
              </div>

              <div>
                <Label htmlFor="image">Image/Vidéo *</Label>
                {/* Input file caché */}
                <input
                  type="file"
                  id="story-file-input"
                  className="hidden"
                  accept="image/jpeg,image/jpg,image/png,image/webp,video/mp4,video/webm"
                  onChange={handleFileUpload}
                  aria-label="Uploader image ou vidéo"
                />
                
                {/* Zone de drop visuelle cliquable */}
                <div 
                  onClick={triggerFileInput}
                  className={`mt-2 border-2 border-dashed rounded-lg p-8 text-center transition-colors cursor-pointer ${
                    uploadedFile 
                      ? 'border-green-500 bg-green-50 dark:bg-green-900/10' 
                      : isUploading
                        ? 'border-[#f59e0b] bg-yellow-50 dark:bg-yellow-900/10'
                        : 'border-gray-300 dark:border-gray-600 hover:border-[#f59e0b]'
                  }`}
                >
                  {isUploading ? (
                    <>
                      <div className="animate-spin mx-auto mb-2 w-8 h-8 border-4 border-[#f59e0b] border-t-transparent rounded-full" />
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        Upload en cours...
                      </p>
                    </>
                  ) : uploadedFile ? (
                    <>
                      <div className="mx-auto mb-2 w-12 h-12 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center">
                        <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <p className="text-sm text-green-600 dark:text-green-400 mb-1">
                        Fichier uploadé avec succès
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Type: {uploadedFile.type === 'image' ? 'Image' : 'Vidéo'}
                        {uploadedFile.duration && ` • Durée: ${uploadedFile.duration}s`}
                      </p>
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        Cliquez pour changer
                      </p>
                    </>
                  ) : (
                    <>
                      <Upload className="mx-auto mb-2 text-gray-500 dark:text-gray-400" size={32} />
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Cliquez pour uploader ou glissez-déposez
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        JPG, PNG ou MP4 (max. 10MB pour les images, 100MB pour les vidéos)
                      </p>
                    </>
                  )}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                {/* ✅ Afficher le champ durée seulement pour les images */}
                {(!uploadedFile || uploadedFile.type === 'image') && (
                  <div>
                    <Label htmlFor="duration">Durée d'affichage (secondes) *</Label>
                    <Input
                      id="duration"
                      type="number"
                      min="5"
                      max="30"
                      value={formData.duration}
                      onChange={(e) => setFormData({ ...formData, duration: e.target.value })}
                      required
                    />
                  </div>
                )}

                {/* ✅ Afficher un message informatif pour les vidéos */}
                {uploadedFile?.type === 'video' && uploadedFile.duration && (
                  <div>
                    <Label>Durée de la vidéo</Label>
                    <div className="mt-2 px-3 py-2 bg-blue-50 dark:bg-blue-900/10 border border-blue-200 dark:border-blue-800 rounded-lg">
                      <p className="text-sm text-blue-700 dark:text-blue-300 flex items-center gap-2">
                        <Clock size={16} />
                        {uploadedFile.duration} secondes (automatique)
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <Label htmlFor="targeting">Ciblage *</Label>
                  <select
                    id="targeting"
                    value={formData.targeting}
                    onChange={(e) => setFormData({ ...formData, targeting: e.target.value as any, targetValue: '' })}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                    required
                    aria-label="Sélectionnez le ciblage"
                  >
                    <option value="all">Tous les utilisateurs</option>
                    <option value="route">Ligne spécifique</option>
                    <option value="city">Ville spécifique</option>
                    <option value="station">Station spécifique</option>
                  </select>
                </div>
              </div>

              {formData.targeting !== 'all' && (
                <div>
                  <Label htmlFor="targetValue">
                    {formData.targeting === 'route' ? 'Ligne' : 'Ville'} *
                  </Label>
                  <Input
                    id="targetValue"
                    value={formData.targetValue}
                    onChange={(e) => setFormData({ ...formData, targetValue: e.target.value })}
                    placeholder={formData.targeting === 'route' ? 'Ex: Ouagadougou - Bobo' : 'Ex: Ouagadougou'}
                    required
                  />
                </div>
              )}

              {/* ✅ NOUVEAU: Section Call-to-Action */}
              <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h3 className="font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <Target size={18} />
                  Call-to-Action (optionnel)
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Ajoutez un bouton cliquable pour rediriger les utilisateurs vers une page spécifique
                </p>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="actionLabel">Texte du bouton</Label>
                    <Input
                      id="actionLabel"
                      value={formData.actionLabel}
                      onChange={(e) => setFormData({ ...formData, actionLabel: e.target.value })}
                      placeholder="Ex: Réserver maintenant"
                    />
                  </div>

                  <div>
                    <Label htmlFor="actionType">Type d'action</Label>
                    <select
                      id="actionType"
                      value={formData.actionType}
                      onChange={(e) => setFormData({ ...formData, actionType: e.target.value as any })}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                      aria-label="Sélectionnez le type d'action"
                    >
                      <option value="none">Aucune</option>
                      <option value="book_route">Réserver une ligne</option>
                      <option value="view_company">Voir la compagnie</option>
                    </select>
                  </div>
                </div>

                {formData.actionLabel && !formData.actionType && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                    ⚠️ Veuillez ajouter une destination pour le bouton
                  </p>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="startDate">Date de début *</Label>
                  <Input
                    id="startDate"
                    type="date"
                    value={formData.startDate}
                    onChange={(e) => setFormData({ ...formData, startDate: e.target.value })}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="endDate">Date de fin *</Label>
                  <Input
                    id="endDate"
                    type="date"
                    value={formData.endDate}
                    onChange={(e) => setFormData({ ...formData, endDate: e.target.value })}
                    required
                  />
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                Annuler
              </Button>
              <Button type="submit" className="tf-btn-primary">
                Créer la story
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Aperçu */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Aperçu de la story</DialogTitle>
            <DialogDescription>
              Visualisez comment cette story apparaîtra aux utilisateurs
            </DialogDescription>
          </DialogHeader>

          {selectedStory && (
            <div className="space-y-4">
              {/* ✅ Affichage conditionnel : vidéo ou image */}
              <div className="h-96 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden">
                {selectedStory.mediaType === 'video' ? (
                  <video 
                    src={selectedStory.mediaUrl} 
                    controls 
                    className="w-full h-full object-cover"
                    preload="auto"
                    playsInline
                    onError={() => console.error('Erreur de lecture vidéo:', selectedStory.mediaUrl)}
                  />
                ) : (
                  <img 
                    src={selectedStory.mediaUrl} 
                    alt={selectedStory.title}
                    className="w-full h-full object-cover"
                  />
                )}
              </div>
              
              <div>
                <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-2">
                  {selectedStory.title}
                </h3>
                
                {/* ✅ Afficher le bouton CTA si configuré */}
                {selectedStory.actionLabel && selectedStory.actionType && selectedStory.actionType !== 'none' && (
                  <div className="mb-4">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#f59e0b] text-white font-bold rounded-lg">
                      {selectedStory.actionLabel}
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                      Type d'action: {selectedStory.actionType === 'book_route' && 'Réserver une ligne'}
                      {selectedStory.actionType === 'view_company' && 'Voir la compagnie'}
                    </p>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Vues</p>
                    <p className="font-bold text-gray-900 dark:text-white text-lg">{selectedStory.views.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-gray-500 dark:text-gray-400">Clics</p>
                    <p className="font-bold text-gray-900 dark:text-white text-lg">{selectedStory.clicks}</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}


