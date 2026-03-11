/**
 * @file Integrations.tsx
 * @description Page Intégrations & Services — Admin FasoTravel
 * 
 * Architecture backend-ready (modèle BookingManagement) :
 * - TOUTE la logique métier dans useIntegrationsPage() + usePaydunYa()
 * - ZÉRO logique métier ici — UI thin layer uniquement
 * - Design-system FasoTravel (PAGE_CLASSES, StatCard, COMPONENTS)
 * - Tous les boutons fonctionnels (test connexion, delete avec confirm, toggle, config)
 * - Panneaux d'expansion spécifiques par API (Infobip, GA, Maps, AWS)
 */

import { useState } from 'react';
import {
  Settings, CreditCard, MessageSquare, Zap, Eye, EyeOff,
  AlertCircle, Search, Plus, Trash2, RefreshCw,
  TestTube, ExternalLink, Copy, Shield, Activity,
  CheckCircle2, XCircle, Clock, Globe, BarChart3,
  Plug, ChevronDown, ChevronUp, ToggleLeft, ToggleRight,
  Smartphone, Landmark, CircleDollarSign, Percent,
  ArrowUpRight, Heart, TrendingUp,
  AlertTriangle, Radio, HardDrive,
  Server, Database, Send, Users, MousePointerClick,
  Map, Cpu, FileText, Image, Gauge, DollarSign
} from 'lucide-react';
import { useIntegrationsPage } from '../../hooks/useIntegrationsPage';
import type { UsePaydunyaReturn } from '../../hooks/usePaydunYa';
import type { Integration, FeatureFlag, PaydunyaChannelKey, IntegrationAlertRule, IntegrationAlert } from '../../shared/types/standardized';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { StatCard } from '../ui/stat-card';
import { PAGE_CLASSES, COMPONENTS, GRADIENTS } from '../../lib/design-system';
import { toast } from 'sonner@2.0.3';

// ============================================================================
// CONSTANTS (display only — no business logic)
// ============================================================================

type TabId = 'overview' | 'payment' | 'communication' | 'tools' | 'flags' | 'alerts';

const TABS: { id: TabId; label: string; icon: any; badge?: (stats: any) => number }[] = [
  { id: 'overview', label: 'Vue d\'ensemble', icon: Activity },
  { id: 'payment', label: 'PaydunYa', icon: CreditCard },
  { id: 'communication', label: 'Communications', icon: MessageSquare },
  { id: 'tools', label: 'Outils', icon: Settings },
  { id: 'alerts', label: 'Alertes', icon: AlertTriangle, badge: (s: any) => s.activeAlerts },
  { id: 'flags', label: 'Feature Flags', icon: Zap },
];

const TYPE_LABELS: Record<string, string> = {
  payment: 'Paiement', sms: 'SMS & OTP', email: 'Email', analytics: 'Analytics', mapping: 'Cartographie', storage: 'Stockage & CDN',
};

const TYPE_ICONS: Record<string, any> = {
  payment: CreditCard, sms: MessageSquare, email: MessageSquare, analytics: BarChart3, mapping: Globe, storage: HardDrive,
};

const TYPE_COLORS: Record<string, string> = {
  payment: '#f59e0b', sms: '#3b82f6', email: '#ec4899', analytics: '#8b5cf6', mapping: '#16a34a', storage: '#f97316',
};

const CHANNEL_ICONS: Record<string, any> = {
  orange_money: Smartphone, moov_money: Smartphone, wave: Smartphone,
  sank_money: Smartphone, telecel_money: Smartphone, card: Landmark,
};

const CHANNEL_COLORS: Record<string, string> = {
  orange_money: '#ff6600', moov_money: '#0066cc', wave: '#1dc7ea',
  sank_money: '#e63946', telecel_money: '#00b894', card: '#6c5ce7',
};

const BILLING_LABELS: Record<string, string> = {
  free: 'Gratuit',
  subscription: 'Abonnement mensuel',
  usage: 'Facturation a l\'usage',
  client_charged: 'Frais client',
};

const BILLING_COLORS: Record<string, { bg: string; icon: any; border: string }> = {
  free: { bg: 'bg-green-50 dark:bg-green-900/20', icon: CheckCircle2, border: 'border-green-200 dark:border-green-800' },
  subscription: { bg: 'bg-blue-50 dark:bg-blue-900/20', icon: CreditCard, border: 'border-blue-200 dark:border-blue-800' },
  usage: { bg: 'bg-amber-50 dark:bg-amber-900/20', icon: BarChart3, border: 'border-amber-200 dark:border-amber-800' },
  client_charged: { bg: 'bg-purple-50 dark:bg-purple-900/20', icon: Users, border: 'border-purple-200 dark:border-purple-800' },
};

const maskKey = (key: string) => {
  if (!key || key.length < 8) return '••••••••';
  return key.slice(0, 4) + '••••' + key.slice(-4);
};

const formatFCFA = (n: number) => `${n.toLocaleString('fr-BF')} FCFA`;

