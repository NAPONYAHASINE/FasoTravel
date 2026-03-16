/**
 * @file policyService.ts
 * @description Service Politiques & Conditions FasoTravel Admin
 * Backend-ready: Mock service qui bascule transparent via AppConfig.isMock
 * 
 * RESPONSABILITES:
 * - Interface entre frontend et backend pour TOUTES les politiques
 * - En mode MOCK: utilise les donnees de /lib/adminMockData.ts
 * - En mode PRODUCTION: appels API via apiService
 * - ZERO generation de donnees dans ce service
 * 
 * 2 DOMAINES:
 * - OperatorPolicy: politiques des societes + regles FasoTravel (source: 'company' | 'platform')
 * - PlatformPolicy: pages legales (CGU, Confidentialite, regles plateforme)
 */

import { AppConfig } from '../config/app.config';
import { apiService } from './apiService';
import { ENDPOINTS } from './endpoints';
import {
  MOCK_OPERATOR_POLICIES,
  MOCK_PLATFORM_POLICIES,
} from '../lib/adminMockData';
import type { OperatorPolicy, PlatformPolicy } from '../shared/types/standardized';

// ============================================================================
// TYPES
// ============================================================================

export type ComplianceStatus = 'compliant' | 'review_needed' | 'non_compliant';

export interface ServiceResponse<T> {
  success: boolean;
  data: T;
  error?: string;
}

// ============================================================================
// CACHE EN MEMOIRE
// ============================================================================

let cachedOperatorPolicies: OperatorPolicy[] | null = null;
let cachedPlatformPolicies: PlatformPolicy[] | null = null;
let cacheTimestamp: number = 0;
const CACHE_DURATION = 60000; // 1 minute

function isCacheValid(): boolean {
  return Date.now() - cacheTimestamp < CACHE_DURATION;
}

function invalidateCache(): void {
  cachedOperatorPolicies = null;
  cachedPlatformPolicies = null;
  cacheTimestamp = 0;
}

// ============================================================================
// SERVICE
// ============================================================================

class PolicyService {
  // ==================== OPERATOR POLICIES ====================

  /**
   * Recupere toutes les OperatorPolicies (societes + regles plateforme)
   * Mode MOCK: Retourne MOCK_OPERATOR_POLICIES
   * Mode PRODUCTION: GET /api/admin/policies/operator
   */
  async getAllOperatorPolicies(): Promise<ServiceResponse<OperatorPolicy[]>> {
    if (cachedOperatorPolicies && isCacheValid()) {
      console.log('[PolicyService] Cache hit — operator policies');
      return { success: true, data: cachedOperatorPolicies };
    }

    if (AppConfig.isMock) {
      console.log(`[PolicyService] Mode MOCK — ${MOCK_OPERATOR_POLICIES.length} operator policies`);
      cachedOperatorPolicies = [...MOCK_OPERATOR_POLICIES];
      cacheTimestamp = Date.now();
      return { success: true, data: cachedOperatorPolicies };
    }

    try {
      const response = await apiService.get<OperatorPolicy[]>(
        ENDPOINTS.policies.operatorList()
      );
      cachedOperatorPolicies = response.data!;
      cacheTimestamp = Date.now();
      return { success: true, data: cachedOperatorPolicies };
    } catch (err) {
      return {
        success: false,
        data: cachedOperatorPolicies || [],
        error: err instanceof Error ? err.message : 'Erreur lors du chargement des politiques opérateur',
      };
    }
  }

  /**
   * Met a jour le statut de conformite d'une politique
   * Mode MOCK: Mise a jour locale du cache
   * Mode PRODUCTION: PATCH /api/admin/policies/operator/:id/compliance
   */
  async updateCompliance(
    policyId: string,
    status: ComplianceStatus,
    note?: string
  ): Promise<ServiceResponse<OperatorPolicy>> {
    if (AppConfig.isMock) {
      if (cachedOperatorPolicies) {
        cachedOperatorPolicies = cachedOperatorPolicies.map(p =>
          p.id === policyId
            ? { ...p, complianceStatus: status, complianceNote: note || p.complianceNote, updatedAt: new Date().toISOString() }
            : p
        );
      }
      const updated = cachedOperatorPolicies?.find(p => p.id === policyId);
      return { success: true, data: updated! };
    }

    try {
      const response = await apiService.patch<OperatorPolicy>(
        ENDPOINTS.policies.operatorUpdateCompliance(policyId),
        { complianceStatus: status, complianceNote: note }
      );
      invalidateCache();
      return { success: true, data: response.data! };
    } catch (err) {
      return {
        success: false,
        data: {} as OperatorPolicy,
        error: err instanceof Error ? err.message : 'Erreur mise a jour conformite',
      };
    }
  }

