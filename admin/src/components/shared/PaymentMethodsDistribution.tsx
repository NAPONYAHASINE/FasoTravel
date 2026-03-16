/**
 * Composant réutilisable pour la distribution des méthodes de paiement
 * Zéro duplication
 */

import { CreditCard } from 'lucide-react';
import { PaymentMethodStats } from '../../types/financial';

export interface PaymentMethodsDistributionProps {
  data: PaymentMethodStats[];
  totalTransactions: number;
  successRate: number;
  theme?: 'light' | 'dark';
}

/**
 * Widget de distribution des méthodes de paiement
 */
export function PaymentMethodsDistribution({
  data,
  totalTransactions,
  successRate,
  theme: _theme = 'light',
}: PaymentMethodsDistributionProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl text-gray-900 dark:text-white mb-1">Méthodes de Paiement</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">Distribution des transactions</p>
        </div>
        <CreditCard className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>
      
      <div className="space-y-4">
        {data.map((method) => (
          <div key={method.methodName} className="group">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-3">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: method.color }}
                ></div>
                <span className="text-sm font-medium text-gray-900 dark:text-white">
                  {method.methodName}
                </span>
                {/* 🔥 Badge Audit pour Cash */}
                {method.isAuditOnly && (
                  <span className="px-2 py-0.5 text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400 rounded-full border border-orange-300 dark:border-orange-700">
                    Audit
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  {method.transactionCount.toLocaleString()} trans.
                </span>
                <span className="text-sm font-semibold text-gray-900 dark:text-white">
                  {method.percentage.toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div 
                className="h-full rounded-full transition-all duration-500 group-hover:opacity-80"
                style={{ 
                  width: `${method.percentage}%`,
                  backgroundColor: method.color
                }}
              ></div>
            </div>
            {/* 🔥 Note explicative pour les données d'audit */}
            {method.isAuditOnly && (
              <p className="mt-1.5 text-xs text-gray-500 dark:text-gray-400 italic">
                Géré par les sociétés - Supervision uniquement
              </p>
            )}
          </div>
        ))}
      </div>
      
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-600 dark:text-gray-400">Total Transactions</span>
          <span className="text-lg font-semibold text-gray-900 dark:text-white">
            {totalTransactions.toLocaleString()}
          </span>
        </div>
        <div className="flex items-center justify-between mt-2">
          <span className="text-sm text-gray-600 dark:text-gray-400">Taux de Succès</span>
          <span className="text-lg font-semibold text-emerald-600 dark:text-emerald-400">
            {successRate.toFixed(1)}%
          </span>
        </div>
      </div>
    </div>
  );
}