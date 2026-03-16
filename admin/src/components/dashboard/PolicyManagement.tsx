/**
 * @file PolicyManagement.tsx
 * @description Gestion des Politiques & Conditions — Admin FasoTravel
 * 
 * REFONTE COMPLETE — Design propre, zero transparence, zero emoji-icons.
 * 
 * Architecture backend-ready (modele BookingManagement) :
 * - TOUTE la logique metier dans usePolicyManagement()
 * - usePolicyManagement() → policyService → AppConfig.isMock bascule mock/prod
 * - ZERO import de mock data, ZERO logique metier ici — UI thin layer uniquement
 * - Design-system FasoTravel (PAGE_CLASSES, StatCard, COMPONENTS, GRADIENTS)
 * 
 * 3 ONGLETS:
 * 1. Pages Legales — CGU, Confidentialite (editables, versionnees, publiables)
 * 2. Politiques Societes — par TSR, STAF, Rakieta, SOGEBAF (lecture + conformite)
 * 3. Regles Plateforme — imposees par FasoTravel a toutes les societes
 */

import {
  Search, Plus, FileText, Shield, Building2, Eye,
  Edit3, Trash2, CheckCircle, AlertTriangle, XCircle,
  ChevronLeft, ChevronRight, RotateCcw, Globe, Scale,
  Send, Archive, Download,
  BookOpen, Ban, ArrowLeftRight, Luggage, CircleDollarSign,
  Timer, ClipboardList, CalendarRange, DollarSign, Power,
} from 'lucide-react';
import { useState } from 'react';
import {
  usePolicyManagement,
  POLICY_TYPE_LABELS,
  PLATFORM_TYPE_LABELS,
  COMPLIANCE_LABELS,
  COMPANY_NAMES,
  type PolicyTab,
  type ComplianceStatus,
  type CompanyPolicyType,
} from '../../hooks/usePolicyManagement';
import type { OperatorPolicy, PlatformPolicy } from '../../shared/types/standardized';
import { StatCard } from '../ui/stat-card';
import { PAGE_CLASSES, GRADIENTS } from '../../lib/design-system';
import { ConfirmWrapper } from '../modals/ConfirmWrapper';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';

// ============================================================================
// ICON MAP — Lucide icons au lieu d'emojis
// ============================================================================

const POLICY_TYPE_ICONS: Record<CompanyPolicyType, typeof FileText> = {
  cancellation: Ban,
  transfer: ArrowLeftRight,
  baggage: Luggage,
  refund: CircleDollarSign,
  delay: Timer,
  general: ClipboardList,
  booking: CalendarRange,
  pricing: DollarSign,
};

const PLATFORM_TYPE_ICONS: Record<PlatformPolicy['type'], typeof FileText> = {
  privacy: Shield,
  terms: BookOpen,
  platform_rule: Scale,
};

// ============================================================================
// TAB BAR
// ============================================================================

const TABS: { key: PolicyTab; label: string; icon: typeof FileText }[] = [
  { key: 'platform', label: 'Pages Legales', icon: Globe },
  { key: 'companies', label: 'Politiques Societes', icon: Building2 },
  { key: 'rules', label: 'Regles Plateforme', icon: Scale },
];

