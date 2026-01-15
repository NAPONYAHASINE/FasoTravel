/**
 * SeatMap Component - DYNAMIQUE
 * Plan de sièges configurable par compagnie
 * 
 * DEV NOTES:
 * - ✅ PRÊT POUR BACKEND: Layout configurable (2x2, 2x3, 1x2, etc.)
 * - Endpoint: GET /trips/:id/seats retourne { layout, occupiedSeats }
 * - Variants: available / hold / paid / offline_reserved / selected
 * - Event: seat_selected → track siège choisi
 * 
 * BACKEND PAYLOAD ATTENDU:
 * {
 *   "layout": {
 *     "rows": 11,
 *     "columns": 4,
 *     "aisle_after_column": 2,  // Allée après la colonne 2 (entre B et C)
 *     "seat_labels": ["A", "B", "C", "D"]
 *   },
 *   "occupied_seats": {
 *     "A1": "paid",
 *     "B5": "hold",
 *     "C3": "offline_reserved"
 *   }
 * }
 */

import { SeatStatus } from '../data/models';

interface SeatLayout {
  rows: number;
  columns: number;
  aisle_after_column?: number; // Indice de colonne après laquelle placer l'allée (null = pas d'allée)
  seat_labels?: string[]; // Labels des colonnes (ex: ["A", "B", "C", "D"])
}

interface SeatMapProps {
  // Configuration du plan (vient du backend)
  layout?: SeatLayout;
  
  // Ancienne API (deprecated mais toujours supportée)
  rows?: number;
  seatsPerRow?: number;
  
  // États des sièges (vient du backend)
  occupiedSeats?: { [key: string]: SeatStatus };
  
  // Sièges sélectionnés localement
  selectedSeat?: string; // Deprecated: use selectedSeats instead
  selectedSeats?: string[];
  
  // Callback sélection
  onSeatSelect?: (seatId: string) => void;
}

export function SeatMap({
  layout,
  rows: legacyRows = 11,
  seatsPerRow: legacySeatsPerRow = 4,
  occupiedSeats = {},
  selectedSeat,
  selectedSeats = [],
  onSeatSelect
}: SeatMapProps) {
  // Utiliser layout du backend ou fallback sur props legacy
  const config: SeatLayout = layout || {
    rows: legacyRows,
    columns: legacySeatsPerRow,
    aisle_after_column: legacySeatsPerRow === 4 ? 1 : undefined, // Allée après colonne 2 par défaut pour 4 colonnes
    seat_labels: Array.from({ length: legacySeatsPerRow }, (_, i) => String.fromCharCode(65 + i))
  };

  const getSeatId = (row: number, col: number): string => {
    const labels = config.seat_labels || Array.from({ length: config.columns }, (_, i) => String.fromCharCode(65 + i));
    return `${labels[col]}${row}`;
  };

  const getSeatStatus = (seatId: string): SeatStatus => {
    const isSelected = selectedSeats.includes(seatId) || selectedSeat === seatId;
    if (isSelected) return 'selected';
    return occupiedSeats[seatId] || 'available';
  };

  const getSeatClassName = (status: SeatStatus): string => {
    const baseClass = "w-8 h-8 sm:w-10 sm:h-10 rounded-lg border-2 flex items-center justify-center text-[10px] sm:text-xs cursor-pointer transition-all active:scale-95 sm:hover:scale-105";
    
    switch (status) {
      case 'available':
        return `${baseClass} bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-900 dark:text-white active:border-green-600 dark:active:border-green-400 sm:hover:border-green-600 dark:sm:hover:border-green-400`;
      case 'selected':
        return `${baseClass} bg-green-600 dark:bg-green-500 border-green-600 dark:border-green-500 text-white`;
      case 'hold':
        return `${baseClass} bg-amber-100 dark:bg-amber-900/30 border-amber-300 dark:border-amber-700 text-amber-900 dark:text-amber-400 cursor-not-allowed opacity-60`;
      case 'paid':
        return `${baseClass} bg-gray-200 dark:bg-gray-600 border-gray-300 dark:border-gray-500 text-gray-700 dark:text-gray-300 cursor-not-allowed opacity-60`;
      case 'offline_reserved':
        return `${baseClass} bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-700 text-blue-900 dark:text-blue-400 cursor-not-allowed opacity-60`;
      default:
        return baseClass;
    }
  };

  const handleSeatClick = (seatId: string, status: SeatStatus) => {
    if (status === 'available' || status === 'selected') {
      onSeatSelect?.(seatId);
    }
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl sm:rounded-2xl p-4 sm:p-6 overflow-x-auto border border-gray-100 dark:border-gray-700">
      {/* Driver */}
      <div className="mb-4 sm:mb-6 flex justify-end">
        <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-green-100 to-amber-100 dark:from-green-900/30 dark:to-amber-900/30 rounded-lg flex items-center justify-center border border-gray-200 dark:border-gray-700">
          <span className="text-xl sm:text-2xl">🚗</span>
        </div>
      </div>

      {/* Seats Grid - DYNAMIQUE */}
      <div className="space-y-2 sm:space-y-3 min-w-min">
        {Array.from({ length: config.rows }, (_, rowIndex) => (
          <div key={rowIndex} className="flex justify-center gap-2 sm:gap-3">
            {Array.from({ length: config.columns }, (_, colIndex) => {
              const seatId = getSeatId(rowIndex + 1, colIndex);
              const status = getSeatStatus(seatId);
              
              // Allée DYNAMIQUE après la colonne spécifiée
              const isAisleAfter = config.aisle_after_column !== undefined && colIndex === config.aisle_after_column;
              
              return (
                <div key={colIndex} className="flex gap-2 sm:gap-3">
                  <button
                    className={getSeatClassName(status)}
                    onClick={() => handleSeatClick(seatId, status)}
                    disabled={status !== 'available' && status !== 'selected'}
                  >
                    {seatId}
                  </button>
                  
                  {/* Allée conditionnelle */}
                  {isAisleAfter && (
                    <div className="w-4 sm:w-6"></div>
                  )}
                </div>
              );
            })}
          </div>
        ))}
      </div>

      {/* Légende */}
      <div className="mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-gray-200 dark:border-gray-700">
        <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400 mb-2 sm:mb-3">Légende :</p>
        <div className="grid grid-cols-2 gap-2 sm:gap-3">
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-white dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 flex-shrink-0"></div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Disponible</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-green-600 dark:bg-green-500 border-2 border-green-600 dark:border-green-500 flex-shrink-0"></div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Sélectionné</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-gray-200 dark:bg-gray-600 border-2 border-gray-300 dark:border-gray-500 flex-shrink-0"></div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">Occupé</span>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            <div className="w-5 h-5 sm:w-6 sm:h-6 rounded bg-amber-100 dark:bg-amber-900/30 border-2 border-amber-300 dark:border-amber-700 flex-shrink-0"></div>
            <span className="text-xs sm:text-sm text-gray-700 dark:text-gray-300">En réservation</span>
          </div>
        </div>
      </div>

      {/* Info configuration (dev mode) */}
      {layout && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <p className="text-xs text-gray-400 dark:text-gray-500">
            Configuration: {config.rows} rangées × {config.columns} sièges
            {config.aisle_after_column !== undefined && ` • Allée après colonne ${config.aisle_after_column + 1}`}
          </p>
        </div>
      )}
    </div>
  );
}

