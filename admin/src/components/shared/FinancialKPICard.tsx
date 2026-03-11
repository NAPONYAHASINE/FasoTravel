/**
 * Composant réutilisable pour afficher une carte KPI financière
 * Zéro duplication - utilisé dans DashboardHome et AnalyticsDashboard
 */

import React from 'react';
import { 
  DollarSign, 
  CreditCard, 
  Wallet, 
  Receipt, 
  ArrowUp, 
  ArrowDown,
  TrendingUp,
  LucideIcon
} from 'lucide-react';
import { FinancialKPI } from '../../types/financial';

// Mapping des icônes par nom
const ICON_MAP: Record<string, LucideIcon> = {
  DollarSign,
  CreditCard,
  Wallet,
  Receipt,
  TrendingUp,
};

// Mapping des couleurs
const COLOR_MAP = {
  emerald: {
    gradient: 'from-emerald-500 to-green-600',
    bg: 'bg-emerald-500/10 group-hover:bg-emerald-500/20',
    bgGradient: 'from-emerald-50 to-green-100 dark:from-emerald-900/20 dark:to-green-800/20',
    icon: 'text-emerald-500',
    iconBg: 'bg-emerald-500',
  },
  blue: {
    gradient: 'from-blue-500 to-indigo-600',
    bg: 'bg-blue-500/10 group-hover:bg-blue-500/20',
    bgGradient: 'from-blue-50 to-indigo-100 dark:from-blue-900/20 dark:to-indigo-800/20',
    icon: 'text-blue-500',
    iconBg: 'bg-blue-500',
  },
  purple: {
    gradient: 'from-purple-500 to-pink-600',
    bg: 'bg-purple-500/10 group-hover:bg-purple-500/20',
    bgGradient: 'from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/20',
    icon: 'text-purple-500',
    iconBg: 'bg-purple-500',
  },
  orange: {
    gradient: 'from-orange-500 to-red-600',
    bg: 'bg-orange-500/10 group-hover:bg-orange-500/20',
    bgGradient: 'from-orange-50 to-red-100 dark:from-orange-900/20 dark:to-red-800/20',
    icon: 'text-orange-500',
    iconBg: 'bg-orange-500',
  },
  red: {
    gradient: 'from-red-500 to-red-600',
    bg: 'bg-red-500/10 group-hover:bg-red-500/20',
    bgGradient: 'from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20',
    icon: 'text-red-500',
    iconBg: 'bg-red-500',
  },
  yellow: {
    gradient: 'from-yellow-500 to-amber-600',
    bg: 'bg-yellow-500/10 group-hover:bg-yellow-500/20',
    bgGradient: 'from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-800/20',
    icon: 'text-yellow-500',
    iconBg: 'bg-yellow-500',
  },
  green: {
    gradient: 'from-green-500 to-emerald-600',
    bg: 'bg-green-500/10 group-hover:bg-green-500/20',
    bgGradient: 'from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/20',
    icon: 'text-green-500',
    iconBg: 'bg-green-500',
  },
};

export interface FinancialKPICardProps {
  kpi: FinancialKPI;
  className?: string;
}

/**
 * Carte KPI financière premium avec design burkinabé
 */
export function FinancialKPICard({ kpi, className = '' }: FinancialKPICardProps) {
  const Icon = kpi.icon ? ICON_MAP[kpi.icon] || DollarSign : DollarSign;
  const TrendIcon = kpi.trend === 'up' ? ArrowUp : ArrowDown;
  const colors = COLOR_MAP[kpi.color || 'emerald'];

  return (
    <div 
      className={`group relative bg-white dark:bg-gray-800 rounded-2xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden border border-gray-200 dark:border-gray-700 hover:border-transparent ${className}`}
    >
      {/* Gradient Background Effect */}
      <div className={`absolute inset-0 bg-gradient-to-br opacity-0 group-hover:opacity-100 transition-opacity duration-300 ${colors.bgGradient}`}></div>
      
      <div className="relative p-6">
        {/* Icon avec effet premium */}
        <div className="flex items-start justify-between mb-4">
          <div className={`p-4 rounded-2xl transition-all duration-300 shadow-md ${colors.bg}`}>
            <Icon className={`h-7 w-7 ${colors.icon}`} />
          </div>
          
          {/* Trend Badge */}
          <div className={
            kpi.trend === 'up' 
              ? 'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400'
              : kpi.trend === 'down'
              ? 'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-400'
              : 'flex items-center gap-1 px-3 py-1.5 rounded-full text-xs bg-gray-100 dark:bg-gray-900/30 text-gray-800 dark:text-gray-400'
          }>
            {kpi.trend !== 'stable' && <TrendIcon className="h-3 w-3" />}
            <span>{kpi.change}</span>
          </div>
        </div>

        {/* Stats Value */}
        <div className="mb-2">
          <div className="text-3xl text-gray-900 dark:text-white mb-1 tracking-tight">
            {kpi.value}
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {kpi.label}
          </div>
        </div>

        {/* Subtext */}
        {kpi.subtext && (
          <div className="text-xs text-gray-500 dark:text-gray-400 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            {kpi.subtext}
          </div>
        )}

        {/* Decorative Corner */}
        <div className={`absolute top-0 right-0 w-32 h-32 bg-gradient-to-br opacity-5 rounded-bl-full ${colors.gradient}`}></div>
      </div>
    </div>
  );
}
