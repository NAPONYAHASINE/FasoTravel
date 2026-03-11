/**
 * @file useCompanyDetail.ts
 * @description Hook pour le détail d'une société de transport
 * 
 * Backend-ready : délègue à transportCompaniesService
 * ZÉRO import direct de mock data
 */

import { useState, useEffect, useCallback } from 'react';
import { transportCompaniesService } from '../services/entitiesService';
import type { TransportCompany } from '../shared/types/standardized';

export function useCompanyDetail(companyId: string | undefined) {
  const [company, setCompany] = useState<TransportCompany | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadCompany = useCallback(async () => {
    if (!companyId) return;
    setLoading(true);
    setError(null);

    try {
      const response = await transportCompaniesService.getById(companyId);
      if (response.success && response.data) {
        setCompany(response.data);
      } else {
        setError(response.error || 'Société introuvable');
        setCompany(null);
      }
    } catch (err: any) {
      setError(err.message || 'Erreur lors du chargement');
      setCompany(null);
    } finally {
      setLoading(false);
    }
  }, [companyId]);

  useEffect(() => {
    loadCompany();
  }, [loadCompany]);

  const approve = useCallback(async () => {
    if (!companyId) return { success: false, error: 'ID manquant' };
    const response = await transportCompaniesService.approve(companyId);
    if (response.success) {
      await loadCompany(); // Recharger les données
    }
    return response;
  }, [companyId, loadCompany]);

  const suspend = useCallback(async (reason: string) => {
    if (!companyId) return { success: false, error: 'ID manquant' };
    const response = await transportCompaniesService.suspend(companyId, reason);
    if (response.success) {
      await loadCompany();
    }
    return response;
  }, [companyId, loadCompany]);

  return {
    company,
    loading,
    error,
    refresh: loadCompany,
    approve,
    suspend,
  };
}
