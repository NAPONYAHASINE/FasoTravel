# 🔍 AUDIT LOGIQUE MÉTIER PROFOND - FASOTRAVEL DASHBOARD

**Date :** 2026-01-02  
**Auditeur :** Assistant IA  
**Contexte :** Audit approfondi de la cohérence de la logique métier suite à la demande spécifique concernant la gestion des places et la structure des véhicules

---

## 📋 RÉSUMÉ EXÉCUTIF

**Verdict :** ⚠️ **LOGIQUE MÉTIER INCOMPLÈTE - CORRECTIONS CRITIQUES NÉCESSAIRES**

L'application présente des **incohérences majeures** dans la gestion des places, la tarification dynamique et la structure des véhicules. Bien que l'architecture soit solide, plusieurs mécanismes critiques sont soit **absents**, soit **déconnectés**, soit **mockés**.

**Score de cohérence : 4.5/10** ❌

---

## 🔴 PROBLÈMES CRITIQUES IDENTIFIÉS

### 1. 🪑 GESTION DES PLACES - STRUCTURE HARDCODÉE

**Fichier :** `/pages/caissier/TicketSalePage.tsx` (lignes 62-74)

**Problème :**
```typescript
// ❌ PROBLÈME : Structure de sièges HARDCODÉE
const generateSeats = (totalSeats: number) => {
  const seats = [];
  const seatsPerRow = 4; // ⚠️ TOUJOURS 4 places par rangée !
  const rows = Math.ceil(totalSeats / seatsPerRow);
  
  for (let row = 0; row < rows; row++) {
    const rowLetter = String.fromCharCode(65 + row); // A, B, C...
    for (let col = 1; col <= seatsPerRow && seats.length < totalSeats; col++) {
      seats.push(`${rowLetter}${col}`);
    }
  }
  return seats;
};
```

**Conséquences :**
- ❌ Un bus VIP de 35 places → Grille 4×9 (A1-A4, B1-B4... I1-I3)
- ❌ Un bus standard de 45 places → Grille 4×12 (A1-A4... L1-L1)
- ❌ Impossible d'avoir une disposition 2+2 (allée centrale) ou 2+3
- ❌ Aucune cohérence avec la vraie structure du véhicule
- ❌ Pas de zones spéciales (handicapés, prioritaires, etc.)

**Impact utilisateur :**
Le responsable de gare configure `totalSeats = 35` dans un `ScheduleTemplate`, mais le caissier voit une grille incohérente qui ne correspond pas à la vraie structure du bus.

---

### 2. 👥 PLACES OCCUPÉES - DONNÉES MOCKÉES

**Fichier :** `/pages/caissier/TicketSalePage.tsx` (lignes 77-83)

**Problème :**
```typescript
// ❌ PROBLÈME : Places occupées MOCKÉES, pas liées aux tickets réels
const occupiedSeats = useMemo(() => {
  if (!currentTrip) return [];
  const occupiedCount = currentTrip.totalSeats - currentTrip.availableSeats;
  // ⚠️ "Generate some occupied seats (in real app, get from actual tickets)"
  const totalSeats = generateSeats(currentTrip.totalSeats);
  return totalSeats.slice(0, occupiedCount); // ❌ Prend juste les N premiers !
}, [currentTrip]);
```

**Conséquences :**
- ❌ Si 10 places sont vendues, l'app affiche A1-A4, B1-B4, C1-C2 comme occupés
- ❌ MAIS les tickets vendus ont peut-être les sièges E3, F1, G2 !
- ❌ **Risque majeur** : Vendre 2 fois le même siège
- ❌ Pas de synchronisation entre UI et données

**Solution manquante :**
```typescript
// ✅ SOLUTION NÉCESSAIRE
const occupiedSeats = useMemo(() => {
  if (!currentTrip) return [];
  // Récupérer les VRAIS sièges vendus depuis les tickets
  return tickets
    .filter(t => t.tripId === currentTrip.id && t.status === 'valid')
    .map(t => t.seatNumber);
}, [currentTrip, tickets]);
```

---

