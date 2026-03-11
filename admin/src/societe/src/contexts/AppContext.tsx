/**
 * @file AppContext.tsx
 * @description Main application context for FasoTravel Societe
 */

import { createContext, useContext, useState, useEffect, ReactNode } from 'react';

// Import types from shared layer (ZERO DUPLICATION)
import type {
  OperatorUser,
  Trip,
  Ticket,
  Station,
  Route,
  Incident,
  Manager,
  Cashier,
  Review,
  Story,
  DashboardStats
} from '../../../shared/types/standardized';

// ============= SOCIÉTÉ-SPECIFIC TYPES =============

interface CashTransaction {
  id: string;
  type: 'sale' | 'refund';
  amount: number;
  description?: string;
  createdAt: string;
  verified: boolean;
  cashierId: string;
}

// ============= CONTEXT TYPES =============

interface AppContextType {
  // Authentication
  isAuthenticated: boolean;
  currentUser: OperatorUser | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;

  // Data
  trips: Trip[];
  tickets: Ticket[];
  stations: Station[];
  routes: Route[];
  incidents: Incident[];
  managers: Manager[];
  cashiers: Cashier[];
  reviews: Review[];
  stories: Story[];
  cashTransactions: CashTransaction[];

  // Stats
  dashboardStats: DashboardStats | null;

  // CRUD Operations
  createTrip: (data: Partial<Trip>) => Promise<Trip>;
  updateTrip: (id: string, data: Partial<Trip>) => Promise<Trip>;
  deleteTrip: (id: string) => Promise<void>;

  createTicket: (data: Partial<Ticket>) => Promise<Ticket>;
  updateTicket: (id: string, data: Partial<Ticket>) => Promise<Ticket>;
  deleteTicket: (id: string) => Promise<void>;

  createStation: (data: Partial<Station>) => Promise<Station>;
  updateStation: (id: string, data: Partial<Station>) => Promise<Station>;
  deleteStation: (id: string) => Promise<void>;

  createRoute: (data: Partial<Route>) => Promise<Route>;
  updateRoute: (id: string, data: Partial<Route>) => Promise<Route>;
  deleteRoute: (id: string) => Promise<void>;

  createIncident: (data: Partial<Incident>) => Promise<Incident>;
  updateIncident: (id: string, data: Partial<Incident>) => Promise<Incident>;
  deleteIncident: (id: string) => Promise<void>;

  // Loading & Errors
  loading: boolean;
  error: string | null;

  // Theme
  theme: 'light' | 'dark';
  toggleTheme: () => void;

  // Refresh
  refreshData: () => Promise<void>;
}

// ============= CONTEXT =============

const AppContext = createContext<AppContextType | undefined>(undefined);

// ============= MOCK DATA =============

const MOCK_USERS = {
  'admin@tsr.bf': {
    id: '1',
    email: 'admin@tsr.bf',
    name: 'Amadou Traoré',
    role: 'responsable' as const,
    societyId: 'tsr-001'
  },
  'manager@gare-ouaga.bf': {
    id: '2',
    email: 'manager@gare-ouaga.bf',
    name: 'Fatou Sankara',
    role: 'manager' as const,
    societyId: 'tsr-001',
    gareName: 'Gare de Ouagadougou',
    gareId: 'gare-ouaga'
  },
  'caissier@gare-ouaga.bf': {
    id: '3',
    email: 'caissier@gare-ouaga.bf',
    name: 'Ibrahim Ouédraogo',
    role: 'caissier' as const,
    societyId: 'tsr-001',
    gareName: 'Gare de Ouagadougou',
    gareId: 'gare-ouaga'
  }
};

// ============= PROVIDER =============

