/**
 * @file useIntegrationsPage.ts
 * @description Hook dedie page Integrations — Convention useAdminApp()
 * 
 * Architecture backend-ready :
 * - TOUTE la logique metier ici, ZERO dans le composant
 * - Bascule mock/prod transparente via services
 * - Pas de spinner bloquant
 * - Test de connexion via service (pas de fake delay inline)
 * - Alertes configurables par integration
 * - Services dedies Infobip + AWS
 */

import { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useIntegrations, useIntegrationActions, useFeatureFlags, useFeatureFlagActions } from './useEntities';
import { usePaydunYa } from './usePaydunYa';
import { integrationsService, featureFlagsService } from '../services/entitiesService';
import { infobipService } from '../services/infobipService';
import { awsStorageService } from '../services/awsStorageService';
import { alertsService } from '../services/alertsService';
import type {
  Integration,
  IntegrationAlertRule, IntegrationAlert,
  InfobipAccountInfo, AwsHealthReport,
} from '../shared/types/standardized';
import { toast } from 'sonner@2.0.3';

// ============================================================================
// TYPES
// ============================================================================

type TabId = 'overview' | 'payment' | 'communication' | 'tools' | 'flags' | 'alerts';

interface ConfigForm {
  name: string;
  provider: string;
  type: Integration['type'];
  apiKey: string;
  apiSecret: string;
  webhookUrl: string;
  docsUrl: string;
  dashboardUrl: string;
}

interface FlagForm {
  name: string;
  key: string;
  description: string;
  rolloutPercentage: string;
}

interface AlertRuleForm {
  integrationId: string;
  type: string;
  label: string;
  threshold: string;
  unit: string;
  severity: string;
  notifyEmail: boolean;
  notifySms: boolean;
}

const EMPTY_CONFIG_FORM: ConfigForm = {
  name: '', provider: '', type: 'sms',
  apiKey: '', apiSecret: '', webhookUrl: '',
  docsUrl: '', dashboardUrl: '',
};

const EMPTY_FLAG_FORM: FlagForm = {
  name: '', key: '', description: '', rolloutPercentage: '0',
};

const EMPTY_ALERT_RULE_FORM: AlertRuleForm = {
  integrationId: '', type: 'quota_exceeded', label: '',
  threshold: '', unit: '%', severity: 'warning',
  notifyEmail: true, notifySms: false,
};

// ============================================================================
// HOOK
// ============================================================================

