import { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useAuth } from './AuthContext';
import { calculatePriceWithRules } from '../utils/pricingCalculator';
import { getCurrentDate } from '../utils/dateUtils';
import { getValidTickets, calculateTicketsRevenue, calculateOverallOccupancy } from '../utils/statsUtils';
import { useApiState } from '../hooks/useApiState';
import type { PricingSegment } from '../services/types';

// ✅ Import des services API (100% Backend-Ready)
import { stationService } from '../services/api/station.service';
import { routeService } from '../services/api/route.service';
import { scheduleService } from '../services/api/schedule.service';
import { pricingService } from '../services/api/pricing.service';
import { managerService } from '../services/api/manager.service';
import { cashierService } from '../services/api/cashier.service';
import { tripService } from '../services/api/trip.service';
import { ticketService } from '../services/api/ticket.service';

// Types
export interface Station {
  id: string;
  name: string;
  city: string;
  region: string;
  address: string;
  phone: string;
  managerId?: string;
  managerName?: string;
  status: 'active' | 'inactive';
  coordinates?: { lat: number; lng: number };
  // ✅ NOUVEAUX CHAMPS: Horaires de travail et tarification bagages
  workingHours?: {
    openTime: string; // Format HH:mm (ex: "07:00")
    closeTime: string; // Format HH:mm (ex: "19:00")
  };
  baggagePrice?: number; // Prix bagage en FCFA
}

export interface Route {
  id: string;
  departure: string;
  arrival: string;
  distance: number;
  duration: number;
  basePrice: number;
  status: 'active' | 'inactive';
  description?: string;
}

export interface ScheduleTemplate {
  id: string;
  routeId: string;
  departureTime: string; // Format HH:mm (ex: "05:30")
  daysOfWeek: number[]; // 0 = dimanche, 1 = lundi, ..., 6 = samedi
  serviceClass: 'standard' | 'vip';
  gareId: string;
  gareName: string;
  totalSeats: number;
  seatLayout?: SeatLayout;
  status: 'active' | 'inactive';
  createdAt: string;
}

export interface PricingRule {
  id: string;
  routeId: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  startDate: string;
  endDate?: string;
  daysOfWeek?: number[];
  timeSlots?: { start: string; end: string }[];
  priority: number;
  status: 'active' | 'inactive';
}

export interface Manager {
  id: string;
  userId?: string; // ID du compte utilisateur (lié à l'authentification backend)
  name: string;
  email: string;
  whatsapp: string;
  gareId: string;
  gareName: string;
  status: 'active' | 'inactive';
  joinedDate: string;
  password: string; // Mot de passe (stocké temporairement, sera géré par le backend en production)
}

export interface Cashier {
  id: string;
  userId?: string; // ID du compte utilisateur (lié à l'authentification backend)
  name: string;
  email: string;
  whatsapp: string;
  gareId: string;
  gareName: string;
  managerId: string;
  status: 'active' | 'inactive';
  joinedDate: string;
  password: string; // Mot de passe (stocké temporairement, sera géré par le backend en production)
}

export interface Trip {
  id: string;
  routeId: string;
  departure: string;
  arrival: string;
  departureTime: string;
  arrivalTime: string;
  busNumber: string;
  availableSeats: number;
  totalSeats: number;
  price: number;
  status: 'scheduled' | 'boarding' | 'departed' | 'arrived' | 'cancelled';
  gareId: string;
  gareName: string;
  seatLayout?: SeatLayout;
  
  // ✅ Classe de service
  serviceClass: 'standard' | 'vip' | 'express';
  
  // ✅ Informations chauffeur
  driverId?: string;
  driverName?: string;
  
  // ✅ Tracking GPS temps réel (pour LocalMapPage et tracking mobile)
  vehicleId?: string; // Référence au véhicule
  currentLocation?: {
    lat: number;
    lng: number;
    timestamp: string;
  };
  estimatedArrival?: string; // Heure d'arrivée estimée mise à jour en temps réel
}

export interface Ticket {
  id: string;
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  seatNumber: string;
  price: number;
  commission?: number; // Commission prélevée si vente en ligne
  paymentMethod: 'cash' | 'orange_money' | 'moov_money' | 'wave' | 'card'; // ✅ CORRIGÉ: supprimé 'online'
  salesChannel: 'online' | 'counter'; // CRITIQUE: online = app mobile, counter = guichet
  status: 'active' | 'boarded' | 'expired' | 'refunded' | 'cancelled';
  purchaseDate: string;
  cashierId: string; // Pour counter, ID caissier. Pour online, peut être "online_system"
  cashierName: string; // Pour counter, nom caissier. Pour online, "Vente en ligne"
  gareId: string;
  departure: string;
  arrival: string;
  departureTime: string;
}

export interface CashTransaction {
  id: string;
  type: 'sale' | 'refund' | 'deposit' | 'withdrawal';
  amount: number;
  method: 'cash' | 'orange_money' | 'moov_money' | 'wave' | 'card';
  description: string;
  ticketId?: string; // Pour compatibilité
  ticketIds?: string[]; // Plusieurs billets pour une transaction groupée
  tripId?: string; // Référence au trajet
  gareId?: string; // Gare où la transaction a eu lieu
  cashierId: string;
  cashierName: string;
  timestamp: string;
  status: 'completed' | 'pending' | 'cancelled';
}

export interface Story {
  id: string;
  title: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  duration: number; // Durée d'affichage en secondes
  
  // ✅ Lien optionnel vers une promotion (pour stories promo)
  promo_id?: string;
  
  // ✅ Ciblage amélioré (ligne, ville, ou tous)
  targeting: 'all' | 'route' | 'city' | 'station';
  targetValue?: string; // Nom de la ligne, ville, ou ID gare
  targetStations?: string[]; // IDs des gares (optionnel pour ciblage multi-gares)
  
  // ✅ Action contextuelle au transport
  actionType?: 'none' | 'book_route' | 'view_company'; // Type d'action
  actionLabel?: string; // Texte du bouton CTA (ex: "Réserver maintenant", "Voir nos trajets")
  
  startDate: string;
  endDate: string;
  views: number;
  clicks: number;
  
  // ✅ Statut de publication (timeline)
  status: 'active' | 'scheduled' | 'expired';
  
  // ✅ Statut de validation/approbation (workflow)
  approval_status: 'draft' | 'pending_validation' | 'active' | 'rejected';
  
  createdAt: string;
  createdBy?: string; // ID du responsable qui a créé la story
  createdByName?: string;
}

// ✅ PROMOTIONS - Réductions de prix (BACKEND READY)
export interface Promotion {
  promotion_id: string;
  title: string;
  description?: string;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT'; // % ou montant fixe
  discount_value: number; // 25 pour 25%, ou 5000 pour -5000 FCFA
  trip_id?: string; // Null = promo globale à tous les trajets opérateur
  start_date: string;
  end_date: string;
  max_uses?: number;
  max_uses_per_user?: number; // ✅ NOUVEAU: Limite d'utilisation par utilisateur
  current_uses: number;
  status: 'draft' | 'active' | 'paused' | 'expired';
  // ✅ NOUVEAU: Workflow d'approbation admin
  approval_status: 'draft' | 'pending_validation' | 'active_approved' | 'rejected';
  rejection_reason?: string;
  approved_by?: string;
  approved_at?: string;
  // ✅ NOUVEAU: Tracking création
  operator_id?: string;
  created_by?: string;
  created_at: string;
  updated_at: string;
  // ✅ NOUVEAU: Media (image/vidéo) pour affichage dans Stories
  mediaUrl?: string;
  mediaType?: 'image' | 'video';
}

export interface Review {
  id: string;
  tripId: string;
  departure: string;
  arrival: string;
  
  // ⚠️ ANONYMAT : Ces données ne sont JAMAIS exposées aux sociétés
  userId?: string; // Lien auth (backend only)
  passengerPhoneHash?: string; // Hash SHA-256 (backend only, dédoublonnage)
  
  // Données visibles par les sociétés
  passengerName: string; // "Client #1234" (anonymisé côté backend)
  rating: number;
  comment: string;
  date: string;
  
  // Réponse de la société
  response?: string;
  responseDate?: string;
  responseById?: string;
  responseByName?: string;
  
  status: 'pending' | 'published' | 'hidden';
}

export interface Incident {
  id: string;
  tripId: string;
  type: 'delay' | 'cancellation' | 'mechanical' | 'accident' | 'other';
  title: string;
  description: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
  status: 'open' | 'in-progress' | 'resolved';
  
  // ✅ Validation par Manager/Responsable
  validationStatus: 'pending' | 'validated' | 'rejected';
  validatedBy?: string;
  validatedByName?: string;
  validatedAt?: string;
  validationComment?: string;
  
  reportedBy: string; // Passager (anonymisé)
  reportedAt: string;
  resolvedAt?: string;
  gareId: string;
  gareName: string;
}

export interface SupportTicket {
  id: string;
  subject: string;
  description: string;
  category: 'technical' | 'financial' | 'operational' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in-progress' | 'resolved' | 'closed';
  createdBy: string;
  createdByName: string;
  createdAt: string;
  updatedAt: string;
  resolvedAt?: string;
  closedAt?: string;
  messages: {
    id: string;
    userId: string;
    userName: string;
    message: string;
    timestamp: string;
  }[];
}

export interface SeatLayout {
  id: string;
  name: string; // Ex: "Standard 2+2 (45 places)"
  type: 'standard' | 'vip' | 'mini';
  totalSeats: number;
  structure: {
    rows: number;
    leftSeats: number;  // Nombre de sièges à gauche de l'allée
    rightSeats: number; // Nombre de sièges à droite de l'allée
  };
  specialSeats?: {
    seatNumber: string;
    type: 'handicap' | 'priority' | 'vip';
  }[];
}

export interface Vehicle {
  id: string;
  number: string; // Ex: "BF-1024"
  layoutId: string; // Référence à SeatLayout
  gareId: string;
  gareName: string;
  status: 'active' | 'maintenance' | 'retired';
  acquisitionDate: string;
}

export interface Policy {
  id: string;
  title: string;
  description: string;
  content: string; // Contenu texte de la politique
  category: 'baggage' | 'cancellation' | 'boarding' | 'safety' | 'other';
  isActive: boolean;
  lastModified: string;
  createdAt: string;
}

interface DataContextType {
  // Stations
  stations: Station[];
  addStation: (station: Omit<Station, 'id'>) => void;
  updateStation: (id: string, updates: Partial<Station>) => void;
  deleteStation: (id: string) => void;

  // Routes
  routes: Route[];
  addRoute: (route: Omit<Route, 'id'>) => void;
  updateRoute: (id: string, updates: Partial<Route>) => void;
  deleteRoute: (id: string) => void;

  // Schedule Templates
  scheduleTemplates: ScheduleTemplate[];
  addScheduleTemplate: (template: Omit<ScheduleTemplate, 'id' | 'createdAt'>) => void;
  updateScheduleTemplate: (id: string, updates: Partial<ScheduleTemplate>) => void;
  deleteScheduleTemplate: (id: string) => void;

  // Pricing Rules
  pricingRules: PricingSegment[];
  addPricingRule: (rule: Omit<PricingRule, 'id'>) => void;
  updatePricingRule: (id: string, updates: Partial<PricingRule>) => void;
  deletePricingRule: (id: string) => void;

