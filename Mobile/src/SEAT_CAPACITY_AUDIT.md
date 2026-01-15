# 🎫 Audit Complet - Capacité des Places | Seat Capacity Audit

**Statut**: ✅ **COMPLÉTÉ - Tous les mocks et modèles sont maintenant cohérents**

## 📋 Résumé Exécutif

Cette session a identifié et corrigé une **incohérence critique** dans la modélisation de la capacité des trajets :

### ❌ Problème Identifié
Les mocks `TRIPS` avaient une **capacité incorrecte** :
- `trip.available_seats` ne correspondait PAS au minimum des segments
- Exemple: TRIP_001 affichait 45 places, alors que réellement min(12, 18) = 12 places

### ✅ Solution Appliquée
1. **Recalculé tous les `available_seats`** sur la base du minimum des segments
2. **Créé des fonctions de validation** avec JSDoc expliquant la règle
3. **Ajouté des vérifications automatiques** au démarrage

---

## 🔄 La Règle Critique

### Concept
Un **trajet multi-segments** ne peut avoir plus de places disponibles que le segment le plus constraint.

```
Exemple Concret:
Trip: Ouagadougou → Bobo-Dioulasso (365 km)

Segment 1: Ouaga → Koudougou (95 km)
  - Total de sièges: 45
  - Places occupées: 33
  - Available: 12 ✅

Segment 2: Koudougou → Bobo (275 km)  
  - Total de sièges: 45
  - Places occupées: 27
  - Available: 18 ✅

RÉSULTAT: trip.available_seats = MIN(12, 18) = 12 places
```

### Raison
Seuls **12 passagers** peuvent réserver ce trajet complet car le premier segment ne peut en accueillir que 12. Un 13e passager ne pourrait embarquer qu'à Koudougou (pas à Ouaga).

### Formule
```typescript
trip.available_seats = Math.min(...trip.segments.map(s => s.available_seats))
```

---

## 📊 Corrections Appliquées aux Mocks

### Récapitulatif des changements

| Trip ID | Ancienne Valeur | Nouvelle Valeur | Segments | Raison |
|---------|-----------------|-----------------|----------|--------|
| TRIP_001 | **45** ❌ | **12** ✅ | min(12, 18) | 2 segments: Ouaga→Kou, Kou→Bobo |
| TRIP_002 | **30** ❌ | **8** ✅ | min(8) | 1 segment direct |
| TRIP_002B | **35** ❌ | **22** ✅ | min(22) | 1 segment direct |
| TRIP_003 | **45** ❌ | **14** ✅ | min(16, 14) | 2 segments: Bobo→Kou, Kou→Ouaga |
| TRIP_004 | **45** ❌ | **20** ✅ | min(20) | 1 segment direct |
| TRIP_005 | **30** ❌ | **10** ✅ | min(10) | 1 segment direct |
| TRIP_006 | **35** ❌ | **15** ✅ | min(15) | 1 segment direct |

### Impact
- ✅ **7 trajets corrigés** (100% des mocks TRIPS)
- ✅ **Disponibilité réelle maintenant affichée**
- ✅ **Prévention de surbooking**

---

## 🛠️ Outils de Validation Créés

### 1. Fonction: `getAvailableSeatsForTrip(trip)`
```typescript
export function getAvailableSeatsForTrip(trip: { segments: { available_seats: number }[] }): number {
  if (!trip.segments || trip.segments.length === 0) return 0;
  return Math.min(...trip.segments.map(s => s.available_seats));
}
```
- ✅ Calcule le minimum correctement
- ✅ Gère les segments vides

### 2. Fonction: `validateTripCapacity(trip)`
```typescript
export function validateTripCapacity(trip: Trip): boolean {
  const calculatedMin = getAvailableSeatsForTrip(trip);
  const declared = trip.available_seats;
  
  if (calculatedMin !== declared) {
    console.error(`❌ INCOHÉRENCE CAPACITÉ: Trip ${trip.trip_id}...`);
    return false;
  }
  return true;
}
```
- ✅ Détecte les incohérences
- ✅ Affiche des erreurs détaillées

### 3. Fonction: `validateAllTrips()`
```typescript
export function validateAllTrips(): void {
  console.group('🔍 Validation de la capacité des trajets');
  let validCount = 0, invalidCount = 0;
  
  TRIPS.forEach(trip => {
    if (validateTripCapacity(trip)) validCount++;
    else invalidCount++;
  });
  
  console.log(`✅ ${validCount} trajets valides`);
  if (invalidCount > 0) console.warn(`⚠️ ${invalidCount} inconsistencies`);
  console.groupEnd();
}
```
- ✅ Vérifie tous les mocks au démarrage
- ✅ Affiche un rapport résumé