export function useIntegrationsPage() {
  // --- Data hooks ---
  const paydunya = usePaydunYa();
  const { data: integrations, refresh: refreshIntegrations } = useIntegrations();
  const integrationActions = useIntegrationActions();
  const { data: featureFlags, refresh: refreshFlags } = useFeatureFlags();
  const flagActions = useFeatureFlagActions();

  // --- Alerts state ---
  const [alertRules, setAlertRules] = useState<IntegrationAlertRule[]>([]);
  const [alerts, setAlerts] = useState<IntegrationAlert[]>([]);
  const alertsLoadedRef = useRef(false);

  // --- Dedicated services state ---
  const [infobipAccount, setInfobipAccount] = useState<InfobipAccountInfo | null>(null);
  const [awsHealth, setAwsHealth] = useState<AwsHealthReport | null>(null);
  const [serviceLoading, setServiceLoading] = useState<Record<string, boolean>>({});

  // --- UI State ---
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'inactive' | 'error'>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [showApiKeys, setShowApiKeys] = useState<Set<string>>(new Set());
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [testingId, setTestingId] = useState<string | null>(null);

  // --- Modals ---
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState<string | null>(null);
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [showDeleteFlagConfirm, setShowDeleteFlagConfirm] = useState<string | null>(null);
  const [showAlertRuleModal, setShowAlertRuleModal] = useState(false);
  const [showDeleteRuleConfirm, setShowDeleteRuleConfirm] = useState<string | null>(null);
  const [showTestSmsModal, setShowTestSmsModal] = useState(false);
  const [testSmsPhone, setTestSmsPhone] = useState('');

  // --- Forms ---
  const [configForm, setConfigForm] = useState<ConfigForm>(EMPTY_CONFIG_FORM);
  const [flagForm, setFlagForm] = useState<FlagForm>(EMPTY_FLAG_FORM);
  const [alertRuleForm, setAlertRuleForm] = useState<AlertRuleForm>(EMPTY_ALERT_RULE_FORM);

  // --- Load alerts on mount ---
  useEffect(() => {
    if (!alertsLoadedRef.current) {
      alertsLoadedRef.current = true;
      refreshAlerts();
      refreshAlertRules();
    }
  }, []);

  // --- Computed ---
  const nonPaymentIntegrations = useMemo(
    () => integrations.filter(i => i.type !== 'payment'),
    [integrations]
  );

  const stats = useMemo(() => {
    const total = integrations.length;
    const active = integrations.filter(i => i.status === 'active').length;
    const errors = integrations.filter(i => i.status === 'error').length;
    const subscriptionCost = nonPaymentIntegrations
      .filter(i => i.billingType === 'subscription')
      .reduce((sum, i) => sum + (i.monthlyCostFcfa || 0), 0);
    const activeAlerts = alerts.filter(a => !a.acknowledged).length;
    return { total, active, errors, subscriptionCost, activeAlerts };
  }, [integrations, nonPaymentIntegrations, alerts]);

  const filteredIntegrations = useMemo(() => {
    let filtered = [...nonPaymentIntegrations];
    if (activeTab === 'communication') filtered = filtered.filter(i => i.type === 'sms' || i.type === 'email');
    else if (activeTab === 'tools') filtered = filtered.filter(i => i.type === 'analytics' || i.type === 'mapping' || i.type === 'storage');

    if (statusFilter !== 'all') filtered = filtered.filter(i => i.status === statusFilter);
    if (typeFilter !== 'all') filtered = filtered.filter(i => i.type === typeFilter);

    if (searchTerm) {
      const lower = searchTerm.toLowerCase();
      filtered = filtered.filter(i =>
        i.name.toLowerCase().includes(lower) || i.provider.toLowerCase().includes(lower)
      );
    }

    const order: Record<string, number> = { error: 0, inactive: 1, active: 2 };
    filtered.sort((a, b) => (order[a.status] ?? 9) - (order[b.status] ?? 9));
    return filtered;
  }, [nonPaymentIntegrations, activeTab, statusFilter, typeFilter, searchTerm]);

  // --- Common actions ---

  const toggleApiKeyVisibility = useCallback((id: string) => {
    setShowApiKeys(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const toggleExpand = useCallback((id: string) => {
    setExpandedRows(prev => { const n = new Set(prev); n.has(id) ? n.delete(id) : n.add(id); return n; });
  }, []);

  const copyToClipboard = useCallback((text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copie dans le presse-papiers');
  }, []);

  // --- Integration CRUD ---

  const toggleIntegrationStatus = useCallback(async (id: string) => {
    const result = await integrationActions.toggleStatus(id);
    await refreshIntegrations();
    if (result?.success) {
      toast.success(`Service ${result.data?.status === 'active' ? 'active' : 'desactive'}`);
    } else {
      toast.error('Echec du changement de statut');
    }
  }, [integrationActions, refreshIntegrations]);

  const testConnection = useCallback(async (id: string) => {
    setTestingId(id);
    try {
      const response = await integrationsService.testConnection(id);
      if (response.success && response.data) {
        if (response.data.success) {
          toast.success(`${response.data.message} (${response.data.latencyMs}ms)`);
        } else {
          toast.error(response.data.message);
        }
      } else {
        toast.error(response.error || 'Erreur de test');
      }
    } catch {
      toast.error('Erreur inattendue');
    } finally {
      setTestingId(null);
    }
  }, []);

  const openConfigModal = useCallback((integration: Integration) => {
    setSelectedIntegration(integration);
    setConfigForm({
      name: integration.name, provider: integration.provider, type: integration.type,
      apiKey: integration.apiKey || '', apiSecret: integration.apiSecret || '',
      webhookUrl: integration.webhookUrl || '', docsUrl: integration.docsUrl || '',
      dashboardUrl: integration.dashboardUrl || '',
    });
    setShowConfigModal(true);
  }, []);

  const saveConfig = useCallback(async () => {
    if (!selectedIntegration) return;
    await integrationActions.update(selectedIntegration.id, {
      name: configForm.name, provider: configForm.provider,
      apiKey: configForm.apiKey, apiSecret: configForm.apiSecret,
      webhookUrl: configForm.webhookUrl, docsUrl: configForm.docsUrl,
      dashboardUrl: configForm.dashboardUrl,
    });
    await refreshIntegrations();
    setShowConfigModal(false);
    setSelectedIntegration(null);
    toast.success('Configuration sauvegardee');
  }, [selectedIntegration, configForm, integrationActions, refreshIntegrations]);

  const openAddModal = useCallback(() => { setConfigForm(EMPTY_CONFIG_FORM); setShowAddModal(true); }, []);

  const addIntegration = useCallback(async () => {
    if (!configForm.name || !configForm.provider) { toast.error('Nom et fournisseur sont requis'); return; }
    await integrationActions.create({
      name: configForm.name, provider: configForm.provider, type: configForm.type,
      apiKey: configForm.apiKey || undefined, apiSecret: configForm.apiSecret || undefined,
      webhookUrl: configForm.webhookUrl || undefined, docsUrl: configForm.docsUrl || undefined,
      dashboardUrl: configForm.dashboardUrl || undefined,
      billingType: 'usage', status: 'inactive',
    });
    await refreshIntegrations();
    setShowAddModal(false);
    setConfigForm(EMPTY_CONFIG_FORM);
    toast.success('Service ajoute');
  }, [configForm, integrationActions, refreshIntegrations]);

  const confirmDeleteIntegration = useCallback((id: string) => setShowDeleteConfirm(id), []);

  const deleteIntegration = useCallback(async () => {
    if (!showDeleteConfirm) return;
    const name = integrations.find(i => i.id === showDeleteConfirm)?.name;
    await integrationActions.remove(showDeleteConfirm);
    await refreshIntegrations();
    setShowDeleteConfirm(null);
    toast.success(`${name || 'Service'} supprime`);
  }, [showDeleteConfirm, integrations, integrationActions, refreshIntegrations]);

  // --- Feature Flags ---

  const toggleFlag = useCallback(async (id: string) => {
    await flagActions.toggle(id);
    await refreshFlags();
    toast.success('Feature flag mis a jour');
  }, [flagActions, refreshFlags]);

  const openAddFlagModal = useCallback(() => { setFlagForm(EMPTY_FLAG_FORM); setShowFlagModal(true); }, []);

  const addFlag = useCallback(async () => {
    if (!flagForm.name || !flagForm.key) { toast.error('Nom et cle requis'); return; }
    await featureFlagsService.create({
      name: flagForm.name, key: flagForm.key, description: flagForm.description,
      enabled: false, rolloutPercentage: parseInt(flagForm.rolloutPercentage, 10) || 0,
    });
    await refreshFlags();
    setShowFlagModal(false);
    setFlagForm(EMPTY_FLAG_FORM);
    toast.success('Feature flag cree');
  }, [flagForm, refreshFlags]);

  const confirmDeleteFlag = useCallback((id: string) => setShowDeleteFlagConfirm(id), []);

  const deleteFlag = useCallback(async () => {
    if (!showDeleteFlagConfirm) return;
    const name = featureFlags.find(f => f.id === showDeleteFlagConfirm)?.name;
    await featureFlagsService.delete(showDeleteFlagConfirm);
    await refreshFlags();
    setShowDeleteFlagConfirm(null);
    toast.success(`${name || 'Flag'} supprime`);
  }, [showDeleteFlagConfirm, featureFlags, refreshFlags]);

  // --- Alerts ---

  const refreshAlertRules = useCallback(async () => {
    const res = await alertsService.getRules();
    if (res.success && res.data) setAlertRules(res.data);
  }, []);

  const refreshAlerts = useCallback(async () => {
    const res = await alertsService.getAlerts();
    if (res.success && res.data) setAlerts(res.data);
  }, []);

  const openAddAlertRuleModal = useCallback(() => {
    setAlertRuleForm(EMPTY_ALERT_RULE_FORM);
    setShowAlertRuleModal(true);
  }, []);

  const addAlertRule = useCallback(async () => {
    if (!alertRuleForm.label || !alertRuleForm.threshold || !alertRuleForm.integrationId) {
      toast.error('Integration, label et seuil requis');
      return;
    }
    await alertsService.createRule({
      integrationId: alertRuleForm.integrationId,
      type: alertRuleForm.type as any,
      label: alertRuleForm.label,
      threshold: parseFloat(alertRuleForm.threshold),
      unit: alertRuleForm.unit,
      severity: alertRuleForm.severity as any,
      enabled: true,
      notifyEmail: alertRuleForm.notifyEmail,
      notifySms: alertRuleForm.notifySms,
    });
    await refreshAlertRules();
    setShowAlertRuleModal(false);
    setAlertRuleForm(EMPTY_ALERT_RULE_FORM);
    toast.success('Regle d\'alerte creee');
  }, [alertRuleForm, refreshAlertRules]);

  const toggleAlertRule = useCallback(async (id: string) => {
    await alertsService.toggleRule(id);
    await refreshAlertRules();
    toast.success('Regle mise a jour');
  }, [refreshAlertRules]);

  const confirmDeleteRule = useCallback((id: string) => setShowDeleteRuleConfirm(id), []);

  const deleteAlertRule = useCallback(async () => {
    if (!showDeleteRuleConfirm) return;
    await alertsService.deleteRule(showDeleteRuleConfirm);
    await refreshAlertRules();
    setShowDeleteRuleConfirm(null);
    toast.success('Regle supprimee');
  }, [showDeleteRuleConfirm, refreshAlertRules]);

  const acknowledgeAlert = useCallback(async (id: string) => {
    await alertsService.acknowledgeAlert(id);
    await refreshAlerts();
    toast.success('Alerte acquittee');
  }, [refreshAlerts]);

  // --- Infobip dedicated actions ---

  const loadInfobipAccount = useCallback(async () => {
    setServiceLoading(prev => ({ ...prev, infobip: true }));
    try {
      const res = await infobipService.getAccountInfo();
      if (res.success && res.data) setInfobipAccount(res.data);
    } finally {
      setServiceLoading(prev => ({ ...prev, infobip: false }));
    }
  }, []);

  const infobipHealthCheck = useCallback(async () => {
    setServiceLoading(prev => ({ ...prev, infobipHealth: true }));
    try {
      const res = await infobipService.healthCheck();
      if (res.success && res.data) {
        if (res.data.apiReachable) {
          toast.success(`Infobip OK — ${res.data.latencyMs}ms, Sender ID ${res.data.senderIdActive ? 'actif' : 'inactif'}`);
        } else {
          toast.error('Infobip API non joignable');
        }
      }
      return res.data;
    } finally {
      setServiceLoading(prev => ({ ...prev, infobipHealth: false }));
    }
  }, []);

  const sendTestSms = useCallback(async () => {
    if (!testSmsPhone) { toast.error('Numero requis'); return; }
    setServiceLoading(prev => ({ ...prev, testSms: true }));
    try {
      const res = await infobipService.sendTestSms(testSmsPhone);
      if (res.success && res.data) {
        if (res.data.success) {
          toast.success(`SMS envoye a ${res.data.to} — ${res.data.deliveryTime}s`);
          setShowTestSmsModal(false);
          setTestSmsPhone('');
        } else {
          toast.error(res.data.errorMessage || 'Echec envoi SMS');
        }
      }
    } finally {
      setServiceLoading(prev => ({ ...prev, testSms: false }));
    }
  }, [testSmsPhone]);

  // --- AWS dedicated actions ---

  const loadAwsHealth = useCallback(async () => {
    setServiceLoading(prev => ({ ...prev, aws: true }));
    try {
      const res = await awsStorageService.getHealthReport();
      if (res.success && res.data) setAwsHealth(res.data);
    } finally {
      setServiceLoading(prev => ({ ...prev, aws: false }));
    }
  }, []);

  const purgeCdnCache = useCallback(async (paths?: string[]) => {
    setServiceLoading(prev => ({ ...prev, cdnPurge: true }));
    try {
      const res = await awsStorageService.purgeCdnCache(paths);
      if (res.success && res.data) {
        toast.success(`Cache CDN purge — ${res.data.paths.join(', ')} (~${res.data.estimatedTimeSec}s)`);
      } else {
        toast.error('Echec purge CDN');
      }
    } finally {
      setServiceLoading(prev => ({ ...prev, cdnPurge: false }));
    }
  }, []);

  const restartLightsail = useCallback(async () => {
    setServiceLoading(prev => ({ ...prev, lightsailRestart: true }));
    try {
      const res = await awsStorageService.restartInstance();
      if (res.success && res.data) {
        toast.success(`${res.data.message} (~${res.data.estimatedDowntimeSec}s d'arret)`);
      } else {
        toast.error('Echec redemarrage Lightsail');
      }
    } finally {
      setServiceLoading(prev => ({ ...prev, lightsailRestart: false }));
    }
  }, []);

  // --- Return ---

  return {
    // Data
    paydunya, integrations, nonPaymentIntegrations, featureFlags,
    stats, filteredIntegrations,
    alertRules, alerts,
    infobipAccount, awsHealth,
    serviceLoading,

    // UI state
    activeTab, setActiveTab,
    searchTerm, setSearchTerm,
    statusFilter, setStatusFilter,
    typeFilter, setTypeFilter,
    showApiKeys, expandedRows, testingId,

    // Modals
    selectedIntegration,
    showConfigModal, setShowConfigModal,
    showAddModal, setShowAddModal,
    showDeleteConfirm, setShowDeleteConfirm,
    showFlagModal, setShowFlagModal,
    showDeleteFlagConfirm, setShowDeleteFlagConfirm,
    showAlertRuleModal, setShowAlertRuleModal,
    showDeleteRuleConfirm, setShowDeleteRuleConfirm,
    showTestSmsModal, setShowTestSmsModal,
    testSmsPhone, setTestSmsPhone,

    // Forms
    configForm, setConfigForm,
    flagForm, setFlagForm,
    alertRuleForm, setAlertRuleForm,

    // Actions
    actions: {
      // Common
      toggleApiKeyVisibility, toggleExpand, copyToClipboard,
      // Integrations CRUD
      toggleIntegrationStatus, testConnection, openConfigModal, saveConfig,
      openAddModal, addIntegration, confirmDeleteIntegration, deleteIntegration,
      cancelDelete: () => setShowDeleteConfirm(null),
      // Feature Flags
      toggleFlag, openAddFlagModal, addFlag, confirmDeleteFlag, deleteFlag,
      cancelDeleteFlag: () => setShowDeleteFlagConfirm(null),
      // Alerts
      refreshAlertRules, refreshAlerts,
      openAddAlertRuleModal, addAlertRule, toggleAlertRule,
      confirmDeleteRule, deleteAlertRule,
      cancelDeleteRule: () => setShowDeleteRuleConfirm(null),
      acknowledgeAlert,
      // Infobip
      loadInfobipAccount, infobipHealthCheck, sendTestSms,
      openTestSmsModal: () => { setTestSmsPhone(''); setShowTestSmsModal(true); },
      // AWS
      loadAwsHealth, purgeCdnCache, restartLightsail,
    },
  };
}