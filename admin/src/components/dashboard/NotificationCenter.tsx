/**
 * @file NotificationCenter.tsx
 * @description Centre de Notifications unifié - Inspiré du design Weyana Finance
 * Adapté au contexte FasoTravel (transport au Burkina Faso)
 * 
 * ARCHITECTURE NOTIFICATIONS:
 * ┌──────────────────────────────────────────────────────────┐
 * │ AUTOMATIQUES (système)         │ MANUELLES (admin)       │
 * │ ─────────────────────────────  │ ───────────────────────  │
 * │ • Bienvenue inscription        │ • Campagnes marketing    │
 * │ • Confirmation réservation     │ • Annonces maintenance   │
 * │ • Billet émis (paiement OK)    │ • Promotions ponctuelles │
 * │ • Rappel J-1 / H-2            │ • Alertes de sécurité    │
 * │ • Remboursement traité         │ • Communications         │
 * │ • Retard / Annulation trajet   │                          │
 * │ • Demande d'avis post-voyage   │                          │
 * │ → Gérées par des RÈGLES        │ → Gérées via COMPOSITEUR │
 * │   avec triggers automatiques   │   envoi immédiat/programmé│
 * └──────────────────────────────────────────────────────────┘
 *
 * BACKEND-READY:
 * - Toutes les données passent par useNotificationsAdmin() → notificationsService
 * - Aucune donnée mock dans ce fichier
 * - Types centralisés dans /shared/types/standardized.ts
 */

import { useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router';
import {
  Send,
  Clock,
  Eye,
  CheckCheck,
  MousePointerClick,
  Calendar,
  FileText,
  BarChart3,
  Sparkles,
  Smartphone,
  Plus,
  RotateCcw,
  Search,
  Download,
  ChevronDown,
  Bell,
  Mail,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Zap,
  Power,
  Settings2,
  UserPlus,
  Ticket,
  AlertTriangle,
  XCircle,
  Star,
  Bot,
  Pencil,
  X,
  Trash2,
} from 'lucide-react';
import { useAdminApp } from '../../context/AdminAppContext';
import { useNotificationsAdmin } from '../../hooks/useNotificationsAdmin';
import { PAGE_CLASSES, COMPONENTS } from '../../lib/design-system';
import { exportToCSV } from '../../lib/utils';
import { toast } from 'sonner@2.0.3';
import { formatDistanceToNow } from 'date-fns';
import { fr } from 'date-fns/locale';
import type { Notification, AutomationRule, AutomationCategory, NotifTemplate } from '../../shared/types/standardized';

// ============================================================================
// TYPES & CONSTANTS
// ============================================================================

type TabId = 'inbox' | 'automatisations' | 'composer' | 'historique' | 'templates' | 'programmees' | 'statistiques';
type ChannelId = 'push' | 'email' | 'inApp' | 'whatsapp';

interface QuickTemplate {
  id: string;
  label: string;
  title: string;
  message: string;
  activeBg: string;
  activeBorder: string;
}

const TABS: { id: TabId; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: 'inbox', label: 'Boite de reception', icon: Bell, badge: 'ADMIN' },
  { id: 'automatisations', label: 'Automatisations', icon: Zap, badge: 'SYSTÈME' },
  { id: 'composer', label: 'Campagne manuelle', icon: Send },
  { id: 'historique', label: 'Historique', icon: Clock },
  { id: 'templates', label: 'Templates', icon: FileText },
  { id: 'programmees', label: 'Programmées', icon: Calendar },
  { id: 'statistiques', label: 'Statistiques', icon: BarChart3 },
];

const QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: 'promotion',
    label: 'Promotion',
    title: 'Offre spéciale FasoTravel !',
    message: 'Profitez de -20% sur tous les trajets {trajet} ce weekend ! Réservez maintenant avec le code FASO20.',
    activeBg: 'bg-green-600 dark:bg-green-500',
    activeBorder: 'border-green-600 dark:border-green-500',
  },
  {
    id: 'alerte_securite',
    label: 'Alerte sécurité',
    title: 'Information importante',
    message: 'Suite aux conditions météo, les trajets vers {destination} sont suspendus jusqu\'au {date}. Consultez vos réservations.',
    activeBg: 'bg-red-600 dark:bg-red-500',
    activeBorder: 'border-red-600 dark:border-red-500',
  },
  {
    id: 'maintenance',
    label: 'Maintenance',
    title: 'Maintenance programmée',
    message: 'L\'application FasoTravel sera en maintenance le {date} de 02h à 05h. Veuillez planifier vos réservations en conséquence.',
    activeBg: 'bg-amber-500 dark:bg-amber-500',
    activeBorder: 'border-amber-500 dark:border-amber-500',
  },
  {
    id: 'annonce',
    label: 'Annonce générale',
    title: 'Nouveauté FasoTravel',
    message: 'Découvrez les nouvelles lignes vers {destination} ! Réservez dès maintenant sur l\'app.',
    activeBg: 'bg-blue-600 dark:bg-blue-500',
    activeBorder: 'border-blue-600 dark:border-blue-500',
  },
];

const DYNAMIC_VARIABLES = [
  { token: '{prenom}', label: 'Prénom du passager' },
  { token: '{nom}', label: 'Nom du passager' },
  { token: '{trajet}', label: 'Trajet réservé' },
  { token: '{destination}', label: 'Ville de destination' },
  { token: '{date}', label: 'Date concernée' },
  { token: '{compagnie}', label: 'Société de transport' },
];

const NOTIFICATION_TYPES = [
  { value: 'info', label: 'Information' },
  { value: 'success', label: 'Confirmation' },
  { value: 'warning', label: 'Alerte' },
  { value: 'error', label: 'Urgence' },
];

const TRIGGER_OPTIONS: { event: string; label: string; category: AutomationCategory }[] = [
  { event: 'user.created', label: 'Inscription passager', category: 'onboarding' },
  { event: 'auth.signup_otp_requested', label: 'OTP inscription demandé', category: 'onboarding' },
  { event: 'auth.login_otp_requested', label: 'OTP connexion demandé', category: 'transactional' },
  { event: 'booking.confirmed', label: 'Réservation confirmée', category: 'transactional' },
  { event: 'ticket.issued', label: 'Billet émis', category: 'transactional' },
  { event: 'payment.success', label: 'Paiement réussi', category: 'transactional' },
  { event: 'booking.departure_minus_24h', label: '24h avant départ', category: 'reminder' },
  { event: 'booking.departure_minus_2h', label: '2h avant départ', category: 'reminder' },
  { event: 'refund.processed', label: 'Remboursement effectué', category: 'transactional' },
  { event: 'trip.delayed', label: 'Trajet en retard', category: 'alert' },
  { event: 'trip.cancelled', label: 'Trajet annulé', category: 'alert' },
  { event: 'trip.completed_plus_2h', label: '2h après arrivée', category: 'engagement' },
  { event: 'user.inactive_30d', label: '30 jours d\'inactivité', category: 'engagement' },
  { event: 'user.inactive_60d', label: '60 jours d\'inactivité', category: 'engagement' },
  { event: 'booking.cancelled_by_user', label: 'Annulation par le passager', category: 'transactional' },
  { event: 'review.submitted', label: 'Avis soumis', category: 'engagement' },
  { event: 'promotion.expiring_24h', label: 'Promo expire dans 24h', category: 'engagement' },
];

const ACTION_LINKS = [
  { value: '', label: 'Aucun lien' },
  { value: '/reservations', label: 'Page Réservations' },
  { value: '/promotions', label: 'Page Promotions' },
  { value: '/trajets', label: 'Recherche de trajets' },
  { value: '/support', label: 'Centre d\'aide' },
];

