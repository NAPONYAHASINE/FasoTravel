/**
 * ReferralPage - Système de parrainage
 * 
 * Tabs:
 * 1. Mon Code - Code + partage WhatsApp/natif
 * 2. Mes Points - Balance, filleuls, badges
 * 3. Mes Coupons - Conversion points → coupons, liste
 * 
 * DEV NOTES:
 * - Endpoint: GET /referrals/me, POST /referrals/convert, GET /referrals/coupons
 * - Points: 10 par filleul
 * - Coupons: 100pts → 500 FCFA, 200pts → 1000 FCFA
 * - Badges: Standard (<100), Ambassadeur (100+), Super Ambassadeur (250+), Légende (500+)
 */

import type { Page } from '../App';
import { useState, useEffect } from 'react';
import {
  ArrowLeft,
  Copy,
  Share2,
  Gift,
  Users,
  Award,
  Ticket,
  CheckCircle,
  Clock,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion, AnimatePresence } from 'motion/react';
import { feedback } from '../lib/interactions';
import { referralService } from '../services/api/referral.service';
import type { ReferralInfo, ReferralCoupon, ReferralBadgeLevel } from '../shared/types/common';
import { REFERRAL_BADGE_THRESHOLDS, REFERRAL_COUPON_TIERS, POINTS_PER_REFERRAL } from '../shared/types/common';

interface ReferralPageProps {
  onNavigate: (page: Page, data?: any) => void;
  onBack: () => void;
}

type ReferralTab = 'code' | 'points' | 'coupons';

const BADGE_CONFIG: Record<ReferralBadgeLevel, { label: string; color: string; emoji: string }> = {
  standard: { label: 'Standard', color: 'bg-gray-500', emoji: '🌱' },
  ambassadeur: { label: 'Ambassadeur', color: 'bg-blue-500', emoji: '⭐' },
  super_ambassadeur: { label: 'Super Ambassadeur', color: 'bg-purple-500', emoji: '🏆' },
  legende: { label: 'Légende', color: 'bg-amber-500', emoji: '👑' },
};

