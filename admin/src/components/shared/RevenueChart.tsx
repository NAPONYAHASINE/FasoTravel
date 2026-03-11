/**
 * Composant réutilisable pour les graphiques de revenus
 * Zéro duplication - Chart configurable et réutilisable
 */

import React from 'react';
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { DollarSign, TrendingUp } from 'lucide-react';
import { DailyRevenue, TimePeriod } from '../../types/financial';

export interface RevenueChartProps {
  data: DailyRevenue[];
  type?: 'line' | 'bar';
  title: string;
  subtitle?: string;
  growth?: number;
  theme?: 'light' | 'dark';
  height?: number;
  showGrowthBadge?: boolean;
  color?: string;
  period?: TimePeriod; // 🔥 NEW: Pour adapter le format d'affichage
  chartId?: string; // Unique ID to prevent recharts duplicate key warnings
}

/**
 * Graphique de revenus configurable
 */
export function RevenueChart({
  data,
  type = 'line',
  title,
  subtitle,
  growth,
  theme = 'light',
  height = 300,
  showGrowthBadge = true,
  color = '#10b981',
  period = TimePeriod.WEEK, // 🔥 NEW: Défaut = semaine
  chartId,
}: RevenueChartProps) {
  // Formatter pour l'axe Y
  const formatYAxis = (value: number) => `${(value / 1000).toFixed(0)}K`;
  
  // Formatter pour le tooltip
  const formatTooltip = (value: any) => [`${(value / 1000).toFixed(0)}K FCFA`, 'Revenus'];

  /**
   * 🔥 FORMAT ADAPTATIF selon la période
   */
  const formatXAxis = (date: Date): string => {
    if (period === TimePeriod.TODAY) {
      // Aujourd'hui = heures simples (0h, 2h, 4h...)
      const hour = new Date(date).getHours();
      return `${hour}h`;
    } else if (period === TimePeriod.WEEK) {
      // Cette semaine = jours courts (Lun, Mar...)
      return new Date(date).toLocaleDateString('fr-FR', { weekday: 'short' });
    } else if (period === TimePeriod.MONTH) {
      // Ce mois = dates (1, 5, 10...)
      return new Date(date).toLocaleDateString('fr-FR', { day: 'numeric' });
    } else {
      // Cette année = mois (Jan, Fév...)
      return new Date(date).toLocaleDateString('fr-FR', { month: 'short' });
    }
  };

  // Prépare les données pour le graphique
  const chartData = data.map((item, index) => {
    const label = formatXAxis(item.date);
    return {
      id: index,
      name: `${label}_${index}`, // Unique key for recharts
      label, // Display label
      revenus: item.revenue,
      transactions: item.transactionCount,
    };
  });

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#374151' : '#f0f0f0';
  const axisColor = isDark ? '#9ca3af' : '#9ca3af';
  const tooltipBg = isDark ? '#1f2937' : 'white';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';
  const tooltipColor = isDark ? '#f9fafb' : '#111827';

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl text-gray-900 dark:text-white mb-1">{title}</h3>
          {subtitle && (
            <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
          )}
        </div>
        {showGrowthBadge && growth !== undefined && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-xl">
            <DollarSign className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
            <span className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">
              {growth > 0 ? '+' : ''}{growth.toFixed(1)}%
            </span>
          </div>
        )}
        {!showGrowthBadge && (
          <TrendingUp className="h-5 w-5 text-emerald-500" />
        )}
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        {type === 'line' ? (
          <LineChart data={chartData} id={chartId}>
            <CartesianGrid key={`${chartId}-grid`} strokeDasharray="3 3" stroke={gridColor} />
            <XAxis 
              key={`${chartId}-xaxis`}
              dataKey="name" 
              stroke={axisColor} 
              style={{ fontSize: '12px' }}
              tickFormatter={(value: string) => value.split('_')[0]}
            />
            <YAxis 
              key={`${chartId}-yaxis`}
              stroke={axisColor} 
              style={{ fontSize: '12px' }}
              tickFormatter={formatYAxis}
            />
            <Tooltip 
              key={`${chartId}-tooltip`}
              contentStyle={{ 
                backgroundColor: tooltipBg, 
                border: `1px solid ${tooltipBorder}`,
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                color: tooltipColor
              }}
              formatter={formatTooltip}
              labelFormatter={(label: string) => label.split('_')[0]}
            />
            <Line 
              key={`${chartId}-line`}
              type="monotone" 
              dataKey="revenus" 
              stroke={color} 
              strokeWidth={3} 
              name="Revenus" 
              dot={{ fill: color, r: 4 }} 
            />
          </LineChart>
        ) : (
          <BarChart data={chartData} id={chartId ? `${chartId}-bar` : undefined}>
            <CartesianGrid key={`${chartId}-bar-grid`} strokeDasharray="3 3" stroke={gridColor} />
            <XAxis 
              key={`${chartId}-bar-xaxis`}
              dataKey="name" 
              stroke={axisColor} 
              style={{ fontSize: '12px' }}
              tickFormatter={(value: string) => value.split('_')[0]}
            />
            <YAxis 
              key={`${chartId}-bar-yaxis`}
              stroke={axisColor} 
              style={{ fontSize: '12px' }}
              tickFormatter={formatYAxis}
            />
            <Tooltip 
              key={`${chartId}-bar-tooltip`}
              contentStyle={{ 
                backgroundColor: tooltipBg, 
                border: `1px solid ${tooltipBorder}`,
                borderRadius: '12px',
                boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                color: tooltipColor
              }}
              formatter={formatTooltip}
              labelFormatter={(label: string) => label.split('_')[0]}
            />
            <Bar 
              key={`${chartId}-bar-data`}
              dataKey="revenus" 
              fill={color} 
              radius={[8, 8, 0, 0]} 
            />
          </BarChart>
        )}
      </ResponsiveContainer>
    </div>
  );
}