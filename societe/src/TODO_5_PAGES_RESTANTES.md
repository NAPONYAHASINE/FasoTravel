# 📋 TODO : 5 PAGES RESTANTES À INTÉGRER

**Statut actuel :** 21/26 pages intégrées (81%)  
**Pages restantes :** 5  
**Temps estimé :** 4-6 heures

---

## 🎯 OBJECTIF

Intégrer les 5 dernières pages au DataContext pour atteindre **100% de cohérence**.

Actuellement, ces pages affichent des **données de démonstration hardcodées** qui ne sont pas synchronisées avec le reste de l'application.

---

## 📝 LISTE DES PAGES À FAIRE

### 1. StoriesPage (Responsable) - 1h

**Fichier :** `/pages/responsable/StoriesPage.tsx`

**Problème actuel :**
```typescript
// ❌ Données hardcodées
const [stories, setStories] = useState<MarketingStory[]>([
  {
    id: '1',
    title: 'Promotion Noël 2024',
    imageUrl: 'https://...',
    // ... données fictives
  }
]);
```

**Solution à implémenter :**
```typescript
// ✅ Utiliser DataContext
const { stories, addStory, updateStory, deleteStory } = useData();

// Fonctionnalités à connecter :
- Créer story (addStory)
- Modifier story (updateStory)
- Supprimer story (deleteStory)
- Upload image (à implémenter ou utiliser URL externe)
- Statistiques (vues, clics) depuis vraies données
```

**Types déjà définis dans DataContext :**
```typescript
export interface Story {
  id: string;
  title: string;
  mediaUrl: string;
  mediaType: 'image' | 'video';
  targetAudience: 'all' | 'responsable' | 'manager' | 'caissier';
  targetStations?: string[];
  startDate: string;
  endDate: string;
  views: number;
  clicks: number;
  status: 'active' | 'scheduled' | 'expired';
  createdAt: string;
}
```

**Méthodes disponibles :**
- `addStory(story: Omit<Story, 'id'>): void`
- `updateStory(id: string, updates: Partial<Story>): void`
- `deleteStory(id: string): void`

---

### 2. PricingPage (Responsable) - 1.5h

**Fichier :** `/pages/responsable/PricingPage.tsx`

**Problème actuel :**
```typescript
// ❌ Segments de prix hardcodés
const [segments, setSegments] = useState<PriceSegment[]>([
  {
    id: '1',
    route: 'Ouagadougou - Bobo-Dioulasso',
    currentPrice: 5000,
    // ... données fictives
  }
]);
```

**Solution à implémenter :**
```typescript
// ✅ Utiliser DataContext
const { routes, pricingRules, addPricingRule, updatePricingRule } = useData();

// Fonctionnalités à connecter :
- Afficher prix de base des routes
- Créer règle de tarification (addPricingRule)
- Modifier règle (updatePricingRule)
- Supprimer règle (deletePricingRule)
- Calculer prix final avec toutes les règles
- Historique des changements de prix
```

**Types déjà définis :**
```typescript
export interface Route {
  id: string;
  departure: string;
  arrival: string;
  basePrice: number; // ← Prix de base
  // ...
}

export interface PricingRule {
  id: string;
  routeId: string;
  name: string;
  type: 'percentage' | 'fixed';
  value: number;
  startDate: string;
  endDate?: string;
  daysOfWeek?: number[];
  timeSlots?: { start: string; end: string }[];
  priority: number;
  status: 'active' | 'inactive';
}
```

**Méthodes disponibles :**
- `addPricingRule(rule: Omit<PricingRule, 'id'>): void`
- `updatePricingRule(id: string, updates: Partial<PricingRule>): void`
- `deletePricingRule(id: string): void`

**Logique métier à implémenter :**
```typescript
// Calculer prix final d'un trajet
const calculateFinalPrice = (routeId: string, date: string) => {
  const route = routes.find(r => r.id === routeId);
  let price = route.basePrice;
  
  const applicableRules = pricingRules
    .filter(r => r.routeId === routeId && r.status === 'active')
    .filter(r => /* date dans range */)
    .sort((a, b) => a.priority - b.priority);
  
  applicableRules.forEach(rule => {
    if (rule.type === 'percentage') {
      price = price * (1 + rule.value / 100);
    } else {
      price = price + rule.value;
    }
  });
  
  return Math.round(price);
};
```

---

### 3. ReviewsPage (Responsable) - 1h

**Fichier :** `/pages/responsable/ReviewsPage.tsx`