export function ReferralPage({ onNavigate, onBack }: ReferralPageProps) {
  const [activeTab, setActiveTab] = useState<ReferralTab>('code');
  const [info, setInfo] = useState<ReferralInfo | null>(null);
  const [coupons, setCoupons] = useState<ReferralCoupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [converting, setConverting] = useState<number | null>(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [referralInfo, myCoupons] = await Promise.all([
        referralService.getMyReferralInfo(),
        referralService.getMyCoupons(),
      ]);
      setInfo(referralInfo);
      setCoupons(myCoupons);
    } catch (err) {
      console.error('Failed to load referral data', err);
    } finally {
      setLoading(false);
    }
  };

  const handleCopyCode = async () => {
    if (!info) return;
    try {
      await navigator.clipboard.writeText(info.referralCode);
      setCopied(true);
      feedback.success();
      setTimeout(() => setCopied(false), 2000);
    } catch {
      feedback.error();
    }
  };

  const handleShare = async () => {
    if (!info) return;
    const message = referralService.getShareMessage(info.referralCode);
    
    if (navigator.share) {
      try {
        await navigator.share({ text: message });
        feedback.success();
      } catch {
        // User cancelled share
      }
    } else {
      // Fallback: open WhatsApp
      const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
      window.open(whatsappUrl, '_blank');
      feedback.tap();
    }
  };

  const handleConvertPoints = async (pointsCost: number) => {
    if (!info || info.pointsBalance < pointsCost) return;
    setConverting(pointsCost);
    try {
      await referralService.convertPointsToCoupon(pointsCost);
      // Refresh both info (updated balance) and coupons list
      const [updated, updatedCoupons] = await Promise.all([
        referralService.getMyReferralInfo(),
        referralService.getMyCoupons(),
      ]);
      setInfo(updated);
      setCoupons(updatedCoupons);
      feedback.success();
    } catch (err) {
      feedback.error();
    } finally {
      setConverting(null);
    }
  };

  const nextBadge = (current: ReferralBadgeLevel): { level: ReferralBadgeLevel; threshold: number } | null => {
    const levels: ReferralBadgeLevel[] = ['standard', 'ambassadeur', 'super_ambassadeur', 'legende'];
    const idx = levels.indexOf(current);
    if (idx >= levels.length - 1) return null;
    const next = levels[idx + 1];
    return { level: next, threshold: REFERRAL_BADGE_THRESHOLDS[next] };
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-b-2 border-green-600" />
      </div>
    );
  }

  if (!info) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <p className="text-gray-500">Impossible de charger les données de parrainage.</p>
      </div>
    );
  }

  const badge = BADGE_CONFIG[info.badgeLevel];
  const next = nextBadge(info.badgeLevel);
  const progress = next ? (info.totalReferrals / next.threshold) * 100 : 100;

  const tabs: { key: ReferralTab; label: string; icon: any }[] = [
    { key: 'code', label: 'Mon Code', icon: Share2 },
    { key: 'points', label: 'Mes Points', icon: Award },
    { key: 'coupons', label: 'Coupons', icon: Ticket },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24">
      {/* Sticky Header + Tabs */}
      <div className="sticky top-0 z-20">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-600 to-green-700 text-white px-4 pt-12 pb-6">
          <div className="flex items-center gap-3 mb-4">
            <button onClick={onBack} className="p-2 -ml-2 rounded-full hover:bg-white/10" title="Retour">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-bold">Parrainage</h1>
          </div>

          {/* Badge & Stats Summary */}
          <div className="flex items-center gap-4">
            <div className={`w-14 h-14 rounded-full ${badge.color} flex items-center justify-center text-2xl`}>
              {badge.emoji}
            </div>
            <div className="flex-1">
              <p className="font-semibold text-lg">{badge.label}</p>
              <div className="flex gap-4 text-sm text-white/80 mt-1">
                <span>{info.totalReferrals} filleul{info.totalReferrals > 1 ? 's' : ''}</span>
                <span>•</span>
                <span>{info.pointsBalance} pts</span>
              </div>
            </div>
          </div>

          {/* Progress to next badge */}
          {next && (
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/70 mb-1">
                <span>{badge.label}</span>
                <span>{BADGE_CONFIG[next.level].label} ({next.threshold})</span>
              </div>
              <div className="h-2 bg-white/20 rounded-full overflow-hidden">
                <div
                  className="h-full bg-white rounded-full transition-all"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
              <p className="text-xs text-white/60 mt-1">
                Encore {next.threshold - info.totalReferrals} parrainage{next.threshold - info.totalReferrals > 1 ? 's' : ''} pour le prochain niveau
              </p>
            </div>
          )}
        </div>

        {/* Tabs */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex">
          {tabs.map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.key;
            return (
              <button
                key={tab.key}
                onClick={() => { setActiveTab(tab.key); feedback.tap(); }}
                className={`flex-1 flex items-center justify-center gap-2 py-3 text-sm font-medium transition-colors
                  ${isActive
                    ? 'text-green-600 border-b-2 border-green-600'
                    : 'text-gray-500 dark:text-gray-400'
                  }`}
              >
              <Icon className="w-4 h-4" />
              {tab.label}
            </button>
          );
        })}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 py-4">
        <AnimatePresence mode="wait">
          {activeTab === 'code' && (
            <motion.div
              key="code"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Referral Code Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-2">Ton code de parrainage</p>
                <div className="flex items-center justify-center gap-3 mb-4">
                  <span className="text-3xl font-bold tracking-widest text-gray-900 dark:text-white">
                    {info.referralCode}
                  </span>
                  <button
                    onClick={handleCopyCode}
                    className="p-2 rounded-lg bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
                  >
                    {copied ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <Copy className="w-5 h-5 text-gray-500" />
                    )}
                  </button>
                </div>
                <p className="text-xs text-gray-400">{POINTS_PER_REFERRAL} points gagnés par filleul inscrit</p>
              </div>

              {/* Share Buttons */}
              <div className="space-y-3">
                <Button
                  onClick={handleShare}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-6 rounded-xl flex items-center justify-center gap-3 text-base"
                >
                  <Share2 className="w-5 h-5" />
                  Partager via WhatsApp
                </Button>

                <Button
                  onClick={handleShare}
                  variant="outline"
                  className="w-full py-6 rounded-xl flex items-center justify-center gap-3 text-base border-gray-300 dark:border-gray-600"
                >
                  <Gift className="w-5 h-5" />
                  Partager le lien
                </Button>
              </div>

              {/* How It Works */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Comment ça marche ?</h3>
                <div className="space-y-3">
                  {[
                    { step: '1', text: 'Partage ton code avec tes proches' },
                    { step: '2', text: `Ils s'inscrivent avec ton code` },
                    { step: '3', text: `Tu gagnes ${POINTS_PER_REFERRAL} points par inscription` },
                    { step: '4', text: 'Convertis tes points en coupons de réduction' },
                  ].map(item => (
                    <div key={item.step} className="flex items-start gap-3">
                      <div className="w-7 h-7 rounded-full bg-green-100 dark:bg-green-900/30 text-green-600 flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {item.step}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300 pt-0.5">{item.text}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'points' && (
            <motion.div
              key="points"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Points Balance */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 text-center shadow-sm">
                <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">Tes points disponibles</p>
                <p className="text-4xl font-bold text-green-600">{info.pointsBalance}</p>
                <p className="text-xs text-gray-400 mt-1">= {info.totalReferrals} × {POINTS_PER_REFERRAL} pts</p>
              </div>

              {/* Badge Levels */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">Niveaux de badge</h3>
                <div className="space-y-3">
                  {(Object.entries(BADGE_CONFIG) as [ReferralBadgeLevel, typeof BADGE_CONFIG[ReferralBadgeLevel]][]).map(([level, config]) => {
                    const threshold = REFERRAL_BADGE_THRESHOLDS[level];
                    const isCurrentOrBelow = info.totalReferrals >= threshold;
                    const isCurrent = info.badgeLevel === level;
                    return (
                      <div
                        key={level}
                        className={`flex items-center gap-3 p-3 rounded-xl ${
                          isCurrent ? 'bg-green-50 dark:bg-green-900/20 ring-1 ring-green-200 dark:ring-green-800' : ''
                        }`}
                      >
                        <span className="text-2xl">{config.emoji}</span>
                        <div className="flex-1">
                          <p className={`font-medium ${isCurrent ? 'text-green-700 dark:text-green-400' : 'text-gray-700 dark:text-gray-300'}`}>
                            {config.label}
                          </p>
                          <p className="text-xs text-gray-400">
                            {threshold === 0 ? 'Niveau de départ' : `${threshold}+ parrainages`}
                          </p>
                        </div>
                        {isCurrentOrBelow && (
                          <CheckCircle className={`w-5 h-5 ${isCurrent ? 'text-green-600' : 'text-gray-300 dark:text-gray-600'}`} />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Referred Users */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Tes filleuls ({info.referredUsers.length})
                </h3>
                {info.referredUsers.length === 0 ? (
                  <div className="text-center py-6">
                    <Users className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Aucun filleul pour le moment</p>
                    <p className="text-xs text-gray-400 mt-1">Partage ton code pour commencer !</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {info.referredUsers.map(user => (
                      <div key={user.id} className="flex items-center gap-3 p-2">
                        <div className="w-9 h-9 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 font-semibold text-sm">
                          {user.name.charAt(0)}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 dark:text-white">{user.name}</p>
                          <p className="text-xs text-gray-400">
                            {new Date(user.joinedAt).toLocaleDateString('fr-FR')}
                          </p>
                        </div>
                        <span className="text-xs font-medium text-green-600">+{user.pointsEarned} pts</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'coupons' && (
            <motion.div
              key="coupons"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-4"
            >
              {/* Convert Points Card */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-1">Convertir tes points</h3>
                <p className="text-xs text-gray-400 mb-4">Solde : {info.pointsBalance} points</p>
                <div className="space-y-3">
                  {REFERRAL_COUPON_TIERS.map(tier => {
                    const canAfford = info.pointsBalance >= tier.pointsCost;
                    const isConverting = converting === tier.pointsCost;
                    return (
                      <div
                        key={tier.pointsCost}
                        className={`flex items-center justify-between p-4 rounded-xl border ${
                          canAfford
                            ? 'border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/10'
                            : 'border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 opacity-60'
                        }`}
                      >
                        <div>
                          <p className="font-semibold text-gray-900 dark:text-white">{tier.label}</p>
                          <p className="text-xs text-gray-500">{tier.pointsCost} points requis</p>
                        </div>
                        <Button
                          onClick={() => handleConvertPoints(tier.pointsCost)}
                          disabled={!canAfford || isConverting}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                        >
                          {isConverting ? '...' : 'Convertir'}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* My Coupons List */}
              <div className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm">
                <h3 className="font-semibold text-gray-900 dark:text-white mb-3">
                  Mes coupons ({coupons.length})
                </h3>
                {coupons.length === 0 ? (
                  <div className="text-center py-6">
                    <Ticket className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                    <p className="text-sm text-gray-400">Aucun coupon pour le moment</p>
                    <p className="text-xs text-gray-400 mt-1">Convertis tes points ci-dessus !</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {coupons.map(coupon => (
                      <div
                        key={coupon.id}
                        className={`p-3 rounded-xl border ${
                          coupon.status === 'active'
                            ? 'border-green-200 dark:border-green-800'
                            : 'border-gray-200 dark:border-gray-700 opacity-60'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                            coupon.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-600' : 'bg-gray-100 dark:bg-gray-700 text-gray-400'
                          }`}>
                            <Ticket className="w-5 h-5" />
                          </div>
                          <div className="flex-1">
                            <p className="font-semibold text-gray-900 dark:text-white">
                              {coupon.amount.toLocaleString('fr-FR')} FCFA
                            </p>
                            <p
                              className="text-xs text-gray-400 cursor-pointer active:text-green-500 select-all"
                              onClick={async () => {
                                try {
                                  await navigator.clipboard.writeText(coupon.code);
                                  feedback.success();
                                } catch { /* ignore */ }
                              }}
                              title="Copier le code"
                            >
                              Code: {coupon.code} <Copy className="w-3 h-3 inline ml-1 opacity-50" />
                            </p>
                          </div>
                          <div className="text-right">
                            {coupon.status === 'active' ? (
                              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-600">
                                <CheckCircle className="w-3.5 h-3.5" /> Actif
                              </span>
                            ) : coupon.status === 'used' ? (
                              <span className="text-xs text-gray-400">Utilisé</span>
                            ) : (
                              <span className="inline-flex items-center gap-1 text-xs text-red-500">
                                <Clock className="w-3.5 h-3.5" /> Expiré
                              </span>
                            )}
                            <p className="text-xs text-gray-400 mt-0.5">
                              {new Date(coupon.createdAt).toLocaleDateString('fr-FR')}
                            </p>
                          </div>
                        </div>
                        {coupon.status === 'active' && (
                          <Button
                            onClick={() => {
                              feedback.success();
                              onNavigate('home', { pendingCoupon: coupon });
                            }}
                            size="sm"
                            className="w-full mt-3 bg-green-600 hover:bg-green-700 text-white"
                          >
                            <Gift className="w-4 h-4 mr-1.5" />
                            Utiliser ce coupon
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
