/**
 * AdvertisingManagement - Hub « Stories & Publicités »
 *
 * STORIES : Cercles dynamiques (défaut + custom), upload fichier, tracking vues+clics
 * PUBLICITÉS : Modales popup dans l'app, ciblage par page, tracking impressions/clics/CTR
 *
 * Les deux partagent : image | video | gradient (upload fichier, pas d'URL manuelle)
 * BACKEND-READY — hooks dédiés, services, mock data
 */

import { useState, useMemo, useRef, useCallback } from 'react';
import {
  Plus, Eye, MousePointer, Megaphone, Image as ImageIcon,
  Play, Calendar, Edit2, StopCircle, Search, RefreshCw,
  Loader2, TrendingUp, Layout, Clock,
  CheckCircle, XCircle, Users, Percent, Link, Globe,
  Smartphone, Video, Palette, Star, X, Send,
  Layers, Upload,
  Trash2, PlusCircle,
} from 'lucide-react';
import {
  useAdvertisements, useAdvertisementActions,
  useStories, useStoryActions,
  useStoryCircles, useStoryCircleActions,
} from '../../hooks/useEntities';
import { formatNumber, formatDate, calculateCTR, getRelativeTime } from '../../lib/utils';
import { StatCard } from '../ui/stat-card';
import { PAGE_CLASSES, COMPONENTS } from '../../lib/design-system';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '../ui/dialog';
import { toast } from 'sonner@2.0.3';
import type { Advertisement, Story, StoryCircle } from '../../shared/types/standardized';

// ==================== CONSTANTES ====================

