/**
 * @file AnalyticsPage.tsx
 * @description Analytics et statistiques
 */

import { useApp } from '../../contexts/AppContext';
import { Card, StatCard } from '../../components/ui';
import { TrendingUp, Users, Ticket, DollarSign } from 'lucide-react';
import { formatCurrency } from '../../utils/formatters';

export default function AnalyticsPage() {
  const { dashboardStats } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Analytics & Statistiques</h1>
        <p className="text-gray-600 mt-1">Vue d'ensemble des performances</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          title="Revenus totaux"
          value={formatCurrency(dashboardStats?.totalRevenue || 0)}
          icon={<DollarSign className="w-6 h-6 text-green-600" />}
          iconBgColor="bg-green-100"
        />
        <StatCard
          title="Passagers totaux"
          value={dashboardStats?.totalPassengers || 0}
          icon={<Users className="w-6 h-6 text-blue-600" />}
          iconBgColor="bg-blue-100"
        />
        <StatCard
          title="Billets vendus"
          value={dashboardStats?.totalBookings || 0}
          icon={<Ticket className="w-6 h-6 text-fasotravel-yellow" />}
          iconBgColor="bg-yellow-100"
        />
        <StatCard
          title="Voyages actifs"
          value={dashboardStats?.activeTrips || 0}
          icon={<TrendingUp className="w-6 h-6 text-fasotravel-red" />}
          iconBgColor="bg-red-100"
        />
      </div>

      <Card title="Graphiques">
        <p className="text-gray-600 text-center py-12">
          Graphiques détaillés à implémenter (recharts)
        </p>
      </Card>
    </div>
  );
}