### 3. 🚌 MODÈLE VÉHICULE ABSENT

**Fichier :** `/contexts/DataContext.tsx`

**Problème :**
Aucun type `Vehicle` dans le DataContext global ! Il existe seulement dans `/pages/manager/LocalMapPage.tsx` en tant que type local déconnecté.

**Manquants :**
```typescript
// ❌ ABSENT du DataContext
export interface Vehicle {
  id: string;
  number: string; // Ex: "BF-1024"
  type: 'standard' | 'vip' | 'mini';
  totalSeats: number;
  layoutId: string; // Référence à SeatLayout
  status: 'active' | 'maintenance' | 'retired';
  gareId: string;
  gareName: string;
}

// ❌ ABSENT : Structure de disposition
export interface SeatLayout {
  id: string;
  name: string; // "Standard 2+2", "VIP 2+1", "Mini 3+3"
  totalSeats: number;
  rows: number;
  seatsPerRow: number[];
  aislePosition?: number; // Position de l'allée
  specialSeats?: {
    seatNumber: string;
    type: 'handicap' | 'priority' | 'vip';
  }[];
}
```

**Conséquences :**
- ❌ Les `Trip` ont un `busNumber` généré aléatoirement (ex: `BF-1024`) qui ne correspond à aucun véhicule réel
- ❌ Impossible de savoir combien de véhicules existent
- ❌ Pas de gestion de maintenance ou d'indisponibilité
- ❌ Pas de liaison entre un trajet et un véhicule physique

---

### 4. 💰 TARIFICATION DYNAMIQUE - NON APPLIQUÉE

**Fichiers :**
- `/contexts/DataContext.tsx` : Définit `PricingRule` et CRUD
- `/pages/responsable/PricingPage.tsx` : Totalement déconnecté !

**Problème 1 : PricingPage déconnectée**
```typescript
// ❌ PROBLÈME : PricingPage.tsx utilise son propre state local !
const [segments, setSegments] = useState<PriceSegment[]>([...]); // ⚠️ State local

// ✅ DEVRAIT utiliser DataContext
const { routes, pricingRules, addPricingRule } = useFilteredData();
```

**Problème 2 : Règles jamais appliquées**
```typescript
// ❌ Dans DataContext, ligne 568 :
price: route.basePrice, // ⚠️ TOUJOURS le prix de base !

// ✅ DEVRAIT calculer dynamiquement
price: calculatePriceWithRules(route.basePrice, routeId, departureTime, pricingRules)
```

**Fonction manquante :**
```typescript
// ❌ ABSENT : Aucune fonction pour appliquer les règles
function calculatePriceWithRules(
  basePrice: number,
  routeId: string,
  departureTime: string,
  rules: PricingRule[]
): number {
  const applicableRules = rules
    .filter(r => r.routeId === routeId && r.status === 'active')
    .filter(r => {
      const date = new Date(departureTime);
      const startDate = new Date(r.startDate);
      const endDate = r.endDate ? new Date(r.endDate) : null;
      return date >= startDate && (!endDate || date <= endDate);
    })
    .filter(r => {
      // Vérifier daysOfWeek et timeSlots
      return true; // Logique à implémenter
    })
    .sort((a, b) => a.priority - b.priority);
  
  let finalPrice = basePrice;
  for (const rule of applicableRules) {
    if (rule.type === 'percentage') {
      finalPrice = finalPrice * (1 - rule.value / 100);
    } else {
      finalPrice = finalPrice - rule.value;
    }
  }
  return Math.round(finalPrice);
}
```

**Conséquences :**
- ❌ Les règles de tarification existent mais ne servent à RIEN
- ❌ Impossible d'avoir des prix week-end, heures creuses, promotions
- ❌ Le responsable peut créer des règles qui ne s'appliquent jamais
- ❌ Le business model de tarification dynamique est inopérant

---

### 5. 🔄 SYNCHRONISATION TICKETS ↔ TRIPS

**Fichier :** `/contexts/DataContext.tsx` (lignes 680-683)

