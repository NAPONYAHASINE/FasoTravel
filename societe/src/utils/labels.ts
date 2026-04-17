/**
 * Utilitaires pour les labels et traductions
 * Centralise toutes les traductions de l'application
 */

import type { Ticket, Trip, CashTransaction, Incident } from '../contexts/DataContext';
import { Clock, AlertTriangle, AlertCircle, CheckCircle, XCircle } from 'lucide-react';

/**
 * Retourne le label d'une méthode de paiement
 */
export const getPaymentMethodLabel = (method: Ticket['paymentMethod']): string => {
  switch (method) {
    case 'cash':
      return 'Espèces';
    case 'orange_money':
      return 'Orange Money';
    case 'moov_money':
      return 'Moov Money';
    case 'wave':
      return 'Wave';
    case 'card':
      return 'Carte';
    default:
      return method;
  }
};

/**
 * Retourne le label court d'une méthode de paiement
 */
export const getPaymentMethodShortLabel = (method: Ticket['paymentMethod']): string => {
  switch (method) {
    case 'cash':
      return 'Cash';
    case 'orange_money':
      return 'OM';
    case 'moov_money':
      return 'Moov';
    case 'wave':
      return 'Wave';
    case 'card':
      return 'Carte';
    default:
      return method;
  }
};

/**
 * Retourne le label d'un canal de vente
 */
export const getSalesChannelLabel = (channel: Ticket['salesChannel']): string => {
  switch (channel) {
    case 'online':
      return 'En ligne';
    case 'counter':
      return 'Guichet';
    default:
      return channel;
  }
};

/**
 * Retourne le label d'un statut de ticket
 */
export const getTicketStatusLabel = (status: Ticket['status']): string => {
  switch (status) {
    case 'active':
      return 'Actif';
    case 'boarded':
      return 'Embarqué';
    case 'expired':
      return 'Expiré';
    case 'refunded':
      return 'Remboursé';
    case 'cancelled':
      return 'Annulé';
    default:
      return status;
  }
};

/**
 * Retourne le label d'un statut de trip
 */
export const getTripStatusLabel = (status: Trip['status']): string => {
  switch (status) {
    case 'scheduled':
      return 'Programmé';
    case 'boarding':
      return 'Embarquement';
    case 'departed':
      return 'Parti';
    case 'arrived':
      return 'Arrivé';
    case 'cancelled':
      return 'Annulé';
    default:
      return status;
  }
};

/**
 * Retourne le label d'un type de transaction
 */
export const getTransactionTypeLabel = (type: CashTransaction['type']): string => {
  switch (type) {
    case 'sale':
      return 'Vente';
    case 'refund':
      return 'Remboursement';
    case 'deposit':
      return 'Dépôt';
    case 'withdrawal':
      return 'Retrait';
    default:
      return type;
  }
};

/**
 * Retourne le label d'un statut de transaction
 */
export const getTransactionStatusLabel = (status: CashTransaction['status']): string => {
  switch (status) {
    case 'completed':
      return 'Complété';
    case 'pending':
      return 'En attente';
    case 'cancelled':
      return 'Annulé';
    default:
      return status;
  }
};

/**
 * Retourne les informations complètes d'un type d'incident (label + icon + color)
 */
export const getIncidentTypeInfo = (type: Incident['type']) => {
  switch (type) {
    case 'delay':
      return { 
        label: 'Retard', 
        icon: Clock, 
        color: 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/20 dark:text-yellow-400' 
      };
    case 'mechanical':
      return { 
        label: 'Panne mécanique', 
        icon: AlertTriangle, 
        color: 'bg-orange-100 text-orange-700 dark:bg-orange-900/20 dark:text-orange-400' 
      };
    case 'cancellation':
      return { 
        label: 'Annulation', 
        icon: XCircle, 
        color: 'bg-purple-100 text-purple-700 dark:bg-purple-900/20 dark:text-purple-400' 
      };
    case 'accident':
      return { 
        label: 'Accident', 
        icon: AlertCircle, 
        color: 'bg-red-100 text-red-700 dark:bg-red-900/20 dark:text-red-400' 
      };
    default:
      return { 
        label: 'Autre', 
        icon: AlertTriangle, 
        color: 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300' 
      };
  }
};

/**
 * Retourne les informations complètes de sévérité (label + color)
 */
export const getIncidentSeverityInfo = (severity: Incident['severity']) => {
  switch (severity) {
    case 'critical':
      return { label: 'Critique', color: 'bg-red-600 text-white' };
    case 'high':
      return { label: 'Élevée', color: 'bg-orange-600 text-white' };
    case 'medium':
      return { label: 'Moyenne', color: 'bg-yellow-600 text-white' };
    default:
      return { label: 'Faible', color: 'bg-gray-600 text-white' };
  }
};

