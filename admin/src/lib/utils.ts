import { COLORS, CURRENCY, TIME } from './constants';
import type { 
  BusStatus, 
  TicketStatus, 
  IncidentStatus, 
  IntegrationStatus, 
  LogLevel, 
  TicketPriority,
  IncidentSeverity 
} from '../types';

// ==================== COLOR UTILITIES ====================

export function getStatusColor(
  status: BusStatus | TicketStatus | IncidentStatus | IntegrationStatus | string
): string {
  const colorMap: Record<string, string> = {
    'active': COLORS.green,
    'online': COLORS.green,
    'en-route': COLORS.green,
    'confirmed': COLORS.green,
    'resolved': COLORS.green,
    
    'delay': COLORS.yellow,
    'scheduled': COLORS.yellow,
    'in-progress': COLORS.yellow,
    'pending': COLORS.yellow,
    
    'incident': COLORS.red,
    'open': COLORS.red,
    'error': COLORS.red,
    'critical': COLORS.red,
    'offline': COLORS.red,
    'suspended': COLORS.red,
    
    'maintenance': COLORS.blue,
    'parked': COLORS.gray,
    'inactive': COLORS.gray,
    'closed': COLORS.gray,
    'ended': COLORS.gray,
  };

  return colorMap[status] || COLORS.gray;
}

export function getPriorityColor(priority: TicketPriority | IncidentSeverity): string {
  const colorMap: Record<string, string> = {
    'critical': COLORS.red,
    'urgent': COLORS.red,
    'high': COLORS.yellow,
    'medium': COLORS.blue,
    'low': COLORS.gray,
  };

  return colorMap[priority] || COLORS.gray;
}

export function getLogLevelColor(level: LogLevel): string {
  const colorMap: Record<LogLevel, string> = {
    'critical': COLORS.red,
    'error': COLORS.yellow,
    'warning': COLORS.blue,
    'info': COLORS.gray,
  };

  return colorMap[level];
}

// Nouvelles fonctions pour les badges avec fond coloré
export function getStatusBadgeClasses(
  status: BusStatus | TicketStatus | IncidentStatus | IntegrationStatus | string
): string {
  const classMap: Record<string, string> = {
    'active': 'bg-green-200 dark:bg-green-900/30 text-green-900 dark:text-green-200 border border-green-400 dark:border-green-700',
    'online': 'bg-green-200 dark:bg-green-900/30 text-green-900 dark:text-green-200 border border-green-400 dark:border-green-700',
    'en-route': 'bg-green-200 dark:bg-green-900/30 text-green-900 dark:text-green-200 border border-green-400 dark:border-green-700',
    'confirmed': 'bg-green-200 dark:bg-green-900/30 text-green-900 dark:text-green-200 border border-green-400 dark:border-green-700',
    'resolved': 'bg-green-200 dark:bg-green-900/30 text-green-900 dark:text-green-200 border border-green-400 dark:border-green-700',
    
    'delay': 'bg-yellow-200 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-200 border border-yellow-400 dark:border-yellow-700',
    'scheduled': 'bg-yellow-200 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-200 border border-yellow-400 dark:border-yellow-700',
    'in-progress': 'bg-yellow-200 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-200 border border-yellow-400 dark:border-yellow-700',
    'pending': 'bg-yellow-200 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-200 border border-yellow-400 dark:border-yellow-700',
    
    'incident': 'bg-red-200 dark:bg-red-900/30 text-red-900 dark:text-red-200 border border-red-400 dark:border-red-700',
    'open': 'bg-red-200 dark:bg-red-900/30 text-red-900 dark:text-red-200 border border-red-400 dark:border-red-700',
    'error': 'bg-red-200 dark:bg-red-900/30 text-red-900 dark:text-red-200 border border-red-400 dark:border-red-700',
    'critical': 'bg-red-200 dark:bg-red-900/30 text-red-900 dark:text-red-200 border border-red-400 dark:border-red-700',
    'offline': 'bg-red-200 dark:bg-red-900/30 text-red-900 dark:text-red-200 border border-red-400 dark:border-red-700',
    'suspended': 'bg-red-200 dark:bg-red-900/30 text-red-900 dark:text-red-200 border border-red-400 dark:border-red-700',
    
    'maintenance': 'bg-blue-200 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 border border-blue-400 dark:border-blue-700',
    'parked': 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-400 dark:border-gray-600',
    'inactive': 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-400 dark:border-gray-600',
    'closed': 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-400 dark:border-gray-600',
    'ended': 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-400 dark:border-gray-600',
  };

  return classMap[status] || 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-400 dark:border-gray-600';
}

export function getPriorityBadgeClasses(priority: TicketPriority | IncidentSeverity): string {
  const classMap: Record<string, string> = {
    'critical': 'bg-red-200 dark:bg-red-900/30 text-red-900 dark:text-red-200 border border-red-400 dark:border-red-700',
    'urgent': 'bg-red-200 dark:bg-red-900/30 text-red-900 dark:text-red-200 border border-red-400 dark:border-red-700',
    'high': 'bg-yellow-200 dark:bg-yellow-900/30 text-yellow-900 dark:text-yellow-200 border border-yellow-400 dark:border-yellow-700',
    'medium': 'bg-blue-200 dark:bg-blue-900/30 text-blue-900 dark:text-blue-200 border border-blue-400 dark:border-blue-700',
    'low': 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-400 dark:border-gray-600',
  };

  return classMap[priority] || 'bg-gray-300 dark:bg-gray-700 text-gray-900 dark:text-gray-200 border border-gray-400 dark:border-gray-600';
}

// ==================== FORMAT UTILITIES ====================

