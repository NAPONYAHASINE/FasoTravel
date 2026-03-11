/**
 * @file Dashboard.tsx
 * @description Main dashboard with routing for all roles
 * 
 * MIGRATED: Uses @shared types and role-based routing
 */

import { useState } from 'react';
import { useApp } from '../contexts/AppContext';
import { 
  LayoutDashboard, 
  Bus, 
  Ticket, 
  MapPin, 
  Route as RouteIcon,
  AlertTriangle,
  Users,
  LogOut,
  Menu,
  X,
  BarChart,
  DollarSign,
  Wallet
} from 'lucide-react';

// Import pages by role
import * as ResponsablePages from './responsable';
import * as ManagerPages from './manager';
import * as CaissierPages from './caissier';

type Page = {
  id: string;
  component: React.ComponentType;
};

export default function Dashboard() {
  const { currentUser, logout, dashboardStats } = useApp();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [currentPageId, setCurrentPageId] = useState('home');

  // Define pages by role
  const getPages = (): { id: string; label: string; icon: React.ComponentType<{ className?: string; size?: number }>; component: React.ComponentType; roles: string[] }[] => {
    return [
      // Common
      { id: 'home', label: 'Accueil', icon: LayoutDashboard, component: HomePage, roles: ['responsable', 'manager', 'caissier'] },
      
      // Responsable pages
      { id: 'routes', label: 'Trajets', icon: RouteIcon, component: ResponsablePages.RoutesPage, roles: ['responsable'] },
      { id: 'stations', label: 'Gares', icon: MapPin, component: ResponsablePages.StationsPage, roles: ['responsable'] },
      { id: 'trips', label: 'Voyages', icon: Bus, component: ResponsablePages.TripsPage, roles: ['responsable'] },
      { id: 'tickets', label: 'Billets', icon: Ticket, component: ResponsablePages.TicketsPage, roles: ['responsable'] },
      { id: 'incidents', label: 'Incidents', icon: AlertTriangle, component: ResponsablePages.IncidentsPage, roles: ['responsable'] },
      { id: 'staff', label: 'Personnel', icon: Users, component: ResponsablePages.StaffPage, roles: ['responsable'] },
      { id: 'analytics', label: 'Analytics', icon: BarChart, component: ResponsablePages.AnalyticsPage, roles: ['responsable'] },
      
      // Manager pages
      { id: 'departures', label: 'Départs', icon: Bus, component: ManagerPages.DeparturesPage, roles: ['manager'] },
      { id: 'sales', label: 'Ventes', icon: DollarSign, component: ManagerPages.SalesPage, roles: ['manager'] },
      
      // Caissier pages
      { id: 'sell', label: 'Vendre', icon: Ticket, component: CaissierPages.SellTicketPage, roles: ['caissier'] },
      { id: 'cash', label: 'Caisse', icon: Wallet, component: CaissierPages.CashDrawerPage, roles: ['caissier'] }
    ];
  };

  const allPages = getPages();
  const navigationItems = allPages.filter(page => page.roles.includes(currentUser?.role || ''));
  const CurrentPageComponent = allPages.find(p => p.id === currentPageId)?.component || HomePage;

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-white border-r border-gray-200 transition-all duration-300 flex flex-col`}
      >
        {/* Header */}
        <div className="h-16 border-b border-gray-200 flex items-center justify-between px-4">
          {sidebarOpen && (
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-gradient-to-br from-fasotravel-red via-fasotravel-yellow to-fasotravel-green rounded-lg"></div>
              <span className="font-bold text-gray-900">FasoTravel</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            {sidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 p-4 space-y-2">
          {navigationItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setCurrentPageId(item.id)}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg transition-all ${
                currentPageId === item.id
                  ? 'bg-fasotravel-red text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <item.icon className="w-5 h-5 flex-shrink-0" />
              {sidebarOpen && <span className="text-sm font-medium">{item.label}</span>}
            </button>
          ))}
        </nav>

        {/* User Info */}
        <div className="border-t border-gray-200 p-4">
          {sidebarOpen ? (
            <div className="space-y-2">
              <div className="px-4 py-2 bg-gray-50 rounded-lg">
                <p className="text-xs text-gray-500">Connecté en tant que</p>
                <p className="text-sm font-semibold text-gray-900">{currentUser?.name}</p>
                <p className="text-xs text-gray-600 capitalize">{currentUser?.role}</p>
                {currentUser?.gareName && (
                  <p className="text-xs text-gray-500">{currentUser.gareName}</p>
                )}
              </div>
              <button
                onClick={logout}
                className="w-full flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="text-sm font-medium">Déconnexion</span>
              </button>
            </div>
          ) : (
            <button
              onClick={logout}
              className="w-full p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5 mx-auto" />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 p-8 overflow-auto">
        <div className="max-w-7xl mx-auto">
          <CurrentPageComponent />
        </div>
      </main>
    </div>
  );
}

// HomePage component
function HomePage() {
  const { currentUser, dashboardStats, trips, tickets, incidents } = useApp();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Tableau de bord</h1>
        <p className="text-gray-600 mt-1">Bienvenue, {currentUser?.name}</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Stats Cards */}
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center">
              <Bus className="w-6 h-6 text-fasotravel-red" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {dashboardStats?.activeTrips || trips.filter(t => t.status === 'in-progress').length}
          </p>
          <p className="text-sm text-gray-600">Voyages actifs</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-yellow-100 rounded-lg flex items-center justify-center">
              <Ticket className="w-6 h-6 text-fasotravel-yellow" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {dashboardStats?.todayBookings || tickets.length}
          </p>
          <p className="text-sm text-gray-600">Billets aujourd'hui</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <Users className="w-6 h-6 text-fasotravel-green" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {dashboardStats?.todayPassengers || 0}
          </p>
          <p className="text-sm text-gray-600">Passagers aujourd'hui</p>
        </div>

        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
          <div className="flex items-center justify-between mb-4">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">
            {dashboardStats?.pendingIncidents || incidents.filter(i => i.status !== 'resolved').length}
          </p>
          <p className="text-sm text-gray-600">Incidents en cours</p>
        </div>
      </div>

      {/* Role-specific message */}
      <div className="bg-gradient-to-r from-fasotravel-red via-fasotravel-yellow to-fasotravel-green p-1 rounded-xl">
        <div className="bg-white p-6 rounded-lg">
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            {currentUser?.role === 'responsable' && 'Accès Responsable'}
            {currentUser?.role === 'manager' && 'Accès Manager de Gare'}
            {currentUser?.role === 'caissier' && 'Accès Caissier'}
          </h2>
          <p className="text-gray-600">
            {currentUser?.role === 'responsable' && 'Vous avez accès à toutes les fonctionnalités du système.'}
            {currentUser?.role === 'manager' && `Gestion de la gare ${currentUser.gareName}.`}
            {currentUser?.role === 'caissier' && `Point de vente - ${currentUser.gareName}.`}
          </p>
        </div>
      </div>
    </div>
  );
}