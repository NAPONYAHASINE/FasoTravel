/**
 * @file formatters.ts
 * @description Utility functions for formatting data
 */

import { CURRENCY } from '../services/constants';

// ============= DATE & TIME FORMATTING =============

/**
 * Format date to DD/MM/YYYY
 */
export function formatDate(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const day = String(d.getDate()).padStart(2, '0');
  const month = String(d.getMonth() + 1).padStart(2, '0');
  const year = d.getFullYear();
  
  return `${day}/${month}/${year}`;
}

/**
 * Format date to DD/MM/YYYY HH:mm
 */
export function formatDateTime(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const dateStr = formatDate(d);
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${dateStr} ${hours}:${minutes}`;
}

/**
 * Format time to HH:mm
 */
export function formatTime(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const hours = String(d.getHours()).padStart(2, '0');
  const minutes = String(d.getMinutes()).padStart(2, '0');
  
  return `${hours}:${minutes}`;
}

/**
 * Format date to relative time (e.g., "Il y a 2 heures")
 */
export function formatRelativeTime(date: string | Date): string {
  const d = new Date(date);
  if (isNaN(d.getTime())) return '';
  
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHour = Math.floor(diffMin / 60);
  const diffDay = Math.floor(diffHour / 24);
  
  if (diffSec < 60) return 'À l\'instant';
  if (diffMin < 60) return `Il y a ${diffMin} minute${diffMin > 1 ? 's' : ''}`;
  if (diffHour < 24) return `Il y a ${diffHour} heure${diffHour > 1 ? 's' : ''}`;
  if (diffDay < 7) return `Il y a ${diffDay} jour${diffDay > 1 ? 's' : ''}`;
  
  return formatDate(d);
}

/**
 * Format duration in minutes to "Xh Ymin"
 */
export function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (mins === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${mins}min`;
}

// ============= CURRENCY FORMATTING =============

/**
 * Format number to currency (e.g., "50 000 F CFA")
 */
export function formatCurrency(amount: number): string {
  if (isNaN(amount)) return '0 F CFA';
  
  // Format with spaces as thousands separator
  const formatted = Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
  
  return `${formatted} ${CURRENCY.SYMBOL}`;
}

/**
 * Format currency without symbol (for inputs)
 */
export function formatCurrencyNumber(amount: number): string {
  if (isNaN(amount)) return '0';
  
  return Math.round(amount)
    .toString()
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

/**
 * Parse formatted currency string to number
 */
export function parseCurrency(value: string): number {
  // Remove spaces and non-numeric characters except decimal point
  const cleaned = value.replace(/[^\d]/g, '');
  const parsed = parseInt(cleaned, 10);
  return isNaN(parsed) ? 0 : parsed;
}

// ============= PHONE FORMATTING =============

/**
 * Format phone number
 * Example: "+221781234567" -> "+221 78 123 45 67"
 */
export function formatPhone(phone: string): string {
  if (!phone) return '';
  
  // Remove all non-numeric characters except +
  const cleaned = phone.replace(/[^\d+]/g, '');
  
  // Basic formatting (can be enhanced per country)
  if (cleaned.startsWith('+')) {
    const countryCode = cleaned.slice(0, 4);
    const rest = cleaned.slice(4);
    const formatted = rest.replace(/(\d{2})(?=\d)/g, '$1 ');
    return `${countryCode} ${formatted}`.trim();
  }
  
  return cleaned.replace(/(\d{2})(?=\d)/g, '$1 ').trim();
}

// ============= TEXT FORMATTING =============

/**
 * Truncate text with ellipsis
 */
export function truncate(text: string, maxLength: number): string {
  if (!text) return '';
  if (text.length <= maxLength) return text;
  
  return text.slice(0, maxLength - 3) + '...';
}

/**
 * Capitalize first letter
 */
export function capitalize(text: string): string {
  if (!text) return '';
  return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
}

/**
 * Convert to title case
 */
export function toTitleCase(text: string): string {
  if (!text) return '';
  
  return text
    .toLowerCase()
    .split(' ')
    .map(word => capitalize(word))
    .join(' ');
}

/**
 * Format name (title case, trim)
 */
export function formatName(name: string): string {
  if (!name) return '';
  return toTitleCase(name.trim());
}

// ============= NUMBER FORMATTING =============

/**
 * Format percentage
 */
export function formatPercentage(value: number, decimals = 1): string {
  if (isNaN(value)) return '0%';
  return `${value.toFixed(decimals)}%`;
}

/**
 * Format distance
 */
export function formatDistance(km: number): string {
  if (isNaN(km)) return '0 km';
  
  if (km < 1) {
    return `${Math.round(km * 1000)} m`;
  }
  
  return `${km.toFixed(1)} km`;
}

/**
 * Format seat number (e.g., "A1" -> "Siège A1")
 */
export function formatSeatNumber(seat: string): string {
  if (!seat) return '';
  return `Siège ${seat}`;
}

/**
 * Format list of items
 */
export function formatList(items: string[]): string {
  if (!items || items.length === 0) return '';
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} et ${items[1]}`;
  
  const lastItem = items[items.length - 1];
  const otherItems = items.slice(0, -1).join(', ');
  
  return `${otherItems} et ${lastItem}`;
}

// ============= FILE SIZE FORMATTING =============

/**
 * Format file size (bytes to human readable)
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

// ============= STATUS FORMATTING =============

/**
 * Format boolean to Oui/Non
 */
export function formatBoolean(value: boolean): string {
  return value ? 'Oui' : 'Non';
}

/**
 * Format status badge class
 */
export function getStatusClass(status: string): string {
  const statusMap: Record<string, string> = {
    active: 'status-active',
    inactive: 'status-inactive',
    suspended: 'status-suspended',
    scheduled: 'status-scheduled',
    boarding: 'status-in-progress',
    departed: 'status-active',
    arrived: 'status-completed',
    'in-progress': 'status-in-progress',
    completed: 'status-completed',
    cancelled: 'status-cancelled',
    booked: 'status-booked',
    confirmed: 'status-confirmed',
    used: 'status-used',
    refunded: 'status-refunded',
    pending: 'status-pending',
    paid: 'status-paid',
    failed: 'status-failed'
  };
  
  return statusMap[status] || 'status-default';
}

// ============= COORDINATE FORMATTING =============

/**
 * Format coordinates
 */
export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
}

/**
 * Format address
 */
export function formatAddress(address: {
  street?: string;
  city?: string;
  country?: string;
}): string {
  const parts = [address.street, address.city, address.country].filter(Boolean);
  return parts.join(', ');
}