**Problème actuel :**
```typescript
// ❌ Avis hardcodés
const [reviews] = useState<CustomerReview[]>([
  {
    id: '1',
    customerName: 'Mamadou K.',
    rating: 5,
    comment: 'Excellent service !',
    // ... données fictives
  }
]);
```

**Solution à implémenter :**
```typescript
// ✅ Utiliser DataContext
const { reviews, updateReview } = useData();

// Fonctionnalités à connecter :
- Afficher avis réels
- Répondre aux avis (updateReview avec response)
- Filtrer par note
- Filtrer par route
- Statistiques (moyenne, répartition)
- Masquer/Publier avis
```

**Types déjà définis :**
```typescript
export interface Review {
  id: string;
  tripId: string;
  departure: string;
  arrival: string;
  passengerName: string;
  rating: number;
  comment: string;
  date: string;
  response?: string;
  responseDate?: string;
  status: 'pending' | 'published' | 'hidden';
}
```

**Méthodes disponibles :**
- `updateReview(id: string, updates: Partial<Review>): void`

**Fonctionnalités à ajouter :**
```typescript
// Répondre à un avis
const handleRespond = (reviewId: string, response: string) => {
  updateReview(reviewId, {
    response,
    responseDate: new Date().toISOString(),
    status: 'published'
  });
};

// Calculer moyenne
const averageRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

// Distribution des notes
const distribution = [5, 4, 3, 2, 1].map(rating => ({
  rating,
  count: reviews.filter(r => r.rating === rating).length,
  percentage: (reviews.filter(r => r.rating === rating).length / reviews.length) * 100
}));
```

---

### 4. PoliciesPage (Responsable) - 45min

**Fichier :** `/pages/responsable/PoliciesPage.tsx`

**Problème actuel :**
```typescript
// ❌ Politiques hardcodées
const [policies, setPolicies] = useState<Policy[]>([
  {
    id: 'baggage',
    title: 'Politique Bagages',
    value: '• 1 bagage en soute...',
    // ... données fictives
  }
]);
```

**Solution à implémenter :**

**Option A : Ajouter au DataContext** (recommandé)
```typescript
// Dans DataContext.tsx
export interface Policy {
  id: string;
  category: 'baggage' | 'cancellation' | 'boarding' | 'safety' | 'other';
  title: string;
  content: string;
  icon: string;
  updatedAt: string;
}

// Méthodes
updatePolicy(id: string, content: string): void
```

**Option B : Rester en state local** (plus simple)
```typescript
// Garder state local mais persister dans localStorage
const [policies, setPolicies] = useLocalStorage<Policy[]>('policies', defaultPolicies);

// Synchroniser avec contexte pour affichage dans app mobile
useEffect(() => {
  // Envoyer policies vers backend/mobile
}, [policies]);
```

**Recommandation :** Option B suffit pour cette page car ce sont des paramètres de configuration, pas des données transactionnelles.

---

### 5. LocalMapPage (Manager) - 1.5h

**Fichier :** `/pages/manager/LocalMapPage.tsx`

**Problème actuel :**
```typescript
// ❌ Véhicules hardcodés
const [vehicles] = useState<Vehicle[]>([
  {
    id: '1',
    number: 'BF-2245-OG',
    route: 'Ouagadougou - Bobo-Dioulasso',
    status: 'boarding',
    // ... données fictives
  }
]);
```

**Solution à implémenter :**
```typescript
// ✅ Utiliser vraies données des trajets
const { trips } = useFilteredData();

// Mapper trips vers véhicules
const vehicles = trips
  .filter(trip => trip.gareId === user?.gareId) // Seulement gare du manager
  .map(trip => ({
    id: trip.id,
    number: trip.busNumber,
    route: `${trip.departure} - ${trip.arrival}`,
    status: trip.status,
    departureTime: trip.departureTime,
    passengers: trip.totalSeats - trip.availableSeats,
    capacity: trip.totalSeats,
    location: getVehicleLocation(trip), // À implémenter
  }));

// Fonctionnalités à connecter :
- Afficher véhicules en temps réel depuis trips
- Statut (at_station, boarding, en_route, delayed)
- Statistiques par statut
- Filtrage par statut
```