**Bon point :** ✅ La synchronisation existe !
```typescript
const addTicket = (ticket: Omit<Ticket, 'id'>) => {
  // ...
  const trip = trips.find(t => t.id === ticket.tripId);
  if (trip) {
    updateTrip(trip.id, { availableSeats: trip.availableSeats - 1 }); // ✅ OK
  }
  // ...
};
```

**Problèmes restants :**
- ⚠️ Fonctionne uniquement pour `addTicket`, mais si un ticket est créé autrement ?
- ⚠️ Pas de validation : que se passe-t-il si `availableSeats` est déjà à 0 ?
- ⚠️ Pas de vérification de double réservation du même siège

---

### 6. 📊 ANALYTICS - CALCULS APPROXIMATIFS

**Fichier :** `/contexts/DataContext.tsx` (lignes 835-837)

```typescript
// ⚠️ Calcul basé sur availableSeats, pas sur tickets réels
const totalOccupiedSeats = trips.reduce((sum, t) => sum + (t.totalSeats - t.availableSeats), 0);
const totalSeats = trips.reduce((sum, t) => sum + t.totalSeats, 0);
const averageOccupancy = totalSeats > 0 ? (totalOccupiedSeats / totalSeats) * 100 : 0;
```

**Problème :**
Si `availableSeats` n'est pas parfaitement synchronisé avec les tickets vendus, les analytics sont faux.

**Solution :**
```typescript
// ✅ Calculer directement depuis les tickets
const validTickets = tickets.filter(t => t.status === 'valid' || t.status === 'used');
const totalOccupiedSeats = validTickets.length;
```

---

### 7. 🎟️ VALIDATION DE SIÈGES - ABSENTE

**Fichier :** `/pages/caissier/TicketSalePage.tsx`

**Problème :**
Aucune validation côté logique métier pour :
- ❌ Vérifier que le siège existe dans le véhicule
- ❌ Empêcher la vente d'un siège déjà vendu (autre caissier, vente online simultanée)
- ❌ Valider le format du numéro de siège (A1, B2, etc.)

**Solution nécessaire :**
```typescript
function validateSeatSelection(
  tripId: string,
  seatNumbers: string[],
  trip: Trip,
  tickets: Ticket[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 1. Vérifier que les sièges existent
  const validSeats = generateSeats(trip.totalSeats);
  const invalidSeats = seatNumbers.filter(s => !validSeats.includes(s));
  if (invalidSeats.length > 0) {
    errors.push(`Sièges invalides: ${invalidSeats.join(', ')}`);
  }
  
  // 2. Vérifier qu'ils ne sont pas déjà vendus
  const soldSeats = tickets
    .filter(t => t.tripId === tripId && t.status === 'valid')
    .map(t => t.seatNumber);
  const alreadySold = seatNumbers.filter(s => soldSeats.includes(s));
  if (alreadySold.length > 0) {
    errors.push(`Sièges déjà vendus: ${alreadySold.join(', ')}`);
  }
  
  return { valid: errors.length === 0, errors };
}
```

---

### 8. 🗓️ GÉNÉRATION DE VOYAGES - INCOHÉRENCE

**Fichier :** `/contexts/DataContext.tsx` (lignes 515-577)

**Problème :**
```typescript
// Ligne 404 : génère busNumber aléatoire
busNumber: `BF-${1000 + (index * 100) + day}`,

// Ligne 616 : génère des sièges avec formule
seatNumber: `${String.fromCharCode(65 + Math.floor(i / 4))}${(i % 4) + 1}`,
```

**Conséquences :**
- Les numéros de bus ne correspondent à rien
- Les sièges générés utilisent une formule 4 par rangée, mais la vente utilise `totalSeats` sans structure

---

## 🟡 PROBLÈMES MOYENS

### 9. 📦 ABSENCE DE COUCHE SERVICE

**Impact :** Code métier mélangé avec le state management

**Recommandation :**
Créer `/services/` :
- `vehicleService.ts` : Gestion des véhicules
- `seatService.ts` : Gestion des sièges et layouts
- `pricingService.ts` : Calcul de prix dynamique
- `ticketService.ts` : Validation et création de billets

