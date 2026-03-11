import React, { useState, useMemo, useRef, useEffect } from 'react';
import {
  Search, Eye, Tag, Plus, Pencil, Trash2,
  Building2, CheckCircle2, XCircle, Clock,
  Copy, AlertTriangle, Ban, MapPin, Download,
  Users, TrendingUp, Power, PowerOff,
  Percent, Banknote, Calendar, X, ChevronDown, Check,
  Image, Video, Link2, Smartphone, Play, FileImage
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { StatCard } from '../ui/stat-card';
import { PAGE_CLASSES, COMPONENTS } from '../../lib/design-system';
import { exportToCSV } from '../../lib/utils';
import { toast } from 'sonner@2.0.3';
import { usePromotions } from '../../hooks/usePromotions';
import type { Promotion, PromotionFormData } from '../../hooks/usePromotions';
import { useAdminApp } from '../../context/AdminAppContext';

/**
 * PromotionManagement - Admin Version 5.0
 * Backend-ready - CRUD complet des réductions de prix
 * 
 * L'admin peut:
 * - Voir TOUTES les promos de TOUS les opérateurs
 * - CRÉER des promos pour une ou PLUSIEURS compagnies à la fois
 * - Sélectionner un ou PLUSIEURS trajets ciblés (ou tous)
 * - MODIFIER / SUPPRIMER n'importe quelle promo
 * - Approuver / Rejeter les promos des opérateurs
 * - Activer / Désactiver
 * - Exporter en CSV
 */

type ComputedStatus = 'active' | 'pending' | 'expired' | 'rejected' | 'inactive';
type StatusFilter = 'all' | ComputedStatus;
type DiscountFilter = 'all' | 'percentage' | 'fixed';
type ModalType = 'none' | 'detail' | 'create' | 'edit' | 'reject' | 'delete';

// Trajets populaires (en production: chargés depuis l'API routes)
const POPULAR_ROUTES = [
  { id: 'route_001', label: 'Ouagadougou → Bobo-Dioulasso' },
  { id: 'route_002', label: 'Bobo-Dioulasso → Ouagadougou' },
  { id: 'route_003', label: 'Ouagadougou → Koudougou' },
  { id: 'route_004', label: 'Koudougou → Ouagadougou' },
  { id: 'route_005', label: 'Ouagadougou → Kaya' },
  { id: 'route_006', label: 'Bobo-Dioulasso → Banfora' },
  { id: 'route_007', label: 'Banfora → Bobo-Dioulasso' },
  { id: 'route_008', label: 'Ouagadougou → Fada N\'Gourma' },
  { id: 'route_009', label: 'Ouagadougou → Dori' },
  { id: 'route_010', label: 'Ouagadougou → Tenkodogo' },
];

export function PromotionManagement() {
  const {
    promotions, stats, refresh,
    createPromotion, updatePromotion, deletePromotion,
    approvePromotion, rejectPromotion, toggleActive,
  } = usePromotions({ loadStats: true });

  // Opérateurs chargés dynamiquement depuis le contexte (ZÉRO hardcodé)
  const { transportCompanies } = useAdminApp();
  const KNOWN_OPERATORS = useMemo(() =>
    transportCompanies.map(c => ({ id: c.id, name: c.name })),
    [transportCompanies]
  );
  // Routes: en production viendront d'un service dédié
  const KNOWN_ROUTES = POPULAR_ROUTES;

  // Clipboard avec fallback (Clipboard API parfois bloquée par permissions policy)
  const copyToClipboard = (text: string, successMsg = 'Copié !') => {
    try {
      const textarea = document.createElement('textarea');
      textarea.value = text;
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
      toast.success(successMsg);
    } catch {
      toast.error('Impossible de copier');
    }
  };

  // Filtres
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [operatorFilter, setOperatorFilter] = useState<string>('all');
  const [discountFilter, setDiscountFilter] = useState<DiscountFilter>('all');

  // Modales
  const [activeModal, setActiveModal] = useState<ModalType>('none');
  const [selectedPromotion, setSelectedPromotion] = useState<Promotion | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  // Formulaire
  const emptyForm: PromotionFormData = {
    title: '', description: '',
    operatorId: '', operatorName: '',
    tripId: '', tripRoute: '',
    discountType: 'percentage', discountValue: 10,
    minPurchaseAmount: undefined, maxDiscountAmount: undefined,
    usageLimit: undefined, usageLimitPerUser: undefined,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
    // Story mobile
    storyEnabled: false,
    storyMediaType: 'image',
    storyMediaUrl: '',
    storyThumbnailUrl: '',
    storyCtaText: 'Réserver maintenant',
    storyCtaLink: '',
  };
  const [formData, setFormData] = useState<PromotionFormData>(emptyForm);
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});

  // Multi-sélection pour le formulaire de création/édition
  const [formSelectedOperators, setFormSelectedOperators] = useState<string[]>([]);
  const [formSelectedRoutes, setFormSelectedRoutes] = useState<string[]>([]); // vide = tous les trajets

  // Opérateurs uniques dans les données (pour les filtres)
  const operators = useMemo(() => {
    const map = new Map<string, string>();
    promotions.forEach(p => {
      if (p.operatorName) map.set(p.operatorId, p.operatorName);
    });
    return Array.from(map.entries());
  }, [promotions]);

  // Statut calculé d'une promo
  const getComputedStatus = (promo: Promotion): ComputedStatus => {
    if (promo.approvalStatus === 'rejected') return 'rejected';
    if (promo.approvalStatus === 'pending') return 'pending';
    const now = new Date();
    if (now > new Date(promo.endDate)) return 'expired';
    if (now < new Date(promo.startDate)) return 'inactive';
    if (promo.isActive && promo.approvalStatus === 'approved') return 'active';
    return 'inactive';
  };

  // Filtrage + tri pending en premier
  const filteredPromotions = useMemo(() => {
    const filtered = promotions.filter(promo => {
      const q = searchTerm.toLowerCase();
      const matchesSearch = !q ||
        promo.title.toLowerCase().includes(q) ||
        (promo.operatorName?.toLowerCase().includes(q)) ||
        (promo.tripRoute?.toLowerCase().includes(q)) ||
        (promo.description?.toLowerCase().includes(q));
      const cs = getComputedStatus(promo);
      const matchesStatus = statusFilter === 'all' || cs === statusFilter;
      const matchesOperator = operatorFilter === 'all' || promo.operatorId === operatorFilter;
      const matchesDiscount = discountFilter === 'all' || promo.discountType === discountFilter;
      return matchesSearch && matchesStatus && matchesOperator && matchesDiscount;
    });
    // Sort: pending promotions always first
    return filtered.sort((a, b) => {
      const isPendingA = a.approvalStatus === 'pending';
      const isPendingB = b.approvalStatus === 'pending';
      if (isPendingA && !isPendingB) return -1;
      if (!isPendingA && isPendingB) return 1;
      return 0;
    });
  }, [promotions, searchTerm, statusFilter, operatorFilter, discountFilter]);

  const pendingInFilteredCount = filteredPromotions.filter(p => p.approvalStatus === 'pending').length;

  const pendingCount = promotions.filter(p => p.approvalStatus === 'pending').length;

  // ==================== ACTIONS ====================

  const openCreate = () => {
    setFormData(emptyForm);
    setFormErrors({});
    setFormSelectedOperators([]);
    setFormSelectedRoutes([]);
    setActiveModal('create');
  };

  const openEdit = (promo: Promotion) => {
    setSelectedPromotion(promo);
    setFormData({
      title: promo.title,
      description: promo.description || '',
      operatorId: promo.operatorId,
      operatorName: promo.operatorName || '',
      tripId: promo.tripId || '',
      tripRoute: promo.tripRoute || '',
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      minPurchaseAmount: promo.minPurchaseAmount,
      maxDiscountAmount: promo.maxDiscountAmount,
      usageLimit: promo.usageLimit,
      usageLimitPerUser: promo.usageLimitPerUser,
      startDate: promo.startDate.split('T')[0],
      endDate: promo.endDate.split('T')[0],
      // Story
      storyEnabled: promo.storyEnabled || false,
      storyMediaType: promo.storyMediaType || 'image',
      storyMediaUrl: promo.storyMediaUrl || '',
      storyThumbnailUrl: promo.storyThumbnailUrl || '',
      storyCtaText: promo.storyCtaText || 'Réserver maintenant',
      storyCtaLink: promo.storyCtaLink || '',
    });
    setFormSelectedOperators([promo.operatorId]);
    // Retrouver les routes sélectionnées depuis tripRoute
    if (promo.tripRoute) {
      const routes = promo.tripRoute.split(', ');
      const matchedIds = KNOWN_ROUTES
        .filter(r => routes.some(rt => rt.trim() === r.label))
        .map(r => r.id);
      setFormSelectedRoutes(matchedIds.length > 0 ? matchedIds : []);
    } else {
      setFormSelectedRoutes([]);
    }
    setFormErrors({});
    setActiveModal('edit');
  };

  const openDetail = (promo: Promotion) => {
    setSelectedPromotion(promo);
    setActiveModal('detail');
  };

  const openReject = (promo: Promotion) => {
    setSelectedPromotion(promo);
    setRejectReason('');
    setActiveModal('reject');
  };

  const openDelete = (promo: Promotion) => {
    setSelectedPromotion(promo);
    setActiveModal('delete');
  };

  const closeModal = () => {
    setActiveModal('none');
    setSelectedPromotion(null);
    setRejectReason('');
    setFormErrors({});
  };

  // Validation du formulaire
  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    if (!formData.title.trim()) errors.title = 'Titre requis';
    if (formSelectedOperators.length === 0) errors.operators = 'Sélectionnez au moins une compagnie';
    if (formData.discountValue <= 0) errors.discountValue = 'La valeur doit être > 0';
    if (formData.discountType === 'percentage' && formData.discountValue > 100) {
      errors.discountValue = 'Le pourcentage ne peut pas dépasser 100%';
    }
    if (!formData.startDate) errors.startDate = 'Date de début requise';
    if (!formData.endDate) errors.endDate = 'Date de fin requise';
    if (formData.startDate && formData.endDate && formData.startDate >= formData.endDate) {
      errors.endDate = 'La date de fin doit être après la date de début';
    }
    // Story validation
    if (formData.storyEnabled && !formData.storyMediaUrl) {
      errors.storyMedia = 'Téléchargez une image ou vidéo pour la story';
    }
    if (formData.storyEnabled && formData.storyMediaType === 'video' && !formData.storyThumbnailUrl) {
      errors.storyThumbnail = 'Téléchargez une miniature pour la vidéo';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Auto-générer le deep link mobile à partir des specs de la promo
  // Pas de code promo : la réduction est automatique sur les trajets ciblés
  const generateDeepLink = (): string => {
    const params = new URLSearchParams();
    const routeLabels = formSelectedRoutes.map(id => KNOWN_ROUTES.find(r => r.id === id)?.label).filter(Boolean);
    if (routeLabels.length > 0) params.set('routes', routeLabels.join('|'));
    const opNames = formSelectedOperators.map(id => KNOWN_OPERATORS.find(o => o.id === id)?.name).filter(Boolean);
    if (opNames.length > 0 && opNames.length < KNOWN_OPERATORS.length) params.set('operators', opNames.join('|'));
    params.set('discount', `${formData.discountType === 'percentage' ? formData.discountValue + '%' : formData.discountValue + 'F'}`);
    return `fasotravel://tickets${params.toString() ? '?' + params.toString() : ''}`;
  };

  const handleSubmitForm = async () => {
    if (!validateForm()) return;

    // Routes sélectionnées → string ou vide (tous les trajets)
    const selectedRouteLabels = formSelectedRoutes
      .map(id => KNOWN_ROUTES.find(r => r.id === id)?.label)
      .filter(Boolean);
    const tripRouteStr = selectedRouteLabels.length > 0 ? selectedRouteLabels.join(', ') : '';

    setActionLoading('form');

    // Deep link auto-généré à partir des specs de la promo
    const autoDeepLink = formData.storyEnabled ? generateDeepLink() : '';

    if (activeModal === 'create') {
      // Créer une promo par opérateur sélectionné
      let successCount = 0;
      for (const opId of formSelectedOperators) {
        const op = KNOWN_OPERATORS.find(o => o.id === opId);
        const payload: PromotionFormData = {
          ...formData,
          operatorId: opId,
          operatorName: op?.name || '',
          tripRoute: tripRouteStr,
          storyCtaLink: autoDeepLink,
          startDate: new Date(formData.startDate).toISOString(),
          endDate: new Date(formData.endDate + 'T23:59:59').toISOString(),
        };
        const ok = await createPromotion(payload);
        if (ok) successCount++;
      }
      if (successCount > 0) {
        toast.success(
          formSelectedOperators.length > 1
            ? `${successCount} promotion${successCount > 1 ? 's' : ''} créée${successCount > 1 ? 's' : ''} pour ${successCount} compagnie${successCount > 1 ? 's' : ''}`
            : 'Promotion créée avec succès'
        );
        closeModal();
      } else {
        toast.error('Erreur lors de la création');
      }
    } else if (activeModal === 'edit' && selectedPromotion) {
      const op = KNOWN_OPERATORS.find(o => o.id === formSelectedOperators[0]);
      const payload: PromotionFormData = {
        ...formData,
        operatorId: formSelectedOperators[0],
        operatorName: op?.name || formData.operatorName,
        tripRoute: tripRouteStr,
        storyCtaLink: autoDeepLink,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate + 'T23:59:59').toISOString(),
      };
      const ok = await updatePromotion(selectedPromotion.id, payload);
      if (ok) {
        toast.success('Promotion modifiée avec succès');
        closeModal();
      } else {
        toast.error('Erreur lors de la modification');
      }
    }
    setActionLoading(null);
  };

  const handleApprove = async (promoId: string) => {
    setActionLoading(promoId);
    const ok = await approvePromotion(promoId);
    if (ok) toast.success('Promotion approuvée avec succès');
    else toast.error('Erreur lors de l\'approbation');
    setActionLoading(null);
  };

  const handleConfirmReject = async () => {
    if (!rejectReason.trim()) {
      toast.error('Veuillez indiquer la raison du rejet');
      return;
    }
    if (!selectedPromotion) return;
    setActionLoading('reject');
    const ok = await rejectPromotion(selectedPromotion.id, rejectReason.trim());
    if (ok) {
      toast.success('Promotion rejetée');
      closeModal();
    } else {
      toast.error('Erreur lors du rejet');
    }
    setActionLoading(null);
  };

  const handleToggleActive = async (promoId: string, currentlyActive: boolean) => {
    setActionLoading(promoId);
    const ok = await toggleActive(promoId, currentlyActive);
    if (ok) toast.success(currentlyActive ? 'Promotion désactivée' : 'Promotion activée');
    else toast.error('Erreur lors du changement de statut');
    setActionLoading(null);
  };

  const handleDelete = async () => {
    if (!selectedPromotion) return;
    setActionLoading('delete');
    const ok = await deletePromotion(selectedPromotion.id);
    if (ok) {
      toast.success('Promotion supprimée');
      closeModal();
    } else {
      toast.error('Erreur lors de la suppression');
    }
    setActionLoading(null);
  };

  const handleExport = () => {
    const data = filteredPromotions.map(p => ({
      'ID': p.id,
      'Titre': p.title,
      'Compagnie': p.operatorName || '-',
      'Type réduction': p.discountType === 'percentage' ? 'Pourcentage' : 'Montant fixe',
      'Valeur': p.discountType === 'percentage' ? `${p.discountValue}%` : `${p.discountValue} FCFA`,
      'Ciblage': p.tripRoute || 'Tous trajets',
      'Début': formatDate(p.startDate),
      'Fin': formatDate(p.endDate),
      'Utilisations': `${p.usageCount}/${p.usageLimit || '∞'}`,
      'Limite/utilisateur': p.usageLimitPerUser ? `${p.usageLimitPerUser}` : 'Illimité',
      'Statut': getStatusLabel(getComputedStatus(p)),
      'Approbation': p.approvalStatus,
    }));
    exportToCSV(data, 'promotions-fasotravel');
    toast.success('Export CSV terminé');
  };

  // Helper: résumé des sélections pour affichage
  const getOperatorSummary = (): string => {
    if (formSelectedOperators.length === 0) return 'Sélectionner...';
    if (formSelectedOperators.length === KNOWN_OPERATORS.length) return 'Toutes les compagnies';
    const names = formSelectedOperators.map(id => KNOWN_OPERATORS.find(o => o.id === id)?.name).filter(Boolean);
    if (names.length <= 2) return names.join(', ');
    return `${names[0]}, ${names[1]} +${names.length - 2}`;
  };

  const getRouteSummary = (): string => {
    if (formSelectedRoutes.length === 0) return 'Tous les trajets';
    const labels = formSelectedRoutes.map(id => KNOWN_ROUTES.find(r => r.id === id)?.label).filter(Boolean);
    if (labels.length <= 1) return labels[0] || 'Tous les trajets';
    return `${labels.length} trajets sélectionnés`;
  };

  return (
    <div className={PAGE_CLASSES.container}>
      {/* ==================== HEADER ==================== */}
      <div className={PAGE_CLASSES.header}>
        <div className={PAGE_CLASSES.headerContent}>
          <div className={PAGE_CLASSES.headerTexts}>
            <h1 className="text-3xl text-gray-900 dark:text-white flex items-center gap-3">
              <div className="p-2 bg-gradient-to-br from-red-500 to-red-600 rounded-xl text-white">
                <Tag className="h-6 w-6" />
              </div>
              Gestion des Promotions
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Créez, supervisez et gérez les réductions de prix de toutes les compagnies
            </p>
          </div>
          <div className={PAGE_CLASSES.headerActions}>
            {pendingCount > 0 && (
              <div className="flex items-center gap-2 px-4 py-2.5 bg-amber-50 dark:bg-amber-900/20 border border-amber-300 dark:border-amber-700 rounded-xl animate-pulse">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="text-sm text-amber-700 dark:text-amber-300">
                  {pendingCount} en attente
                </span>
              </div>
            )}
            <button onClick={handleExport} className={COMPONENTS.buttonSecondary} title="Exporter CSV">
              <Download className="h-4 w-4" />
              <span className="hidden sm:inline">Exporter</span>
            </button>
            <button
              onClick={openCreate}
              className="inline-flex items-center gap-2 px-5 py-3 text-white rounded-xl bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-lg hover:shadow-xl transition-all"
            >
              <Plus className="h-4 w-4" />
              Créer une promotion
            </button>
          </div>
        </div>
      </div>

      {/* ==================== STATS ==================== */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        <StatCard
          title="Total Promotions"
          value={stats?.total ?? promotions.length}
          subtitle="Toutes compagnies"
          icon={Tag}
          color="red"
        />
        <StatCard
          title="Actives"
          value={stats?.active ?? 0}
          subtitle="En cours d'utilisation"
          icon={CheckCircle2}
          color="green"
        />
        <StatCard
          title="En attente"
          value={stats?.pending ?? 0}
          subtitle="Approbation requise"
          icon={Clock}
          color="yellow"
        />
        <StatCard
          title="Utilisations"
          value={(stats?.totalUsage ?? 0).toLocaleString()}
          subtitle="Réductions appliquées"
          icon={Users}
          color="blue"
        />
        <StatCard
          title="Économies générées"
          value={formatCurrency(stats?.totalSavings ?? 0)}
          subtitle="Pour les passagers"
          icon={TrendingUp}
          color="purple"
        />
      </div>

      {/* ==================== FILTRES ==================== */}
      <div className={PAGE_CLASSES.searchSection}>
        <div className="flex flex-col lg:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              placeholder="Rechercher par nom, compagnie, trajet..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className={`${COMPONENTS.input} pl-10`}
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
            className={COMPONENTS.input + ' lg:w-44'}
          >
            <option value="all">Tous statuts</option>
            <option value="active">Actives</option>
            <option value="pending">En attente</option>
            <option value="inactive">Inactives</option>
            <option value="expired">Expirées</option>
            <option value="rejected">Rejetées</option>
          </select>
          <select
            value={operatorFilter}
            onChange={(e) => setOperatorFilter(e.target.value)}
            className={COMPONENTS.input + ' lg:w-44'}
          >
            <option value="all">Toutes compagnies</option>
            {operators.map(([id, name]) => (
              <option key={id} value={id}>{name}</option>
            ))}
          </select>
          <select
            value={discountFilter}
            onChange={(e) => setDiscountFilter(e.target.value as DiscountFilter)}
            className={COMPONENTS.input + ' lg:w-40'}
          >
            <option value="all">Tous types</option>
            <option value="percentage">Pourcentage</option>
            <option value="fixed">Montant fixe</option>
          </select>
        </div>
      </div>

      {/* ==================== TABLEAU ==================== */}
      <div className={PAGE_CLASSES.tableContainer}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-4 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Promotion</th>
                <th className="px-4 py-4 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Compagnie</th>
                <th className="px-4 py-4 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Réduction</th>
                <th className="px-4 py-4 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider hidden xl:table-cell">Ciblage</th>
                <th className="px-4 py-4 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider hidden lg:table-cell">Période</th>
                <th className="px-4 py-4 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Utilisation</th>
                <th className="px-4 py-4 text-left text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Statut</th>
                <th className="px-4 py-4 text-right text-xs text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-700/50">
              {filteredPromotions.length === 0 ? (
                <tr>
                  <td colSpan={8} className="px-6 py-16 text-center">
                    <Tag className="h-10 w-10 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                    <p className="text-gray-500 dark:text-gray-400">Aucune promotion trouvée</p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Modifiez vos filtres ou créez une nouvelle promotion</p>
                  </td>
                </tr>
              ) : (
                filteredPromotions.flatMap((promo, index) => {
                  const cs = getComputedStatus(promo);
                  const usagePercent = promo.usageLimit ? Math.min((promo.usageCount / promo.usageLimit) * 100, 100) : 0;
                  const isPending = promo.approvalStatus === 'pending';
                  const rows: React.ReactNode[] = [];
                  /* Red separator after last pending promo */
                  if (pendingInFilteredCount > 0 && index === pendingInFilteredCount) {
                    rows.push(
                      <tr key={`separator-${promo.id}`}>
                        <td colSpan={8} className="px-0 py-1">
                          <div className="flex items-center gap-3">
                            <div className="flex-1 h-0.5 bg-gradient-to-r from-red-500 via-red-400 to-transparent rounded-full" />
                            <span className="text-xs text-red-500 whitespace-nowrap">{pendingInFilteredCount} à approuver ci-dessus</span>
                            <div className="flex-1 h-0.5 bg-gradient-to-l from-red-500 via-red-400 to-transparent rounded-full" />
                          </div>
                        </td>
                      </tr>
                    );
                  }
                  rows.push(
                    <tr key={promo.id} className={`hover:bg-gray-50/50 dark:hover:bg-gray-800/30 transition-colors group ${isPending ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}>
                      <td className="px-6 py-4">
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white truncate max-w-[220px]">{promo.title}</p>
                          {promo.description && (
                            <p className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[220px] mt-0.5">{promo.description}</p>
                          )}
                          <div className="flex items-center gap-1.5 mt-1">
                            {promo.storyEnabled && (
                              <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-purple-100 dark:bg-purple-900/30 rounded text-[11px] text-purple-600 dark:text-purple-300" title="Story mobile active">
                                <Smartphone className="h-2.5 w-2.5" /> Story
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex items-center gap-1.5">
                          <Building2 className="h-3.5 w-3.5 text-red-500 flex-shrink-0" />
                          <span className="text-sm text-gray-900 dark:text-white truncate">{promo.operatorName}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-sm ${
                          promo.discountType === 'percentage'
                            ? 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
                            : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'
                        }`}>
                          {promo.discountType === 'percentage' ? <Percent className="h-3 w-3" /> : <Banknote className="h-3 w-3" />}
                          {promo.discountType === 'percentage'
                            ? `-${promo.discountValue}%`
                            : `-${promo.discountValue.toLocaleString()} F`}
                        </span>
                      </td>
                      <td className="px-4 py-4 hidden xl:table-cell">
                        {promo.tripRoute ? (
                          <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                            <MapPin className="h-3 w-3 flex-shrink-0 text-red-400" />
                            <span className="truncate max-w-[150px]">{promo.tripRoute}</span>
                          </div>
                        ) : (
                          <span className="text-xs text-gray-400 dark:text-gray-500">Tous trajets</span>
                        )}
                      </td>
                      <td className="px-4 py-4 hidden lg:table-cell">
                        <div className="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-300">
                          <Calendar className="h-3 w-3 flex-shrink-0 text-gray-400" />
                          <span>{formatDateShort(promo.startDate)} → {formatDateShort(promo.endDate)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="w-24">
                          <div className="flex items-baseline gap-1 text-sm">
                            <span className="text-gray-900 dark:text-white">{promo.usageCount}</span>
                            <span className="text-xs text-gray-400">/ {promo.usageLimit || '∞'}</span>
                          </div>
                          {promo.usageLimit && (
                            <div className="mt-1.5 w-full bg-gray-200 dark:bg-gray-600 rounded-full h-1.5">
                              <div
                                className={`h-1.5 rounded-full transition-all ${
                                  usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-green-500'
                                }`}
                                style={{ width: `${usagePercent}%` }}
                              />
                            </div>
                          )}
                          {promo.usageLimitPerUser && (
                            <span className="text-[10px] text-gray-400 mt-0.5 block">max {promo.usageLimitPerUser}/client</span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <StatusBadge status={cs} />
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-0.5">
                          <ActionBtn icon={<Eye className="h-4 w-4" />} onClick={() => openDetail(promo)} title="Voir les détails" color="gray" />
                          {promo.approvalStatus === 'pending' && (
                            <>
                              <ActionBtn
                                icon={actionLoading === promo.id ? <span className="h-4 w-4 border-2 border-green-400 border-t-transparent rounded-full animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                                onClick={() => handleApprove(promo.id)} title="Approuver" color="green" disabled={!!actionLoading}
                              />
                              <ActionBtn icon={<XCircle className="h-4 w-4" />} onClick={() => openReject(promo)} title="Rejeter" color="red" disabled={!!actionLoading} />
                            </>
                          )}
                          {promo.approvalStatus === 'approved' && cs !== 'expired' && (
                            <ActionBtn
                              icon={actionLoading === promo.id ? <span className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : promo.isActive ? <PowerOff className="h-4 w-4" /> : <Power className="h-4 w-4" />}
                              onClick={() => handleToggleActive(promo.id, promo.isActive)} title={promo.isActive ? 'Désactiver' : 'Activer'} color={promo.isActive ? 'amber' : 'green'} disabled={!!actionLoading}
                            />
                          )}
                          <ActionBtn icon={<Pencil className="h-4 w-4" />} onClick={() => openEdit(promo)} title="Modifier" color="blue" className="opacity-0 group-hover:opacity-100" />
                          <ActionBtn icon={<Trash2 className="h-4 w-4" />} onClick={() => openDelete(promo)} title="Supprimer" color="red" className="opacity-0 group-hover:opacity-100" disabled={!!actionLoading} />
                        </div>
                      </td>
                    </tr>
                  );
                  return rows;
                })
              )}
            </tbody>
          </table>
        </div>
        {filteredPromotions.length > 0 && (
          <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {filteredPromotions.length} sur {promotions.length} promotion{promotions.length > 1 ? 's' : ''}
            </span>
            <button onClick={handleExport} className="text-sm text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 flex items-center gap-1">
              <Download className="h-3.5 w-3.5" /> Exporter cette sélection
            </button>
          </div>
        )}
      </div>

      {/* ==================== MODALE DÉTAIL ==================== */}
      <Dialog open={activeModal === 'detail'} onOpenChange={() => closeModal()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5 text-red-500" />
              Détails de la promotion
            </DialogTitle>
            <DialogDescription>
              Informations complètes — {selectedPromotion?.title}
            </DialogDescription>
          </DialogHeader>
          {selectedPromotion && <PromotionDetailView promo={selectedPromotion} computedStatus={getComputedStatus(selectedPromotion)} />}
        </DialogContent>
      </Dialog>

      {/* ==================== MODALE CRÉER / MODIFIER ==================== */}
      <Dialog open={activeModal === 'create' || activeModal === 'edit'} onOpenChange={() => closeModal()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {activeModal === 'create' ? <Plus className="h-5 w-5 text-red-500" /> : <Pencil className="h-5 w-5 text-blue-500" />}
              {activeModal === 'create' ? 'Créer une promotion' : 'Modifier la promotion'}
            </DialogTitle>
            <DialogDescription>
              {activeModal === 'create'
                ? 'Les promotions créées par l\'admin sont automatiquement approuvées. Sélectionnez une ou plusieurs compagnies.'
                : `Modification de « ${selectedPromotion?.title} »`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-5 mt-2">
            {/* Titre */}
            <FormField label="Titre de la promotion" error={formErrors.title} required>
              <input
                value={formData.title}
                onChange={e => setFormData(d => ({ ...d, title: e.target.value }))}
                placeholder="Ex: Réduction Saison Sèche -25%"
                className={COMPONENTS.input}
              />
            </FormField>

            {/* Description */}
            <FormField label="Description">
              <textarea
                value={formData.description}
                onChange={e => setFormData(d => ({ ...d, description: e.target.value }))}
                placeholder="Description visible par les passagers..."
                rows={2}
                className={COMPONENTS.input}
              />
            </FormField>

            {/* Compagnies (multi-select) */}
            <FormField
              label={activeModal === 'create' ? 'Compagnie(s) ciblée(s)' : 'Compagnie'}
              error={formErrors.operators}
              required
            >
              <MultiSelectDropdown
                options={KNOWN_OPERATORS.map(o => ({ id: o.id, label: o.name }))}
                selected={formSelectedOperators}
                onChange={setFormSelectedOperators}
                placeholder="Sélectionner..."
                summary={getOperatorSummary()}
                allLabel="Toutes les compagnies"
                singleMode={activeModal === 'edit'}
              />
              {activeModal === 'create' && formSelectedOperators.length > 1 && (
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-1">
                  → {formSelectedOperators.length} promotions seront créées (1 par compagnie)
                </p>
              )}
            </FormField>

            {/* Trajets ciblés (multi-select) */}
            <FormField label="Trajets ciblés">
              <MultiSelectDropdown
                options={KNOWN_ROUTES.map(r => ({ id: r.id, label: r.label }))}
                selected={formSelectedRoutes}
                onChange={setFormSelectedRoutes}
                placeholder="Tous les trajets"
                summary={getRouteSummary()}
                allLabel="Tous les trajets (aucune restriction)"
                emptyMeansAll
              />
              {formSelectedRoutes.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {formSelectedRoutes.map(id => {
                    const route = KNOWN_ROUTES.find(r => r.id === id);
                    return (
                      <span
                        key={id}
                        className="inline-flex items-center gap-1 px-2 py-1 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg text-xs"
                      >
                        <MapPin className="h-3 w-3" />
                        {route?.label}
                        <button
                          type="button"
                          onClick={() => setFormSelectedRoutes(prev => prev.filter(r => r !== id))}
                          className="ml-0.5 hover:text-red-900 dark:hover:text-red-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      </span>
                    );
                  })}
                </div>
              )}
            </FormField>

            {/* Réduction */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Type de réduction" required>
                <select
                  value={formData.discountType}
                  onChange={e => setFormData(d => ({ ...d, discountType: e.target.value as 'percentage' | 'fixed' }))}
                  className={COMPONENTS.input}
                >
                  <option value="percentage">Pourcentage (%)</option>
                  <option value="fixed">Montant fixe (FCFA)</option>
                </select>
              </FormField>
              <FormField label={formData.discountType === 'percentage' ? 'Pourcentage' : 'Montant (FCFA)'} error={formErrors.discountValue} required>
                <input
                  type="number"
                  min={1}
                  max={formData.discountType === 'percentage' ? 100 : undefined}
                  value={formData.discountValue}
                  onChange={e => setFormData(d => ({ ...d, discountValue: Number(e.target.value) }))}
                  className={COMPONENTS.input}
                />
              </FormField>
            </div>

            {/* Limites */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <FormField label="Achat min. (FCFA)">
                <input
                  type="number"
                  value={formData.minPurchaseAmount || ''}
                  onChange={e => setFormData(d => ({ ...d, minPurchaseAmount: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="Optionnel"
                  className={COMPONENTS.input}
                />
              </FormField>
              <FormField label="Réduction max. (FCFA)">
                <input
                  type="number"
                  value={formData.maxDiscountAmount || ''}
                  onChange={e => setFormData(d => ({ ...d, maxDiscountAmount: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="Optionnel"
                  className={COMPONENTS.input}
                />
              </FormField>
              <FormField label="Limite globale">
                <input
                  type="number"
                  value={formData.usageLimit || ''}
                  onChange={e => setFormData(d => ({ ...d, usageLimit: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="Illimité"
                  className={COMPONENTS.input}
                />
                <span className="text-xs text-gray-400 mt-1">Nombre total d'utilisations (tous clients)</span>
              </FormField>
              <FormField label="Limite par utilisateur">
                <input
                  type="number"
                  min={1}
                  value={formData.usageLimitPerUser || ''}
                  onChange={e => setFormData(d => ({ ...d, usageLimitPerUser: e.target.value ? Number(e.target.value) : undefined }))}
                  placeholder="Illimité"
                  className={COMPONENTS.input}
                />
                <span className="text-xs text-gray-400 mt-1">Max par client individuel</span>
              </FormField>
            </div>

            {/* Dates */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <FormField label="Date de début" error={formErrors.startDate} required>
                <input
                  type="date"
                  value={formData.startDate}
                  onChange={e => setFormData(d => ({ ...d, startDate: e.target.value }))}
                  className={COMPONENTS.input}
                />
              </FormField>
              <FormField label="Date de fin" error={formErrors.endDate} required>
                <input
                  type="date"
                  value={formData.endDate}
                  onChange={e => setFormData(d => ({ ...d, endDate: e.target.value }))}
                  className={COMPONENTS.input}
                />
              </FormField>
            </div>

            {/* ==================== STORY MOBILE ==================== */}
            <div className="border border-gray-200 dark:border-gray-700 rounded-xl overflow-hidden">
              {/* Toggle Story */}
              <button
                type="button"
                onClick={() => setFormData(d => ({ ...d, storyEnabled: !d.storyEnabled }))}
                className={`w-full flex items-center justify-between px-4 py-3 text-left transition-colors ${
                  formData.storyEnabled
                    ? 'bg-gradient-to-r from-purple-50 to-indigo-50 dark:from-purple-900/20 dark:to-indigo-900/20'
                    : 'bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`p-1.5 rounded-lg ${formData.storyEnabled ? 'bg-purple-500 text-white' : 'bg-gray-200 dark:bg-gray-700 text-gray-500'}`}>
                    <Smartphone className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-sm text-gray-900 dark:text-white">Story Mobile</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Ajouter une image ou vidéo visible dans le carousel stories de l'app
                    </p>
                  </div>
                </div>
                <div className={`relative w-10 h-5 rounded-full transition-colors ${formData.storyEnabled ? 'bg-purple-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <div className={`absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${formData.storyEnabled ? 'translate-x-5' : 'translate-x-0.5'}`} />
                </div>
              </button>

              {/* Story Fields */}
              {formData.storyEnabled && (
                <div className="px-4 py-4 space-y-4 border-t border-gray-200 dark:border-gray-700">
                  {/* Type de média */}
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => setFormData(d => ({ ...d, storyMediaType: 'image', storyMediaUrl: '', storyThumbnailUrl: '' }))}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm transition-all ${
                        formData.storyMediaType === 'image'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      <Image className="h-4 w-4" />
                      Image
                    </button>
                    <button
                      type="button"
                      onClick={() => setFormData(d => ({ ...d, storyMediaType: 'video', storyMediaUrl: '', storyThumbnailUrl: '' }))}
                      className={`flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg border-2 text-sm transition-all ${
                        formData.storyMediaType === 'video'
                          ? 'border-purple-500 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-300'
                      }`}
                    >
                      <Video className="h-4 w-4" />
                      Vidéo
                    </button>
                  </div>

                  {/* Upload média principal */}
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">
                      {formData.storyMediaType === 'image' ? 'Image de la story' : 'Vidéo de la story'}
                      <span className="text-red-500 ml-0.5">*</span>
                    </label>
                    {formErrors.storyMedia && <p className="text-xs text-red-500 mb-1.5">{formErrors.storyMedia}</p>}

                    {!formData.storyMediaUrl ? (
                      /* Zone de drop / sélection */
                      <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-purple-400 dark:hover:border-purple-500 hover:bg-purple-50/50 dark:hover:bg-purple-900/10 transition-colors">
                        <div className="flex flex-col items-center gap-2 py-4">
                          {formData.storyMediaType === 'image'
                            ? <FileImage className="h-8 w-8 text-gray-400" />
                            : <Video className="h-8 w-8 text-gray-400" />}
                          <div className="text-center">
                            <p className="text-sm text-gray-600 dark:text-gray-300">
                              Cliquez pour {formData.storyMediaType === 'image' ? 'choisir une image' : 'choisir une vidéo'}
                            </p>
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5">
                              {formData.storyMediaType === 'image' ? 'JPG, PNG, WebP — max 5 Mo' : 'MP4, WebM — max 30 Mo'}
                            </p>
                            <p className="text-xs text-purple-500 mt-1">Format recommandé : 9:16 (portrait mobile)</p>
                          </div>
                        </div>
                        <input
                          type="file"
                          accept={formData.storyMediaType === 'image' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/webm'}
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const maxSize = formData.storyMediaType === 'image' ? 5 * 1024 * 1024 : 30 * 1024 * 1024;
                            if (file.size > maxSize) {
                              toast.error(`Fichier trop volumineux (max ${formData.storyMediaType === 'image' ? '5' : '30'} Mo)`);
                              return;
                            }
                            const objectUrl = URL.createObjectURL(file);
                            setFormData(d => ({ ...d, storyMediaUrl: objectUrl }));
                            // En production: upload vers CDN et récupérer l'URL
                          }}
                        />
                      </label>
                    ) : (
                      /* Prévisualisation avec option de suppression */
                      <div className="relative">
                        <div className="flex gap-4 items-start">
                          {/* Preview mobile */}
                          <div className="relative w-[140px] flex-shrink-0 aspect-[9/16] bg-gray-900 rounded-2xl overflow-hidden border-2 border-purple-300 dark:border-purple-700 shadow-lg">
                            {formData.storyMediaType === 'image' ? (
                              <img
                                src={formData.storyMediaUrl}
                                alt="Story preview"
                                className="w-full h-full object-cover"
                                onError={(e) => { (e.target as HTMLImageElement).src = ''; }}
                              />
                            ) : (
                              <video
                                src={formData.storyMediaUrl}
                                className="w-full h-full object-cover"
                                muted
                                playsInline
                                onLoadedData={(e) => {
                                  // Auto-capture thumbnail from first frame
                                  const vid = e.target as HTMLVideoElement;
                                  try {
                                    const canvas = document.createElement('canvas');
                                    canvas.width = vid.videoWidth;
                                    canvas.height = vid.videoHeight;
                                    canvas.getContext('2d')?.drawImage(vid, 0, 0);
                                    const thumbUrl = canvas.toDataURL('image/jpeg', 0.8);
                                    setFormData(d => ({ ...d, storyThumbnailUrl: thumbUrl }));
                                  } catch (_) { /* CORS ou pas de frame */ }
                                }}
                              />
                            )}
                            {/* Overlay promo info */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5">
                              <p className="text-white text-[10px] truncate">{formData.title || 'Titre promo'}</p>
                              <p className="text-white/80 text-[9px] mt-0.5">
                                {formData.discountType === 'percentage'
                                  ? `-${formData.discountValue}%`
                                  : `-${formData.discountValue.toLocaleString()} FCFA`}
                              </p>
                              <div className="mt-1.5 bg-red-500 text-white text-[9px] text-center py-0.5 rounded-md">
                                {formData.storyCtaText || 'Réserver maintenant'}
                              </div>
                            </div>
                            {/* Badge media type */}
                            {formData.storyMediaType === 'video' && (
                              <div className="absolute top-2 right-2 bg-black/60 text-white rounded-full p-1">
                                <Play className="h-3 w-3" />
                              </div>
                            )}
                          </div>

                          {/* Info + actions */}
                          <div className="flex-1 space-y-3 min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded-lg text-xs">
                                <CheckCircle2 className="h-3 w-3" />
                                {formData.storyMediaType === 'image' ? 'Image chargée' : 'Vidéo chargée'}
                              </span>
                            </div>

                            <p className="text-xs text-gray-500 dark:text-gray-400">
                              Aperçu de la story telle qu'elle apparaîtra dans le carousel de l'app mobile.
                            </p>

                            {/* Remplacer le fichier */}
                            <label className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg cursor-pointer hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
                              <FileImage className="h-3.5 w-3.5" />
                              Remplacer le fichier
                              <input
                                type="file"
                                accept={formData.storyMediaType === 'image' ? 'image/jpeg,image/png,image/webp' : 'video/mp4,video/webm'}
                                className="hidden"
                                onChange={(e) => {
                                  const file = e.target.files?.[0];
                                  if (!file) return;
                                  const maxSize = formData.storyMediaType === 'image' ? 5 * 1024 * 1024 : 30 * 1024 * 1024;
                                  if (file.size > maxSize) {
                                    toast.error(`Fichier trop volumineux`);
                                    return;
                                  }
                                  // Révoquer l'ancien objectURL
                                  if (formData.storyMediaUrl?.startsWith('blob:')) URL.revokeObjectURL(formData.storyMediaUrl);
                                  const objectUrl = URL.createObjectURL(file);
                                  setFormData(d => ({ ...d, storyMediaUrl: objectUrl, storyThumbnailUrl: '' }));
                                }}
                              />
                            </label>

                            {/* Supprimer */}
                            <button
                              type="button"
                              onClick={() => {
                                if (formData.storyMediaUrl?.startsWith('blob:')) URL.revokeObjectURL(formData.storyMediaUrl);
                                if (formData.storyThumbnailUrl?.startsWith('blob:') || formData.storyThumbnailUrl?.startsWith('data:')) {
                                  // noop for data URLs
                                }
                                setFormData(d => ({ ...d, storyMediaUrl: '', storyThumbnailUrl: '' }));
                              }}
                              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                              Supprimer
                            </button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Thumbnail vidéo (upload séparé si auto-capture échoue) */}
                  {formData.storyMediaType === 'video' && formData.storyMediaUrl && !formData.storyThumbnailUrl && (
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">
                        Miniature de la vidéo <span className="text-red-500">*</span>
                      </label>
                      {formErrors.storyThumbnail && <p className="text-xs text-red-500 mb-1.5">{formErrors.storyThumbnail}</p>}
                      <label className="flex items-center gap-3 px-4 py-3 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-purple-400 transition-colors">
                        <FileImage className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-600 dark:text-gray-300">Choisir une image pour la miniature</p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">JPG, PNG — apparaîtra dans le carousel avant lecture</p>
                        </div>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            const objectUrl = URL.createObjectURL(file);
                            setFormData(d => ({ ...d, storyThumbnailUrl: objectUrl }));
                          }}
                        />
                      </label>
                    </div>
                  )}

                  {/* Miniature chargée */}
                  {formData.storyMediaType === 'video' && formData.storyThumbnailUrl && (
                    <div className="flex items-center gap-3">
                      <img src={formData.storyThumbnailUrl} alt="Miniature" className="h-16 w-10 object-cover rounded-lg border border-gray-200 dark:border-gray-600" />
                      <div className="flex-1">
                        <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 rounded text-xs">
                          <CheckCircle2 className="h-3 w-3" /> Miniature chargée
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          if (formData.storyThumbnailUrl?.startsWith('blob:')) URL.revokeObjectURL(formData.storyThumbnailUrl);
                          setFormData(d => ({ ...d, storyThumbnailUrl: '' }));
                        }}
                        className="text-xs text-red-500 hover:text-red-700"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  )}

                  {/* Texte du bouton CTA */}
                  <FormField label="Texte du bouton sur la story">
                    <input
                      value={formData.storyCtaText || ''}
                      onChange={e => setFormData(d => ({ ...d, storyCtaText: e.target.value }))}
                      placeholder="Réserver maintenant"
                      className={COMPONENTS.input}
                    />
                  </FormField>

                  {/* Deep Link auto-généré (lecture seule) */}
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">
                      Redirection mobile <span className="text-xs text-gray-400">(auto-générée)</span>
                    </label>
                    <div className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl">
                      <Link2 className="h-4 w-4 text-purple-500 flex-shrink-0" />
                      <code className="text-xs text-gray-600 dark:text-gray-300 truncate flex-1 font-mono">
                        {generateDeepLink()}
                      </code>
                      <button
                        type="button"
                        onClick={() => copyToClipboard(generateDeepLink(), 'Lien copié')}
                        className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 flex-shrink-0"
                        title="Copier"
                      >
                        <Copy className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <p className="text-[11px] text-gray-400 dark:text-gray-500 mt-1">
                      Généré automatiquement à partir des compagnies, trajets ciblés et réduction
                    </p>
                  </div>

                  {/* Info mobile */}
                  <div className="flex items-start gap-2 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <Smartphone className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div className="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                      <p>La story apparaîtra dans le carousel de l'app mobile FasoTravel.</p>
                      <p>Au tap, l'utilisateur sera redirigé vers les billets des trajets ciblés avec la réduction automatiquement appliquée.</p>
                      <p className="text-blue-600 dark:text-blue-400">Le prix barré + le nouveau prix réduit s'afficheront dans les résultats de recherche — aucun code à saisir.</p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Actions du formulaire */}
            <div className="flex justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button onClick={closeModal} className={COMPONENTS.buttonSecondary}>
                Annuler
              </button>
              <button
                onClick={handleSubmitForm}
                disabled={!!actionLoading}
                className="inline-flex items-center gap-2 px-6 py-3 text-white rounded-lg bg-gradient-to-r from-red-600 to-red-500 hover:from-red-700 hover:to-red-600 shadow-lg transition-all disabled:opacity-50"
              >
                {actionLoading === 'form' && <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                {activeModal === 'create'
                  ? (formSelectedOperators.length > 1
                    ? `Créer ${formSelectedOperators.length} promotions`
                    : 'Créer la promotion')
                  : 'Enregistrer les modifications'}
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== MODALE REJET ==================== */}
      <Dialog open={activeModal === 'reject'} onOpenChange={() => closeModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <XCircle className="h-5 w-5" />
              Rejeter la promotion
            </DialogTitle>
            <DialogDescription>
              Opérateur : {selectedPromotion?.operatorName} — « {selectedPromotion?.title} »
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <FormField label="Raison du rejet" required>
              <textarea
                placeholder="Ex: Réduction trop élevée, Dates invalides, Code en doublon..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                rows={4}
                className={COMPONENTS.input}
              />
            </FormField>
            <div className="flex justify-end gap-3">
              <button onClick={closeModal} className={COMPONENTS.buttonSecondary}>
                Annuler
              </button>
              <button onClick={handleConfirmReject} disabled={!!actionLoading} className={COMPONENTS.buttonDanger}>
                {actionLoading === 'reject' && <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <XCircle className="h-4 w-4" />
                Confirmer le rejet
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ==================== MODALE SUPPRESSION ==================== */}
      <Dialog open={activeModal === 'delete'} onOpenChange={() => closeModal()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Supprimer la promotion
            </DialogTitle>
            <DialogDescription>
              Cette action est irréversible.
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4 space-y-4">
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
              <p className="text-sm text-red-700 dark:text-red-300">
                Vous êtes sur le point de supprimer la promotion <strong>« {selectedPromotion?.title} »</strong> de{' '}
                <strong>{selectedPromotion?.operatorName}</strong>.
              </p>
              {selectedPromotion && selectedPromotion.usageCount > 0 && (
                <p className="text-xs text-red-600 dark:text-red-400 mt-2">
                  Cette promotion a déjà été utilisée {selectedPromotion.usageCount} fois.
                </p>
              )}
            </div>
            <div className="flex justify-end gap-3">
              <button onClick={closeModal} className={COMPONENTS.buttonSecondary}>
                Annuler
              </button>
              <button onClick={handleDelete} disabled={!!actionLoading} className={COMPONENTS.buttonDanger}>
                {actionLoading === 'delete' && <span className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />}
                <Trash2 className="h-4 w-4" />
                Supprimer définitivement
              </button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// MULTI-SELECT DROPDOWN COMPONENT
// ============================================================================

interface MultiSelectOption {
  id: string;
  label: string;
}

function MultiSelectDropdown({
  options,
  selected,
  onChange,
  placeholder,
  summary,
  allLabel,
  singleMode = false,
  emptyMeansAll = false,
}: {
  options: MultiSelectOption[];
  selected: string[];
  onChange: (ids: string[]) => void;
  placeholder: string;
  summary: string;
  allLabel: string;
  singleMode?: boolean;
  emptyMeansAll?: boolean;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  // Fermer le dropdown au clic extérieur
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredOptions = options.filter(o =>
    o.label.toLowerCase().includes(search.toLowerCase())
  );

  const toggleOption = (id: string) => {
    if (singleMode) {
      onChange([id]);
      setIsOpen(false);
      setSearch('');
      return;
    }
    if (selected.includes(id)) {
      onChange(selected.filter(s => s !== id));
    } else {
      onChange([...selected, id]);
    }
  };

  const toggleAll = () => {
    if (emptyMeansAll) {
      // Vider = tous
      onChange([]);
      setIsOpen(false);
      setSearch('');
      return;
    }
    if (selected.length === options.length) {
      onChange([]);
    } else {
      onChange(options.map(o => o.id));
    }
  };

  const isAllSelected = emptyMeansAll
    ? selected.length === 0
    : selected.length === options.length;

  return (
    <div className="relative" ref={containerRef}>
      {/* Trigger */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`${COMPONENTS.input} flex items-center justify-between gap-2 text-left cursor-pointer`}
      >
        <span className={`truncate ${selected.length === 0 && !emptyMeansAll ? 'text-gray-400 dark:text-gray-500' : 'text-gray-900 dark:text-white'}`}>
          {summary}
        </span>
        <ChevronDown className={`h-4 w-4 text-gray-400 flex-shrink-0 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Dropdown */}
      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-xl shadow-xl max-h-64 overflow-hidden">
          {/* Recherche (si plus de 5 options) */}
          {options.length > 5 && (
            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Rechercher..."
                className="w-full px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-1 focus:ring-red-500 text-gray-900 dark:text-white placeholder-gray-400"
                autoFocus
              />
            </div>
          )}

          <div className="overflow-y-auto max-h-48">
            {/* Option "Tous / Toutes" */}
            {!singleMode && (
              <button
                type="button"
                onClick={toggleAll}
                className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors border-b border-gray-100 dark:border-gray-700 ${
                  isAllSelected ? 'bg-red-50 dark:bg-red-900/20' : ''
                }`}
              >
                <span className={`flex-shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                  isAllSelected
                    ? 'bg-red-500 border-red-500 text-white'
                    : 'border-gray-300 dark:border-gray-500'
                }`}>
                  {isAllSelected && <Check className="h-3 w-3" />}
                </span>
                <span className={`${isAllSelected ? 'text-red-700 dark:text-red-300' : 'text-gray-700 dark:text-gray-300'}`}>
                  {allLabel}
                </span>
              </button>
            )}

            {/* Options individuelles */}
            {filteredOptions.map(option => {
              const isSelected = selected.includes(option.id);
              return (
                <button
                  key={option.id}
                  type="button"
                  onClick={() => toggleOption(option.id)}
                  className={`w-full flex items-center gap-3 px-4 py-2.5 text-sm text-left hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${
                    isSelected ? 'bg-red-50/50 dark:bg-red-900/10' : ''
                  }`}
                >
                  <span className={`flex-shrink-0 h-4 w-4 rounded border-2 flex items-center justify-center transition-colors ${
                    isSelected
                      ? 'bg-red-500 border-red-500 text-white'
                      : 'border-gray-300 dark:border-gray-500'
                  }`}>
                    {isSelected && <Check className="h-3 w-3" />}
                  </span>
                  <span className={`truncate ${isSelected ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                    {option.label}
                  </span>
                </button>
              );
            })}

            {filteredOptions.length === 0 && (
              <div className="px-4 py-3 text-sm text-gray-400 text-center">Aucun résultat</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// SOUS-COMPOSANTS
// ============================================================================

/** Vue détaillée dans la modale Eye */
function PromotionDetailView({ promo, computedStatus }: { promo: Promotion; computedStatus: ComputedStatus }) {
  const usagePercent = promo.usageLimit ? Math.min((promo.usageCount / promo.usageLimit) * 100, 100) : 0;

  return (
    <div className="space-y-5 mt-2">
      {/* Header gradient */}
      <div className={`p-5 rounded-xl text-white ${
        promo.discountType === 'percentage'
          ? 'bg-gradient-to-br from-purple-600 to-indigo-700'
          : 'bg-gradient-to-br from-emerald-600 to-teal-700'
      }`}>
        <div className="flex items-start justify-between">
          <div>
            <div className="text-3xl mb-1">
              {promo.discountType === 'percentage'
                ? `-${promo.discountValue}%`
                : `-${promo.discountValue.toLocaleString()} FCFA`}
            </div>
            <div className="opacity-90 text-sm">{promo.title}</div>
          </div>
          <StatusBadge status={computedStatus} light />
        </div>
      </div>

      {/* Opérateur */}
      <div className="flex items-center gap-2 px-4 py-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl">
        <Building2 className="h-4 w-4 text-red-500" />
        <span className="text-sm text-gray-900 dark:text-white">{promo.operatorName}</span>
        <span className="text-xs text-gray-500 dark:text-gray-400 ml-auto">ID: {promo.operatorId}</span>
      </div>

      {/* Info grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        <DetailField label="Type" value={promo.discountType === 'percentage' ? 'Pourcentage' : 'Montant fixe'} />
        <DetailField label="Ciblage" value={promo.tripRoute || 'Tous les trajets'} />
        {promo.minPurchaseAmount && <DetailField label="Montant min." value={`${promo.minPurchaseAmount.toLocaleString()} FCFA`} />}
        {promo.maxDiscountAmount && <DetailField label="Réduction max." value={`${promo.maxDiscountAmount.toLocaleString()} FCFA`} />}
        <DetailField label="Début" value={formatDate(promo.startDate)} />
        <DetailField label="Fin" value={formatDate(promo.endDate)} />
      </div>

      {/* Description */}
      {promo.description && (
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">Description</span>
          <p className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-xl p-3 border border-gray-200 dark:border-gray-600">
            {promo.description}
          </p>
        </div>
      )}

      {/* Utilisation */}
      <div>
        <span className="text-xs text-gray-500 dark:text-gray-400 block mb-2">Utilisation</span>
        <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 border border-gray-200 dark:border-gray-600">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-700 dark:text-gray-300">
              <span className="text-gray-900 dark:text-white">{promo.usageCount}</span> utilisations sur{' '}
              {promo.usageLimit || '∞'}
            </span>
            {promo.usageLimit && (
              <span className={`text-sm ${usagePercent >= 90 ? 'text-red-600' : usagePercent >= 70 ? 'text-amber-600' : 'text-green-600'}`}>
                {usagePercent.toFixed(0)}%
              </span>
            )}
          </div>
          {promo.usageLimit && (
            <div className="w-full bg-gray-200 dark:bg-gray-600 rounded-full h-2.5">
              <div
                className={`h-2.5 rounded-full transition-all ${
                  usagePercent >= 90 ? 'bg-red-500' : usagePercent >= 70 ? 'bg-amber-500' : 'bg-green-500'
                }`}
                style={{ width: `${usagePercent}%` }}
              />
            </div>
          )}
          <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-600 flex items-center justify-between">
            <span className="text-sm text-gray-600 dark:text-gray-400">Limite par utilisateur</span>
            <span className="text-sm text-gray-900 dark:text-white">
              {promo.usageLimitPerUser ? `${promo.usageLimitPerUser} fois max` : 'Illimité'}
            </span>
          </div>
        </div>
      </div>

      {/* Approbation */}
      <div>
        <span className="text-xs text-gray-500 dark:text-gray-400 block mb-2">Approbation</span>
        <div className={`rounded-xl p-4 border ${
          promo.approvalStatus === 'approved'
            ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800'
            : promo.approvalStatus === 'rejected'
            ? 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800'
            : 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-800'
        }`}>
          <div className="flex items-center gap-2 mb-1">
            {promo.approvalStatus === 'approved' && <CheckCircle2 className="h-4 w-4 text-green-600" />}
            {promo.approvalStatus === 'rejected' && <XCircle className="h-4 w-4 text-red-600" />}
            {promo.approvalStatus === 'pending' && <Clock className="h-4 w-4 text-amber-600" />}
            <span className="text-sm text-gray-900 dark:text-white capitalize">{promo.approvalStatus}</span>
          </div>
          {promo.approvedByName && (
            <p className="text-xs text-gray-600 dark:text-gray-400">
              Par {promo.approvedByName} le {promo.approvedAt ? formatDate(promo.approvedAt) : '-'}
            </p>
          )}
          {promo.rejectionReason && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-2 bg-red-100 dark:bg-red-900/30 rounded-lg p-2">
              {promo.rejectionReason}
            </p>
          )}
        </div>
      </div>

      {/* Story Mobile */}
      {promo.storyEnabled && promo.storyMediaUrl && (
        <div>
          <span className="text-xs text-gray-500 dark:text-gray-400 block mb-2">Story Mobile</span>
          <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-xl p-4">
            <div className="flex items-start gap-4">
              {/* Mini preview */}
              <div className="relative w-16 h-28 bg-gray-900 rounded-xl overflow-hidden flex-shrink-0 border border-purple-300 dark:border-purple-700">
                {promo.storyMediaType === 'image' ? (
                  <img src={promo.storyMediaUrl} alt="Story" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gray-800">
                    <Play className="h-5 w-5 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1 min-w-0 space-y-1.5">
                <div className="flex items-center gap-1.5">
                  <Smartphone className="h-3.5 w-3.5 text-purple-500" />
                  <span className="text-sm text-purple-700 dark:text-purple-300">
                    {promo.storyMediaType === 'image' ? 'Image' : 'Vidéo'} dans le carousel
                  </span>
                </div>
                {promo.storyCtaText && (
                  <p className="text-xs text-gray-600 dark:text-gray-400">
                    Bouton : « {promo.storyCtaText} »
                  </p>
                )}
                {promo.storyCtaLink && (
                  <p className="text-xs text-gray-500 dark:text-gray-400 font-mono truncate">
                    {promo.storyCtaLink}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Métadonnées */}
      <div className="grid grid-cols-2 gap-3 pt-3 border-t border-gray-200 dark:border-gray-700">
        <DetailField label="Créé par" value={promo.createdByName || promo.createdBy} />
        <DetailField label="Créé le" value={formatDate(promo.createdAt)} />
      </div>
    </div>
  );
}

/** Badge de statut */
function StatusBadge({ status, light = false }: { status: ComputedStatus; light?: boolean }) {
  const config: Record<ComputedStatus, { bg: string; lightBg: string; label: string }> = {
    active: {
      bg: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-300 dark:border-green-700',
      lightBg: 'bg-white/20 text-white border border-white/30',
      label: 'Active',
    },
    pending: {
      bg: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-300 dark:border-amber-700',
      lightBg: 'bg-white/20 text-white border border-white/30',
      label: 'En attente',
    },
    inactive: {
      bg: 'bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 border border-gray-300 dark:border-gray-600',
      lightBg: 'bg-white/20 text-white border border-white/30',
      label: 'Inactive',
    },
    expired: {
      bg: 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border border-gray-300 dark:border-gray-600',
      lightBg: 'bg-white/20 text-white border border-white/30',
      label: 'Expirée',
    },
    rejected: {
      bg: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-700',
      lightBg: 'bg-white/20 text-white border border-white/30',
      label: 'Rejetée',
    },
  };

  const c = config[status];
  return (
    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs ${light ? c.lightBg : c.bg}`}>
      {status === 'active' && <span className="h-1.5 w-1.5 rounded-full bg-green-500 animate-pulse" />}
      {status === 'pending' && <Clock className="h-3 w-3" />}
      {status === 'rejected' && <Ban className="h-3 w-3" />}
      {c.label}
    </span>
  );
}

/** Bouton d'action compact pour le tableau */
function ActionBtn({
  icon, onClick, title, color, className = '', disabled = false,
}: {
  icon: React.ReactNode;
  onClick: () => void;
  title: string;
  color: 'gray' | 'green' | 'red' | 'blue' | 'amber';
  className?: string;
  disabled?: boolean;
}) {
  const colorClasses: Record<string, string> = {
    gray: 'text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700',
    green: 'text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/30',
    red: 'text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/30',
    blue: 'text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/30',
    amber: 'text-amber-600 hover:text-amber-800 hover:bg-amber-50 dark:hover:bg-amber-900/30',
  };

  return (
    <button
      onClick={onClick}
      title={title}
      disabled={disabled}
      className={`p-2 rounded-lg transition-all ${colorClasses[color]} disabled:opacity-40 disabled:cursor-not-allowed ${className}`}
    >
      {icon}
    </button>
  );
}

/** Champ de formulaire */
function FormField({
  label, error, required, children,
}: {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      {children}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  );
}

/** Champ label/valeur dans la modale détail */
function DetailField({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <span className="text-xs text-gray-500 dark:text-gray-400 block mb-0.5">{label}</span>
      <span className="text-sm text-gray-900 dark:text-white">{value}</span>
    </div>
  );
}

// ============================================================================
// HELPERS
// ============================================================================

function getStatusLabel(status: ComputedStatus): string {
  const labels: Record<ComputedStatus, string> = {
    active: 'Active',
    pending: 'En attente',
    inactive: 'Inactive',
    expired: 'Expirée',
    rejected: 'Rejetée',
  };
  return labels[status];
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-BF', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function formatDateShort(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-BF', {
    day: '2-digit',
    month: 'short',
  });
}

function formatCurrency(amount: number): string {
  if (amount >= 1000000) return `${(amount / 1000000).toFixed(1)}M FCFA`;
  if (amount >= 1000) return `${Math.round(amount / 1000)}K FCFA`;
  return `${amount.toLocaleString()} FCFA`;
}

export default PromotionManagement;