function TabBar({ active, onChange }: { active: PolicyTab; onChange: (tab: PolicyTab) => void }) {
  return (
    <div className="flex gap-1 p-1 bg-gray-100 dark:bg-gray-800 rounded-xl mb-6">
      {TABS.map(tab => {
        const Icon = tab.icon;
        const isActive = active === tab.key;
        return (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 rounded-lg text-sm transition-colors ${
              isActive
                ? 'bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm'
                : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            <Icon size={16} />
            <span className="hidden sm:inline">{tab.label}</span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================================================
// SIMPLE MARKDOWN RENDERER
// ============================================================================

function SimpleMarkdown({ content }: { content: string }) {
  const lines = content.split('\n');
  return (
    <div className="space-y-1">
      {lines.map((line, i) => {
        if (line.startsWith('### ')) return <h4 key={i} className="text-gray-900 dark:text-white mt-4 mb-2">{line.slice(4)}</h4>;
        if (line.startsWith('## ')) return <h3 key={i} className="text-gray-900 dark:text-white mt-5 mb-2">{line.slice(3)}</h3>;
        if (line.startsWith('# ')) return <h2 key={i} className="text-gray-900 dark:text-white mt-6 mb-3">{line.slice(2)}</h2>;
        if (line.startsWith('- ')) return <ul key={i}><li className="text-sm text-gray-700 dark:text-gray-300 ml-4 list-disc">{line.slice(2)}</li></ul>;
        if (line.startsWith('**') && line.endsWith('**')) return <p key={i} className="text-sm text-gray-900 dark:text-white mt-2">{line.slice(2, -2)}</p>;
        if (line.trim() === '') return <div key={i} className="h-2" />;
        return <p key={i} className="text-sm text-gray-700 dark:text-gray-300">{line}</p>;
      })}
    </div>
  );
}

// ============================================================================
// STATUS BADGES — opaque, pas de transparence
// ============================================================================

function PlatformStatusBadge({ status }: { status: PlatformPolicy['status'] }) {
  const config: Record<string, string> = {
    draft: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300',
    published: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300',
    archived: 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400',
  };
  const labels: Record<string, string> = { draft: 'Brouillon', published: 'Publiee', archived: 'Archivee' };
  return <span className={`px-2 py-0.5 rounded-full text-xs ${config[status]}`}>{labels[status]}</span>;
}

function ComplianceBadge({ status }: { status: ComplianceStatus }) {
  const conf = COMPLIANCE_LABELS[status];
  return <span className={`px-2 py-0.5 rounded-full text-xs ${conf.className}`}>{conf.label}</span>;
}

function PolicyTypeBadge({ type }: { type: CompanyPolicyType }) {
  return (
    <span className="px-2 py-0.5 rounded-full text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
      {POLICY_TYPE_LABELS[type]}
    </span>
  );
}

// ============================================================================
// PLATFORM POLICY TABLE ROW
// ============================================================================

function PlatformPolicyRow({
  policy, onView, onEdit, onPublish, onArchive,
}: {
  policy: PlatformPolicy;
  onView: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onArchive: () => void;
}) {
  const Icon = PLATFORM_TYPE_ICONS[policy.type];
  return (
    <tr
      className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
      onClick={onView}
    >
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          <Icon size={18} className="text-gray-500 dark:text-gray-400 shrink-0" />
          <div className="min-w-0">
            <p className="text-sm text-gray-900 dark:text-white truncate">{policy.title}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{policy.summary}</p>
          </div>
        </div>
      </td>
      <td className="px-4 py-4">
        <span className="text-xs text-gray-600 dark:text-gray-400">{PLATFORM_TYPE_LABELS[policy.type]}</span>
      </td>
      <td className="px-4 py-4">
        <PlatformStatusBadge status={policy.status} />
      </td>
      <td className="px-4 py-4">
        <span className="text-xs text-gray-500 dark:text-gray-400">v{policy.version}</span>
      </td>
      <td className="px-4 py-4">
        <span className="text-xs text-gray-500 dark:text-gray-400">
          {new Date(policy.updatedAt).toLocaleDateString('fr-BF')}
        </span>
      </td>
      <td className="px-4 py-4" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-1">
          <button onClick={onView} className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors" title="Lire">
            <Eye size={15} />
          </button>
          <button onClick={onEdit} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 rounded transition-colors" title="Modifier">
            <Edit3 size={15} />
          </button>
          {policy.status === 'draft' && (
            <button onClick={onPublish} className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded transition-colors" title="Publier">
              <Send size={15} />
            </button>
          )}
          {policy.status === 'published' && (
            <button onClick={onArchive} className="p-1.5 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 rounded transition-colors" title="Archiver">
              <Archive size={15} />
            </button>
          )}
        </div>
      </td>
    </tr>
  );
}

// ============================================================================
// PLATFORM POLICY VIEW MODAL
// ============================================================================

function PlatformPolicyViewModal({
  policy, open, onOpenChange, onEdit,
}: {
  policy: PlatformPolicy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onEdit: () => void;
}) {
  if (!policy) return null;
  const Icon = PLATFORM_TYPE_ICONS[policy.type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Icon size={20} className="text-gray-600 dark:text-gray-400" />
            {policy.title}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-gray-500 dark:text-gray-400">{PLATFORM_TYPE_LABELS[policy.type]}</span>
            <PlatformStatusBadge status={policy.status} />
            <span className="text-xs text-gray-500 dark:text-gray-400">v{policy.version}</span>
          </div>

          {policy.summary && (
            <div className="bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500 p-4 rounded-r-lg">
              <p className="text-sm text-blue-800 dark:text-blue-300">{policy.summary}</p>
            </div>
          )}

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400 text-xs">Cree par</span>
              <p className="text-gray-900 dark:text-white mt-0.5">{policy.createdByName || 'Admin'}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 text-xs">Cree le</span>
              <p className="text-gray-900 dark:text-white mt-0.5">{new Date(policy.createdAt).toLocaleDateString('fr-BF')}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 text-xs">Modifie le</span>
              <p className="text-gray-900 dark:text-white mt-0.5">{new Date(policy.updatedAt).toLocaleDateString('fr-BF')}</p>
            </div>
            {policy.publishedAt && (
              <div>
                <span className="text-gray-500 dark:text-gray-400 text-xs">Publie le</span>
                <p className="text-gray-900 dark:text-white mt-0.5">{new Date(policy.publishedAt).toLocaleDateString('fr-BF')}</p>
              </div>
            )}
          </div>

          <div className="border-t border-gray-200 dark:border-gray-700 pt-5">
            <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-6 border border-gray-200 dark:border-gray-700">
              {policy.content ? <SimpleMarkdown content={policy.content} /> : (
                <p className="text-sm text-gray-400 italic">Aucun contenu redige</p>
              )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => onOpenChange(false)}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Fermer
            </button>
            <button
              onClick={() => { onOpenChange(false); onEdit(); }}
              className="flex-1 px-6 py-3 text-white rounded-lg transition-colors"
              style={{ background: GRADIENTS.burkinabe }}
            >
              <span className="flex items-center justify-center gap-2">
                <Edit3 size={16} />
                Modifier
              </span>
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// OPERATOR POLICY DETAILS MODAL
// ============================================================================

function PolicyDetailsModal({
  policy, open, onOpenChange, onUpdateCompliance,
}: {
  policy: OperatorPolicy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpdateCompliance: (id: string, status: ComplianceStatus, note?: string) => void;
}) {
  const [complianceNote, setComplianceNote] = useState('');
  if (!policy) return null;
  const Icon = POLICY_TYPE_ICONS[policy.type];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <Icon size={20} className="text-gray-600 dark:text-gray-400" />
            {policy.title}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-5">
          <div className="flex items-center gap-2 flex-wrap">
            <PolicyTypeBadge type={policy.type} />
            {policy.complianceStatus && <ComplianceBadge status={policy.complianceStatus} />}
            <span className={`px-2 py-0.5 rounded-full text-xs ${
              policy.source === 'platform'
                ? 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300'
            }`}>
              {policy.source === 'platform' ? 'FasoTravel' : policy.companyName}
            </span>
          </div>

          <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4">
            <p className="text-sm text-gray-700 dark:text-gray-300">{policy.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-gray-500 dark:text-gray-400 text-xs">Statut</span>
              <p className="text-gray-900 dark:text-white mt-0.5">{policy.status === 'active' ? 'Active' : 'Inactive'}</p>
            </div>
            <div>
              <span className="text-gray-500 dark:text-gray-400 text-xs">Date d'effet</span>
              <p className="text-gray-900 dark:text-white mt-0.5">{new Date(policy.effectiveFrom).toLocaleDateString('fr-BF')}</p>
            </div>
            {policy.createdByName && (
              <div>
                <span className="text-gray-500 dark:text-gray-400 text-xs">Creee par</span>
                <p className="text-gray-900 dark:text-white mt-0.5">{policy.createdByName}</p>
              </div>
            )}
            <div>
              <span className="text-gray-500 dark:text-gray-400 text-xs">Derniere modification</span>
              <p className="text-gray-900 dark:text-white mt-0.5">{new Date(policy.updatedAt).toLocaleDateString('fr-BF')}</p>
            </div>
          </div>

          {/* Regles structurees */}
          {Object.keys(policy.rules).length > 0 && (
            <div>
              <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-2">Regles detaillees</h4>
              <div className="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 space-y-2">
                {Object.entries(policy.rules).map(([key, value]) => (
                  <div key={key} className="flex justify-between items-center text-sm">
                    <span className="text-gray-600 dark:text-gray-400">{key}</span>
                    <span className="text-gray-900 dark:text-white font-mono text-xs">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Note de conformite existante */}
          {policy.complianceNote && (
            <div className="bg-yellow-50 dark:bg-yellow-900 border-l-4 border-yellow-500 p-4 rounded-r-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">{policy.complianceNote}</p>
            </div>
          )}

          {/* Actions conformite — uniquement pour politiques societes */}
          {policy.source === 'company' && (
            <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
              <h4 className="text-sm text-gray-600 dark:text-gray-400 mb-3">Evaluation de conformite</h4>
              <textarea
                value={complianceNote}
                onChange={(e) => setComplianceNote(e.target.value)}
                placeholder="Note de conformite (optionnel)..."
                rows={2}
                className="w-full mb-3 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 resize-none"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => { onUpdateCompliance(policy.id, 'compliant', complianceNote); onOpenChange(false); toast.success('Marque conforme'); }}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-green-700 dark:text-green-300 bg-green-100 dark:bg-green-900 hover:bg-green-200 dark:hover:bg-green-800 rounded-lg transition-colors"
                >
                  <CheckCircle size={14} /> Conforme
                </button>
                <button
                  onClick={() => { onUpdateCompliance(policy.id, 'review_needed', complianceNote); onOpenChange(false); toast.info('Marque a verifier'); }}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-yellow-700 dark:text-yellow-300 bg-yellow-100 dark:bg-yellow-900 hover:bg-yellow-200 dark:hover:bg-yellow-800 rounded-lg transition-colors"
                >
                  <AlertTriangle size={14} /> A verifier
                </button>
                <button
                  onClick={() => { onUpdateCompliance(policy.id, 'non_compliant', complianceNote); onOpenChange(false); toast.error('Marque non conforme'); }}
                  className="inline-flex items-center gap-2 px-3 py-2 text-sm text-red-700 dark:text-red-300 bg-red-100 dark:bg-red-900 hover:bg-red-200 dark:hover:bg-red-800 rounded-lg transition-colors"
                >
                  <XCircle size={14} /> Non conforme
                </button>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// PLATFORM POLICY EDITOR MODAL
// ============================================================================

function PlatformPolicyEditor({
  policy, open, onOpenChange, onSave,
}: {
  policy: PlatformPolicy | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: Partial<PlatformPolicy> & { id?: string }) => void;
}) {
  const isNew = !policy;
  const [title, setTitle] = useState(policy?.title || '');
  const [summary, setSummary] = useState(policy?.summary || '');
  const [content, setContent] = useState(policy?.content || '');
  const [type, setType] = useState<PlatformPolicy['type']>(policy?.type || 'platform_rule');
  const [scope, setScope] = useState<PlatformPolicy['scope']>(policy?.scope || 'global');
  const [version, setVersion] = useState(policy?.version || '1.0');

  // Sync form when policy changes
  const policyId = policy?.id;
  useState(() => {
    if (policy) {
      setTitle(policy.title);
      setSummary(policy.summary);
      setContent(policy.content);
      setType(policy.type);
      setScope(policy.scope);
      setVersion(policy.version);
    }
  });

  const handleSave = () => {
    if (!title.trim() || !content.trim()) {
      toast.error('Le titre et le contenu sont obligatoires');
      return;
    }
    onSave({ id: policyId, title, summary, content, type, scope, version });
    onOpenChange(false);
    toast.success(isNew ? 'Politique creee' : 'Politique mise a jour');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText size={20} className="text-gray-500" />
            {isNew ? 'Nouvelle politique plateforme' : 'Modifier la politique'}
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Type</label>
              <select aria-label="Type de politique" value={type} onChange={(e) => setType(e.target.value as PlatformPolicy['type'])}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="privacy">Politique de Confidentialite</option>
                <option value="terms">Conditions Generales d'Utilisation</option>
                <option value="platform_rule">Regle Plateforme</option>
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Portee</label>
              <select aria-label="Portée" value={scope} onChange={(e) => setScope(e.target.value as PlatformPolicy['scope'])}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="global">Globale (page legale)</option>
                <option value="company_addon">Ajoutee aux pages societes</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="col-span-2">
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Titre *</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Ex: Politique de Confidentialite FasoTravel" />
            </div>
            <div>
              <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Version</label>
              <input type="text" value={version} onChange={(e) => setVersion(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="1.0" />
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Resume</label>
            <input type="text" value={summary} onChange={(e) => setSummary(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Description courte affichee en apercu..." />
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Contenu (Markdown supporte) *</label>
            <textarea value={content} onChange={(e) => setContent(e.target.value)} rows={16}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm resize-y"
              placeholder={"# Titre\n\n## Section 1\nContenu de la politique..."} />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => onOpenChange(false)}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Annuler
            </button>
            <button onClick={handleSave}
              className="flex-1 px-6 py-3 text-white rounded-lg transition-colors"
              style={{ background: GRADIENTS.burkinabe }}>
              {isNew ? 'Creer la politique' : 'Enregistrer'}
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// CREATE RULE MODAL
// ============================================================================

function CreateRuleModal({
  open, onOpenChange, onCreate,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: Partial<OperatorPolicy>) => void;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [type, setType] = useState<OperatorPolicy['type']>('general');

  const handleCreate = () => {
    if (!title.trim() || !description.trim()) {
      toast.error('Le titre et la description sont obligatoires');
      return;
    }
    onCreate({ title, description, type, rules: {} });
    setTitle('');
    setDescription('');
    setType('general');
    onOpenChange(false);
    toast.success('Regle creee');
  };

  const typeOptions: OperatorPolicy['type'][] = ['cancellation', 'transfer', 'baggage', 'delay', 'refund', 'general', 'booking', 'pricing'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl" aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Scale size={20} className="text-gray-500" />
            Nouvelle regle FasoTravel
          </DialogTitle>
        </DialogHeader>
        <div className="mt-4 space-y-4">
          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Type</label>
            <div className="grid grid-cols-4 gap-2">
              {typeOptions.map(t => {
                const Icon = POLICY_TYPE_ICONS[t];
                return (
                  <button key={t} onClick={() => setType(t)}
                    className={`flex flex-col items-center gap-1 p-2.5 rounded-lg border-2 text-center transition-colors ${
                      type === t
                        ? 'border-red-500 bg-red-50 dark:bg-red-900 dark:border-red-400'
                        : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500'
                    }`}>
                    <Icon size={16} className={type === t ? 'text-red-600 dark:text-red-400' : 'text-gray-500 dark:text-gray-400'} />
                    <span className="text-xs text-gray-700 dark:text-gray-300">{POLICY_TYPE_LABELS[t]}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Titre *</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              placeholder="Ex: Franchise bagages minimum 20kg" />
          </div>

          <div>
            <label className="block text-sm text-gray-700 dark:text-gray-300 mb-2">Description *</label>
            <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={4}
              className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              placeholder="Decrivez la regle en detail..." />
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button onClick={() => onOpenChange(false)}
              className="flex-1 px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Annuler
            </button>
            <button onClick={handleCreate}
              className="flex-1 px-6 py-3 text-white rounded-lg transition-colors"
              style={{ background: GRADIENTS.burkinabe }}>
              Creer la regle
            </button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// ============================================================================
// TAB: PAGES LEGALES (Platform Policies)
// ============================================================================

function PlatformTab({ page }: { page: ReturnType<typeof usePolicyManagement> }) {
  return (
    <div>
      {/* Stats — 3 essentiels seulement */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <StatCard title="Pages legales" value={page.stats.totalPlatformPolicies} icon={FileText} color="blue" />
        <StatCard title="Publiees" value={page.stats.publishedPlatformPolicies} icon={CheckCircle} color="green" />
        <StatCard title="Brouillons" value={page.stats.draftPlatformPolicies} icon={Edit3} color="yellow" />
      </div>

      {/* Filters */}
      <div className={PAGE_CLASSES.searchSection}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Rechercher par titre, resume..."
              value={page.searchTerm} onChange={(e) => page.setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 text-sm" />
          </div>
          <select aria-label="Filtrer par statut" value={page.statusFilter} onChange={(e) => page.setStatusFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
            <option value="all">Tous statuts</option>
            <option value="published">Publiees</option>
            <option value="draft">Brouillons</option>
            <option value="archived">Archivees</option>
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={PAGE_CLASSES.tableContainer}>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <th className="px-5 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Document</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Version</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Modifie</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {page.platformPolicies.map(policy => (
              <PlatformPolicyRow
                key={policy.id}
                policy={policy}
                onView={() => page.handleShowPlatformView(policy)}
                onEdit={() => page.handleShowPlatformEditor(policy)}
                onPublish={() => { page.publishPlatformPolicy(policy.id); toast.success('Politique publiee'); }}
                onArchive={() => { page.archivePlatformPolicy(policy.id); toast.info('Politique archivee'); }}
              />
            ))}
          </tbody>
        </table>
        {page.platformPolicies.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            Aucune politique trouvee
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TAB: POLITIQUES SOCIETES
// ============================================================================

function CompaniesTab({ page }: { page: ReturnType<typeof usePolicyManagement> }) {
  return (
    <div>
      {/* Stats — conformite focus */}
      <div className={PAGE_CLASSES.statsGrid}>
        <StatCard title="Politiques societes" value={page.stats.totalCompanyPolicies} icon={Building2} color="blue" />
        <StatCard title="Societes couvertes" value={`${page.stats.companiesWithPolicies}/4`} icon={Shield} color="green" />
        <StatCard title="Taux conformite" value={`${page.stats.complianceRate}%`} icon={CheckCircle} color="green" />
        <StatCard title="Alertes" value={page.stats.reviewNeeded + page.stats.nonCompliant}
          subtitle={page.stats.nonCompliant > 0 ? `${page.stats.nonCompliant} non conforme(s)` : undefined}
          icon={AlertTriangle} color={page.stats.nonCompliant > 0 ? 'red' : 'yellow'} />
      </div>

      {/* Filters */}
      <div className={PAGE_CLASSES.searchSection}>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Rechercher..."
              value={page.searchTerm} onChange={(e) => page.setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 text-sm" />
          </div>
          <select aria-label="Filtrer par société" value={page.companyFilter}
            onChange={(e) => { page.setCompanyFilter(e.target.value); page.setCurrentPage(1); }}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
            <option value="all">Toutes societes</option>
            {COMPANY_NAMES.map(name => <option key={name} value={name}>{name}</option>)}
          </select>
          <select aria-label="Filtrer par type" value={page.typeFilter}
            onChange={(e) => { page.setTypeFilter(e.target.value); page.setCurrentPage(1); }}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
            <option value="all">Tous types</option>
            {Object.entries(POLICY_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
          <select aria-label="Filtrer par conformité" value={page.complianceFilter}
            onChange={(e) => { page.setComplianceFilter(e.target.value); page.setCurrentPage(1); }}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
            <option value="all">Conformite</option>
            <option value="compliant">Conformes</option>
            <option value="review_needed">A verifier</option>
            <option value="non_compliant">Non conformes</option>
          </select>
          {page.hasActiveFilters && (
            <button onClick={page.resetFilters}
              className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 rounded-lg transition-colors">
              <RotateCcw size={14} /> Reset
            </button>
          )}
          <button onClick={page.exportCompanyPolicies}
            className="inline-flex items-center gap-1.5 px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg border border-gray-300 dark:border-gray-600 transition-colors">
            <Download size={14} /> Export
          </button>
        </div>
      </div>

      {/* Table — unified view */}
      <div className={PAGE_CLASSES.tableContainer}>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <th className="px-5 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Politique</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Societe</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Conformite</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date effet</th>
              <th className="px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {page.paginatedCompanyPolicies.map(policy => {
              const Icon = POLICY_TYPE_ICONS[policy.type];
              return (
                <tr key={policy.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => page.handleShowDetails(policy)}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Icon size={16} className="text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white truncate">{policy.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{policy.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{policy.companyName}</span>
                  </td>
                  <td className="px-4 py-4"><PolicyTypeBadge type={policy.type} /></td>
                  <td className="px-4 py-4">
                    {policy.complianceStatus && <ComplianceBadge status={policy.complianceStatus} />}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      policy.status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>{policy.status === 'active' ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(policy.effectiveFrom).toLocaleDateString('fr-BF')}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => page.handleShowDetails(policy)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors" title="Details">
                        <Eye size={15} />
                      </button>
                      {policy.complianceStatus !== 'compliant' && (
                        <button onClick={() => { page.updateComplianceStatus(policy.id, 'compliant'); toast.success('Marque conforme'); }}
                          className="p-1.5 text-gray-400 hover:text-green-600 dark:hover:text-green-400 rounded transition-colors" title="Marquer conforme">
                          <CheckCircle size={15} />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {page.paginatedCompanyPolicies.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            Aucune politique trouvee
          </div>
        )}

        {/* Pagination */}
        {page.totalCompanyPages > 1 && (
          <div className="px-6 py-4 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              {page.companyPolicies.length} politique(s)
            </p>
            <div className="flex items-center gap-2">
              <button aria-label="Page précédente" onClick={() => page.setCurrentPage(Math.max(1, page.currentPage - 1))}
                disabled={page.currentPage === 1}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
                <ChevronLeft size={16} />
              </button>
              <span className="text-sm text-gray-700 dark:text-gray-300">{page.currentPage} / {page.totalCompanyPages}</span>
              <button aria-label="Page suivante" onClick={() => page.setCurrentPage(Math.min(page.totalCompanyPages, page.currentPage + 1))}
                disabled={page.currentPage === page.totalCompanyPages}
                className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================================
// TAB: REGLES PLATEFORME (FasoTravel rules imposed on companies)
// ============================================================================

function RulesTab({ page }: { page: ReturnType<typeof usePolicyManagement> }) {
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);

  return (
    <div>
      {/* Stats — 3 essentiels */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-6">
        <StatCard title="Total regles" value={page.stats.totalRules} icon={Scale} color="red" />
        <StatCard title="Actives" value={page.stats.activeRules} icon={CheckCircle} color="green" />
        <StatCard title="Inactives" value={page.stats.totalRules - page.stats.activeRules} icon={XCircle} color="gray" />
      </div>

      {/* Info banner */}
      <div className="bg-blue-50 dark:bg-blue-900 border-l-4 border-blue-500 rounded-r-lg p-4 mb-6">
        <div className="flex items-start gap-3">
          <Shield size={18} className="text-blue-600 dark:text-blue-400 mt-0.5 shrink-0" />
          <p className="text-sm text-blue-800 dark:text-blue-300">
            Ces regles s'appliquent a <strong>toutes les societes</strong> partenaires. Les societes peuvent offrir des conditions plus favorables mais jamais inferieures.
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className={PAGE_CLASSES.searchSection}>
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
            <input type="text" placeholder="Rechercher une regle..."
              value={page.searchTerm} onChange={(e) => page.setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 text-sm" />
          </div>
          <select aria-label="Filtrer par type" value={page.typeFilter} onChange={(e) => page.setTypeFilter(e.target.value)}
            className="px-4 py-2.5 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm">
            <option value="all">Tous types</option>
            {Object.entries(POLICY_TYPE_LABELS).map(([key, label]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className={PAGE_CLASSES.tableContainer}>
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <th className="px-5 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Regle</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Statut</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">En vigueur</th>
              <th className="px-4 py-3 text-left text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Auteur</th>
              <th className="px-4 py-3 text-right text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
            </tr>
          </thead>
          <tbody>
            {page.filteredRules.map(rule => {
              const Icon = POLICY_TYPE_ICONS[rule.type];
              return (
                <tr key={rule.id}
                  className="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors"
                  onClick={() => page.handleShowDetails(rule)}>
                  <td className="px-5 py-4">
                    <div className="flex items-center gap-3">
                      <Icon size={16} className="text-gray-400 shrink-0" />
                      <div className="min-w-0">
                        <p className="text-sm text-gray-900 dark:text-white truncate">{rule.title}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">{rule.description}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4"><PolicyTypeBadge type={rule.type} /></td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${
                      rule.status === 'active'
                        ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                        : 'bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                    }`}>{rule.status === 'active' ? 'Active' : 'Inactive'}</span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(rule.effectiveFrom).toLocaleDateString('fr-BF')}
                    </span>
                  </td>
                  <td className="px-4 py-4">
                    <span className="text-xs text-gray-500 dark:text-gray-400">{rule.createdByName || '-'}</span>
                  </td>
                  <td className="px-4 py-4 text-right" onClick={e => e.stopPropagation()}>
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => page.handleShowDetails(rule)}
                        className="p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded transition-colors" title="Details">
                        <Eye size={15} />
                      </button>
                      <button
                        onClick={() => { page.togglePolicyStatus(rule.id); toast.success(`Regle ${rule.status === 'active' ? 'desactivee' : 'activee'}`); }}
                        className="p-1.5 text-gray-400 hover:text-yellow-600 dark:hover:text-yellow-400 rounded transition-colors"
                        title={rule.status === 'active' ? 'Desactiver' : 'Activer'}>
                        <Power size={15} />
                      </button>
                      <button onClick={() => setConfirmDelete(rule.id)}
                        className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 rounded transition-colors" title="Supprimer">
                        <Trash2 size={15} />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {page.filteredRules.length === 0 && (
          <div className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
            Aucune regle trouvee
          </div>
        )}
      </div>

      <ConfirmWrapper
        isOpen={confirmDelete !== null}
        onClose={() => setConfirmDelete(null)}
        onConfirm={() => {
          if (confirmDelete) {
            page.deleteOperatorPolicy(confirmDelete);
            toast.success('Regle supprimee');
          }
          setConfirmDelete(null);
        }}
        title="Supprimer la regle"
        message="Etes-vous sur de vouloir supprimer cette regle ? Elle ne sera plus visible par les passagers."
        type="danger"
      />
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function PolicyManagement() {
  const page = usePolicyManagement();

  return (
    <div className={PAGE_CLASSES.container}>
      <div className={PAGE_CLASSES.content}>
        {/* Header */}
        <div className={PAGE_CLASSES.header}>
          <div className={PAGE_CLASSES.headerContent}>
            <div className={PAGE_CLASSES.headerTexts}>
              <h2 className="text-3xl text-gray-900 dark:text-white mb-2">Politiques & Conditions</h2>
              <p className="text-gray-600 dark:text-gray-400">
                Pages legales, politiques societes et regles plateforme
              </p>
            </div>
            <div className={PAGE_CLASSES.headerActions}>
              {page.activeTab === 'platform' && (
                <button onClick={() => page.handleShowPlatformEditor(null)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-lg transition-colors text-sm"
                  style={{ background: GRADIENTS.burkinabe }}>
                  <Plus size={18} /> Nouvelle page
                </button>
              )}
              {page.activeTab === 'rules' && (
                <button onClick={() => page.setShowCreateModal(true)}
                  className="inline-flex items-center gap-2 px-5 py-2.5 text-white rounded-lg transition-colors text-sm"
                  style={{ background: GRADIENTS.burkinabe }}>
                  <Plus size={18} /> Nouvelle regle
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Error */}
        {page.error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-xl flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{page.error}</p>
          </div>
        )}

        {/* Tabs */}
        <TabBar active={page.activeTab} onChange={(tab) => { page.setActiveTab(tab); page.resetFilters(); }} />

        {/* Tab content */}
        {page.activeTab === 'platform' && <PlatformTab page={page} />}
        {page.activeTab === 'companies' && <CompaniesTab page={page} />}
        {page.activeTab === 'rules' && <RulesTab page={page} />}

        {/* Modals */}
        <PolicyDetailsModal
          policy={page.selectedPolicy}
          open={page.showDetailsModal}
          onOpenChange={page.setShowDetailsModal}
          onUpdateCompliance={page.updateComplianceStatus}
        />
        <PlatformPolicyViewModal
          policy={page.selectedPlatformForView}
          open={page.showPlatformViewModal}
          onOpenChange={page.setShowPlatformViewModal}
          onEdit={() => page.handleShowPlatformEditor(page.selectedPlatformForView)}
        />
        <PlatformPolicyEditor
          policy={page.selectedPlatformPolicy}
          open={page.showPlatformEditor}
          onOpenChange={page.setShowPlatformEditor}
          onSave={page.savePlatformPolicy}
        />
        <CreateRuleModal
          open={page.showCreateModal}
          onOpenChange={page.setShowCreateModal}
          onCreate={page.createOperatorRule}
        />
      </div>
    </div>
  );
}

export default PolicyManagement;