### 4. Exécution automatique
```typescript
if (typeof window !== 'undefined') {
  if (localStorage?.getItem('validateTripsOnLoad') !== 'false') {
    setTimeout(() => validateAllTrips(), 0);
  }
}
```
- ✅ Validation au chargement du module
- ✅ Peut être désactivée via localStorage

---

## 🏗️ Architecture Impactée

### Composants utilisant la capacité

#### ✅ `TripCard.tsx`
```typescript
const minAvailableSeats = Math.min(...trip.segments.map(s => s.available_seats));
```
- Affiche correctement le minimum
- Montre la disponibilité par segment si multi-segment
- Affiche une alerte si < 5 places

#### ✅ `TripDetailPage.tsx`
```typescript
const minAvailableSeats = Math.min(...trip.segments.map(s => s.available_seats));
```
- Calcul du minimum correct
- Affichage par segment avec warning

#### ✅ `SeatSelectionPage.tsx`
- Utilise les seats depuis `useSeats()` hook
- Sièges occupés inclus dans le statut
- TTL timer visible pour les sièges en HOLD

#### ✅ `SearchResultsPage.tsx`
- Affiche les TripCards (qui calculent min)
- Tri par prix, heure, durée
- Filtrage optionnel par opérateur

---

## 📝 Interfaces de Données

### Trip
```typescript
interface Trip {
  trip_id: string;
  operator_id: string;
  // ...
  available_seats: number;  // = Math.min(...segments.available_seats)
  total_seats: number;      // Capacité totale du véhicule
  segments: Segment[];      // Chacun a available_seats et total_seats
  // ...
}
```

### Segment
```typescript
interface Segment {
  segment_id: string;
  trip_id: string;
  // ... route info ...
  available_seats: number;  // Places dispo sur CE segment
  total_seats: number;      // Capacité sur CE segment
  // ...
}
```

---

## 🧪 Scénarios de Test

### Scénario 1: Aller simple (Ouaga → Bobo)
- Trip: TRIP_001
- Expected: 12 places disponibles
- Raison: Segment limitant = 12
- ✅ **VALIDÉ**

### Scénario 2: Trajet direct (Ouaga → Bobo)
- Trip: TRIP_002 (Scoot)
- Expected: 8 places disponibles
- Raison: Segment unique = 8
- ✅ **VALIDÉ**

### Scénario 3: Retour multi-segment
- Trip: TRIP_003
- Expected: 14 places disponibles
- Raison: min(16, 14) = 14
- ✅ **VALIDÉ**

---

## 🚀 Prochaines Étapes (Future)

1. **Backend Integration**
   - Backend doit calculer `trip.available_seats = min(segments)`
   - API doit valider à chaque mise à jour

2. **Filtrage Avancé**
   - Permettre filtrage par capacité minimale
   - Afficher "Places limitées" si < 5 places

3. **Real-time Updates**
   - WebSocket pour mises à jour de capacité
   - Cache invalidation quand seats changent

4. **Analytics**
   - Tracker les trajets full (0 places)
   - Analyser la demande vs capacité

---

## 📚 Documentation Créée

### Fichiers Modifiés
- `src/data/models.ts`: Ajout de 2 fonctions + validation + JSDoc

### Fonctions Exportées
```typescript
export function getAvailableSeatsForTrip(trip: Trip): number
export function validateTripCapacity(trip: Trip): boolean
export function validateAllTrips(): void
```

### Constantes
```typescript
export const TRIPS: Trip[]  // 7 trajets, tous cohérents ✅
export const SEAT_MAP_CONFIG // Config plan par défaut
export const MOCK_SEAT_STATUSES // Statuts sièges mock
```

---

## ✅ Checklist de Vérification

- [x] Identifier la règle (min des segments)
- [x] Corriger les 7 mocks TRIPS
- [x] Créer fonctions de validation
- [x] Ajouter JSDoc avec formule et exemples
- [x] Vérifier TripCard/TripDetailPage calculs
- [x] Ajouter validation auto au démarrage
- [x] Vérifier aucun TypeScript error
- [x] Documenter les changements

---

## 📞 Contact / Questions

Pour modifier les règles de validation ou comprendre mieux:
1. Voir JSDoc complet dans `src/data/models.ts` lignes 18-48
2. Vérifier les tests console au démarrage (F12 Console)
3. Consulter `TripCard.tsx` line 43 pour le calcul UI

**État**: ✅ **PROD-READY** - Tous les mocks sont cohérents et prêts