const MEDIA_TYPE_CONFIG = {
  image: { icon: ImageIcon, label: 'Image', color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-50 dark:bg-blue-900/20', border: 'border-blue-200 dark:border-blue-800', activeBorder: 'border-blue-500' },
  video: { icon: Video, label: 'Vidéo', color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-50 dark:bg-purple-900/20', border: 'border-purple-200 dark:border-purple-800', activeBorder: 'border-purple-500' },
  gradient: { icon: Palette, label: 'Gradient', color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-50 dark:bg-amber-900/20', border: 'border-amber-200 dark:border-amber-800', activeBorder: 'border-amber-500' },
} as const;

const TARGET_PAGE_OPTIONS = [
  { value: 'home', label: 'Accueil' },
  { value: 'search-results', label: 'Recherche' },
  { value: 'tickets', label: 'Billets' },
  { value: 'operators', label: 'Opérateurs' },
  { value: 'nearby', label: 'À proximité' },
] as const;

const INTERNAL_PAGE_OPTIONS = [
  { value: 'home', label: '🏠 Accueil', desc: 'Page principale' },
  { value: 'search', label: '🔍 Recherche', desc: 'Formulaire de recherche' },
  { value: 'search-results', label: '📋 Résultats', desc: 'Liste des trajets' },
  { value: 'tickets', label: '🎫 Mes billets', desc: 'Billets achetés' },
  { value: 'bookings', label: '📖 Réservations', desc: 'Mes réservations' },
  { value: 'operators', label: '🏢 Opérateurs', desc: 'Liste des sociétés' },
  { value: 'operator-detail', label: '🚌 Détail opérateur', desc: "Page d'un opérateur" },
  { value: 'nearby', label: '📍 À proximité', desc: 'Gares proches' },
  { value: 'promotions', label: '🎁 Promotions', desc: 'Offres en cours' },
  { value: 'loyalty', label: '⭐ Fidélité', desc: 'Programme de points' },
  { value: 'referral', label: '🤝 Parrainage', desc: 'Inviter des amis' },
  { value: 'notifications', label: '🔔 Notifications', desc: 'Centre de notifs' },
  { value: 'support', label: '💬 Support', desc: 'Aide & contact' },
  { value: 'faq', label: '❓ FAQ', desc: 'Questions fréquentes' },
  { value: 'profile', label: '👤 Profil', desc: 'Mon compte' },
  { value: 'settings', label: '⚙️ Paramètres', desc: "Réglages de l'app" },
  { value: 'wallet', label: '💰 Portefeuille', desc: 'Solde & paiements' },
] as const;

const AD_DURATION_OPTIONS = [
  { value: 24, label: '24h' },
  { value: 72, label: '3 jours' },
  { value: 168, label: '7 jours' },
  { value: 336, label: '14 jours' },
  { value: 720, label: '30 jours' },
  { value: 1440, label: '60 jours' },
  { value: 2160, label: '90 jours' },
];

const STATUS_BADGE: Record<string, string> = {
  active: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700',
  inactive: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700',
  expired: 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600',
  published: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border border-green-200 dark:border-green-700',
  draft: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 border border-yellow-200 dark:border-yellow-700',
  archived: 'bg-gray-100 dark:bg-gray-700/50 text-gray-500 dark:text-gray-400 border border-gray-200 dark:border-gray-600',
};

const STATUS_LABELS: Record<string, string> = {
  active: 'Active', inactive: 'Inactive', expired: 'Expirée',
  published: 'Publiée', draft: 'Brouillon', archived: 'Archivée',
};

type ActiveTab = 'stories' | 'ads';

// ==================== FILE UPLOAD HELPER ====================

function fileToBase64(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

// ==================== COMPOSANT PRINCIPAL ====================

export function AdvertisingManagement() {
  const { data: advertisements, refresh: refreshAds } = useAdvertisements();
  const adActions = useAdvertisementActions();
  const { data: stories, refresh: refreshStories } = useStories();
  const storyActions = useStoryActions();
  const { data: circles, refresh: refreshCircles } = useStoryCircles();
  const circleActions = useStoryCircleActions();

  const [activeTab, setActiveTab] = useState<ActiveTab>('stories');
  const [searchTerm, setSearchTerm] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showCircleModal, setShowCircleModal] = useState(false);
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [selectedAd, setSelectedAd] = useState<Advertisement | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  // Circle helper
  const getCircle = useCallback((id: string) => circles.find(c => c.id === id), [circles]);

  // Stats
  const storyStats = useMemo(() => {
    const published = stories.filter(s => s.status === 'published').length;
    const totalViews = stories.reduce((s, st) => s + (st.viewsCount || 0), 0);
    const totalClicks = stories.reduce((s, st) => s + (st.clicksCount || 0), 0);
    const byCircle: Record<string, number> = {};
    circles.forEach(c => { byCircle[c.id] = stories.filter(s => s.circleId === c.id).length; });
    return { total: stories.length, published, totalViews, totalClicks, byCircle };
  }, [stories, circles]);

  const adStats = useMemo(() => {
    const active = advertisements.filter(a => a.status === 'active').length;
    const totalImpressions = advertisements.reduce((s, a) => s + (a.impressions || 0), 0);
    const totalClicks = advertisements.reduce((s, a) => s + (a.clicks || 0), 0);
    const avgCTR = calculateCTR(totalClicks, totalImpressions);
    return { total: advertisements.length, active, totalImpressions, totalClicks, avgCTR };
  }, [advertisements]);

  // Filtered
  const filteredStories = useMemo(() => {
    if (!searchTerm) return stories;
    const q = searchTerm.toLowerCase();
    return stories.filter(s => s.title.toLowerCase().includes(q) || s.description?.toLowerCase().includes(q));
  }, [stories, searchTerm]);

  const filteredAds = useMemo(() => {
    let result = [...advertisements];
    if (searchTerm) {
      const q = searchTerm.toLowerCase();
      result = result.filter(a => a.title.toLowerCase().includes(q) || a.description?.toLowerCase().includes(q));
    }
    return result.sort((a, b) => {
      const so: Record<string, number> = { active: 0, inactive: 1, expired: 2 };
      return (so[a.status] ?? 2) - (so[b.status] ?? 2) || (b.priority || 0) - (a.priority || 0);
    });
  }, [advertisements, searchTerm]);

  // Action helper
  const runAction = async (key: string, fn: () => Promise<any>, ok: string, err: string) => {
    setActionLoading(key);
    try {
      const r = await fn();
      if (r?.success) { toast.success(ok); await refreshAll(); }
      else toast.error(r?.error || err);
    } catch { toast.error(err); }
    finally { setActionLoading(null); }
  };

  const refreshAll = async () => { await refreshStories(); await refreshAds(); await refreshCircles(); };
  const handleRefresh = async () => { setActionLoading('refresh'); await refreshAll(); setActionLoading(null); toast.success('Actualisé'); };

  return (
    <div className={PAGE_CLASSES.container}>
      {/* HEADER */}
      <div className={PAGE_CLASSES.header}>
        <div className={PAGE_CLASSES.headerContent}>
          <div className={PAGE_CLASSES.headerTexts}>
            <h1 className="text-3xl text-gray-900 dark:text-white mb-2">Stories & Publicités</h1>
            <p className="text-gray-600 dark:text-gray-400">Gérez le contenu visible dans l'app mobile</p>
          </div>
          <div className={PAGE_CLASSES.headerActions}>
            <button onClick={handleRefresh} disabled={actionLoading === 'refresh'} className={COMPONENTS.buttonSecondary}>
              <RefreshCw size={18} className={actionLoading === 'refresh' ? 'animate-spin' : ''} /> Actualiser
            </button>
            <button onClick={() => { setIsEditMode(false); setSelectedStory(null); setSelectedAd(null); setShowCreateModal(true); }}
              className={COMPONENTS.buttonPrimary} style={{ background: 'linear-gradient(to right, #dc2626, #f59e0b, #16a34a)' }}>
              <Plus size={18} /> Créer
            </button>
          </div>
        </div>
      </div>

      {/* TABS */}
      <div className="flex gap-2 mb-6">
        <TabBtn active={activeTab === 'stories'} onClick={() => setActiveTab('stories')}
          icon={<Layers size={18} />} label="Stories" count={storyStats.total} gradient="from-purple-500 to-pink-500" />
        <TabBtn active={activeTab === 'ads'} onClick={() => setActiveTab('ads')}
          icon={<Megaphone size={18} />} label="Publicités" count={adStats.total} gradient="from-red-500 to-amber-500" />
      </div>

      {activeTab === 'stories' ? (
        <StoriesTab
          stories={filteredStories} circles={circles} stats={storyStats} searchTerm={searchTerm}
          setSearchTerm={setSearchTerm} actionLoading={actionLoading} getCircle={getCircle}
          onView={s => { setSelectedStory(s); setShowDetailModal(true); }}
          onEdit={s => { setSelectedStory(s); setIsEditMode(true); setShowCreateModal(true); }}
          onPublish={s => runAction(`pub-${s.id}`, () => storyActions.publish(s.id), 'Story publiée', 'Erreur')}
          onDelete={s => runAction(`del-${s.id}`, () => storyActions.remove(s.id), 'Story supprimée', 'Erreur')}
          onAddCircle={() => setShowCircleModal(true)}
          onDeleteCircle={c => runAction(`del-circle-${c.id}`, () => circleActions.remove(c.id), 'Cercle supprimé', 'Erreur')}
          filterCircleId="" setFilterCircleId={() => {}}
        />
      ) : (
        <AdsTab ads={filteredAds} stats={adStats} searchTerm={searchTerm} setSearchTerm={setSearchTerm} actionLoading={actionLoading}
          onView={a => { setSelectedAd(a); setShowDetailModal(true); }}
          onEdit={a => { setSelectedAd(a); setIsEditMode(true); setShowCreateModal(true); }}
          onToggle={a => {
            const ns = a.status === 'active' ? 'inactive' : 'active';
            runAction(`tog-${a.id}`, () => adActions.update(a.id, { status: ns }), `Publicité ${ns === 'active' ? 'activée' : 'désactivée'}`, 'Erreur');
          }}
          onDelete={a => runAction(`del-ad-${a.id}`, () => adActions.remove(a.id), 'Publicité supprimée', 'Erreur')}
        />
      )}

      {/* DETAIL MODAL */}
      {showDetailModal && (selectedStory || selectedAd) && (
        <Dialog open onOpenChange={() => { setShowDetailModal(false); setSelectedStory(null); setSelectedAd(null); }}>
          <DialogContent className="sm:max-w-5xl w-[90vw] max-h-[90vh] overflow-y-auto">
            {selectedStory ? <StoryDetailContent story={selectedStory} circle={getCircle(selectedStory.circleId)} />
              : selectedAd ? <AdDetailContent ad={selectedAd} /> : null}
          </DialogContent>
        </Dialog>
      )}

      {/* CREATE / EDIT MODAL */}
      {showCreateModal && (
        <Dialog open onOpenChange={() => { setShowCreateModal(false); setSelectedStory(null); setSelectedAd(null); }}>
          <DialogContent className="sm:max-w-3xl w-[85vw] max-h-[90vh] overflow-y-auto">
            <CreateEditModal
              activeTab={activeTab} circles={circles}
              editStory={isEditMode ? selectedStory : null} editAd={isEditMode ? selectedAd : null}
              isEditMode={isEditMode} actionLoading={actionLoading}
              onSubmitStory={data => {
                const act = isEditMode && selectedStory
                  ? () => storyActions.update(selectedStory.id, data)
                  : () => storyActions.create(data);
                runAction('submit', act, isEditMode ? 'Story mise à jour' : 'Story créée', 'Erreur');
                setShowCreateModal(false);
              }}
              onSubmitAd={data => {
                const act = isEditMode && selectedAd
                  ? () => adActions.update(selectedAd.id, data)
                  : () => adActions.create({ ...data, impressions: 0, clicks: 0, status: 'active' });
                runAction('submit', act, isEditMode ? 'Publicité mise à jour' : 'Publicité créée', 'Erreur');
                setShowCreateModal(false);
              }}
              onClose={() => { setShowCreateModal(false); setSelectedStory(null); setSelectedAd(null); }}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* CREATE CIRCLE MODAL */}
      {showCircleModal && (
        <Dialog open onOpenChange={() => setShowCircleModal(false)}>
          <DialogContent className="max-w-md">
            <CreateCircleModal
              onSubmit={data => {
                runAction('circle', () => circleActions.create(data), 'Cercle créé', 'Erreur');
                setShowCircleModal(false);
              }}
              onClose={() => setShowCircleModal(false)}
              actionLoading={actionLoading}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

// ==================== TAB BUTTON ====================

function TabBtn({ active, onClick, icon, label, count, gradient }: {
  active: boolean; onClick: () => void; icon: React.ReactNode; label: string; count: number; gradient: string;
}) {
  return (
    <button onClick={onClick}
      className={`flex items-center gap-2.5 px-6 py-3 rounded-xl text-sm transition-all ${
        active ? `bg-gradient-to-r ${gradient} text-white shadow-lg` : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
      }`}>
      {icon}<span>{label}</span>
      <span className={`px-2 py-0.5 rounded-full text-xs ${active ? 'bg-white/20' : 'bg-gray-200 dark:bg-gray-600'}`}>{count}</span>
    </button>
  );
}

// ==================== STORIES TAB ====================

function StoriesTab({ stories, circles, stats, searchTerm, setSearchTerm, actionLoading, getCircle, onView, onEdit, onPublish, onDelete, onAddCircle, onDeleteCircle }: {
  stories: Story[]; circles: StoryCircle[]; stats: any; searchTerm: string; setSearchTerm: (v: string) => void;
  actionLoading: string | null; getCircle: (id: string) => StoryCircle | undefined;
  onView: (s: Story) => void; onEdit: (s: Story) => void; onPublish: (s: Story) => void; onDelete: (s: Story) => void;
  onAddCircle: () => void; onDeleteCircle: (c: StoryCircle) => void; filterCircleId: string; setFilterCircleId: (v: string) => void;
}) {
  const [filterCircle, setFilterCircle] = useState<string>('all');
  const filtered = filterCircle === 'all' ? stories : stories.filter(s => s.circleId === filterCircle);
  const sortedCircles = [...circles].sort((a, b) => a.order - b.order);

  return (
    <>
      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Total stories" value={stats.total} icon={Layers} color="purple" />
        <StatCard title="Publiées" value={stats.published} icon={CheckCircle} color="green" />
        <StatCard title="Vues totales" value={formatNumber(stats.totalViews)} icon={Eye} color="blue" />
        <StatCard title="Clics CTA" value={formatNumber(stats.totalClicks)} icon={MousePointer} color="red" />
      </div>

      {/* Circles filter */}
      <div className="flex items-center gap-3 mb-6 overflow-x-auto pb-2">
        <button onClick={() => setFilterCircle('all')}
          className={`flex-shrink-0 px-4 py-2.5 rounded-xl text-sm transition-all border-2 ${filterCircle === 'all' ? 'border-gray-800 dark:border-white bg-gray-800 dark:bg-white text-white dark:text-gray-900' : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-300'}`}>
          Tous ({stats.total})
        </button>
        {sortedCircles.map(c => {
          const count = stats.byCircle[c.id] || 0;
          const sel = filterCircle === c.id;
          return (
            <div key={c.id} className="flex-shrink-0 relative group/circle">
              <button onClick={() => setFilterCircle(sel ? 'all' : c.id)}
                className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm transition-all border-2 ${sel ? 'text-white shadow-lg' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300 hover:border-gray-300'}`}
                style={sel ? { background: c.gradient, borderColor: 'transparent' } : {}}>
                <span className="text-base">{c.emoji}</span>
                <span>{c.name}</span>
                <span className={`px-1.5 py-0.5 rounded-full text-xs ${sel ? 'bg-white/25' : 'bg-gray-100 dark:bg-gray-700'}`}>{count}</span>
              </button>
              {!c.isDefault && (
                <button onClick={e => { e.stopPropagation(); onDeleteCircle(c); }}
                  disabled={!!actionLoading}
                  title="Supprimer ce cercle"
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/circle:opacity-100 transition-opacity shadow-sm hover:bg-red-600 disabled:opacity-40">
                  {actionLoading === `del-circle-${c.id}` ? <Loader2 size={10} className="animate-spin" /> : <X size={10} />}
                </button>
              )}
            </div>
          );
        })}
        <button onClick={onAddCircle}
          className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:text-gray-600 hover:border-gray-400 transition-all">
          <PlusCircle size={16} /> Nouveau cercle
        </button>
      </div>

      {/* Search */}
      <div className="mb-4 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" placeholder="Rechercher une story..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" />
      </div>

      {/* Stories grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.length === 0 ? (
          <div className="col-span-full py-16 text-center">
            <Layers className="mx-auto mb-3 text-gray-300" size={48} />
            <p className="text-gray-500 dark:text-gray-400">Aucune story trouvée</p>
          </div>
        ) : filtered.map(story => (
          <StoryCard key={story.id} story={story} circle={getCircle(story.circleId)} actionLoading={actionLoading}
            onView={() => onView(story)} onEdit={() => onEdit(story)}
            onPublish={() => onPublish(story)} onDelete={() => onDelete(story)} />
        ))}
      </div>
    </>
  );
}

// ==================== STORY CARD ====================

function StoryCard({ story, circle, actionLoading, onView, onEdit, onPublish, onDelete }: {
  story: Story; circle?: StoryCircle; actionLoading: string | null;
  onView: () => void; onEdit: () => void; onPublish: () => void; onDelete: () => void;
}) {
  const MediaIcon = MEDIA_TYPE_CONFIG[story.mediaType]?.icon || ImageIcon;
  const mediaConf = MEDIA_TYPE_CONFIG[story.mediaType] || MEDIA_TYPE_CONFIG.image;
  const ctr = story.viewsCount > 0 ? ((story.clicksCount || 0) / story.viewsCount * 100) : 0;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-md transition-shadow">
      {/* Preview */}
      <div className="h-36 relative overflow-hidden">
        <MediaPreviewBg mediaType={story.mediaType} mediaUrl={story.mediaUrl} gradient={story.gradient} emoji={story.emoji} />
        <div className="absolute top-3 left-3">
          {circle && (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs text-white shadow-lg"
              style={{ background: circle.gradient }}>
              {circle.emoji} {circle.name}
            </span>
          )}
        </div>
        <div className="absolute top-3 right-3">
          <span className={`px-2.5 py-1 rounded-full text-xs ${STATUS_BADGE[story.status]}`}>{STATUS_LABELS[story.status]}</span>
        </div>
      </div>

      {/* Content */}
      <div className="p-4">
        <h3 className="text-sm text-gray-900 dark:text-white truncate">{story.title}</h3>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 line-clamp-2">{story.description}</p>

        {/* Stats row — always visible */}
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500 dark:text-gray-400">
          <span className="flex items-center gap-1"><Eye size={12} />{formatNumber(story.viewsCount)}</span>
          <span className="flex items-center gap-1"><MousePointer size={12} />{formatNumber(story.clicksCount || 0)}</span>
          {ctr > 0 && <span className="flex items-center gap-1 text-green-600"><TrendingUp size={12} />{ctr.toFixed(1)}%</span>}
          <span className={`flex items-center gap-1 ${mediaConf.color}`}><MediaIcon size={12} />{mediaConf.label}</span>
        </div>

        {/* Actions — always visible */}
        <div className="flex items-center gap-2 mt-3 pt-3 border-t border-gray-100 dark:border-gray-700">
          <button onClick={onView} className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-lg text-xs hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors">
            <Eye size={12} /> Voir
          </button>
          <button onClick={onEdit} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-300 rounded-lg text-xs hover:bg-blue-100 dark:hover:bg-blue-900/40 transition-colors">
            <Edit2 size={12} /> Modifier
          </button>
          {story.status === 'draft' && (
            <button onClick={onPublish} disabled={actionLoading === `pub-${story.id}`}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-lg text-xs hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors disabled:opacity-50 ml-auto">
              {actionLoading === `pub-${story.id}` ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />} Publier
            </button>
          )}
          <button onClick={onDelete} disabled={actionLoading === `del-${story.id}`}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-lg text-xs hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors disabled:opacity-50 ml-auto">
            {actionLoading === `del-${story.id}` ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Supprimer
          </button>
        </div>
      </div>
    </div>
  );
}

// ==================== ADS TAB ====================

function AdsTab({ ads, stats, searchTerm, setSearchTerm, actionLoading, onView, onEdit, onToggle, onDelete }: {
  ads: Advertisement[]; stats: any; searchTerm: string; setSearchTerm: (v: string) => void;
  actionLoading: string | null;
  onView: (a: Advertisement) => void; onEdit: (a: Advertisement) => void; onToggle: (a: Advertisement) => void; onDelete: (a: Advertisement) => void;
}) {
  return (
    <>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
        <StatCard title="Actives" value={stats.active} icon={CheckCircle} color="green" subtitle={`sur ${stats.total}`} />
        <StatCard title="Impressions" value={formatNumber(stats.totalImpressions)} icon={Eye} color="blue" />
        <StatCard title="Clics" value={formatNumber(stats.totalClicks)} icon={MousePointer} color="purple" />
        <StatCard title="CTR moyen" value={`${stats.avgCTR.toFixed(2)}%`} icon={TrendingUp} color="red" />
      </div>

      <div className="mb-4 relative">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
        <input type="text" placeholder="Rechercher une publicité..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}
          className="w-full pl-11 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400" />
      </div>

      <div className={PAGE_CLASSES.tableContainer}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
              <tr>
                {['Publicité', 'Média', 'Pages', 'Priorité', 'Performance', 'Statut', 'Actions'].map(h => (
                  <th key={h} className={`px-5 py-4 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider ${h === 'Actions' ? 'text-right' : 'text-left'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {ads.length === 0 ? (
                <tr><td colSpan={7} className="px-6 py-16 text-center">
                  <Megaphone className="mx-auto mb-3 text-gray-300" size={48} />
                  <p className="text-gray-500 dark:text-gray-400">Aucune publicité</p>
                </td></tr>
              ) : ads.map(ad => {
                const mc = MEDIA_TYPE_CONFIG[ad.mediaType] || MEDIA_TYPE_CONFIG.image;
                const McIcon = mc.icon;
                const ctr = calculateCTR(ad.clicks, ad.impressions);
                const isActive = ad.status === 'active';
                return (
                  <tr key={ad.id} className={`hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors ${!isActive ? 'opacity-60' : ''}`}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        <MediaPreviewSmall mediaType={ad.mediaType} mediaUrl={ad.mediaUrl} gradient={ad.gradient} emoji={ad.emoji} />
                        <div className="min-w-0">
                          <p className="text-sm text-gray-900 dark:text-white truncate max-w-[200px]">{ad.title}</p>
                          <p className="text-xs text-gray-400 truncate max-w-[200px] mt-0.5">{ad.description}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs border ${mc.bg} ${mc.color} ${mc.border}`}>
                        <McIcon size={12} />{mc.label}
                      </span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex flex-wrap gap-1">
                        {ad.targetPages?.map(p => (
                          <span key={p} className="px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                            {TARGET_PAGE_OPTIONS.find(o => o.value === p)?.label || p}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-5 py-4"><PriorityBadge priority={ad.priority} /></td>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3 text-xs text-gray-500 dark:text-gray-400">
                        <span className="flex items-center gap-1"><Eye size={11} />{formatNumber(ad.impressions)}</span>
                        <span className="flex items-center gap-1"><MousePointer size={11} />{formatNumber(ad.clicks)}</span>
                        <span className="text-gray-700 dark:text-gray-300">{ctr.toFixed(1)}%</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs ${STATUS_BADGE[ad.status]}`}>{STATUS_LABELS[ad.status]}</span>
                    </td>
                    <td className="px-5 py-4">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => onView(ad)} title="Détails" className="p-2 rounded-lg text-gray-500 hover:text-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700"><Eye size={16} /></button>
                        <button onClick={() => onEdit(ad)} title="Modifier" className="p-2 rounded-lg text-blue-500 hover:text-blue-700 hover:bg-blue-50 dark:hover:bg-blue-900/20"><Edit2 size={16} /></button>
                        {ad.status !== 'expired' && (
                          <button onClick={() => onToggle(ad)} disabled={!!actionLoading} title={isActive ? 'Désactiver' : 'Activer'}
                            className={`p-2 rounded-lg disabled:opacity-40 ${isActive ? 'text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20' : 'text-green-500 hover:bg-green-50 dark:hover:bg-green-900/20'}`}>
                            {actionLoading === `tog-${ad.id}` ? <Loader2 size={16} className="animate-spin" /> : isActive ? <StopCircle size={16} /> : <Play size={16} />}
                          </button>
                        )}
                        <button onClick={() => onDelete(ad)} disabled={!!actionLoading} title="Supprimer"
                          className="p-2 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-40">
                          {actionLoading === `del-ad-${ad.id}` ? <Loader2 size={16} className="animate-spin" /> : <Trash2 size={16} />}
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
    </>
  );
}

// ==================== STORY DETAIL ====================

function StoryDetailContent({ story, circle }: { story: Story; circle?: StoryCircle }) {
  const ctr = story.viewsCount > 0 ? ((story.clicksCount || 0) / story.viewsCount * 100) : 0;

  const getRemainingDuration = () => {
    if (!story.expiresAt) return null;
    const now = new Date().getTime();
    const expires = new Date(story.expiresAt).getTime();
    const diffMs = expires - now;
    if (diffMs <= 0) return { label: 'Expirée', expired: true, percent: 0 };
    const totalMs = story.publishedAt ? expires - new Date(story.publishedAt).getTime() : diffMs;
    const percent = Math.min(100, Math.max(0, (diffMs / totalMs) * 100));
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffH / 24);
    const label = diffD > 0 ? `${diffD}j ${diffH % 24}h restantes` : `${diffH}h restantes`;
    return { label, expired: false, percent };
  };
  const remaining = getRemainingDuration();

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3">
          {circle && <span className="w-9 h-9 rounded-full flex items-center justify-center text-lg shadow-lg" style={{ background: circle.gradient }}>{circle.emoji}</span>}
          <span className="truncate">{story.title}</span>
        </DialogTitle>
        <DialogDescription>{circle?.name || 'Story'} · #{story.id}</DialogDescription>
      </DialogHeader>
      <div className="space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-xs ${STATUS_BADGE[story.status]}`}>{STATUS_LABELS[story.status]}</span>
          {circle && <span className="px-3 py-1 rounded-full text-xs text-white" style={{ background: circle.gradient }}>{circle.emoji} {circle.name}</span>}
          {remaining && (
            <span className={`ml-auto px-3 py-1 rounded-full text-xs flex items-center gap-1.5 ${remaining.expired ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'}`}>
              <Clock size={12} /> {remaining.label}
            </span>
          )}
        </div>

        {remaining && !remaining.expired && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><Calendar size={11} /> {story.publishedAt ? formatDate(story.publishedAt, 'long') : '—'}</span>
              <span className="flex items-center gap-1">{formatDate(story.expiresAt!, 'long')} <Calendar size={11} /></span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all" style={{ width: `${100 - remaining.percent}%`, background: circle?.gradient || 'linear-gradient(to right, #8b5cf6, #ec4899)' }} />
            </div>
          </div>
        )}
        {remaining?.expired && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
            <XCircle size={16} /> Cette story a expiré le {formatDate(story.expiresAt!, 'long')}
          </div>
        )}

        <div className="rounded-xl overflow-hidden h-56 shadow-sm border border-gray-200 dark:border-gray-700">
          <MediaPreviewBg mediaType={story.mediaType} mediaUrl={story.mediaUrl} gradient={story.gradient} emoji={story.emoji} />
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-800 dark:text-gray-200">{story.description}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <PerfCard icon={<Eye size={18} />} label="Vues" value={formatNumber(story.viewsCount ?? 0)} color="blue" />
          <PerfCard icon={<MousePointer size={18} />} label="Clics CTA" value={formatNumber(story.clicksCount ?? 0)} color="amber" />
          <PerfCard icon={<Percent size={18} />} label="Taux clics" value={`${Number.isFinite(ctr) ? ctr.toFixed(1) : '0.0'}%`} color="green" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          {story.ctaText && <DetailRow label="CTA" value={story.ctaText} icon={<Link size={13} />} />}
          {story.actionType !== 'none' && (
            <DetailRow label="Action" value={story.actionType === 'internal' ? `Page: ${story.internalPage}` : story.actionUrl} icon={story.actionType === 'internal' ? <Smartphone size={13} /> : <Globe size={13} />} />
          )}
          <DetailRow label="Auteur" value={story.createdByName} icon={<Users size={13} />} />
          <DetailRow label="Créée" value={getRelativeTime(story.createdAt)} icon={<Clock size={13} />} />
          {story.publishedAt && <DetailRow label="Publiée" value={formatDate(story.publishedAt, 'long')} icon={<Send size={13} />} />}
          {story.expiresAt && <DetailRow label="Expire" value={formatDate(story.expiresAt, 'long')} icon={<Calendar size={13} />} />}
        </div>
      </div>
    </>
  );
}

// ==================== AD DETAIL ====================

function AdDetailContent({ ad }: { ad: Advertisement }) {
  const ctr = calculateCTR(ad.clicks, ad.impressions);

  const getAdRemaining = () => {
    if (!ad.endDate) return null;
    const now = new Date().getTime();
    const end = new Date(ad.endDate).getTime();
    const diffMs = end - now;
    if (diffMs <= 0) return { label: 'Terminée', expired: true, percent: 0 };
    const start = ad.startDate ? new Date(ad.startDate).getTime() : now;
    const totalMs = end - start;
    const percent = Math.min(100, Math.max(0, (diffMs / totalMs) * 100));
    const diffH = Math.floor(diffMs / 3600000);
    const diffD = Math.floor(diffH / 24);
    const label = diffD > 0 ? `${diffD}j ${diffH % 24}h restantes` : `${diffH}h restantes`;
    return { label, expired: false, percent };
  };
  const remaining = getAdRemaining();

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-3"><Megaphone size={20} className="text-red-500" /><span className="truncate">{ad.title}</span></DialogTitle>
        <DialogDescription>Publicité · #{ad.id}</DialogDescription>
      </DialogHeader>
      <div className="space-y-5">
        <div className="flex items-center gap-2 flex-wrap">
          <span className={`px-3 py-1 rounded-full text-xs ${STATUS_BADGE[ad.status]}`}>{STATUS_LABELS[ad.status]}</span>
          <PriorityBadge priority={ad.priority} />
          {remaining && (
            <span className={`ml-auto px-3 py-1 rounded-full text-xs flex items-center gap-1.5 ${remaining.expired ? 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400' : 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300'}`}>
              <Clock size={12} /> {remaining.label}
            </span>
          )}
        </div>

        {remaining && !remaining.expired && (
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs text-gray-500 dark:text-gray-400">
              <span className="flex items-center gap-1"><Calendar size={11} /> {formatDate(ad.startDate, 'long')}</span>
              <span className="flex items-center gap-1">{formatDate(ad.endDate, 'long')} <Calendar size={11} /></span>
            </div>
            <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all bg-gradient-to-r from-red-500 via-amber-500 to-green-500" style={{ width: `${100 - remaining.percent}%` }} />
            </div>
          </div>
        )}
        {remaining?.expired && (
          <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl text-sm text-red-600 dark:text-red-400">
            <XCircle size={16} /> Cette publicité a expiré le {formatDate(ad.endDate, 'long')}
          </div>
        )}

        <div className="rounded-xl overflow-hidden h-56 shadow-sm border border-gray-200 dark:border-gray-700">
          <MediaPreviewBg mediaType={ad.mediaType} mediaUrl={ad.mediaUrl} gradient={ad.gradient} emoji={ad.emoji} />
        </div>

        <div className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border border-gray-200 dark:border-gray-600">
          <p className="text-sm text-gray-800 dark:text-gray-200">{ad.description}</p>
        </div>

        <div className="grid grid-cols-3 gap-4">
          <PerfCard icon={<Eye size={18} />} label="Impressions" value={formatNumber(ad.impressions)} max={ad.maxImpressions} color="blue" />
          <PerfCard icon={<MousePointer size={18} />} label="Clics" value={formatNumber(ad.clicks)} max={ad.maxClicks} color="amber" />
          <PerfCard icon={<Percent size={18} />} label="CTR" value={`${ctr.toFixed(2)}%`} color="green" />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <DetailRow label="CTA" value={ad.ctaText} icon={<Link size={13} />} />
          <DetailRow label="Pages" value={ad.targetPages?.map(p => TARGET_PAGE_OPTIONS.find(o => o.value === p)?.label || p).join(', ')} icon={<Layout size={13} />} />
          <DetailRow label="Début" value={formatDate(ad.startDate, 'long')} icon={<Calendar size={13} />} />
          <DetailRow label="Fin" value={formatDate(ad.endDate, 'long')} icon={<Calendar size={13} />} />
        </div>
      </div>
    </>
  );
}

// ==================== FILE UPLOAD COMPONENT ====================

function FileUploadInput({ accept, value, onChange, label }: {
  accept: string; value: string; onChange: (url: string) => void; label: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const handleChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    // Validate size (10MB max)
    if (file.size > 10 * 1024 * 1024) { toast.error('Fichier trop lourd (max 10 Mo)'); return; }
    try {
      const base64 = await fileToBase64(file);
      onChange(base64);
      toast.success('Fichier chargé');
    } catch { toast.error('Erreur de lecture du fichier'); }
  };

  return (
    <div>
      <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">{label}</label>
      <div className="flex gap-2">
        <button type="button" onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 px-4 py-2.5 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg hover:border-gray-400 dark:hover:border-gray-500 transition-colors text-sm text-gray-600 dark:text-gray-300">
          <Upload size={16} /> Choisir un fichier
        </button>
        {value && (
          <button type="button" aria-label="Supprimer le fichier" onClick={() => onChange('')} className="p-2.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg">
            <Trash2 size={16} />
          </button>
        )}
      </div>
      <input ref={inputRef} type="file" accept={accept} onChange={handleChange} className="hidden" aria-label={label} />
      {value && accept.startsWith('image') && (
        <div className="mt-2 h-24 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700">
          <img src={value} alt="" className="w-full h-full object-cover" />
        </div>
      )}
      {value && accept.startsWith('video') && (
        <div className="mt-2 h-32 rounded-xl overflow-hidden border border-gray-200 dark:border-gray-700 bg-black">
          <video src={value} className="w-full h-full object-contain" controls muted playsInline preload="metadata" />
        </div>
      )}
    </div>
  );
}

// ==================== CREATE CIRCLE MODAL ====================

function CreateCircleModal({ onSubmit, onClose, actionLoading }: {
  onSubmit: (data: Partial<StoryCircle>) => void; onClose: () => void; actionLoading: string | null;
}) {
  const [name, setName] = useState('');
  const [emoji, setEmoji] = useState('');
  const [color1, setColor1] = useState('#8b5cf6');
  const [color2, setColor2] = useState('#ec4899');

  const gradient = `linear-gradient(135deg, ${color1}, ${color2})`;

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2"><PlusCircle size={20} className="text-purple-600" /> Nouveau cercle de stories</DialogTitle>
        <DialogDescription>Créez un nouveau type de stories visible dans l'app mobile</DialogDescription>
      </DialogHeader>
      <div className="space-y-4">
        {/* Preview */}
        <div className="flex items-center justify-center py-4">
          <div className="w-20 h-20 rounded-full flex items-center justify-center text-3xl shadow-xl border-4 border-white dark:border-gray-700" style={{ background: gradient }}>
            {emoji || '?'}
          </div>
        </div>

        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Nom du cercle</label>
          <input type="text" placeholder="Ex: Astuces voyage" value={name} onChange={e => setName(e.target.value)} className={COMPONENTS.input} />
        </div>
        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Emoji</label>
          <input type="text" placeholder="Ex: 💡" value={emoji} maxLength={4} onChange={e => setEmoji(e.target.value)} className={COMPONENTS.input} />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Couleur 1</label>
            <div className="flex items-center gap-2">
              <input type="color" aria-label="Couleur 1" value={color1} onChange={e => setColor1(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
              <input type="text" aria-label="Code couleur 1" value={color1} onChange={e => setColor1(e.target.value)} className={COMPONENTS.input + ' flex-1'} />
            </div>
          </div>
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Couleur 2</label>
            <div className="flex items-center gap-2">
              <input type="color" aria-label="Couleur 2" value={color2} onChange={e => setColor2(e.target.value)} className="w-10 h-10 rounded-lg cursor-pointer border-0" />
              <input type="text" aria-label="Code couleur 2" value={color2} onChange={e => setColor2(e.target.value)} className={COMPONENTS.input + ' flex-1'} />
            </div>
          </div>
        </div>

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className={COMPONENTS.buttonSecondary + ' flex-1 justify-center'}>Annuler</button>
          <button onClick={() => {
            if (!name.trim()) return toast.error('Nom obligatoire');
            if (!emoji.trim()) return toast.error('Emoji obligatoire');
            onSubmit({ name, emoji, gradient, color: 'custom' });
          }} disabled={actionLoading === 'circle'}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg shadow-lg transition-all disabled:opacity-50"
            style={{ background: gradient }}>
            {actionLoading === 'circle' ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />} Créer
          </button>
        </div>
      </div>
    </>
  );
}

// ==================== CREATE/EDIT MODAL ====================

function CreateEditModal({ activeTab, circles, editStory, editAd, isEditMode, actionLoading, onSubmitStory, onSubmitAd, onClose }: {
  activeTab: ActiveTab; circles: StoryCircle[];
  editStory: Story | null; editAd: Advertisement | null;
  isEditMode: boolean; actionLoading: string | null;
  onSubmitStory: (data: Partial<Story>) => void;
  onSubmitAd: (data: Partial<Advertisement>) => void;
  onClose: () => void;
}) {
  const isStory = isEditMode ? !!editStory : activeTab === 'stories';
  const [createType, setCreateType] = useState<'story' | 'ad'>(isStory ? 'story' : 'ad');
  const actualType = isEditMode ? (editStory ? 'story' : 'ad') : createType;

  const [mediaType, setMediaType] = useState<'image' | 'video' | 'gradient'>(editStory?.mediaType || editAd?.mediaType || 'image');
  const [mediaUrl, setMediaUrl] = useState(editStory?.mediaUrl || editAd?.mediaUrl || '');
  const [gradient, setGradient] = useState(editStory?.gradient || editAd?.gradient || 'linear-gradient(135deg, #EF2B2D 0%, #FCD116 50%, #009E49 100%)');
  const [emoji, setEmoji] = useState(editStory?.emoji || editAd?.emoji || '');
  const [title, setTitle] = useState(editStory?.title || editAd?.title || '');
  const [description, setDescription] = useState(editStory?.description || editAd?.description || '');
  const [ctaText, setCtaText] = useState(editStory?.ctaText || editAd?.ctaText || '');
  const [actionType, setActionType] = useState<'internal' | 'external' | 'none'>(editStory?.actionType || editAd?.actionType || 'none');
  const [actionUrl, setActionUrl] = useState(editStory?.actionUrl || editAd?.actionUrl || '');
  const [internalPage, setInternalPage] = useState(editStory?.internalPage || editAd?.internalPage || 'home');

  const [circleId, setCircleId] = useState(editStory?.circleId || circles[0]?.id || '');
  const DURATION_OPTIONS = [
    { value: 24, label: '24 heures' },
    { value: 48, label: '48 heures' },
    { value: 72, label: '3 jours' },
    { value: 168, label: '7 jours' },
    { value: 336, label: '14 jours' },
    { value: 720, label: '30 jours' },
  ];
  const getInitialDuration = () => {
    if (editStory?.expiresAt && editStory?.publishedAt) {
      const diff = Math.round((new Date(editStory.expiresAt).getTime() - new Date(editStory.publishedAt).getTime()) / 3600000);
      const closest = DURATION_OPTIONS.reduce((prev, curr) => Math.abs(curr.value - diff) < Math.abs(prev.value - diff) ? curr : prev);
      return closest.value;
    }
    return 168;
  };
  const [durationHours, setDurationHours] = useState(getInitialDuration());
  const [targetPages, setTargetPages] = useState<string[]>(editAd?.targetPages || ['home']);
  const [targetNewUsers, setTargetNewUsers] = useState(editAd?.targetNewUsers ?? false);
  const [priority, setPriority] = useState(editAd?.priority || 5);
  const getInitialAdDuration = () => {
    if (editAd?.startDate && editAd?.endDate) {
      const diff = Math.round((new Date(editAd.endDate).getTime() - new Date(editAd.startDate).getTime()) / 3600000);
      const closest = AD_DURATION_OPTIONS.reduce((prev, curr) => Math.abs(curr.value - diff) < Math.abs(prev.value - diff) ? curr : prev);
      return closest.value;
    }
    return 336; // default 14 jours
  };
  const [adDurationHours, setAdDurationHours] = useState(getInitialAdDuration());
  const [maxImpressions, setMaxImpressions] = useState(editAd?.maxImpressions ? String(editAd.maxImpressions) : '');
  const [maxClicks, setMaxClicks] = useState(editAd?.maxClicks ? String(editAd.maxClicks) : '');

  const sortedCircles = [...circles].sort((a, b) => a.order - b.order);

  const handleSubmit = () => {
    if (!title.trim()) return toast.error('Le titre est obligatoire');
    if (!description.trim()) return toast.error('La description est obligatoire');
    if (mediaType !== 'gradient' && !mediaUrl) return toast.error('Veuillez charger un fichier média');

    const base = {
      title, description, mediaType,
      emoji: mediaType === 'gradient' ? emoji || undefined : undefined,
      mediaUrl: mediaType !== 'gradient' ? mediaUrl : undefined,
      gradient: mediaType === 'gradient' ? gradient : undefined,
      ctaText: ctaText || undefined, actionType,
      actionUrl: actionType === 'external' ? actionUrl : undefined,
      internalPage: actionType === 'internal' ? internalPage : undefined,
    };

    if (actualType === 'story') {
      if (!circleId) return toast.error('Sélectionnez un cercle');
      const now = new Date();
      const expiresAt = new Date(now.getTime() + durationHours * 3600000).toISOString();
      onSubmitStory({ ...base, circleId, expiresAt });
    } else {
      if (targetPages.length === 0) return toast.error('Sélectionnez au moins une page');
      const now = new Date();
      const startDate = now.toISOString();
      const endDate = new Date(now.getTime() + adDurationHours * 3600000).toISOString();
      onSubmitAd({ ...base, targetPages, targetNewUsers, priority, startDate, endDate, maxImpressions: maxImpressions ? parseInt(maxImpressions) : undefined, maxClicks: maxClicks ? parseInt(maxClicks) : undefined });
    }
  };

  return (
    <>
      <DialogHeader>
        <DialogTitle className="flex items-center gap-2">
          {isEditMode ? <Edit2 size={20} className="text-blue-600" /> : <Plus size={20} className="text-green-600" />}
          {isEditMode ? (editStory ? 'Modifier la story' : 'Modifier la publicité') : (actualType === 'story' ? 'Nouvelle story' : 'Nouvelle publicité')}
        </DialogTitle>
        <DialogDescription>{actualType === 'story' ? 'Contenu pour les cercles de stories' : 'Popup publicitaire dans l\'app'}</DialogDescription>
      </DialogHeader>

      <div className="space-y-5">
        {/* Type selector */}
        {!isEditMode && (
          <div className="grid grid-cols-2 gap-3">
            {[{ key: 'story' as const, icon: Layers, label: 'Story', sub: 'Cercle dans l\'app', color: 'purple' },
              { key: 'ad' as const, icon: Megaphone, label: 'Publicité', sub: 'Modal popup', color: 'red' }].map(t => (
              <button key={t.key} type="button" onClick={() => setCreateType(t.key)}
                className={`p-3 border-2 rounded-xl flex items-center gap-3 transition-all ${createType === t.key ? `border-${t.color}-500 bg-${t.color}-50 dark:bg-${t.color}-900/20` : 'border-gray-200 dark:border-gray-600'}`}>
                <t.icon size={20} className={createType === t.key ? `text-${t.color}-600` : 'text-gray-400'} />
                <div className="text-left">
                  <p className={`text-sm ${createType === t.key ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{t.label}</p>
                  <p className="text-xs text-gray-400">{t.sub}</p>
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Circle selector */}
        {actualType === 'story' && (
          <fieldset>
            <legend className="text-sm text-gray-700 dark:text-gray-300 mb-2">Cercle de destination</legend>
            <div className="flex flex-wrap gap-2">
              {sortedCircles.map(c => (
                <button key={c.id} type="button" onClick={() => setCircleId(c.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm border-2 transition-all ${circleId === c.id ? 'text-white shadow-lg' : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-300'}`}
                  style={circleId === c.id ? { background: c.gradient, borderColor: 'transparent' } : {}}>
                  <span className="text-base">{c.emoji}</span> {c.name}
                </button>
              ))}
            </div>
          </fieldset>
        )}

        {/* Media type */}
        <fieldset>
          <legend className="text-sm text-gray-700 dark:text-gray-300 mb-2">Type de média</legend>
          <div className="grid grid-cols-3 gap-3">
            {(['image', 'video', 'gradient'] as const).map(t => {
              const c = MEDIA_TYPE_CONFIG[t];
              const Icon = c.icon;
              const sel = mediaType === t;
              return (
                <button key={t} type="button" onClick={() => { setMediaType(t); if (t === 'gradient') setMediaUrl(''); }}
                  className={`p-3 border-2 rounded-xl text-center transition-all ${sel ? `${c.bg} ${c.activeBorder}` : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}>
                  <Icon className={`mx-auto ${sel ? c.color : 'text-gray-400'}`} size={22} />
                  <p className={`text-xs mt-1.5 ${sel ? 'text-gray-900 dark:text-white' : 'text-gray-500'}`}>{c.label}</p>
                </button>
              );
            })}
          </div>
        </fieldset>

        {/* Media content */}
        {mediaType === 'image' && <FileUploadInput accept="image/*" value={mediaUrl} onChange={setMediaUrl} label="Image" />}
        {mediaType === 'video' && <FileUploadInput accept="video/*" value={mediaUrl} onChange={setMediaUrl} label="Vidéo" />}
        {mediaType === 'gradient' && (
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Gradient CSS</label>
              <input type="text" aria-label="CSS gradient" value={gradient} onChange={e => setGradient(e.target.value)} className={COMPONENTS.input} />
              {gradient && <div className="mt-2 h-14 rounded-xl flex items-center justify-center text-2xl" style={{ background: gradient }}>{emoji || '✨'}</div>}
            </div>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Emoji</label>
              <input type="text" placeholder="🚌" value={emoji} maxLength={4} onChange={e => setEmoji(e.target.value)} className={COMPONENTS.input} />
            </div>
          </div>
        )}

        {/* Title + Description */}
        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Titre</label>
          <input type="text" placeholder="Ex: Promo Ouaga-Bobo" value={title} onChange={e => setTitle(e.target.value)} className={COMPONENTS.input} />
        </div>
        <div>
          <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Description</label>
          <textarea placeholder="Décrivez le contenu..." value={description} onChange={e => setDescription(e.target.value)} rows={2} className={`${COMPONENTS.input} resize-none`} />
        </div>

        {/* CTA + Action */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Bouton CTA</label>
            <input type="text" placeholder="Voir les offres" value={ctaText} onChange={e => setCtaText(e.target.value)} className={COMPONENTS.input} />
          </div>
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Action au clic</label>
            <select aria-label="Type d'action" value={actionType} onChange={e => setActionType(e.target.value as any)} className={COMPONENTS.input}>
              <option value="none">Aucune</option>
              <option value="internal">Page de l'app</option>
              <option value="external">Lien externe</option>
            </select>
          </div>
        </div>
        {actionType === 'external' && (
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">URL externe</label>
            <input type="url" placeholder="https://..." value={actionUrl} onChange={e => setActionUrl(e.target.value)} className={COMPONENTS.input} />
          </div>
        )}
        {actionType === 'internal' && (
          <div>
            <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Page de destination</label>
            <div className="grid grid-cols-3 gap-2 max-h-48 overflow-y-auto p-1">
              {INTERNAL_PAGE_OPTIONS.map(o => {
                const sel = internalPage === o.value;
                return (
                  <button key={o.value} type="button" onClick={() => setInternalPage(o.value)}
                    className={`p-2 rounded-lg text-left border-2 transition-all ${sel ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-gray-300'}`}>
                    <p className={`text-xs ${sel ? 'text-blue-700 dark:text-blue-300' : 'text-gray-700 dark:text-gray-300'}`}>{o.label}</p>
                    <p className="text-[10px] text-gray-400 mt-0.5">{o.desc}</p>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* Story duration */}
        {actualType === 'story' && (
          <fieldset>
            <legend className="text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
              <Clock size={14} /> Durée d'affichage
            </legend>
            <div className="flex flex-wrap gap-2">
              {DURATION_OPTIONS.map(d => {
                const sel = durationHours === d.value;
                return (
                  <button key={d.value} type="button" onClick={() => setDurationHours(d.value)}
                    className={`px-4 py-2 rounded-lg text-sm transition-all border ${sel ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-400 dark:border-purple-600 text-purple-700 dark:text-purple-300' : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-300'}`}>
                    {d.label}
                  </button>
                );
              })}
            </div>
            <p className="text-xs text-gray-400 mt-2">La story expirera automatiquement après {DURATION_OPTIONS.find(d => d.value === durationHours)?.label || `${durationHours}h`}</p>
          </fieldset>
        )}

        {/* Ad-specific */}
        {actualType === 'ad' && (
          <>
            <div>
              <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Pages cibles</label>
              <div className="flex flex-wrap gap-2">
                {TARGET_PAGE_OPTIONS.map(p => {
                  const sel = targetPages.includes(p.value);
                  return (
                    <button key={p.value} type="button"
                      onClick={() => setTargetPages(sel ? targetPages.filter(v => v !== p.value) : [...targetPages, p.value])}
                      className={`px-4 py-2 rounded-lg text-sm transition-all border ${sel ? 'bg-red-50 dark:bg-red-900/20 border-red-300 dark:border-red-700 text-red-700 dark:text-red-300' : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-300'}`}>
                      {p.label}
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Priorité : <span className="text-gray-900 dark:text-white">{priority}</span>/10</label>
                <input type="range" aria-label="Priorité" min={1} max={10} value={priority} onChange={e => setPriority(parseInt(e.target.value))} className="w-full accent-red-600" />
              </div>
              <div className="flex items-center gap-3 pt-6">
                <button type="button" aria-label="Cibler les nouveaux utilisateurs" onClick={() => setTargetNewUsers(!targetNewUsers)}
                  className={`relative w-12 h-6 rounded-full transition-colors ${targetNewUsers ? 'bg-blue-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                  <span className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${targetNewUsers ? 'translate-x-6' : ''}`} />
                </button>
                <span className="text-sm text-gray-700 dark:text-gray-300">Nouveaux users</span>
              </div>
            </div>
            <fieldset>
              <legend className="text-sm text-gray-700 dark:text-gray-300 mb-2 flex items-center gap-2">
                <Clock size={14} /> Durée de la campagne
              </legend>
              <div className="flex flex-wrap gap-2">
                {AD_DURATION_OPTIONS.map(d => {
                  const sel = adDurationHours === d.value;
                  return (
                    <button key={d.value} type="button" onClick={() => setAdDurationHours(d.value)}
                      className={`px-4 py-2 rounded-lg text-sm transition-all border ${sel ? 'bg-red-50 dark:bg-red-900/20 border-red-400 dark:border-red-600 text-red-700 dark:text-red-300' : 'border-gray-200 dark:border-gray-600 text-gray-500 hover:border-gray-300'}`}>
                      {d.label}
                    </button>
                  );
                })}
              </div>
              <p className="text-xs text-gray-400 mt-2">La publicité expirera automatiquement après {AD_DURATION_OPTIONS.find(d => d.value === adDurationHours)?.label || `${adDurationHours}h`}</p>
            </fieldset>
            <div className="grid grid-cols-2 gap-4">
              <div><label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Max impressions</label><input type="number" placeholder="Illimité" value={maxImpressions} onChange={e => setMaxImpressions(e.target.value)} className={COMPONENTS.input} /></div>
              <div><label className="text-sm text-gray-700 dark:text-gray-300 mb-2 block">Max clics</label><input type="number" placeholder="Illimité" value={maxClicks} onChange={e => setMaxClicks(e.target.value)} className={COMPONENTS.input} /></div>
            </div>
          </>
        )}

        {/* Submit */}
        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className={COMPONENTS.buttonSecondary + ' flex-1 justify-center'}>Annuler</button>
          <button onClick={handleSubmit} disabled={actionLoading === 'submit'}
            className="flex-1 flex items-center justify-center gap-2 px-6 py-3 text-white rounded-lg shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            style={{ background: actualType === 'story' ? 'linear-gradient(to right, #8b5cf6, #ec4899)' : 'linear-gradient(to right, #dc2626, #f59e0b, #16a34a)' }}>
            {actionLoading === 'submit' ? <Loader2 size={18} className="animate-spin" /> : isEditMode ? <Edit2 size={18} /> : <Plus size={18} />}
            {isEditMode ? 'Mettre à jour' : 'Créer'}
          </button>
        </div>
      </div>
    </>
  );
}

// ==================== SHARED SUB-COMPONENTS ====================

function PriorityBadge({ priority }: { priority: number }) {
  const color = priority >= 8 ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800'
    : priority >= 5 ? 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800'
    : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-600';
  return <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs border ${color}`}><Star size={10} className="fill-current" />{priority}/10</span>;
}

function MediaPreviewBg({ mediaType, mediaUrl, gradient, emoji }: { mediaType: string; mediaUrl?: string; gradient?: string; emoji?: string }) {
  if (mediaType === 'gradient') return <div className="w-full h-full flex items-center justify-center text-5xl" style={{ background: gradient || 'linear-gradient(135deg, #ccc, #999)' }}>{emoji || '✨'}</div>;
  if (mediaUrl && mediaType === 'image') return <img src={mediaUrl} alt="" className="w-full h-full object-cover" />;
  if (mediaType === 'video' && mediaUrl) return (
    <div className="w-full h-full relative bg-black">
      <video src={mediaUrl} className="w-full h-full object-contain" controls muted playsInline preload="metadata" />
    </div>
  );
  if (mediaType === 'video') return <div className="w-full h-full bg-purple-50 dark:bg-purple-900/20 flex flex-col items-center justify-center gap-2"><Play size={32} className="text-purple-500" /><span className="text-xs text-purple-500">Aucune vidéo</span></div>;
  return <div className="w-full h-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center"><ImageIcon size={24} className="text-gray-400" /></div>;
}

function MediaPreviewSmall({ mediaType, mediaUrl, gradient, emoji }: { mediaType: string; mediaUrl?: string; gradient?: string; emoji?: string }) {
  if (mediaType === 'gradient') return <div className="w-11 h-11 rounded-xl flex items-center justify-center text-lg flex-shrink-0 shadow-sm" style={{ background: gradient || 'linear-gradient(135deg, #ccc, #999)' }}>{emoji || '✨'}</div>;
  if (mediaUrl && mediaType === 'image') return <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 shadow-sm"><img src={mediaUrl} alt="" className="w-full h-full object-cover" /></div>;
  if (mediaType === 'video' && mediaUrl) return (
    <div className="w-11 h-11 rounded-xl overflow-hidden flex-shrink-0 shadow-sm bg-black">
      <video src={mediaUrl} className="w-full h-full object-cover" muted preload="metadata" />
    </div>
  );
  if (mediaType === 'video') return <div className="w-11 h-11 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0 shadow-sm"><Play size={16} className="text-purple-500" /></div>;
  return <div className="w-11 h-11 rounded-xl bg-gray-100 dark:bg-gray-700 flex items-center justify-center flex-shrink-0"><ImageIcon size={16} className="text-gray-400" /></div>;
}

function PerfCard({ icon, label, value, max, color }: { icon: React.ReactNode; label: string; value: string; max?: number; color: 'blue' | 'amber' | 'green' }) {
  const cls = {
    blue: 'bg-blue-100 dark:bg-blue-900/40 border-blue-300 dark:border-blue-700 text-blue-800 dark:text-blue-200',
    amber: 'bg-amber-100 dark:bg-amber-900/40 border-amber-300 dark:border-amber-700 text-amber-800 dark:text-amber-200',
    green: 'bg-green-100 dark:bg-green-900/40 border-green-300 dark:border-green-700 text-green-800 dark:text-green-200',
  };
  return (
    <div className={`rounded-xl border p-4 text-center ${cls[color]}`}>
      <div className="flex justify-center mb-2">{icon}</div>
      <p className="text-xl">{value}</p>
      <p className="text-xs mt-1">{label}</p>
      {max != null && <p className="text-xs opacity-70 mt-1">max: {formatNumber(max)}</p>}
    </div>
  );
}

function DetailRow({ label, value, icon }: { label: string; value?: string | number; icon?: React.ReactNode }) {
  if (value == null || value === '') return null;
  return (
    <div>
      <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mb-0.5">{icon}{label}</div>
      <span className="text-sm text-gray-900 dark:text-white break-all">{String(value)}</span>
    </div>
  );
}

export default AdvertisingManagement;