  /**
   * Toggle le statut actif/inactif d'une OperatorPolicy
   */
  async toggleOperatorStatus(policyId: string): Promise<ServiceResponse<OperatorPolicy>> {
    if (AppConfig.isMock) {
      if (cachedOperatorPolicies) {
        cachedOperatorPolicies = cachedOperatorPolicies.map(p =>
          p.id === policyId
            ? { ...p, status: p.status === 'active' ? 'inactive' : 'active', updatedAt: new Date().toISOString() }
            : p
        );
      }
      const updated = cachedOperatorPolicies?.find(p => p.id === policyId);
      return { success: true, data: updated! };
    }

    try {
      const response = await apiService.patch<OperatorPolicy>(
        ENDPOINTS.policies.operatorToggleStatus(policyId)
      );
      invalidateCache();
      return { success: true, data: response.data! };
    } catch (err) {
      return {
        success: false,
        data: {} as OperatorPolicy,
        error: err instanceof Error ? err.message : 'Erreur toggle statut',
      };
    }
  }

  /**
   * Cree une nouvelle regle FasoTravel (source: 'platform')
   */
  async createOperatorRule(data: Partial<OperatorPolicy>): Promise<ServiceResponse<OperatorPolicy>> {
    if (AppConfig.isMock) {
      const newRule: OperatorPolicy = {
        id: `policy_${Date.now()}`,
        type: (data.type || 'general') as OperatorPolicy['type'],
        title: data.title || '',
        description: data.description || '',
        rules: data.rules || {},
        source: 'platform',
        status: 'active',
        effectiveFrom: new Date().toISOString(),
        createdBy: 'admin_001',
        createdByName: 'Moussa Diarra',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      if (cachedOperatorPolicies) {
        cachedOperatorPolicies = [...cachedOperatorPolicies, newRule];
      }
      return { success: true, data: newRule };
    }

    try {
      const response = await apiService.post<OperatorPolicy>(
        ENDPOINTS.policies.operatorCreate(),
        data
      );
      invalidateCache();
      return { success: true, data: response.data! };
    } catch (err) {
      return {
        success: false,
        data: {} as OperatorPolicy,
        error: err instanceof Error ? err.message : 'Erreur creation regle',
      };
    }
  }

  /**
   * Supprime une OperatorPolicy
   */
  async deleteOperatorPolicy(policyId: string): Promise<ServiceResponse<void>> {
    if (AppConfig.isMock) {
      if (cachedOperatorPolicies) {
        cachedOperatorPolicies = cachedOperatorPolicies.filter(p => p.id !== policyId);
      }
      return { success: true, data: undefined };
    }

    try {
      await apiService.delete(ENDPOINTS.policies.operatorDelete(policyId));
      invalidateCache();
      return { success: true, data: undefined };
    } catch (err) {
      return {
        success: false,
        data: undefined,
        error: err instanceof Error ? err.message : 'Erreur suppression politique',
      };
    }
  }

  // ==================== PLATFORM POLICIES ====================

  /**
   * Recupere toutes les PlatformPolicies (CGU, Confidentialite, etc.)
   * Mode MOCK: Retourne MOCK_PLATFORM_POLICIES
   * Mode PRODUCTION: GET /api/admin/policies/platform
   */
  async getAllPlatformPolicies(): Promise<ServiceResponse<PlatformPolicy[]>> {
    if (cachedPlatformPolicies && isCacheValid()) {
      console.log('[PolicyService] Cache hit — platform policies');
      return { success: true, data: cachedPlatformPolicies };
    }

    if (AppConfig.isMock) {
      console.log(`[PolicyService] Mode MOCK — ${MOCK_PLATFORM_POLICIES.length} platform policies`);
      cachedPlatformPolicies = [...MOCK_PLATFORM_POLICIES];
      cacheTimestamp = Date.now();
      return { success: true, data: cachedPlatformPolicies };
    }

    try {
      const response = await apiService.get<PlatformPolicy[]>(
        ENDPOINTS.policies.platformList()
      );
      cachedPlatformPolicies = response.data!;
      cacheTimestamp = Date.now();
      return { success: true, data: cachedPlatformPolicies };
    } catch (err) {
      return {
        success: false,
        data: cachedPlatformPolicies || [],
        error: err instanceof Error ? err.message : 'Erreur chargement politiques plateforme',
      };
    }
  }

  /**
   * Cree ou met a jour une PlatformPolicy
   */
  async savePlatformPolicy(data: Partial<PlatformPolicy> & { id?: string }): Promise<ServiceResponse<PlatformPolicy>> {
    const isUpdate = !!data.id;

    if (AppConfig.isMock) {
      if (isUpdate) {
        if (cachedPlatformPolicies) {
          cachedPlatformPolicies = cachedPlatformPolicies.map(p =>
            p.id === data.id ? { ...p, ...data, updatedAt: new Date().toISOString() } : p
          );
        }
        const updated = cachedPlatformPolicies?.find(p => p.id === data.id);
        return { success: true, data: updated! };
      } else {
        const newPolicy: PlatformPolicy = {
          id: `plat_${Date.now()}`,
          type: data.type || 'platform_rule',
          title: data.title || '',
          content: data.content || '',
          summary: data.summary || '',
          version: data.version || '1.0',
          status: 'draft',
          scope: data.scope || 'global',
          createdBy: 'admin_001',
          createdByName: 'Moussa Diarra',
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };
        if (cachedPlatformPolicies) {
          cachedPlatformPolicies = [...cachedPlatformPolicies, newPolicy];
        }
        return { success: true, data: newPolicy };
      }
    }

    try {
      const response = isUpdate
        ? await apiService.put<PlatformPolicy>(ENDPOINTS.policies.platformUpdate(data.id!), data)
        : await apiService.post<PlatformPolicy>(ENDPOINTS.policies.platformCreate(), data);
      invalidateCache();
      return { success: true, data: response.data! };
    } catch (err) {
      return {
        success: false,
        data: {} as PlatformPolicy,
        error: err instanceof Error ? err.message : `Erreur ${isUpdate ? 'mise a jour' : 'creation'} politique plateforme`,
      };
    }
  }

  /**
   * Publie une PlatformPolicy
   */
  async publishPlatformPolicy(policyId: string): Promise<ServiceResponse<PlatformPolicy>> {
    if (AppConfig.isMock) {
      if (cachedPlatformPolicies) {
        cachedPlatformPolicies = cachedPlatformPolicies.map(p =>
          p.id === policyId
            ? {
                ...p,
                status: 'published' as const,
                publishedAt: new Date().toISOString(),
                lastPublishedVersion: p.version,
                updatedAt: new Date().toISOString(),
              }
            : p
        );
      }
      const updated = cachedPlatformPolicies?.find(p => p.id === policyId);
      return { success: true, data: updated! };
    }

    try {
      const response = await apiService.patch<PlatformPolicy>(
        ENDPOINTS.policies.platformPublish(policyId)
      );
      invalidateCache();
      return { success: true, data: response.data! };
    } catch (err) {
      return {
        success: false,
        data: {} as PlatformPolicy,
        error: err instanceof Error ? err.message : 'Erreur publication',
      };
    }
  }

  /**
   * Archive une PlatformPolicy
   */
  async archivePlatformPolicy(policyId: string): Promise<ServiceResponse<PlatformPolicy>> {
    if (AppConfig.isMock) {
      if (cachedPlatformPolicies) {
        cachedPlatformPolicies = cachedPlatformPolicies.map(p =>
          p.id === policyId
            ? { ...p, status: 'archived' as const, updatedAt: new Date().toISOString() }
            : p
        );
      }
      const updated = cachedPlatformPolicies?.find(p => p.id === policyId);
      return { success: true, data: updated! };
    }

    try {
      const response = await apiService.patch<PlatformPolicy>(
        ENDPOINTS.policies.platformArchive(policyId)
      );
      invalidateCache();
      return { success: true, data: response.data! };
    } catch (err) {
      return {
        success: false,
        data: {} as PlatformPolicy,
        error: err instanceof Error ? err.message : 'Erreur archivage',
      };
    }
  }

  /**
   * Invalide le cache manuellement (pour refresh)
   */
  clearCache(): void {
    invalidateCache();
    console.log('[PolicyService] Cache invalidated');
  }
}

// ============================================================================
// EXPORT SINGLETON
// ============================================================================

export const policyService = new PolicyService();
