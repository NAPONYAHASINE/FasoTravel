import { Ticket, SeatLayout } from '../contexts/DataContext';
import { generateSeatsFromLayout } from './seatGenerator';

export interface ValidationResult {
  valid: boolean;
  errors: string[];
}

/**
 * Valide la sélection de sièges avant la vente
 */
export function validateSeatSelection(
  tripId: string,
  seatNumbers: string[],
  layout: SeatLayout,
  tickets: Ticket[]
): ValidationResult {
  const errors: string[] = [];
  
  // 1. Vérifier que des sièges sont sélectionnés
  if (seatNumbers.length === 0) {
    errors.push('Veuillez sélectionner au moins un siège');
    return { valid: false, errors };
  }
  
  // 2. Vérifier que les sièges existent dans le layout
  const validSeats = generateSeatsFromLayout(layout);
  const invalidSeats = seatNumbers.filter(s => !validSeats.includes(s));
  if (invalidSeats.length > 0) {
    errors.push(`Sièges invalides : ${invalidSeats.join(', ')}`);
  }
  
  // 3. Vérifier qu'ils ne sont pas déjà vendus
  const soldSeats = tickets
    .filter(t => 
      t.tripId === tripId && 
      (t.status === 'valid' || t.status === 'used')
    )
    .map(t => t.seatNumber);
  
  const alreadySold = seatNumbers.filter(s => soldSeats.includes(s));
  if (alreadySold.length > 0) {
    errors.push(`Ces sièges sont déjà vendus : ${alreadySold.join(', ')}`);
  }
  
  return {
    valid: errors.length === 0,
    errors
  };
}
