/**
 * Hook réutilisable pour la gestion des promotions
 * Backend-ready: Gère le loading, erreurs, cache, et toutes les actions CRUD
 * 
 * USAGE:
 * ```tsx
 * const {
 *   promotions, stats, refresh,
 *   createPromotion, updatePromotion, deletePromotion,
 *   approvePromotion, rejectPromotion, toggleActive
 * } = usePromotions({ loadStats: true });
 * ```
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { promotionService } from '../services/promotionService';
import type { Promotion, PromotionStats, PromotionFormData } from '../services/promotionService';

// Re-export types
export type { Promotion, PromotionStats, PromotionFormData };

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export interface UsePromotionsOptions {
  loadStats?: boolean;
}

export interface UsePromotionsReturn {
  promotions: Promotion[];
  stats: PromotionStats | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
  // CRUD
  createPromotion: (data: PromotionFormData) => Promise<boolean>;
  updatePromotion: (id: string, data: Partial<PromotionFormData>) => Promise<boolean>;
  deletePromotion: (id: string) => Promise<boolean>;
  // Workflow
  approvePromotion: (id: string) => Promise<boolean>;
  rejectPromotion: (id: string, reason: string) => Promise<boolean>;
  toggleActive: (id: string, currentlyActive: boolean) => Promise<boolean>;
}

export function usePromotions(
  options: UsePromotionsOptions = {}
): UsePromotionsReturn {
  const { loadStats = true } = options;

  const [promotions, setPromotions] = useState<Promotion[]>([]);
  const [stats, setStats] = useState<PromotionStats | null>(null);
  const [loading, _setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const loadedRef = useRef(false);

  const fetchData = useCallback(async () => {
    try {
      const [promoData, statsData] = await Promise.all([
        promotionService.getAllPromotions(),
        loadStats ? promotionService.getPromotionStats() : Promise.resolve(null),
      ]);
      setPromotions([...promoData]);
      if (statsData) setStats(statsData);
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur inconnue');
    }
  }, [loadStats]);

  useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    fetchData();
  }, [fetchData]);

  // ==================== CRUD ====================

  const createPromotion = useCallback(async (data: PromotionFormData): Promise<boolean> => {
    try {
      await promotionService.createPromotion(data);
      await fetchData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la création');
      return false;
    }
  }, [fetchData]);

  const updatePromotion = useCallback(async (id: string, data: Partial<PromotionFormData>): Promise<boolean> => {
    try {
      await promotionService.updatePromotion(id, data);
      await fetchData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la modification');
      return false;
    }
  }, [fetchData]);

  const deletePromotion = useCallback(async (id: string): Promise<boolean> => {
    try {
      await promotionService.deletePromotion(id);
      await fetchData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de la suppression');
      return false;
    }
  }, [fetchData]);

  // ==================== WORKFLOW ====================

  const approvePromotion = useCallback(async (id: string): Promise<boolean> => {
    try {
      await promotionService.approvePromotion(id);
      await fetchData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors de l\'approbation');
      return false;
    }
  }, [fetchData]);

  const rejectPromotion = useCallback(async (id: string, reason: string): Promise<boolean> => {
    try {
      await promotionService.rejectPromotion(id, reason);
      await fetchData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du rejet');
      return false;
    }
  }, [fetchData]);

  const toggleActive = useCallback(async (id: string, currentlyActive: boolean): Promise<boolean> => {
    try {
      if (currentlyActive) {
        await promotionService.deactivatePromotion(id);
      } else {
        await promotionService.activatePromotion(id);
      }
      await fetchData();
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur lors du changement de statut');
      return false;
    }
  }, [fetchData]);

  return {
    promotions,
    stats,
    loading,
    error,
    refresh: fetchData,
    createPromotion,
    updatePromotion,
    deletePromotion,
    approvePromotion,
    rejectPromotion,
    toggleActive,
  };
}