// Category config for automation rules
const CATEGORY_CONFIG: Record<AutomationCategory, { icon: React.ElementType; color: string; bg: string; label: string }> = {
  onboarding: { icon: UserPlus, color: 'text-blue-700 dark:text-blue-300', bg: 'bg-blue-100 dark:bg-blue-800/40', label: 'Onboarding' },
  transactional: { icon: Ticket, color: 'text-emerald-700 dark:text-emerald-300', bg: 'bg-emerald-100 dark:bg-emerald-800/40', label: 'Transactionnel' },
  reminder: { icon: Clock, color: 'text-violet-700 dark:text-violet-300', bg: 'bg-violet-100 dark:bg-violet-800/40', label: 'Rappel' },
  alert: { icon: AlertTriangle, color: 'text-red-700 dark:text-red-300', bg: 'bg-red-100 dark:bg-red-800/40', label: 'Alerte' },
  engagement: { icon: Star, color: 'text-amber-700 dark:text-amber-300', bg: 'bg-amber-100 dark:bg-amber-800/40', label: 'Engagement' },
};

const FALLBACK_TRENDS = {
  autoSentTrend: '0%',
  manualSentTrend: '0%',
  deliveryTrend: '0%',
  openRateTrend: '0%',
  clickRateTrend: '0%',
};

// ============================================================================
// STAT CARD
// ============================================================================

function NotifStatCard({ icon: Icon, value, label, sublabel, trend, trendValue, color }: {
  icon: React.ElementType;
  value: string;
  label: string;
  sublabel?: string;
  trend?: 'up' | 'down';
  trendValue?: string;
  color: string;
}) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 transition-all hover:shadow-lg">
      <div className="flex items-center justify-between mb-3">
        <div className="p-2.5 rounded-xl" style={{ backgroundColor: `${color}18` }}>
          <Icon className="h-5 w-5" style={{ color }} />
        </div>
        {trend && trendValue && (
          <span className={`inline-flex items-center gap-1 text-xs px-2.5 py-1 rounded-full ${
            trend === 'up'
              ? 'text-emerald-700 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/40'
              : 'text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900/40'
          }`}>
            {trend === 'up' ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {trendValue}
          </span>
        )}
      </div>
      <div className="text-2xl text-gray-900 dark:text-white">{value}</div>
      <div className="text-sm text-gray-600 dark:text-gray-300 mt-1">{label}</div>
      {sublabel && <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{sublabel}</div>}
    </div>
  );
}

// ============================================================================
// MOBILE PREVIEW
// ============================================================================

function MobilePreview({ title, message }: { title: string; message: string }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Smartphone className="h-4 w-4 text-gray-600 dark:text-gray-300" />
        <span className="text-sm text-gray-800 dark:text-gray-200">Aperçu mobile</span>
      </div>
      <div className="mx-auto w-[220px]">
        <div className="bg-gray-900 rounded-[24px] p-2 shadow-2xl">
          <div className="bg-gray-800 rounded-[18px] overflow-hidden">
            <div className="flex items-center justify-between px-4 py-1.5 text-[9px] text-white/70">
              <span>9:41</span>
              <span>•••</span>
            </div>
            <div className="px-3 pb-4 pt-2">
              <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 border border-white/10">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-5 h-5 rounded-md bg-gradient-to-br from-red-500 to-amber-500 flex items-center justify-center">
                    <span className="text-[7px] text-white">FT</span>
                  </div>
                  <span className="text-[9px] text-white/80 uppercase tracking-wider">FasoTravel</span>
                  <span className="text-[8px] text-white/40 ml-auto">maintenant</span>
                </div>
                <div className="text-[10px] text-white mb-1 line-clamp-1">
                  {title || 'Titre de la notification'}
                </div>
                <div className="text-[9px] text-white/60 line-clamp-3">
                  {message || 'Le contenu du message apparaîtra ici...'}
                </div>
              </div>
              <div className="mt-4 space-y-2">
                <div className="h-2.5 w-3/4 bg-white/5 rounded" />
                <div className="h-2.5 w-full bg-white/5 rounded" />
                <div className="h-2.5 w-2/3 bg-white/5 rounded" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// VARIABLES PANEL
// ============================================================================

function VariablesPanel({ onInsert }: { onInsert: (token: string) => void }) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="h-4 w-4 text-amber-500" />
        <span className="text-sm text-gray-800 dark:text-gray-200">Variables dynamiques</span>
      </div>
      <div className="space-y-0.5">
        {DYNAMIC_VARIABLES.map((v) => (
          <button
            key={v.token}
            onClick={() => onInsert(v.token)}
            className="w-full flex items-center justify-between p-2.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors group text-left"
          >
            <div>
              <span className="text-xs px-2 py-0.5 rounded bg-amber-100 dark:bg-amber-800/50 text-amber-800 dark:text-amber-200 font-mono">
                {v.token}
              </span>
              <div className="text-xs text-gray-600 dark:text-gray-300 mt-1">{v.label}</div>
            </div>
            <Plus className="h-3.5 w-3.5 text-gray-400 dark:text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300 transition-colors" />
          </button>
        ))}
      </div>
    </div>
  );
}

// ============================================================================
// CHANNEL TOGGLE
// ============================================================================

