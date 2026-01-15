/**
 * SEAT CAPACITY DEBUG TOOLS
 * 
 * Utilisation dans la console:
 * import { debugTripsCapacity } from '@/lib/debugTools'
 * debugTripsCapacity()  // Affiche tableau complet
 */

import { TRIPS } from '../data/models';

export function debugTripsCapacity() {
  console.group('🎫 DEBUG: Capacité Trajets (Seats)');
  
  const data = TRIPS.map(trip => {
    const minSegments = Math.min(...trip.segments.map(s => s.available_seats));
    const matches = minSegments === trip.available_seats;
    
    return {
      'Trip ID': trip.trip_id,
      'Operator': trip.operator_name,
      'Route': `${trip.from_stop_name} → ${trip.to_stop_name}`,
      'Segments': trip.segments.length,
      'Declared': trip.available_seats,
      'Calculated Min': minSegments,
      'Match?': matches ? '✅' : '❌',
    };
  });
  
  console.table(data);
  
  const all_ok = data.every(d => d['Match?'] === '✅');
  
  if (all_ok) {
    console.log('%c✅ TOUS LES TRAJETS SONT COHÉRENTS!', 'color: green; font-weight: bold; font-size: 14px');
  } else {
    console.error('%c❌ INCOHÉRENCES DÉTECTÉES - Voir tableau ci-dessus', 'color: red; font-weight: bold; font-size: 14px');
  }
  
  console.groupEnd();
}

export function debugSegmentDetails(tripId: string) {
  const trip = TRIPS.find(t => t.trip_id === tripId);
  
  if (!trip) {
    console.error(`Trip ${tripId} not found`);
    return;
  }
  
  console.group(`📍 Détail Segments - ${tripId}`);
  
  const segmentData = trip.segments.map((seg, i) => ({
    'Seq': seg.sequence_number,
    'From': seg.from_stop_name,
    'To': seg.to_stop_name,
    'Distance (km)': seg.distance_km,
    'Available': seg.available_seats,
    'Total': seg.total_seats,
    'Occupancy %': Math.round((1 - seg.available_seats / seg.total_seats) * 100),
  }));
  
  console.table(segmentData);
  
  const minAvailable = Math.min(...trip.segments.map(s => s.available_seats));
  console.log(`\nCapacité effective du trajet: ${minAvailable} places (limitée par segment ${trip.segments.findIndex(s => s.available_seats === minAvailable) + 1})`);
  
  console.groupEnd();
}

export function debugAllSeatsStatus() {
  console.group('🪑 Statut Global des Places');
  
  const stats = {
    'Total trajets': TRIPS.length,
    'Total places': TRIPS.reduce((sum, t) => sum + t.total_seats, 0),
    'Places dispo': TRIPS.reduce((sum, t) => sum + t.available_seats, 0),
    'Taux occupation': Math.round(
      (1 - TRIPS.reduce((sum, t) => sum + t.available_seats, 0) / 
           TRIPS.reduce((sum, t) => sum + t.total_seats, 0)) * 100
    ) + '%',
  };
  
  console.table(stats);
  console.groupEnd();
}
