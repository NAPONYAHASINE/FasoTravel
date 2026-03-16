import { useMemo } from 'react';
import type { Ticket, Incident, Advertisement, Station, TransportCompany } from '../types';
import { calculatePercentage, calculateCTR } from '../lib/utils';

// ==================== OPERATOR/COMPANY STATS ====================

export function useOperatorStats(companies: TransportCompany[]) {
  return useMemo(() => {
    const active = companies.filter(o => o.status === 'active').length;
    const suspended = companies.filter(o => o.status === 'suspended').length;
    
    return {
      total: companies.length,
      active,
      suspended,
      activePercentage: calculatePercentage(active, companies.length),
    };
  }, [companies]);
}

// ==================== TICKET STATS ====================
// ⚠️ Statuts BILLETS: ACTIF, EMBARQUÉ, EXPIRÉ, ANNULÉ

export function useTicketStats(tickets: Ticket[]) {
  return useMemo(() => {
    const actif = tickets.filter(t => t.status === 'active').length;
    const embarque = tickets.filter(t => t.status === 'boarded').length;
    const expire = tickets.filter(t => t.status === 'expired').length;
    const annule = tickets.filter(t => t.status === 'cancelled').length;

    return {
      total: tickets.length,
      actif,
      embarque,
      expire,
      annule,
      active: actif + embarque,
      by_status: {
        active: actif,
        boarded: embarque,
        expired: expire,
        cancelled: annule
      }
    };
  }, [tickets]);
}

// ==================== INCIDENT STATS ====================

export function useIncidentStats(incidents: Incident[]) {
  return useMemo(() => {
    const open = incidents.filter(i => i.status === 'open').length;
    const inProgress = incidents.filter(i => i.status === 'in-progress').length;
    const resolved = incidents.filter(i => i.status === 'resolved').length;

    const critical = incidents.filter(i => i.severity === 'critical').length;
    const high = incidents.filter(i => i.severity === 'high').length;
    const medium = incidents.filter(i => i.severity === 'medium').length;
    const low = incidents.filter(i => i.severity === 'low').length;

    return {
      total: incidents.length,
      open,
      inProgress,
      resolved,
      critical,
      high,
      medium,
      low,
      needsAttention: critical + high
    };
  }, [incidents]);
}

// ==================== ADVERTISEMENT STATS ====================

export function useAdvertisementStats(advertisements: Advertisement[]) {
  return useMemo(() => {
    const active = advertisements.filter(a => a.status === 'active').length;
    const inactive = advertisements.filter(a => a.status === 'inactive').length;
    const expired = advertisements.filter(a => a.status === 'expired').length;

    const totalImpressions = advertisements.reduce((sum, a) => sum + (a.impressions || 0), 0);
    const totalClicks = advertisements.reduce((sum, a) => sum + (a.clicks || 0), 0);

    const avgCTR = calculateCTR(totalClicks, totalImpressions);

    return {
      total: advertisements.length,
      active,
      inactive,
      expired,
      totalImpressions,
      totalClicks,
      avgCTR
    };
  }, [advertisements]);
}

// ==================== STATION STATS ====================

export function useStationStats(stations: Station[]) {
  return useMemo(() => {
    const active = stations.filter(s => s.status === 'active').length;
    const inactive = stations.filter(s => s.status === 'inactive').length;
    const connected = stations.filter(s => s.isConnected).length;

    return {
      total: stations.length,
      active,
      inactive,
      connected,
      activePercentage: calculatePercentage(active, stations.length),
      connectedPercentage: calculatePercentage(connected, stations.length)
    };
  }, [stations]);
}
