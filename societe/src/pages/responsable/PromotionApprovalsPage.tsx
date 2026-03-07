import { useState, useMemo } from 'react';
import { CheckCircle2, XCircle, AlertCircle } from "lucide-react";
import { Card } from '../../components/ui/card';
import { Button } from '../../components/ui/button';
import { BackButton } from '../../components/ui/back-button';
import { Badge } from '../../components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog';
import { useData } from '../../contexts/DataContext';
import { useAuth } from '../../contexts/AuthContext';
import { toast } from 'sonner';
import { createLogger } from '../../utils/logger';

const logger = createLogger('PromotionApprovalsPage', 'general');

export default function PromotionApprovalsPage() {
  const { promotions, approvePromotion, rejectPromotion } = useData();
  const { user } = useAuth();
  
  const [isRejectDialogOpen, setIsRejectDialogOpen] = useState(false);
  const [selectedPromoId, setSelectedPromoId] = useState<string | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');

  // ✅ Filtrer les promotions en attente d'approbation
  const pendingPromotions = useMemo(() => {
    return promotions.filter(p => p.approval_status === 'pending_validation');
  }, [promotions]);

  // ✅ Filtrer les promotions approuvées
  const approvedPromotions = useMemo(() => {
    return promotions.filter(p => p.approval_status === 'active_approved');
  }, [promotions]);

  // ✅ Filtrer les promotions rejetées
  const rejectedPromotions = useMemo(() => {
    return promotions.filter(p => p.approval_status === 'rejected');
  }, [promotions]);

  const handleApprove = (promoId: string) => {
    if (!user) return;
    
    try {
      approvePromotion(promoId, user.id);
      logger.info('✅ Promotion approuvée', { id: promoId, adminId: user.id });
      toast.success('Promotion approuvée');
    } catch (error) {
      logger.error('❌ Erreur lors de l\'approbation', error);
      toast.error('Erreur lors de l\'approbation');
    }
  };

  const handleRejectClick = (promoId: string) => {
    setSelectedPromoId(promoId);
    setRejectionReason('');
    setIsRejectDialogOpen(true);
  };

  const handleConfirmReject = () => {
    if (!user || !selectedPromoId) return;

    if (!rejectionReason.trim()) {
      toast.error('Veuillez saisir une raison de rejet');
      return;
    }

    try {
      rejectPromotion(selectedPromoId, rejectionReason, user.id);
      logger.info('❌ Promotion rejetée', { id: selectedPromoId, adminId: user.id });
      toast.success('Promotion rejetée');
      setIsRejectDialogOpen(false);
      setSelectedPromoId(null);
      setRejectionReason('');
    } catch (error) {
      logger.error('❌ Erreur lors du rejet', error);
      toast.error('Erreur lors du rejet');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="max-w-6xl mx-auto">
        {/* ✅ Back + Title */}
        <div className="flex items-center gap-4 mb-8">
          <BackButton />
          <h1 className="text-3xl font-bold text-gray-800 dark:text-white">Approbation des Promotions</h1>
        </div>

        {/* ✅ Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <Card className="p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">En attente</p>
                <p className="text-3xl font-bold text-orange-600 dark:text-orange-400">{pendingPromotions.length}</p>
              </div>
              <AlertCircle className="w-8 h-8 text-orange-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Approuvées</p>
                <p className="text-3xl font-bold text-green-600 dark:text-green-400">{approvedPromotions.length}</p>
              </div>
              <CheckCircle2 className="w-8 h-8 text-green-500 opacity-20" />
            </div>
          </Card>

          <Card className="p-4 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">Rejetées</p>
                <p className="text-3xl font-bold text-red-600 dark:text-red-400">{rejectedPromotions.length}</p>
              </div>
              <XCircle className="w-8 h-8 text-red-500 opacity-20" />
            </div>
          </Card>
        </div>

        {/* ✅ EN ATTENTE D'APPROBATION */}
        {pendingPromotions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">⏳ En attente d'approbation</h2>
            <div className="space-y-3">
              {pendingPromotions.map(promo => (
                <Card key={promo.promotion_id} className="p-4 bg-white dark:bg-gray-800 border border-orange-300 dark:border-orange-700/30 hover:shadow-md transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800 dark:text-white">{promo.title}</h3>
                        <Badge variant="outline" className="bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 border-orange-200 dark:border-orange-700">
                          Attente approbation
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">{promo.description}</p>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm mb-4">
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Réduction:</span> <br />
                          <span className="font-semibold text-blue-600 dark:text-blue-400">
                            {promo.discount_type === 'PERCENTAGE' ? `${promo.discount_value}%` : `${promo.discount_value.toLocaleString('fr-FR')} FCFA`}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Début:</span> <br />
                          <span className="font-semibold text-gray-800 dark:text-white">
                            {new Date(promo.start_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Fin:</span> <br />
                          <span className="font-semibold text-gray-800 dark:text-white">
                            {new Date(promo.end_date).toLocaleDateString('fr-FR')}
                          </span>
                        </div>
                        <div>
                          <span className="text-gray-600 dark:text-gray-400">Créée par:</span> <br />
                          <span className="font-semibold text-gray-800 dark:text-white text-xs">
                            {promo.created_by || 'Inconnu'}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2 ml-4">
                      <Button
                        size="sm"
                        onClick={() => handleApprove(promo.promotion_id)}
                        className="gap-1 bg-green-600 hover:bg-green-700 text-white"
                      >
                        <CheckCircle2 className="w-4 h-4" />
                        Approuver
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleRejectClick(promo.promotion_id)}
                        className="gap-1 text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-700 dark:hover:bg-red-900/20"
                      >
                        <XCircle className="w-4 h-4" />
                        Rejeter
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {pendingPromotions.length === 0 && (
          <Card className="p-8 text-center bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-700 mb-8">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3 opacity-50" />
            <p className="text-gray-600 dark:text-gray-400">Aucune promotion en attente d'approbation</p>
          </Card>
        )}

        {/* ✅ APPROUVÉES */}
        {approvedPromotions.length > 0 && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">✅ Promotions approuvées</h2>
            <div className="space-y-3">
              {approvedPromotions.map(promo => (
                <Card key={promo.promotion_id} className="p-4 bg-white dark:bg-gray-800 border border-green-300 dark:border-green-700/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800 dark:text-white">{promo.title}</h3>
                        <Badge className="bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300 border-green-200 dark:border-green-700">
                          ✓ Approuvée
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{promo.description}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Approuvée par {promo.approved_by} le {promo.approved_at ? new Date(promo.approved_at).toLocaleDateString('fr-FR') : ''}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* ✅ REJETÉES */}
        {rejectedPromotions.length > 0 && (
          <div>
            <h2 className="text-lg font-semibold text-gray-800 dark:text-white mb-4">✕ Promotions rejetées</h2>
            <div className="space-y-3">
              {rejectedPromotions.map(promo => (
                <Card key={promo.promotion_id} className="p-4 bg-white dark:bg-gray-800 border border-red-300 dark:border-red-700/30">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-gray-800 dark:text-white">{promo.title}</h3>
                        <Badge variant="destructive" className="bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-700">
                          ✕ Rejetée
                        </Badge>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">{promo.description}</p>
                      <p className="text-sm text-red-600 dark:text-red-400 mb-1">
                        <span className="font-semibold">Raison:</span> {promo.rejection_reason}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-500">
                        Rejetée par {promo.approved_by} le {promo.approved_at ? new Date(promo.approved_at).toLocaleDateString('fr-FR') : ''}
                      </p>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ✅ Dialog Rejet */}
      <Dialog open={isRejectDialogOpen} onOpenChange={setIsRejectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Rejeter la promotion</DialogTitle>
            <DialogDescription>
              Veuillez expliquer pourquoi cette promotion est rejetée
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <textarea
              placeholder="Raison du rejet (par exemple: données incorrectes, image de mauvaise qualité, conditions non conformes, etc.)"
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder:text-gray-500 dark:placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-red-500"
              rows={4}
            />
          </div>

          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsRejectDialogOpen(false)}
            >
              Annuler
            </Button>
            <Button
              onClick={handleConfirmReject}
              className="bg-red-600 hover:bg-red-700"
            >
              Rejeter
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