  // Managers
  managers: Manager[];
  addManager: (manager: Omit<Manager, 'id'>) => void;
  updateManager: (id: string, updates: Partial<Manager>) => void;
  deleteManager: (id: string) => void;

  // Cashiers
  cashiers: Cashier[];
  addCashier: (cashier: Omit<Cashier, 'id'>) => void;
  updateCashier: (id: string, updates: Partial<Cashier>) => void;
  deleteCashier: (id: string) => void;

  // Trips
  trips: Trip[];
  addTrip: (trip: Omit<Trip, 'id'>) => void;
  updateTrip: (id: string, updates: Partial<Trip>) => void;
  deleteTrip: (id: string) => void;
  cancelTripWithCascade: (id: string) => void; // ✅ AJOUTÉ: Annulation avec cascade billets
  generateTripsFromTemplates: (daysAhead?: number) => void;

  // Tickets
  tickets: Ticket[];
  addTicket: (ticket: Omit<Ticket, 'id'>) => void;
  updateTicket: (id: string, updates: Partial<Ticket>) => void;
  cancelTicket: (id: string) => void;
  refundTicket: (id: string) => void;

  // Cash Transactions
  cashTransactions: CashTransaction[];
  addCashTransaction: (transaction: Omit<CashTransaction, 'id'>) => void;

  // Stories
  stories: Story[];
  addStory: (story: Omit<Story, 'id' | 'views' | 'clicks' | 'createdAt'>) => void;
  updateStory: (id: string, updates: Partial<Story>) => void;
  deleteStory: (id: string) => void;

  // Promotions
  promotions: Promotion[];
  addPromotion: (promotion: Omit<Promotion, 'promotion_id' | 'current_uses' | 'created_at' | 'updated_at' | 'created_by' | 'approval_status'>) => void;
  updatePromotion: (id: string, updates: Partial<Promotion>) => void;
  deletePromotion: (id: string) => void;
  approvePromotion: (id: string, adminId: string) => void;  // ✅ NOUVEAU: Approbation admin
  rejectPromotion: (id: string, reason: string, adminId: string) => void;  // ✅ NOUVEAU: Rejet admin

  // Reviews
  reviews: Review[];
  updateReview: (id: string, updates: Partial<Review>) => void;
  respondToReview: (id: string, response: string) => void;

  // Incidents
  incidents: Incident[];
  addIncident: (incident: Omit<Incident, 'id'>) => void;
  updateIncident: (id: string, updates: Partial<Incident>) => void;

  // Support Tickets
  supportTickets: SupportTicket[];
  addSupportTicket: (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'messages'>) => void;
  updateSupportTicket: (id: string, updates: Partial<SupportTicket>) => void;
  addSupportMessage: (ticketId: string, message: string) => void;

  // Seat Layouts & Vehicles
  seatLayouts: SeatLayout[];
  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
  updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
  deleteVehicle: (id: string) => void;

  // Policies
  policies: Policy[];
  addPolicy: (policy: Omit<Policy, 'id' | 'createdAt' | 'lastModified'>) => void;
  updatePolicy: (id: string, updates: Partial<Policy>) => void;
  deletePolicy: (id: string) => void;

  // Analytics
  getAnalytics: () => {
    totalRevenue: number;
    totalTickets: number;
    averageOccupancy: number;
    topRoutes: { route: string; revenue: number; tickets: number }[];
  };
}

const DataContext = createContext<DataContextType | undefined>(undefined);

// Helper function to generate unique IDs
const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

// Initial mock data
const initialStations: Station[] = [
  { id: 'gare_1', name: 'Gare Routière de Ouagadougou', city: 'Ouagadougou', region: 'Centre', address: 'Avenue Kwame Nkrumah', phone: '+226 25 30 60 70', status: 'active', managerId: 'mgr_1', managerName: 'Marie Kaboré', coordinates: { lat: 12.3714, lng: -1.5197 }, workingHours: { openTime: '06:00', closeTime: '20:00' }, baggagePrice: 500 },
  { id: 'gare_2', name: 'Gare de Bobo-Dioulasso', city: 'Bobo-Dioulasso', region: 'Hauts-Bassins', address: 'Route de Banfora', phone: '+226 20 97 00 01', status: 'active', managerId: 'mgr_2', managerName: 'Pierre Sawadogo', coordinates: { lat: 11.1775, lng: -4.2979 }, workingHours: { openTime: '05:30', closeTime: '19:30' }, baggagePrice: 500 },
  { id: 'gare_3', name: 'Gare de Koudougou', city: 'Koudougou', region: 'Centre-Ouest', address: 'Avenue de la Nation', phone: '+226 25 44 00 15', status: 'active', coordinates: { lat: 12.2525, lng: -2.3625 }, workingHours: { openTime: '06:30', closeTime: '19:00' }, baggagePrice: 300 },
  { id: 'gare_4', name: 'Gare de Ouahigouya', city: 'Ouahigouya', region: 'Nord', address: 'Boulevard de la République', phone: '+226 24 55 00 22', status: 'active', coordinates: { lat: 13.5827, lng: -2.4214 }, workingHours: { openTime: '07:00', closeTime: '18:30' }, baggagePrice: 400 },
];

const initialRoutes: Route[] = [
  { id: 'route_1', departure: 'Ouagadougou', arrival: 'Bobo-Dioulasso', distance: 365, duration: 300, basePrice: 5000, status: 'active', description: 'Route principale vers Bobo' },
  { id: 'route_2', departure: 'Ouagadougou', arrival: 'Koudougou', distance: 97, duration: 90, basePrice: 2000, status: 'active', description: 'Route vers le Centre-Ouest' },
  { id: 'route_3', departure: 'Ouagadougou', arrival: 'Ouahigouya', distance: 182, duration: 150, basePrice: 3500, status: 'active', description: 'Route vers le Nord' },
  { id: 'route_4', departure: 'Bobo-Dioulasso', arrival: 'Ouagadougou', distance: 365, duration: 300, basePrice: 5000, status: 'active', description: 'Retour vers Ouagadougou' },
  { id: 'route_5', departure: 'Koudougou', arrival: 'Ouagadougou', distance: 97, duration: 90, basePrice: 2000, status: 'active', description: 'Retour vers Ouagadougou' },
];

// Initial schedule templates (TSR-style fixed schedules)
const initialScheduleTemplates: ScheduleTemplate[] = [
  // Ouagadougou → Bobo-Dioulasso (horaires TSR)
  { id: 'sched_1', routeId: 'route_1', departureTime: '05:30', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], serviceClass: 'standard', gareId: 'gare_1', gareName: 'Gare Routière de Ouagadougou', totalSeats: 45, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'sched_2', routeId: 'route_1', departureTime: '06:30', daysOfWeek: [1, 3, 5], serviceClass: 'standard', gareId: 'gare_1', gareName: 'Gare Routière de Ouagadougou', totalSeats: 45, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'sched_3', routeId: 'route_1', departureTime: '09:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], serviceClass: 'vip', gareId: 'gare_1', gareName: 'Gare Routière de Ouagadougou', totalSeats: 35, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'sched_4', routeId: 'route_1', departureTime: '10:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], serviceClass: 'standard', gareId: 'gare_1', gareName: 'Gare Routière de Ouagadougou', totalSeats: 45, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'sched_5', routeId: 'route_1', departureTime: '14:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], serviceClass: 'standard', gareId: 'gare_1', gareName: 'Gare Routière de Ouagadougou', totalSeats: 45, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
  
  // Ouagadougou → Koudougou
  { id: 'sched_6', routeId: 'route_2', departureTime: '06:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], serviceClass: 'standard', gareId: 'gare_1', gareName: 'Gare Routière de Ouagadougou', totalSeats: 45, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'sched_7', routeId: 'route_2', departureTime: '10:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], serviceClass: 'standard', gareId: 'gare_1', gareName: 'Gare Routière de Ouagadougou', totalSeats: 45, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'sched_8', routeId: 'route_2', departureTime: '15:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], serviceClass: 'standard', gareId: 'gare_1', gareName: 'Gare Routière de Ouagadougou', totalSeats: 45, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
  
  // Ouagadougou → Ouahigouya
  { id: 'sched_9', routeId: 'route_3', departureTime: '07:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], serviceClass: 'standard', gareId: 'gare_1', gareName: 'Gare Routière de Ouagadougou', totalSeats: 45, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'sched_10', routeId: 'route_3', departureTime: '13:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], serviceClass: 'standard', gareId: 'gare_1', gareName: 'Gare Routière de Ouagadougou', totalSeats: 45, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
  
  // Bobo-Dioulasso → Ouagadougou
  { id: 'sched_11', routeId: 'route_4', departureTime: '06:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], serviceClass: 'standard', gareId: 'gare_2', gareName: 'Gare de Bobo-Dioulasso', totalSeats: 45, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'sched_12', routeId: 'route_4', departureTime: '09:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], serviceClass: 'vip', gareId: 'gare_2', gareName: 'Gare de Bobo-Dioulasso', totalSeats: 35, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'sched_13', routeId: 'route_4', departureTime: '14:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], serviceClass: 'standard', gareId: 'gare_2', gareName: 'Gare de Bobo-Dioulasso', totalSeats: 45, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
  
  // Koudougou → Ouagadougou
  { id: 'sched_14', routeId: 'route_5', departureTime: '08:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], serviceClass: 'standard', gareId: 'gare_3', gareName: 'Gare de Koudougou', totalSeats: 45, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
  { id: 'sched_15', routeId: 'route_5', departureTime: '16:00', daysOfWeek: [0, 1, 2, 3, 4, 5, 6], serviceClass: 'standard', gareId: 'gare_3', gareName: 'Gare de Koudougou', totalSeats: 45, status: 'active', createdAt: '2024-01-01T00:00:00Z' },
];