function ChannelToggle({ id, label, icon: Icon, active, onChange }: {
  id: ChannelId;
  label: string;
  icon: React.ElementType;
  active: boolean;
  onChange: (id: ChannelId) => void;
}) {
  return (
    <button
      onClick={() => onChange(id)}
      className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm transition-all border ${
        active
          ? 'bg-red-600 dark:bg-red-500 border-red-600 dark:border-red-500 text-white shadow-md shadow-red-500/20'
          : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-gray-400 dark:hover:border-gray-500'
      }`}
    >
      <Icon className="h-4 w-4" />
      {label}
      {active && <CheckCheck className="h-3.5 w-3.5" />}
    </button>
  );
}

// ============================================================================
// AUTOMATION RULE CARD
// ============================================================================

function AutomationRuleCard({ rule, onToggle, onEdit, onDelete }: {
  rule: AutomationRule;
  onToggle: (id: string, isActive: boolean) => void;
  onEdit: (rule: AutomationRule) => void;
  onDelete: (id: string) => void;
}) {
  const cat = CATEGORY_CONFIG[rule.category] ?? CATEGORY_CONFIG.transactional;
  const CatIcon = cat.icon;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl border transition-all hover:shadow-lg ${
      rule.isActive
        ? 'border-gray-200 dark:border-gray-700'
        : 'border-gray-200 dark:border-gray-700 opacity-70'
    }`}>
      <div className="p-5">
        {/* Header */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div className="flex items-center gap-3 min-w-0">
            <div className={`p-2 rounded-lg ${cat.bg} shrink-0`}>
              <CatIcon className={`h-4.5 w-4.5 ${cat.color}`} />
            </div>
            <div className="min-w-0">
              <h4 className="text-sm text-gray-900 dark:text-white truncate">{rule.name}</h4>
              <span className={`inline-flex items-center gap-1 text-xs mt-0.5 ${cat.color}`}>
                <Bot className="h-3 w-3" />
                {cat.label}
              </span>
            </div>
          </div>
          {/* Toggle */}
          <button
            onClick={() => onToggle(rule.id, !rule.isActive)}
            title={rule.isActive ? 'Désactiver la règle' : 'Activer la règle'}
            aria-label={rule.isActive ? 'Désactiver la règle' : 'Activer la règle'}
            className={`relative inline-flex h-6 w-11 items-center rounded-full shrink-0 transition-colors ${
              rule.isActive ? 'bg-emerald-500' : 'bg-gray-300 dark:bg-gray-600'
            }`}
          >
            <span className={`inline-block h-4 w-4 rounded-full bg-white shadow-sm transition-transform ${
              rule.isActive ? 'translate-x-6' : 'translate-x-1'
            }`} />
          </button>
        </div>

        {/* Description */}
        <p className="text-xs text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">{rule.description}</p>

        {/* Trigger */}
        <div className="flex items-center gap-2 mb-3 px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-900/50 border border-gray-100 dark:border-gray-700">
          <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
          <span className="text-xs text-gray-700 dark:text-gray-300">
            Déclencheur : <span className="text-gray-900 dark:text-white">{rule.triggerLabel}</span>
          </span>
        </div>

        {/* Channels */}
        <div className="flex items-center gap-1.5 mb-3">
          {rule.channels.map(ch => (
            <span key={ch} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
              {ch === 'push' && <Bell className="h-3 w-3" />}
              {ch === 'email' && <Mail className="h-3 w-3" />}
              {ch === 'inApp' && <MessageSquare className="h-3 w-3" />}
              {ch === 'whatsapp' && <Smartphone className="h-3 w-3" />}
              {ch === 'push' ? 'Push' : ch === 'email' ? 'Email' : ch === 'inApp' ? 'In-App' : 'WhatsApp'}
            </span>
          ))}
        </div>

        {/* Stats & actions */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100 dark:border-gray-700">
          <div className="flex items-center gap-4 text-xs">
            <span className="text-gray-600 dark:text-gray-400">
              <span className="text-gray-900 dark:text-white">{rule.sentCount.toLocaleString()}</span> envoyées
            </span>
            {rule.lastTriggered && (
              <span className="text-gray-500 dark:text-gray-400">
                Dernier : {formatDistanceToNow(new Date(rule.lastTriggered), { addSuffix: true, locale: fr })}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={() => onEdit(rule)}
              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Modifier le template"
            >
              <Pencil className="h-3.5 w-3.5" />
            </button>
            <button
              onClick={() => onDelete(rule.id)}
              className="p-1.5 text-gray-400 dark:text-gray-500 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Supprimer"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function NotificationCenter() {
  const location = useLocation();
  const {
    notifications,
    markNotificationAsRead,
    refreshNotifications,
  } = useAdminApp();
  const notifAdmin = useNotificationsAdmin();
  const [activeTab, setActiveTab] = useState<TabId>('automatisations');

  // Editing automation rule
  const [editingRule, setEditingRule] = useState<AutomationRule | null>(null);

  // Composer state
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [audience, setAudience] = useState('all');
  const [notifType, setNotifType] = useState<Notification['type']>('info');
  const [channels, setChannels] = useState<ChannelId[]>(['push', 'inApp', 'whatsapp']);
  const [title, setTitle] = useState('');
  const [message, setMessage] = useState('');
  const [actionLink, setActionLink] = useState('');
  const [scheduleMode, setScheduleMode] = useState<'immediate' | 'scheduled'>('immediate');
  const [scheduledDate, setScheduledDate] = useState('');

  // Template creation modal
  const [creatingTemplate, setCreatingTemplate] = useState(false);
  const [newTplName, setNewTplName] = useState('');
  const [newTplTitle, setNewTplTitle] = useState('');
  const [newTplMessage, setNewTplMessage] = useState('');
  const [newTplCategory, setNewTplCategory] = useState('Marketing');

  useEffect(() => {
    const tabParam = new URLSearchParams(location.search).get('tab');
    if (tabParam === 'inbox') {
      setActiveTab('inbox');
    }
  }, [location.search]);

  // Handlers
  const handleTemplateSelect = (tpl: QuickTemplate) => {
    setSelectedTemplate(tpl.id);
    setTitle(tpl.title);
    setMessage(tpl.message);
  };

  const handleChannelToggle = (id: ChannelId) => {
    setChannels(prev => prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]);
  };

  const handleInsertVariable = (token: string) => {
    setMessage(prev => prev + token);
  };

  const handleReset = () => {
    setSelectedTemplate(null);
    setTitle('');
    setMessage('');
    setAudience('all');
    setNotifType('info');
    setChannels(['push', 'inApp', 'whatsapp']);
    setActionLink('');
    setScheduleMode('immediate');
    setScheduledDate('');
  };

  const handleSaveRuleEdit = useCallback(async () => {
    if (!editingRule) return;
    const success = await notifAdmin.saveRule(editingRule);
    if (success) setEditingRule(null);
  }, [editingRule, notifAdmin]);

  const handleSend = async () => {
    if (scheduleMode === 'scheduled' && !scheduledDate) { toast.error('Choisissez une date'); return; }

    const result = await notifAdmin.sendCampaign({
      title: title.trim(),
      message: message.trim(),
      type: notifType,
      channels,
      audience,
      actionUrl: actionLink || undefined,
      scheduledAt: scheduleMode === 'scheduled' ? new Date(scheduledDate).toISOString() : undefined,
    });
    if (result.success) {
      await refreshNotifications();
      handleReset();
    }
  };

  const handleExport = () => {
    const exportData = notifAdmin.sentHistory.map(c => ({
      'ID': c.id,
      'Titre': c.title,
      'Message': c.message,
      'Source': c.source === 'auto' ? 'Automatique' : 'Manuelle',
      'Règle': c.sourceName,
      'Audience': c.audience,
      'Destinataires': c.audienceCount,
      'Délivrés': c.deliveredCount,
      'Ouverts': c.openedCount,
      'Cliqués': c.clickedCount,
      'Canaux': c.channels.join(', '),
      'Date': new Date(c.sentAt).toLocaleString('fr-FR'),
    }));
    exportToCSV(exportData, 'historique-notifications');
    toast.success('Export CSV terminé');
  };

  const handleCreateTemplate = async () => {
    const success = await notifAdmin.createTemplate({
      name: newTplName.trim(),
      title: newTplTitle.trim(),
      message: newTplMessage.trim(),
      category: newTplCategory,
    });
    if (success) {
      setCreatingTemplate(false);
      setNewTplName('');
      setNewTplTitle('');
      setNewTplMessage('');
      setNewTplCategory('Marketing');
    }
  };

  const handleUseTemplate = async (tpl: NotifTemplate) => {
    await notifAdmin.useTemplate(tpl.id);
    setTitle(tpl.title);
    setMessage(tpl.message);
    setActiveTab('composer');
    toast.success('Template chargé dans le compositeur');
  };

  const selectedAudience = notifAdmin.audienceSegments.find(a => a.value === audience);
  const { stats } = notifAdmin;
  const trends = stats?.trends ?? FALLBACK_TRENDS;
  const pendingScheduled = notifAdmin.scheduled.filter(s => s.status === 'pending');

  const getTrendDirection = (value?: string, downOnMinus = false): 'up' | 'down' => {
    if (!value) return 'up';
    if (downOnMinus) return value.startsWith('-') ? 'down' : 'up';
    return value.startsWith('+') ? 'up' : 'down';
  };

  const inboxItems = notifications
    .slice()
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const unreadInboxCount = inboxItems.filter(n => !n.read).length;

  const getInboxTypeBadge = (type: Notification['type']) => {
    if (type === 'error') return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
    if (type === 'warning') return 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300';
    if (type === 'success') return 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300';
    return 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300';
  };

  const handleMarkAllInboxRead = async () => {
    const unread = inboxItems.filter(n => !n.read);
    if (unread.length === 0) return;

    await Promise.allSettled(unread.map(n => markNotificationAsRead(n.id)));
    await refreshNotifications();
  };

  return (
    <div className={PAGE_CLASSES.container}>
      {/* Header */}
      <div className={PAGE_CLASSES.header}>
        <div className={PAGE_CLASSES.headerContent}>
          <div className={PAGE_CLASSES.headerTexts}>
            <h1 className="text-2xl text-gray-900 dark:text-white">Centre de Notifications</h1>
            <p className="text-gray-600 dark:text-gray-300 mt-1">
              Automatisations système & campagnes manuelles
            </p>
          </div>
          <div className={PAGE_CLASSES.headerActions}>
            <button onClick={handleExport} className={`${COMPONENTS.buttonSecondary} text-sm !px-4 !py-2.5`}>
              <Download className="h-4 w-4" />
              Export CSV
            </button>
            <button
              onClick={() => { setActiveTab('composer'); handleReset(); }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#dc2626] text-white rounded-lg hover:bg-[#b91c1c] transition-all text-sm shadow-lg shadow-red-500/25"
            >
              <Plus className="h-4 w-4" />
              Nouvelle campagne
            </button>
          </div>
        </div>
      </div>

      {/* Stat cards — trends from service */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <NotifStatCard
          icon={Bot}
          value={(stats?.autoSent ?? 0).toLocaleString()}
          label="Auto (système)"
          sublabel={`${notifAdmin.activeRulesCount} règles actives`}
          trend={getTrendDirection(trends.autoSentTrend)} trendValue={trends.autoSentTrend}
          color="#8b5cf6"
        />
        <NotifStatCard
          icon={Send}
          value={(stats?.manualSent ?? 0).toLocaleString()}
          label="Manuelles"
          sublabel="Campagnes admin"
          trend={getTrendDirection(trends.manualSentTrend)} trendValue={trends.manualSentTrend}
          color="#3b82f6"
        />
        <NotifStatCard
          icon={CheckCheck}
          value={`${stats?.deliveryRate ?? 0}%`}
          label="Délivrance"
          sublabel={`${Math.round((stats?.totalSent ?? 0) * (stats?.deliveryRate ?? 0) / 100).toLocaleString()} délivrées`}
          trend={getTrendDirection(trends.deliveryTrend)} trendValue={trends.deliveryTrend}
          color="#16a34a"
        />
        <NotifStatCard
          icon={Eye}
          value={`${stats?.openRate ?? 0}%`}
          label="Ouverture"
          sublabel={`${Math.round((stats?.totalSent ?? 0) * (stats?.openRate ?? 0) / 100).toLocaleString()} lues`}
          trend={getTrendDirection(trends.openRateTrend)} trendValue={trends.openRateTrend}
          color="#f59e0b"
        />
        <NotifStatCard
          icon={MousePointerClick}
          value={`${stats?.clickRate ?? 0}%`}
          label="Taux de clic"
          sublabel={`${Math.round((stats?.totalSent ?? 0) * (stats?.clickRate ?? 0) / 100).toLocaleString()} clics`}
          trend={getTrendDirection(trends.clickRateTrend, true)} trendValue={trends.clickRateTrend}
          color="#ef4444"
        />
        <NotifStatCard
          icon={Calendar}
          value={pendingScheduled.length.toString()}
          label="Programmées"
          sublabel="Campagnes en attente"
          color="#6366f1"
        />
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-1 mb-6 bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-1.5 overflow-x-auto">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm whitespace-nowrap transition-all ${
                isActive
                  ? 'bg-[#dc2626] text-white shadow-md shadow-red-500/20'
                  : 'text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
              {tab.badge && (
                <span className={`px-1.5 py-0.5 rounded text-[10px] uppercase tracking-wider ${
                  isActive
                    ? 'bg-white/25 text-white'
                    : 'bg-violet-100 dark:bg-violet-800/40 text-violet-700 dark:text-violet-300'
                }`}>
                  {tab.badge}
                </span>
              )}
            </button>
          );
        })}
      </div>

      {/* ============ TAB: AUTOMATISATIONS ============ */}
      {activeTab === 'inbox' && (
        <div className="space-y-5">
          <div className="flex items-center justify-between rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 px-4 py-3">
            <div>
              <h3 className="text-gray-900 dark:text-white">Boite de reception admin</h3>
              <p className="text-sm text-gray-600 dark:text-gray-300">
                {inboxItems.length} notification{inboxItems.length > 1 ? 's' : ''}, {unreadInboxCount} non lue{unreadInboxCount > 1 ? 's' : ''}
              </p>
            </div>
            <button
              onClick={() => void handleMarkAllInboxRead()}
              className={`${COMPONENTS.buttonSecondary} text-sm !px-4 !py-2.5`}
              disabled={unreadInboxCount === 0}
            >
              <CheckCheck className="h-4 w-4" />
              Tout marquer lu
            </button>
          </div>

          <div className="space-y-3">
            {inboxItems.length === 0 ? (
              <div className="rounded-xl border border-dashed border-gray-300 dark:border-gray-600 bg-gray-50 dark:bg-gray-800/60 p-8 text-center">
                <Bell className="mx-auto mb-3 text-gray-400 dark:text-gray-500" size={30} />
                <p className="text-sm text-gray-500 dark:text-gray-400">Aucune notification pour le moment</p>
              </div>
            ) : (
              inboxItems.map((item) => (
                <div
                  key={item.id}
                  className={`rounded-xl border p-4 transition-colors ${
                    item.read
                      ? 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700'
                      : 'bg-red-50/70 dark:bg-red-900/15 border-red-200 dark:border-red-800'
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="mt-0.5">
                      <Bell className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h4 className="text-sm font-semibold text-gray-900 dark:text-white">{item.title}</h4>
                        <span className={`text-[10px] px-2 py-0.5 rounded uppercase tracking-wide ${getInboxTypeBadge(item.type)}`}>
                          {item.type}
                        </span>
                        {!item.read && <span className="w-2 h-2 rounded-full bg-red-600" />}
                      </div>
                      <p className="text-sm text-gray-700 dark:text-gray-300 mt-1">{item.message}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        {formatDistanceToNow(new Date(item.createdAt), { addSuffix: true, locale: fr })}
                      </p>
                    </div>
                    {!item.read && (
                      <button
                        onClick={() => void markNotificationAsRead(item.id)}
                        className="text-xs text-red-600 dark:text-red-400 hover:underline whitespace-nowrap"
                      >
                        Marquer lu
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* ============ TAB: AUTOMATISATIONS ============ */}
      {activeTab === 'automatisations' && (
        <div className="space-y-6">
          {/* Explainer banner */}
          <div className="bg-gradient-to-r from-violet-50 to-blue-50 dark:from-violet-900/20 dark:to-blue-900/20 rounded-xl border border-violet-200 dark:border-violet-800 p-5">
            <div className="flex items-start gap-4">
              <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-800/40 shrink-0">
                <Bot className="h-6 w-6 text-violet-600 dark:text-violet-300" />
              </div>
              <div>
                <h3 className="text-gray-900 dark:text-white mb-1">Notifications automatiques</h3>
                <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                  Ces notifications sont envoyées <strong>automatiquement par le système</strong> en fonction des événements
                  (inscription, réservation, paiement, retard, remboursement...).
                  Vous ne pouvez pas les envoyer manuellement — elles se déclenchent toutes seules.
                  Vous pouvez les <strong>activer/désactiver</strong>, <strong>modifier le template</strong> ou <strong>supprimer</strong>.
                </p>
                <div className="flex items-center gap-6 mt-3 text-sm">
                  <span className="flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300">
                    <Power className="h-4 w-4" />
                    {notifAdmin.activeRulesCount}/{notifAdmin.automationRules.length} actives
                  </span>
                  <span className="flex items-center gap-1.5 text-violet-700 dark:text-violet-300">
                    <Send className="h-4 w-4" />
                    {notifAdmin.totalAutoSent.toLocaleString()} envoyées ce mois
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Category filter pills */}
          <div className="flex flex-wrap gap-2">
            {([
              { value: 'all' as const, label: 'Toutes' },
              { value: 'transactional' as const, label: 'Transactionnelles' },
              { value: 'reminder' as const, label: 'Rappels' },
              { value: 'alert' as const, label: 'Alertes' },
              { value: 'onboarding' as const, label: 'Onboarding' },
              { value: 'engagement' as const, label: 'Engagement' },
            ] as const).map(f => (
              <button
                key={f.value}
                onClick={() => notifAdmin.setAutomationFilter(f.value)}
                className={`px-4 py-2 rounded-lg text-sm transition-all border ${
                  notifAdmin.automationFilter === f.value
                    ? 'bg-violet-600 dark:bg-violet-500 border-violet-600 dark:border-violet-500 text-white shadow-md'
                    : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                }`}
              >
                {f.label}
                {f.value === 'all' && (
                  <span className="ml-1.5 text-xs opacity-75">({notifAdmin.automationRules.length})</span>
                )}
              </button>
            ))}
          </div>

          {/* Rules grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {/* Create new automation card */}
            <button
              onClick={() => {
                const newRule: AutomationRule = {
                  id: '',
                  name: '',
                  description: '',
                  triggerEvent: '',
                  triggerLabel: '',
                  template: { title: '', message: '' },
                  channels: ['push', 'inApp', 'whatsapp'],
                  isActive: false,
                  sentCount: 0,
                  category: 'transactional',
                };
                setEditingRule(newRule);
              }}
              className="flex flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 bg-white/50 dark:bg-gray-800/50 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-900/20 transition-all min-h-[220px] group"
            >
              <div className="p-3 rounded-xl bg-violet-100 dark:bg-violet-800/40 group-hover:bg-violet-200 dark:group-hover:bg-violet-700/50 transition-colors">
                <Plus className="h-6 w-6 text-violet-600 dark:text-violet-300" />
              </div>
              <div className="text-center">
                <span className="text-sm text-gray-700 dark:text-gray-300 group-hover:text-violet-700 dark:group-hover:text-violet-300 transition-colors">
                  Nouvelle automatisation
                </span>
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Créer une règle personnalisée
                </p>
              </div>
            </button>
            {notifAdmin.filteredRules.map(rule => (
              <AutomationRuleCard
                key={rule.id}
                rule={rule}
                onToggle={notifAdmin.toggleRule}
                onEdit={setEditingRule}
                onDelete={notifAdmin.deleteRule}
              />
            ))}
          </div>

          {/* Note */}
          <div className="text-center py-4">
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Pour les <strong>campagnes marketing</strong>, <strong>promotions</strong> ou <strong>annonces ponctuelles</strong>,
              utilisez l'onglet <button onClick={() => setActiveTab('composer')} className="text-red-600 dark:text-red-400 underline">Campagne manuelle</button>.
            </p>
          </div>

          {/* Edit/Create modal */}
          {editingRule && (() => {
            const isCreating = !editingRule.id;
            return (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-gray-900 dark:text-white flex items-center gap-2">
                      <Settings2 className="h-5 w-5 text-violet-500" />
                      {isCreating ? 'Nouvelle automatisation' : `Modifier : ${editingRule.name}`}
                    </h3>
                    <button onClick={() => setEditingRule(null)} title="Fermer" aria-label="Fermer" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                      <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>

                  {/* Name */}
                  <div className="mb-4">
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Nom de la règle</label>
                    <input
                      value={editingRule.name}
                      onChange={(e) => setEditingRule({ ...editingRule, name: e.target.value })}
                      placeholder="Ex: Rappel voyage J-1"
                      className={COMPONENTS.input}
                    />
                  </div>

                  {/* Description */}
                  <div className="mb-4">
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Description</label>
                    <input
                      value={editingRule.description}
                      onChange={(e) => setEditingRule({ ...editingRule, description: e.target.value })}
                      placeholder="Ex: Envoyée automatiquement 24h avant le départ"
                      className={COMPONENTS.input}
                    />
                  </div>

                  {/* Trigger */}
                  <div className="mb-4">
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">
                      <span className="flex items-center gap-1.5">
                        <Zap className="h-3.5 w-3.5 text-amber-500" />
                        Déclencheur
                      </span>
                    </label>
                    <div className="relative">
                      <select
                        value={editingRule.triggerEvent}
                        onChange={(e) => {
                          const selected = TRIGGER_OPTIONS.find(t => t.event === e.target.value);
                          if (selected) {
                            setEditingRule({
                              ...editingRule,
                              triggerEvent: selected.event,
                              triggerLabel: selected.label,
                              category: selected.category,
                            });
                          }
                        }}
                        className={`${COMPONENTS.input} appearance-none pr-10`}
                      >
                        <option value="">— Sélectionner un déclencheur —</option>
                        {TRIGGER_OPTIONS.map(t => (
                          <option key={t.event} value={t.event}>
                            {t.label} ({t.event})
                          </option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
                    </div>
                    {editingRule.triggerEvent && (
                      <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800">
                        <Zap className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                        <span className="text-xs text-amber-800 dark:text-amber-200">
                          Événement : <code className="bg-amber-100 dark:bg-amber-800/40 px-1.5 py-0.5 rounded">{editingRule.triggerEvent}</code>
                        </span>
                        <span className="text-xs text-amber-600 dark:text-amber-300 ml-auto">
                          Catégorie : {CATEGORY_CONFIG[editingRule.category]?.label}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Title */}
                  <div className="mb-4">
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Titre du template</label>
                    <input
                      value={editingRule.template.title}
                      onChange={(e) => setEditingRule({ ...editingRule, template: { ...editingRule.template, title: e.target.value } })}
                      placeholder="Ex: Votre voyage approche !"
                      className={COMPONENTS.input}
                    />
                  </div>

                  {/* Message */}
                  <div className="mb-4">
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Message</label>
                    <textarea
                      value={editingRule.template.message}
                      onChange={(e) => setEditingRule({ ...editingRule, template: { ...editingRule.template, message: e.target.value } })}
                      rows={4}
                      placeholder="Utilisez les variables dynamiques ci-dessous..."
                      className={`${COMPONENTS.input} resize-none`}
                    />
                    <div className="flex flex-wrap gap-1.5 mt-2">
                      {DYNAMIC_VARIABLES.map(v => (
                        <button
                          key={v.token}
                          onClick={() => setEditingRule({
                            ...editingRule,
                            template: { ...editingRule.template, message: editingRule.template.message + v.token }
                          })}
                          className="px-2.5 py-1 rounded-md text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-800/40 transition-colors font-mono"
                        >
                          {v.token}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Channels */}
                  <div className="mb-5">
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Canaux</label>
                    <div className="flex flex-wrap gap-2">
                      {(['push', 'email', 'inApp', 'whatsapp'] as const).map(ch => (
                        <button
                          key={ch}
                          onClick={() => {
                            const newChannels = editingRule.channels.includes(ch)
                              ? editingRule.channels.filter(c => c !== ch)
                              : [...editingRule.channels, ch];
                            setEditingRule({ ...editingRule, channels: newChannels });
                          }}
                          className={`inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm border transition-all ${
                            editingRule.channels.includes(ch)
                              ? 'bg-violet-600 dark:bg-violet-500 border-violet-600 text-white'
                              : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                          }`}
                        >
                          {ch === 'push' && <Bell className="h-3.5 w-3.5" />}
                          {ch === 'email' && <Mail className="h-3.5 w-3.5" />}
                          {ch === 'inApp' && <MessageSquare className="h-3.5 w-3.5" />}
                          {ch === 'whatsapp' && <Smartphone className="h-3.5 w-3.5" />}
                          {ch === 'push' ? 'Push' : ch === 'email' ? 'Email' : ch === 'inApp' ? 'In-App' : 'WhatsApp'}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <button
                      onClick={handleSaveRuleEdit}
                      className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-600 text-white rounded-lg hover:bg-violet-700 transition-all text-sm shadow-md"
                    >
                      {isCreating ? <Plus className="h-4 w-4" /> : <CheckCheck className="h-4 w-4" />}
                      {isCreating ? 'Créer la règle' : 'Enregistrer'}
                    </button>
                    <button
                      onClick={() => setEditingRule(null)}
                      className="px-4 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm border border-gray-200 dark:border-gray-600"
                    >
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>
            );
          })()}
        </div>
      )}

      {/* ============ TAB: COMPOSER (Campagnes manuelles) ============ */}
      {activeTab === 'composer' && (
        <div className="space-y-6">
          {/* Info banner */}
          <div className="flex items-center gap-3 px-4 py-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
            <Send className="h-4 w-4 text-blue-600 dark:text-blue-400 shrink-0" />
            <p className="text-sm text-blue-800 dark:text-blue-200">
              <strong>Campagne manuelle</strong> — Pour les promotions, annonces et communications ponctuelles.
              Les notifications transactionnelles (réservations, billets, rappels) sont gérées dans
              <button onClick={() => setActiveTab('automatisations')} className="underline ml-1">Automatisations</button>.
            </p>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left: Composer Form */}
            <div className="xl:col-span-2 space-y-6">
              <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
                <h3 className="text-gray-900 dark:text-white flex items-center gap-2 mb-5">
                  <Send className="h-5 w-5 text-red-500" />
                  Composer une campagne
                </h3>

                {/* Quick templates */}
                <div className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="h-4 w-4 text-amber-500" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">Template rapide</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_TEMPLATES.map((tpl) => (
                      <button
                        key={tpl.id}
                        onClick={() => handleTemplateSelect(tpl)}
                        className={`px-4 py-2 rounded-lg text-sm transition-all border ${
                          selectedTemplate === tpl.id
                            ? `${tpl.activeBg} ${tpl.activeBorder} text-white shadow-md`
                            : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                        }`}
                      >
                        {tpl.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Audience + Type */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-5">
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Audience cible</label>
                    <div className="relative">
                      <select value={audience} onChange={(e) => setAudience(e.target.value)} className={`${COMPONENTS.input} appearance-none pr-10`}>
                        {notifAdmin.audienceSegments.map(opt => (
                          <option key={opt.value} value={opt.value}>{opt.label} ({opt.count.toLocaleString()})</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
                    </div>
                    <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 inline-block">
                      {selectedAudience?.count.toLocaleString()} destinataire(s)
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Type de notification</label>
                    <div className="relative">
                      <select value={notifType} onChange={(e) => setNotifType(e.target.value as Notification['type'])} className={`${COMPONENTS.input} appearance-none pr-10`}>
                        {NOTIFICATION_TYPES.map(t => (
                          <option key={t.value} value={t.value}>{t.label}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
                    </div>
                  </div>
                </div>

                {/* Channels */}
                <div className="mb-5">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Canaux d'envoi</label>
                  <div className="flex flex-wrap gap-2">
                    <ChannelToggle id="push" label="Push" icon={Bell} active={channels.includes('push')} onChange={handleChannelToggle} />
                    <ChannelToggle id="email" label="Email" icon={Mail} active={channels.includes('email')} onChange={handleChannelToggle} />
                    <ChannelToggle id="inApp" label="In-App" icon={MessageSquare} active={channels.includes('inApp')} onChange={handleChannelToggle} />
                    <ChannelToggle id="whatsapp" label="WhatsApp" icon={Smartphone} active={channels.includes('whatsapp')} onChange={handleChannelToggle} />
                  </div>
                </div>

                {/* Title */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Titre</label>
                    <span className={`text-xs ${title.length > 50 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {title.length}/60
                    </span>
                  </div>
                  <input
                    value={title}
                    onChange={(e) => setTitle(e.target.value.slice(0, 60))}
                    placeholder="Ex: Nouvelle promotion disponible !"
                    className={COMPONENTS.input}
                  />
                </div>

                {/* Message */}
                <div className="mb-5">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm text-gray-700 dark:text-gray-300">Message</label>
                    <span className={`text-xs ${message.length > 250 ? 'text-amber-600 dark:text-amber-400' : 'text-gray-500 dark:text-gray-400'}`}>
                      {message.length}/300
                    </span>
                  </div>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value.slice(0, 300))}
                    placeholder="Écrivez votre message ici..."
                    rows={4}
                    className={`${COMPONENTS.input} resize-none`}
                  />
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {DYNAMIC_VARIABLES.map(v => (
                      <button
                        key={v.token}
                        onClick={() => handleInsertVariable(v.token)}
                        className="px-2.5 py-1 rounded-md text-xs bg-amber-50 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-700 hover:bg-amber-100 dark:hover:bg-amber-800/40 transition-colors font-mono"
                      >
                        {v.token}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Action link */}
                <div className="mb-5">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Lien d'action (optionnel)</label>
                  <div className="relative">
                    <select value={actionLink} onChange={(e) => setActionLink(e.target.value)} className={`${COMPONENTS.input} appearance-none pr-10`}>
                      {ACTION_LINKS.map(l => (
                        <option key={l.value} value={l.value}>{l.label}</option>
                      ))}
                    </select>
                    <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 dark:text-gray-400 pointer-events-none" />
                  </div>
                </div>

                {/* Schedule */}
                <div className="mb-6">
                  <label className="block text-sm text-gray-700 dark:text-gray-300 mb-3">Programmation</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setScheduleMode('immediate')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        scheduleMode === 'immediate'
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <Send className="h-5 w-5" />
                      <span className="text-sm">Immédiat</span>
                    </button>
                    <button
                      onClick={() => setScheduleMode('scheduled')}
                      className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                        scheduleMode === 'scheduled'
                          ? 'border-red-500 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
                          : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-gray-400 dark:hover:border-gray-500'
                      }`}
                    >
                      <Calendar className="h-5 w-5" />
                      <span className="text-sm">Programmer</span>
                    </button>
                  </div>
                  {scheduleMode === 'scheduled' && (
                    <input
                      type="datetime-local"
                      value={scheduledDate}
                      onChange={(e) => setScheduledDate(e.target.value)}
                      className={`${COMPONENTS.input} mt-3`}
                    />
                  )}
                </div>

                {/* Actions */}
                <div className="flex items-center gap-3 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button
                    onClick={handleSend}
                    disabled={notifAdmin.sending}
                    className="flex-1 inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#dc2626] text-white rounded-lg hover:bg-[#b91c1c] transition-all shadow-lg shadow-red-500/25 text-sm disabled:opacity-60 disabled:cursor-not-allowed"
                  >
                    <Send className={`h-4 w-4 ${notifAdmin.sending ? 'animate-pulse' : ''}`} />
                    {notifAdmin.sending ? 'Envoi en cours...' : 'Envoyer la campagne'}
                  </button>
                  <button
                    onClick={handleReset}
                    className="inline-flex items-center gap-2 px-4 py-3 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-sm border border-gray-200 dark:border-gray-600"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Réinitialiser
                  </button>
                </div>
              </div>
            </div>

            {/* Right: Preview + Variables */}
            <div className="space-y-6">
              <MobilePreview title={title} message={message} />
              <VariablesPanel onInsert={handleInsertVariable} />
            </div>
          </div>
        </div>
      )}

      {/* ============ TAB: HISTORIQUE (Campagnes envoyées — auto + manuelles) ============ */}
      {activeTab === 'historique' && (
        <div className="space-y-4">
          {/* Filters */}
          <div className={PAGE_CLASSES.searchSection}>
            <div className="flex flex-col md:flex-row gap-3">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <input
                  value={notifAdmin.historySearch}
                  onChange={(e) => notifAdmin.setHistorySearch(e.target.value)}
                  placeholder="Rechercher une campagne envoyée..."
                  className={`${COMPONENTS.input} !pl-10`}
                />
              </div>
              <div className="flex gap-2">
                {([
                  { value: 'all' as const, label: 'Toutes', count: notifAdmin.sentHistory.length },
                  { value: 'auto' as const, label: 'Automatiques', count: notifAdmin.sentHistory.filter(c => c.source === 'auto').length },
                  { value: 'manual' as const, label: 'Manuelles', count: notifAdmin.sentHistory.filter(c => c.source === 'manual').length },
                ]).map(f => (
                  <button
                    key={f.value}
                    onClick={() => notifAdmin.setHistorySourceFilter(f.value)}
                    className={`px-4 py-2.5 rounded-lg text-sm transition-all border whitespace-nowrap ${
                      notifAdmin.historySourceFilter === f.value
                        ? 'bg-[#dc2626] border-[#dc2626] text-white shadow-md shadow-red-500/20'
                        : 'bg-gray-50 dark:bg-gray-700 border-gray-200 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                    }`}
                  >
                    {f.value === 'auto' && <Bot className="h-3.5 w-3.5 inline mr-1.5" />}
                    {f.value === 'manual' && <Send className="h-3.5 w-3.5 inline mr-1.5" />}
                    {f.label}
                    <span className="ml-1.5 text-xs opacity-75">({f.count})</span>
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Summary strip */}
          <div className="flex items-center gap-6 px-4 py-3 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-sm">
            <span className="text-gray-600 dark:text-gray-300">
              <span className="text-gray-900 dark:text-white">{notifAdmin.filteredHistory.length}</span> campagnes
            </span>
            <span className="text-gray-600 dark:text-gray-300">
              <span className="text-gray-900 dark:text-white">{notifAdmin.filteredHistory.reduce((s, c) => s + c.audienceCount, 0).toLocaleString()}</span> envois totaux
            </span>
            <span className="text-gray-600 dark:text-gray-300">
              Taux moyen d'ouverture : <span className="text-emerald-600 dark:text-emerald-400">
                {notifAdmin.filteredHistory.length > 0
                  ? Math.round(notifAdmin.filteredHistory.reduce((s, c) => s + (c.deliveredCount > 0 ? (c.openedCount / c.deliveredCount) * 100 : 0), 0) / notifAdmin.filteredHistory.length)
                  : 0}%
              </span>
            </span>
          </div>

          {/* Table */}
          <div className={PAGE_CLASSES.tableContainer}>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Campagne</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Source</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Audience</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Canaux</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Performance</th>
                    <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                  {notifAdmin.filteredHistory.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-6 py-12 text-center text-gray-500 dark:text-gray-400">
                        <Clock className="h-8 w-8 mx-auto mb-2 opacity-40" />
                        Aucune campagne trouvée
                      </td>
                    </tr>
                  ) : (
                    notifAdmin.filteredHistory.map((campaign) => {
                      const deliveryRate = campaign.audienceCount > 0
                        ? Math.round((campaign.deliveredCount / campaign.audienceCount) * 100) : 0;
                      const openRate = campaign.deliveredCount > 0
                        ? Math.round((campaign.openedCount / campaign.deliveredCount) * 100) : 0;
                      const clickRate = campaign.deliveredCount > 0
                        ? Math.round((campaign.clickedCount / campaign.deliveredCount) * 100) : 0;
                      const catConfig = campaign.category ? CATEGORY_CONFIG[campaign.category] : null;

                      return (
                        <tr key={campaign.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                          <td className="px-6 py-4">
                            <div className="max-w-xs">
                              <div className="text-sm text-gray-900 dark:text-white truncate">{campaign.title}</div>
                              <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{campaign.message}</div>
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            {campaign.source === 'auto' ? (
                              <div className="flex items-center gap-2">
                                <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs ${
                                  catConfig ? `${catConfig.bg} ${catConfig.color}` : 'bg-violet-100 dark:bg-violet-800/40 text-violet-700 dark:text-violet-300'
                                }`}>
                                  <Bot className="h-3 w-3" />
                                  Auto
                                </span>
                                <span className="text-xs text-gray-600 dark:text-gray-400 truncate max-w-[120px]" title={campaign.sourceName}>
                                  {campaign.sourceName}
                                </span>
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-blue-100 dark:bg-blue-800/40 text-blue-700 dark:text-blue-300">
                                <Send className="h-3 w-3" />
                                Manuelle
                              </span>
                            )}
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-800 dark:text-gray-200">{campaign.audienceCount.toLocaleString()}</div>
                            <div className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[140px]" title={campaign.audience}>
                              {campaign.audience}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex gap-1">
                              {campaign.channels.map(ch => (
                                <span key={ch} className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                  {ch === 'push' && <Bell className="h-3 w-3" />}
                                  {ch === 'email' && <Mail className="h-3 w-3" />}
                                  {ch === 'inApp' && <MessageSquare className="h-3 w-3" />}
                                  {ch === 'whatsapp' && <Smartphone className="h-3 w-3" />}
                                  {ch === 'push' ? 'Push' : ch === 'email' ? 'Email' : ch === 'inApp' ? 'In-App' : 'WhatsApp'}
                                </span>
                              ))}
                            </div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="space-y-1">
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-gray-500 dark:text-gray-400 w-16">Délivré</span>
                                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden max-w-[80px]">
                                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${deliveryRate}%` }} />
                                </div>
                                <span className="text-gray-700 dark:text-gray-300 w-8 text-right">{deliveryRate}%</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-gray-500 dark:text-gray-400 w-16">Ouvert</span>
                                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden max-w-[80px]">
                                  <div className="h-full bg-amber-500 rounded-full" style={{ width: `${openRate}%` }} />
                                </div>
                                <span className="text-gray-700 dark:text-gray-300 w-8 text-right">{openRate}%</span>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-gray-500 dark:text-gray-400 w-16">Cliqué</span>
                                <div className="flex-1 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden max-w-[80px]">
                                  <div className="h-full bg-blue-500 rounded-full" style={{ width: `${clickRate}%` }} />
                                </div>
                                <span className="text-gray-700 dark:text-gray-300 w-8 text-right">{clickRate}%</span>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                            {formatDistanceToNow(new Date(campaign.sentAt), { addSuffix: true, locale: fr })}
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
            {notifAdmin.filteredHistory.length > 0 && (
              <div className="px-6 py-3 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
                {notifAdmin.filteredHistory.length} sur {notifAdmin.sentHistory.length} campagnes
              </div>
            )}
          </div>
        </div>
      )}

      {/* ============ TAB: TEMPLATES ============ */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Templates réutilisables pour vos campagnes manuelles
            </p>
            <button
              onClick={() => setCreatingTemplate(true)}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#dc2626] text-white rounded-lg hover:bg-[#b91c1c] transition-all text-sm shadow-md shadow-red-500/20"
            >
              <Plus className="h-4 w-4" />
              Nouveau template
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {notifAdmin.templates.map((tpl) => (
              <div key={tpl.id} className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-5 hover:shadow-lg transition-all group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h4 className="text-gray-900 dark:text-white text-sm">{tpl.name}</h4>
                    <span className="text-xs text-gray-600 dark:text-gray-300 px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-700 mt-1 inline-block">
                      {tpl.category}
                    </span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={() => handleUseTemplate(tpl)}
                      className="opacity-0 group-hover:opacity-100 px-3 py-1.5 text-xs bg-red-600 text-white rounded-lg hover:bg-red-700 transition-all shadow-sm"
                    >
                      Utiliser
                    </button>
                    <button
                      onClick={() => notifAdmin.deleteTemplate(tpl.id)}
                      className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                      title="Supprimer"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
                <p className="text-sm text-gray-700 dark:text-gray-300 mb-3 line-clamp-2">{tpl.title}</p>
                <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                  <span>{tpl.usageCount} utilisations</span>
                  {tpl.lastUsed && <span>Dernière: {new Date(tpl.lastUsed).toLocaleDateString('fr-FR')}</span>}
                </div>
              </div>
            ))}
          </div>

          {/* Create template modal */}
          {creatingTemplate && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
              <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-200 dark:border-gray-700 shadow-2xl max-w-md w-full">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="text-gray-900 dark:text-white flex items-center gap-2">
                      <FileText className="h-5 w-5 text-red-500" />
                      Nouveau template
                    </h3>
                    <button onClick={() => setCreatingTemplate(false)} title="Fermer" aria-label="Fermer" className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                      <X className="h-5 w-5 text-gray-500 dark:text-gray-400" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Nom du template</label>
                      <input value={newTplName} onChange={(e) => setNewTplName(e.target.value)} placeholder="Ex: Promo flash" className={COMPONENTS.input} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Catégorie</label>
                      <div className="relative">
                        <select value={newTplCategory} onChange={(e) => setNewTplCategory(e.target.value)} className={`${COMPONENTS.input} appearance-none pr-10`}>
                          <option value="Marketing">Marketing</option>
                          <option value="Opérationnel">Opérationnel</option>
                          <option value="Urgence">Urgence</option>
                          <option value="Communication">Communication</option>
                        </select>
                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500 pointer-events-none" />
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Titre</label>
                      <input value={newTplTitle} onChange={(e) => setNewTplTitle(e.target.value)} placeholder="Titre de la notification" className={COMPONENTS.input} />
                    </div>
                    <div>
                      <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Message</label>
                      <textarea value={newTplMessage} onChange={(e) => setNewTplMessage(e.target.value)} rows={3} placeholder="Contenu du message..." className={`${COMPONENTS.input} resize-none`} />
                    </div>
                  </div>
                  <div className="flex items-center gap-3 pt-4 mt-4 border-t border-gray-100 dark:border-gray-700">
                    <button onClick={handleCreateTemplate} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-[#dc2626] text-white rounded-lg hover:bg-[#b91c1c] transition-all text-sm">
                      <Plus className="h-4 w-4" />
                      Créer le template
                    </button>
                    <button onClick={() => setCreatingTemplate(false)} className="px-4 py-2.5 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg text-sm border border-gray-200 dark:border-gray-600">
                      Annuler
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ TAB: PROGRAMMÉES ============ */}
      {activeTab === 'programmees' && (
        <div className="space-y-4">
          {notifAdmin.scheduled.length === 0 ? (
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-12 text-center">
              <Calendar className="h-10 w-10 mx-auto text-gray-400 dark:text-gray-500 mb-3" />
              <p className="text-gray-600 dark:text-gray-400">Aucune campagne programmée</p>
            </div>
          ) : (
            <div className={PAGE_CLASSES.tableContainer}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-900/50 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Titre</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Programmée pour</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Audience</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Canaux</th>
                      <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Statut</th>
                      <th className="px-6 py-3 text-right text-xs text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {notifAdmin.scheduled.map((item) => (
                      <tr key={item.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-900 dark:text-white">{item.title}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400 line-clamp-1 mt-0.5">{item.message}</div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                          {new Date(item.scheduledAt).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-700 dark:text-gray-300">{item.audience}</div>
                          <div className="text-xs text-gray-500 dark:text-gray-400">{item.audienceCount.toLocaleString()} destinataires</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex gap-1.5">
                            {item.channels.map(ch => (
                              <span key={ch} className="px-2.5 py-0.5 rounded-md text-xs bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-600">
                                {ch === 'push' ? 'Push' : ch === 'email' ? 'Email' : ch === 'inApp' ? 'In-App' : 'WhatsApp'}
                              </span>
                            ))}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className={`px-2.5 py-1 rounded-full text-xs ${
                            item.status === 'pending'
                              ? 'bg-amber-100 dark:bg-amber-800/40 text-amber-800 dark:text-amber-200'
                              : item.status === 'sent'
                                ? 'bg-emerald-100 dark:bg-emerald-800/40 text-emerald-800 dark:text-emerald-200'
                                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
                          }`}>
                            {item.status === 'pending' ? 'En attente' : item.status === 'sent' ? 'Envoyée' : 'Annulée'}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-right">
                          {item.status === 'pending' && (
                            <button
                              onClick={() => notifAdmin.cancelScheduled(item.id)}
                              className="p-2 text-gray-500 dark:text-gray-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                              title="Annuler"
                            >
                              <XCircle className="h-4 w-4" />
                            </button>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ============ TAB: STATISTIQUES ============ */}
      {activeTab === 'statistiques' && (
        <div className="space-y-6">
          {/* Auto vs Manual breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h4 className="text-sm text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
                <Bot className="h-4 w-4 text-violet-500" />
                Automatiques vs Manuelles
              </h4>
              <div className="space-y-4">
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-700 dark:text-gray-300">Automatiques (système)</span>
                    <span className="text-gray-900 dark:text-white">{stats?.autoSent?.toLocaleString() ?? 0}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full"
                      style={{ width: `${stats ? (stats.autoSent / stats.totalSent) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="text-gray-700 dark:text-gray-300">Manuelles (admin)</span>
                    <span className="text-gray-900 dark:text-white">{stats?.manualSent?.toLocaleString() ?? 0}</span>
                  </div>
                  <div className="w-full h-3 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-blue-400 rounded-full"
                      style={{ width: `${stats ? (stats.manualSent / stats.totalSent) * 100 : 0}%` }}
                    />
                  </div>
                </div>
                <div className="pt-2 border-t border-gray-100 dark:border-gray-700 text-xs text-gray-500 dark:text-gray-400">
                  {stats ? Math.round((stats.autoSent / stats.totalSent) * 100) : 0}% des notifications sont automatiques
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
              <h4 className="text-sm text-gray-800 dark:text-gray-200 mb-4">Envois par canal</h4>
              <div className="space-y-4">
                {notifAdmin.channelStats.map(ch => (
                  <div key={ch.channel}>
                    <div className="flex items-center justify-between text-sm mb-1.5">
                      <span className="text-gray-700 dark:text-gray-300">{ch.label}</span>
                      <span className="text-gray-900 dark:text-white">{ch.percentage}%</span>
                    </div>
                    <div className="w-full h-2.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div className={`h-full rounded-full ${
                        ch.channel === 'push'
                          ? 'bg-blue-500'
                          : ch.channel === 'email'
                            ? 'bg-emerald-500'
                            : ch.channel === 'whatsapp'
                              ? 'bg-green-500'
                              : 'bg-violet-500'
                      }`} style={{ width: `${ch.percentage}%` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Top automation rules */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-sm text-gray-800 dark:text-gray-200 mb-4 flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" />
              Top automatisations par volume
            </h4>
            <div className="space-y-3">
              {[...notifAdmin.automationRules]
                .sort((a, b) => b.sentCount - a.sentCount)
                .slice(0, 5)
                .map((rule) => {
                  const cat = CATEGORY_CONFIG[rule.category];
                  const maxSent = notifAdmin.automationRules.reduce((m, r) => Math.max(m, r.sentCount), 1);
                  return (
                    <div key={rule.id} className="flex items-center gap-4">
                      <div className={`p-1.5 rounded-lg ${cat.bg} shrink-0`}>
                        <cat.icon className={`h-3.5 w-3.5 ${cat.color}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-800 dark:text-gray-200 truncate">{rule.name}</span>
                          <span className="text-gray-900 dark:text-white shrink-0 ml-2">{rule.sentCount.toLocaleString()}</span>
                        </div>
                        <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-violet-500 to-violet-400 rounded-full"
                            style={{ width: `${(rule.sentCount / maxSent) * 100}%` }}
                          />
                        </div>
                      </div>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${
                        rule.isActive ? 'bg-emerald-100 dark:bg-emerald-800/40 text-emerald-700 dark:text-emerald-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400'
                      }`}>
                        {rule.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  );
                })}
            </div>
          </div>

          {/* Weekly bar chart */}
          <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-6">
            <h4 className="text-sm text-gray-800 dark:text-gray-200 mb-5">Envois cette semaine (auto + manuels)</h4>
            <div className="flex items-end gap-3 h-40">
              {notifAdmin.weeklyStats.map((d) => (
                <div key={d.day} className="flex-1 flex flex-col items-center gap-2">
                  <div className="w-full max-w-[40px] relative flex-1 flex flex-col items-center justify-end gap-0.5">
                    <div
                      className="w-full bg-gradient-to-t from-violet-600 to-violet-400 rounded-t-sm"
                      style={{ height: `${d.auto}%` }}
                      title={`${d.auto} auto`}
                    />
                    <div
                      className="w-full bg-gradient-to-t from-blue-600 to-blue-400 rounded-b-sm"
                      style={{ height: `${d.manual}%` }}
                      title={`${d.manual} manuelles`}
                    />
                  </div>
                  <span className="text-xs text-gray-600 dark:text-gray-300">{d.day}</span>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-4 mt-4 pt-3 border-t border-gray-100 dark:border-gray-700">
              <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <span className="w-3 h-3 rounded-sm bg-violet-500" /> Automatiques
              </span>
              <span className="flex items-center gap-1.5 text-xs text-gray-600 dark:text-gray-400">
                <span className="w-3 h-3 rounded-sm bg-blue-500" /> Manuelles
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default NotificationCenter;
