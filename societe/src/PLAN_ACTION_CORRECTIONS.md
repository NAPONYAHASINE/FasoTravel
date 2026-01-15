# 🚀 PLAN D'ACTION CORRECTIONS LOGIQUE MÉTIER

**Date :** 2026-01-02  
**Projet :** FasoTravel Dashboard  
**Objectif :** Corriger les incohérences critiques de logique métier

---

## 📋 SYNTHÈSE

**Problèmes identifiés :** 10  
**Critiques (P0) :** 3  
**Majeurs (P1) :** 4  
**Moyens (P2) :** 3

**Temps total estimé :** 9-12 heures  
**Fichiers à modifier :** 8  
**Fichiers à créer :** 4

---

## 🎯 PHASE 1 : CORRECTIONS CRITIQUES (P0) - 4 heures

> **Objectif :** Corriger les bugs bloquants avant toute démo client

### Tâche 1.1 : Corriger les places occupées mockées ⏱️ 1h

**Fichier :** `/pages/caissier/TicketSalePage.tsx`

**Code actuel (ligne 77-83) :**
```typescript
// ❌ PROBLÈME
const occupiedSeats = useMemo(() => {
  if (!currentTrip) return [];
  const occupiedCount = currentTrip.totalSeats - currentTrip.availableSeats;
  const totalSeats = generateSeats(currentTrip.totalSeats);
  return totalSeats.slice(0, occupiedCount); // Juste les N premiers
}, [currentTrip]);
```

**Correction à appliquer :**
```typescript
// ✅ SOLUTION : Lire depuis les tickets réels
const occupiedSeats = useMemo(() => {
  if (!currentTrip) return [];
  
  return tickets
    .filter(t => 
      t.tripId === currentTrip.id && 
      (t.status === 'valid' || t.status === 'used')
    )
    .map(t => t.seatNumber);
}, [currentTrip, tickets]);
```

**Import nécessaire :**
```typescript
// Ajouter en haut du fichier
const { trips, addTicket, tickets } = useFilteredData(); // Ajouter 'tickets'
```

**Test de validation :**
1. Vendre un billet siège E3
2. Rafraîchir la page de vente
3. Vérifier que E3 apparaît gris (occupé)
4. Essayer de cliquer sur E3 → doit afficher "Ce siège est déjà occupé"

---

### Tâche 1.2 : Créer la fonction de calcul de prix dynamique ⏱️ 1.5h

**Nouveau fichier :** `/utils/pricingCalculator.ts`

```typescript
import { PricingRule } from '../contexts/DataContext';

/**
 * Calcule le prix final d'un trajet en appliquant les règles de tarification
 * @param basePrice Prix de base de la route
 * @param routeId ID de la route
 * @param departureTime Date/heure de départ (ISO string)
 * @param rules Toutes les règles de tarification
 * @returns Prix final arrondi
 */
export function calculatePriceWithRules(
  basePrice: number,
  routeId: string,
  departureTime: string,
  rules: PricingRule[]
): number {
  const departureDate = new Date(departureTime);
  const dayOfWeek = departureDate.getDay(); // 0 = dimanche, 6 = samedi
  const hours = departureDate.getHours();
  const minutes = departureDate.getMinutes();
  const timeOfDay = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;
  
  // Filtrer les règles applicables
  const applicableRules = rules
    .filter(r => {
      // 1. Vérifier la route
      if (r.routeId !== routeId) return false;
      
      // 2. Vérifier le statut
      if (r.status !== 'active') return false;
      
      // 3. Vérifier la période
      const startDate = new Date(r.startDate);
      const endDate = r.endDate ? new Date(r.endDate) : null;
      if (departureDate < startDate) return false;
      if (endDate && departureDate > endDate) return false;
      
      // 4. Vérifier les jours de la semaine
      if (r.daysOfWeek && r.daysOfWeek.length > 0) {
        if (!r.daysOfWeek.includes(dayOfWeek)) return false;
      }
      
      // 5. Vérifier les créneaux horaires
      if (r.timeSlots && r.timeSlots.length > 0) {
        const inTimeSlot = r.timeSlots.some(slot => 
          timeOfDay >= slot.start && timeOfDay <= slot.end
        );
        if (!inTimeSlot) return false;
      }
      
      return true;
    })
    .sort((a, b) => a.priority - b.priority); // Trier par priorité
  
  // Appliquer les règles
  let finalPrice = basePrice;
  
  for (const rule of applicableRules) {
    if (rule.type === 'percentage') {
      // Réduction en pourcentage
      finalPrice = finalPrice * (1 - rule.value / 100);
    } else {
      // Réduction fixe
      finalPrice = finalPrice - rule.value;
    }
  }
  
  // S'assurer que le prix reste positif et arrondi
  return Math.max(0, Math.round(finalPrice));
}
```