export function DataProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // ✅ 100% BACKEND-READY: Gestion via useApiState (dual-mode intelligent)
  const [stations, setStations] = useApiState<Station[]>(
    'stations',
    () => stationService.list(),
    initialStations,
    { skipEmptyArrays: true }
  );
  
  const [routes, setRoutes] = useApiState<Route[]>(
    'routes',
    () => routeService.list(),
    initialRoutes,
    { skipEmptyArrays: true }
  );
  
  const [scheduleTemplates, setScheduleTemplates] = useApiState<ScheduleTemplate[]>(
    'scheduleTemplates',
    () => scheduleService.list(),
    initialScheduleTemplates,
    { skipEmptyArrays: true }
  );
  
  const [pricingRules, setPricingRules] = useApiState<PricingSegment[]>(
    'priceSegments',
    () => pricingService.listSegments(),
    []
  );
  
  const [managers, setManagers] = useApiState<Manager[]>(
    'managers',
    () => managerService.list(),
    () => [
      { id: 'mgr_1', name: 'Marie Kaboré', email: 'marie.kabore@tsr.bf', whatsapp: '+226 70 11 22 33', gareId: 'gare_1', gareName: 'Gare Routière de Ouagadougou', status: 'active', joinedDate: '2024-01-15', password: 'password123' },
      { id: 'mgr_2', name: 'Pierre Sawadogo', email: 'pierre.sawadogo@tsr.bf', whatsapp: '+226 70 44 55 66', gareId: 'gare_2', gareName: 'Gare de Bobo-Dioulasso', status: 'active', joinedDate: '2024-02-01', password: 'password123' },
    ],
    { skipEmptyArrays: true }
  );
  
  const [cashiers, setCashiers] = useApiState<Cashier[]>(
    'cashiers',
    () => cashierService.list(),
    () => [
      { id: 'cash_1', userId: 'user_1', name: 'Ibrahim Sawadogo', email: 'ibrahim.sawadogo@tsr.bf', whatsapp: '+226 70 22 33 44', gareId: 'gare_1', gareName: 'Gare Routière de Ouagadougou', managerId: 'mgr_1', status: 'active', joinedDate: '2024-03-10', password: 'password123' },
      { id: 'cash_2', userId: 'user_2', name: 'Fatou Diallo', email: 'fatou.diallo@tsr.bf', whatsapp: '+226 70 55 66 77', gareId: 'gare_1', gareName: 'Gare Routière de Ouagadougou', managerId: 'mgr_1', status: 'active', joinedDate: '2024-03-15', password: 'password123' },
      { id: 'cash_3', userId: 'user_3', name: 'Aminata Traoré', email: 'aminata.traore@tsr.bf', whatsapp: '+226 70 88 99 00', gareId: 'gare_2', gareName: 'Gare de Bobo-Dioulasso', managerId: 'mgr_2', status: 'active', joinedDate: '2024-04-01', password: 'password123' },
    ],
    { skipEmptyArrays: true }
  );
  
  // ✅ Trips mockés pour AUJOURD'HUI (utilise getCurrentDate pour cohérence avec les filtres)
  // ✅ CORRECTION: Générer des heures RELATIVES à maintenant pour que les départs soient toujours visibles
  const now = getCurrentDate();
  const today = getCurrentDate();
  today.setHours(0, 0, 0, 0); // Minuit aujourd'hui
  
  // Fonction helper pour générer les trips mockés
  const generateMockTrips = (): Trip[] => [
    // ⚪ OUAGADOUGOU → OUAHIGOUYA (parti il y a 2h) - 95% rempli
    {
      id: 'trip_today_4',
      routeId: 'route_3',
      departure: 'Ouagadougou',
      arrival: 'Ouahigouya',
      departureTime: new Date(now.getTime() - 2 * 60 * 60 * 1000).toISOString(), // Il y a 2h
      arrivalTime: new Date(now.getTime() + 30 * 60 * 1000).toISOString(), // Dans 30min
      busNumber: 'BF-1026',
      availableSeats: 2,
      totalSeats: 45,
      price: 3500,
      status: 'departed',
      gareId: 'gare_1',
      gareName: 'Gare Routière de Ouagadougou',
      serviceClass: 'standard',
      driverId: 'driver_4',
      driverName: 'Souleymane Sawadogo'
    },
    // 🟡 OUAGADOUGOU → BOBO (embarquement - départ dans 1h) - 73% rempli
    {
      id: 'trip_today_1',
      routeId: 'route_1',
      departure: 'Ouagadougou',
      arrival: 'Bobo-Dioulasso',
      departureTime: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString(), // Dans 1h
      arrivalTime: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(), // Dans 6h
      busNumber: 'BF-1024',
      availableSeats: 12,
      totalSeats: 45,
      price: 5000,
      status: 'boarding',
      gareId: 'gare_1',
      gareName: 'Gare Routière de Ouagadougou',
      serviceClass: 'standard',
      driverId: 'driver_1',
      driverName: 'Mamadou Diallo'
    },
    // 🔵 OUAGADOUGOU → KOUDOUGOU (départ dans 2h30 - Programmé) - 40% rempli
    {
      id: 'trip_today_2',
      routeId: 'route_2',
      departure: 'Ouagadougou',
      arrival: 'Koudougou',
      departureTime: new Date(now.getTime() + 2.5 * 60 * 60 * 1000).toISOString(), // Dans 2h30
      arrivalTime: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(), // Dans 4h
      busNumber: 'BF-1025',
      availableSeats: 27,
      totalSeats: 45,
      price: 2000,
      status: 'scheduled',
      gareId: 'gare_1',
      gareName: 'Gare Routière de Ouagadougou',
      serviceClass: 'standard',
      driverId: 'driver_2',
      driverName: 'Abdoulaye Koné'
    },
    // 🔵 OUAGADOUGOU → BOBO (départ dans 4h - Programmé VIP) - 85% rempli
    {
      id: 'trip_today_3',
      routeId: 'route_1',
      departure: 'Ouagadougou',
      arrival: 'Bobo-Dioulasso',
      departureTime: new Date(now.getTime() + 4 * 60 * 60 * 1000).toISOString(), // Dans 4h
      arrivalTime: new Date(now.getTime() + 9 * 60 * 60 * 1000).toISOString(), // Dans 9h
      busNumber: 'BF-2001',
      availableSeats: 5,
      totalSeats: 35,
      price: 7500,
      status: 'scheduled',
      gareId: 'gare_1',
      gareName: 'Gare Routière de Ouagadougou',
      serviceClass: 'vip',
      driverId: 'driver_3',
      driverName: 'Issaka Ouédraogo'
    },
    // 🔵 OUAGADOUGOU → KOUDOUGOU (départ dans 6h - Programmé) - 33% rempli
    {
      id: 'trip_today_2b',
      routeId: 'route_2',
      departure: 'Ouagadougou',
      arrival: 'Koudougou',
      departureTime: new Date(now.getTime() + 6 * 60 * 60 * 1000).toISOString(), // Dans 6h
      arrivalTime: new Date(now.getTime() + 7.5 * 60 * 60 * 1000).toISOString(), // Dans 7h30
      busNumber: 'BF-1026',
      availableSeats: 30,
      totalSeats: 45,
      price: 5000,
      status: 'scheduled',
      gareId: 'gare_1',
      gareName: 'Gare Routière de Ouagadougou',
      serviceClass: 'standard',
      driverId: 'driver_2',
      driverName: 'Abdoulaye Koné'
    },
    // 🔵 OUAGADOUGOU → BOBO (départ dans 8h - Programmé) - 60% rempli
    {
      id: 'trip_today_5',
      routeId: 'route_1',
      departure: 'Ouagadougou',
      arrival: 'Bobo-Dioulasso',
      departureTime: new Date(now.getTime() + 8 * 60 * 60 * 1000).toISOString(), // Dans 8h
      arrivalTime: new Date(now.getTime() + 13 * 60 * 60 * 1000).toISOString(), // Dans 13h
      busNumber: 'BF-1027',
      availableSeats: 18,
      totalSeats: 45,
      price: 5000,
      status: 'scheduled',
      gareId: 'gare_1',
      gareName: 'Gare Routière de Ouagadougou',
      serviceClass: 'standard',
      driverId: 'driver_5',
      driverName: 'Boukary Zerbo'
    },
    // ⚪ BOBO → OUAGADOUGOU (parti il y a 3h) - 100% rempli
    {
      id: 'trip_today_7',
      routeId: 'route_4',
      departure: 'Bobo-Dioulasso',
      arrival: 'Ouagadougou',
      departureTime: new Date(now.getTime() - 3 * 60 * 60 * 1000).toISOString(), // Il y a 3h
      arrivalTime: new Date(now.getTime() + 2 * 60 * 60 * 1000).toISOString(), // Dans 2h
      busNumber: 'BF-2003',
      availableSeats: 0,
      totalSeats: 45,
      price: 5000,
      status: 'departed',
      gareId: 'gare_2',
      gareName: 'Gare de Bobo-Dioulasso',
      serviceClass: 'standard',
      driverId: 'driver_7',
      driverName: 'Alassane Compaoré'
    },
    // 🟡 BOBO → OUAGADOUGOU (embarquement - départ dans 1h30) - 90% rempli
    {
      id: 'trip_today_6',
      routeId: 'route_4',
      departure: 'Bobo-Dioulasso',
      arrival: 'Ouagadougou',
      departureTime: new Date(now.getTime() + 1.5 * 60 * 60 * 1000).toISOString(), // Dans 1h30
      arrivalTime: new Date(now.getTime() + 6.5 * 60 * 60 * 1000).toISOString(), // Dans 6h30
      busNumber: 'BF-2002',
      availableSeats: 3,
      totalSeats: 35,
      price: 7500,
      status: 'boarding',
      gareId: 'gare_2',
      gareName: 'Gare de Bobo-Dioulasso',
      serviceClass: 'vip',
      driverId: 'driver_6',
      driverName: 'Jean-Baptiste Kaboré'
    },
    // 🔵 BOBO → OUAGADOUGOU (départ dans 5h - Programmé) - 55% rempli
    {
      id: 'trip_today_8',
      routeId: 'route_4',
      departure: 'Bobo-Dioulasso',
      arrival: 'Ouagadougou',
      departureTime: new Date(now.getTime() + 5 * 60 * 60 * 1000).toISOString(), // Dans 5h
      arrivalTime: new Date(now.getTime() + 10 * 60 * 60 * 1000).toISOString(), // Dans 10h
      busNumber: 'BF-2004',
      availableSeats: 20,
      totalSeats: 45,
      price: 5000,
      status: 'scheduled',
      gareId: 'gare_2',
      gareName: 'Gare de Bobo-Dioulasso',
      serviceClass: 'standard',
      driverId: 'driver_8',
      driverName: 'Ibrahim Nikiema'
    }
  ];

  const [trips, setTrips] = useApiState<Trip[]>(
    'trips',
    () => tripService.list(),
    generateMockTrips,
    { skipEmptyArrays: true }
  );
  
  // ✅ Tickets mockés pour les trips d'aujourd'hui
  // Note: purchaseDate = hier soir 14h pour simuler des achats anticipés
  const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  yesterday.setHours(14, 0, 0, 0);
  
  // Fonction helper pour générer les tickets mockés
  const generateMockTickets = (): Ticket[] => [
    // Trip 1 (Ouaga→Bobo embarquement, 33 passagers sur 45)
    ...Array.from({ length: 33 }, (_, i) => ({
      id: `ticket_today_1_${i + 1}`,
      tripId: 'trip_today_1',
      passengerName: ['Amadou Traoré', 'Fatoumata Sankara', 'Ibrahim Ouédraogo', 'Mariama Kaboré', 'Boukary Zerbo', 
                      'Awa Diallo', 'Souleymane Sawadogo', 'Salimata Compaoré', 'Abdoulaye Koné', 'Aïcha Nikiema',
                      'Moussa Ouattara', 'Rasmata Zongo', 'Issouf Tiendrebeogo', 'Assétou Yameogo', 'Hamadou Barro',
                      'Zenabo Ilboudo', 'Dramane Kinda', 'Adjara Palenfo', 'Yacouba Sana', 'Bintou Sawadogo',
                      'Karim Dicko', 'Nafissatou Badolo', 'Oumar Ouédraogo', 'Mariam Tapsoba', 'Seydou Kaboré',
                      'Aminata Traoré', 'Mamadou Coulibaly', 'Assita Diallo', 'Blaise Compaoré', 'Aïssata Ouédraogo',
                      'Lassina Sawadogo', 'Hawa Zongo', 'Adama Kaboré'][i] || `Passager ${i + 1}`,
      passengerPhone: `+226 70 ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))}`,
      seatNumber: `A${i + 1}`,
      price: 5000,
      paymentMethod: (Math.random() > 0.7 ? 'orange_money' : 'cash') as Ticket['paymentMethod'],
      salesChannel: Math.random() > 0.8 ? 'online' : 'counter',
      status: 'active',
      purchaseDate: yesterday.toISOString(),
      cashierId: 'cash_1',
      cashierName: 'Ibrahim Sawadogo',
      gareId: 'gare_1',
      departure: 'Ouagadougou',
      arrival: 'Bobo-Dioulasso',
      departureTime: new Date(now.getTime() + 1 * 60 * 60 * 1000).toISOString() // Départ dans 1h
    } as unknown as Ticket)),
    
    // Trip 2 (Ouaga→Koudougou 10h, 18 passagers sur 45)
    ...Array.from({ length: 18 }, (_, i) => ({
      id: `ticket_today_2_${i + 1}`,
      tripId: 'trip_today_2',
      passengerName: ['Ali Sawadogo', 'Fati Ouédraogo', 'Moussa Kaboré', 'Awa Traoré', 'Issiaka Compaoré',
                      'Rasmata Zongo', 'Boureima Barro', 'Assétou Kaboré', 'Dramane Ouattara', 'Mariama Diallo',
                      'Yacouba Nikiema', 'Bintou Sawadogo', 'Hamadou Zerbo', 'Nafissatou Ilboudo', 'Oumar Tapsoba',
                      'Aminata Badolo', 'Seydou Kinda', 'Aïssata Palenfo'][i] || `Passager ${i + 1}`,
      passengerPhone: `+226 70 ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))}`,
      seatNumber: `B${i + 1}`,
      price: 2000,
      paymentMethod: (Math.random() > 0.6 ? 'orange_money' : 'cash') as Ticket['paymentMethod'],
      salesChannel: Math.random() > 0.7 ? 'online' : 'counter',
      status: 'active',
      purchaseDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 30).toISOString(),
      cashierId: 'cash_2',
      cashierName: 'Fatou Diallo',
      gareId: 'gare_1',
      departure: 'Ouagadougou',
      arrival: 'Koudougou',
      departureTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString()
    } as unknown as Ticket)),
    
    // Trip 3 (Ouaga→Bobo 14h VIP, 30 passagers sur 35)
    ...Array.from({ length: 30 }, (_, i) => ({
      id: `ticket_today_3_${i + 1}`,
      tripId: 'trip_today_3',
      passengerName: ['Dr. Jean Kaboré', 'Mme Léontine Ouédraogo', 'M. Pierre Sawadogo', 'Mme Alice Compaoré', 'M. François Zongo',
                      'Mme Sophie Traoré', 'M. Marcel Nikiema', 'Mme Christine Diallo', 'M. Paul Barro', 'Mme Marie Tapsoba',
                      'M. Jacques Ouattara', 'Mme Rose Kaboré', 'M. Bernard Ilboudo', 'Mme Thérèse Badolo', 'M. Georges Kinda',
                      'Mme Pauline Palenfo', 'M. André Zerbo', 'Mme Julienne Yameogo', 'M. Louis Sana', 'Mme Hélène Sawadogo',
                      'M. Emmanuel Dicko', 'Mme Jeanne Tiendrebeogo', 'M. Robert Coulibaly', 'Mme Brigitte Ouédraogo', 'M. Charles Kaboré',
                      'Mme Monique Traoré', 'M. Victor Compaoré', 'Mme Élisabeth Diallo', 'M. Alain Barro', 'Mme Catherine Tapsoba'][i] || `Passager VIP ${i + 1}`,
      passengerPhone: `+226 70 ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))}`,
      seatNumber: `V${i + 1}`,
      price: 7500,
      paymentMethod: (Math.random() > 0.5 ? 'orange_money' : 'cash') as Ticket['paymentMethod'],
      salesChannel: Math.random() > 0.6 ? 'online' : 'counter',
      status: 'active',
      purchaseDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2, 10, 0).toISOString(),
      cashierId: 'cash_1',
      cashierName: 'Ibrahim Sawadogo',
      gareId: 'gare_1',
      departure: 'Ouagadougou',
      arrival: 'Bobo-Dioulasso',
      departureTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0).toISOString()
    } as unknown as Ticket)),
    
    // Trip 4 (Ouaga→Ouahigouya 6h PARTI, 43 passagers sur 45)
    ...Array.from({ length: 43 }, (_, i) => ({
      id: `ticket_today_4_${i + 1}`,
      tripId: 'trip_today_4',
      passengerName: `Passager ${i + 1}`,
      passengerPhone: `+226 70 ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))}`,
      seatNumber: `C${i + 1}`,
      price: 3500,
      paymentMethod: (Math.random() > 0.7 ? 'orange_money' : 'cash') as Ticket['paymentMethod'],
      salesChannel: Math.random() > 0.75 ? 'online' : 'counter',
      status: 'active',
      purchaseDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 16, 0).toISOString(),
      cashierId: 'cash_2',
      cashierName: 'Fatou Diallo',
      gareId: 'gare_1',
      departure: 'Ouagadougou',
      arrival: 'Ouahigouya',
      departureTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 6, 0).toISOString()
    } as unknown as Ticket)),
    
    // Trip 5 (Ouaga→Bobo 17h, 27 passagers sur 45)
    ...Array.from({ length: 27 }, (_, i) => ({
      id: `ticket_today_5_${i + 1}`,
      tripId: 'trip_today_5',
      passengerName: `Passager ${i + 1}`,
      passengerPhone: `+226 70 ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))}`,
      seatNumber: `D${i + 1}`,
      price: 5000,
      paymentMethod: (Math.random() > 0.7 ? 'orange_money' : 'cash') as Ticket['paymentMethod'],
      salesChannel: Math.random() > 0.8 ? 'online' : 'counter',
      status: 'active',
      purchaseDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30).toISOString(),
      cashierId: 'cash_1',
      cashierName: 'Ibrahim Sawadogo',
      gareId: 'gare_1',
      departure: 'Ouagadougou',
      arrival: 'Bobo-Dioulasso',
      departureTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 17, 0).toISOString()
    } as unknown as Ticket)),
    
    // ✅ AJOUTÉ: Trip 2b (Ouaga→Koudougou 15h, 15 passagers vendus AUJOURD'HUI par cash_1)
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `ticket_today_2b_${i + 1}`,
      tripId: 'trip_today_2b',
      passengerName: `Passager Koudougou ${i + 1}`,
      passengerPhone: `+226 70 ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))}`,
      seatNumber: `K${i + 1}`,
      price: 5000,
      paymentMethod: (Math.random() > 0.7 ? 'orange_money' : 'cash') as Ticket['paymentMethod'],
      salesChannel: Math.random() > 0.8 ? 'online' : 'counter',
      status: 'active',
      purchaseDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0).toISOString(),
      cashierId: 'cash_1',
      cashierName: 'Ibrahim Sawadogo',
      gareId: 'gare_1',
      departure: 'Ouagadougou',
      arrival: 'Koudougou',
      departureTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 0).toISOString()
    } as unknown as Ticket)),
    
    // Trip 6 (Bobo→Ouaga 9h VIP, 32 passagers sur 35)
    ...Array.from({ length: 32 }, (_, i) => ({
      id: `ticket_today_6_${i + 1}`,
      tripId: 'trip_today_6',
      passengerName: `Passager VIP Bobo ${i + 1}`,
      passengerPhone: `+226 70 ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))}`,
      seatNumber: `E${i + 1}`,
      price: 7500,
      paymentMethod: (Math.random() > 0.6 ? 'orange_money' : 'cash') as Ticket['paymentMethod'],
      salesChannel: Math.random() > 0.7 ? 'online' : 'counter',
      status: 'active',
      purchaseDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 9, 0).toISOString(),
      cashierId: 'cash_3',
      cashierName: 'Aminata Traoré',
      gareId: 'gare_2',
      departure: 'Bobo-Dioulasso',
      arrival: 'Ouagadougou',
      departureTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 0).toISOString()
    } as unknown as Ticket)),
    
    // Trip 7 (Bobo→Ouaga 6h PARTI COMPLET, 45 passagers sur 45)
    ...Array.from({ length: 45 }, (_, i) => ({
      id: `ticket_today_7_${i + 1}`,
      tripId: 'trip_today_7',
      passengerName: `Passager ${i + 1}`,
      passengerPhone: `+226 70 ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))}`,
      seatNumber: `F${i + 1}`,
      price: 5000,
      paymentMethod: (Math.random() > 0.7 ? 'orange_money' : 'cash') as Ticket['paymentMethod'],
      salesChannel: Math.random() > 0.8 ? 'online' : 'counter',
      status: 'active',
      purchaseDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2, 15, 0).toISOString(),
      cashierId: 'cash_3',
      cashierName: 'Aminata Traoré',
      gareId: 'gare_2',
      departure: 'Bobo-Dioulasso',
      arrival: 'Ouagadougou',
      departureTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 6, 0).toISOString()
    } as unknown as Ticket)),
    
    // Trip 8 (Bobo→Ouaga 14h, 25 passagers sur 45)
    ...Array.from({ length: 25 }, (_, i) => ({
      id: `ticket_today_8_${i + 1}`,
      tripId: 'trip_today_8',
      passengerName: `Passager ${i + 1}`,
      passengerPhone: `+226 70 ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))}`,
      seatNumber: `G${i + 1}`,
      price: 5000,
      paymentMethod: (Math.random() > 0.7 ? 'orange_money' : 'cash') as Ticket['paymentMethod'],
      salesChannel: Math.random() > 0.8 ? 'online' : 'counter',
      status: 'active',
      purchaseDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 10, 0).toISOString(),
      cashierId: 'cash_3',
      cashierName: 'Aminata Traoré',
      gareId: 'gare_2',
      departure: 'Bobo-Dioulasso',
      arrival: 'Ouagadougou',
      departureTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 14, 0).toISOString()
    } as unknown as Ticket)),
    
    // ✅ TICKETS ACHETÉS AUJOURD'HUI pour départs DEMAIN (augmente "Billets vendus" mais PAS "Passagers totaux")
    // Ces tickets montrent la réservation anticipée - réaliste pour le business
    ...Array.from({ length: 15 }, (_, i) => ({
      id: `ticket_future_1_${i + 1}`,
      tripId: 'trip_future_ouaga_bobo_tomorrow_7h', // Ce trip n'est pas dans today
      passengerName: `Réservation ${i + 1}`,
      passengerPhone: `+226 70 ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))}`,
      seatNumber: `R${i + 1}`,
      price: 5000,
      paymentMethod: (Math.random() > 0.5 ? 'orange_money' : 'cash') as Ticket['paymentMethod'],
      salesChannel: Math.random() > 0.6 ? 'online' : 'counter',
      status: 'active',
      purchaseDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 30).toISOString(), // ✅ Acheté AUJOURD'HUI
      cashierId: 'cash_1',
      cashierName: 'Ousmane Kaboré',
      gareId: 'gare_1',
      departure: 'Ouagadougou',
      arrival: 'Bobo-Dioulasso',
      departureTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1, 7, 0).toISOString() // ✅ Départ DEMAIN
    } as unknown as Ticket)),
    
    // ✅ Plus de tickets achetés AUJOURD'HUI pour départs APRÈS-DEMAIN
    ...Array.from({ length: 8 }, (_, i) => ({
      id: `ticket_future_2_${i + 1}`,
      tripId: 'trip_future_ouaga_ouahi_day_after', // Ce trip n'est pas dans today
      passengerName: `Réservation anticipée ${i + 1}`,
      passengerPhone: `+226 70 ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))}`,
      seatNumber: `S${i + 1}`,
      price: 3500,
      paymentMethod: 'orange_money',
      salesChannel: 'online', // Ces réservations anticipées viennent surtout de l'app mobile
      status: 'active',
      purchaseDate: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 15, 45).toISOString(), // ✅ Acheté AUJOURD'HUI
      cashierId: 'online_system',
      cashierName: 'Vente en ligne',
      gareId: 'gare_1',
      departure: 'Ouagadougou',
      arrival: 'Ouahigouya',
      departureTime: new Date(today.getFullYear(), today.getMonth(), today.getDate() + 2, 10, 0).toISOString() // ✅ Départ APRÈS-DEMAIN
    })),
    
    // ✅ TICKETS ACHETÉS IL Y A 4-5 JOURS pour départs AUJOURD'HUI (augmente "Passagers totaux" mais PAS "Billets vendus")
    // Simule des réservations faites en avance pour les voyages d'aujourd'hui
    ...Array.from({ length: 12 }, (_, i) => ({
      id: `ticket_old_purchase_1_${i + 1}`,
      tripId: 'trip_today_1', // Départ d'aujourd'hui (Ouaga→Bobo 7h)
      passengerName: `Réservation ancienne ${i + 1}`,
      passengerPhone: `+226 70 ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))} ${String(Math.floor(Math.random() * 90 + 10))}`,
      seatNumber: `OLD${i + 1}`,
      price: 5000,
      paymentMethod: 'orange_money',
      salesChannel: 'online',
      status: 'active',
      purchaseDate: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 4, 18, 0).toISOString(), // ✅ Acheté IL Y A 4 JOURS
      cashierId: 'online_system',
      cashierName: 'Vente en ligne',
      gareId: 'gare_1',
      departure: 'Ouagadougou',
      arrival: 'Bobo-Dioulasso',
      departureTime: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 7, 0).toISOString() // ✅ Départ AUJOURD'HUI
    } as unknown as Ticket))
  ] as Ticket[];

  const [tickets, setTickets] = useApiState<Ticket[]>(
    'tickets',
    () => ticketService.list(),
    generateMockTickets,
    { skipEmptyArrays: true }
  );
  
  // ✅ CashTransactions mockées pour AUJOURD'HUI (9 janvier 2026) - cohérentes avec les tickets vendus
  const [cashTransactions, setCashTransactions] = useState<CashTransaction[]>([
    // ✅ Ventes du Trip 1 (Ouaga→Bobo 7h, 33 billets x 5000 FCFA = 165,000 FCFA)
    // Vendus HIER vers 14h par cash_1 (Ibrahim Sawadogo)
    {
      id: 'cash_sale_trip1',
      type: 'sale',
      amount: 165000,
      method: 'cash',
      description: 'Vente de 33 billets - Ouaga → Bobo 7h',
      cashierId: 'cash_1',
      cashierName: 'Ibrahim Sawadogo',
      gareId: 'gare_1',
      tripId: 'trip_today_1',
      ticketIds: Array.from({ length: 33 }, (_, i) => `ticket_today_1_${i + 1}`),
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 1, 14, 0).toISOString(),
      status: 'completed'
    },

    // ✅ Ventes du Trip 2 (Ouaga→Koudougou 10h, 18 billets x 2000 FCFA = 36,000 FCFA)
    // Vendus AUJOURD'HUI vers 8h30 par cash_2 (Fatou Diallo)
    {
      id: 'cash_sale_trip2',
      type: 'sale',
      amount: 36000,
      method: 'cash',
      description: 'Vente de 18 billets - Ouaga → Koudougou 10h',
      cashierId: 'cash_2',
      cashierName: 'Fatou Diallo',
      gareId: 'gare_1',
      tripId: 'trip_today_2',
      ticketIds: Array.from({ length: 18 }, (_, i) => `ticket_today_2_${i + 1}`),
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 30).toISOString(),
      status: 'completed'
    },

    // ✅ Ventes du Trip 3 (Ouaga→Bobo 14h VIP, 30 billets x 7500 FCFA = 225,000 FCFA)
    // Vendus IL Y A 2 JOURS vers 10h par cash_1
    {
      id: 'cash_sale_trip3',
      type: 'sale',
      amount: 225000,
      method: 'orange_money',
      description: 'Vente de 30 billets VIP - Ouaga → Bobo 14h',
      cashierId: 'cash_1',
      cashierName: 'Ibrahim Sawadogo',
      gareId: 'gare_1',
      tripId: 'trip_today_3',
      ticketIds: Array.from({ length: 30 }, (_, i) => `ticket_today_3_${i + 1}`),
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate() - 2, 10, 0).toISOString(),
      status: 'completed'
    },

    // ✅ Ventes du Trip 5 (Ouaga→Bobo 17h, 27 billets x 5000 FCFA = 135,000 FCFA)
    // Vendus AUJOURD'HUI vers 11h30 par cash_1
    {
      id: 'cash_sale_trip5',
      type: 'sale',
      amount: 135000,
      method: 'cash',
      description: 'Vente de 27 billets - Ouaga → Bobo 17h',
      cashierId: 'cash_1',
      cashierName: 'Ibrahim Sawadogo',
      gareId: 'gare_1',
      tripId: 'trip_today_5',
      ticketIds: Array.from({ length: 27 }, (_, i) => `ticket_today_5_${i + 1}`),
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 11, 30).toISOString(),
      status: 'completed'
    },

    // ✅ Ventes du Trip 2b (Ouaga→Koudougou 15h, 15 billets x 5000 FCFA = 75,000 FCFA)
    // Vendus AUJOURD'HUI vers 8h par cash_1
    {
      id: 'cash_sale_trip2b',
      type: 'sale',
      amount: 75000,
      method: 'cash',
      description: 'Vente de 15 billets - Ouaga → Koudougou 15h',
      cashierId: 'cash_1',
      cashierName: 'Ibrahim Sawadogo',
      gareId: 'gare_1',
      tripId: 'trip_today_2b',
      ticketIds: Array.from({ length: 15 }, (_, i) => `ticket_today_2b_${i + 1}`),
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 8, 0).toISOString(),
      status: 'completed'
    },

    // ✅ Dépôt de caisse initial par cash_2 AUJOURD'HUI à 6h
    {
      id: 'cash_deposit_morning',
      type: 'deposit',
      amount: 50000,
      method: 'cash',
      description: 'Dépôt initial de journée',
      cashierId: 'cash_2',
      cashierName: 'Fatou Diallo',
      gareId: 'gare_1',
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 6, 0).toISOString(),
      status: 'completed'
    },

    // ✅ Remboursement d'un billet AUJOURD'HUI à 9h15
    {
      id: 'cash_refund_1',
      type: 'refund',
      amount: 5000,
      method: 'cash',
      description: 'Remboursement billet Ouaga → Bobo',
      cashierId: 'cash_1',
      cashierName: 'Ibrahim Sawadogo',
      gareId: 'gare_1',
      tripId: 'trip_today_1',
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 9, 15).toISOString(),
      status: 'completed'
    },

    // ✅ Retrait de caisse par cash_1 AUJOURD'HUI à 13h pour dépôt banque
    {
      id: 'cash_withdrawal_1',
      type: 'withdrawal',
      amount: 100000,
      method: 'cash',
      description: 'Remise en banque',
      cashierId: 'cash_1',
      cashierName: 'Ibrahim Sawadogo',
      gareId: 'gare_1',
      timestamp: new Date(today.getFullYear(), today.getMonth(), today.getDate(), 13, 0).toISOString(),
      status: 'completed'
    }
  ]);
  
  const [stories, setStories] = useState<Story[]>([
    {
      id: 'story_1',
      title: 'Promotion Noël 2024',
      mediaUrl: 'https://images.unsplash.com/photo-1512389142860-9c449e58a543?w=800',
      mediaType: 'image',
      duration: 10,
      targeting: 'all',
      startDate: '2024-12-01',
      endDate: '2024-12-25',
      views: 1245,
      clicks: 89,
      status: 'active',
      approval_status: 'active',
      createdAt: '2024-12-01T08:00:00Z',
      createdBy: 'resp_1',
      createdByName: 'Admin TSR'
    },
    {
      id: 'story_2',
      title: 'Nouveau service Bobo-Dioulasso',
      mediaUrl: 'https://images.unsplash.com/photo-1544620347-c4fd4a3d5957?w=800',
      mediaType: 'image',
      duration: 8,
      targeting: 'city',
      targetValue: 'Bobo-Dioulasso',
      startDate: '2024-12-10',
      endDate: '2024-12-31',
      views: 856,
      clicks: 54,
      status: 'active',
      approval_status: 'active',
      createdAt: '2024-12-10T10:30:00Z',
      createdBy: 'resp_1',
      createdByName: 'Admin TSR'
    },
    {
      id: 'story_3',
      title: 'Réduction étudiants',
      mediaUrl: 'https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=800',
      mediaType: 'image',
      duration: 12,
      targeting: 'all',
      startDate: '2024-12-20',
      endDate: '2025-01-15',
      views: 0,
      clicks: 0,
      status: 'scheduled',
      approval_status: 'draft',
      createdAt: '2024-12-15T14:00:00Z',
      createdBy: 'resp_1',
      createdByName: 'Admin TSR'
    },
  ]);
  
  // ✅ PROMOTIONS - Réductions de prix
  const [promotions, setPromotions] = useState<Promotion[]>([
    {
      promotion_id: 'promo_1',
      title: 'Réduction hiver 25%',
      description: 'Réduction spéciale pour la saison hivernale 2026',
      discount_type: 'PERCENTAGE',
      discount_value: 25,
      trip_id: undefined, // Appliquée à tous les trajets
      start_date: '2026-02-01',
      end_date: '2026-02-28',
      max_uses: 1000,
      current_uses: 0,
      status: 'active',
      approval_status: 'active_approved',
      created_by: 'resp_1',
      created_at: '2026-02-01T08:00:00Z',
      updated_at: new Date().toISOString()
    },
    {
      promotion_id: 'promo_2',
      title: 'Offre flash -2000 FCFA',
      description: 'Réduction fixe sur trajet Ouaga-Bobo cette semaine',
      discount_type: 'FIXED_AMOUNT',
      discount_value: 2000,
      trip_id: 'trip_006', // Trajet Ouaga-Bobo
      start_date: '2026-02-27',
      end_date: '2026-03-05',
      max_uses: 100,
      current_uses: 0,
      status: 'draft',
      approval_status: 'draft',
      created_by: 'resp_1',
      created_at: '2026-02-20T14:00:00Z',
      updated_at: new Date().toISOString()
    }
  ]);
  
  const [reviews, setReviews] = useState<Review[]>([]);
  const [incidents, setIncidents] = useState<Incident[]>([
    {
      id: 'incident_1',
      tripId: trips[0]?.id || 'trip_1',
      type: 'delay',
      title: 'Retard au départ',
      description: 'Le bus a quitté la gare avec 45 minutes de retard. Problème de trafic sur le boulevard.',
      severity: 'medium',
      status: 'open',
      validationStatus: 'pending',
      reportedBy: 'Passager #A3B7',
      reportedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      gareId: 'gare_1',
      gareName: 'Gare Routière de Ouagadougou'
    },
    {
      id: 'incident_2',
      tripId: trips[1]?.id || 'trip_2',
      type: 'mechanical',
      title: 'Panne mécanique',
      description: 'Le bus a eu un problème de moteur en cours de route. Les passagers attendent l\'intervention.',
      severity: 'high',
      status: 'in-progress',
      validationStatus: 'validated',
      validatedBy: 'mgr_1',
      validatedByName: 'Marie Kaboré',
      validatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      validationComment: 'Panne confirmée, dépanneuse en route',
      reportedBy: 'Passager #C2F1',
      reportedAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      gareId: 'gare_1',
      gareName: 'Gare Routière de Ouagadougou'
    },
    {
      id: 'incident_3',
      tripId: trips[2]?.id || 'trip_3',
      type: 'accident',
      title: 'Accident mineur',
      description: 'Accrochage avec un véhicule, pas de blessés mais dégâts matériels légers.',
      severity: 'critical',
      status: 'resolved',
      validationStatus: 'validated',
      validatedBy: 'mgr_2',
      validatedByName: 'Pierre Sawadogo',
      validatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      validationComment: 'Accident confirmé, constat établi',
      reportedBy: 'Passager #D8K3',
      reportedAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      gareId: 'gare_2',
      gareName: 'Gare de Bobo-Dioulasso'
    },
  ]);
  const [supportTickets, setSupportTickets] = useState<SupportTicket[]>([
    // ✅ Données mockées pour tester l'UI Support
    {
      id: 'support_1',
      subject: 'Problème de synchronisation des ventes',
      description: 'Les ventes du guichet ne se synchronisent pas correctement avec le dashboard. Certaines transactions n\'apparaissent qu\'après plusieurs heures.',
      category: 'technical',
      priority: 'high',
      status: 'in-progress',
      createdBy: 'mgr_1',
      createdByName: 'Amadou Traoré',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      messages: [
        {
          id: 'msg_1',
          userId: 'mgr_1',
          userName: 'Amadou Traoré',
          message: 'Le problème persiste depuis ce matin. Nous avons 15 ventes qui ne sont pas synchronisées.',
          timestamp: new Date(Date.now() - 23 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'msg_2',
          userId: 'admin_1',
          userName: 'Support FasoTravel',
          message: 'Bonjour Amadou, nous avons identifié le problème. C\'est lié à la connexion réseau de votre gare. Nous déployons un correctif dans l\'heure.',
          timestamp: new Date(Date.now() - 22 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'msg_3',
          userId: 'mgr_1',
          userName: 'Amadou Traoré',
          message: 'Merci pour votre réactivité. Je surveille la situation.',
          timestamp: new Date(Date.now() - 21 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: 'support_2',
      subject: 'Question sur le calcul des commissions',
      description: 'Je souhaiterais comprendre comment sont calculées les commissions sur les ventes online vs guichets. Y a-t-il une documentation disponible ?',
      category: 'financial',
      priority: 'medium',
      status: 'resolved',
      createdBy: 'mgr_2',
      createdByName: 'Fatoumata Sankara',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      messages: [
        {
          id: 'msg_4',
          userId: 'admin_1',
          userName: 'Support FasoTravel',
          message: 'Bonjour Fatoumata ! Pour les ventes online, la commission sera prélevée prochainement (actuellement gratuit en phase de lancement). Pour les ventes guichets, aucune commission n\'est prélevée car c\'est votre canal direct.',
          timestamp: new Date(Date.now() - 4.5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'msg_5',
          userId: 'mgr_2',
          userName: 'Fatoumata Sankara',
          message: 'Parfait, merci pour ces précisions ! C\'est très clair maintenant.',
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'msg_6',
          userId: 'admin_1',
          userName: 'Support FasoTravel',
          message: 'Avec plaisir ! N\'hésitez pas si vous avez d\'autres questions. Je marque ce ticket comme résolu.',
          timestamp: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: 'support_3',
      subject: 'Demande d\'ajout d\'une nouvelle route',
      description: 'Nous aimerions ajouter une route Ouagadougou - Koudougou avec départs quotidiens à 7h et 15h. Quelle est la procédure ?',
      category: 'operational',
      priority: 'medium',
      status: 'open',
      createdBy: 'mgr_1',
      createdByName: 'Amadou Traoré',
      createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      messages: []
    },
    {
      id: 'support_4',
      subject: 'Bug affichage mobile - billets imprimés',
      description: 'Sur l\'application mobile, les billets imprimés au guichet n\'affichent pas le QR code correctement. Le voyageur ne peut pas scanner son billet.',
      category: 'technical',
      priority: 'urgent',
      status: 'in-progress',
      createdBy: 'mgr_3',
      createdByName: 'Ibrahim Ouédraogo',
      createdAt: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
      messages: [
        {
          id: 'msg_7',
          userId: 'admin_1',
          userName: 'Support FasoTravel',
          message: 'Bonjour Ibrahim, merci pour le signalement. Notre équipe technique travaille sur ce bug en priorité urgente. Pouvez-vous me donner un exemple de numéro de billet concerné ?',
          timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'msg_8',
          userId: 'mgr_3',
          userName: 'Ibrahim Ouédraogo',
          message: 'Oui bien sûr : BF-20260108-001234. Le client était très mécontent.',
          timestamp: new Date(Date.now() - 1.5 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'msg_9',
          userId: 'admin_1',
          userName: 'Support FasoTravel',
          message: 'Merci ! Nous avons reproduit le bug et déployons un correctif dans 30 minutes maximum. Je vous tiens informé.',
          timestamp: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString()
        }
      ]
    },
    {
      id: 'support_5',
      subject: 'Formation des caissiers',
      description: 'Pouvez-vous organiser une session de formation pour nos nouveaux caissiers sur l\'utilisation du système de vente de billets ?',
      category: 'other',
      priority: 'low',
      status: 'closed',
      createdBy: 'mgr_2',
      createdByName: 'Fatoumata Sankara',
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      resolvedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      closedAt: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString(),
      messages: [
        {
          id: 'msg_10',
          userId: 'admin_1',
          userName: 'Support FasoTravel',
          message: 'Bonjour Fatoumata ! Nous organisons des sessions de formation chaque lundi à 9h. Je vous inscris pour lundi prochain. Vous recevrez un email de confirmation.',
          timestamp: new Date(Date.now() - 9.5 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'msg_11',
          userId: 'mgr_2',
          userName: 'Fatoumata Sankara',
          message: 'Parfait ! Merci beaucoup. Nous serons 3 caissiers à participer.',
          timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
        },
        {
          id: 'msg_12',
          userId: 'admin_1',
          userName: 'Support FasoTravel',
          message: 'Excellent ! Formation confirmée pour 3 personnes. À lundi !',
          timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000).toISOString()
        }
      ]
    }
  ]);
  const [seatLayouts] = useState<SeatLayout[]>([
    { id: 'layout_1', name: 'Standard 2+2 (45 places)', type: 'standard', totalSeats: 45, structure: { rows: 5, leftSeats: 2, rightSeats: 2 } },
    { id: 'layout_2', name: 'VIP 2+2 (35 places)', type: 'vip', totalSeats: 35, structure: { rows: 5, leftSeats: 2, rightSeats: 2 } },
    { id: 'layout_3', name: 'Mini 1+1 (20 places)', type: 'mini', totalSeats: 20, structure: { rows: 5, leftSeats: 1, rightSeats: 1 } },
  ]);
  const [vehicles, setVehicles] = useState<Vehicle[]>([
    { id: 'vehicle_1', number: 'BF-1024', layoutId: 'layout_1', gareId: 'gare_1', gareName: 'Gare Routière de Ouagadougou', status: 'active', acquisitionDate: '2023-06-15' },
    { id: 'vehicle_2', number: 'BF-1025', layoutId: 'layout_2', gareId: 'gare_2', gareName: 'Gare de Bobo-Dioulasso', status: 'active', acquisitionDate: '2023-07-20' },
    { id: 'vehicle_3', number: 'BF-1026', layoutId: 'layout_3', gareId: 'gare_3', gareName: 'Gare de Koudougou', status: 'active', acquisitionDate: '2023-08-10' },
  ]);
  const [policies, setPolicies] = useState<Policy[]>([
    {
      id: 'policy_1',
      title: 'Politique de Bagages',
      description: 'Règles concernant les bagages autorisés',
      content: 'Les passagers peuvent emmener un sac à main et un bagage à roulettes de 23kg maximum.',
      category: 'baggage',
      isActive: true,
      lastModified: '2024-01-15',
      createdAt: '2024-01-15'
    },
    {
      id: 'policy_2',
      title: 'Politique d\'Annulation',
      description: 'Conditions d\'annulation des billets',
      content: 'Les billets peuvent être annulés jusqu\'à 24h avant le départ sans frais.',
      category: 'cancellation',
      isActive: true,
      lastModified: '2024-02-01',
      createdAt: '2024-02-01'
    },
    {
      id: 'policy_3',
      title: 'Politique d\'Embarquement',
      description: 'Règles d\'embarquement',
      content: 'Les passagers doivent être présents 15 minutes avant le départ.',
      category: 'boarding',
      isActive: true,
      lastModified: '2024-03-10',
      createdAt: '2024-03-10'
    },
    {
      id: 'policy_4',
      title: 'Politique de Sécurité',
      description: 'Règles de sécurité',
      content: 'Les passagers doivent respecter les consignes de sécurité et ne pas fumer à bord.',
      category: 'safety',
      isActive: true,
      lastModified: '2024-04-01',
      createdAt: '2024-04-01'
    },
  ]);

  // ✅ 100% BACKEND-READY: Toutes les données utilisent useApiState (dual-mode intelligent localStorage ↔ API)

  // Auto-generate trips from templates on first load
  useEffect(() => {
    if (trips.length === 0 && scheduleTemplates.length > 0) {
      const now = getCurrentDate();
      const generatedTrips: Trip[] = [];

      scheduleTemplates.filter(t => t.status === 'active').forEach((template, index) => {
        const route = routes.find(r => r.id === template.routeId);
        if (!route || route.status !== 'active') return;

        // Generate for today and next 2 days
        for (let day = 0; day < 3; day++) {
          const departureDate = new Date(now);
          departureDate.setDate(now.getDate() + day);
          
          // Check if this day is in the template's daysOfWeek
          const dayOfWeek = departureDate.getDay();
          if (!template.daysOfWeek.includes(dayOfWeek)) {
            continue;
          }
          
          // Set departure time from template
          const [hours, minutes] = template.departureTime.split(':').map(Number);
          departureDate.setHours(hours, minutes, 0, 0);
          
          const arrivalDate = new Date(departureDate);
          arrivalDate.setMinutes(arrivalDate.getMinutes() + route.duration);

          const totalSeats = template.totalSeats;
          const soldSeats = departureDate < now ? totalSeats : Math.floor(Math.random() * totalSeats * 0.6);
          
          let status: Trip['status'] = 'scheduled';
          
          // ✅ DEMO: Forcer quelques trips à être "departed" ou "boarding" pour les tests
          if (day === 0 && index < 3) {
            // Les 3 premiers trips d'aujourd'hui seront en route
            status = 'departed';
          } else if (day === 0 && index >= 3 && index < 5) {
            // Les 2 suivants seront en embarquement
            status = 'boarding';
          } else if (departureDate < now) {
            const timeDiff = now.getTime() - departureDate.getTime();
            if (timeDiff < route.duration * 60 * 1000) {
              status = 'departed';
            } else {
              status = 'arrived';
            }
          } else if (departureDate.getTime() - now.getTime() < 60 * 60 * 1000) {
            status = 'boarding';
          }

          const gare = stations.find(s => s.id === template.gareId) || stations[0];

          // ✅ CORRECTION: Utiliser calculatePriceWithRules
          const finalPrice = calculatePriceWithRules(
            route.basePrice,
            route.id,
            departureDate.toISOString(),
            pricingRules as any as PricingRule[]
          );

          generatedTrips.push({
            id: generateId('trip'),
            routeId: route.id,
            departure: route.departure,
            arrival: route.arrival,
            departureTime: departureDate.toISOString(),
            arrivalTime: arrivalDate.toISOString(),
            busNumber: `BF-${1000 + (index * 100) + day}`,
            availableSeats: totalSeats - soldSeats,
            totalSeats: totalSeats,
            price: finalPrice, // ✅ Prix calculé avec règles
            status: status,
            gareId: gare.id,
            gareName: gare.name,
            seatLayout: template.seatLayout,
            serviceClass: template.serviceClass,
          } as unknown as Trip);
        }
      });

      setTrips(generatedTrips);
    }
  }, [scheduleTemplates, routes, stations, pricingRules]); // ✅ Ajout pricingRules comme dépendance

  // CRUD Operations
  const addStation = (station: Omit<Station, 'id'>) => {
    const newStation = { ...station, id: generateId('gare') };
    setStations([...stations, newStation]);
  };

  const updateStation = (id: string, updates: Partial<Station>) => {
    setStations(stations.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteStation = (id: string) => {
    setStations(stations.filter(s => s.id !== id));
  };

  const addRoute = (route: Omit<Route, 'id'>) => {
    const newRoute = { ...route, id: generateId('route') };
    setRoutes([...routes, newRoute]);
  };

  const updateRoute = (id: string, updates: Partial<Route>) => {
    setRoutes(routes.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deleteRoute = (id: string) => {
    setRoutes(routes.filter(r => r.id !== id));
  };

  const addScheduleTemplate = (template: Omit<ScheduleTemplate, 'id' | 'createdAt'>) => {
    const newTemplate = { 
      ...template, 
      id: generateId('schedule'),
      createdAt: new Date().toISOString()
    };
    setScheduleTemplates([...scheduleTemplates, newTemplate]);
  };

  const updateScheduleTemplate = (id: string, updates: Partial<ScheduleTemplate>) => {
    setScheduleTemplates(scheduleTemplates.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteScheduleTemplate = (id: string) => {
    setScheduleTemplates(scheduleTemplates.filter(t => t.id !== id));
  };

  const addPricingRule = (rule: Omit<PricingRule, 'id'>) => {
    const newRule = { ...rule, id: generateId('pricing') };
    setPricingRules([...pricingRules, newRule as any as PricingSegment]);
  };

  const updatePricingRule = (id: string, updates: Partial<PricingRule>) => {
    setPricingRules(pricingRules.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const deletePricingRule = (id: string) => {
    setPricingRules(pricingRules.filter(r => r.id !== id));
  };

  const addManager = (manager: Omit<Manager, 'id'>) => {
    const newManager = { ...manager, id: generateId('mgr') };
    setManagers([...managers, newManager]);
  };

  const updateManager = (id: string, updates: Partial<Manager>) => {
    setManagers(managers.map(m => m.id === id ? { ...m, ...updates } : m));
  };

  const deleteManager = (id: string) => {
    setManagers(managers.filter(m => m.id !== id));
  };

  const addCashier = (cashier: Omit<Cashier, 'id'>) => {
    const newCashier = { ...cashier, id: generateId('cash') };
    setCashiers([...cashiers, newCashier]);
  };

  const updateCashier = (id: string, updates: Partial<Cashier>) => {
    setCashiers(cashiers.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCashier = (id: string) => {
    setCashiers(cashiers.filter(c => c.id !== id));
  };

  const addTrip = (trip: Omit<Trip, 'id'>) => {
    const newTrip = { ...trip, id: generateId('trip') };
    setTrips([...trips, newTrip]);
  };

  const updateTrip = (id: string, updates: Partial<Trip>) => {
    setTrips(trips.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const deleteTrip = (id: string) => {
    setTrips(trips.filter(t => t.id !== id));
  };

  const cancelTripWithCascade = (id: string) => {
    const trip = trips.find(t => t.id === id);
    if (trip) {
      // Cancel the trip
      updateTrip(id, { status: 'cancelled' });

      // Cancel all tickets for this trip
      const tripTickets = tickets.filter(t => t.tripId === id);
      tripTickets.forEach(ticket => cancelTicket(ticket.id));
    }
  };

  const generateTripsFromTemplates = (daysAhead?: number) => {
    const now = getCurrentDate();
    const generatedTrips: Trip[] = [];

    scheduleTemplates.filter(t => t.status === 'active').forEach((template, index) => {
      const route = routes.find(r => r.id === template.routeId);
      if (!route || route.status !== 'active') return;

      const days = daysAhead || 7;
      for (let day = 0; day < days; day++) {
        const departureDate = new Date(now);
        departureDate.setDate(now.getDate() + day);
        
        // Check if this day is in the template's daysOfWeek
        const dayOfWeek = departureDate.getDay(); // 0 = Sunday, 6 = Saturday
        if (!template.daysOfWeek.includes(dayOfWeek)) {
          continue; // Skip this day if not in schedule
        }
        
        // Set departure times based on template
        const [hours, minutes] = template.departureTime.split(':').map(Number);
        departureDate.setHours(hours, minutes, 0, 0);
        
        const arrivalDate = new Date(departureDate);
        arrivalDate.setMinutes(arrivalDate.getMinutes() + route.duration);

        const totalSeats = template.totalSeats;
        const soldSeats = departureDate < now ? totalSeats : Math.floor(Math.random() * totalSeats);
        
        let status: Trip['status'] = 'scheduled';
        if (departureDate < now) {
          const timeDiff = now.getTime() - departureDate.getTime();
          if (timeDiff < route.duration * 60 * 1000) {
            status = 'departed';
          } else {
            status = 'arrived';
          }
        } else if (departureDate.getTime() - now.getTime() < 60 * 60 * 1000) {
          status = 'boarding';
        }

        const gare = stations.find(s => s.city === route.departure) || stations[0];

        // ✅ CORRECTION: Utiliser calculatePriceWithRules
        const finalPrice = calculatePriceWithRules(
          route.basePrice,
          route.id,
          departureDate.toISOString(),
          pricingRules as any as PricingRule[]
        );

        generatedTrips.push({
          id: generateId('trip'),
          routeId: route.id,
          departure: route.departure,
          arrival: route.arrival,
          departureTime: departureDate.toISOString(),
          arrivalTime: arrivalDate.toISOString(),
          busNumber: `BF-${1000 + index * 10 + day}`,
          availableSeats: totalSeats - soldSeats,
          totalSeats: totalSeats,
          price: finalPrice, // ✅ Prix calculé avec règles
          status: status,
          gareId: gare.id,
          gareName: gare.name,
          seatLayout: template.seatLayout,
          serviceClass: template.serviceClass,
        } as unknown as Trip);
      }
    });

    setTrips([...trips, ...generatedTrips]);

    // Generate some tickets for completed trips
    const completedTrips = generatedTrips.filter(t => t.status === 'arrived' || t.status === 'departed');
    const generatedTickets: Ticket[] = [];
    const generatedTransactions: CashTransaction[] = [];

    completedTrips.forEach(trip => {
      const soldSeats = trip.totalSeats - trip.availableSeats;
      for (let i = 0; i < soldSeats; i++) {
        const cashier = cashiers[Math.floor(Math.random() * cashiers.length)];
        
        // ✅ CORRIGÉ: Déterminer d'abord le canal de vente
        const salesChannel: 'online' | 'counter' = Math.random() > 0.3 ? 'counter' : 'online';
        
        // ✅ CORRIGÉ: Choisir le moyen de paiement selon le canal
        let paymentMethod: Ticket['paymentMethod'];
        if (salesChannel === 'online') {
          // App mobile : seulement paiement électronique (pas de cash)
          const onlineMethods: Ticket['paymentMethod'][] = ['orange_money', 'moov_money', 'wave', 'card'];
          paymentMethod = onlineMethods[Math.floor(Math.random() * onlineMethods.length)];
        } else {
          // Guichet : tous moyens de paiement possibles
          const counterMethods: Ticket['paymentMethod'][] = ['cash', 'orange_money', 'card'];
          paymentMethod = counterMethods[Math.floor(Math.random() * counterMethods.length)];
        }
        
        const purchaseDate = new Date(trip.departureTime);
        purchaseDate.setHours(purchaseDate.getHours() - Math.floor(Math.random() * 24));

        const ticketId = generateId('ticket');
        
        // ✅ CORRIGÉ: Commission basée sur salesChannel, pas paymentMethod
        const commission = salesChannel === 'online' ? trip.price * 0.05 : undefined;
        
        generatedTickets.push({
          id: ticketId,
          tripId: trip.id,
          passengerName: `Passager ${i + 1}`,
          passengerPhone: `+226 70 ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)} ${Math.floor(Math.random() * 90 + 10)}`,
          seatNumber: `${String.fromCharCode(65 + Math.floor(i / 4))}${(i % 4) + 1}`,
          price: trip.price,
          commission,
          paymentMethod,
          salesChannel,
          status: trip.status === 'arrived' ? 'boarded' : 'active',
          purchaseDate: purchaseDate.toISOString(),
          cashierId: salesChannel === 'online' ? 'online_system' : cashier.id,
          cashierName: salesChannel === 'online' ? 'Vente en ligne' : cashier.name,
          gareId: trip.gareId,
          departure: trip.departure,
          arrival: trip.arrival,
          departureTime: trip.departureTime,
        });

        // ✅ CORRIGÉ: Transaction seulement pour ventes counter (pas online)
        if (salesChannel === 'counter') {
          generatedTransactions.push({
            id: generateId('trans'),
            type: 'sale',
            amount: trip.price,
            method: paymentMethod === 'orange_money' ? 'orange_money' : paymentMethod === 'card' ? 'card' : 'cash',
            description: `Vente billet ${trip.departure} → ${trip.arrival}`,
            ticketId: ticketId,
            cashierId: cashier.id,
            cashierName: cashier.name,
            timestamp: purchaseDate.toISOString(),
            status: 'completed',
          });
        }
      }
    });

    setTickets([...tickets, ...generatedTickets]);
    setCashTransactions([...cashTransactions, ...generatedTransactions]);

    // Generate some reviews
    const generatedReviews: Review[] = [];
    const arrivedTrips = generatedTrips.filter(t => t.status === 'arrived').slice(0, 10);
    
    arrivedTrips.forEach(trip => {
      if (Math.random() > 0.5) {
        // ✅ L'avis est lié à la DATE + HEURE de DÉPART du voyage
        const reviewDate = new Date(trip.departureTime);
        // Avis posté quelques heures après le départ (3-12h)
        reviewDate.setHours(reviewDate.getHours() + 3 + Math.floor(Math.random() * 9));
        
        generatedReviews.push({
          id: generateId('review'),
          tripId: trip.id,
          departure: trip.departure,
          arrival: trip.arrival,
          passengerName: `Client #${generateId('').substring(0, 4).toUpperCase()}`, // ✅ ANONYMISÉ
          rating: 3 + Math.floor(Math.random() * 3),
          comment: ['Très bon voyage', 'Service correct', 'Ponctuel et confortable', 'Bon rapport qualité-prix'][Math.floor(Math.random() * 4)],
          date: reviewDate.toISOString(), // ✅ CORRIGÉ: Basé sur departureTime, pas arrivalTime
          status: 'published'
        });
      }
    });

    setReviews([...reviews, ...generatedReviews]);
  };

  const addTicket = (ticket: Omit<Ticket, 'id'>) => {
    const newTicket = { ...ticket, id: generateId('ticket') };
    setTickets([...tickets, newTicket]);

    // Update trip available seats
    const trip = trips.find(t => t.id === ticket.tripId);
    if (trip) {
      updateTrip(trip.id, { availableSeats: trip.availableSeats - 1 });
    }

    // ✅ CORRIGÉ: Transaction seulement pour ventes counter (utiliser salesChannel)
    if (ticket.salesChannel === 'counter') {
      addCashTransaction({
        type: 'sale',
        amount: ticket.price,
        method: ticket.paymentMethod,
        description: `Vente billet ${ticket.departure} → ${ticket.arrival}`,
        ticketId: newTicket.id,
        cashierId: ticket.cashierId,
        cashierName: ticket.cashierName,
        timestamp: ticket.purchaseDate,
        status: 'completed',
      });
    }
  };

  const updateTicket = (id: string, updates: Partial<Ticket>) => {
    setTickets(tickets.map(t => t.id === id ? { ...t, ...updates } : t));
  };

  const cancelTicket = (id: string) => {
    updateTicket(id, { status: 'cancelled' });
    
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
      const trip = trips.find(t => t.id === ticket.tripId);
      if (trip) {
        updateTrip(trip.id, { availableSeats: trip.availableSeats + 1 });
      }
    }
  };

  const refundTicket = (id: string) => {
    updateTicket(id, { status: 'refunded' });
    
    const ticket = tickets.find(t => t.id === id);
    if (ticket) {
      const trip = trips.find(t => t.id === ticket.tripId);
      if (trip) {
        updateTrip(trip.id, { availableSeats: trip.availableSeats + 1 });
      }

      // Add refund transaction
      // ✅ CORRIGÉ: Utiliser salesChannel au lieu de paymentMethod
      if (ticket.salesChannel !== 'online' && user) {
        addCashTransaction({
          type: 'refund',
          amount: ticket.price,
          method: ticket.paymentMethod === 'orange_money' ? 'orange_money' : 'cash',
          description: `Remboursement billet ${ticket.departure} → ${ticket.arrival}`,
          ticketId: id,
          cashierId: user.id,
          cashierName: user.name,
          timestamp: new Date().toISOString(),
          status: 'completed',
        });
      }
    }
  };

  const addCashTransaction = (transaction: Omit<CashTransaction, 'id'>) => {
    const newTransaction = { ...transaction, id: generateId('trans') };
    setCashTransactions([...cashTransactions, newTransaction]);
  };

  const addStory = (story: Omit<Story, 'id' | 'views' | 'clicks' | 'createdAt'>) => {
    const newStory = { 
      ...story, 
      id: generateId('story'),
      views: 0,
      clicks: 0,
      createdAt: new Date().toISOString(),
      createdBy: user?.id,
      createdByName: user?.name
    };
    setStories([...stories, newStory]);
  };

  const updateStory = (id: string, updates: Partial<Story>) => {
    setStories(stories.map(s => s.id === id ? { ...s, ...updates } : s));
  };

  const deleteStory = (id: string) => {
    setStories(stories.filter(s => s.id !== id));
  };

  const addPromotion = (promotion: Omit<Promotion, 'promotion_id' | 'current_uses' | 'created_at' | 'updated_at' | 'created_by' | 'approval_status'>) => {
    const newPromotion: Promotion = {
      ...promotion,
      promotion_id: generateId('promo'),
      current_uses: 0,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: user?.id,
      operator_id: (user as any)?.companyId,
      approval_status: 'pending_validation' // ✅ Nouvelles promos en attente d'validation
    };
    setPromotions([...promotions, newPromotion]);
  };

  const updatePromotion = (id: string, updates: Partial<Promotion>) => {
    setPromotions(promotions.map(p => p.promotion_id === id ? { ...p, ...updates, updated_at: new Date().toISOString() } : p));
  };

  const deletePromotion = (id: string) => {
    setPromotions(promotions.filter(p => p.promotion_id !== id));
  };

  // ✅ NOUVEAU: Fonctions d'approbation admin pour promotions
  const approvePromotion = (id: string, adminId: string) => {
    setPromotions(promotions.map(p => p.promotion_id === id ? {
      ...p,
      approval_status: 'active_approved',
      approved_by: adminId,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } : p));
  };

  const rejectPromotion = (id: string, reason: string, adminId: string) => {
    setPromotions(promotions.map(p => p.promotion_id === id ? {
      ...p,
      approval_status: 'rejected',
      rejection_reason: reason,
      approved_by: adminId,
      approved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    } : p));
  };

  const updateReview = (id: string, updates: Partial<Review>) => {
    setReviews(reviews.map(r => r.id === id ? { ...r, ...updates } : r));
  };

  const respondToReview = (id: string, response: string) => {
    updateReview(id, { 
      response, 
      responseDate: new Date().toISOString(),
      status: 'published' 
    });
  };

  const addIncident = (incident: Omit<Incident, 'id'>) => {
    const newIncident = { ...incident, id: generateId('incident') };
    setIncidents([...incidents, newIncident]);
  };

  const updateIncident = (id: string, updates: Partial<Incident>) => {
    setIncidents(incidents.map(i => i.id === id ? { ...i, ...updates } : i));
  };

  const addSupportTicket = (ticket: Omit<SupportTicket, 'id' | 'createdAt' | 'updatedAt' | 'messages'>) => {
    const newTicket = { 
      ...ticket, 
      id: generateId('support'),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      messages: []
    };
    setSupportTickets([...supportTickets, newTicket]);
  };

  const updateSupportTicket = (id: string, updates: Partial<SupportTicket>) => {
    setSupportTickets(supportTickets.map(t => t.id === id ? { 
      ...t, 
      ...updates,
      updatedAt: new Date().toISOString()
    } : t));
  };

  const addSupportMessage = (ticketId: string, message: string) => {
    if (!user) return;

    const ticket = supportTickets.find(t => t.id === ticketId);
    if (ticket) {
      const newMessage = {
        id: generateId('msg'),
        userId: user.id,
        userName: user.name,
        message,
        timestamp: new Date().toISOString(),
      };

      updateSupportTicket(ticketId, {
        messages: [...ticket.messages, newMessage],
      });
    }
  };

  const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
    const newVehicle = { ...vehicle, id: generateId('vehicle') };
    setVehicles([...vehicles, newVehicle]);
  };

  const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
    setVehicles(vehicles.map(v => v.id === id ? { ...v, ...updates } : v));
  };

  const deleteVehicle = (id: string) => {
    setVehicles(vehicles.filter(v => v.id !== id));
  };

  const addPolicy = (policy: Omit<Policy, 'id' | 'createdAt' | 'lastModified'>) => {
    const newPolicy = { 
      ...policy, 
      id: generateId('policy'),
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString()
    };
    setPolicies([...policies, newPolicy]);
  };

  const updatePolicy = (id: string, updates: Partial<Policy>) => {
    setPolicies(policies.map(p => p.id === id ? { 
      ...p, 
      ...updates,
      lastModified: new Date().toISOString()
    } : p));
  };

  const deletePolicy = (id: string) => {
    setPolicies(policies.filter(p => p.id !== id));
  };

  const getAnalytics = () => {
    // ✅ REFACTORISÉ: Utiliser fonctions centralisées
    const validTickets = getValidTickets(tickets);
    const totalRevenue = calculateTicketsRevenue(validTickets);
    const totalTickets = validTickets.length;

    const averageOccupancy = calculateOverallOccupancy(trips);

    const routeStats = new Map<string, { revenue: number; tickets: number }>();
    validTickets.forEach(ticket => {
      const key = `${ticket.departure} → ${ticket.arrival}`;
      const current = routeStats.get(key) || { revenue: 0, tickets: 0 };
      routeStats.set(key, {
        revenue: current.revenue + ticket.price,
        tickets: current.tickets + 1,
      });
    });

    const topRoutes = Array.from(routeStats.entries())
      .map(([route, stats]) => ({ route, ...stats }))
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return {
      totalRevenue,
      totalTickets,
      averageOccupancy,
      topRoutes,
    };
  };

  return (
    <DataContext.Provider
      value={{
        stations,
        addStation,
        updateStation,
        deleteStation,
        routes,
        addRoute,
        updateRoute,
        deleteRoute,
        scheduleTemplates,
        addScheduleTemplate,
        updateScheduleTemplate,
        deleteScheduleTemplate,
        pricingRules,
        addPricingRule,
        updatePricingRule,
        deletePricingRule,
        managers,
        addManager,
        updateManager,
        deleteManager,
        cashiers,
        addCashier,
        updateCashier,
        deleteCashier,
        trips,
        addTrip,
        updateTrip,
        deleteTrip,
        cancelTripWithCascade,
        generateTripsFromTemplates,
        tickets,
        addTicket,
        updateTicket,
        cancelTicket,
        refundTicket,
        cashTransactions,
        addCashTransaction,
        stories,
        addStory,
        updateStory,
        deleteStory,
        promotions,
        addPromotion,
        updatePromotion,
        deletePromotion,
        approvePromotion,
        rejectPromotion,
        reviews,
        updateReview,
        respondToReview,
        incidents,
        addIncident,
        updateIncident,
        supportTickets,
        addSupportTicket,
        updateSupportTicket,
        addSupportMessage,
        seatLayouts,
        vehicles,
        addVehicle,
        updateVehicle,
        deleteVehicle,
        policies,
        addPolicy,
        updatePolicy,
        deletePolicy,
        getAnalytics,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useData must be used within a DataProvider');
  }
  return context;
}