---

### 10. 🔍 MANQUE DE TYPES POUR STRUCTURES

**Manquants :**
```typescript
type SeatStatus = 'available' | 'selected' | 'occupied' | 'reserved' | 'blocked';

interface SeatInfo {
  number: string;
  status: SeatStatus;
  row: number;
  column: number;
  isAisle: boolean;
  type?: 'standard' | 'priority' | 'handicap';
}
```

---

## 📊 IMPACT GLOBAL

| Fonctionnalité | État actuel | Impact | Priorité |
|----------------|-------------|--------|----------|
| **Sélection de sièges** | ❌ Hardcodé 4×N | Critique | 🔴 P0 |
| **Places occupées** | ❌ Mocké | Critique | 🔴 P0 |
| **Tarification dynamique** | ❌ Non appliquée | Critique | 🔴 P0 |
| **Modèle véhicule** | ❌ Absent | Majeur | 🟠 P1 |
| **Validation sièges** | ❌ Absente | Majeur | 🟠 P1 |
| **Structure configurable** | ❌ Absente | Majeur | 🟠 P1 |
| **Analytics précis** | ⚠️ Approximatif | Moyen | 🟡 P2 |
| **PricingPage connectée** | ❌ Déconnectée | Moyen | 🟡 P2 |

---

## ✅ PLAN DE CORRECTION RECOMMANDÉ

### Phase 1 : Fondations (P0 - Critique)

#### 1.1. Créer le modèle Vehicle et SeatLayout

**Fichier :** `/contexts/DataContext.tsx`

```typescript
export interface SeatLayout {
  id: string;
  name: string; // "Standard 2+2 (45 places)"
  type: 'standard' | 'vip' | 'mini';
  totalSeats: number;
  structure: {
    rows: number;
    leftSeats: number;  // Nombre de sièges à gauche de l'allée
    rightSeats: number; // Nombre de sièges à droite de l'allée
  };
  specialSeats?: {
    seatNumber: string;
    type: 'handicap' | 'priority';
  }[];
}

export interface Vehicle {
  id: string;
  number: string; // "BF-1024"
  layoutId: string;
  gareId: string;
  gareName: string;
  status: 'active' | 'maintenance' | 'retired';
  acquisitionDate: string;
}

// Layouts prédéfinis
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
```

#### 1.2. Modifier ScheduleTemplate pour lier un layout

```typescript
export interface ScheduleTemplate {
  // ... existant
  layoutId: string; // ✅ NOUVEAU : au lieu de juste totalSeats
  totalSeats: number; // Gardé pour compatibilité, calculé depuis layout
}
```

#### 1.3. Créer generateSeatsFromLayout()

**Fichier :** `/utils/seatGenerator.ts`

```typescript
import { SeatLayout } from '../contexts/DataContext';

export function generateSeatsFromLayout(layout: SeatLayout): string[] {
  const seats: string[] = [];
  const { rows, leftSeats, rightSeats } = layout.structure;
  
  for (let row = 0; row < rows; row++) {
    const rowLetter = String.fromCharCode(65 + row); // A, B, C...
    
    // Côté gauche
    for (let col = 1; col <= leftSeats; col++) {
      seats.push(`${rowLetter}${col}`);
    }
    
    // Côté droit
    for (let col = 1; col <= rightSeats; col++) {
      seats.push(`${rowLetter}${col + leftSeats}`);
    }
  }
  
  return seats.slice(0, layout.totalSeats); // Limite au nombre total
}

export function getSeatPosition(seatNumber: string, layout: SeatLayout): {
  row: number;
  side: 'left' | 'right';
  column: number;
  isAisle: boolean;
} {
  const rowLetter = seatNumber[0];
  const col = parseInt(seatNumber.slice(1));
  const row = rowLetter.charCodeAt(0) - 65;
  
  const { leftSeats } = layout.structure;
  const side = col <= leftSeats ? 'left' : 'right';
  const column = side === 'left' ? col : col - leftSeats;
  const isAisle = (side === 'left' && col === leftSeats) || (side === 'right' && column === 1);
  
  return { row, side, column, isAisle };
}
```

