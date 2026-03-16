/**
 * ReviewManagement - Consultation des avis passagers sur les sociétés de transport
 * 
 * LOGIQUE MÉTIER:
 * - Un passager ne peut émettre un avis qu'APRÈS avoir terminé son voyage
 * - L'avis porte sur la SOCIÉTÉ DE TRANSPORT (pas la plateforme FasoTravel)
 * - Pas de workflow d'approbation — données collectées telles quelles
 * - L'admin consulte, filtre et analyse les avis pour prendre des décisions
 * 
 * BACKEND-READY: Utilise useReviews() hook → reviewsService → apiService
 */

import { useState, useMemo } from 'react';
import { Star, Search, Eye, Building2, MapPin, Calendar, ThumbsUp, X, Trash2, Clock } from 'lucide-react';
import { Review } from '../../shared/types/standardized';
import { PAGE_CLASSES } from '../../lib/design-system';
import { StatCard } from '../ui/stat-card';
import { useReviews, useReviewActions } from '../../hooks/useEntities';
import { toast } from 'sonner@2.0.3';

export function ReviewManagement() {
  // ── Backend-ready hooks ──
  const { data: reviews, refresh } = useReviews();
  const reviewActions = useReviewActions();

  // ── État local UI ──
  const [searchTerm, setSearchTerm] = useState('');
  const [ratingFilter, setRatingFilter] = useState<'all' | '1' | '2' | '3' | '4' | '5'>('all');
  const [companyFilter, setCompanyFilter] = useState<string>('all');
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null);

  // ── Données dérivées ──

  // Liste unique des sociétés (pour filtre dropdown)
  const companies = useMemo(() => {
    const map = new Map<string, string>();
    reviews.forEach(r => {
      if (r.companyId && r.companyName) map.set(r.companyId, r.companyName);
    });
    return Array.from(map, ([id, name]) => ({ id, name }));
  }, [reviews]);

  // Tri par date décroissante
  const sortedReviews = useMemo(() =>
    [...reviews].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
  [reviews]);

  // Filtrage
  const filteredReviews = useMemo(() => sortedReviews.filter(review => {
    const term = searchTerm.toLowerCase();
    const matchesSearch = !term ||
      review.passengerName?.toLowerCase().includes(term) ||
      review.companyName?.toLowerCase().includes(term) ||
      review.routeName?.toLowerCase().includes(term) ||
      review.comment?.toLowerCase().includes(term);

    const matchesRating = ratingFilter === 'all' || review.rating === parseInt(ratingFilter);
    const matchesCompany = companyFilter === 'all' || review.companyId === companyFilter;

    return matchesSearch && matchesRating && matchesCompany;
  }), [sortedReviews, searchTerm, ratingFilter, companyFilter]);

  // Stats par société
  const companyStats = useMemo(() => {
    const stats = new Map<string, { name: string; count: number; sum: number }>();
    reviews.forEach(r => {
      if (!r.companyId) return;
      const s = stats.get(r.companyId) || { name: r.companyName || '', count: 0, sum: 0 };
      s.count++;
      s.sum += r.rating;
      stats.set(r.companyId, s);
    });
    return Array.from(stats, ([id, s]) => ({
      id, name: s.name, count: s.count, avg: s.count > 0 ? s.sum / s.count : 0,
    })).sort((a, b) => b.avg - a.avg);
  }, [reviews]);

  // Stats globales
  const globalAvg = reviews.length > 0
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length)
    : 0;

  // ── Handlers ──

  const handleDelete = async () => {
    if (!deleteTarget) return;
    await reviewActions.remove(deleteTarget.id);
    await refresh();
    toast.success('Avis supprimé');
    setShowDeleteConfirm(false);
    setDeleteTarget(null);
  };

  // ── Helpers UI ──

  const renderStars = (rating: number, size = 'h-4 w-4') => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <Star
          key={star}
          className={`${size} ${star <= rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300 dark:text-gray-600'}`}
        />
      ))}
    </div>
  );

  const formatDate = (dateStr: string | undefined) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleDateString('fr-BF', {
      day: 'numeric', month: 'short', year: 'numeric',
    });
  };

  const getRatingColor = (rating: number) => {
    if (rating >= 4) return 'text-green-600 dark:text-green-400';
    if (rating >= 3) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  return (
    <div className={PAGE_CLASSES.container}>
      {/* Header */}
      <div className={PAGE_CLASSES.header}>
        <div className={PAGE_CLASSES.headerContent}>
          <div className={PAGE_CLASSES.headerTexts}>
            <h1 className="text-3xl text-gray-900 dark:text-white mb-2">Avis des Passagers</h1>
            <p className="text-gray-600 dark:text-gray-400">
              Avis sur les sociétés de transport — émis après chaque voyage terminé
            </p>
          </div>
        </div>
      </div>

      {/* Stats globales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <StatCard
          title="Total Avis"
          value={reviews.length}
          icon={Star}
          color="red"
          subtitle={`${companies.length} société${companies.length > 1 ? 's' : ''} évaluée${companies.length > 1 ? 's' : ''}`}
        />
        <StatCard
          title="Note Moyenne Globale"
          value={`${globalAvg.toFixed(1)}/5`}
          icon={Star}
          color="yellow"
        >
          {renderStars(Math.round(globalAvg))}
        </StatCard>
        <StatCard
          title="Avis Négatifs (≤2)"
          value={reviews.filter(r => r.rating <= 2).length}
          icon={Star}
          color="red"
          subtitle="À suivre pour la qualité de service"
        />
      </div>

      {/* Notes par société */}
      {companyStats.length > 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 mb-6 transition-colors">
          <h3 className="text-sm text-gray-600 dark:text-gray-400 mb-4 uppercase tracking-wide">Notes par Société</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {companyStats.map(cs => (
              <button
                key={cs.id}
                type="button"
                className={`flex items-center gap-4 p-4 rounded-xl transition-colors text-left w-full ${
                  companyFilter === cs.id
                    ? 'bg-red-50 dark:bg-red-900/20 ring-2 ring-red-500'
                    : 'bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700'
                }`}
                onClick={() => setCompanyFilter(companyFilter === cs.id ? 'all' : cs.id)}
              >
                <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gradient-to-br from-red-500 to-red-600 text-white shadow-md shrink-0">
                  <Building2 className="h-5 w-5" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm text-gray-900 dark:text-white truncate">{cs.name}</div>
                  <div className="flex items-center gap-2 mt-1">
                    {renderStars(Math.round(cs.avg), 'h-3 w-3')}
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                      {cs.avg.toFixed(1)} ({cs.count} avis)
                    </span>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Filtres */}
      <div className={PAGE_CLASSES.searchSection}>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                placeholder="Rechercher par passager, société, trajet, commentaire..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dc2626] bg-white dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 transition-colors"
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <select
              aria-label="Filtrer par société"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dc2626] bg-white dark:bg-gray-700 dark:text-white transition-colors"
            >
              <option value="all">Toutes sociétés</option>
              {companies.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>

            <select
              aria-label="Filtrer par note"
              value={ratingFilter}
              onChange={(e) => setRatingFilter(e.target.value as any)}
              className="px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#dc2626] bg-white dark:bg-gray-700 dark:text-white transition-colors"
            >
              <option value="all">Toutes notes</option>
              <option value="5">5 étoiles</option>
              <option value="4">4 étoiles</option>
              <option value="3">3 étoiles</option>
              <option value="2">2 étoiles</option>
              <option value="1">1 étoile</option>
            </select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className={PAGE_CLASSES.tableContainer}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Passager</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Société</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Trajet</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Note</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Commentaire</th>
                <th className="px-6 py-3 text-left text-xs text-gray-600 dark:text-gray-400 uppercase">Date voyage</th>
                <th className="px-6 py-3 text-right text-xs text-gray-600 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {filteredReviews.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-8 text-center text-gray-600 dark:text-gray-400">
                    Aucun avis trouvé
                  </td>
                </tr>
              ) : (
                filteredReviews.map(review => (
                  <tr key={review.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900 dark:text-white">
                        {review.passengerName || 'Anonyme'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <Building2 className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-900 dark:text-white">
                          {review.companyName || '—'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-gray-400 shrink-0" />
                        <span className="text-sm text-gray-700 dark:text-gray-300">
                          {review.routeName || '—'}
                        </span>
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className={`text-sm ${getRatingColor(review.rating)}`}>{review.rating}</span>
                        {renderStars(review.rating)}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2 max-w-xs">
                        {review.comment || 'Pas de commentaire'}
                      </div>
                    </td>

                    <td className="px-6 py-4">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {formatDate(review.tripDate)}
                      </span>
                    </td>

                    <td className="px-6 py-4 text-right">
                      <div className="flex justify-end gap-1">
                        <button
                          className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Voir les détails"
                          onClick={() => {
                            setSelectedReview(review);
                            setShowDetailDialog(true);
                          }}
                        >
                          <Eye className="h-4 w-4" />
                        </button>
                        <button
                          className="p-2 text-red-500 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition-colors"
                          title="Supprimer"
                          onClick={() => {
                            setDeleteTarget(review);
                            setShowDeleteConfirm(true);
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {filteredReviews.length > 0 && (
          <div className="px-6 py-4 border-t border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-400">
            Affichage de {filteredReviews.length} sur {reviews.length} avis
          </div>
        )}
      </div>

      {/* ── Modale Détail (Eye button) ── */}
      {showDetailDialog && selectedReview && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto transition-colors">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
              <h2 className="text-xl text-gray-900 dark:text-white">Détails de l'avis</h2>
              <button
                aria-label="Fermer"
                onClick={() => setShowDetailDialog(false)}
                className="p-2 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-6 space-y-5">
              {/* Contexte du voyage */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4 space-y-3">
                <h3 className="text-sm text-gray-500 dark:text-gray-400 uppercase tracking-wide">Contexte du voyage</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Building2 className="h-5 w-5 text-red-500 shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Société</div>
                      <div className="text-sm text-gray-900 dark:text-white">{selectedReview.companyName || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-red-500 shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Trajet</div>
                      <div className="text-sm text-gray-900 dark:text-white">{selectedReview.routeName || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-red-500 shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Date du voyage</div>
                      <div className="text-sm text-gray-900 dark:text-white">{formatDate(selectedReview.tripDate)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Clock className="h-5 w-5 text-red-500 shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Heure du voyage</div>
                      <div className="text-sm text-gray-900 dark:text-white">{selectedReview.tripTime || '—'}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <ThumbsUp className="h-5 w-5 text-red-500 shrink-0" />
                    <div>
                      <div className="text-xs text-gray-500 dark:text-gray-400">Trouvé utile par</div>
                      <div className="text-sm text-gray-900 dark:text-white">{selectedReview.helpfulCount} personne{selectedReview.helpfulCount !== 1 ? 's' : ''}</div>
                    </div>
                  </div>
                </div>
                <div className="text-xs text-gray-400 dark:text-gray-500 font-mono pt-1">
                  Voyage : {selectedReview.tripId} · Passager : {selectedReview.passengerId}
                </div>
              </div>

              {/* Passager + Note */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Passager</label>
                  <div className="text-sm text-gray-900 dark:text-white">{selectedReview.passengerName || 'Anonyme'}</div>
                </div>
                <div>
                  <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Note</label>
                  <div className="flex items-center gap-2">
                    <span className={`text-2xl ${getRatingColor(selectedReview.rating)}`}>{selectedReview.rating}</span>
                    {renderStars(selectedReview.rating)}
                  </div>
                </div>
              </div>

              {/* Commentaire */}
              <div>
                <label className="block text-sm text-gray-600 dark:text-gray-400 mb-1">Commentaire</label>
                <div className="text-sm text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                  {selectedReview.comment || 'Pas de commentaire'}
                </div>
              </div>

              {/* Timestamps */}
              <div className="text-xs text-gray-500 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-700">
                Avis émis le {new Date(selectedReview.createdAt).toLocaleString('fr-BF')}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Modale Confirmation Suppression ── */}
      {showDeleteConfirm && deleteTarget && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full transition-colors">
            <div className="p-6 border-b border-gray-200 dark:border-gray-700 flex items-center gap-3">
              <div className="p-2 rounded-lg bg-red-100 dark:bg-red-900/30">
                <Trash2 className="h-5 w-5 text-red-600 dark:text-red-400" />
              </div>
              <h2 className="text-lg text-gray-900 dark:text-white">Supprimer cet avis ?</h2>
            </div>

            <div className="p-6 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                <div className="text-sm text-gray-900 dark:text-white mb-1">
                  Avis de <span className="font-medium">{deleteTarget.passengerName}</span> sur <span className="font-medium">{deleteTarget.companyName}</span>
                </div>
                <div className="flex items-center gap-2">
                  {renderStars(deleteTarget.rating, 'h-3 w-3')}
                  <span className="text-xs text-gray-500 dark:text-gray-400">— {deleteTarget.routeName}</span>
                </div>
              </div>

              <p className="text-sm text-gray-600 dark:text-gray-400">
                Cette action est irréversible. L'avis sera définitivement supprimé.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => { setShowDeleteConfirm(false); setDeleteTarget(null); }}
                  className="flex-1 px-4 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleDelete}
                  disabled={reviewActions.loading}
                  className="flex-1 px-4 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {reviewActions.loading && <span className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ReviewManagement;