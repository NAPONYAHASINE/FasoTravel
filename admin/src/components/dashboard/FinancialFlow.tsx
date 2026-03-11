/**
 * @file FinancialFlow.tsx
 * @description Page Flux Financier — Visualisation des flux d'argent FasoTravel
 * 
 * Architecture backend-ready :
 * - ZÉRO logique métier — tout dans useFinancialFlow()
 * - Hook dédié calcule : commission, frais, marge, filtre cash
 * - Constantes modèle éco centralisées dans le hook
 * - Design-system FasoTravel (PAGE_CLASSES, COMPONENTS)
 * - PAS DE SPINNER/LOADING bloquant — rendu immédiat
 * 
 * MODÈLE :
 * Passager paie : Prix billet + 100 FCFA frais de service
 * Prix billet → Split PayDunya : 95% Société + 5% FasoTravel
 * Frais service 100 FCFA → 100% FasoTravel (hors split)
 * Cash aux guichets = hors périmètre (audit only)
 */

import { useState } from 'react';
import {
  ArrowRight, ArrowDown, TrendingUp, TrendingDown, Wallet,
  Building2, Users, Percent, Receipt, Server,
  ArrowUpRight, ArrowDownRight, Minus,
  RefreshCw, Download, PieChart, GitBranch, Zap, Shield,
  AlertTriangle, CircleDollarSign, Info, Edit3, Check, X,
} from 'lucide-react';
import { PAGE_CLASSES, COMPONENTS } from '../../lib/design-system';
import {
  useFinancialFlow,
  FASOTRAVEL_MODEL_DEFAULTS,
  TECH_COSTS,
  TOTAL_TECH_COST,
} from '../../hooks/useFinancialFlow';
import { TimePeriod } from '../../types/financial';
import type { CompanyRevenue, PaymentMethodStats } from '../../types/financial';
import { RevenueChart } from '../shared/RevenueChart';
import { exportToCSV } from '../../lib/exportUtils';
import { toast } from 'sonner@2.0.3';
import { ResponsiveContainer, Cell, PieChart as RePieChart, Pie } from 'recharts';

// ============================================================================
// CONSTANTES UI (affichage uniquement — pas de logique métier)
// ============================================================================

const PERIOD_OPTIONS = [
  { value: TimePeriod.TODAY, label: 'Jour' },
  { value: TimePeriod.WEEK, label: 'Semaine' },
  { value: TimePeriod.MONTH, label: 'Mois' },
  { value: TimePeriod.YEAR, label: 'Année' },
] as const;

const PERIOD_LABELS: Record<string, string> = {
  today: "Aujourd'hui",
  week: 'Cette semaine',
  month: 'Ce mois',
  year: 'Cette année',
};

// ============================================================================
// HELPERS (formatage uniquement)
// ============================================================================

function formatCFA(amount: number): string {
  if (amount >= 1_000_000) return `${(amount / 1_000_000).toFixed(1)}M FCFA`;
  if (amount >= 1_000) return `${Math.round(amount).toLocaleString('fr-FR')} FCFA`;
  return `${amount} FCFA`;
}

function formatNumber(n: number): string {
  return n.toLocaleString('fr-FR');
}

// ============================================================================
// INLINE EDITABLE VALUE
// ============================================================================

