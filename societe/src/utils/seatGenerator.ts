import { SeatLayout } from '../contexts/DataContext';

/**
 * Génère la liste des numéros de sièges à partir d'un layout
 * Respecte la structure gauche/droite avec allée centrale
 */
export function generateSeatsFromLayout(layout: SeatLayout): string[] {
  const seats: string[] = [];
  const { rows, leftSeats, rightSeats } = layout.structure;
  
  for (let row = 0; row < rows; row++) {
    const rowLetter = String.fromCharCode(65 + row); // A, B, C...
    
    // Côté gauche (avant l'allée)
    for (let col = 1; col <= leftSeats; col++) {
      seats.push(`${rowLetter}${col}`);
    }
    
    // Côté droit (après l'allée)
    for (let col = 1; col <= rightSeats; col++) {
      seats.push(`${rowLetter}${col + leftSeats}`);
    }
  }
  
  // Limiter au nombre total de sièges du layout
  return seats.slice(0, layout.totalSeats);
}

/**
 * Récupère les informations de position d'un siège
 */
export function getSeatPosition(
  seatNumber: string,
  layout: SeatLayout
): {
  row: number;
  side: 'left' | 'right';
  column: number;
  isAisle: boolean;
} | null {
  const rowLetter = seatNumber[0];
  const colStr = seatNumber.slice(1);
  
  if (!rowLetter || !colStr) return null;
  
  const row = rowLetter.charCodeAt(0) - 65; // A=0, B=1, etc.
  const col = parseInt(colStr);
  
  if (row < 0 || row >= layout.structure.rows) return null;
  
  const { leftSeats } = layout.structure;
  
  if (col <= leftSeats) {
    // Côté gauche
    return {
      row,
      side: 'left',
      column: col,
      isAisle: col === leftSeats // Dernier siège côté gauche = à côté de l'allée
    };
  } else {
    // Côté droit
    return {
      row,
      side: 'right',
      column: col - leftSeats,
      isAisle: col === leftSeats + 1 // Premier siège côté droit = à côté de l'allée
    };
  }
}

/**
 * Génère une grille visuelle de sièges pour l'affichage
 * avec l'allée centrale
 */
export function generateSeatGrid(layout: SeatLayout): {
  rows: {
    left: string[];
    right: string[];
  }[];
} {
  const grid = [];
  const { rows, leftSeats, rightSeats } = layout.structure;
  
  for (let row = 0; row < rows; row++) {
    const rowLetter = String.fromCharCode(65 + row);
    
    const leftSide = [];
    for (let col = 1; col <= leftSeats; col++) {
      leftSide.push(`${rowLetter}${col}`);
    }
    
    const rightSide = [];
    for (let col = 1; col <= rightSeats; col++) {
      rightSide.push(`${rowLetter}${col + leftSeats}`);
    }
    
    grid.push({ left: leftSide, right: rightSide });
  }
  
  return { rows: grid };
}
