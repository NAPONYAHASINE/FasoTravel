import { useState, useMemo } from 'react';
import { TrendingUp, TrendingDown, Bus, Users, MapPin, AlertCircle, Clock, DollarSign, Calendar, ArrowUpRight, Activity, Smartphone, Store } from "lucide-react@0.487.0";
import { useNavigate } from 'react-router-dom';
import { useData } from '../../contexts/DataContext';
import StatCard from '../../components/dashboard/StatCard';
import SalesChannelCard from '../../components/dashboard/SalesChannelCard';
import RecentTripsTable from '../../components/dashboard/RecentTripsTable';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Progress } from '../../components/ui/progress';
import { Badge } from '../../components/ui/badge';
import { toast } from 'sonner@2.0.3';
import { useRevenueStats, useOccupancyStats, useTripStats, useLast7DaysSales } from '../../hooks/useDashboardStats';
import { formatAmount, getActiveAndUpcomingTrips } from '../../utils/statsUtils';
import { getToday, formatTime } from '../../utils/dateUtils';

export default function DashboardHome() {
  const navigate = useNavigate();
  const { trips, tickets, stations, incidents, getAnalytics } = useData();
  const analytics = getAnalytics();

  // Use custom hooks for stats calculations
  const { todayRevenue, revenueChange, revenueTrend, revenueChangeFormatted } = useRevenueStats(tickets);
  const { todayOccupancy, occupancyChange, occupancyTrend, occupancyChangeFormatted } = useOccupancyStats(trips);
  const { activeTrips, activeTripsCount, upcomingTrips, upcomingTripsCount } = useTripStats(trips, 6);
  const last7DaysSales = useLast7DaysSales(tickets);

  // Stats principales
  const stats = [
    {
      title: 'Départs Actifs',
      value: activeTripsCount.toString(),
      change: `${activeTripsCount} en cours`,
      trend: 'neutral' as const,
      icon: Bus,
      color: 'red' as const,
      subtitle: 'En cours maintenant'
    },
    {
      title: 'Prochains Départs',
      value: upcomingTripsCount.toString(),
      change: "Aujourd'hui",
      trend: 'neutral' as const,
      icon: Calendar,
      color: 'yellow' as const,
      subtitle: 'Dans les 6h'
    },
    {
      title: 'Taux de Remplissage',
      value: `${todayOccupancy}%`,
      change: occupancyChangeFormatted,
      trend: occupancyTrend,
      icon: TrendingUp,
      color: 'green' as const,
      subtitle: 'vs hier'
    },
    {
      title: 'Revenus du Jour',
      value: formatAmount(todayRevenue, 'M'),
      change: revenueChangeFormatted,
      trend: revenueTrend,
      icon: DollarSign,
      color: 'green' as const,
      subtitle: 'FCFA'
    }
  ];

  // Calculate station stats
  const garesStats = useMemo(() => {
    const today = getToday();
    
    return stations.map(station => {
      const stationTickets = tickets.filter(t => {
        const purchaseDate = new Date(t.purchaseDate);
        return t.gareId === station.id && purchaseDate >= today && (t.status === 'valid' || t.status === 'used');
      });

      // ✅ Utilise la fonction centralisée pour cohérence avec dashboard Manager
      const stationTripsFiltered = trips.filter(t => t.gareId === station.id);
      const stationActiveTrips = getActiveAndUpcomingTrips(stationTripsFiltered);

      return {
        id: station.id,
        name: station.name,
        online: station.status === 'active',
        ventes: stationTickets.length,
        cars: stationActiveTrips.length
      };
    });
  }, [stations, tickets, trips]);

  // Get active incidents
  const activeIncidents = useMemo(() => {
    // ✅ COHÉRENT avec IncidentsPage: incidents en attente de validation + enrichis avec données trip
    return incidents
      .filter(i => i.validationStatus === 'pending') // En attente de validation
      .map(incident => {
        const trip = trips.find(t => t.id === incident.tripId);
        return {
          ...incident,
          route: trip ? `${trip.departure} → ${trip.arrival}` : 'N/A',
          busNumber: trip?.busNumber || 'N/A',
          departureTime: trip?.departureTime || ''
        };
      });
  }, [incidents, trips]);

  const handleExportData = () => {
    // Generate CSV data
    const csvData = last7DaysSales.map(day => 
      `${day.day},${day.online},${day.guichet},${day.total}`
    ).join('\n');
    
    const csv = `Jour,Ventes Online,Ventes Guichets,Total\n${csvData}`;
    
    // Create blob and download
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ventes-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
    
    toast.success('Données exportées avec succès');
  };

  return (
    <div className="space-y-6">
      {/* Stats principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, index) => (
          <StatCard key={index} {...stat} />
        ))}
      </div>

      {/* 🚨 CRITIQUE: Canal de Vente - Business Model FasoTravel */}
      <SalesChannelCard tickets={tickets} />

      {/* Graphique + Gares */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Graphique des ventes */}
        <div className="lg:col-span-2 bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Ventes des 7 derniers jours
              </h3>
              <p className="text-sm text-gray-600 dark:text-gray-400">
                Online vs Guichets
              </p>
            </div>
            <button 
              onClick={handleExportData}
              className="px-4 py-2 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors text-gray-900 dark:text-white"
            >
              Exporter
            </button>
          </div>

          {/* Graphique simulé avec barres */}
          <div className="space-y-4">
            {last7DaysSales.map((dayData) => {
              const { day, online, guichet, total } = dayData;

              return (
                <div key={day}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-12">
                      {day}
                    </span>
                    <div className="flex-1 mx-4">
                      <div className="flex h-8 rounded-lg overflow-hidden bg-gray-100 dark:bg-gray-700">
                        {total > 0 ? (
                          <>
                            <div
                              className="bg-[#dc2626] transition-all"
                              style={{ width: `${(online / total) * 100}%` }}
                              title={`Online: ${online}`}
                            ></div>
                            <div
                              className="bg-[#f59e0b] transition-all"
                              style={{ width: `${(guichet / total) * 100}%` }}
                              title={`Guichet: ${guichet}`}
                            ></div>
                          </>
                        ) : (
                          <div className="w-full bg-gray-200 dark:bg-gray-600"></div>
                        )}
                      </div>
                    </div>
                    <span className="text-sm text-gray-600 dark:text-gray-400 w-16 text-right">
                      {total}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          <div className="flex items-center gap-6 mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#dc2626] rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Ventes Online</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 bg-[#f59e0b] rounded"></div>
              <span className="text-sm text-gray-600 dark:text-gray-400">Ventes Guichets</span>
            </div>
          </div>
        </div>

        {/* État des gares */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-6">
            État des Gares
          </h3>

          <div className="space-y-4">
            {garesStats.map((gare) => (
              <div
                key={gare.id}
                className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-[#f59e0b] dark:hover:border-[#f59e0b] transition-colors cursor-pointer"
                onClick={() => navigate('/responsable/gares')}
              >
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <MapPin size={16} className="text-gray-500 dark:text-gray-400" />
                    <span className="font-medium text-gray-900 dark:text-white">
                      {gare.name}
                    </span>
                  </div>
                  <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs ${
                    gare.online
                      ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                      : 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400'
                  }`}>
                    <Activity size={12} />
                    {gare.online ? 'Online' : 'Offline'}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mt-3">
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Ventes</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {gare.ventes}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 dark:text-gray-400">Départs actifs</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-white">
                      {gare.cars}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button 
            onClick={() => navigate('/responsable/gares')}
            className="w-full mt-4 py-2 text-sm text-[#f59e0b] hover:text-[#d97706] font-medium flex items-center justify-center gap-2"
          >
            Voir toutes les gares
            <ArrowUpRight size={16} />
          </button>
        </div>
      </div>

      {/* Incidents & Trajets récents */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Incidents */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
              <AlertCircle className="text-[#dc2626]" size={24} />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                Incidents en Attente
              </h3>
            </div>
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-400 rounded-full text-sm font-medium">
                {activeIncidents.length}
              </span>
              <button
                onClick={() => navigate('/responsable/incidents')}
                className="text-sm text-[#f59e0b] hover:text-[#d97706] font-medium"
              >
                Voir tout
              </button>
            </div>
          </div>

          <div className="space-y-3">
            {activeIncidents.slice(0, 5).map((incident) => {
              const typeInfo = (() => {
                switch (incident.type) {
                  case 'delay':
                    return { label: 'Retard', color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' };
                  case 'breakdown':
                    return { label: 'Panne', color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' };
                  case 'accident':
                    return { label: 'Accident', color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' };
                  default:
                    return { label: 'Autre', color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' };
                }
              })();

              return (
                <div
                  key={incident.id}
                  onClick={() => navigate('/responsable/incidents')}
                  className="p-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700/50 hover:border-[#f59e0b] dark:hover:border-[#f59e0b] transition-all cursor-pointer"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h3 className="font-semibold text-gray-900 dark:text-white">
                        {incident.title}
                      </h3>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {incident.route} • {incident.gareName}
                      </p>
                    </div>
                    <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                      <Clock size={14} />
                      {formatTime(incident.reportedAt)}
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-600">
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Route</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {incident.route}
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 dark:text-gray-400">Bus</p>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">
                        {incident.busNumber}
                      </p>
                    </div>
                  </div>
                  
                  <div className="mt-2">
                    <p className="text-xs text-gray-500 dark:text-gray-400">Gare</p>
                    <p className="text-sm text-gray-700 dark:text-gray-300">
                      {incident.gareName}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>

          {activeIncidents.length === 0 && (
            <div className="text-center py-8 text-gray-500 dark:text-gray-400">
              <AlertCircle size={48} className="mx-auto mb-2 opacity-20" />
              <p>Aucun incident en attente</p>
              <p className="text-xs mt-1">Tous les incidents ont été traités</p>
            </div>
          )}
          
          {activeIncidents.length > 5 && (
            <button
              onClick={() => navigate('/responsable/incidents')}
              className="w-full mt-4 py-2 text-sm text-[#f59e0b] hover:text-[#d97706] font-medium flex items-center justify-center gap-2 border-t border-gray-200 dark:border-gray-700 pt-4"
            >
              Voir les {activeIncidents.length - 5} autres incidents
              <ArrowUpRight size={16} />
            </button>
          )}
        </div>

        {/* Trajets récents */}
        <RecentTripsTable trips={trips} />
      </div>
    </div>
  );
}