**Test unitaire (optionnel mais recommandé) :**
```typescript
// Test manuel dans la console
import { calculatePriceWithRules } from './utils/pricingCalculator';

const testRules = [
  {
    id: 'promo1',
    routeId: 'route_1',
    type: 'percentage',
    value: 20,
    startDate: '2026-01-01',
    endDate: '2026-01-31',
    daysOfWeek: [0, 6], // Week-end
    status: 'active',
    priority: 1
  }
];

// Samedi 11 janvier 2026
const price = calculatePriceWithRules(
  5000, 
  'route_1', 
  '2026-01-11T14:00:00Z', 
  testRules
);
console.log(price); // Devrait afficher : 4000
```

---

### Tâche 1.3 : Appliquer les règles dans la génération de trips ⏱️ 0.5h

**Fichier :** `/contexts/DataContext.tsx`

**Ajouter l'import en haut :**
```typescript
import { calculatePriceWithRules } from '../utils/pricingCalculator';
```

**Modifier ligne 568 (dans `generateTripsFromTemplates`) :**
```typescript
// ❌ AVANT
price: route.basePrice,

// ✅ APRÈS
price: calculatePriceWithRules(
  route.basePrice,
  route.id,
  departureDate.toISOString(),
  pricingRules
),
```

**Modifier aussi ligne 407 (dans le useEffect initial) :**
```typescript
// ❌ AVANT
price: route.basePrice,

// ✅ APRÈS
price: calculatePriceWithRules(
  route.basePrice,
  route.id,
  departureDate.toISOString(),
  pricingRules
),
```

