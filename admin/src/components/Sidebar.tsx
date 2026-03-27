import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router';
import { 
  LayoutDashboard, 
  Map, 
  HeadphonesIcon, 
  Building2, 
  MapPin, 
  Megaphone,
  Puzzle,
  AlertTriangle,
  FileText,
  Users,
  Ticket,
  Calendar,
  CreditCard,
  Bus,
  Tag,
  Star,
  Bell,
  BarChart3,
  Shield,
  FileStack,
  LogOut,
  ChevronLeft,
  ChevronRight,
  Settings,
  Menu,
  X,
  GitBranch,
  Gift
} from 'lucide-react';
import { useAdminApp } from '../context/AdminAppContext';
import { usePermission } from '../hooks/usePermission';
import logo from 'figma:asset/ddaf4c7eb0e28936f4d0223e859065e25d5c3fc8.png';

interface NavItem {
  path: string;  // Route path instead of Page ID
  label: string;
  icon: any;
  badge?: string | number;
  category?: string;
  requiredPage?: string;
}

export function Sidebar() {
  const navigate = useNavigate();
  const location = useLocation();
  const { logout, supportTickets, currentUser } = useAdminApp();
  const { canAccessPage } = usePermission();
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  // Calculate pending support tickets
  const pendingSupport = supportTickets.filter(t => t.status === 'open').length;

  const navItems: NavItem[] = [
    // 🏠 PRINCIPAL
    { path: '/dashboard', label: 'Tableau de Bord', icon: LayoutDashboard, category: 'Principal', requiredPage: 'dashboard' },
    { path: '/map', label: 'Carte Temps Réel', icon: Map, category: 'Principal', requiredPage: 'map' },
    { path: '/analytics', label: 'Analytiques', icon: BarChart3, category: 'Principal', requiredPage: 'analytics' },
    
    // 🏢 SUPERVISION ÉCOSYSTÈME (Rôle Admin)
    { path: '/companies', label: 'Sociétés de Transport', icon: Building2, category: 'Supervision', requiredPage: 'companies' },
    { path: '/passengers', label: 'Passagers', icon: Users, category: 'Supervision', requiredPage: 'passengers' },
    { path: '/stations', label: 'Gares/Stations', icon: MapPin, category: 'Supervision', requiredPage: 'stations' },
    { path: '/trips', label: 'Trajets Global', icon: Bus, category: 'Supervision', requiredPage: 'trips' },
    
    // 💰 VENTES & RÉSERVATIONS (Vue Globale)
    { path: '/bookings', label: 'Réservations', icon: Calendar, category: 'Finances', requiredPage: 'bookings' },
    { path: '/tickets', label: 'Billets', icon: Ticket, category: 'Finances', requiredPage: 'tickets' },
    { path: '/payments', label: 'Paiements', icon: CreditCard, category: 'Finances', requiredPage: 'payments' },
    { path: '/finances', label: 'Flux Financier', icon: GitBranch, category: 'Finances', requiredPage: 'payments' },
    { path: '/promotions', label: 'Promotions', icon: Tag, category: 'Finances', requiredPage: 'promotions' },
    
    // 👥 GESTION UTILISATEURS
    { path: '/reviews', label: 'Avis Clients', icon: Star, category: 'Contenu', requiredPage: 'reviews' },
    
    // 🔧 SUPPORT & INCIDENTS
    { 
      path: '/support', 
      label: 'Support Client', 
      icon: HeadphonesIcon, 
      badge: pendingSupport > 0 ? pendingSupport : undefined,
      category: 'Support',
      requiredPage: 'support'
    },
    { path: '/incidents', label: 'Gestion Incidents', icon: AlertTriangle, category: 'Support', requiredPage: 'incidents' },
    
    // 📢 MARKETING & PUBLICITÉ
    { path: '/advertising', label: 'Stories & Pubs', icon: Megaphone, category: 'Marketing', requiredPage: 'advertising' },
    { path: '/notifications', label: 'Notifications', icon: Bell, category: 'Marketing', requiredPage: 'notifications' },
    { path: '/referrals', label: 'Parrainage', icon: Gift, category: 'Marketing', requiredPage: 'referrals' },
    
    // ⚙️ SYSTÈME & CONFIGURATION
    { path: '/integrations', label: 'Intégrations', icon: Puzzle, category: 'Système', requiredPage: 'integrations' },
    { path: '/logs', label: 'Logs Système', icon: FileText, category: 'Système', requiredPage: 'logs' },
    { path: '/sessions', label: 'Sessions', icon: Shield, category: 'Système', requiredPage: 'sessions' },
    { path: '/policies', label: 'Politiques', icon: FileStack, category: 'Système', requiredPage: 'policies' },
    { path: '/settings', label: 'Paramètres', icon: Settings, category: 'Système', requiredPage: 'settings' }
  ];

  // ⚡ FILTRAGE PAR PERMISSIONS
  const visibleItems = navItems.filter(item => {
    // Si pas de permission requise, afficher
    if (!item.requiredPage) return true;
    
    // Vérifier si l'utilisateur a accès à cette page
    return canAccessPage(item.requiredPage);
  });

  // Grouper par catégorie
  const categories = Array.from(new Set(visibleItems.map(item => item.category).filter(Boolean)));
  
  const groupedItems = categories.map(category => ({
    category,
    items: visibleItems.filter(item => item.category === category)
  }));

  const NavItemComponent = ({ item }: { item: NavItem }) => {
    const Icon = item.icon;
    const isActive = location.pathname === item.path;

    return (
      <button
        onClick={() => {
          navigate(item.path);
          setIsMobileOpen(false);
        }}
        className={`
          group relative flex items-center gap-3 w-full px-4 py-3 rounded-xl
          transition-all duration-200
          ${isActive 
            ? 'bg-gradient-to-r from-red-500 to-red-600 text-white shadow-lg shadow-red-500/30' 
            : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700'
          }
          ${isCollapsed ? 'justify-center' : ''}
        `}
      >
        <Icon className={isActive ? 'h-5 w-5 flex-shrink-0 text-white' : 'h-5 w-5 flex-shrink-0 text-gray-500 dark:text-gray-400 group-hover:text-red-600 dark:group-hover:text-red-400'} />
        
        {!isCollapsed && (
          <>
            <span className="flex-1 text-left text-sm truncate">{item.label}</span>
            {item.badge && (
              <span className="px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {item.badge}
              </span>
            )}
          </>
        )}

        {/* Active Indicator */}
        {isActive && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-white dark:bg-gray-800 rounded-l-full"></div>
        )}

        {/* Tooltip pour mode collapsed */}
        {isCollapsed && (
          <div className="absolute left-full ml-6 px-3 py-2 bg-gray-900 dark:bg-gray-700 text-white text-sm rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-50">
            {item.label}
            {item.badge && (
              <span className="ml-2 px-2 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {item.badge}
              </span>
            )}
          </div>
        )}
      </button>
    );
  };

  const SidebarContent = () => (
    <div className="flex flex-col h-full bg-white dark:bg-gray-800 transition-colors">
      {/* Header Premium */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          {!isCollapsed && (
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 flex items-center justify-center">
                <img src={logo} alt="FasoTravel" className="w-full h-full object-contain drop-shadow-lg" />
              </div>
              <div>
                <h2 className="text-lg text-gray-900 dark:text-white tracking-tight">FasoTravel</h2>
                <p className="text-xs text-gray-600 dark:text-gray-400">Admin Dashboard</p>
              </div>
            </div>
          )}
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="hidden lg:flex p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors text-gray-700 dark:text-gray-300"
          >
            {isCollapsed ? <ChevronRight className="h-5 w-5" /> : <ChevronLeft className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Navigation avec scroll */}
      <div className="flex-1 overflow-y-auto px-4 py-6 space-y-8">
        {groupedItems.map(({ category, items }) => (
          <div key={category}>
            {!isCollapsed && (
              <div className="px-4 mb-3">
                <h3 className="text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  {category}
                </h3>
              </div>
            )}
            <div className="space-y-1">
              {items.map(item => (
                <NavItemComponent key={item.path} item={item} />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Footer Actions */}
      <div className="p-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
        <button
          onClick={logout}
          className={`
            flex items-center gap-3 w-full px-4 py-3 rounded-xl
            text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors
            ${isCollapsed ? 'justify-center' : ''}
          `}
        >
          <LogOut className="h-5 w-5" />
          {!isCollapsed && <span className="text-sm font-medium">Déconnexion</span>}
        </button>

        {!isCollapsed && (
          <div className="mt-4 p-4 bg-gradient-to-br from-red-50 to-yellow-50 dark:from-red-900/20 dark:to-yellow-900/20 rounded-xl border border-red-200 dark:border-red-800">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-red-500 to-yellow-500 rounded-lg flex items-center justify-center flex-shrink-0">
                <span className="text-white text-lg">👤</span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-sm font-semibold text-gray-900 dark:text-white truncate">{currentUser?.fullName || currentUser?.name || 'Admin User'}</div>
                <div className="text-xs text-gray-600 dark:text-gray-400 truncate">{currentUser?.email || 'admin@fasotravel.bf'}</div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile Menu Button */}
      <button
        onClick={() => setIsMobileOpen(!isMobileOpen)}
        className="lg:hidden fixed top-4 left-4 z-50 p-3 bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white transition-colors"
      >
        {isMobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
      </button>

      {/* Mobile Overlay */}
      {isMobileOpen && (
        <div 
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsMobileOpen(false)}
        ></div>
      )}

      {/* Sidebar Desktop */}
      <aside className={`
        hidden lg:flex flex-col
        ${isCollapsed ? 'w-20' : 'w-72'}
        h-screen sticky top-0
        bg-white dark:bg-gray-800 shadow-xl
        transition-all duration-300
        border-r border-gray-200 dark:border-gray-700
      `}>
        <SidebarContent />
      </aside>

      {/* Sidebar Mobile */}
      <aside className={`
        lg:hidden fixed inset-y-0 left-0 z-40
        w-72 bg-white dark:bg-gray-800 shadow-2xl
        transform transition-transform duration-300
        ${isMobileOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <SidebarContent />
      </aside>
    </>
  );
}