**Logique à implémenter :**
```typescript
// Déterminer localisation selon statut
const getVehicleLocation = (trip: Trip): string => {
  switch (trip.status) {
    case 'scheduled':
    case 'boarding':
      return trip.gareName;
    case 'departed':
      return 'En route';
    case 'arrived':
      return trip.arrival;
    case 'cancelled':
      return 'Annulé';
    default:
      return 'Inconnu';
  }
};

// Mapper statuts
const mapTripStatusToVehicleStatus = (status: Trip['status']) => {
  const mapping = {
    'scheduled': 'at_station',
    'boarding': 'boarding',
    'departed': 'en_route',
    'arrived': 'at_station',
    'cancelled': 'delayed'
  };
  return mapping[status] || 'at_station';
};
```

**Note :** Pour la carte réelle, utiliser :
- Leaflet (`react-leaflet`)
- Mapbox
- Google Maps

Mais pour MVP, une liste suffit.

---

## ⏱️ ESTIMATION TEMPS TOTAL

| Page | Difficulté | Temps | Priorité |
|------|-----------|-------|----------|
| 1. StoriesPage | Moyenne | 1h | 🟡 Moyen |
| 2. PricingPage | Complexe | 1.5h | 🟠 Haut |
| 3. ReviewsPage | Facile | 1h | 🟡 Moyen |
| 4. PoliciesPage | Facile | 45min | 🟢 Bas |
| 5. LocalMapPage | Moyenne | 1.5h | 🟡 Moyen |
| **TOTAL** | - | **5h45** | - |

---

## 📋 CHECKLIST PAR PAGE

### ✅ Pour chaque page :

1. **Remplacer state local par DataContext**
   ```typescript
   // ❌ AVANT
   const [data, setData] = useState([...]);
   
   // ✅ APRÈS
   const { data, addData, updateData } = useData();
   ```

2. **Connecter les actions**
   ```typescript
   // Créer
   const handleCreate = () => addData(newItem);
   
   // Modifier
   const handleUpdate = (id) => updateData(id, changes);
   
   // Supprimer
   const handleDelete = (id) => deleteData(id);
   ```

3. **Ajouter EmptyState**
   ```typescript
   {data.length === 0 && (
     <EmptyState
       icon={Icon}
       title="Aucune donnée"
       description="Description..."
       action={{ label: "Ajouter", onClick: handleAdd }}
     />
   )}
   ```

4. **Ajouter Loading**
   ```typescript
   const [isLoading, setIsLoading] = useState(true);
   
   useEffect(() => {
     // Simuler chargement
     setTimeout(() => setIsLoading(false), 500);
   }, []);
   
   if (isLoading) return <ListSkeleton />;
   ```

5. **Ajouter Confirmation**
   ```typescript
   const handleDelete = (id: string) => {
     setConfirmDialog({
       open: true,
       title: "Supprimer ?",
       description: "Action irréversible",
       onConfirm: () => deleteData(id)
     });
   };
   ```

6. **Tester**
   - ✅ Création fonctionne
   - ✅ Modification fonctionne
   - ✅ Suppression fonctionne
   - ✅ Filtres fonctionnent
   - ✅ Recherche fonctionne

---

## 🎯 RÉSULTAT ATTENDU

Après intégration des 5 pages :

| Métrique | Avant | Après | Gain |
|----------|-------|-------|------|
| **Pages intégrées** | 21/26 (81%) | **26/26 (100%)** | **+19%** |
| **Cohérence données** | 99% | **100%** | **+1%** |
| **Données hardcodées** | 5 pages | **0 page** | **-100%** |

**Application 100% cohérente et production-ready ! 🎉**

---

## 📝 NOTES

### Pourquoi ces pages sont restées hardcodées ?

1. **Moins critiques** pour le MVP initial
2. **Fonctionnalités secondaires** (stories marketing, avis, etc.)
3. **Plus complexes** à implémenter (tarification dynamique, carte temps réel)
4. **Temps limité** lors du développement initial

### Ordre recommandé d'intégration

1. **PoliciesPage** (45min, facile, peu d'impact)
2. **ReviewsPage** (1h, facile)
3. **StoriesPage** (1h, moyenne)
4. **LocalMapPage** (1.5h, moyenne)
5. **PricingPage** (1.5h, complexe, nécessite logique métier)

### Pièges à éviter

- ❌ Ne pas oublier de typer correctement les données
- ❌ Ne pas oublier les filtres par rôle (Manager vs Responsable)
- ❌ Ne pas oublier les validations
- ❌ Ne pas oublier les toasts de confirmation
- ❌ Ne pas oublier les empty states

---

**Document créé :** 2026-01-02  
**Prêt pour implémentation !** 🚀