/**
 * GUIDE D'INTÉGRATION BACKEND
 * 
 * 1. Endpoint pour récupérer la configuration du plan:
 *    GET /trips/:tripId/seats
 *    
 *    Response:
 *    {
 *      "layout": {
 *        "rows": 12,
 *        "columns": 4,
 *        "aisle_after_column": 1,
 *        "seat_labels": ["A", "B", "C", "D"]
 *      },
 *      "occupied_seats": {
 *        "A1": "paid",
 *        "A2": "hold",
 *        "B3": "offline_reserved"
 *      }
 *    }
 * 
 * 2. Configurations courantes par type de véhicule:
 *    
 *    - Bus standard (4 colonnes):
 *      { rows: 11, columns: 4, aisle_after_column: 1 }
 *      → A B | C D (allée au milieu)
 *    
 *    - Minibus (3 colonnes):
 *      { rows: 8, columns: 3, aisle_after_column: 1 }
 *      → A B | C
 *    
 *    - Bus VIP (3 colonnes):
 *      { rows: 10, columns: 3, aisle_after_column: null }
 *      → A B C (pas d'allée, sièges larges)
 *    
 *    - Van (2 colonnes):
 *      { rows: 5, columns: 2, aisle_after_column: null }
 *      → A B
 * 
 * 3. Utilisation dans SeatSelectionPage:
 *    
 *    const { layout, seats, isLoading } = useSeats(tripId);
 *    
 *    <SeatMap
 *      layout={layout}
 *      occupiedSeats={seats}
 *      selectedSeats={selectedSeats}
 *      onSeatSelect={handleSeatSelect}
 *    />
 * 
 * 4. Modifier le hook useSeats() dans /lib/hooks.ts:
 *    
 *    export function useSeats(tripId: string) {
 *      const [data, setData] = useState<{
 *        layout: SeatLayout;
 *        seats: { [key: string]: SeatStatus };
 *      } | null>(null);
 *      
 *      useEffect(() => {
 *        fetch(`/api/trips/${tripId}/seats`)
 *          .then(res => res.json())
 *          .then(data => setData({
 *            layout: data.layout,
 *            seats: data.occupied_seats
 *          }));
 *      }, [tripId]);
 *      
 *      return { 
 *        layout: data?.layout, 
 *        seats: data?.seats || {},
 *        isLoading: !data 
 *      };
 *    }
 */
