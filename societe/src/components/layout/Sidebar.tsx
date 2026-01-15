import { Bus, LayoutDashboard, Map, Ticket, Settings, Users, TrendingUp, Calendar, MessageSquare, HelpCircle, LogOut, ChevronLeft, ChevronRight, Building2, MapPin, DollarSign, BarChart3, Image, Star, Clock, Ban, AlertTriangle } from "lucide-react@0.487.0";
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { useState } from 'react';
import logoImage from "figma:asset/ddaf4c7eb0e28936f4d0223e859065e25d5c3fc8.png";

interface MenuItem {
  icon: React.ElementType;
  label: string;
  path: string;
  badge?: string;
}

interface SidebarProps {
  role: 'responsable' | 'manager' | 'caissier';
}

export default function Sidebar({ role }: SidebarProps) {
  const location = useLocation();
  const { user, logout } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  const menuItems: Record<string, MenuItem[]> = {
    responsable: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/responsable' },
      { icon: Map, label: 'Carte & Trafic', path: '/responsable/trafic' },
      { icon: Calendar, label: 'Lignes & Trajets', path: '/responsable/lignes' },
      { icon: Clock, label: 'Horaires', path: '/responsable/horaires' },
      { icon: DollarSign, label: 'Tarification', path: '/responsable/tarification' },
      { icon: Building2, label: 'Gares', path: '/responsable/gares' },
      { icon: Users, label: 'Managers', path: '/responsable/managers' },
      { icon: Image, label: 'Stories', path: '/responsable/stories' },
      { icon: Star, label: 'Avis Clients', path: '/responsable/avis' },
      { icon: AlertTriangle, label: 'Incidents', path: '/responsable/incidents' },
      { icon: BarChart3, label: 'Analytics', path: '/responsable/analytics' },
      { icon: Settings, label: 'Politiques', path: '/responsable/politiques' },
      { icon: HelpCircle, label: 'Support', path: '/responsable/support' }
    ],
    manager: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/manager' },
      { icon: Map, label: 'Carte Locale', path: '/manager/carte' },
      { icon: Users, label: 'Caissiers', path: '/manager/caissiers' },
      { icon: Ticket, label: 'Ventes', path: '/manager/ventes' },
      { icon: Calendar, label: 'Départs du Jour', path: '/manager/departs' },
      { icon: MessageSquare, label: 'Incidents', path: '/manager/incidents' },
      { icon: HelpCircle, label: 'Support', path: '/manager/support' }
    ],
    caissier: [
      { icon: LayoutDashboard, label: 'Dashboard', path: '/caissier' },
      { icon: Ticket, label: 'Vente Billet', path: '/caissier/vente' },
      { icon: DollarSign, label: 'Ma Caisse', path: '/caissier/caisse' },
      { icon: Calendar, label: 'Listes Passagers', path: '/caissier/listes' },
      { icon: Ban, label: 'Annulation', path: '/caissier/annulation' },
      { icon: TrendingUp, label: 'Mon Historique', path: '/caissier/historique' },
      { icon: MessageSquare, label: 'Signaler', path: '/caissier/signalement' }
    ]
  };

  const items = menuItems[role] || [];

  const isActive = (path: string) => {
    if (path === `/${role}`) {
      return location.pathname === path;
    }
    return location.pathname.startsWith(path);
  };

  return (
    <aside 
      className={`fixed left-0 top-0 h-full bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-800 transition-all duration-300 z-40 flex flex-col ${
        isCollapsed ? 'w-20' : 'w-64'
      }`}
    >
      {/* Header avec logo */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-800 relative flex-shrink-0">
        {!isCollapsed ? (
          <div className="flex items-center gap-3">
            <img 
              src={logoImage}
              alt="FasoTravel Logo"
              className="w-12 h-12 object-contain flex-shrink-0"
            />
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold tf-gradient-text truncate">
                FasoTravel
              </h1>
              <p className="text-xs text-gray-600 dark:text-gray-400 truncate">
                {role === 'responsable' ? 'Responsable' : role === 'manager' ? 'Manager' : 'Caissier'}
              </p>
            </div>
          </div>
        ) : (
          <img 
            src={logoImage}
            alt="FasoTravel Logo"
            className="w-10 h-10 object-contain mx-auto"
          />
        )}

        {/* Toggle button */}
        <button
          onClick={() => setIsCollapsed(!isCollapsed)}
          className="absolute -right-3 top-8 w-6 h-6 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-full flex items-center justify-center hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          {isCollapsed ? (
            <ChevronRight size={14} className="text-gray-600 dark:text-gray-400" />
          ) : (
            <ChevronLeft size={14} className="text-gray-600 dark:text-gray-400" />
          )}
        </button>
      </div>

      {/* User info */}
      {!isCollapsed && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-800 flex-shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#dc2626] to-[#16a34a] flex items-center justify-center text-white font-semibold flex-shrink-0">
              {user?.name.charAt(0)}
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {user?.name}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                {user?.societyName}
              </p>
              {user?.gareName && (
                <p className="text-xs text-gray-400 dark:text-gray-500 truncate flex items-center gap-1 mt-0.5">
                  <MapPin size={10} />
                  {user.gareName}
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Navigation */}
      <nav className="p-4 flex-1 overflow-y-auto min-h-0">
        <div className="space-y-1">
          {items.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all group ${
                  active
                    ? 'text-white font-medium'
                    : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'
                }`}
                style={active ? { background: 'linear-gradient(to right, #dc2626, #f59e0b, #16a34a)' } : {}}
                title={isCollapsed ? item.label : ''}
              >
                <Icon size={20} className="flex-shrink-0" />
                {!isCollapsed && (
                  <>
                    <span className="flex-1">{item.label}</span>
                    {item.badge && (
                      <span className="px-2 py-0.5 text-xs rounded-full bg-white/20 text-white">
                        {item.badge}
                      </span>
                    )}
                  </>
                )}
              </Link>
            );
          })}
        </div>
      </nav>

      {/* Footer - Déconnexion */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-800 flex-shrink-0">
        <button
          onClick={logout}
          className={`flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors w-full ${
            isCollapsed ? 'justify-center' : ''
          }`}
          title={isCollapsed ? 'Déconnexion' : ''}
        >
          <LogOut size={20} className="flex-shrink-0" />
          {!isCollapsed && <span>Déconnexion</span>}
        </button>
      </div>
    </aside>
  );
}