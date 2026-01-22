import { LucideIcon, TrendingUp, TrendingDown, Minus } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string;
  change: string;
  trend: 'up' | 'down' | 'neutral';
  icon: LucideIcon;
  color: 'red' | 'yellow' | 'green' | 'blue';
  subtitle?: string;
}

const colorClasses = {
  red: {
    bg: 'from-red-500 to-red-600',
    border: 'border-[#dc2626]',
    text: 'text-[#dc2626]',
    lightBg: 'bg-red-50 dark:bg-red-900/20'
  },
  yellow: {
    bg: 'from-yellow-500 to-yellow-600',
    border: 'border-[#f59e0b]',
    text: 'text-[#f59e0b]',
    lightBg: 'bg-yellow-50 dark:bg-yellow-900/20'
  },
  green: {
    bg: 'from-green-500 to-green-600',
    border: 'border-[#16a34a]',
    text: 'text-[#16a34a]',
    lightBg: 'bg-green-50 dark:bg-green-900/20'
  },
  blue: {
    bg: 'from-blue-500 to-blue-600',
    border: 'border-blue-500',
    text: 'text-blue-600',
    lightBg: 'bg-blue-50 dark:bg-blue-900/20'
  }
};

export default function StatCard({ title, value, change, trend, icon: Icon, color, subtitle }: StatCardProps) {
  const colors = colorClasses[color];

  const TrendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus;
  const trendColor = trend === 'up' ? 'text-green-600 dark:text-green-400' : trend === 'down' ? 'text-red-600 dark:text-red-400' : 'text-gray-600 dark:text-gray-400';
  const trendBg = trend === 'up' ? 'bg-green-50 dark:bg-green-900/20' : trend === 'down' ? 'bg-red-50 dark:bg-red-900/20' : 'bg-gray-50 dark:bg-gray-800';

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-2xl shadow-lg overflow-hidden border-l-4 ${colors.border} hover:shadow-xl transition-shadow`}>
      <div className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {title}
            </p>
            <h3 className="text-3xl font-bold text-gray-900 dark:text-white">
              {value}
            </h3>
            {subtitle && (
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {subtitle}
              </p>
            )}
          </div>
          
          <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${colors.bg} flex items-center justify-center flex-shrink-0`}>
            <Icon className="text-white" size={24} />
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${trendBg} ${trendColor}`}>
            <TrendIcon size={14} />
            <span>{change}</span>
          </div>
        </div>
      </div>
    </div>
  );
}