export function AppProvider({ children }: { children: ReactNode }) {
  // Auth state
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [currentUser, setCurrentUser] = useState<OperatorUser | null>(null);

  // Data state
  const [trips, setTrips] = useState<Trip[]>([]);
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [stations, setStations] = useState<Station[]>([]);
  const [routes, setRoutes] = useState<Route[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [managers, setManagers] = useState<Manager[]>([]);
  const [cashiers, setCashiers] = useState<Cashier[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);

  // UI state
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  // Check authentication on mount
  useEffect(() => {
    const userStr = localStorage.getItem('transportbf_user');
    if (userStr) {
      setCurrentUser(JSON.parse(userStr));
      setIsAuthenticated(true);
    }
  }, []);

  // Load data when authenticated
  useEffect(() => {
    if (isAuthenticated && currentUser) {
      refreshData();
    }
  }, [isAuthenticated, currentUser]);

  // ============= AUTH FUNCTIONS =============

  const login = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      const user = MOCK_USERS[email as keyof typeof MOCK_USERS];
      if (!user || password !== 'Pass123!') {
        throw new Error('Email ou mot de passe incorrect');
      }

      localStorage.setItem('transportbf_user', JSON.stringify(user));
      setCurrentUser(user);
      setIsAuthenticated(true);
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Échec de la connexion');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('transportbf_user');
    setCurrentUser(null);
    setIsAuthenticated(false);
    setTrips([]);
    setTickets([]);
    setStations([]);
    setRoutes([]);
  };

  // ============= DATA FUNCTIONS =============

  const refreshData = async () => {
    if (!currentUser) return;

    try {
      setLoading(true);
      setError(null);

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));

      // Mock dashboard stats
      setDashboardStats({
        activeTrips: 12,
        todayBookings: 45,
        todayPassengers: 38,
        pendingIncidents: 3,
        totalRevenue: 2500000,
        totalPassengers: 450,
        totalBookings: 520
      });
    } catch (err) {
      const error = err as Error;
      setError(error.message || 'Échec du chargement des données');
    } finally {
      setLoading(false);
    }
  };

  // ============= CRUD FUNCTIONS =============

  // Trips
  const createTrip = async (data: Partial<Trip>): Promise<Trip> => {
    const trip: Trip = {
      id: `trip-${Date.now()}`,
      routeName: data.routeName || '',
      departureTime: data.departureTime || new Date().toISOString(),
      arrivalTime: data.arrivalTime || new Date().toISOString(),
      status: 'scheduled',
      currentPassengers: 0,
      capacity: data.capacity || 50,
      ...data
    } as Trip;
    setTrips(prev => [...prev, trip]);
    return trip;
  };

  const updateTrip = async (id: string, data: Partial<Trip>): Promise<Trip> => {
    const trip = trips.find(t => t.id === id);
    if (!trip) throw new Error('Trip not found');
    const updated = { ...trip, ...data };
    setTrips(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  };

  const deleteTrip = async (id: string): Promise<void> => {
    setTrips(prev => prev.filter(t => t.id !== id));
  };

  // Tickets
  const createTicket = async (data: Partial<Ticket>): Promise<Ticket> => {
    const ticket: Ticket = {
      id: `ticket-${Date.now()}`,
      totalAmount: data.totalAmount || 0,
      purchaseDate: new Date().toISOString(),
      status: 'confirmed',
      seatNumber: data.seatNumber || 'A1',
      paymentMethod: 'cash',
      paymentStatus: 'paid',
      ...data
    } as Ticket;
    setTickets(prev => [...prev, ticket]);
    return ticket;
  };

  const updateTicket = async (id: string, data: Partial<Ticket>): Promise<Ticket> => {
    const ticket = tickets.find(t => t.id === id);
    if (!ticket) throw new Error('Ticket not found');
    const updated = { ...ticket, ...data };
    setTickets(prev => prev.map(t => t.id === id ? updated : t));
    return updated;
  };

  const deleteTicket = async (id: string): Promise<void> => {
    setTickets(prev => prev.filter(t => t.id !== id));
  };

  // Stations
  const createStation = async (data: Partial<Station>): Promise<Station> => {
    const station: Station = {
      id: `station-${Date.now()}`,
      name: data.name || '',
      city: data.city || '',
      capacity: data.capacity || 10,
      latitude: data.latitude || 0,
      longitude: data.longitude || 0,
      status: 'active',
      ...data
    } as Station;
    setStations(prev => [...prev, station]);
    return station;
  };

  const updateStation = async (id: string, data: Partial<Station>): Promise<Station> => {
    const station = stations.find(s => s.id === id);
    if (!station) throw new Error('Station not found');
    const updated = { ...station, ...data };
    setStations(prev => prev.map(s => s.id === id ? updated : s));
    return updated;
  };

  const deleteStation = async (id: string): Promise<void> => {
    setStations(prev => prev.filter(s => s.id !== id));
  };

  // Routes
  const createRoute = async (data: Partial<Route>): Promise<Route> => {
    const route: Route = {
      id: `route-${Date.now()}`,
      name: data.name || '',
      startStationName: data.startStationName || '',
      endStationName: data.endStationName || '',
      distanceKm: data.distanceKm || 0,
      estimatedDurationMinutes: data.estimatedDurationMinutes || 0,
      isExpress: data.isExpress || false,
      status: 'active',
      ...data
    } as Route;
    setRoutes(prev => [...prev, route]);
    return route;
  };

  const updateRoute = async (id: string, data: Partial<Route>): Promise<Route> => {
    const route = routes.find(r => r.id === id);
    if (!route) throw new Error('Route not found');
    const updated = { ...route, ...data };
    setRoutes(prev => prev.map(r => r.id === id ? updated : r));
    return updated;
  };

  const deleteRoute = async (id: string): Promise<void> => {
    setRoutes(prev => prev.filter(r => r.id !== id));
  };

  // Incidents
  const createIncident = async (data: Partial<Incident>): Promise<Incident> => {
    const incident: Incident = {
      id: `incident-${Date.now()}`,
      type: data.type || 'autre',
      title: data.title || '',
      severity: data.severity || 'low',
      status: 'open',
      createdAt: new Date().toISOString(),
      ...data
    } as Incident;
    setIncidents(prev => [...prev, incident]);
    return incident;
  };

  const updateIncident = async (id: string, data: Partial<Incident>): Promise<Incident> => {
    const incident = incidents.find(i => i.id === id);
    if (!incident) throw new Error('Incident not found');
    const updated = { ...incident, ...data };
    setIncidents(prev => prev.map(i => i.id === id ? updated : i));
    return updated;
  };

  const deleteIncident = async (id: string): Promise<void> => {
    setIncidents(prev => prev.filter(i => i.id !== id));
  };

  // ============= THEME =============

  const toggleTheme = () => {
    setTheme(prev => {
      const newTheme = prev === 'light' ? 'dark' : 'light';
      document.documentElement.classList.toggle('dark', newTheme === 'dark');
      localStorage.setItem('transportbf_theme', newTheme);
      return newTheme;
    });
  };

  // ============= CONTEXT VALUE =============

  const value: AppContextType = {
    // Auth
    isAuthenticated,
    currentUser,
    login,
    logout,

    // Data
    trips,
    tickets,
    stations,
    routes,
    incidents,
    managers,
    cashiers,
    reviews,
    stories,
    cashTransactions,
    dashboardStats,

    // CRUD
    createTrip,
    updateTrip,
    deleteTrip,
    createTicket,
    updateTicket,
    deleteTicket,
    createStation,
    updateStation,
    deleteStation,
    createRoute,
    updateRoute,
    deleteRoute,
    createIncident,
    updateIncident,
    deleteIncident,

    // UI
    loading,
    error,
    theme,
    toggleTheme,

    // Refresh
    refreshData
  };

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

// ============= HOOK =============

export function useApp() {
  const context = useContext(AppContext);
  if (context === undefined) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
}