/**
 * Retourne les informations complètes de validation (label + icon + color)
 */
export const getIncidentValidationInfo = (validationStatus: Incident['validationStatus']) => {
  switch (validationStatus) {
    case 'validated':
      return { 
        label: 'Validé', 
        icon: CheckCircle, 
        color: 'text-green-600 dark:text-green-400' 
      };
    case 'rejected':
      return { 
        label: 'Rejeté', 
        icon: XCircle, 
        color: 'text-red-600 dark:text-red-400' 
      };
    default:
      return { 
        label: 'En attente', 
        icon: Clock, 
        color: 'text-orange-600 dark:text-orange-400' 
      };
  }
};

/**
 * Retourne le label d'un statut d'incident
 */
export const getIncidentStatusLabel = (status: Incident['status']): string => {
  switch (status) {
    case 'open':
      return 'Ouvert';
    case 'in-progress':
      return 'En cours';
    case 'resolved':
      return 'Résolu';
    default:
      return status;
  }
};

/**
 * Retourne le label d'un jour de la semaine
 */
export const getDayLabel = (dayIndex: number): string => {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  return days[dayIndex] || '';
};

/**
 * Retourne le label court d'un jour de la semaine
 */
export const getDayShortLabel = (dayIndex: number): string => {
  const days = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  return days[dayIndex] || '';
};

/**
 * Retourne le label d'un statut général (actif/inactif)
 */
export const getActiveStatusLabel = (status: 'active' | 'inactive'): string => {
  return status === 'active' ? 'Actif' : 'Inactif';
};

/**
 * Retourne le label d'une classe de service
 */
export const getServiceClassLabel = (serviceClass: 'standard' | 'vip' | 'mini'): string => {
  switch (serviceClass) {
    case 'standard':
      return 'Standard';
    case 'vip':
      return 'VIP';
    case 'mini':
      return 'Mini';
    default:
      return serviceClass;
  }
};

/**
 * Retourne le label d'un statut de story
 */
export const getStoryStatusLabel = (status: 'active' | 'scheduled' | 'expired' | 'draft'): string => {
  switch (status) {
    case 'active':
      return 'En cours';
    case 'scheduled':
      return 'Programmée';
    case 'expired':
      return 'Expirée';
    case 'draft':
      return 'Brouillon';
    default:
      return status;
  }
};

/**
 * Retourne le label d'un statut de support ticket
 */
export const getSupportTicketStatusLabel = (status: 'open' | 'in-progress' | 'resolved' | 'closed'): string => {
  switch (status) {
    case 'open':
      return 'Ouvert';
    case 'in-progress':
      return 'En cours';
    case 'resolved':
      return 'Résolu';
    case 'closed':
      return 'Fermé';
    default:
      return status;
  }
};

/**
 * Retourne le label d'une priorité de support ticket
 */
export const getSupportTicketPriorityLabel = (priority: 'low' | 'normal' | 'high' | 'urgent'): string => {
  switch (priority) {
    case 'low':
      return 'Basse';
    case 'normal':
      return 'Normale';
    case 'high':
      return 'Haute';
    case 'urgent':
      return 'Urgente';
    default:
      return priority;
  }
};

/**
 * Retourne le label d'un statut de local trip
 */
export const getLocalTripStatusLabel = (status: 'en_route' | 'at_station' | 'delayed' | 'cancelled'): string => {
  switch (status) {
    case 'en_route':
      return 'En route';
    case 'at_station':
      return 'À la gare';
    case 'delayed':
      return 'Retardé';
    case 'cancelled':
      return 'Annulé';
    default:
      return status;
  }
};

/**
 * Retourne le label d'une période
 */
export const getPeriodLabel = (period: 'today' | 'week' | 'month' | 'all'): string => {
  switch (period) {
    case 'today':
      return "aujourd'hui";
    case 'week':
      return 'cette semaine';
    case 'month':
      return 'ce mois';
    case 'all':
      return "tout l'historique";
    default:
      return '';
  }
};

/**
 * Retourne l'icône emoji d'une catégorie de support ticket
 */
export const getSupportCategoryIcon = (category: 'technical' | 'financial' | 'operational' | 'other'): string => {
  const icons = {
    technical: '🔧',
    financial: '💰',
    operational: '📋',
    other: '💬'
  };
  return icons[category] || '💬';
};