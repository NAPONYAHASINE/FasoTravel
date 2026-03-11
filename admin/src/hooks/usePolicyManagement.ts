/**
 * @file usePolicyManagement.ts
 * @description Hook dedie Gestion des Politiques — Admin FasoTravel
 * 
 * Architecture backend-ready (modele BookingManagement) :
 * - TOUTE la logique metier ici
 * - Le composant PolicyManagement.tsx est un thin UI layer
 * - Passe par policyService (bascule mock/prod via AppConfig)
 * - ZERO import de mock data directement
 * 
 * 3 DOMAINES:
 * 1. Politiques Plateforme (CGU, Confidentialite) — pages legales editables
 * 2. Politiques Societes (emises par TSR, STAF, Rakieta, SOGEBAF) — lecture + conformite
 * 3. Regles FasoTravel (source: 'platform') — imposees a toutes les societes
 */

import { useState, useMemo, useCallback, useRef, useEffect } from 'react';
import { policyService } from '../services/policyService';
import type { OperatorPolicy, PlatformPolicy } from '../shared/types/standardized';
import { exportToCSV } from '../lib/utils';

// ============================================================================
// TYPES
// ============================================================================

export type PolicyTab = 'platform' | 'companies' | 'rules';
export type CompanyPolicyType = OperatorPolicy['type'];
export type PlatformPolicyType = PlatformPolicy['type'];
export type ComplianceStatus = 'compliant' | 'review_needed' | 'non_compliant';

export interface PolicyStats {
  totalPlatformPolicies: number;
  publishedPlatformPolicies: number;
  draftPlatformPolicies: number;
  totalCompanyPolicies: number;
  companiesWithPolicies: number;
  complianceRate: number;
  reviewNeeded: number;
  nonCompliant: number;
  totalRules: number;
  activeRules: number;
}

// ============================================================================
// CONSTANTS (exported for UI — Lucide icons, pas d'emojis)
// ============================================================================

export const POLICY_TYPE_LABELS: Record<CompanyPolicyType, string> = {
  cancellation: 'Annulation',
  transfer: 'Transfert',
  baggage: 'Bagages',
  refund: 'Remboursement',
  delay: 'Retard',
  general: 'General',
  booking: 'Reservation',
  pricing: 'Tarification',
};

export const COMPLIANCE_LABELS: Record<ComplianceStatus, { label: string; className: string }> = {
  compliant: {
    label: 'Conforme',
    className: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
  },
  review_needed: {
    label: 'A verifier',
    className: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
  },
  non_compliant: {
    label: 'Non conforme',
    className: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300',
  },
};

export const PLATFORM_TYPE_LABELS: Record<PlatformPolicyType, string> = {
  privacy: 'Confidentialite',
  terms: 'CGU',
  platform_rule: 'Regle plateforme',
};