const getStatusBadge = (status: string) => {
  const map: Record<string, { bg: string; dot: string; label: string; pulse?: boolean }> = {
    active: { bg: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800', dot: 'bg-green-500', label: 'Actif', pulse: true },
    error: { bg: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800', dot: 'bg-red-500', label: 'Erreur' },
    inactive: { bg: 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600', dot: 'bg-gray-400', label: 'Inactif' },
  };
  const s = map[status] || map.inactive;
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${s.bg}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${s.dot} ${s.pulse ? 'animate-pulse' : ''}`} />
      {s.label}
    </span>
  );
};

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function Integrations() {
  const page = useIntegrationsPage();
  const { actions } = page;

  return (
    <div className={PAGE_CLASSES.container}>
      {/* Header */}
      <div className={PAGE_CLASSES.header}>
        <div className={PAGE_CLASSES.headerContent}>
          <div className={PAGE_CLASSES.headerTexts}>
            <h1 className="text-3xl text-gray-900 dark:text-white mb-1">Integrations & Services</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Agregateur PaydunYa, services tiers et feature flags
            </p>
          </div>
          <div className={PAGE_CLASSES.headerActions}>
            <button onClick={actions.openAddModal} className={COMPONENTS.buttonPrimary} style={{ background: GRADIENTS.burkinabe }}>
              <Plus size={18} />
              Ajouter un service
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className={PAGE_CLASSES.statsGrid}>
        <StatCard
          title="Services configures"
          value={page.stats.total}
          subtitle={`${page.stats.active} actifs`}
          icon={Plug}
          color="blue"
        />
        <StatCard
          title="Canaux PaydunYa"
          value={`${page.paydunya.dashboard?.totals.activeChannels ?? 0}/${page.paydunya.dashboard?.totals.totalChannels ?? 0}`}
          subtitle={page.paydunya.dashboard?.health.apiReachable ? 'API operationnelle' : 'API non joignable'}
          icon={CreditCard}
          color="yellow"
        />
        <StatCard
          title="Transactions (total)"
          value={page.paydunya.dashboard?.totals.totalTransactions.toLocaleString('fr-BF') ?? '—'}
          subtitle={page.paydunya.dashboard ? formatFCFA(page.paydunya.dashboard.totals.totalRevenue) : '—'}
          icon={TrendingUp}
          color="green"
        />
        <StatCard
          title={page.stats.activeAlerts > 0 ? 'Alertes actives' : 'Taux de succes'}
          value={page.stats.activeAlerts > 0
            ? page.stats.activeAlerts
            : page.paydunya.dashboard ? `${page.paydunya.dashboard.totals.globalSuccessRate.toFixed(1)}%` : '—'
          }
          subtitle={
            page.stats.activeAlerts > 0
              ? `${page.stats.errors} service(s) en erreur`
              : page.stats.errors > 0 ? `${page.stats.errors} service(s) en erreur` : 'Tous operationnels'
          }
          icon={page.stats.activeAlerts > 0 ? AlertTriangle : page.stats.errors > 0 ? AlertCircle : CheckCircle2}
          color={page.stats.activeAlerts > 0 ? 'yellow' : page.stats.errors > 0 ? 'red' : 'green'}
        />
      </div>

      {/* Tabs */}
      <div className="mb-6">
        <div className="flex gap-1 bg-white dark:bg-gray-800 rounded-xl p-1.5 shadow-md border border-gray-200 dark:border-gray-700 overflow-x-auto">
          {TABS.map(tab => {
            const Icon = tab.icon;
            const isActive = page.activeTab === tab.id;
            const badgeCount = tab.badge ? tab.badge(page.stats) : 0;
            return (
              <button
                key={tab.id}
                onClick={() => page.setActiveTab(tab.id)}
                className={`relative flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                  isActive ? 'text-white shadow-md' : 'text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                style={isActive ? { background: GRADIENTS.activeRed } : undefined}
              >
                <Icon size={16} />
                {tab.label}
                {badgeCount > 0 && (
                  <span className={`ml-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${
                    isActive ? 'bg-white/30 text-white' : 'bg-red-500 text-white'
                  }`}>
                    {badgeCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* ============ PAYMENT TAB ============ */}
      {page.activeTab === 'payment' && (
        <PaydunyaTab paydunya={page.paydunya} copy={actions.copyToClipboard} />
      )}

      {/* ============ FLAGS TAB ============ */}
      {page.activeTab === 'flags' && (
        <FeatureFlagsTab
          flags={page.featureFlags}
          onToggle={actions.toggleFlag}
          onAdd={actions.openAddFlagModal}
          onDelete={actions.confirmDeleteFlag}
        />
      )}

      {/* ============ ALERTS TAB ============ */}
      {page.activeTab === 'alerts' && (
        <AlertsTab
          rules={page.alertRules}
          alerts={page.alerts}
          integrations={page.nonPaymentIntegrations}
          onToggleRule={actions.toggleAlertRule}
          onDeleteRule={actions.confirmDeleteRule}
          onAddRule={actions.openAddAlertRuleModal}
          onAcknowledge={actions.acknowledgeAlert}
          onRefresh={() => { actions.refreshAlerts(); actions.refreshAlertRules(); }}
        />
      )}

      {/* ============ OTHER TABS (overview / communication / tools) ============ */}
      {page.activeTab !== 'payment' && page.activeTab !== 'flags' && page.activeTab !== 'alerts' && (
        <>
          {/* Modele de facturation (overview only) */}
          {page.activeTab === 'overview' && (
            <div className="mb-6 bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-5">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
                  <DollarSign size={16} className="text-green-500" />
                  Modele de facturation des services
                </h3>
                <span className="text-xs text-gray-500 dark:text-gray-400">PaydunYa : frais a la charge du client</span>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {page.nonPaymentIntegrations.map(integ => (
                  <BillingCard key={integ.id} integration={integ} />
                ))}
              </div>
            </div>
          )}

          <div className={PAGE_CLASSES.searchSection}>
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
                <input
                  type="text"
                  placeholder="Rechercher par nom, fournisseur..."
                  value={page.searchTerm}
                  onChange={e => page.setSearchTerm(e.target.value)}
                  className={COMPONENTS.input.replace('w-full', 'w-full pl-12')}
                />
              </div>
              <div className="flex gap-3">
                <select
                  value={page.statusFilter}
                  onChange={e => page.setStatusFilter(e.target.value as any)}
                  className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                >
                  <option value="all">Tous les statuts</option>
                  <option value="active">Actifs</option>
                  <option value="inactive">Inactifs</option>
                  <option value="error">En erreur</option>
                </select>
                {page.activeTab === 'overview' && (
                  <select
                    value={page.typeFilter}
                    onChange={e => page.setTypeFilter(e.target.value)}
                    className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white text-sm appearance-none focus:outline-none focus:ring-2 focus:ring-red-500 transition-colors"
                  >
                    <option value="all">Tous les types</option>
                    <option value="sms">SMS & OTP</option>
                    <option value="email">Email</option>
                    <option value="analytics">Analytics</option>
                    <option value="mapping">Cartographie</option>
                    <option value="storage">Stockage & CDN</option>
                  </select>
                )}
              </div>
            </div>
            <p className="mt-3 text-xs text-gray-500 dark:text-gray-400">
              {page.filteredIntegrations.length} service{page.filteredIntegrations.length > 1 ? 's' : ''}
            </p>
          </div>

          <div className={PAGE_CLASSES.tableContainer}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    {['Service', 'Type', 'Statut', 'Cle API', 'Derniere sync', 'Actions'].map((h, i) => (
                      <th key={h} className={`px-6 py-4 text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider ${i === 5 ? 'text-right' : 'text-left'}`}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {page.filteredIntegrations.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-16 text-center text-gray-500 dark:text-gray-400">
                        <Plug className="mx-auto mb-3 text-gray-300 dark:text-gray-600" size={48} />
                        <p className="text-lg mb-1">Aucun service trouve</p>
                        <p className="text-sm">Modifiez vos filtres ou ajoutez un service</p>
                      </td>
                    </tr>
                  ) : page.filteredIntegrations.map((integ, idx) => {
                    const TypeIcon = TYPE_ICONS[integ.type] || Settings;
                    const expanded = page.expandedRows.has(integ.id);
                    const prev = idx > 0 ? page.filteredIntegrations[idx - 1].status : null;
                    const sep = prev && prev !== integ.status && (prev === 'error' || prev === 'inactive') && integ.status === 'active';

                    return (
                      <ServiceRow
                        key={integ.id}
                        integration={integ}
                        TypeIcon={TypeIcon}
                        expanded={expanded}
                        showSeparator={!!sep}
                        apiKeyVisible={page.showApiKeys.has(integ.id)}
                        testing={page.testingId === integ.id}
                        onToggleExpand={() => actions.toggleExpand(integ.id)}
                        onToggleApiKey={() => actions.toggleApiKeyVisibility(integ.id)}
                        onCopy={actions.copyToClipboard}
                        onConfigure={() => actions.openConfigModal(integ)}
                        onToggleStatus={() => actions.toggleIntegrationStatus(integ.id)}
                        onTest={() => actions.testConnection(integ.id)}
                        onDelete={() => actions.confirmDeleteIntegration(integ.id)}
                        pageActions={actions}
                        serviceLoading={page.serviceLoading}
                      />
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ============ CONFIG MODAL ============ */}
      <Dialog open={page.showConfigModal} onOpenChange={page.setShowConfigModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ backgroundColor: TYPE_COLORS[page.selectedIntegration?.type || 'sms'] }}>
                <Settings size={20} />
              </div>
              Configurer {page.selectedIntegration?.name}
            </DialogTitle>
            <DialogDescription>Modifier les parametres de connexion</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Nom" value={page.configForm.name} onChange={v => page.setConfigForm(f => ({ ...f, name: v }))} />
              <InputField label="Fournisseur" value={page.configForm.provider} onChange={v => page.setConfigForm(f => ({ ...f, provider: v }))} />
            </div>
            <InputField label="Cle API" value={page.configForm.apiKey} onChange={v => page.setConfigForm(f => ({ ...f, apiKey: v }))} icon={Shield} />
            <InputField label="Secret API" value={page.configForm.apiSecret} onChange={v => page.setConfigForm(f => ({ ...f, apiSecret: v }))} type="password" icon={Shield} />
            <InputField label="Webhook URL" value={page.configForm.webhookUrl} onChange={v => page.setConfigForm(f => ({ ...f, webhookUrl: v }))} icon={ExternalLink} />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="URL Documentation" value={page.configForm.docsUrl} onChange={v => page.setConfigForm(f => ({ ...f, docsUrl: v }))} />
              <InputField label="URL Dashboard" value={page.configForm.dashboardUrl} onChange={v => page.setConfigForm(f => ({ ...f, dashboardUrl: v }))} />
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={actions.saveConfig} className={COMPONENTS.buttonPrimary + ' flex-1 justify-center'} style={{ background: GRADIENTS.burkinabe }}>Sauvegarder</button>
              <button onClick={() => page.setShowConfigModal(false)} className={COMPONENTS.buttonSecondary}>Annuler</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============ ADD MODAL ============ */}
      <Dialog open={page.showAddModal} onOpenChange={page.setShowAddModal}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ background: GRADIENTS.burkinabe }}><Plus size={20} /></div>
              Nouveau service
            </DialogTitle>
            <DialogDescription>Les paiements sont geres via PaydunYa.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Nom *" value={page.configForm.name} onChange={v => page.setConfigForm(f => ({ ...f, name: v }))} placeholder="Ex: Infobip" />
              <InputField label="Fournisseur *" value={page.configForm.provider} onChange={v => page.setConfigForm(f => ({ ...f, provider: v }))} placeholder="Ex: Infobip Inc." />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Type *</label>
              <select value={page.configForm.type} onChange={e => page.setConfigForm(f => ({ ...f, type: e.target.value as any }))} className={COMPONENTS.input + ' appearance-none'}>
                <option value="sms">SMS & OTP</option>
                <option value="email">Email</option>
                <option value="analytics">Analytics</option>
                <option value="mapping">Cartographie</option>
                <option value="storage">Stockage & CDN</option>
              </select>
            </div>
            <InputField label="Cle API" value={page.configForm.apiKey} onChange={v => page.setConfigForm(f => ({ ...f, apiKey: v }))} icon={Shield} />
            <InputField label="Webhook URL" value={page.configForm.webhookUrl} onChange={v => page.setConfigForm(f => ({ ...f, webhookUrl: v }))} icon={ExternalLink} />
            <div className="flex gap-3 pt-2">
              <button onClick={actions.addIntegration} disabled={!page.configForm.name || !page.configForm.provider} className={COMPONENTS.buttonPrimary + ' flex-1 justify-center disabled:opacity-50'} style={{ background: GRADIENTS.burkinabe }}>
                <Plus size={16} /> Ajouter
              </button>
              <button onClick={() => page.setShowAddModal(false)} className={COMPONENTS.buttonSecondary}>Annuler</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============ DELETE CONFIRM MODAL ============ */}
      <Dialog open={!!page.showDeleteConfirm} onOpenChange={() => actions.cancelDelete()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-100 dark:bg-red-900/30">
                <Trash2 size={20} className="text-red-600" />
              </div>
              Supprimer ce service ?
            </DialogTitle>
            <DialogDescription>
              {(() => {
                const name = page.integrations.find(i => i.id === page.showDeleteConfirm)?.name;
                return `Le service "${name || ''}" sera definitivement supprime. Cette action est irreversible.`;
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <button onClick={actions.deleteIntegration} className="flex-1 px-4 py-2.5 rounded-lg text-sm text-white bg-red-600 hover:bg-red-700 transition-colors">
              Supprimer
            </button>
            <button onClick={actions.cancelDelete} className={COMPONENTS.buttonSecondary}>Annuler</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============ ADD FLAG MODAL ============ */}
      <Dialog open={page.showFlagModal} onOpenChange={page.setShowFlagModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ background: GRADIENTS.burkinabe }}><Zap size={20} /></div>
              Nouveau Feature Flag
            </DialogTitle>
            <DialogDescription>Creer un nouveau drapeau de fonctionnalite</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <InputField label="Nom *" value={page.flagForm.name} onChange={v => page.setFlagForm(f => ({ ...f, name: v }))} placeholder="Ex: Paiement Wave" />
            <InputField label="Cle technique *" value={page.flagForm.key} onChange={v => page.setFlagForm(f => ({ ...f, key: v }))} placeholder="Ex: wave_payment" />
            <InputField label="Description" value={page.flagForm.description} onChange={v => page.setFlagForm(f => ({ ...f, description: v }))} placeholder="Description courte..." />
            <InputField label="Deploiement (%)" value={page.flagForm.rolloutPercentage} onChange={v => page.setFlagForm(f => ({ ...f, rolloutPercentage: v }))} placeholder="0" />
            <div className="flex gap-3 pt-2">
              <button onClick={actions.addFlag} disabled={!page.flagForm.name || !page.flagForm.key} className={COMPONENTS.buttonPrimary + ' flex-1 justify-center disabled:opacity-50'} style={{ background: GRADIENTS.burkinabe }}>
                <Plus size={16} /> Creer
              </button>
              <button onClick={() => page.setShowFlagModal(false)} className={COMPONENTS.buttonSecondary}>Annuler</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============ DELETE FLAG CONFIRM ============ */}
      <Dialog open={!!page.showDeleteFlagConfirm} onOpenChange={() => actions.cancelDeleteFlag()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-100 dark:bg-red-900/30">
                <Trash2 size={20} className="text-red-600" />
              </div>
              Supprimer ce flag ?
            </DialogTitle>
            <DialogDescription>
              {(() => {
                const name = page.featureFlags.find(f => f.id === page.showDeleteFlagConfirm)?.name;
                return `Le feature flag "${name || ''}" sera supprime. Verifiez qu'aucun code en production ne depend de cette cle.`;
              })()}
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <button onClick={actions.deleteFlag} className="flex-1 px-4 py-2.5 rounded-lg text-sm text-white bg-red-600 hover:bg-red-700 transition-colors">
              Supprimer
            </button>
            <button onClick={actions.cancelDeleteFlag} className={COMPONENTS.buttonSecondary}>Annuler</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============ ALERT RULE MODAL ============ */}
      <Dialog open={page.showAlertRuleModal} onOpenChange={page.setShowAlertRuleModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white" style={{ background: GRADIENTS.burkinabe }}><AlertTriangle size={20} /></div>
              Nouvelle regle d'alerte
            </DialogTitle>
            <DialogDescription>Configurer un seuil de surveillance</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Service *</label>
              <select value={page.alertRuleForm.integrationId} onChange={e => page.setAlertRuleForm(f => ({ ...f, integrationId: e.target.value }))} className={COMPONENTS.input + ' appearance-none'}>
                <option value="">Selectionner...</option>
                {page.nonPaymentIntegrations.map(i => <option key={i.id} value={i.id}>{i.name}</option>)}
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Type</label>
                <select value={page.alertRuleForm.type} onChange={e => page.setAlertRuleForm(f => ({ ...f, type: e.target.value }))} className={COMPONENTS.input + ' appearance-none'}>
                  <option value="quota_exceeded">Quota depasse</option>
                  <option value="high_latency">Haute latence</option>
                  <option value="error_rate">Taux d'erreur</option>
                  <option value="cpu_high">CPU eleve</option>
                  <option value="memory_high">Memoire elevee</option>
                  <option value="storage_full">Stockage plein</option>
                  <option value="cost_spike">Pic de cout</option>
                  <option value="downtime">Indisponibilite</option>
                </select>
              </div>
              <div>
                <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">Severite</label>
                <select value={page.alertRuleForm.severity} onChange={e => page.setAlertRuleForm(f => ({ ...f, severity: e.target.value }))} className={COMPONENTS.input + ' appearance-none'}>
                  <option value="info">Info</option>
                  <option value="warning">Warning</option>
                  <option value="critical">Critique</option>
                </select>
              </div>
            </div>
            <InputField label="Label *" value={page.alertRuleForm.label} onChange={v => page.setAlertRuleForm(f => ({ ...f, label: v }))} placeholder="Ex: CPU Lightsail > 80%" />
            <div className="grid grid-cols-2 gap-4">
              <InputField label="Seuil *" value={page.alertRuleForm.threshold} onChange={v => page.setAlertRuleForm(f => ({ ...f, threshold: v }))} placeholder="80" />
              <InputField label="Unite" value={page.alertRuleForm.unit} onChange={v => page.setAlertRuleForm(f => ({ ...f, unit: v }))} placeholder="%" />
            </div>
            <div className="flex items-center gap-4 pt-1">
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={page.alertRuleForm.notifyEmail} onChange={e => page.setAlertRuleForm(f => ({ ...f, notifyEmail: e.target.checked }))} className="rounded border-gray-300" />
                Notifier par email
              </label>
              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                <input type="checkbox" checked={page.alertRuleForm.notifySms} onChange={e => page.setAlertRuleForm(f => ({ ...f, notifySms: e.target.checked }))} className="rounded border-gray-300" />
                Notifier par SMS
              </label>
            </div>
            <div className="flex gap-3 pt-2">
              <button onClick={actions.addAlertRule} disabled={!page.alertRuleForm.label || !page.alertRuleForm.threshold || !page.alertRuleForm.integrationId} className={COMPONENTS.buttonPrimary + ' flex-1 justify-center disabled:opacity-50'} style={{ background: GRADIENTS.burkinabe }}>
                <Plus size={16} /> Creer
              </button>
              <button onClick={() => page.setShowAlertRuleModal(false)} className={COMPONENTS.buttonSecondary}>Annuler</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============ DELETE RULE CONFIRM ============ */}
      <Dialog open={!!page.showDeleteRuleConfirm} onOpenChange={() => actions.cancelDeleteRule()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3 text-red-600">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-red-100 dark:bg-red-900/30"><Trash2 size={20} className="text-red-600" /></div>
              Supprimer cette regle ?
            </DialogTitle>
            <DialogDescription>La regle sera definitivement supprimee.</DialogDescription>
          </DialogHeader>
          <div className="flex gap-3 pt-4">
            <button onClick={actions.deleteAlertRule} className="flex-1 px-4 py-2.5 rounded-lg text-sm text-white bg-red-600 hover:bg-red-700 transition-colors">Supprimer</button>
            <button onClick={actions.cancelDeleteRule} className={COMPONENTS.buttonSecondary}>Annuler</button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ============ TEST SMS MODAL ============ */}
      <Dialog open={page.showTestSmsModal} onOpenChange={page.setShowTestSmsModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg flex items-center justify-center bg-blue-100 dark:bg-blue-900/30"><Send size={20} className="text-blue-600" /></div>
              Envoyer un SMS de test
            </DialogTitle>
            <DialogDescription>Verifier la connectivite Infobip avec un SMS reel</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <InputField label="Numero de telephone *" value={page.testSmsPhone} onChange={v => page.setTestSmsPhone(v)} placeholder="+226 70 00 00 00" />
            <p className="text-xs text-gray-500 dark:text-gray-400">Format: +226 XX XX XX XX (Burkina Faso)</p>
            <div className="flex gap-3 pt-2">
              <button onClick={actions.sendTestSms} disabled={!page.testSmsPhone || page.serviceLoading.testSms} className={COMPONENTS.buttonPrimary + ' flex-1 justify-center disabled:opacity-50'} style={{ background: GRADIENTS.burkinabe }}>
                <Send size={16} /> {page.serviceLoading.testSms ? 'Envoi...' : 'Envoyer'}
              </button>
              <button onClick={() => page.setShowTestSmsModal(false)} className={COMPONENTS.buttonSecondary}>Annuler</button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================================
// ALERTS TAB
// ============================================================================

function AlertsTab({ rules, alerts, integrations, onToggleRule, onDeleteRule, onAddRule, onAcknowledge, onRefresh }: {
  rules: IntegrationAlertRule[]; alerts: IntegrationAlert[]; integrations: Integration[];
  onToggleRule: (id: string) => void; onDeleteRule: (id: string) => void;
  onAddRule: () => void; onAcknowledge: (id: string) => void; onRefresh: () => void;
}) {
  const activeAlerts = alerts.filter(a => !a.acknowledged);
  const acknowledgedAlerts = alerts.filter(a => a.acknowledged);

  const getSeverityBadge = (severity: string) => {
    const map: Record<string, string> = {
      critical: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 border-red-200 dark:border-red-800',
      warning: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300 border-yellow-200 dark:border-yellow-800',
      info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 border-blue-200 dark:border-blue-800',
    };
    return map[severity] || map.info;
  };

  const getTypelabel = (type: string) => {
    const map: Record<string, string> = {
      quota_exceeded: 'Quota', high_latency: 'Latence', downtime: 'Downtime',
      error_rate: 'Erreurs', cost_spike: 'Cout', storage_full: 'Stockage',
      cpu_high: 'CPU', memory_high: 'Memoire',
    };
    return map[type] || type;
  };

  return (
    <div className="space-y-6">
      {/* Active alerts */}
      {activeAlerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-red-200 dark:border-red-800 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10 flex items-center justify-between">
            <h3 className="text-sm text-red-700 dark:text-red-300 flex items-center gap-2">
              <AlertTriangle size={16} /> Alertes actives ({activeAlerts.length})
            </h3>
            <button onClick={onRefresh} className="text-xs text-red-600 hover:text-red-700 flex items-center gap-1"><RefreshCw size={12} /> Rafraichir</button>
          </div>
          <div className="divide-y divide-red-100 dark:divide-red-900/20">
            {activeAlerts.map(alert => (
              <div key={alert.id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <span className={`px-2 py-0.5 rounded text-xs border ${getSeverityBadge(alert.severity)}`}>
                    {alert.severity === 'critical' ? 'CRITIQUE' : alert.severity === 'warning' ? 'WARNING' : 'INFO'}
                  </span>
                  <div className="min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">{alert.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{alert.integrationName} · {new Date(alert.triggeredAt).toLocaleString('fr-BF')}</p>
                  </div>
                </div>
                <button onClick={() => onAcknowledge(alert.id)} className="px-3 py-1.5 rounded-lg text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 transition-colors shrink-0">
                  <CheckCircle2 size={12} className="inline mr-1" /> Acquitter
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Rules */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <Settings size={16} className="text-gray-500" /> Regles de surveillance ({rules.length})
          </h3>
          <button onClick={onAddRule} className={COMPONENTS.buttonPrimary + ' text-xs !px-3 !py-1.5'} style={{ background: GRADIENTS.burkinabe }}>
            <Plus size={14} /> Nouvelle regle
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {['Regle', 'Service', 'Type', 'Seuil', 'Valeur actuelle', 'Severite', 'Notifications', 'Actions'].map((h, i) => (
                  <th key={h} className={`px-5 py-3 text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider ${i === 7 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {rules.map(rule => {
                const integ = integrations.find(i => i.id === rule.integrationId);
                const isTriggered = rule.currentValue >= rule.threshold;
                return (
                  <tr key={rule.id} className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors ${!rule.enabled ? 'opacity-50' : ''}`}>
                    <td className="px-5 py-3 text-sm text-gray-900 dark:text-white">{rule.label}</td>
                    <td className="px-5 py-3 text-xs text-gray-600 dark:text-gray-400">{integ?.name || '—'}</td>
                    <td className="px-5 py-3"><span className="px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">{getTypelabel(rule.type)}</span></td>
                    <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{rule.threshold} {rule.unit}</td>
                    <td className="px-5 py-3">
                      <span className={`text-sm ${isTriggered ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'}`}>
                        {rule.currentValue} {rule.unit}
                      </span>
                    </td>
                    <td className="px-5 py-3"><span className={`px-2 py-0.5 rounded text-xs border ${getSeverityBadge(rule.severity)}`}>{rule.severity}</span></td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-2 text-xs text-gray-500">
                        {rule.notifyEmail && <span className="px-1.5 py-0.5 rounded bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400">Email</span>}
                        {rule.notifySms && <span className="px-1.5 py-0.5 rounded bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400">SMS</span>}
                        {!rule.notifyEmail && !rule.notifySms && <span className="text-gray-400">—</span>}
                      </div>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onToggleRule(rule.id)} className={`p-1.5 rounded-lg transition-colors ${rule.enabled ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                          {rule.enabled ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                        </button>
                        <button onClick={() => onDeleteRule(rule.id)} className="p-1.5 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors">
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* History */}
      {acknowledgedAlerts.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
            <h3 className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
              <Clock size={16} className="text-gray-500" /> Historique ({acknowledgedAlerts.length})
            </h3>
          </div>
          <div className="divide-y divide-gray-200 dark:divide-gray-700">
            {acknowledgedAlerts.map(alert => (
              <div key={alert.id} className="px-6 py-3 flex items-center gap-3">
                <span className={`px-2 py-0.5 rounded text-xs border ${getSeverityBadge(alert.severity)}`}>{alert.severity}</span>
                <p className="text-xs text-gray-600 dark:text-gray-400 flex-1 truncate">{alert.message}</p>
                <p className="text-xs text-gray-400 shrink-0">{new Date(alert.triggeredAt).toLocaleDateString('fr-BF')}</p>
                <CheckCircle2 size={14} className="text-green-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ============================================================================
// BILLING CARD — Overview billing model per service
// ============================================================================

function BillingCard({ integration }: { integration: Integration }) {
  const billing = BILLING_COLORS[integration.billingType] || BILLING_COLORS.usage;
  const Icon = billing.icon;
  return (
    <div className={`p-3 rounded-lg border ${billing.bg} ${billing.border}`}>
      <div className="flex items-center gap-2 mb-1.5">
        <Icon size={14} className="text-gray-600 dark:text-gray-300" />
        <span className="text-xs text-gray-900 dark:text-white truncate">{integration.name}</span>
      </div>
      <p className="text-[11px] text-gray-700 dark:text-gray-300">
        {BILLING_LABELS[integration.billingType]}
      </p>
      {integration.billingType === 'subscription' && integration.monthlyCostFcfa && (
        <p className="text-xs text-gray-900 dark:text-white mt-1">{formatFCFA(integration.monthlyCostFcfa)}/mois</p>
      )}
      {integration.billingDetails && (
        <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 italic">{integration.billingDetails}</p>
      )}
    </div>
  );
}

// ============================================================================
// PAYDUNYA TAB — Dedicated aggregator dashboard
// ============================================================================

function PaydunyaTab({ paydunya, copy }: { paydunya: UsePaydunyaReturn; copy: (t: string) => void }) {
  const { dashboard, loading, actions } = paydunya;
  const [showCredentials, setShowCredentials] = useState(false);
  const [webhookFilter, setWebhookFilter] = useState<string>('all');

  if (!dashboard) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 p-12 text-center">
        <CreditCard className="mx-auto mb-4 text-gray-300 dark:text-gray-600" size={56} />
        <h3 className="text-lg text-gray-900 dark:text-white mb-2">Chargement de PaydunYa...</h3>
        <p className="text-sm text-gray-500">Connexion a l'agregateur de paiement</p>
      </div>
    );
  }

  const { integration, config, channels, channelStats, recentWebhooks, health, totals } = dashboard;

  const handleToggleChannel = async (key: PaydunyaChannelKey) => {
    const ok = await actions.toggleChannel(key);
    if (ok) toast.success('Canal mis a jour');
    else toast.error('Echec de la mise a jour');
  };

  const handleTest = async () => {
    const result = await actions.testConnection();
    if (result.success) {
      toast.success(`API PaydunYa OK — ${result.latencyMs}ms`);
    } else {
      toast.error('Echec du test de connexion');
    }
  };

  const handleSwitchMode = async () => {
    const newMode = config.mode === 'live' ? 'test' : 'live';
    const ok = await actions.switchMode(newMode);
    if (ok) toast.success(`Mode bascule en ${newMode === 'live' ? 'Production' : 'Sandbox'}`);
    else toast.error('Echec du changement de mode');
  };

  const filteredWebhooks = webhookFilter === 'all'
    ? recentWebhooks
    : recentWebhooks.filter(w => w.eventType === webhookFilter);

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="relative p-6 text-white overflow-hidden" style={{ background: 'linear-gradient(135deg, #f59e0b 0%, #d97706 50%, #b45309 100%)' }}>
          <div className="absolute top-0 right-0 w-40 h-40 bg-white/5 rounded-full -mr-20 -mt-20" />
          <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full -ml-12 -mb-12" />
          <div className="relative flex flex-col lg:flex-row lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-white/20 backdrop-blur-sm flex items-center justify-center border border-white/30">
                <CircleDollarSign size={28} />
              </div>
              <div>
                <h2 className="text-2xl mb-0.5">PaydunYa</h2>
                <p className="text-sm text-white/80">
                  Agregateur PSP — {totals.activeChannels}/{totals.totalChannels} canaux · {config.currency}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2 flex-wrap">
              <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs border border-white/20 ${health.apiReachable ? 'bg-green-500/20' : 'bg-red-500/20'}`}>
                <Heart size={12} className={health.apiReachable ? 'text-green-300' : 'text-red-300'} />
                {health.apiReachable ? `${health.latencyMs}ms` : 'Hors ligne'}
              </span>
              <button onClick={handleSwitchMode} disabled={loading.action}
                className={`px-3 py-1.5 rounded-lg text-xs border border-white/20 transition-all ${config.mode === 'live' ? 'bg-green-500/20' : 'bg-yellow-500/20'} hover:bg-white/20`}>
                <Radio size={12} className="inline mr-1" />
                {config.mode === 'live' ? 'Production' : 'Sandbox'}
              </button>
              <button onClick={handleTest} disabled={loading.action}
                className="px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 border border-white/20 transition-all">
                <TestTube size={12} className="inline mr-1" />
                {loading.action ? 'Test...' : 'Tester'}
              </button>
              <button onClick={() => actions.refresh()} disabled={loading.integration}
                className="px-3 py-1.5 rounded-lg text-xs bg-white/10 hover:bg-white/20 border border-white/20 transition-all">
                <RefreshCw size={12} className={`inline mr-1 ${loading.integration ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>
          </div>
        </div>

        {/* Credentials */}
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <button onClick={() => setShowCredentials(!showCredentials)}
            className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 transition-colors">
            <Shield size={14} />
            Identifiants API
            {showCredentials ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
          </button>
          {showCredentials && (
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
              <CredentialField label="Public Key" value={integration.apiKey || ''} onCopy={copy} />
              <CredentialField label="Secret Key" value={integration.apiSecret || ''} masked onCopy={copy} />
              <CredentialField label="Master Key" value={config.masterKey} masked onCopy={copy} />
              <CredentialField label="Webhook IPN" value={integration.webhookUrl || ''} onCopy={copy} />
              <CredentialField label="Callback URL" value={config.callbackUrl} onCopy={copy} />
              <CredentialField label="Return URL" value={config.returnUrl} onCopy={copy} />
            </div>
          )}
        </div>

        {/* Channels Grid */}
        <div className="p-6">
          <h3 className="text-sm text-gray-500 dark:text-gray-400 mb-4 uppercase tracking-wider">Methodes de paiement</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {channels.map(channel => {
              const stat = channelStats.find(s => s.channelKey === channel.key);
              const channelHealth = health.channelHealth[channel.key];
              const ChIcon = CHANNEL_ICONS[channel.key] || CreditCard;
              const color = CHANNEL_COLORS[channel.key] || '#6b7280';
              return (
                <div key={channel.key} className={`rounded-xl border-2 p-4 transition-all ${channel.enabled ? 'border-gray-200 dark:border-gray-600 bg-white dark:bg-gray-800' : 'border-dashed border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'}`}>
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: channel.enabled ? color : '#9ca3af' }}>
                        <ChIcon size={16} />
                      </div>
                      <div>
                        <p className="text-sm text-gray-900 dark:text-white">{channel.label}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">{channel.provider}</p>
                      </div>
                    </div>
                    <button onClick={() => handleToggleChannel(channel.key)}>
                      {channel.enabled ? <ToggleRight size={26} className="text-green-500" /> : <ToggleLeft size={26} className="text-gray-400" />}
                    </button>
                  </div>
                  {channel.enabled && stat && stat.transactionsCount > 0 && (
                    <div className="grid grid-cols-3 gap-2 mb-3">
                      <MiniStat label="Transactions" value={stat.transactionsCount.toLocaleString()} />
                      <MiniStat label="Succes" value={`${stat.successRate.toFixed(1)}%`} />
                      <MiniStat label="24h" value={stat.last24hCount.toString()} />
                    </div>
                  )}
                  <div className="flex items-center justify-between text-xs">
                    <span className="text-gray-500 dark:text-gray-400 flex items-center gap-1"><Percent size={10} /> {channel.fee}% (frais client)</span>
                    <span className="flex items-center gap-1">
                      {channelHealth?.operational
                        ? <><span className="w-1.5 h-1.5 rounded-full bg-green-500" /> <span className="text-green-600 dark:text-green-400">OK</span></>
                        : <><span className="w-1.5 h-1.5 rounded-full bg-gray-400" /> <span className="text-gray-400">Indispo.</span></>}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Channel Stats Table */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <BarChart3 size={16} className="text-yellow-500" /> Statistiques par canal
          </h3>
          <button onClick={() => actions.refreshStats()} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
            <RefreshCw size={12} className={loading.stats ? 'animate-spin' : ''} /> Actualiser
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {['Canal', 'Transactions', 'Volume (FCFA)', 'Taux succes', 'Moy. / txn', '24h (count)', '24h (volume)'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {channelStats.filter(s => s.transactionsCount > 0).map(stat => (
                <tr key={stat.channelKey} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <td className="px-5 py-3">
                    <div className="flex items-center gap-2">
                      <div className="w-7 h-7 rounded flex items-center justify-center text-white" style={{ backgroundColor: CHANNEL_COLORS[stat.channelKey] || '#6b7280' }}>
                        {(() => { const I = CHANNEL_ICONS[stat.channelKey] || CreditCard; return <I size={13} />; })()}
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">{stat.label}</span>
                    </div>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{stat.transactionsCount.toLocaleString()}</td>
                  <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{formatFCFA(stat.transactionsTotal)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-sm ${stat.successRate >= 95 ? 'text-green-600 dark:text-green-400' : stat.successRate >= 90 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'}`}>
                      {stat.successRate.toFixed(1)}%
                    </span>
                  </td>
                  <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{formatFCFA(stat.avgTransactionAmount)}</td>
                  <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{stat.last24hCount}</td>
                  <td className="px-5 py-3 text-sm text-gray-700 dark:text-gray-300">{formatFCFA(stat.last24hTotal)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Webhook Logs */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between flex-wrap gap-3">
          <h3 className="text-sm text-gray-900 dark:text-white flex items-center gap-2">
            <ExternalLink size={16} className="text-blue-500" /> Webhook IPN — Evenements recents
          </h3>
          <div className="flex items-center gap-3">
            <select value={webhookFilter} onChange={e => setWebhookFilter(e.target.value)}
              className="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 dark:text-white appearance-none">
              <option value="all">Tous</option>
              <option value="payment_success">Succes</option>
              <option value="payment_failed">Echec</option>
              <option value="refund">Remboursement</option>
            </select>
            <button onClick={() => actions.refreshWebhooks()} className="text-xs text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
              <RefreshCw size={12} className={loading.webhooks ? 'animate-spin' : ''} /> Actualiser
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                {['Evenement', 'Canal', 'Reference', 'Montant', 'HTTP', 'Latence', 'Date'].map(h => (
                  <th key={h} className="px-5 py-3 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredWebhooks.map(wh => (
                <tr key={wh.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <td className="px-5 py-3"><WebhookEventBadge type={wh.eventType} /></td>
                  <td className="px-5 py-3 text-xs text-gray-700 dark:text-gray-300">{channels.find(c => c.key === wh.channelKey)?.label || wh.channelKey}</td>
                  <td className="px-5 py-3"><code className="text-xs text-gray-600 dark:text-gray-400 font-mono">{wh.transactionRef}</code></td>
                  <td className="px-5 py-3 text-xs text-gray-700 dark:text-gray-300">{formatFCFA(wh.amount)}</td>
                  <td className="px-5 py-3">
                    <span className={`text-xs px-2 py-0.5 rounded font-mono ${wh.httpStatus === 200 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300'}`}>{wh.httpStatus}</span>
                  </td>
                  <td className="px-5 py-3 text-xs text-gray-500">{wh.responseTimeMs}ms</td>
                  <td className="px-5 py-3 text-xs text-gray-500">{new Date(wh.createdAt).toLocaleString('fr-BF', { hour: '2-digit', minute: '2-digit', day: '2-digit', month: '2-digit' })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Info banner */}
      <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <AlertTriangle className="text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" size={16} />
          <p className="text-xs text-amber-700 dark:text-amber-300">
            <strong>Architecture agregateur</strong> — Un seul jeu de cles API PaydunYa.
            Les canaux (Orange Money, Moov Money, Wave, Sank Money, Telecel Money, Carte Bancaire) sont activables independamment sans reconfiguration.
            En production, les endpoints <code className="bg-amber-100 dark:bg-amber-800 px-1 rounded">/admin/paydunya/*</code> remplaceront les donnees mock.
          </p>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// FEATURE FLAGS TAB
// ============================================================================

function FeatureFlagsTab({ flags, onToggle, onAdd, onDelete }: {
  flags: FeatureFlag[]; onToggle: (id: string) => void; onAdd: () => void; onDelete: (id: string) => void;
}) {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 flex-1 mr-4">
          {[
            { label: 'Total', value: flags.length, icon: Zap, color: 'text-yellow-500' },
            { label: 'Actives', value: flags.filter(f => f.enabled).length, icon: CheckCircle2, color: 'text-green-500' },
            { label: 'Desactives', value: flags.filter(f => !f.enabled).length, icon: XCircle, color: 'text-gray-400' },
          ].map(s => (
            <div key={s.label} className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-md">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-600 dark:text-gray-400">{s.label}</span>
                <s.icon size={18} className={s.color} />
              </div>
              <p className="text-2xl text-gray-900 dark:text-white">{s.value}</p>
            </div>
          ))}
        </div>
        <button onClick={onAdd} className={COMPONENTS.buttonPrimary + ' shrink-0 self-start'} style={{ background: GRADIENTS.burkinabe }}>
          <Plus size={16} /> Nouveau
        </button>
      </div>

      <div className={PAGE_CLASSES.tableContainer}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                {['Fonctionnalite', 'Cle', 'Deploiement', 'Statut', 'Actions'].map((h, i) => (
                  <th key={h} className={`px-6 py-4 text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider ${i === 4 ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {flags.map(flag => (
                <tr key={flag.id} className="hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors">
                  <td className="px-6 py-4">
                    <p className="text-sm text-gray-900 dark:text-white">{flag.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5 max-w-sm">{flag.description}</p>
                  </td>
                  <td className="px-6 py-4">
                    <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono text-gray-600 dark:text-gray-400">{flag.key}</code>
                  </td>
                  <td className="px-6 py-4">
                    {flag.rolloutPercentage !== undefined ? (
                      <div className="flex items-center gap-2">
                        <div className="w-20 h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                          <div className="h-full rounded-full" style={{
                            width: `${flag.rolloutPercentage}%`,
                            background: flag.rolloutPercentage === 100 ? '#16a34a' : flag.rolloutPercentage > 0 ? '#f59e0b' : '#6b7280',
                          }} />
                        </div>
                        <span className="text-xs text-gray-600 dark:text-gray-400">{flag.rolloutPercentage}%</span>
                      </div>
                    ) : <span className="text-xs text-gray-400">—</span>}
                  </td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs border ${
                      flag.enabled
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-800'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 border-gray-200 dark:border-gray-600'
                    }`}>
                      <span className={`w-1.5 h-1.5 rounded-full ${flag.enabled ? 'bg-green-500 animate-pulse' : 'bg-gray-400'}`} />
                      {flag.enabled ? 'Active' : 'Desactive'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => onToggle(flag.id)}
                        className={`p-2 rounded-lg transition-colors ${flag.enabled ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}>
                        {flag.enabled ? <ToggleRight size={24} /> : <ToggleLeft size={24} />}
                      </button>
                      <button onClick={() => onDelete(flag.id)}
                        className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// SERVICE ROW (non-payment integrations)
// ============================================================================

function ServiceRow({
  integration, TypeIcon, expanded, showSeparator, apiKeyVisible, testing,
  onToggleExpand, onToggleApiKey, onCopy, onConfigure, onToggleStatus, onTest, onDelete,
  pageActions, serviceLoading,
}: {
  integration: Integration; TypeIcon: any; expanded: boolean; showSeparator: boolean;
  apiKeyVisible: boolean; testing: boolean;
  onToggleExpand: () => void; onToggleApiKey: () => void;
  onCopy: (t: string) => void; onConfigure: () => void; onToggleStatus: () => void;
  onTest: () => void; onDelete: () => void;
  pageActions: any; serviceLoading: Record<string, boolean>;
}) {
  return (
    <>
      {showSeparator && (
        <tr><td colSpan={6} className="px-0 py-0"><div className="h-0.5" style={{ background: GRADIENTS.burkinabe }} /></td></tr>
      )}
      <tr className={`hover:bg-gray-50 dark:hover:bg-gray-750 transition-colors cursor-pointer ${integration.status === 'error' ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`} onClick={onToggleExpand}>
        <td className="px-6 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0" style={{ backgroundColor: TYPE_COLORS[integration.type] || '#6b7280' }}>
              <TypeIcon size={18} />
            </div>
            <div className="min-w-0">
              <p className="text-sm text-gray-900 dark:text-white truncate">{integration.name}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{integration.provider}</p>
            </div>
          </div>
        </td>
        <td className="px-6 py-4">
          <span className="px-2.5 py-1 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
            {TYPE_LABELS[integration.type] || integration.type}
          </span>
        </td>
        <td className="px-6 py-4">
          {getStatusBadge(integration.status)}
          {integration.status === 'error' && integration.errorMessage && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1 truncate max-w-[200px]">{integration.errorMessage}</p>
          )}
        </td>
        <td className="px-6 py-4" onClick={e => e.stopPropagation()}>
          {integration.apiKey ? (
            <div className="flex items-center gap-2">
              <code className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded font-mono text-gray-600 dark:text-gray-400">
                {apiKeyVisible ? integration.apiKey : maskKey(integration.apiKey)}
              </code>
              <button onClick={onToggleApiKey} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                {apiKeyVisible ? <EyeOff size={14} /> : <Eye size={14} />}
              </button>
              <button onClick={() => onCopy(integration.apiKey!)} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                <Copy size={14} />
              </button>
            </div>
          ) : <span className="text-xs text-gray-400 italic">—</span>}
        </td>
        <td className="px-6 py-4">
          {integration.lastSyncAt ? (
            <div className="text-xs text-gray-600 dark:text-gray-400">
              {new Date(integration.lastSyncAt).toLocaleDateString('fr-BF')}
              <div className="text-gray-400">{new Date(integration.lastSyncAt).toLocaleTimeString('fr-BF', { hour: '2-digit', minute: '2-digit' })}</div>
            </div>
          ) : <span className="text-xs text-gray-400 italic">Jamais</span>}
        </td>
        <td className="px-6 py-4 text-right" onClick={e => e.stopPropagation()}>
          <div className="flex items-center justify-end gap-1">
            <button onClick={onTest} disabled={testing} className={`p-2 rounded-lg transition-colors ${testing ? 'text-yellow-500 animate-pulse' : 'text-gray-500 hover:bg-blue-50 hover:text-blue-600 dark:hover:bg-blue-900/20'}`} title="Tester la connexion">
              <TestTube size={16} />
            </button>
            <button onClick={onConfigure} className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 hover:text-gray-700 dark:hover:bg-gray-700 transition-colors" title="Configurer">
              <Settings size={16} />
            </button>
            <button onClick={onToggleStatus}
              className={`p-2 rounded-lg transition-colors ${integration.status === 'active' ? 'text-green-600 hover:bg-green-50 dark:hover:bg-green-900/20' : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'}`}
              title={integration.status === 'active' ? 'Desactiver' : 'Activer'}>
              {integration.status === 'active' ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
            </button>
            <button onClick={onDelete} className="p-2 rounded-lg text-gray-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 transition-colors" title="Supprimer">
              <Trash2 size={16} />
            </button>
            <button onClick={onToggleExpand} className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
            </button>
          </div>
        </td>
      </tr>
      {expanded && (
        <tr className="bg-gray-50/50 dark:bg-gray-800/50">
          <td colSpan={6} className="px-6 py-5">
            <IntegrationDetailPanel integration={integration} onCopy={onCopy} onTest={onTest} pageActions={pageActions} serviceLoading={serviceLoading} />
          </td>
        </tr>
      )}
    </>
  );
}

// ============================================================================
// INTEGRATION DETAIL PANEL — API-specific management panels
// ============================================================================

function IntegrationDetailPanel({ integration, onCopy, onTest, pageActions, serviceLoading }: {
  integration: Integration; onCopy: (t: string) => void; onTest: () => void;
  pageActions: any; serviceLoading: Record<string, boolean>;
}) {
  const usage = integration.usageStats;
  const config = integration.config || {};
  const extras = usage?.extras || {};

  return (
    <div className="space-y-4">
      {/* Row 1: Health + API Usage + Quick Links + Cost */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
        {usage && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1"><Gauge size={12} /> Sante</p>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">Uptime</span>
                <span className={`text-xs ${usage.uptimePercent >= 99.5 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600'}`}>{usage.uptimePercent}%</span>
              </div>
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                <div className="h-full rounded-full bg-green-500" style={{ width: `${Math.min(usage.uptimePercent, 100)}%` }} />
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Latence moy.</span>
                <span className="text-gray-700 dark:text-gray-300">{usage.avgLatencyMs}ms</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Taux succes</span>
                <span className={`${usage.successRate >= 98 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600'}`}>{usage.successRate}%</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-500">Dernier check</span>
                <span className="text-gray-700 dark:text-gray-300">{new Date(usage.lastHealthCheck).toLocaleTimeString('fr-BF', { hour: '2-digit', minute: '2-digit' })}</span>
              </div>
            </div>
          </div>
        )}
        {usage && (
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1"><Activity size={12} /> Utilisation API</p>
            <p className="text-2xl text-gray-900 dark:text-white mb-1">{usage.apiCallsThisMonth.toLocaleString('fr-BF')}</p>
            <p className="text-xs text-gray-500">appels ce mois</p>
            {usage.apiCallsLimit > 0 && (
              <div className="mt-2">
                <div className="flex justify-between text-xs mb-1">
                  <span className="text-gray-500">Quota</span>
                  <span className="text-gray-700 dark:text-gray-300">{((usage.apiCallsThisMonth / usage.apiCallsLimit) * 100).toFixed(1)}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{
                    width: `${Math.min((usage.apiCallsThisMonth / usage.apiCallsLimit) * 100, 100)}%`,
                    backgroundColor: (usage.apiCallsThisMonth / usage.apiCallsLimit) > 0.8 ? '#ef4444' : (usage.apiCallsThisMonth / usage.apiCallsLimit) > 0.5 ? '#f59e0b' : '#22c55e',
                  }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">Limite: {usage.apiCallsLimit.toLocaleString('fr-BF')}/jour</p>
              </div>
            )}
            {usage.apiCallsLimit === 0 && <p className="text-xs text-gray-400 mt-1">Illimite</p>}
          </div>
        )}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1"><ExternalLink size={12} /> Acces rapides</p>
          <div className="space-y-2">
            {integration.dashboardUrl && (
              <a href={integration.dashboardUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                <ArrowUpRight size={12} /> Dashboard {integration.provider}
              </a>
            )}
            {integration.docsUrl && (
              <a href={integration.docsUrl} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 hover:underline">
                <FileText size={12} /> Documentation API
              </a>
            )}
            {integration.webhookUrl && (
              <div className="flex items-center gap-1">
                <span className="text-xs text-gray-500 truncate flex-1">{integration.webhookUrl}</span>
                <button onClick={() => onCopy(integration.webhookUrl!)} className="text-gray-400 hover:text-gray-600 shrink-0"><Copy size={11} /></button>
              </div>
            )}
            <button onClick={onTest} className="w-full mt-1 flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
              <TestTube size={12} /> Tester la connexion
            </button>
            {/* Infobip-specific actions */}
            {integration.type === 'sms' && (
              <>
                <button onClick={() => pageActions.infobipHealthCheck()} disabled={serviceLoading.infobipHealth}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 transition-colors">
                  <Gauge size={12} /> {serviceLoading.infobipHealth ? 'Verification...' : 'Health check Infobip'}
                </button>
                <button onClick={() => pageActions.openTestSmsModal()}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 border border-purple-200 dark:border-purple-800 hover:bg-purple-100 transition-colors">
                  <Send size={12} /> Envoyer SMS test
                </button>
              </>
            )}
            {/* AWS-specific actions */}
            {integration.type === 'storage' && (
              <>
                <button onClick={() => pageActions.loadAwsHealth()} disabled={serviceLoading.aws}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-green-50 dark:bg-green-900/20 text-green-600 dark:text-green-400 border border-green-200 dark:border-green-800 hover:bg-green-100 transition-colors">
                  <Gauge size={12} /> {serviceLoading.aws ? 'Chargement...' : 'Health check AWS'}
                </button>
                <button onClick={() => pageActions.purgeCdnCache()} disabled={serviceLoading.cdnPurge}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-orange-50 dark:bg-orange-900/20 text-orange-600 dark:text-orange-400 border border-orange-200 dark:border-orange-800 hover:bg-orange-100 transition-colors">
                  <RefreshCw size={12} /> {serviceLoading.cdnPurge ? 'Purge...' : 'Purger cache CDN'}
                </button>
                <button onClick={() => pageActions.restartLightsail()} disabled={serviceLoading.lightsailRestart}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-800 hover:bg-red-100 transition-colors">
                  <Server size={12} /> {serviceLoading.lightsailRestart ? 'Redemarrage...' : 'Redemarrer Lightsail'}
                </button>
              </>
            )}
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-2 flex items-center gap-1"><DollarSign size={12} /> Facturation & Infos</p>
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Modele</span>
              <span className="text-gray-900 dark:text-white">
                {BILLING_LABELS[integration.billingType] || integration.billingType}
              </span>
            </div>
            {integration.billingType === 'subscription' && integration.monthlyCostFcfa && (
              <div className="flex justify-between text-xs">
                <span className="text-gray-500">Abonnement</span>
                <span className="text-gray-900 dark:text-white">{formatFCFA(integration.monthlyCostFcfa)}/mois</span>
              </div>
            )}
            {integration.billingDetails && (
              <p className="text-[10px] text-gray-400 dark:text-gray-500 italic">{integration.billingDetails}</p>
            )}
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Cree le</span>
              <span className="text-gray-700 dark:text-gray-300">{new Date(integration.createdAt).toLocaleDateString('fr-BF')}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">Modifie le</span>
              <span className="text-gray-700 dark:text-gray-300">{new Date(integration.updatedAt).toLocaleDateString('fr-BF')}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-gray-500">ID</span>
              <span className="text-gray-700 dark:text-gray-300 font-mono text-[10px]">{integration.id}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: API-Specific Panel */}
      {integration.type === 'sms' && <InfobipPanel config={config} extras={extras} />}
      {integration.type === 'analytics' && <AnalyticsPanel config={config} extras={extras} />}
      {integration.type === 'mapping' && <MapsPanel config={config} extras={extras} />}
      {integration.type === 'storage' && <AwsPanel config={config} extras={extras} />}
    </div>
  );
}

// ── INFOBIP ──
function InfobipPanel({ config, extras }: { config: Record<string, any>; extras: Record<string, any> }) {
  const useCases = config.useCases || {};
  const total = extras.smsSentThisMonth || 1;
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1"><Send size={12} /> Repartition SMS ce mois</p>
        <div className="space-y-2.5">
          {[
            { label: 'OTP (verification)', value: extras.otpSent || 0, color: '#3b82f6', icon: Shield },
            { label: 'Billets envoyes', value: extras.ticketSmsSent || 0, color: '#22c55e', icon: FileText },
            { label: 'Rappels trajet', value: extras.reminderSmsSent || 0, color: '#f59e0b', icon: Clock },
          ].map(item => {
            const pct = ((item.value / total) * 100).toFixed(1);
            return (
              <div key={item.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-600 dark:text-gray-400 flex items-center gap-1"><item.icon size={11} /> {item.label}</span>
                  <span className="text-gray-900 dark:text-white">{item.value.toLocaleString()} <span className="text-gray-400">({pct}%)</span></span>
                </div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden">
                  <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: item.color }} />
                </div>
              </div>
            );
          })}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700 flex justify-between text-xs">
            <span className="text-gray-500">Total SMS</span>
            <span className="text-gray-900 dark:text-white">{total.toLocaleString()}</span>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1"><Settings size={12} /> Templates</p>
        <div className="space-y-2.5">
          {Object.entries(useCases).map(([key, val]: [string, any]) => (
            <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
              <div><p className="text-xs text-gray-900 dark:text-white">{key === 'otp' ? 'OTP' : key === 'ticketSms' ? 'Billet SMS' : 'Rappel'}</p><p className="text-[10px] text-gray-400 font-mono">{val.templateId}</p></div>
              <span className={`w-2 h-2 rounded-full ${val.enabled ? 'bg-green-500' : 'bg-gray-400'}`} />
            </div>
          ))}
          <div className="flex justify-between text-xs pt-1"><span className="text-gray-500">Sender ID</span><code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-gray-700 dark:text-gray-300">{config.senderId}</code></div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1"><Smartphone size={12} /> Reseaux & Livraison</p>
        <div className="space-y-3">
          {(config.supportedNetworks || []).map((net: string) => (
            <div key={net} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
              <CheckCircle2 size={14} className="text-green-500 shrink-0" /><span className="text-xs text-gray-700 dark:text-gray-300">{net}</span>
            </div>
          ))}
          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800"><p className="text-xs text-blue-600 dark:text-blue-400">Livraison</p><p className="text-sm text-blue-700 dark:text-blue-300">{extras.deliveryRate || 0}%</p></div>
            <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800"><p className="text-xs text-green-600 dark:text-green-400">Delai moy.</p><p className="text-sm text-green-700 dark:text-green-300">{extras.avgDeliveryTimeSec || 0}s</p></div>
          </div>
          <div className="flex justify-between text-xs pt-1"><span className="text-gray-500">Cout / SMS</span><span className="text-gray-900 dark:text-white">{config.costPerSms || 0} FCFA</span></div>
        </div>
      </div>
    </div>
  );
}

// ── GOOGLE ANALYTICS ──
function AnalyticsPanel({ config, extras }: { config: Record<string, any>; extras: Record<string, any> }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1"><Users size={12} /> Audience</p>
        <div className="grid grid-cols-3 gap-2 mb-3">
          {[{ label: "Aujourd'hui", value: extras.activeUsersToday || 0 }, { label: '7 jours', value: extras.activeUsers7d || 0 }, { label: '30 jours', value: extras.activeUsers30d || 0 }].map(item => (
            <div key={item.label} className="text-center p-2 rounded-lg bg-purple-50 dark:bg-purple-900/20 border border-purple-100 dark:border-purple-800">
              <p className="text-lg text-purple-700 dark:text-purple-300">{item.value.toLocaleString('fr-BF')}</p>
              <p className="text-[10px] text-purple-500">{item.label}</p>
            </div>
          ))}
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs"><span className="text-gray-500">Sessions / mois</span><span className="text-gray-900 dark:text-white">{(extras.sessionsThisMonth || 0).toLocaleString('fr-BF')}</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Taux de rebond</span><span className={`${(extras.bounceRate || 0) > 50 ? 'text-red-600' : 'text-green-600 dark:text-green-400'}`}>{extras.bounceRate || 0}%</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Session moy.</span><span className="text-gray-900 dark:text-white">{extras.avgSessionDuration || '—'}</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Conversion</span><span className="text-green-600 dark:text-green-400">{extras.conversionRate || 0}%</span></div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1"><MousePointerClick size={12} /> Pages populaires</p>
        <div className="space-y-2">
          {(extras.topPages || []).map((pg: any, i: number) => {
            const maxV = (extras.topPages || [{ views: 1 }])[0].views;
            return (
              <div key={pg.page}>
                <div className="flex items-center justify-between text-xs mb-1"><span className="text-gray-700 dark:text-gray-300 font-mono">{pg.page}</span><span className="text-gray-500">{pg.views.toLocaleString('fr-BF')}</span></div>
                <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden"><div className="h-full rounded-full bg-purple-500" style={{ width: `${(pg.views / maxV) * 100}%`, opacity: 1 - i * 0.15 }} /></div>
              </div>
            );
          })}
        </div>
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700">
          <p className="text-xs text-gray-500 mb-2">Sources d'acquisition</p>
          {(extras.topAcquisition || []).map((src: any) => (
            <div key={src.source} className="flex items-center justify-between text-xs mb-1"><span className="text-gray-600 dark:text-gray-400">{src.source}</span><span className="text-gray-900 dark:text-white">{src.percent}%</span></div>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1"><Settings size={12} /> Configuration</p>
        <div className="space-y-2.5">
          <div className="flex justify-between text-xs"><span className="text-gray-500">Tracking ID</span><code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-[10px] text-gray-700 dark:text-gray-300">{config.trackingId}</code></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Property ID</span><code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-[10px] text-gray-700 dark:text-gray-300">{config.propertyId}</code></div>
          <p className="text-xs text-gray-500 pt-2">Data Streams</p>
          {(config.dataStreams || []).map((s: string) => (<div key={s} className="flex items-center gap-2 text-xs p-1.5 rounded bg-gray-50 dark:bg-gray-900/50"><CheckCircle2 size={12} className="text-green-500 shrink-0" /><span className="text-gray-700 dark:text-gray-300">{s}</span></div>))}
          <p className="text-xs text-gray-500 pt-2">Conversions</p>
          <div className="flex flex-wrap gap-1">{(config.conversionsConfigured || []).map((c: string) => (<span key={c} className="px-2 py-0.5 rounded text-[10px] bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-800">{c}</span>))}</div>
        </div>
      </div>
    </div>
  );
}

// ── GOOGLE MAPS ──
function MapsPanel({ config, extras }: { config: Record<string, any>; extras: Record<string, any> }) {
  const optimLabels: Record<string, string> = { routesCached: 'Routes en cache', garesInternalDb: 'Gares en DB interne', distanceCalcBackend: 'Calcul distance backend', liveTrackingSingleEmitter: 'Tracking single-emitter', rule5km: 'Regle 5km (proximite)' };
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1"><Map size={12} /> Utilisation par API</p>
        <div className="space-y-2.5">
          {[{ label: 'Maps Load', value: extras.mapsLoadThisMonth || 0, color: '#16a34a' }, { label: 'Directions', value: extras.directionsRequests || 0, color: '#3b82f6' }, { label: 'Geocoding', value: extras.geocodingRequests || 0, color: '#f59e0b' }, { label: 'Distance Matrix', value: extras.distanceMatrixRequests || 0, color: '#8b5cf6' }].map(item => (
            <div key={item.label} className="flex items-center justify-between text-xs"><span className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5"><span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />{item.label}</span><span className="text-gray-900 dark:text-white">{item.value.toLocaleString('fr-BF')}</span></div>
          ))}
          <div className="pt-2 border-t border-gray-100 dark:border-gray-700">
            <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Quota utilise</span><span className={`${(extras.quotaUsedPercent || 0) > 70 ? 'text-red-600' : 'text-green-600 dark:text-green-400'}`}>{extras.quotaUsedPercent || 0}%</span></div>
            <div className="w-full h-2 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${extras.quotaUsedPercent || 0}%`, backgroundColor: (extras.quotaUsedPercent || 0) > 70 ? '#ef4444' : '#22c55e' }} /></div>
            <p className="text-[10px] text-gray-400 mt-1">Limite: {(config.quotaLimitPerDay || 0).toLocaleString('fr-BF')} / jour</p>
          </div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1"><Zap size={12} /> Optimisations de couts</p>
        <div className="space-y-2">
          {Object.entries(config.optimizations || {}).map(([key, enabled]) => (
            <div key={key} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
              <span className="text-xs text-gray-700 dark:text-gray-300">{optimLabels[key] || key}</span>
              {enabled ? <CheckCircle2 size={14} className="text-green-500" /> : <XCircle size={14} className="text-gray-400" />}
            </div>
          ))}
        </div>
        <div className="mt-3 grid grid-cols-2 gap-2">
          <div className="text-center p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800"><p className="text-sm text-green-700 dark:text-green-300">{extras.cachedRoutesCount || 0}</p><p className="text-[10px] text-green-500">Routes cachees</p></div>
          <div className="text-center p-2 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800"><p className="text-sm text-blue-700 dark:text-blue-300">{extras.cachedStationsCount || 0}</p><p className="text-[10px] text-blue-500">Gares cachees</p></div>
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1"><Globe size={12} /> APIs activees</p>
        <div className="space-y-2">
          {(config.apis || []).map((api: string) => (<div key={api} className="flex items-center gap-2 p-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700"><CheckCircle2 size={14} className="text-green-500 shrink-0" /><span className="text-xs text-gray-700 dark:text-gray-300">{api}</span></div>))}
        </div>
        <div className="mt-3 space-y-1.5">
          <div className="flex justify-between text-xs"><span className="text-gray-500">Projet GCP</span><code className="bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded text-[10px] text-gray-700 dark:text-gray-300">{config.projectId}</code></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Region</span><span className="text-gray-700 dark:text-gray-300">{config.region}</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Cout estime</span><span className="text-gray-900 dark:text-white">~${extras.estimatedCostUsd || 0}/mois</span></div>
        </div>
      </div>
    </div>
  );
}

// ── AWS S3 + CLOUDFRONT + LIGHTSAIL ──
function AwsPanel({ config, extras }: { config: Record<string, any>; extras: Record<string, any> }) {
  const storageByType = extras.storageByType || {};
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1"><Database size={12} /> S3 Stockage</p>
        <div className="mb-3">
          <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Espace utilise</span><span className="text-gray-900 dark:text-white">{extras.storageUsedGb || 0} / {extras.storageLimitGb || 0} Go</span></div>
          <div className="w-full h-2.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden"><div className="h-full rounded-full bg-orange-500" style={{ width: `${((extras.storageUsedGb || 0) / (extras.storageLimitGb || 50)) * 100}%` }} /></div>
        </div>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs"><span className="text-gray-500">Objets</span><span className="text-gray-900 dark:text-white">{(extras.objectsCount || 0).toLocaleString('fr-BF')}</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Bande passante</span><span className="text-gray-900 dark:text-white">{extras.bandwidthUsedGb || 0} Go</span></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Bucket</span><code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[10px] text-gray-700 dark:text-gray-300">{config.bucketName}</code></div>
        </div>
        <div className="mt-3 pt-2 border-t border-gray-100 dark:border-gray-700 space-y-1.5">
          {Object.entries(storageByType).map(([type, data]: [string, any]) => (
            <div key={type} className="flex items-center justify-between text-xs"><span className="text-gray-500 capitalize flex items-center gap-1"><Image size={10} /> {type}</span><span className="text-gray-700 dark:text-gray-300">{data.count} fichiers · {data.sizeMb} Mo</span></div>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1"><Globe size={12} /> CloudFront CDN</p>
        <div className="space-y-2.5">
          <div className="flex justify-between text-xs"><span className="text-gray-500">Domaine</span><code className="bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-[10px] text-gray-700 dark:text-gray-300">{config.cdnDomain}</code></div>
          <div className="flex justify-between text-xs"><span className="text-gray-500">Requetes / mois</span><span className="text-gray-900 dark:text-white">{(extras.cdnRequestsThisMonth || 0).toLocaleString('fr-BF')}</span></div>
          <div>
            <div className="flex justify-between text-xs mb-1"><span className="text-gray-500">Cache Hit Rate</span><span className={`${(extras.cdnCacheHitRate || 0) >= 90 ? 'text-green-600 dark:text-green-400' : 'text-yellow-600'}`}>{extras.cdnCacheHitRate || 0}%</span></div>
            <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden"><div className="h-full rounded-full bg-green-500" style={{ width: `${extras.cdnCacheHitRate || 0}%` }} /></div>
          </div>
          <p className="text-xs text-gray-500 pt-2">Types de contenu</p>
          {Object.entries(config.contentTypes || {}).map(([type, cfg]: [string, any]) => (
            <div key={type} className="flex items-center justify-between text-xs p-1.5 rounded bg-gray-50 dark:bg-gray-900/50"><span className="text-gray-700 dark:text-gray-300 capitalize">{type}</span><span className="text-gray-400 text-[10px]">{cfg.formats?.join(', ')} · max {cfg.maxSizeMb}Mo</span></div>
          ))}
        </div>
      </div>
      <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
        <p className="text-xs text-gray-500 dark:text-gray-400 mb-3 flex items-center gap-1"><Server size={12} /> Lightsail (API Backend)</p>
        <div className="flex items-center gap-2 mb-3 p-2 rounded-lg bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
          <span className={`w-2.5 h-2.5 rounded-full ${extras.lightsailStatus === 'running' ? 'bg-green-500 animate-pulse' : 'bg-red-500'}`} />
          <span className="text-xs text-green-700 dark:text-green-300 capitalize">{extras.lightsailStatus || 'unknown'}</span>
          <span className="text-[10px] text-green-500 ml-auto">{config.lightsailInstance}</span>
        </div>
        <div className="space-y-3">
          {[{ label: 'CPU', value: extras.lightsailCpuAvg || 0, icon: Cpu, color: '#3b82f6' }, { label: 'Memoire', value: extras.lightsailMemoryAvg || 0, icon: Server, color: '#8b5cf6' }, { label: 'Disque', value: extras.lightsailDiskUsedPercent || 0, icon: Database, color: '#f59e0b' }].map(item => (
            <div key={item.label}>
              <div className="flex items-center justify-between text-xs mb-1"><span className="text-gray-500 flex items-center gap-1"><item.icon size={11} /> {item.label}</span><span className={`${item.value > 80 ? 'text-red-600' : item.value > 60 ? 'text-yellow-600' : 'text-green-600 dark:text-green-400'}`}>{item.value}%</span></div>
              <div className="w-full h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full overflow-hidden"><div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.value > 80 ? '#ef4444' : item.value > 60 ? '#f59e0b' : item.color }} /></div>
            </div>
          ))}
          <div className="flex justify-between text-xs pt-2 border-t border-gray-100 dark:border-gray-700"><span className="text-gray-500">Services API</span><span className="text-gray-900 dark:text-white">{config.apiServicesCount || 0} endpoints</span></div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// REUSABLE SMALL COMPONENTS
// ============================================================================

function InputField({ label, value, onChange, placeholder, type = 'text', icon: Icon }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; icon?: any;
}) {
  return (
    <div>
      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-1.5">
        {Icon && <Icon size={14} className="inline mr-1" />}{label}
      </label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className={COMPONENTS.input} />
    </div>
  );
}

function CredentialField({ label, value, masked, onCopy }: { label: string; value: string; masked?: boolean; onCopy: (t: string) => void }) {
  const [visible, setVisible] = useState(false);
  return (
    <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
      <label className="text-xs text-gray-500 dark:text-gray-400 mb-1 block">{label}</label>
      <div className="flex items-center gap-2">
        <code className="flex-1 text-xs text-gray-800 dark:text-gray-200 font-mono truncate">
          {masked && !visible ? maskKey(value) : value || '—'}
        </code>
        {masked && (
          <button onClick={() => setVisible(!visible)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
            {visible ? <EyeOff size={12} /> : <Eye size={12} />}
          </button>
        )}
        <button onClick={() => onCopy(value)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
          <Copy size={12} />
        </button>
      </div>
    </div>
  );
}

function MiniStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-gray-500 dark:text-gray-400">{label}</p>
      <p className="text-sm text-gray-900 dark:text-white">{value}</p>
    </div>
  );
}

function WebhookEventBadge({ type }: { type: string }) {
  const map: Record<string, { bg: string; label: string }> = {
    payment_success: { bg: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300', label: 'Succes' },
    payment_failed: { bg: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', label: 'Echec' },
    refund: { bg: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-300', label: 'Remboursement' },
    chargeback: { bg: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300', label: 'Chargeback' },
    test: { bg: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', label: 'Test' },
  };
  const s = map[type] || { bg: 'bg-gray-100 text-gray-700', label: type };
  return <span className={`px-2 py-0.5 rounded text-xs ${s.bg}`}>{s.label}</span>;
}

export default Integrations;
