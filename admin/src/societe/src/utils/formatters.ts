/**
 * @file formatters.ts
 * @description Temporary formatters until @shared is linked
 */

export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} F CFA`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR');
}

export function formatDateTime(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('fr-FR') + ' ' + d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
}

export function formatDistance(km: number): string {
  return `${km} km`;
}

export function formatCoordinates(lat: number, lng: number): string {
  return `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
}

export function getTripStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'scheduled': 'Programmé',
    'in-progress': 'En cours',
    'completed': 'Terminé',
    'cancelled': 'Annulé'
  };
  return labels[status] || status;
}

export function getTripStatusColor(status: string): string {
  const colors: Record<string, string> = {
    'scheduled': 'blue',
    'in-progress': 'yellow',
    'completed': 'green',
    'cancelled': 'red'
  };
  return colors[status] || 'gray';
}

export function getTicketStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    'booked': 'Réservé',
    'confirmed': 'Confirmé',
    'used': 'Utilisé',
    'cancelled': 'Annulé',
    'refunded': 'Remboursé'
  };
  return labels[status] || status;
}

export function getIncidentSeverityLabel(severity: string): string {
  const labels: Record<string, string> = {
    'low': 'Faible',
    'medium': 'Moyen',
    'high': 'Élevé',
    'critical': 'Critique'
  };
  return labels[severity] || severity;
}

export function getIncidentSeverityColor(severity: string): string {
  const colors: Record<string, string> = {
    'low': 'green',
    'medium': 'yellow',
    'high': 'orange',
    'critical': 'red'
  };
  return colors[severity] || 'gray';
}