export const COMPANY_NAMES = ['TSR Transport', 'STAF Express', 'Rakieta Transport', 'SOGEBAF'] as const;

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export function usePolicyManagement() {
  // State
  const [activeTab, setActiveTab] = useState<PolicyTab>('platform');
  const [operatorPolicies, setOperatorPolicies] = useState<OperatorPolicy[]>([]);
  const [platformPolicies, setPlatformPolicies] = useState<PlatformPolicy[]>([]);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [complianceFilter, setComplianceFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Modals
  const [selectedPolicy, setSelectedPolicy] = useState<OperatorPolicy | null>(null);
  const [showDetailsModal, setShowDetailsModal] = useState(false);
  const [selectedPlatformForView, setSelectedPlatformForView] = useState<PlatformPolicy | null>(null);
  const [showPlatformViewModal, setShowPlatformViewModal] = useState(false);
  const [selectedPlatformPolicy, setSelectedPlatformPolicy] = useState<PlatformPolicy | null>(null);
  const [showPlatformEditor, setShowPlatformEditor] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 10;

  // ==================== LOAD DATA VIA SERVICE ====================

  const loadData = useCallback(async () => {
    setError(null);
    const [opResult, platResult] = await Promise.all([
      policyService.getAllOperatorPolicies(),
      policyService.getAllPlatformPolicies(),
    ]);
    if (opResult.success) setOperatorPolicies(opResult.data);
    else setError(opResult.error || 'Erreur chargement politiques operateur');
    if (platResult.success) setPlatformPolicies(platResult.data);
    else setError(prev => prev ? `${prev} | ${platResult.error}` : platResult.error || 'Erreur chargement politiques plateforme');
  }, []);

  useEffect(() => {
    if (!loadedRef.current) {
      loadedRef.current = true;
      loadData();
    }
  }, [loadData]);

  // ========== DERIVED DATA ==========

  const platformRules = useMemo(
    () => operatorPolicies.filter(p => p.source === 'platform'),
    [operatorPolicies]
  );

  const companyPolicies = useMemo(
    () => operatorPolicies.filter(p => p.source === 'company'),
    [operatorPolicies]
  );

  // ========== FILTERED DATA ==========

  const filteredCompanyPolicies = useMemo(() => {
    return companyPolicies.filter(p => {
      const matchesSearch = !searchTerm ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (p.companyName || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCompany = companyFilter === 'all' || p.companyName === companyFilter;
      const matchesType = typeFilter === 'all' || p.type === typeFilter;
      const matchesCompliance = complianceFilter === 'all' || p.complianceStatus === complianceFilter;
      return matchesSearch && matchesCompany && matchesType && matchesCompliance;
    });
  }, [companyPolicies, searchTerm, companyFilter, typeFilter, complianceFilter]);

  const filteredPlatformPolicies = useMemo(() => {
    return platformPolicies.filter(p => {
      const matchesSearch = !searchTerm ||
        p.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        p.summary.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || p.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [platformPolicies, searchTerm, statusFilter]);

  const filteredRules = useMemo(() => {
    return platformRules.filter(r => {
      const matchesSearch = !searchTerm ||
        r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        r.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesType = typeFilter === 'all' || r.type === typeFilter;
      return matchesSearch && matchesType;
    });
  }, [platformRules, searchTerm, typeFilter]);

  // ========== PAGINATION ==========

  const paginatedCompanyPolicies = useMemo(() => {
    const start = (currentPage - 1) * pageSize;
    return filteredCompanyPolicies.slice(start, start + pageSize);
  }, [filteredCompanyPolicies, currentPage]);

  const totalCompanyPages = Math.ceil(filteredCompanyPolicies.length / pageSize);

  // ========== STATS ==========

  const stats: PolicyStats = useMemo(() => {
    const companyWithPolicies = new Set(companyPolicies.map(p => p.companyId).filter(Boolean));
    const compliantCount = companyPolicies.filter(p => p.complianceStatus === 'compliant').length;
    const reviewCount = companyPolicies.filter(p => p.complianceStatus === 'review_needed').length;
    const nonCompliantCount = companyPolicies.filter(p => p.complianceStatus === 'non_compliant').length;

    return {
      totalPlatformPolicies: platformPolicies.length,
      publishedPlatformPolicies: platformPolicies.filter(p => p.status === 'published').length,
      draftPlatformPolicies: platformPolicies.filter(p => p.status === 'draft').length,
      totalCompanyPolicies: companyPolicies.length,
      companiesWithPolicies: companyWithPolicies.size,
      complianceRate: companyPolicies.length > 0 ? Math.round((compliantCount / companyPolicies.length) * 100) : 0,
      reviewNeeded: reviewCount,
      nonCompliant: nonCompliantCount,
      totalRules: platformRules.length,
      activeRules: platformRules.filter(r => r.status === 'active').length,
    };
  }, [platformPolicies, companyPolicies, platformRules]);

  // ========== Company policies grouped ==========

  const policiesByCompany = useMemo(() => {
    const grouped: Record<string, { companyName: string; companyId: string; policies: OperatorPolicy[] }> = {};
    filteredCompanyPolicies.forEach(p => {
      const key = p.companyId || 'unknown';
      if (!grouped[key]) {
        grouped[key] = { companyName: p.companyName || 'Inconnu', companyId: key, policies: [] };
      }
      grouped[key].policies.push(p);
    });
    return Object.values(grouped);
  }, [filteredCompanyPolicies]);

  // ========== ACTIONS ==========

  const handleShowDetails = useCallback((policy: OperatorPolicy) => {
    setSelectedPolicy(policy);
    setShowDetailsModal(true);
  }, []);

  const handleShowPlatformView = useCallback((policy: PlatformPolicy) => {
    setSelectedPlatformForView(policy);
    setShowPlatformViewModal(true);
  }, []);

  const handleShowPlatformEditor = useCallback((policy: PlatformPolicy | null) => {
    setSelectedPlatformPolicy(policy);
    setShowPlatformEditor(true);
  }, []);

  const updateComplianceStatus = useCallback(async (policyId: string, status: ComplianceStatus, note?: string) => {
    const result = await policyService.updateCompliance(policyId, status, note);
    if (result.success) {
      setOperatorPolicies(prev => prev.map(p =>
        p.id === policyId
          ? { ...p, complianceStatus: status, complianceNote: note || p.complianceNote, updatedAt: new Date().toISOString() }
          : p
      ));
    }
  }, []);

  const togglePolicyStatus = useCallback(async (policyId: string) => {
    const result = await policyService.toggleOperatorStatus(policyId);
    if (result.success) {
      setOperatorPolicies(prev => prev.map(p =>
        p.id === policyId
          ? { ...p, status: p.status === 'active' ? 'inactive' : 'active', updatedAt: new Date().toISOString() }
          : p
      ));
    }
  }, []);

  const savePlatformPolicy = useCallback(async (data: Partial<PlatformPolicy> & { id?: string }) => {
    const result = await policyService.savePlatformPolicy(data);
    if (result.success) {
      if (data.id) {
        setPlatformPolicies(prev => prev.map(p =>
          p.id === data.id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
        ));
      } else {
        setPlatformPolicies(prev => [...prev, result.data]);
      }
    }
  }, []);

  const publishPlatformPolicy = useCallback(async (policyId: string) => {
    const result = await policyService.publishPlatformPolicy(policyId);
    if (result.success) {
      setPlatformPolicies(prev => prev.map(p =>
        p.id === policyId
          ? { ...p, status: 'published' as const, publishedAt: new Date().toISOString(), lastPublishedVersion: p.version, updatedAt: new Date().toISOString() }
          : p
      ));
    }
  }, []);

  const archivePlatformPolicy = useCallback(async (policyId: string) => {
    const result = await policyService.archivePlatformPolicy(policyId);
    if (result.success) {
      setPlatformPolicies(prev => prev.map(p =>
        p.id === policyId ? { ...p, status: 'archived' as const, updatedAt: new Date().toISOString() } : p
      ));
    }
  }, []);

  const createOperatorRule = useCallback(async (data: Partial<OperatorPolicy>) => {
    const result = await policyService.createOperatorRule(data);
    if (result.success) {
      setOperatorPolicies(prev => [...prev, result.data]);
    }
  }, []);

  const deleteOperatorPolicy = useCallback(async (policyId: string) => {
    const result = await policyService.deleteOperatorPolicy(policyId);
    if (result.success) {
      setOperatorPolicies(prev => prev.filter(p => p.id !== policyId));
    }
  }, []);

  const refresh = useCallback(async () => {
    policyService.clearCache();
    await loadData();
  }, [loadData]);

  // ========== EXPORT ==========

  const exportCompanyPolicies = useCallback(() => {
    const data = filteredCompanyPolicies.map(p => ({
      'Societe': p.companyName || '-',
      'Type': POLICY_TYPE_LABELS[p.type] || p.type,
      'Titre': p.title,
      'Statut': p.status === 'active' ? 'Active' : 'Inactive',
      'Conformite': p.complianceStatus ? COMPLIANCE_LABELS[p.complianceStatus].label : '-',
      'Date effet': new Date(p.effectiveFrom).toLocaleDateString('fr-BF'),
      'Modifie le': new Date(p.updatedAt).toLocaleDateString('fr-BF'),
    }));
    exportToCSV(data, 'politiques-societes');
  }, [filteredCompanyPolicies]);

  // ========== FILTER HELPERS ==========

  const hasActiveFilters = searchTerm || companyFilter !== 'all' || typeFilter !== 'all' || complianceFilter !== 'all' || statusFilter !== 'all';

  const resetFilters = useCallback(() => {
    setSearchTerm('');
    setCompanyFilter('all');
    setTypeFilter('all');
    setComplianceFilter('all');
    setStatusFilter('all');
    setCurrentPage(1);
  }, []);

  return {
    activeTab, setActiveTab,
    platformPolicies: filteredPlatformPolicies,
    allPlatformPolicies: platformPolicies,
    companyPolicies: filteredCompanyPolicies,
    paginatedCompanyPolicies,
    policiesByCompany,
    filteredRules,
    platformRules,
    stats, error,

    searchTerm, setSearchTerm,
    companyFilter, setCompanyFilter,
    typeFilter, setTypeFilter,
    complianceFilter, setComplianceFilter,
    statusFilter, setStatusFilter,
    hasActiveFilters, resetFilters,

    currentPage, setCurrentPage,
    totalCompanyPages, pageSize,

    selectedPolicy, setSelectedPolicy,
    showDetailsModal, setShowDetailsModal,
    selectedPlatformForView, showPlatformViewModal, setShowPlatformViewModal,
    selectedPlatformPolicy, setSelectedPlatformPolicy,
    showPlatformEditor, setShowPlatformEditor,
    showCreateModal, setShowCreateModal,

    handleShowDetails, handleShowPlatformView, handleShowPlatformEditor,
    updateComplianceStatus, togglePolicyStatus,
    savePlatformPolicy, publishPlatformPolicy, archivePlatformPolicy,
    createOperatorRule, deleteOperatorPolicy,
    exportCompanyPolicies, refresh,
  };
}
