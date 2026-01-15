/**
 * Types et DTOs partagés pour les services API
 * 
 * Ces types sont utilisés à la fois par le frontend et seront
 * utilisés par votre backend NestJS pour assurer la cohérence.
 */

import type {
  Ticket,
  Trip,
  Route,
  Station,
  Manager,
  Cashier,
  ScheduleTemplate,
  Story,
  CashTransaction,
} from '../contexts/DataContext';

// ============================================
// AUTH DTOs
// ============================================

export interface LoginDto {
  email: string;
  password: string;
}

export interface RegisterDto {
  email: string;
  password: string;
  name: string;
  role: 'responsable' | 'manager' | 'cashier';
  companyId?: string;
  gareId?: string;
  gareName?: string;
}

export interface AuthResponse {
  user: {
    id: string;
    email: string;
    name: string;
    role: 'responsable' | 'manager' | 'cashier';
    companyId?: string;
    gareId?: string;
    gareName?: string;
  };
  token: string;
}

export interface ResetPasswordDto {
  email: string;
  redirectUrl?: string;
}

// ============================================
// TICKET DTOs
// ============================================

export interface CreateTicketDto {
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  passengerEmail?: string;
  seatNumber: string;
  price: number;
  salesChannel: 'guichet' | 'app-mobile';
  paymentMethod: 'cash' | 'mobile-money' | 'card';
  sellerId: string;
  sellerName: string;
  sellerRole: 'manager' | 'cashier';
  gareId: string;
  gareName: string;
}

export interface UpdateTicketDto {
  passengerName?: string;
  passengerPhone?: string;
  passengerEmail?: string;
  seatNumber?: string;
}

export interface CancelTicketDto {
  reason: string;
  refundAmount?: number;
}

export interface TicketFilters {
  tripId?: string;
  gareId?: string;
  sellerId?: string;
  salesChannel?: 'guichet' | 'app-mobile';
  status?: Ticket['status'];
  dateFrom?: string;
  dateTo?: string;
}

// ============================================
// TRIP DTOs
// ============================================

export interface CreateTripDto {
  routeId: string;
  gareId: string;
  gareName: string;
  departureDate: string;
  departureTime: string;
  serviceClass: 'standard' | 'vip' | 'express';
  totalSeats: number;
  basePrice: number;
}

export interface UpdateTripDto {
  departureDate?: string;
  departureTime?: string;
  status?: Trip['status'];
  totalSeats?: number;
  basePrice?: number;
}

export interface TripFilters {
  routeId?: string;
  gareId?: string;
  status?: Trip['status'];
  dateFrom?: string;
  dateTo?: string;
}

export interface GenerateTripsDto {
  daysCount: number;
}

// ============================================
// ROUTE DTOs
// ============================================

export interface CreateRouteDto {
  departure: string;
  arrival: string;
  distance: number;
  duration: number;
  basePrice: number;
  description?: string;
  status: 'active' | 'inactive';
}

export interface UpdateRouteDto {
  departure?: string;
  arrival?: string;
  distance?: number;
  duration?: number;
  basePrice?: number;
  description?: string;
  status?: 'active' | 'inactive';
}

// ============================================
// STATION DTOs
// ============================================

export interface CreateStationDto {
  name: string;
  city: string;
  region: string;
  address: string;
  phone: string;
  managerId?: string;
  managerName?: string;
  status: 'active' | 'inactive';
}

export interface UpdateStationDto {
  name?: string;
  city?: string;
  region?: string;
  address?: string;
  phone?: string;
  managerId?: string;
  managerName?: string;
  status?: 'active' | 'inactive';
}

// ============================================
// MANAGER DTOs
// ============================================

export interface CreateManagerDto {
  name: string;
  email: string;
  phone: string;
  gareId: string;
  gareName: string;
  status: 'active' | 'inactive';
  password: string;
}

export interface UpdateManagerDto {
  name?: string;
  email?: string;
  phone?: string;
  gareId?: string;
  gareName?: string;
  status?: 'active' | 'inactive';
}

// ============================================
// CASHIER DTOs
// ============================================

export interface CreateCashierDto {
  name: string;
  email: string;
  phone: string;
  gareId: string;
  gareName: string;
  managerId: string;
  status: 'active' | 'inactive';
  password: string;
}

export interface UpdateCashierDto {
  name?: string;
  email?: string;
  phone?: string;
  gareId?: string;
  gareName?: string;
  managerId?: string;
  status?: 'active' | 'inactive';
}

// ============================================
// SCHEDULE DTOs
// ============================================

export interface CreateScheduleTemplateDto {
  routeId: string;
  gareId: string;
  gareName: string;
  departureTime: string;
  serviceClass: 'standard' | 'vip' | 'express';
  totalSeats: number;
  daysOfWeek: number[];
  status: 'active' | 'inactive';
}

export interface UpdateScheduleTemplateDto {
  routeId?: string;
  gareId?: string;
  gareName?: string;
  departureTime?: string;
  serviceClass?: 'standard' | 'vip' | 'express';
  totalSeats?: number;
  daysOfWeek?: number[];
  status?: 'active' | 'inactive';
}

// ============================================
// PRICING DTOs
// ============================================

export interface PriceSegment {
  id: string;
  route: string;
  currentPrice: number;
  previousPrice: number;
  lastUpdate: string;
}

export interface UpdatePriceDto {
  currentPrice: number;
  reason?: string;
}

export interface PriceHistory {
  id: string;
  segmentId: string;
  price: number;
  previousPrice: number;
  reason: string;
  date: string;
}

// ============================================
// STORY DTOs
// ============================================

export interface CreateStoryDto {
  title: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  duration: number;
  targetAudience: 'all' | 'passengers' | 'companies';
  targetGares?: string[];
  startDate: string;
  endDate: string;
  status: 'active' | 'inactive';
}

export interface UpdateStoryDto {
  title?: string;
  duration?: number;
  targetAudience?: 'all' | 'passengers' | 'companies';
  targetGares?: string[];
  startDate?: string;
  endDate?: string;
  status?: 'active' | 'inactive';
}

// ============================================
// CASH TRANSACTION DTOs
// ============================================

export interface CreateCashTransactionDto {
  type: 'opening' | 'closing' | 'deposit' | 'withdrawal';
  amount: number;
  cashierId: string;
  cashierName: string;
  gareId: string;
  gareName: string;
  notes?: string;
}

// ============================================
// RESPONSE WRAPPERS
// ============================================

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
}