export function formatCurrency(amount: number): string {
  if (amount >= 1000000) {
    return `${(amount / 1000000).toFixed(1)}M ${CURRENCY.symbol}`;
  }
  if (amount >= 1000) {
    return `${(amount / 1000).toFixed(1)}K ${CURRENCY.symbol}`;
  }
  return `${amount} ${CURRENCY.symbol}`;
}

export function formatNumber(num: number): string {
  return new Intl.NumberFormat(CURRENCY.locale).format(num);
}

export function formatPercentage(value: number): string {
  return `${value > 0 ? '+' : ''}${value.toFixed(1)}%`;
}

// ==================== DATE UTILITIES ====================

export function getRelativeTime(dateInput: Date | string | undefined | null): string {
  if (!dateInput) {
    return 'Date inconnue';
  }
  
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  
  // Vérifier si la date est valide
  if (isNaN(date.getTime())) {
    return 'Date invalide';
  }
  
  const now = new Date();
  const diff = now.getTime() - date.getTime();

  if (diff < TIME.MINUTE) {
    return 'Il y a quelques secondes';
  }
  if (diff < TIME.HOUR) {
    const minutes = Math.floor(diff / TIME.MINUTE);
    return `Il y a ${minutes} min`;
  }
  if (diff < TIME.DAY) {
    const hours = Math.floor(diff / TIME.HOUR);
    return `Il y a ${hours}h`;
  }
  const days = Math.floor(diff / TIME.DAY);
  return `Il y a ${days}j`;
}

export function formatDate(dateInput: Date | string, format: 'short' | 'long' = 'short'): string {
  const date = typeof dateInput === 'string' ? new Date(dateInput) : dateInput;
  if (format === 'short') {
    return new Intl.DateTimeFormat('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    }).format(date);
  }
  
  return new Intl.DateTimeFormat('fr-FR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

export function formatTime(date: Date): string {
  return new Intl.DateTimeFormat('fr-FR', {
    hour: '2-digit',
    minute: '2-digit'
  }).format(date);
}

// ==================== CALCULATION UTILITIES ====================

export function calculatePercentage(value: number, total: number): number {
  if (total === 0) return 0;
  return (value / total) * 100;
}

export function calculateCTR(clicks: number, impressions: number): number {
  if (impressions === 0) return 0;
  return (clicks / impressions) * 100;
}

export function calculateETA(distance: number, speed: number = 60): number {
  // distance in km, speed in km/h
  // returns minutes
  return Math.round((distance / speed) * 60);
}

// ==================== VALIDATION UTILITIES ====================

export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function isValidPhone(phone: string): boolean {
  // Burkina Faso phone format: +226 XX XX XX XX
  const phoneRegex = /^\+226\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/;
  return phoneRegex.test(phone);
}

export function maskApiKey(apiKey: string): string {
  if (apiKey.length <= 8) return '****';
  return apiKey.slice(0, 4) + '****' + apiKey.slice(-4);
}

// ==================== RANDOM UTILITIES ====================

export function randomInt(min: number, max: number): number {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

export function randomElement<T>(array: readonly T[]): T {
  return array[randomInt(0, array.length - 1)];
}

export function generateId(): string {
  return Math.random().toString(36).substring(2, 15);
}

// ==================== SORTING UTILITIES ====================

export function sortByDate<T extends { createdAt: Date }>(
  items: T[], 
  order: 'asc' | 'desc' = 'desc'
): T[] {
  return [...items].sort((a, b) => {
    const diff = a.createdAt.getTime() - b.createdAt.getTime();
    return order === 'asc' ? diff : -diff;
  });
}

export function sortByPriority<T extends { priority: TicketPriority }>(items: T[]): T[] {
  const priorityOrder = { 'urgent': 4, 'high': 3, 'medium': 2, 'low': 1 };
  return [...items].sort((a, b) => priorityOrder[b.priority] - priorityOrder[a.priority]);
}

// ==================== EXPORT UTILITIES ====================

/**
 * Exporte des données au format CSV
 * @param data - Tableau d'objets à exporter
 * @param filename - Nom du fichier (sans extension)
 */
export function exportToCSV(data: Record<string, any>[], filename: string = 'export'): void {
  if (data.length === 0) {
    console.warn('Aucune donnée à exporter');
    return;
  }

  // Extraire les en-têtes (clés du premier objet)
  const headers = Object.keys(data[0]);
  
  // Créer la ligne d'en-têtes
  const csvHeaders = headers.join(',');
  
  // Créer les lignes de données
  const csvRows = data.map(row => {
    return headers.map(header => {
      const value = row[header];
      
      // Gérer les valeurs avec des virgules, guillemets, ou retours à la ligne
      if (value === null || value === undefined) {
        return '';
      }
      
      const stringValue = String(value);
      
      // Si la valeur contient des caractères spéciaux, l'entourer de guillemets
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      
      return stringValue;
    }).join(',');
  });
  
  // Combiner en-têtes et données
  const csvContent = [csvHeaders, ...csvRows].join('\n');
  
  // Créer un blob avec le contenu CSV
  const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
  
  // Créer un lien de téléchargement
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  // Libérer l'URL
  URL.revokeObjectURL(url);
}

/**
 * Exporte des données au format JSON
 * @param data - Données à exporter
 * @param filename - Nom du fichier (sans extension)
 */
export function exportToJSON(data: any, filename: string = 'export'): void {
  const jsonContent = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonContent], { type: 'application/json' });
  
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  
  link.setAttribute('href', url);
  link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.json`);
  link.style.visibility = 'hidden';
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  
  URL.revokeObjectURL(url);
}