#### 1.4. Corriger la récupération des sièges occupés

**Fichier :** `/pages/caissier/TicketSalePage.tsx`

```typescript
// ✅ CORRECTION
const occupiedSeats = useMemo(() => {
  if (!currentTrip) return [];
  
  // Récupérer les VRAIS sièges depuis les tickets
  return tickets
    .filter(t => 
      t.tripId === currentTrip.id && 
      (t.status === 'valid' || t.status === 'used')
    )
    .map(t => t.seatNumber);
}, [currentTrip, tickets]);
```

#### 1.5. Implémenter la fonction de calcul de prix

**Fichier :** `/utils/pricingCalculator.ts`

```typescript
import { PricingRule } from '../contexts/DataContext';

export function calculatePriceWithRules(
  basePrice: number,
  routeId: string,
  departureTime: string,
  rules: PricingRule[]
): number {
  const departureDate = new Date(departureTime);
  const dayOfWeek = departureDate.getDay();
  const timeOfDay = departureDate.toTimeString().slice(0, 5); // HH:mm
  
  const applicableRules = rules
    .filter(r => r.routeId === routeId && r.status === 'active')
    .filter(r => {
      // Vérifier la période
      const startDate = new Date(r.startDate);
      const endDate = r.endDate ? new Date(r.endDate) : null;
      return departureDate >= startDate && (!endDate || departureDate <= endDate);
    })
    .filter(r => {
      // Vérifier les jours de la semaine
      if (!r.daysOfWeek || r.daysOfWeek.length === 0) return true;
      return r.daysOfWeek.includes(dayOfWeek);
    })
    .filter(r => {
      // Vérifier les créneaux horaires
      if (!r.timeSlots || r.timeSlots.length === 0) return true;
      return r.timeSlots.some(slot => timeOfDay >= slot.start && timeOfDay <= slot.end);
    })
    .sort((a, b) => a.priority - b.priority);
  
  let finalPrice = basePrice;
  
  for (const rule of applicableRules) {
    if (rule.type === 'percentage') {
      finalPrice = finalPrice * (1 - rule.value / 100);
    } else {
      finalPrice = finalPrice - rule.value;
    }
  }
  
  return Math.max(0, Math.round(finalPrice));
}
```

#### 1.6. Appliquer les règles dans la génération de trips

**Fichier :** `/contexts/DataContext.tsx`

```typescript
import { calculatePriceWithRules } from '../utils/pricingCalculator';

// Dans generateTripsFromTemplates, ligne 568
price: calculatePriceWithRules(
  route.basePrice,
  route.id,
  departureDate.toISOString(),
  pricingRules
),
```

#### 1.7. Connecter PricingPage à DataContext

**Fichier :** `/pages/responsable/PricingPage.tsx`

```typescript
// ✅ CORRECTION : Utiliser DataContext au lieu de state local
import { useFilteredData } from '../../hooks/useFilteredData';

export default function PricingPage() {
  const { 
    routes, 
    pricingRules, 
    addPricingRule, 
    updatePricingRule, 
    deletePricingRule 
  } = useFilteredData();
  
  // Transformer routes en segments pour l'affichage
  const segments = routes.map(route => {
    // Calculer prix actuel avec règles
    const currentPrice = calculatePriceWithRules(
      route.basePrice,
      route.id,
      new Date().toISOString(),
      pricingRules
    );
    
    return {
      id: route.id,
      route: `${route.departure} - ${route.arrival}`,
      from: route.departure,
      to: route.arrival,
      currentPrice: currentPrice,
      basePrice: route.basePrice,
      // ...
    };
  });
  
  // ...
}
```

---

### Phase 2 : Validation et sécurité (P1 - Majeur)

#### 2.1. Ajouter validation de sièges

**Fichier :** `/utils/seatValidator.ts`

