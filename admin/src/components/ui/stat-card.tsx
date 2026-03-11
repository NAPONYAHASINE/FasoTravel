import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  color?: 'red' | 'yellow' | 'green' | 'blue' | 'purple' | 'gray';
  trend?: {
    value: number;
    label: string;
  };
  children?: ReactNode;
}

const colorConfig = {
  red: {
    border: 'border-[#dc2626]',
    text: 'text-[#dc2626]'
  },
  yellow: {
    border: 'border-[#f59e0b]',
    text: 'text-[#f59e0b]'
  },
  green: {
    border: 'border-[#16a34a]',
    text: 'text-[#16a34a]'
  },
  blue: {
    border: 'border-[#3b82f6]',
    text: 'text-[#3b82f6]'
  },
  purple: {
    border: 'border-[#9333ea]',
    text: 'text-[#9333ea]'
  },
  gray: {
    border: 'border-gray-400',
    text: 'text-gray-600'
  }
};

export function StatCard({ 
  title, 
  value, 
  subtitle, 
  icon: Icon, 
  color = 'gray',
  trend,
  children 
}: StatCardProps) {
  const colors = colorConfig[color];

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-xl shadow-md p-6 border-l-4 ${colors.border} transition-colors`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm text-gray-600 dark:text-gray-400">{title}</p>
        {Icon && <Icon className={colors.text} size={20} />}
      </div>
      <p className={`text-3xl ${colors.text}`}>{value}</p>
      {subtitle && <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{subtitle}</p>}
      {trend && (
        <div className="mt-2 flex items-center gap-1">
          <span className={trend.value >= 0 ? 'text-xs text-green-600 dark:text-green-400' : 'text-xs text-red-600 dark:text-red-400'}>
            {trend.value >= 0 ? '↑' : '↓'} {Math.abs(trend.value)}%
          </span>
          <span className="text-xs text-gray-500 dark:text-gray-400">{trend.label}</span>
        </div>
      )}
      {children}
    </div>
  );
}