**Test de validation :**
1. Créer une règle de tarification dans `/responsable/pricing`
2. Déclencher la génération de trips (recharger l'app)
3. Vérifier dans le DataContext console que les prix sont modifiés

---

### Tâche 1.4 : Connecter PricingPage à DataContext ⏱️ 1h

**Fichier :** `/pages/responsable/PricingPage.tsx`

**⚠️ Attention :** Cette page utilise actuellement son propre state local. Il faut la refactoriser entièrement.

**Plan :**
1. Remplacer le state local `segments` par `routes` de DataContext
2. Calculer les prix actuels en appliquant les règles
3. Utiliser `addPricingRule` au lieu de modifier directement le prix

**Code complet à remplacer :**

Voir fichier détaillé dans `/PLAN_ACTION_PRICING_PAGE.md` (fichier séparé car trop long)

---

## 🔧 PHASE 2 : CORRECTIONS MAJEURES (P1) - 5 heures

> **Objectif :** Créer les fondations pour une gestion cohérente des véhicules

### Tâche 2.1 : Créer les types Vehicle et SeatLayout ⏱️ 1h

**Fichier :** `/contexts/DataContext.tsx`

**Ajouter après l'interface `Incident` (ligne 171) :**
```typescript
export interface SeatLayout {
  id: string;
  name: string; // Ex: "Standard 2+2 (45 places)"
  type: 'standard' | 'vip' | 'mini';
  totalSeats: number;
  structure: {
    rows: number;
    leftSeats: number;  // Nombre de sièges à gauche de l'allée
    rightSeats: number; // Nombre de sièges à droite de l'allée
  };
  specialSeats?: {
    seatNumber: string;
    type: 'handicap' | 'priority' | 'vip';
  }[];
}

export interface Vehicle {
  id: string;
  number: string; // Ex: "BF-1024"
  layoutId: string; // Référence à SeatLayout
  gareId: string;
  gareName: string;
  status: 'active' | 'maintenance' | 'retired';
  acquisitionDate: string;
}
```

**Ajouter les données initiales (après `initialRoutes`, ligne 297) :**
```typescript
const initialSeatLayouts: SeatLayout[] = [
  {
    id: 'layout_standard_45',
    name: 'Standard 2+2 (45 places)',
    type: 'standard',
    totalSeats: 45,
    structure: { rows: 12, leftSeats: 2, rightSeats: 2 }
  },
  {
    id: 'layout_vip_35',
    name: 'VIP 2+1 (35 places)',
    type: 'vip',
    totalSeats: 35,
    structure: { rows: 12, leftSeats: 2, rightSeats: 1 }
  },
  {
    id: 'layout_mini_30',
    name: 'Mini 2+2 (30 places)',
    type: 'mini',
    totalSeats: 30,
    structure: { rows: 8, leftSeats: 2, rightSeats: 2 }
  }
];

const initialVehicles: Vehicle[] = [
  {
    id: 'vehicle_1',
    number: 'BF-1024',
    layoutId: 'layout_standard_45',
    gareId: 'gare_1',
    gareName: 'Gare Routière de Ouagadougou',
    status: 'active',
    acquisitionDate: '2023-01-15'
  },
  {
    id: 'vehicle_2',
    number: 'BF-1025',
    layoutId: 'layout_vip_35',
    gareId: 'gare_1',
    gareName: 'Gare Routière de Ouagadougou',
    status: 'active',
    acquisitionDate: '2023-02-20'
  },
  {
    id: 'vehicle_3',
    number: 'BF-2001',
    layoutId: 'layout_standard_45',
    gareId: 'gare_2',
    gareName: 'Gare de Bobo-Dioulasso',
    status: 'active',
    acquisitionDate: '2023-03-10'
  }
];
```

**Ajouter au state (ligne 334) :**
```typescript
const [seatLayouts] = useState<SeatLayout[]>(initialSeatLayouts);
const [vehicles, setVehicles] = useState<Vehicle[]>(initialVehicles);
```

**Ajouter à l'interface `DataContextType` (ligne 192) :**
```typescript
// Seat Layouts
seatLayouts: SeatLayout[];

// Vehicles
vehicles: Vehicle[];
addVehicle: (vehicle: Omit<Vehicle, 'id'>) => void;
updateVehicle: (id: string, updates: Partial<Vehicle>) => void;
deleteVehicle: (id: string) => void;
```

**Ajouter les fonctions CRUD pour vehicles (ligne 500) :**
```typescript
const addVehicle = (vehicle: Omit<Vehicle, 'id'>) => {
  const newVehicle = { ...vehicle, id: generateId('vehicle') };
  setVehicles([...vehicles, newVehicle]);
};

const updateVehicle = (id: string, updates: Partial<Vehicle>) => {
  setVehicles(vehicles.map(v => v.id === id ? { ...v, ...updates } : v));
};

const deleteVehicle = (id: string) => {
  setVehicles(vehicles.filter(v => v.id !== id));
};
```

**Ajouter au return (ligne 890) :**
```typescript
seatLayouts,
vehicles,
addVehicle,
updateVehicle,
deleteVehicle,
```

---

### Tâche 2.2 : Modifier ScheduleTemplate pour inclure layoutId ⏱️ 0.5h

**Fichier :** `/contexts/DataContext.tsx`

**Modifier l'interface `ScheduleTemplate` (ligne 29) :**
```typescript
export interface ScheduleTemplate {
  id: string;
  routeId: string;
  departureTime: string;
  daysOfWeek: number[];
  serviceClass: 'standard' | 'vip';
  gareId: string;
  gareName: string;
  layoutId: string; // ✅ NOUVEAU
  totalSeats: number; // Gardé pour compatibilité
  status: 'active' | 'inactive';
  createdAt: string;
}
```

**Mettre à jour les données initiales (ligne 300) :**
```typescript
const initialScheduleTemplates: ScheduleTemplate[] = [
  {
    id: 'sched_1',
    routeId: 'route_1',
    departureTime: '05:30',
    daysOfWeek: [0, 1, 2, 3, 4, 5, 6],
    serviceClass: 'standard',
    gareId: 'gare_1',
    gareName: 'Gare Routière de Ouagadougou',
    layoutId: 'layout_standard_45', // ✅ NOUVEAU
    totalSeats: 45,
    status: 'active',
    createdAt: '2024-01-01T00:00:00Z'
  },
  // ... mettre à jour TOUS les templates avec layoutId
];
```

---

### Tâche 2.3 : Créer la fonction generateSeatsFromLayout ⏱️ 1.5h

**Nouveau fichier :** `/utils/seatGenerator.ts`

```typescript
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
```

---

### Tâche 2.4 : Utiliser le nouveau système dans TicketSalePage ⏱️ 2h

**Fichier :** `/pages/caissier/TicketSalePage.tsx`

**Ajouter les imports :**
```typescript
import { generateSeatsFromLayout, generateSeatGrid } from '../../utils/seatGenerator';
```

**Récupérer seatLayouts depuis DataContext :**
```typescript
const { trips, addTicket, tickets, seatLayouts } = useFilteredData();
```

**Remplacer la fonction generateSeats (ligne 62) :**
```typescript
// ❌ SUPPRIMER l'ancienne fonction generateSeats

// ✅ Récupérer le layout du trip actuel
const currentLayout = useMemo(() => {
  if (!currentTrip) return null;
  // Pour l'instant, utiliser totalSeats pour deviner le layout
  // TODO: Ajouter layoutId à Trip
  if (currentTrip.totalSeats === 45) return seatLayouts.find(l => l.id === 'layout_standard_45');
  if (currentTrip.totalSeats === 35) return seatLayouts.find(l => l.id === 'layout_vip_35');
  if (currentTrip.totalSeats === 30) return seatLayouts.find(l => l.id === 'layout_mini_30');
  return seatLayouts[0]; // Fallback
}, [currentTrip, seatLayouts]);
```

**Remplacer l'affichage de la grille (ligne 308) :**
```typescript
{/* ❌ ANCIENNE GRILLE 4×N */}
{/* <div className="grid grid-cols-4 gap-3"> */}

{/* ✅ NOUVELLE GRILLE AVEC ALLÉE */}
{currentLayout && (() => {
  const grid = generateSeatGrid(currentLayout);
  
  return (
    <div className="space-y-2">
      {grid.rows.map((row, rowIndex) => (
        <div key={rowIndex} className="flex items-center justify-center gap-6">
          {/* Côté gauche */}
          <div className="flex gap-2">
            {row.left.map((seatNumber) => {
              const isOccupied = occupiedSeats.includes(seatNumber);
              const isSelected = selectedSeats.includes(seatNumber);
              
              return (
                <button
                  key={seatNumber}
                  onClick={() => handleSeatSelect(seatNumber)}
                  disabled={isOccupied}
                  className={`
                    w-14 h-12 rounded-lg border-2 font-semibold transition-all text-sm
                    ${isOccupied
                      ? 'bg-gray-400 dark:bg-gray-500 border-gray-500 opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#f59e0b] border-[#d97706] text-white shadow-lg scale-105'
                      : 'bg-gray-200 dark:bg-gray-600 border-gray-300 hover:border-[#f59e0b] hover:scale-105'
                    }
                  `}
                >
                  {seatNumber}
                </button>
              );
            })}
          </div>
          
          {/* Allée centrale */}
          <div className="w-12 text-center text-gray-400 text-xs">
            {rowIndex === 0 ? '🚪' : ''}
          </div>
          
          {/* Côté droit */}
          <div className="flex gap-2">
            {row.right.map((seatNumber) => {
              const isOccupied = occupiedSeats.includes(seatNumber);
              const isSelected = selectedSeats.includes(seatNumber);
              
              return (
                <button
                  key={seatNumber}
                  onClick={() => handleSeatSelect(seatNumber)}
                  disabled={isOccupied}
                  className={`
                    w-14 h-12 rounded-lg border-2 font-semibold transition-all text-sm
                    ${isOccupied
                      ? 'bg-gray-400 dark:bg-gray-500 border-gray-500 opacity-50 cursor-not-allowed'
                      : isSelected
                      ? 'bg-[#f59e0b] border-[#d97706] text-white shadow-lg scale-105'
                      : 'bg-gray-200 dark:bg-gray-600 border-gray-300 hover:border-[#f59e0b] hover:scale-105'
                    }
                  `}
                >
                  {seatNumber}
                </button>
              );
            })}
          </div>
        </div>
      ))}
    </div>
  );
})()}
```

---

## 📊 PHASE 3 : AMÉLIORATIONS (P2) - 2 heures

### Tâche 3.1 : Corriger les analytics ⏱️ 1h

**Fichier :** `/contexts/DataContext.tsx` (ligne 833)

**Remplacer :**
```typescript
// ❌ AVANT
const totalOccupiedSeats = trips.reduce((sum, t) => sum + (t.totalSeats - t.availableSeats), 0);

// ✅ APRÈS : Calculer depuis les tickets réels
const validTickets = tickets.filter(t => t.status === 'valid' || t.status === 'used');
const totalOccupiedSeats = validTickets.length;
```

---

### Tâche 3.2 : Ajouter validation de sièges ⏱️ 1h

**Nouveau fichier :** `/utils/seatValidator.ts`

```typescript
import { Trip, Ticket, SeatLayout } from '../contexts/DataContext';
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
```

**Utiliser dans TicketSalePage :**
```typescript
import { validateSeatSelection } from '../../utils/seatValidator';

const handleCompletePayment = async () => {
  if (!currentTrip || !user || !currentLayout) return;
  
  // ✅ Validation avant vente
  const validation = validateSeatSelection(
    currentTrip.id,
    selectedSeats,
    currentLayout,
    tickets
  );
  
  if (!validation.valid) {
    toast.error(validation.errors.join('\n'));
    return;
  }
  
  // Continuer la vente...
  setIsPrinting(true);
  // ...
};
```

---

## ✅ CHECKLIST DE VALIDATION

### Phase 1 (P0) - Critique
- [ ] Places occupées affichent les vrais tickets vendus
- [ ] Règles de tarification appliquées dans les prix de trips
- [ ] PricingPage connectée à DataContext
- [ ] Promotion week-end fonctionne correctement

### Phase 2 (P1) - Majeur
- [ ] Types Vehicle et SeatLayout créés
- [ ] Données initiales vehicles et layouts ajoutées
- [ ] generateSeatsFromLayout créé et testé
- [ ] TicketSalePage affiche grille avec allée centrale
- [ ] Bus VIP 35 places affiche disposition 2+1

### Phase 3 (P2) - Moyen
- [ ] Analytics calculent depuis tickets réels
- [ ] Validation empêche double vente du même siège
- [ ] Messages d'erreur clairs pour l'utilisateur

---

## 🧪 TESTS MANUELS RECOMMANDÉS

### Test 1 : Places occupées
1. Vendre un billet siège E3 pour un trajet
2. Recharger la page de vente
3. Sélectionner le même trajet
4. ✅ Le siège E3 doit être gris et non cliquable

### Test 2 : Tarification dynamique
1. Créer une règle -20% pour le week-end sur Ouaga→Bobo
2. Générer les trips (recharger l'app)
3. Regarder les trips du samedi/dimanche
4. ✅ Prix doit être 4000 au lieu de 5000

### Test 3 : Grille de sièges VIP
1. Sélectionner un trajet VIP (35 places)
2. Ouvrir la grille de sièges
3. ✅ Doit afficher 12 rangées × 3 sièges (2 + allée + 1)
4. ✅ Allée visible au milieu

### Test 4 : Validation double vente
1. Caissier 1 sélectionne siège A1
2. Caissier 2 sélectionne siège A1 (simultanément)
3. Caissier 1 valide → ✅ OK
4. Caissier 2 valide → ❌ Erreur "Siège déjà vendu"

---

## 📝 NOTES D'IMPLÉMENTATION

### Ordre d'exécution recommandé
1. **Commencer par Phase 1.2** (calcul prix) car indépendant
2. Puis **Phase 1.1** (places occupées) car simple
3. Puis **Phase 1.3** (appliquer prix)
4. Enfin **Phase 1.4** (PricingPage) car plus complexe

### Points d'attention
⚠️ **Trip.layoutId manquant** : Pour l'instant, on devine le layout depuis `totalSeats`. À terme, ajouter `layoutId` à l'interface `Trip`.

⚠️ **Compatibilité** : Garder `totalSeats` pour compatibilité arrière, mais le calculer depuis `layout.totalSeats`.

⚠️ **Performance** : La validation de sièges itère sur tous les tickets. Si > 10000 tickets, envisager un index.

---

## 🎯 OBJECTIFS DE QUALITÉ

**Après Phase 1 :**
- ✅ Application utilisable pour démo client
- ✅ Pas de bugs critiques
- ✅ Tarification fonctionne

**Après Phase 2 :**
- ✅ Gestion cohérente des véhicules
- ✅ Grille de sièges réaliste
- ✅ Prêt pour MVP

**Après Phase 3 :**
- ✅ Analytics fiables
- ✅ Sécurité renforcée
- ✅ Prêt pour production

---

**Document créé le 2026-01-02**  
**Statut :** ✅ Plan d'action complet et actionnable
