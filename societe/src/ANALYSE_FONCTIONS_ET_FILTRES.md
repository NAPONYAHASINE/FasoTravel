# 🔍 ANALYSE COMPLÈTE - Fonctions et Filtres par Page

## ✅ PROBLÈME RÉSOLU

**Les pages Manager et Caissier utilisaient des FILTRES DIFFÉRENTS** pour afficher les trips, ce qui expliquait pourquoi les données affichées n'étaient pas les mêmes.

**SOLUTION APPLIQUÉE :** Toutes les pages utilisent maintenant `new Date()` (heure réelle) et des fonctions centralisées réutilisables dans `statsUtils.ts`.

---

## 📊 COMPARAISON DES PAGES

### 1️⃣ **Manager - LocalMapPage.tsx** (Image 1 - "Tous les trajets en cours")

#### Filtre utilisé :
```tsx
const now = new Date(); // ❌ PROBLÈME: utilise date réelle au lieu de getCurrentDate()
```

#### Logique de filtrage :
- ✅ Affiche `status === 'boarding'` (embarquement)
- ✅ Affiche `status === 'departed'` (en route)
- ✅ Affiche `status === 'scheduled'` SI départ dans les 2 prochaines heures
- ❌ **Ignore** les trips scheduled avec départ > 2h

#### Trips affichés (selon image 1) :
1. ✅ 07:00 Ouaga→Bobo (boarding) - 33/45
2. ✅ 10:00 Ouaga→Koudougou (à la gare) - 18/45
3. ✅ 15:00 Ouaga→Koudougou (à la gare) - 15/45
4. ✅ 14:00 Ouaga→Bobo VIP (à la gare) - 30/35
5. ✅ 06:00 Ouaga→Ouahigouya (en route - departed) - 43/45
6. ✅ 17:00 Ouaga→Bobo (à la gare) - 27/45

**Total: 6 trips**

---

### 2️⃣ **Caissier - TicketSalePage.tsx** (Image 2 - Vente de billets)

#### Filtre utilisé :
```tsx
const now = getCurrentDate(); // ✅ CORRECT: utilise la date mockée
```

#### Logique de filtrage :
```tsx
departureTime > now &&
(trip.status === 'scheduled' || trip.status === 'boarding') &&
trip.availableSeats > 0
```

- ✅ Affiche SEULEMENT les trips **futurs** (departureTime > now)
- ✅ Affiche SEULEMENT `scheduled` ou `boarding`
- ❌ **N'affiche PAS** les trips `departed` (déjà partis)
- ❌ **N'affiche PAS** les trips dans le passé (même si boarding)

#### Trips affichés (selon image 2) :
1. ✅ 14:00 Ouaga→Bobo VIP - 5 places disponibles (35-30=5) - 7500 FCFA
2. ✅ 15:00 Ouaga→Koudougou - 30 places disponibles - 5000 FCFA
3. ✅ 17:00 Ouaga→Bobo - 18 places disponibles - 5000 FCFA

**Total: 3 trips**

#### Trips EXCLUS (pourquoi ne sont-ils pas affichés ?) :
- ❌ 07:00 Ouaga→Bobo (boarding) → **departureTime < now** (7h < 12h mockée)
- ❌ 10:00 Ouaga→Koudougou (scheduled) → **departureTime < now** (10h < 12h mockée)
- ❌ 06:00 Ouaga→Ouahigouya (departed) → **status !== 'scheduled' && status !== 'boarding'**

---

### 3️⃣ **Caissier - PassengerListsPage.tsx** (Listes passagers - prochaines 24h)

#### Filtre utilisé :
```tsx
const now = getCurrentDate(); // ✅ CORRECT
const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
```

#### Logique de filtrage :
```tsx
departureTime >= now && 
departureTime <= in24Hours &&
(trip.status === 'scheduled' || trip.status === 'boarding')
```

- ✅ Affiche trips dans les **prochaines 24h**
- ✅ Affiche SEULEMENT `scheduled` ou `boarding`
- ❌ **N'affiche PAS** les trips `departed`

#### Trips qui DEVRAIENT être affichés :
1. ✅ 14:00 Ouaga→Bobo VIP - 30/35
2. ✅ 15:00 Ouaga→Koudougou - 15/45
3. ✅ 17:00 Ouaga→Bobo - 27/45

**Total attendu: 3 trips** (identique à TicketSalePage)

---

