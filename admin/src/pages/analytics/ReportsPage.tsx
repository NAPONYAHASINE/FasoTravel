/**
 * @file ReportsPage.tsx
 * @description Analytics reports page — aggregates financial & platform data
 * with CSV export capability
 */

import { useNavigate } from 'react-router';
import { ArrowLeft, Download, TrendingUp, Users, CreditCard, Building, Calendar } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { useState, useCallback } from 'react';
import { useFinancialFlow, FASOTRAVEL_MODEL } from '../../hooks/useFinancialFlow';
import { TimePeriod } from '../../types/financial';
import { toast } from 'sonner@2.0.3';

const PERIOD_LABELS: Record<string, string> = {
  [TimePeriod.TODAY]: 'Aujourd\'hui',
  [TimePeriod.WEEK]: 'Cette semaine',
  [TimePeriod.MONTH]: 'Ce mois',
  [TimePeriod.YEAR]: 'Cette année',
};

function formatFCFA(amount: number): string {
  return amount.toLocaleString('fr-FR') + ' FCFA';
}

export default function ReportsPage() {
  const navigate = useNavigate();
  const { data, period, loading, actions } = useFinancialFlow();
  const [exporting, setExporting] = useState(false);

  const handleExportCSV = useCallback(() => {
    if (!data) return;
    setExporting(true);

    try {
      // Build CSV rows
      const rows: string[][] = [
        ['Rapport Financier FasoTravel', ''],
        ['Période', PERIOD_LABELS[period] || period],
        ['Date d\'export', new Date().toLocaleDateString('fr-FR')],
        [''],
        ['--- KPIs Globaux ---', ''],
        ['Revenu total (billets)', formatFCFA(data.totalRevenue)],
        ['Billets vendus', String(data.ticketCount)],
        ['Commission plateforme', formatFCFA(data.commissionRevenue)],
        ['Frais de service', formatFCFA(data.serviceFeeRevenue)],
        ['Revenu plateforme total', formatFCFA(data.platformRevenue)],
        ['Reversement sociétés', formatFCFA(data.companyReversal)],
        ['Marge nette', formatFCFA(data.netMargin)],
        ['Croissance', data.growthRate.toFixed(1) + '%'],
        [''],
        ['--- Canaux de paiement ---', 'Transactions', 'Montant'],
        ...data.platformChannels.map(ch => [
          ch.method, String(ch.transactionCount), formatFCFA(ch.totalAmount)
        ]),
        [''],
        ['--- Top sociétés ---', 'Revenus', 'Billets'],
        ...data.companies.map((c: any) => [
          c.companyName, formatFCFA(c.totalRevenue), String(c.transactionCount)
        ]),
      ];

      const csvContent = rows.map(row => row.join(';')).join('\n');
      const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `rapport-fasotravel-${period}-${new Date().toISOString().slice(0, 10)}.csv`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success('Rapport CSV téléchargé');
    } catch {
      toast.error('Erreur lors de l\'export');
    } finally {
      setExporting(false);
    }
  }, [data, period]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" onClick={() => navigate('/analytics')}>
            <ArrowLeft className="w-4 h-4 mr-2" />Retour
          </Button>
          <h1 className="text-2xl font-bold dark:text-white">Rapports & Exports</h1>
        </div>
        <div className="flex items-center gap-3">
          {/* Period selector */}
          <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-1">
            {[TimePeriod.WEEK, TimePeriod.MONTH, TimePeriod.YEAR].map(p => (
              <button
                key={p}
                onClick={() => actions.setPeriod(p)}
                className={`px-3 py-1.5 text-sm rounded-md transition-all ${
                  period === p
                    ? 'bg-white dark:bg-gray-700 shadow text-gray-900 dark:text-white'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                }`}
              >
                {PERIOD_LABELS[p]}
              </button>
            ))}
          </div>
          <Button onClick={handleExportCSV} disabled={!data || exporting}>
            <Download className="w-4 h-4 mr-2" />
            Exporter CSV
          </Button>
        </div>
      </div>

      {loading && !data ? (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">Chargement des données...</p>
        </div>
      ) : data ? (
        <>
          {/* KPI summary cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-green-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-green-600" />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Revenu plateforme</span>
              </div>
              <p className="text-2xl font-bold dark:text-white">{formatFCFA(data.platformRevenue)}</p>
              <p className="text-xs text-gray-400 mt-1">
                Commission {FASOTRAVEL_MODEL.commissionRate}% + frais service
              </p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center">
                  <CreditCard className="w-5 h-5 text-blue-600" />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Volume transactions</span>
              </div>
              <p className="text-2xl font-bold dark:text-white">{formatFCFA(data.totalRevenue)}</p>
              <p className="text-xs text-gray-400 mt-1">{data.ticketCount} billets vendus</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Building className="w-5 h-5 text-purple-600" />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Reversement sociétés</span>
              </div>
              <p className="text-2xl font-bold dark:text-white">{formatFCFA(data.companyReversal)}</p>
              <p className="text-xs text-gray-400 mt-1">{100 - FASOTRAVEL_MODEL.commissionRate}% du prix billet</p>
            </div>

            <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-5">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-10 h-10 rounded-lg bg-yellow-100 flex items-center justify-center">
                  <Calendar className="w-5 h-5 text-yellow-600" />
                </div>
                <span className="text-sm text-gray-500 dark:text-gray-400">Marge nette</span>
              </div>
              <p className="text-2xl font-bold dark:text-white">{formatFCFA(data.netMargin)}</p>
              <p className="text-xs mt-1">
                <span className={data.growthRate >= 0 ? 'text-green-500' : 'text-red-500'}>
                  {data.growthRate >= 0 ? '+' : ''}{data.growthRate.toFixed(1)}%
                </span>
                <span className="text-gray-400"> vs période précédente</span>
              </p>
            </div>
          </div>

          {/* Payment channels table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                <CreditCard className="w-5 h-5 text-gray-400" />
                Canaux de paiement — {PERIOD_LABELS[period]}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                    <th className="px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Canal</th>
                    <th className="px-5 py-3 text-gray-500 dark:text-gray-400 font-medium text-right">Transactions</th>
                    <th className="px-5 py-3 text-gray-500 dark:text-gray-400 font-medium text-right">Montant total</th>
                    <th className="px-5 py-3 text-gray-500 dark:text-gray-400 font-medium text-right">Moy. / tx</th>
                  </tr>
                </thead>
                <tbody>
                  {data.platformChannels.map(ch => (
                    <tr key={ch.method} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="px-5 py-3 dark:text-gray-300 capitalize">{ch.method.replace(/_/g, ' ')}</td>
                      <td className="px-5 py-3 dark:text-gray-300 text-right">{ch.transactionCount.toLocaleString('fr-FR')}</td>
                      <td className="px-5 py-3 dark:text-gray-300 text-right">{formatFCFA(ch.totalAmount)}</td>
                      <td className="px-5 py-3 dark:text-gray-300 text-right">{formatFCFA(ch.averageAmount)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Top companies table */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow">
            <div className="p-5 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-semibold dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-gray-400" />
                Top sociétés de transport — {PERIOD_LABELS[period]}
              </h2>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-200 dark:border-gray-700 text-left">
                    <th className="px-5 py-3 text-gray-500 dark:text-gray-400 font-medium">Société</th>
                    <th className="px-5 py-3 text-gray-500 dark:text-gray-400 font-medium text-right">Revenus</th>
                    <th className="px-5 py-3 text-gray-500 dark:text-gray-400 font-medium text-right">Billets</th>
                    <th className="px-5 py-3 text-gray-500 dark:text-gray-400 font-medium text-right">Part (%)</th>
                  </tr>
                </thead>
                <tbody>
                  {data.companies.map((c: any) => (
                    <tr key={c.companyId} className="border-b border-gray-100 dark:border-gray-700/50">
                      <td className="px-5 py-3 dark:text-gray-300">{c.companyName}</td>
                      <td className="px-5 py-3 dark:text-gray-300 text-right">{formatFCFA(c.totalRevenue)}</td>
                      <td className="px-5 py-3 dark:text-gray-300 text-right">{c.transactionCount.toLocaleString('fr-FR')}</td>
                      <td className="px-5 py-3 dark:text-gray-300 text-right">
                        {data.totalRevenue > 0 ? ((c.totalRevenue / data.totalRevenue) * 100).toFixed(1) : '0'}%
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow p-12 text-center">
          <p className="text-gray-500 dark:text-gray-400">Aucune donnée disponible</p>
        </div>
      )}
    </div>
  );
}