function EditableValue({
  value,
  onSave,
  min,
  max,
  step = 1,
  suffix,
  label,
}: {
  value: number;
  onSave: (v: number) => void;
  min: number;
  max: number;
  step?: number;
  suffix: string;
  label: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const handleSave = () => {
    const clamped = Math.max(min, Math.min(max, draft));
    onSave(clamped);
    setEditing(false);
    toast.success(`${label} mis à jour : ${clamped}${suffix}`);
  };

  const handleCancel = () => {
    setDraft(value);
    setEditing(false);
  };

  if (editing) {
    return (
      <div className="flex items-center gap-2">
        <input
          type="number"
          value={draft}
          onChange={(e) => setDraft(parseFloat(e.target.value) || 0)}
          min={min}
          max={max}
          step={step}
          className="w-24 px-3 py-1.5 text-lg border-2 border-red-400 dark:border-red-500 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-red-500"
          autoFocus
          onKeyDown={(e) => { if (e.key === 'Enter') handleSave(); if (e.key === 'Escape') handleCancel(); }}
        />
        <span className="text-lg text-gray-500">{suffix}</span>
        <button onClick={handleSave} className="p-1.5 rounded-lg bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
          <Check size={16} />
        </button>
        <button onClick={handleCancel} className="p-1.5 rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
          <X size={16} />
        </button>
      </div>
    );
  }

  return (
    <div className="flex items-center gap-2 group">
      <span className="text-2xl">{value}{suffix}</span>
      <button
        onClick={() => { setDraft(value); setEditing(true); }}
        className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 bg-gray-100 dark:bg-gray-700 text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-600 transition-all"
        title={`Modifier ${label.toLowerCase()}`}
      >
        <Edit3 size={14} />
      </button>
    </div>
  );
}

// ============================================================================
// SUB-COMPONENTS
// ============================================================================

/** 4 KPI cards du flux financier */
function FlowKPIGrid({ data, model }: {
  data: NonNullable<ReturnType<typeof useFinancialFlow>['data']>;
  model: ReturnType<typeof useFinancialFlow>['model'];
}) {
  const kpis = [
    {
      label: 'Volume Transactions App',
      value: formatCFA(data.totalRevenue),
      sub: `${formatNumber(data.ticketCount)} billets via l'app mobile`,
      iconColor: 'text-blue-500',
      bgColor: 'bg-blue-50 dark:bg-blue-900/20',
      trend: data.growthRate > 0 ? 'up' : data.growthRate < 0 ? 'down' : 'stable',
      change: `${data.growthRate > 0 ? '+' : ''}${data.growthRate.toFixed(1)}%`,
    },
    {
      label: 'Revenus Plateforme',
      value: formatCFA(data.platformRevenue),
      sub: `Commission ${model.commissionRate}% + Frais ${model.serviceFeePerTicket}F`,
      iconColor: 'text-green-500',
      bgColor: 'bg-green-50 dark:bg-green-900/20',
      trend: 'up' as const,
      change: `${formatCFA(data.commissionRevenue)} + ${formatCFA(data.serviceFeeRevenue)}`,
    },
    {
      label: 'Reversement Sociétés',
      value: formatCFA(data.companyReversal),
      sub: `${100 - model.commissionRate}% du prix billet via Split PayDunya`,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-50 dark:bg-amber-900/20',
      trend: 'stable' as const,
      change: `${data.companies.length} sociétés`,
    },
    {
      label: 'Marge Nette',
      value: formatCFA(data.netMargin),
      sub: `Après coûts tech ${formatCFA(TOTAL_TECH_COST)}/mois`,
      iconColor: data.netMargin > 0 ? 'text-emerald-500' : 'text-red-500',
      bgColor: data.netMargin > 0 ? 'bg-emerald-50 dark:bg-emerald-900/20' : 'bg-red-50 dark:bg-red-900/20',
      trend: (data.netMargin > 0 ? 'up' : 'down') as 'up' | 'down',
      change: `Marge ${data.platformRevenue > 0 ? ((data.netMargin / data.platformRevenue) * 100).toFixed(0) : 0}%`,
    },
  ];

  const icons = [CircleDollarSign, Wallet, Building2, TrendingUp];

  return (
    <div className={PAGE_CLASSES.statsGrid}>
      {kpis.map((kpi, i) => {
        const Icon = icons[i];
        return (
          <div key={kpi.label} className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-200 dark:border-gray-700 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className={`p-3 rounded-xl ${kpi.bgColor}`}>
                <Icon className={`h-6 w-6 ${kpi.iconColor}`} />
              </div>
              <div className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-xs ${
                kpi.trend === 'up' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                : kpi.trend === 'down' ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400'
              }`}>
                {kpi.trend === 'up' && <ArrowUpRight className="h-3 w-3" />}
                {kpi.trend === 'down' && <ArrowDownRight className="h-3 w-3" />}
                {kpi.trend === 'stable' && <Minus className="h-3 w-3" />}
                <span>{kpi.change}</span>
              </div>
            </div>
            <div className="text-2xl text-gray-900 dark:text-white mb-1">{kpi.value}</div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">{kpi.label}</div>
            <div className="text-xs text-gray-500">{kpi.sub}</div>
          </div>
        );
      })}
    </div>
  );
}

/** Diagramme de flux : Passager → PayDunya → Split (CORRIGÉ) */
function MoneyFlowDiagram({ data, model }: {
  data: NonNullable<ReturnType<typeof useFinancialFlow>['data']>;
  model: ReturnType<typeof useFinancialFlow>['model'];
}) {
  // Le passager paie : prix billet + 100F frais
  const totalPaidByPassenger = data.totalRevenue + data.serviceFeeRevenue;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 mb-6">
      <div className="flex items-center gap-3 mb-2">
        <div className="p-2.5 bg-gradient-to-br from-red-500 to-amber-500 rounded-xl text-white">
          <GitBranch className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-gray-900 dark:text-white">Flux Financier — Split Payment PayDunya</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Parcours de chaque paiement via l'app mobile
          </p>
        </div>
      </div>

      {/* Info banner */}
      <div className="flex items-start gap-2 mb-5 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-xs text-blue-700 dark:text-blue-300">
        <Info className="h-4 w-4 shrink-0 mt-0.5" />
        <span>
          Seuls les billets vendus via l'app mobile passent par ce flux.
          Les ventes en espèces aux guichets sont encaissées directement par les sociétés — FasoTravel n'y perçoit rien.
        </span>
      </div>

      {/* Flow responsive */}
      <div className="flex flex-col lg:flex-row items-stretch gap-4 lg:gap-0">
        {/* Passagers */}
        <FlowNode icon={Users} label="Passagers" sub={`${formatNumber(data.ticketCount)} billets`}
          gradient="from-blue-500 to-blue-600" bg="bg-blue-50 dark:bg-blue-900/20" border="border-blue-200 dark:border-blue-700" />

        <FlowArrow label={formatCFA(totalPaidByPassenger)} />

        {/* PayDunya */}
        <FlowNode icon={Shield} label="PayDunya" sub="Agrégateur unique"
          gradient="from-violet-500 to-purple-600" bg="bg-violet-50 dark:bg-violet-900/20" border="border-violet-200 dark:border-violet-700" />

        {/* Split indicator */}
        <div className="flex flex-col items-center justify-center px-2 lg:px-4">
          <div className="hidden lg:flex flex-col items-center gap-1">
            <div className="w-px h-8 bg-gradient-to-b from-green-400 to-green-500" />
            <div className="text-xs text-gray-400 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">SPLIT</div>
            <div className="w-px h-8 bg-gradient-to-b from-amber-400 to-amber-500" />
          </div>
          <div className="flex lg:hidden items-center gap-1 py-2">
            <div className="h-px w-8 bg-gradient-to-r from-green-400 to-green-500" />
            <div className="text-xs text-gray-400 px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded-full">SPLIT</div>
            <div className="h-px w-8 bg-gradient-to-r from-amber-400 to-amber-500" />
          </div>
        </div>

        {/* Destinations */}
        <div className="flex flex-col gap-3 flex-1 min-w-0">
          {/* FasoTravel */}
          <div className="flex items-center gap-4 p-4 rounded-xl border border-green-200 dark:border-green-700 bg-green-50 dark:bg-green-900/20 hover:shadow-md transition-all">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-green-500 to-emerald-600 text-white shrink-0">
              <Zap className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-900 dark:text-white">FasoTravel</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 space-y-0.5 mt-1">
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-green-500 shrink-0" />
                  {model.commissionRate}% du prix billet (commission)
                </div>
                <div className="flex items-center gap-1">
                  <span className="inline-block w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                  + {model.serviceFeePerTicket}F/billet (frais service, payé par le passager)
                </div>
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-gray-900 dark:text-white">{formatCFA(data.platformRevenue)}</div>
              <span className="text-xs text-green-600 dark:text-green-400">Commission: {formatCFA(data.commissionRevenue)}</span>
              <br />
              <span className="text-xs text-blue-600 dark:text-blue-400">Frais service: {formatCFA(data.serviceFeeRevenue)}</span>
            </div>
          </div>

          {/* Sociétés */}
          <div className="flex items-center gap-4 p-4 rounded-xl border border-amber-200 dark:border-amber-700 bg-amber-50 dark:bg-amber-900/20 hover:shadow-md transition-all">
            <div className="p-2.5 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white shrink-0">
              <Building2 className="h-5 w-5" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm text-gray-900 dark:text-white">Sociétés de Transport</span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-white/80 dark:bg-gray-700 text-gray-600 dark:text-gray-300">{100 - model.commissionRate}%</span>
              </div>
              <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                {100 - model.commissionRate}% du prix billet — reversement automatique PayDunya
              </div>
              <div className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 italic">
                Les {model.serviceFeePerTicket}F de frais service ne transitent pas vers les sociétés
              </div>
            </div>
            <div className="text-right shrink-0">
              <div className="text-gray-900 dark:text-white">{formatCFA(data.companyReversal)}</div>
              <span className="text-xs text-gray-500">{data.companies.length} sociétés bénéficiaires</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function FlowNode({ icon: Icon, label, sub, gradient, bg, border }: {
  icon: any; label: string; sub: string; gradient: string; bg: string; border: string;
}) {
  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${border} ${bg} min-w-[180px] shrink-0`}>
      <div className={`p-2.5 rounded-lg bg-gradient-to-br ${gradient} text-white`}>
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <div className="text-sm text-gray-900 dark:text-white">{label}</div>
        <div className="text-xs text-gray-500 dark:text-gray-400">{sub}</div>
      </div>
    </div>
  );
}

function FlowArrow({ label }: { label: string }) {
  return (
    <div className="flex items-center justify-center px-2 lg:px-4">
      <div className="hidden lg:flex items-center gap-1">
        <div className="w-8 h-px bg-gray-300 dark:bg-gray-600" />
        <div className="text-xs text-gray-500 whitespace-nowrap px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">{label}</div>
        <ArrowRight className="h-4 w-4 text-gray-400" />
      </div>
      <div className="flex lg:hidden flex-col items-center gap-1 py-1">
        <ArrowDown className="h-4 w-4 text-gray-400" />
        <div className="text-xs text-gray-500 px-2 py-1 bg-gray-100 dark:bg-gray-700 rounded-full">{label}</div>
      </div>
    </div>
  );
}

/** Distribution par canal PayDunya (cash exclu) */
function PayDunyaChannels({ channels, cashAudit }: {
  channels: PaymentMethodStats[];
  cashAudit: PaymentMethodStats | null;
}) {
  if (!channels.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 text-center text-gray-500">
        Aucune donnée de canal
      </div>
    );
  }

  const total = channels.reduce((s, m) => s + m.totalAmount, 0);
  const pieData = channels.map((m) => ({
    name: m.methodName,
    value: m.totalAmount,
    color: m.color || '#6b7280',
  }));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-gradient-to-br from-violet-500 to-purple-600 rounded-xl text-white">
          <PieChart className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-gray-900 dark:text-white">Canaux PayDunya</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Billets app mobile — {formatCFA(total)}
          </p>
        </div>
      </div>

      {/* Pie + Legend */}
      <div className="flex items-center gap-6 mb-6">
        <div className="w-32 h-32 shrink-0">
          <ResponsiveContainer width="100%" height="100%">
            <RePieChart>
              <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={55}
                paddingAngle={3} dataKey="value" stroke="none">
                {pieData.map((entry, i) => (
                  <Cell key={`cell-${i}`} fill={entry.color} />
                ))}
              </Pie>
            </RePieChart>
          </ResponsiveContainer>
        </div>

        <div className="flex-1 space-y-2.5">
          {channels.map((ch) => (
            <div key={ch.methodName} className="flex items-center gap-3">
              <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: ch.color }} />
              <span className="text-sm text-gray-700 dark:text-gray-300 flex-1 truncate">{ch.methodName}</span>
              <span className="text-sm text-gray-900 dark:text-white">{ch.percentage.toFixed(0)}%</span>
            </div>
          ))}
        </div>
      </div>

      {/* Detail bars */}
      <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        {channels.map((ch) => (
          <div key={`bar-${ch.methodName}`}>
            <div className="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400 mb-1">
              <span>{ch.methodName} — {formatNumber(ch.transactionCount)} tx</span>
              <span>{formatCFA(ch.totalAmount)}</span>
            </div>
            <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
              <div className="h-full rounded-full transition-all duration-500"
                style={{ width: `${ch.percentage}%`, backgroundColor: ch.color }} />
            </div>
            <div className="flex justify-between mt-0.5">
              <span className="text-xs text-gray-400">Succès: {ch.successRate.toFixed(1)}%</span>
              <span className="text-xs text-gray-400">Moy: {formatCFA(ch.averageAmount)}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Cash audit info */}
      {cashAudit && (
        <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-700">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50 text-xs text-gray-500 dark:text-gray-400">
            <Info className="h-4 w-4 shrink-0 mt-0.5" />
            <div>
              <span className="text-gray-700 dark:text-gray-300">Hors flux FasoTravel :</span>{' '}
              {formatNumber(cashAudit.transactionCount)} ventes en espèces aux guichets ({formatCFA(cashAudit.totalAmount)})
              — encaissées directement par les sociétés.
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Coûts tech mensuels */
function TechCostBreakdown() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-gradient-to-br from-orange-500 to-red-500 rounded-xl text-white">
          <Server className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <h3 className="text-gray-900 dark:text-white">Coûts Technologiques Mensuels</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Base 1 000 utilisateurs actifs</p>
        </div>
        <div className="text-right">
          <div className="text-xl text-gray-900 dark:text-white">{formatCFA(TOTAL_TECH_COST)}</div>
          <div className="text-xs text-gray-500">/mois</div>
        </div>
      </div>

      <div className="space-y-3">
        {TECH_COSTS.map((cost) => {
          const pct = ((cost.amount / TOTAL_TECH_COST) * 100).toFixed(0);
          return (
            <div key={cost.key}>
              <div className="flex items-center gap-3 mb-1.5">
                <div className="w-3 h-3 rounded-full shrink-0" style={{ backgroundColor: cost.color }} />
                <span className="text-sm text-gray-700 dark:text-gray-300 flex-1">{cost.label}</span>
                <span className="text-sm text-gray-900 dark:text-white">{formatCFA(cost.amount)}</span>
                <span className="text-xs text-gray-400 w-10 text-right">{pct}%</span>
              </div>
              <div className="h-2 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden ml-6">
                <div className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${pct}%`, backgroundColor: cost.color }} />
              </div>
            </div>
          );
        })}
      </div>

      {/* Projections */}
      <div className="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
        <h4 className="text-sm text-gray-700 dark:text-gray-300 mb-3">Projection de rentabilité</h4>
        <div className="grid grid-cols-3 gap-3 text-center">
          {[
            { users: '1 000', revenue: 350000, costs: TOTAL_TECH_COST },
            { users: '5 000', revenue: 1750000, costs: Math.floor(TOTAL_TECH_COST * 2.5) },
            { users: '10 000', revenue: 3500000, costs: Math.floor(TOTAL_TECH_COST * 4) },
          ].map((proj) => {
            const margin = proj.revenue - proj.costs;
            return (
              <div key={proj.users} className="p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
                <div className="text-xs text-gray-500 dark:text-gray-400 mb-1">{proj.users} users</div>
                <div className={`text-sm ${margin > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}`}>
                  {margin > 0 ? '+' : ''}{formatCFA(margin)}
                </div>
                <div className="text-xs text-gray-400">marge/mois</div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/** Modèle économique — AVEC BOUTONS D'ÉDITION */
function BusinessModelCard({ ticketCount, model, actions }: {
  ticketCount: number;
  model: ReturnType<typeof useFinancialFlow>['model'];
  actions: ReturnType<typeof useFinancialFlow>['actions'];
}) {
  const avgPrice = FASOTRAVEL_MODEL_DEFAULTS.avgTicketPrice;
  const totalVolume = ticketCount * avgPrice;
  const commissionRev = Math.floor(totalVolume * (model.commissionRate / 100));
  const feeRev = ticketCount * model.serviceFeePerTicket;
  const totalPlatform = commissionRev + feeRev;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center gap-3 mb-6">
        <div className="p-2.5 bg-gradient-to-br from-red-500 via-yellow-500 to-green-500 rounded-xl text-white">
          <Receipt className="h-5 w-5" />
        </div>
        <div>
          <h3 className="text-gray-900 dark:text-white">Modèle Économique</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">Revenus app mobile uniquement</p>
        </div>
      </div>

      <div className="space-y-4">
        {/* Commission — ÉDITABLE */}
        <div className="p-4 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Percent className="h-4 w-4 text-green-600 dark:text-green-400" />
              <span className="text-sm text-green-800 dark:text-green-300">Commission sur sociétés</span>
            </div>
          </div>
          <div className="text-green-700 dark:text-green-300">
            <EditableValue
              value={model.commissionRate}
              onSave={actions.updateCommissionRate}
              min={FASOTRAVEL_MODEL_DEFAULTS.minCommissionRate}
              max={50}
              step={0.5}
              suffix="%"
              label="Commission"
            />
          </div>
          <div className="text-xs text-green-600 dark:text-green-400 mt-1">
            Prélevé automatiquement via Split Payment PayDunya
            <span className="text-green-500 dark:text-green-500 ml-1">(min. {FASOTRAVEL_MODEL_DEFAULTS.minCommissionRate}%)</span>
          </div>
          <div className="text-xs text-green-500 dark:text-green-500 mt-0.5 italic">
            La commission peut varier par société (négociation), mais jamais en dessous de {FASOTRAVEL_MODEL_DEFAULTS.minCommissionRate}%
          </div>
        </div>

        {/* Frais de service — ÉDITABLE */}
        <div className="p-4 rounded-xl bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <Receipt className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              <span className="text-sm text-blue-800 dark:text-blue-300">Frais de service passager</span>
            </div>
          </div>
          <div className="text-blue-700 dark:text-blue-300">
            <EditableValue
              value={model.serviceFeePerTicket}
              onSave={actions.updateServiceFee}
              min={0}
              max={5000}
              step={50}
              suffix=" FCFA"
              label="Frais de service"
            />
          </div>
          <div className="text-xs text-blue-600 dark:text-blue-400 mt-1">
            Payé par le passager EN PLUS du prix du billet — 100% FasoTravel
          </div>
          <div className="text-xs text-blue-500 dark:text-blue-500 mt-0.5 italic">
            Ces frais ne font pas partie du prix du billet et n'entrent pas dans le split 95/5
          </div>
        </div>

        {/* Simulation */}
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="text-xs text-gray-500 dark:text-gray-400 mb-3">
            Simulation : {formatNumber(ticketCount)} billets (prix moy. {formatCFA(avgPrice)})
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Prix billets (volume)</span>
              <span className="text-gray-700 dark:text-gray-300">{formatCFA(totalVolume)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">→ Commission {model.commissionRate}%</span>
              <span className="text-green-600 dark:text-green-400">{formatCFA(commissionRev)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">→ Reversement sociétés {100 - model.commissionRate}%</span>
              <span className="text-amber-600 dark:text-amber-400">{formatCFA(totalVolume - commissionRev)}</span>
            </div>
            <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">Frais service ({model.serviceFeePerTicket}F × {formatNumber(ticketCount)})</span>
              <span className="text-blue-600 dark:text-blue-400">{formatCFA(feeRev)}</span>
            </div>
            <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
            <div className="flex justify-between text-sm">
              <span className="text-gray-900 dark:text-white">Revenu plateforme total</span>
              <span className="text-gray-900 dark:text-white">{formatCFA(totalPlatform)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-600 dark:text-gray-400">- Coûts tech mensuels</span>
              <span className="text-red-500">-{formatCFA(TOTAL_TECH_COST)}</span>
            </div>
            <div className="h-px bg-gray-200 dark:bg-gray-700 my-2" />
            <div className="flex justify-between">
              <span className="text-gray-900 dark:text-white">Marge nette</span>
              <span className={totalPlatform - TOTAL_TECH_COST > 0 ? 'text-green-600 dark:text-green-400' : 'text-red-500'}>
                {formatCFA(totalPlatform - TOTAL_TECH_COST)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/** Tableau répartition par société */
function CompanyRevenueTable({ companies, model }: {
  companies: CompanyRevenue[];
  model: ReturnType<typeof useFinancialFlow>['model'];
}) {
  if (!companies.length) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500">
        Aucune donnée de société disponible
      </div>
    );
  }

  const totalRev = companies.reduce((s, c) => s + c.totalRevenue, 0);

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-gradient-to-br from-amber-500 to-orange-500 rounded-xl text-white">
            <Building2 className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-gray-900 dark:text-white">Répartition par Société</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Billets vendus via l'app mobile — Commission {model.commissionRate}% + Reversement {100 - model.commissionRate}%
            </p>
          </div>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-50 dark:bg-gray-700/50 text-left">
              <th className="px-6 py-3 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Société</th>
              <th className="px-6 py-3 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Volume app</th>
              <th className="px-6 py-3 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Billets</th>
              <th className="px-6 py-3 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Commission {model.commissionRate}%</th>
              <th className="px-6 py-3 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Reversement</th>
              <th className="px-6 py-3 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Part</th>
              <th className="px-6 py-3 text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider text-right">Croissance</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
            {companies.map((company, idx) => {
              const pct = totalRev > 0 ? ((company.totalRevenue / totalRev) * 100).toFixed(1) : '0';
              const reversal = Math.floor(company.totalRevenue * ((100 - model.commissionRate) / 100));
              return (
                <tr key={company.companyId} className="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 flex items-center justify-center text-sm text-gray-600 dark:text-gray-300">
                        {idx + 1}
                      </div>
                      <span className="text-sm text-gray-900 dark:text-white">{company.companyName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-right text-gray-900 dark:text-white">{formatCFA(company.totalRevenue)}</td>
                  <td className="px-6 py-4 text-sm text-right text-gray-600 dark:text-gray-400">{formatNumber(company.transactionCount)}</td>
                  <td className="px-6 py-4 text-sm text-right text-green-600 dark:text-green-400">{formatCFA(company.commissionGenerated)}</td>
                  <td className="px-6 py-4 text-sm text-right text-amber-600 dark:text-amber-400">{formatCFA(reversal)}</td>
                  <td className="px-6 py-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <div className="w-16 h-1.5 bg-gray-100 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-amber-500" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="text-xs text-gray-500 w-10 text-right">{pct}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-right">
                    <span className={`inline-flex items-center gap-1 text-xs px-2 py-1 rounded-full ${
                      company.growth > 0
                        ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
                        : company.growth < 0
                        ? 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500'
                    }`}>
                      {company.growth > 0 && <TrendingUp className="h-3 w-3" />}
                      {company.growth < 0 && <TrendingDown className="h-3 w-3" />}
                      {company.growth > 0 ? '+' : ''}{company.growth}%
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
          <tfoot>
            <tr className="bg-gray-50 dark:bg-gray-700/50">
              <td className="px-6 py-3 text-sm text-gray-900 dark:text-white">Total</td>
              <td className="px-6 py-3 text-sm text-right text-gray-900 dark:text-white">{formatCFA(totalRev)}</td>
              <td className="px-6 py-3 text-sm text-right text-gray-600 dark:text-gray-400">{formatNumber(companies.reduce((s, c) => s + c.transactionCount, 0))}</td>
              <td className="px-6 py-3 text-sm text-right text-green-600 dark:text-green-400">{formatCFA(companies.reduce((s, c) => s + c.commissionGenerated, 0))}</td>
              <td className="px-6 py-3 text-sm text-right text-amber-600 dark:text-amber-400">{formatCFA(Math.floor(totalRev * ((100 - model.commissionRate) / 100)))}</td>
              <td className="px-6 py-3 text-sm text-right text-gray-500">100%</td>
              <td className="px-6 py-3" />
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function FinancialFlow() {
  const {
    data,
    period,
    loading,
    error,
    model,
    actions,
  } = useFinancialFlow(TimePeriod.MONTH);

  const handleExport = () => {
    if (!data?.companies.length) {
      toast.error('Aucune donnée à exporter');
      return;
    }
    const csvData = data.companies.map((c) => ({
      societe: c.companyName,
      volume_app_fcfa: c.totalRevenue,
      billets: c.transactionCount,
      [`commission_${model.commissionRate}pct`]: c.commissionGenerated,
      [`reversement_${100 - model.commissionRate}pct`]: Math.floor(c.totalRevenue * ((100 - model.commissionRate) / 100)),
      croissance_pct: c.growth,
    }));
    exportToCSV(csvData, `flux-financier-${period}`);
    toast.success('Export CSV généré');
  };

  return (
    <div className={PAGE_CLASSES.container}>
      <div className={PAGE_CLASSES.content}>
        {/* HEADER */}
        <div className={PAGE_CLASSES.header}>
          <div className={PAGE_CLASSES.headerContent}>
            <div className={PAGE_CLASSES.headerTexts}>
              <h1 className="text-3xl text-gray-900 dark:text-white">Flux Financier</h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Flux d'argent des billets vendus via l'app mobile FasoTravel
              </p>
            </div>
            <div className={PAGE_CLASSES.headerActions}>
              {/* Sélecteur de période */}
              <div className="flex items-center bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
                {PERIOD_OPTIONS.map((p) => (
                  <button
                    key={p.value}
                    onClick={() => actions.setPeriod(p.value)}
                    className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                      period === p.value
                        ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                        : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                  >
                    {p.label}
                  </button>
                ))}
              </div>

              <button onClick={actions.refresh}
                className="p-2 rounded-lg text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                title="Actualiser">
                <RefreshCw className="h-4 w-4" />
              </button>

              <button onClick={handleExport}
                className={COMPONENTS.buttonPrimary + ' flex items-center gap-2'}
                style={{ background: 'linear-gradient(to right, #dc2626, #f59e0b, #16a34a)' }}>
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">Exporter</span>
              </button>
            </div>
          </div>
        </div>

        {/* ERROR */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-700 rounded-xl flex items-center gap-3">
            <AlertTriangle className="h-5 w-5 text-red-500 shrink-0" />
            <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
          </div>
        )}

        {/* CONTENU — rendu immédiat, pas de placeholder/spinner */}
        {data && (
          <>
            {/* KPIs */}
            <FlowKPIGrid data={data} model={model} />

            {/* Diagramme de flux */}
            <MoneyFlowDiagram data={data} model={model} />

            {/* Charts + Modèle éco */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <div className="lg:col-span-2">
                {data.dailyRevenue.length > 0 ? (
                  <RevenueChart
                    data={data.dailyRevenue}
                    type="bar"
                    title="Évolution des Revenus (app mobile)"
                    subtitle={PERIOD_LABELS[period] || ''}
                    growth={data.growthRate}
                    showGrowthBadge
                    color="#dc2626"
                    period={period}
                    chartId="financial-flow-revenue"
                  />
                ) : (
                  <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg border border-gray-200 dark:border-gray-700 p-12 flex items-center justify-center text-gray-500">
                    Aucune donnée de revenus
                  </div>
                )}
              </div>
              <BusinessModelCard ticketCount={data.ticketCount} model={model} actions={actions} />
            </div>

            {/* Canaux + Coûts tech */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
              <PayDunyaChannels channels={data.platformChannels} cashAudit={data.cashAudit} />
              <div className="lg:col-span-2">
                <TechCostBreakdown />
              </div>
            </div>

            {/* Tableau sociétés */}
            <CompanyRevenueTable companies={data.companies} model={model} />
          </>
        )}
      </div>
    </div>
  );
}

export default FinancialFlow;