## 🔥 INCOHÉRENCES IDENTIFIÉES

### Incohérence #1 : Date mockée vs Date réelle
- **Manager LocalMapPage** utilise `new Date()` → voit l'heure RÉELLE du système
- **Caissier** utilise `getCurrentDate()` → voit l'heure MOCKÉE (12h00)
- **Résultat** : Affichages différents car les calculs de temps sont basés sur des dates différentes

### Incohérence #2 : Filtres de status différents
- **Manager LocalMapPage** affiche `boarding`, `departed`, et `scheduled` (si < 2h)
- **Caissier TicketSalePage** affiche SEULEMENT `scheduled` et `boarding` (et seulement futurs)
- **Caissier PassengerListsPage** affiche SEULEMENT `scheduled` et `boarding` (24h)
- **Résultat** : Manager montre plus de trips car il inclut les trips "departed"

### Incohérence #3 : Fenêtres de temps différentes
- **Manager LocalMapPage** : trips dans les **2 prochaines heures** + boarding + departed
- **Caissier TicketSalePage** : trips **futurs** (tous, pas de limite)
- **Caissier PassengerListsPage** : trips dans les **24 prochaines heures**

---

## ✅ SOLUTIONS RECOMMANDÉES

### Solution 1 : STANDARDISER l'utilisation de `getCurrentDate()`
**Remplacer TOUS les `new Date()` par `getCurrentDate()`** dans toutes les pages pour garantir la cohérence avec les données mockées.

**Fichiers à corriger :**
- `/pages/manager/LocalMapPage.tsx` ligne 57

### Solution 2 : CRÉER des fonctions réutilisables dans `statsUtils.ts`

Ajouter ces fonctions centralisées :

```tsx
// Obtenir les trips disponibles pour la vente (futurs, avec places)
export function getAvailableTripsForSale(trips: Trip[]): Trip[] {
  const now = getCurrentDate();
  return trips.filter(trip => {
    const departureTime = new Date(trip.departureTime);
    return (
      (trip.status === 'scheduled' || trip.status === 'boarding') &&
      trip.availableSeats > 0 &&
      departureTime > now
    );
  }).sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
}

// Obtenir les trips des prochaines 24h
export function getUpcomingTrips24h(trips: Trip[]): Trip[] {
  const now = getCurrentDate();
  const in24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  
  return trips.filter(trip => {
    const departureTime = new Date(trip.departureTime);
    return departureTime >= now && 
           departureTime <= in24Hours &&
           (trip.status === 'scheduled' || trip.status === 'boarding');
  }).sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
}

// Obtenir les trips en cours (pour suivi local Manager)
export function getActiveLocalTrips(trips: Trip[], gareId: string, windowHours: number = 2): Trip[] {
  const now = getCurrentDate();
  
  return trips
    .filter(t => t.gareId === gareId)
    .filter(trip => {
      // Toujours afficher boarding et departed
      if (trip.status === 'boarding' || trip.status === 'departed') {
        return true;
      }
      
      // Pour scheduled, vérifier si c'est dans la fenêtre de temps
      if (trip.status === 'scheduled') {
        const departureTime = new Date(trip.departureTime);
        const hoursUntilDeparture = (departureTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        return hoursUntilDeparture <= windowHours && hoursUntilDeparture >= 0;
      }
      
      return false;
    })
    .sort((a, b) => new Date(a.departureTime).getTime() - new Date(b.departureTime).getTime());
}
```

### Solution 3 : REFACTORISER toutes les pages pour utiliser ces fonctions

- `TicketSalePage.tsx` → utilise `getAvailableTripsForSale(trips)`
- `PassengerListsPage.tsx` → utilise `getUpcomingTrips24h(trips)`
- `LocalMapPage.tsx` → utilise `getActiveLocalTrips(trips, user.gareId)`

---

## 📌 CONCLUSION

**Les fonctions ne sont PAS réutilisées** - chaque page a sa propre logique de filtrage dupliquée.

**Les mocks sont cohérents** - le problème n'est PAS dans les données mockées.

**Le vrai problème** : Filtres incohérents + utilisation de `new Date()` au lieu de `getCurrentDate()` + logique dupliquée dans chaque page.

**Impact Business** : Un caissier et un manager regardant au même moment peuvent voir des données différentes, créant de la confusion.

**Action requise** : Centraliser TOUTES les fonctions de filtrage dans `statsUtils.ts` et les réutiliser partout.
