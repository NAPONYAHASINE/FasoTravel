/**
 * Composant réutilisable pour afficher le classement des sociétés
 * Zéro duplication - Peut afficher par revenus ou par véhicules
 */

import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { TrendingUp, Activity } from 'lucide-react';
import { CompanyRevenue } from '../../types/financial';

export interface TopCompaniesChartProps {
  data: CompanyRevenue[] | Array<{ name: string; value: number; id: string }>;
  title: string;
  subtitle: string;
  metric: 'revenue' | 'vehicles' | 'custom';
  theme?: 'light' | 'dark';
  height?: number;
  color?: string;
  chartId?: string; // Unique ID to prevent recharts duplicate key warnings
}

/**
 * Graphique du top des sociétés (revenus, véhicules, etc.)
 */
export function TopCompaniesChart({
  data,
  title,
  subtitle,
  metric,
  theme = 'light',
  height = 300,
  color = '#10b981',
  chartId,
}: TopCompaniesChartProps) {
  // Prépare les données pour le graphique
  const chartData = data.map((item, index) => {
    if ('totalRevenue' in item) {
      // CompanyRevenue
      const label = item.companyName.length > 15 ? item.companyName.slice(0, 15) + '...' : item.companyName;
      return {
        name: `${label}_${index}`, // Unique key for recharts
        label,
        value: metric === 'revenue' ? item.totalRevenue : item.transactionCount,
      };
    } else {
      // Format custom
      const label = item.name.length > 15 ? item.name.slice(0, 15) + '...' : item.name;
      return {
        name: `${label}_${index}`, // Unique key for recharts
        label,
        value: item.value,
      };
    }
  });

  const isDark = theme === 'dark';
  const gridColor = isDark ? '#374151' : '#f0f0f0';
  const axisColor = isDark ? '#9ca3af' : '#9ca3af';
  const tooltipBg = isDark ? '#1f2937' : 'white';
  const tooltipBorder = isDark ? '#374151' : '#e5e7eb';
  const tooltipColor = isDark ? '#f9fafb' : '#111827';

  // Formatter selon le type de métrique
  const formatYAxis = (value: number) => {
    if (metric === 'revenue') {
      return `${(value / 1000).toFixed(0)}K`;
    }
    return value.toString();
  };

  const formatTooltip = (value: any) => {
    if (metric === 'revenue') {
      return [`${(value / 1000).toFixed(0)}K FCFA`, 'Revenus générés'];
    }
    return [value, metric === 'vehicles' ? 'Véhicules' : 'Valeur'];
  };

  const Icon = metric === 'revenue' ? TrendingUp : Activity;

  return (
    <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700 transition-colors">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-xl text-gray-900 dark:text-white mb-1">{title}</h3>
          <p className="text-sm text-gray-600 dark:text-gray-400">{subtitle}</p>
        </div>
        <Icon className="h-5 w-5 text-gray-400 dark:text-gray-500" />
      </div>
      
      <ResponsiveContainer width="100%" height={height}>
        <BarChart data={chartData} id={chartId}>
          <CartesianGrid key={`${chartId}-grid`} strokeDasharray="3 3" stroke={gridColor} />
          <XAxis 
            key={`${chartId}-xaxis`}
            dataKey="name" 
            stroke={axisColor} 
            style={{ fontSize: '11px' }} 
            angle={-15} 
            textAnchor="end" 
            height={80}
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
          <Bar 
            key={`${chartId}-bar`}
            dataKey="value" 
            fill={color} 
            radius={[8, 8, 0, 0]} 
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}