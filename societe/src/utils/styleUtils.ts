/**
 * Utilitaires pour les styles et classes CSS
 * Centralise les classes de badges et couleurs
 */

import { Clock, MapPin, Navigation, CheckCircle2, XCircle } from 'lucide-react';
import type { Ticket, Trip, CashTransaction, Incident } from '../contexts/DataContext';

/**
 * Retourne les informations de badge pour un statut de trip (couleur et icône)
 */
export const getTripStatusBadgeInfo = (status: Trip['status']): { color: string; icon: any } => {
  switch (status) {
    case 'scheduled':
      return {
        color: 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400',
        icon: Clock
      };
    case 'boarding':
      return {
        color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400',
        icon: MapPin
      };
    case 'departed':
      return {
        color: 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400',
        icon: Navigation
      };
    case 'arrived':
      return {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
        icon: CheckCircle2
      };
    case 'cancelled':
      return {
        color: 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400',
        icon: XCircle
      };
    default:
      return {
        color: 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400',
        icon: Clock
      };
  }
};

/**
 * Retourne les classes CSS pour un badge de statut de ticket
 */
export const getTicketStatusBadgeClass = (status: Ticket['status']): string => {
  switch (status) {
    case 'valid':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'used':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'refunded':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'cancelled':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

/**
 * Retourne les classes CSS pour un badge de canal de vente
 */
export const getSalesChannelBadgeClass = (channel: Ticket['salesChannel']): string => {
  switch (channel) {
    case 'online':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'counter':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

/**
 * Retourne les classes CSS pour un badge de méthode de paiement
 */
export const getPaymentMethodBadgeClass = (method: Ticket['paymentMethod']): string => {
  switch (method) {
    case 'cash':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'mobile_money':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    case 'card':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

/**
 * Retourne les classes CSS pour un badge de sévérité d'incident
 */
export const getIncidentSeverityBadgeClass = (severity: Incident['severity']): string => {
  switch (severity) {
    case 'low':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'high':
      return 'bg-orange-100 text-orange-800 dark:bg-orange-900/20 dark:text-orange-400';
    case 'critical':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

/**
 * Retourne les classes CSS pour un badge de statut d'incident
 */
export const getIncidentStatusBadgeClass = (status: Incident['status']): string => {
  switch (status) {
    case 'open':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'resolved':
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/20 dark:text-blue-400';
    case 'closed':
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

/**
 * Retourne les classes CSS pour un badge de validation d'incident
 */
export const getIncidentValidationBadgeClass = (status: Incident['validationStatus']): string => {
  switch (status) {
    case 'pending':
      return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'validated':
      return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
    case 'rejected':
      return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

/**
 * Retourne les classes CSS pour un badge de statut général
 */
export const getActiveStatusBadgeClass = (status: 'active' | 'inactive'): string => {
  return status === 'active'
    ? 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400'
    : 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
};

/**
 * Retourne la couleur d'une icône de tendance
 */
export const getTrendColor = (trend: 'up' | 'down' | 'neutral'): string => {
  switch (trend) {
    case 'up':
      return 'text-green-600';
    case 'down':
      return 'text-red-600';
    case 'neutral':
      return 'text-gray-600';
  }
};

/**
 * Retourne la couleur de remplissage basée sur le taux d'occupation
 */
export const getOccupancyColor = (occupancyRate: number): string => {
  if (occupancyRate >= 90) return 'text-green-600 dark:text-green-400';
  if (occupancyRate >= 70) return 'text-yellow-600 dark:text-yellow-400';
  if (occupancyRate >= 50) return 'text-orange-600 dark:text-orange-400';
  return 'text-red-600 dark:text-red-400';
};

/**
 * Retourne la couleur de fond de jauge basée sur le taux
 */
export const getGaugeColorClass = (percentage: number): string => {
  if (percentage >= 90) return 'bg-green-600';
  if (percentage >= 70) return 'bg-yellow-500';
  if (percentage >= 50) return 'bg-orange-500';
  return 'bg-red-600';
};

/**
 * Retourne les classes CSS pour un badge de type de transaction
 */
export const getTransactionTypeBadgeClass = (type: CashTransaction['type']): string => {
  switch (type) {
    case 'sale':
      return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    case 'refund':
      return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
    case 'deposit':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    case 'withdrawal':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

/**
 * Retourne la couleur d'icône pour un type de transaction
 */
export const getTransactionTypeIconColor = (type: CashTransaction['type']): string => {
  switch (type) {
    case 'sale':
      return 'text-green-600 dark:text-green-400';
    case 'refund':
      return 'text-red-600 dark:text-red-400';
    case 'deposit':
      return 'text-blue-600 dark:text-blue-400';
    case 'withdrawal':
      return 'text-orange-600 dark:text-orange-400';
    default:
      return 'text-gray-600 dark:text-gray-400';
  }
};

/**
 * Retourne les classes CSS pour un badge de story
 */
export const getStoryStatusBadgeClass = (status: 'active' | 'scheduled' | 'expired' | 'draft'): string => {
  switch (status) {
    case 'active':
      return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    case 'scheduled':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    case 'expired':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    case 'draft':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

/**
 * Retourne les classes CSS pour un badge de support ticket
 */
export const getSupportTicketStatusBadgeClass = (status: 'open' | 'in_progress' | 'resolved' | 'closed'): string => {
  switch (status) {
    case 'open':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    case 'in_progress':
      return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
    case 'resolved':
      return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    case 'closed':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

/**
 * Retourne les classes CSS pour un badge de priorité support
 */
export const getSupportTicketPriorityBadgeClass = (priority: 'low' | 'normal' | 'high' | 'urgent'): string => {
  switch (priority) {
    case 'low':
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
    case 'normal':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    case 'high':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
    case 'urgent':
      return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

/**
 * Retourne les classes CSS pour un badge de local trip
 */
export const getLocalTripStatusBadgeClass = (status: 'en_route' | 'at_station' | 'delayed' | 'cancelled'): string => {
  switch (status) {
    case 'en_route':
      return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
    case 'at_station':
      return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
    case 'delayed':
      return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
    case 'cancelled':
      return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
    default:
      return 'bg-gray-100 text-gray-700 dark:bg-gray-900/20 dark:text-gray-400';
  }
};

/**
 * Retourne les classes CSS pour un badge de rating
 */
export const getRatingBadgeClass = (rating: number): string => {
  if (rating >= 4.5) return 'bg-green-100 text-green-700 dark:bg-green-900/20 dark:text-green-400';
  if (rating >= 3.5) return 'bg-blue-100 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400';
  if (rating >= 2.5) return 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400';
  if (rating >= 1.5) return 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400';
  return 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400';
};