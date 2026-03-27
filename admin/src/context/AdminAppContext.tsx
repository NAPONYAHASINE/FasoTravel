/**
 * @file AdminAppContext.tsx
 * @description Context pour l'application ADMIN FasoTravel
 * Version 2.0 - BACKEND-READY: Utilise les services au lieu de mock data hardcodé
 * 
 * RÔLE: Supervision globale de l'écosystème
 * - Gestion des sociétés de transport
 * - Gestion des passagers (app mobile)
 * - Gestion des gares/stations
 * - Vue multi-société
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import type {
  TransportCompany,
  PassengerUser,
  AdminUser,
  Station,
  Support,
  Incident,
  Story,
  AuditLog,
  DashboardStats,
  Notification,
  Payment,
  RevenueStats,
  Advertisement,
} from '../shared/types/standardized';
import {
  STORAGE_AUTH_TOKEN,
  STORAGE_REFRESH_TOKEN,
  clearAuthStorage,
} from '../shared/constants/storage';

// Import des hooks backend-ready
import {
  useTransportCompanies,
  usePassengers,
  useStations,
  useSupportTickets,
  useIncidents,
  useStories,
  useAuditLogs,
  useNotifications,
  useAdvertisements,
  useCompanyActions,
  usePassengerActions,
  useSupportActions,
  useNotificationActions,
  useAdvertisementActions,
} from '../hooks/useEntities';

import { authService } from '../services';

// Import du service paiements backend-ready
import { paymentService as paymentSvc } from '../services/paymentService';

// Import du service analytics pour dashboard stats
import { platformAnalyticsService } from '../services/platformAnalyticsService';

// ==================== INTERFACE ====================

interface AdminAppContextType {
  // Authentication
  isAuthenticated: boolean;
  currentUser: AdminUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  
  // OTP Verification (2FA)
  otpPending: boolean;
  pendingUserEmail: string | null;
  verifyOtp: (code: string) => Promise<void>;
  resendOtp: () => Promise<void>;
  cancelOtp: () => void;

  // Transport Companies (backend-ready)
  transportCompanies: TransportCompany[];
  getCompanyById: (id: string) => TransportCompany | undefined;
  approveCompany: (id: string) => Promise<void>;
  suspendCompany: (id: string, reason: string) => Promise<void>;
  createCompany: (data: Partial<TransportCompany>) => Promise<void>;
  updateCompany: (id: string, data: Partial<TransportCompany>) => Promise<void>;
  deleteCompany: (id: string) => Promise<void>;
  refreshCompanies: () => Promise<void>;

  // Passengers (backend-ready)
  passengers: PassengerUser[];
  getPassengerById: (id: string) => PassengerUser | undefined;
  suspendPassenger: (id: string, reason: string) => Promise<void>;
  reactivatePassenger: (id: string) => Promise<void>;
  verifyPassenger: (id: string) => Promise<void>;
  updatePassenger: (id: string, updates: Partial<Pick<PassengerUser, 'name' | 'email' | 'phone'>>) => Promise<void>;
  resetPassengerPassword: (id: string) => Promise<string>;
  deletePassenger: (id: string) => Promise<void>;
  refreshPassengers: () => Promise<void>;

  // Stations (backend-ready)
  stations: Station[];
  getStationById: (id: string) => Station | undefined;
  // ⚠️ SUPPRIMÉ: toggleStationStatus - Le statut est maintenant AUTOMATIQUE
  // Le statut est calculé automatiquement basé sur:
  // 1. Heures d'ouverture/fermeture de la gare
  // 2. Connexion internet de l'App Société (heartbeat)
  // Voir /lib/stationStatusUtils.ts
  refreshStations: () => Promise<void>;

  // Support (backend-ready)
  supportTickets: Support[];
  getSupportById: (id: string) => Support | undefined;
  assignSupport: (ticketId: string, adminId: string) => Promise<void>;
  resolveSupport: (ticketId: string, resolution: string) => Promise<void>;
  refreshSupport: () => Promise<void>;

  // Incidents (backend-ready)
  incidents: Incident[];
  getIncidentById: (id: string) => Incident | undefined;
  refreshIncidents: () => Promise<void>;

  // Stories (backend-ready)
  stories: Story[];
  getStoryById: (id: string) => Story | undefined;
  publishStory: (id: string) => void;
  refreshStories: () => Promise<void>;

  // Audit Logs (backend-ready)
  auditLogs: AuditLog[];
  refreshAuditLogs: () => Promise<void>;

  // Notifications (backend-ready)
  notifications: Notification[];
  markNotificationAsRead: (notificationId: string) => Promise<void>;
  refreshNotifications: () => Promise<void>;

  // Payments (temporary - TODO: move to service)
  payments: Payment[];
  revenueStats: RevenueStats;

  // Advertisements (temporary - TODO: move to service)
  advertisements: Advertisement[];
  updateAdvertisement: (id: string, data: Partial<Advertisement>) => void;
  createAdvertisement: (data: Omit<Advertisement, 'id'>) => void;

  // Legacy aliases for backward compatibility
  operators: TransportCompany[]; // Alias for transportCompanies
  getOperatorById: (id: string) => TransportCompany | undefined; // Alias for getCompanyById

  // Dashboard Stats
  dashboardStats: DashboardStats;

  // UI
  theme: 'light' | 'dark';
  toggleTheme: () => void;
  loading: boolean;
  error: string | null;
}

// ==================== CONTEXT ====================

export const AdminAppContext = createContext<AdminAppContextType | undefined>(undefined);

// ==================== PROVIDER ====================

export function AdminAppProvider({ children }: { children: ReactNode }) {
  // ==================== AUTH STATE ====================
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<AdminUser | null>(null);
  const [_isInitialized, setIsInitialized] = useState(false);
  
  // ==================== OTP STATE ====================
  const [otpPending, setOtpPending] = useState(false);
  const [pendingUserEmail, setPendingUserEmail] = useState<string | null>(null);
  const [pendingAdmin, setPendingAdmin] = useState<AdminUser | null>(null);

  // ==================== BACKEND-READY DATA HOOKS ====================
  
  // Transport Companies
  const {
    data: transportCompanies,
    loading: companiesLoading,
    error: companiesError,
    refresh: refreshCompanies,
  } = useTransportCompanies();

  // Passengers
  const {
    data: passengers,
    loading: passengersLoading,
    error: passengersError,
    refresh: refreshPassengers,
  } = usePassengers();

  // Stations
  const {
    data: stations,
    loading: stationsLoading,
    error: stationsError,
    refresh: refreshStations,
  } = useStations();

  // Support Tickets
  const {
    data: supportTickets,
    loading: supportLoading,
    error: supportError,
    refresh: refreshSupport,
  } = useSupportTickets();

  // Incidents
  const {
    data: incidents,
    loading: incidentsLoading,
    error: incidentsError,
    refresh: refreshIncidents,
  } = useIncidents();

  // Stories
  const {
    data: stories,
    loading: storiesLoading,
    error: storiesError,
    refresh: refreshStories,
  } = useStories();

  // Audit Logs
  const {
    data: auditLogs,
    loading: logsLoading,
    error: logsError,
    refresh: refreshAuditLogs,
  } = useAuditLogs(100);

  // Notifications
  const {
    data: notifications,
    loading: notificationsLoading,
    error: notificationsError,
    refresh: refreshNotifications,
  } = useNotifications();

  // Advertisements
  const {
    data: advertisements,
    loading: advertisementsLoading,
    error: advertisementsError,
    refresh: _refreshAdvertisements,
  } = useAdvertisements();

  // ==================== ACTIONS HOOKS ====================
  
  const companyActions = useCompanyActions();
  const passengerActions = usePassengerActions();
  const supportActions = useSupportActions();
  const notificationActions = useNotificationActions();
  const advertisementActions = useAdvertisementActions();

  // ==================== PAYMENTS (backend-ready via service) ====================
  const [payments, setPayments] = useState<Payment[]>([]);
  const [revenueStats, setRevenueStats] = useState<RevenueStats>({
    totalRevenue: 0, platformCommission: 0, companyRevenue: 0,
    todayRevenue: 0, weekRevenue: 0, monthRevenue: 0,
    totalPayments: 0, successfulPayments: 0, failedPayments: 0, refundedPayments: 0,
    averageTicketPrice: 0,
  });

  // ==================== UI STATE ====================
  const [theme, setTheme] = useState<'light' | 'dark'>(() => {
    // 🔥 FIX: Initialisation synchrone au chargement
    const saved = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (saved) return saved;
    
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    return prefersDark ? 'dark' : 'light';
  });
  const [dashboardStats, setDashboardStats] = useState<DashboardStats>({
    totalRevenue: 0, todayRevenue: 0,
    activeTrips: 0, todayTrips: 0,
    totalPassengers: 0, todayPassengers: 0,
    totalBookings: 0, todayBookings: 0,
    cancelledBookings: 0, pendingIncidents: 0,
    systemHealth: 100,
    totalCompanies: 0, activeCompanies: 0, pendingCompanies: 0,
    totalStations: 0,
  });

  // Global loading state
  const loading =
    companiesLoading ||
    passengersLoading ||
    stationsLoading ||
    supportLoading ||
    incidentsLoading ||
    storiesLoading ||
    logsLoading ||
    notificationsLoading ||
    advertisementsLoading;

  // Global error state
  const error =
    companiesError ||
    passengersError ||
    stationsError ||
    supportError ||
    incidentsError ||
    storiesError ||
    logsError ||
    notificationsError ||
    advertisementsError;

  // ==================== EFFECTS ====================

  // Auto-login pour dev
  useEffect(() => {
    const storedUser = localStorage.getItem('adminUser');
    if (storedUser) {
      try {
        const user = JSON.parse(storedUser);
        
        // Migration de l'ancien format de rôle
        const roleMigration: Record<string, string> = {
          'super-admin': 'SUPER_ADMIN',
          'admin': 'SUPER_ADMIN',
          'support': 'SUPPORT_ADMIN',
          'finance': 'FINANCE_ADMIN',
          'operator': 'OPERATOR_ADMIN'
        };
        
        if (user.role && typeof user.role === 'string' && roleMigration[user.role]) {
          user.role = roleMigration[user.role];
          localStorage.setItem('adminUser', JSON.stringify(user));
        }
        
        // Vérifier que le rôle est valide
        const validRoles = ['SUPER_ADMIN', 'OPERATOR_ADMIN', 'SUPPORT_ADMIN', 'FINANCE_ADMIN'];
        if (!validRoles.includes(user.role)) {
          localStorage.removeItem('adminUser');
          return;
        }
        
        setCurrentUser(user);
        setIsAuthenticated(true);
      } catch (err) {
        localStorage.removeItem('adminUser');
      }
    }
    setIsInitialized(true);
  }, []);

  // Apply theme to DOM
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    
    // 🔥 FIX: Retire TOUTES les classes de thème
    html.classList.remove('light', 'dark');
    body.classList.remove('light', 'dark');
    
    // 🔥 FIX: Ajoute la classe du thème actuel (important pour Tailwind)
    html.classList.add(theme);
    body.classList.add(theme);
    
    localStorage.setItem('theme', theme);
    
    console.log('🎨 Theme applied:', theme, 'HTML classes:', html.className);
  }, [theme]);

  // Load payments via backend-ready service (ZÉRO import direct de mock)
  useEffect(() => {
    paymentSvc.getAllPayments().then(setPayments).catch(console.error);
    paymentSvc.getRevenueStats().then(setRevenueStats).catch(console.error);
  }, []);

  // Load dashboard stats via backend-ready service
  useEffect(() => {
    platformAnalyticsService.getDashboardStats()
      .then(setDashboardStats)
      .catch(console.error);
  }, []);
  
  // ==================== AUTH METHODS ====================

  const login = async (email: string, password: string) => {
    try {
      // Force a clean OTP flow even if a previous session was already authenticated.
      setIsAuthenticated(false);
      setCurrentUser(null);
      localStorage.removeItem('adminUser');

      const result = await authService.login(email, password);
      
      if (!result.success) {
        throw new Error(result.error || 'Échec de l\'authentification');
      }

      // Stocker tokens si production
      if (result.token) {
        localStorage.setItem(STORAGE_AUTH_TOKEN, result.token);
      }
      if (result.refreshToken) {
        localStorage.setItem(STORAGE_REFRESH_TOKEN, result.refreshToken);
      }

      // Passer en mode OTP
      if (result.user) {
        setPendingAdmin(result.user);
      }
      setPendingUserEmail(email.trim().toLowerCase());
      setOtpPending(true);
    } catch (err: any) {
      throw err;
    }
  };

  // Vérifie le code OTP et finalise l'authentification
  const verifyOtp = async (code: string) => {
    if (!otpPending) {
      throw new Error('Aucune vérification OTP en attente');
    }

    const result = await authService.verifyOtp(code, pendingUserEmail || undefined);
    
    if (!result.success) {
      throw new Error(result.error || 'Code OTP invalide');
    }

    // OTP valide → Authentification complète
    const user = result.user || pendingAdmin;
    if (!user) {
      throw new Error('Utilisateur introuvable après vérification OTP');
    }

    // Stocker tokens si production
    if (result.token) {
      localStorage.setItem(STORAGE_AUTH_TOKEN, result.token);
    }
    if (result.refreshToken) {
      localStorage.setItem(STORAGE_REFRESH_TOKEN, result.refreshToken);
    }

    setCurrentUser(user);
    setIsAuthenticated(true);
    localStorage.setItem('adminUser', JSON.stringify(user));

    // Nettoyage de l'état OTP
    setOtpPending(false);
    setPendingUserEmail(null);
    setPendingAdmin(null);

    // Backend-ready mode: Firebase is opt-in and disabled by default.
    // Enable with VITE_ENABLE_FIREBASE_PUSH=true when backend + Firebase are ready.
    if (import.meta.env.VITE_ENABLE_FIREBASE_PUSH === 'true') {
      import('../config/firebase.config').then(({ onFCMMessage, getFCMToken }) => {
        onFCMMessage((payload: unknown) => {
          console.log('[FCM] Foreground notification:', payload);
        });
        if ('Notification' in window && Notification.permission === 'granted') {
          getFCMToken().catch(console.warn);
        }
      }).catch(() => {
        // Firebase not installed/configured yet.
      });
    }
  };

  // Renvoyer un nouveau code OTP
  const resendOtp = async () => {
    if (!pendingUserEmail) {
      throw new Error('Aucun email en attente pour renvoyer l\'OTP');
    }

    const result = await authService.resendOtp(pendingUserEmail);
    if (!result.success) {
      throw new Error(result.error || 'Erreur lors du renvoi de l\'OTP');
    }
  };

  // Annuler la vérification OTP et revenir au login
  const cancelOtp = () => {
    setOtpPending(false);
    setPendingUserEmail(null);
    setPendingAdmin(null);
  };

  const logout = () => {
    authService.logout().catch(console.error);
    clearAuthStorage();
    setCurrentUser(null);
    setIsAuthenticated(false);
    setOtpPending(false);
    setPendingUserEmail(null);
    setPendingAdmin(null);
    localStorage.removeItem('adminUser');
  };

  // ==================== COMPANY METHODS ====================

  const getCompanyById = (id: string) => {
    return transportCompanies.find(c => c.id === id);
  };

  const approveCompany = async (id: string) => {
    await companyActions.approve(id);
    await refreshCompanies();
    await refreshAuditLogs(); // 🔥 Rafraîchir les logs
  };

  const suspendCompany = async (id: string, reason: string) => {
    await companyActions.suspend(id, reason);
    await refreshCompanies();
    await refreshAuditLogs(); // 🔥 Rafraîchir les logs
  };

  const createCompany = async (data: Partial<TransportCompany>) => {
    await companyActions.create(data);
    await refreshCompanies();
    await refreshAuditLogs(); // 🔥 Rafraîchir les logs
  };

  const updateCompany = async (id: string, data: Partial<TransportCompany>) => {
    await companyActions.update(id, data);
    await refreshCompanies();
    await refreshAuditLogs(); // 🔥 Rafraîchir les logs
  };

  const deleteCompany = async (id: string) => {
    await companyActions.remove(id);
    await refreshCompanies();
    await refreshAuditLogs(); // 🔥 Rafraîchir les logs
  };

  // ==================== PASSENGER METHODS ====================

  const getPassengerById = (id: string) => {
    return passengers.find(p => p.id === id);
  };

  const suspendPassenger = async (id: string, reason: string) => {
    await passengerActions.suspend(id, reason);
    await refreshPassengers();
  };

  const reactivatePassenger = async (id: string) => {
    await passengerActions.reactivate(id);
    await refreshPassengers();
  };

  const verifyPassenger = async (id: string) => {
    await passengerActions.verify(id);
    await refreshPassengers();
  };

  const updatePassenger = async (id: string, updates: Partial<Pick<PassengerUser, 'name' | 'email' | 'phone'>>) => {
    await passengerActions.update(id, updates);
    await refreshPassengers();
  };

  const resetPassengerPassword = async (id: string) => {
    const newPassword = await passengerActions.resetPassword(id);
    await refreshPassengers();
    return newPassword;
  };

  const deletePassenger = async (id: string) => {
    await passengerActions.remove(id);
    await refreshPassengers();
  };

  // ==================== STATION METHODS ====================

  const getStationById = (id: string) => {
    return stations.find(s => s.id === id);
  };

  // ==================== SUPPORT METHODS ====================

  const getSupportById = (id: string) => {
    return supportTickets.find(t => t.id === id);
  };

  const assignSupport = async (ticketId: string, adminId: string) => {
    await supportActions.assign(ticketId, adminId);
    await refreshSupport();
  };

  const resolveSupport = async (ticketId: string, resolution: string) => {
    await supportActions.resolve(ticketId, resolution);
    await refreshSupport();
  };

  // ==================== INCIDENT METHODS ====================

  const getIncidentById = (id: string) => {
    return incidents.find(i => i.id === id);
  };

  // ==================== STORY METHODS ====================

  const getStoryById = (id: string) => {
    return stories.find(s => s.id === id);
  };

  const publishStory = (_id: string) => {
    // Backend: await storiesService.publish(id)
    refreshStories();
  };

  // ==================== NOTIFICATION METHODS ====================

  const markNotificationAsRead = async (notificationId: string) => {
    await notificationActions.markAsRead(notificationId);
    await refreshNotifications();
  };

  // ==================== THEME ====================

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };

  // ==================== CONTEXT VALUE ====================

  const value: AdminAppContextType = {
    // Auth
    isAuthenticated,
    currentUser,
    login,
    logout,
    
    // OTP Verification (2FA)
    otpPending,
    pendingUserEmail,
    verifyOtp,
    resendOtp,
    cancelOtp,

    // Companies
    transportCompanies,
    getCompanyById,
    approveCompany,
    suspendCompany,
    createCompany,
    updateCompany,
    deleteCompany,
    refreshCompanies,

    // Passengers
    passengers,
    getPassengerById,
    suspendPassenger,
    reactivatePassenger,
    verifyPassenger,
    updatePassenger,
    resetPassengerPassword,
    deletePassenger,
    refreshPassengers,

    // Stations
    stations,
    getStationById,
    refreshStations,

    // Support
    supportTickets,
    getSupportById,
    assignSupport,
    resolveSupport,
    refreshSupport,

    // Incidents
    incidents,
    getIncidentById,
    refreshIncidents,

    // Stories
    stories,
    getStoryById,
    publishStory,
    refreshStories,

    // Audit Logs
    auditLogs,
    refreshAuditLogs,

    // Notifications
    notifications,
    markNotificationAsRead,
    refreshNotifications,

    // Payments (temporary - TODO: move to service)
    payments,
    revenueStats,

    // Advertisements (temporary - TODO: move to service)
    advertisements,
    updateAdvertisement: (id: string, data: Partial<Advertisement>) => {
      advertisementActions.update(id, data);
    },
    createAdvertisement: (data: Omit<Advertisement, 'id'>) => {
      advertisementActions.create(data);
    },

    // Legacy aliases for backward compatibility
    operators: transportCompanies, // Alias for transportCompanies
    getOperatorById: getCompanyById, // Alias for getCompanyById

    // Dashboard
    dashboardStats,

    // UI
    theme,
    toggleTheme,
    loading,
    error,
  };

  return (
    <AdminAppContext.Provider value={value}>
      {children}
    </AdminAppContext.Provider>
  );
}

// ==================== HOOK ====================

export function useAdminApp() {
  const context = useContext(AdminAppContext);
  if (!context) {
    throw new Error('useAdminApp must be used within AdminAppProvider');
  }
  return context;
}

/**
 * Safe version of useAdminApp that returns null instead of throwing
 * when used outside AdminAppProvider (e.g., during HMR in Figma Make)
 */
export function useAdminAppSafe() {
  return useContext(AdminAppContext);
}