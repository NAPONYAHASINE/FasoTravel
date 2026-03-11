/**
 * @file alertsService.ts
 * @description Service d'alertes configurables par integration
 * 
 * Architecture backend-ready :
 * - Mode mock : regles et alertes simulees
 * - Mode production : appels API vers /admin/alerts/*
 * 
 * ENDPOINTS MAPPES :
 * GET    /admin/alerts/rules             → getRules()
 * POST   /admin/alerts/rules             → createRule()
 * PUT    /admin/alerts/rules/:id/toggle  → toggleRule()
 * DELETE /admin/alerts/rules/:id         → deleteRule()
 * GET    /admin/alerts                   → getAlerts()
 * PUT    /admin/alerts/:id/acknowledge   → acknowledgeAlert()
 * GET    /admin/alerts/active-count      → getActiveCount()
 */

import { AppConfig } from '../config/app.config';
import { apiService } from './apiService';
import type { IntegrationAlertRule, IntegrationAlert, AlertRuleType, AlertSeverity } from '../shared/types/standardized';
import { MOCK_ALERT_RULES, MOCK_INTEGRATION_ALERTS } from '../lib/adminMockData';

interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
}

// ============================================================================
// SERVICE
// ============================================================================

class AlertsService {
  private mockRules = [...MOCK_ALERT_RULES];
  private mockAlerts = [...MOCK_INTEGRATION_ALERTS];

  /**
   * Recuperer toutes les regles d'alerte
   */
  async getRules(): Promise<ApiResponse<IntegrationAlertRule[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: [...this.mockRules] };
    }
    return await apiService.get('/admin/alerts/rules');
  }

  /**
   * Creer une nouvelle regle
   */
  async createRule(rule: Omit<IntegrationAlertRule, 'id' | 'currentValue' | 'createdAt'>): Promise<ApiResponse<IntegrationAlertRule>> {
    if (AppConfig.isMock) {
      const newRule: IntegrationAlertRule = {
        ...rule,
        id: `rule_${Date.now()}`,
        currentValue: 0,
        createdAt: new Date().toISOString(),
      };
      this.mockRules.push(newRule);
      return { success: true, data: { ...newRule } };
    }
    return await apiService.post('/admin/alerts/rules', rule);
  }

  /**
   * Activer/desactiver une regle
   */
  async toggleRule(id: string): Promise<ApiResponse<IntegrationAlertRule>> {
    if (AppConfig.isMock) {
      const idx = this.mockRules.findIndex(r => r.id === id);
      if (idx === -1) return { success: false, error: 'Regle non trouvee' };
      this.mockRules[idx] = { ...this.mockRules[idx], enabled: !this.mockRules[idx].enabled };
      return { success: true, data: { ...this.mockRules[idx] } };
    }
    return await apiService.put(`/admin/alerts/rules/${id}/toggle`);
  }

  /**
   * Supprimer une regle
   */
  async deleteRule(id: string): Promise<ApiResponse<void>> {
    if (AppConfig.isMock) {
      const idx = this.mockRules.findIndex(r => r.id === id);
      if (idx !== -1) this.mockRules.splice(idx, 1);
      return { success: true, data: undefined };
    }
    return await apiService.delete(`/admin/alerts/rules/${id}`);
  }

  /**
   * Recuperer toutes les alertes (historique)
   */
  async getAlerts(): Promise<ApiResponse<IntegrationAlert[]>> {
    if (AppConfig.isMock) {
      return { success: true, data: [...this.mockAlerts].sort((a, b) => new Date(b.triggeredAt).getTime() - new Date(a.triggeredAt).getTime()) };
    }
    return await apiService.get('/admin/alerts');
  }

  /**
   * Acquitter une alerte
   */
  async acknowledgeAlert(id: string): Promise<ApiResponse<IntegrationAlert>> {
    if (AppConfig.isMock) {
      const idx = this.mockAlerts.findIndex(a => a.id === id);
      if (idx === -1) return { success: false, error: 'Alerte non trouvee' };
      this.mockAlerts[idx] = { ...this.mockAlerts[idx], acknowledged: true, acknowledgedAt: new Date().toISOString() };
      return { success: true, data: { ...this.mockAlerts[idx] } };
    }
    return await apiService.put(`/admin/alerts/${id}/acknowledge`);
  }

  /**
   * Nombre d'alertes non acquittees
   */
  async getActiveCount(): Promise<ApiResponse<number>> {
    if (AppConfig.isMock) {
      const count = this.mockAlerts.filter(a => !a.acknowledged).length;
      return { success: true, data: count };
    }
    return await apiService.get('/admin/alerts/active-count');
  }
}

export const alertsService = new AlertsService();