```typescript
export function validateSeatSelection(
  tripId: string,
  seatNumbers: string[],
  layout: SeatLayout,
  tickets: Ticket[]
): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  // 1. Vérifier que les sièges existent dans le layout
  const validSeats = generateSeatsFromLayout(layout);
  const invalidSeats = seatNumbers.filter(s => !validSeats.includes(s));
  if (invalidSeats.length > 0) {
    errors.push(`Sièges invalides: ${invalidSeats.join(', ')}`);
  }
  
  // 2. Vérifier qu'ils ne sont pas déjà vendus
  const soldSeats = tickets
    .filter(t => t.tripId === tripId && (t.status === 'valid' || t.status === 'used'))
    .map(t => t.seatNumber);
  const alreadySold = seatNumbers.filter(s => soldSeats.includes(s));
  if (alreadySold.length > 0) {
    errors.push(`Sièges déjà vendus: ${alreadySold.join(', ')}`);
  }
  
  return { valid: errors.length === 0, errors };
}
```

#### 2.2. Utiliser la validation dans TicketSalePage

```typescript
const handleCompletePayment = async () => {
  if (!currentTrip || !user) return;
  
  // ✅ Validation avant vente
  const layout = seatLayouts.find(l => l.id === currentTrip.layoutId);
  if (!layout) {
    toast.error('Configuration de véhicule invalide');
    return;
  }
  
  const validation = validateSeatSelection(
    currentTrip.id,
    selectedSeats,
    layout,
    tickets
  );
  
  if (!validation.valid) {
    toast.error(validation.errors.join('\n'));
    return;
  }
  
  // Continuer la vente...
};
```

---

### Phase 3 : Amélioration analytics (P2 - Moyen)

#### 3.1. Corriger le calcul d'occupation

```typescript
const getAnalytics = () => {
  // ✅ Calculer depuis les tickets réels
  const validTickets = tickets.filter(t => 
    t.status === 'valid' || t.status === 'used'
  );
  
  const totalOccupiedSeats = validTickets.length;
  const totalSeats = trips.reduce((sum, t) => sum + t.totalSeats, 0);
  const averageOccupancy = totalSeats > 0 ? (totalOccupiedSeats / totalSeats) * 100 : 0;
  
  // ...
};
```

---

## 📈 ESTIMATION DES CORRECTIONS

| Phase | Tâches | Temps estimé | Complexité |
|-------|--------|--------------|------------|
| **Phase 1 (P0)** | 7 tâches | 6-8 heures | Élevée |
| **Phase 2 (P1)** | 2 tâches | 2-3 heures | Moyenne |
| **Phase 3 (P2)** | 1 tâche | 1 heure | Faible |
| **TOTAL** | 10 tâches | **9-12 heures** | - |

---

## 🎯 PRIORISATION

**À implémenter IMMÉDIATEMENT (avant démo) :**
1. ✅ Correction places occupées (1h)
2. ✅ Application des règles de tarification (2h)
3. ✅ Connecter PricingPage à DataContext (1h)

**Avant production :**
4. ✅ Modèle Vehicle et SeatLayout (3h)
5. ✅ Validation de sièges (2h)

**Améliorations continues :**
6. ✅ Structure configurable de sièges (3h)
7. ✅ Analytics précis (1h)

---

## 📝 CONCLUSION

Votre application a une **excellente architecture** mais souffre de **lacunes critiques dans la logique métier**. Les problèmes identifiés sont :

### ❌ Critiques (bloquants pour production) :
1. Places occupées mockées → Risque de double vente
2. Tarification dynamique non appliquée → Business model inopérant
3. Structure de sièges hardcodée → UX incohérente

### ⚠️ Majeurs (correction recommandée) :
4. Absence de modèle véhicule → Données incomplètes
5. PricingPage déconnectée → Confusion utilisateur

### 🟡 Moyens (amélioration continue) :
6. Analytics approximatifs → Statistiques imprécises

**Recommandation finale :** Implémenter au minimum les 3 corrections critiques avant toute démo client. Les corrections sont techniquement simples mais nécessitent une refonte de plusieurs fichiers interconnectés.

---

**Document généré le 2026-01-02**  
**Statut :** ✅ Complet et actionnable
