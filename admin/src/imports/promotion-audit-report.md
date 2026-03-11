# 🏷️ AUDIT SYSTÈME PROMOTIONS (RÉDUCTIONS DE PRIX)
## État actuel: Mobile vs Societe vs Backend

**Date:** 27 février 2026  
**Focus:** Gestion des réductions de prix par les compagnies  
**Status:** ⚠️ INFRASTRUCTURE PARTIELLE - À COMPLÉTER

---

## 🎯 DÉFINITION

**PROMOTION = Réduction de prix** appliquée à un trajet par une compagnie
- Peut être: `-20%` ou `-5000 FCFA`
- Pour: Un trajet spécifique OU tous les trajets d'une compagnie
- Créée par: La compagnie (role RESPONSABLE via Societe app)
- Visible dans: Mobile app (résultats recherche + stories)
- Cible: Inciter les utilisateurs à réserver

**Exemples:**
- Air Canada: `Réduction 25% jusqu'au 15-feb` → `-25% sur route Ouaga-Bobo`
- SCOOT: `Tarifs étudiants` → `-20% pour tous les trajets`

---

## 📊 ÉTAT ACTUEL

### 1️⃣ MOBILE APP - État: **50% PRÊT**

#### ✅ Infrastructure Backend Existante:

**a) Models & Types (models.ts)**
```typescript
// Interface Promotion bien définie ✅
export interface Promotion {
  promotion_id: string;
  operator_id: string;
  trip_id?: string;                    // null = s'applique à TOUS les trajets
  promotion_name: string;              // "Réduction 25%"
  description?: string;                // "Valable jusqu'au 15-feb"
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';  // -20% ou -5000 FCFA
  discount_value: number;              // 20 (pour %) ou 5000 (pour montant)
  start_date: string;                  // ISO 8601
  end_date: string;                    // ISO 8601
  max_uses?: number;                   // Limite d'utilisation (null = illimitée)
  uses_count?: number;                 // Nombre d'utilisations actuelles
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

// Trip intègre les promos ✅
export interface Trip {
  trip_id: string;
  operator_id: string;
  base_price: number;                  // Prix original: 8500 FCFA
  
  // Champs PROMOTION (optionnels, affichés si promo active):
  promotion?: Promotion;               // Objet promo pour détails
  promoted_price?: number;             // Prix réduit: 6800 FCFA
  discount_percentage?: number;        // Pour affichage: 20
  
  // ... autres champs
}
```

**b) SQL Migration 013 - Schema Complet ✅**

```sql
-- ✅ Table promotions avec tous les champs
CREATE TABLE promotions (
  promotion_id VARCHAR(100) PRIMARY KEY,
  operator_id VARCHAR(50) NOT NULL,
  trip_id VARCHAR(50),                 -- NULL = global à l'opérateur
  promotion_name VARCHAR(255) NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL,  -- 'PERCENTAGE' ou 'FIXED_AMOUNT'
  discount_value NUMERIC NOT NULL,     -- 20 ou 5000
  start_date TIMESTAMP NOT NULL,
  end_date TIMESTAMP NOT NULL,
  max_uses INT,
  uses_count INT DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  
  FOREIGN KEY (operator_id) REFERENCES operators(operator_id)
);

-- ✅ Champs promo dans trips
ALTER TABLE trips ADD COLUMN IF NOT EXISTS promotion_id VARCHAR(100);
ALTER TABLE trips ADD COLUMN IF NOT EXISTS promoted_price INTEGER;
ALTER TABLE trips ADD COLUMN IF NOT EXISTS discount_percentage NUMERIC(5, 2);

-- ✅ Vues pour faciliter requêtes
CREATE VIEW vw_active_promotions AS ...
CREATE VIEW vw_trips_with_promotions AS ...

-- ✅ Fonctions SQL pour calculs
CREATE FUNCTION calculate_promoted_price(...) ...
CREATE FUNCTION calculate_discount_percentage(...) ...
```

#### ✅ Composants UI Mobile

**a) PriceDisplay Component** ✅
```typescript
// Mobile/src/components/PriceDisplay.tsx

// ✅ EXISTE et affiche correctement:
<PriceDisplay 
  basePrice={8500}              // Prix original
  promotedPrice={6800}          // Prix après réduction
  discountPercentage={20}       // Badge "-20%"
  showBadge={true}              // Affiche le badge
/>

// Affichage:
// 8 500 FCFA (barré)  |  6 800 FCFA (vert)  |  [-20%]
```

**b) StoriesCircle - Stories Générales** ⚠️ PARTIELLEMENT
```typescript
// Mobile/src/components/StoriesCircle.tsx

export interface Story {
  id: string;
  title: string;
  description: string;
  gradient: string;
  category: string;
  link_url?: string;            // ⚠️ URL externe - PAS un deeplink vers trajet
  // ...
}

// Affichage:
StoriesCircle 
  → Cercle coloré avec emoji
  → Au clic: modal FULLSCREEN
  → Si link_url: bouton "En savoir plus" qui va à l'URL
  → ❌ MAIS: link_url peut être n'importe quel URL, pas ciblé sur trajets en promo

// Exemple actuel:
{
  id: 'STORY_PROMO_1',
  title: 'Réductions hiver',
  link_url: 'https://example.com',  // ❌ URL externe, pas "recherche promo"
}

// Ce qu'il faudrait:
{
  id: 'STORY_PROMO_1',
  title: 'Réductions hiver',
  cta_link: 'transportbf://search?promo_id=PROMO_123',  // ✅ Deeplink vers promo
  // Au clic: naviguer vers SearchScreen avec filtre promo_id
}
```

**c) TripCard - Affichage résultats** ⚠️ SUPPORT PARTIEL
```typescript
// Mobile/src/components/TripCard.tsx

// ✅ Affiche le prix basique:
<p className="text-lg text-green-600">{trip.base_price.toLocaleString()} FCFA</p>

// ❌ NE MONTRE PAS:
// - trip.promoted_price (prix réduit)
// - trip.discount_percentage (le badge %)
// - trip.promotion (détails de la promo)

// Ce qu'il faudrait:
{trip.promoted_price && (
  <PriceDisplay 
    basePrice={trip.base_price}
    promotedPrice={trip.promoted_price}
    discountPercentage={trip.discount_percentage}
  />
)}
```

**d) SearchResultsPage** ❌ PAS DE FILTRE PROMOS
```typescript
// Mobile/src/pages/SearchResultsPage.tsx

// ❌ Affiche les résultats mais:
// - Pas de "Afficher que les trajets en promo"
// - Pas de tri par économie faite
// - Pas de filtre "discount_percentage >= 15%"

// Ce qu'il faudrait:
// - Ajouter des filtres:
//   - "Avec réductions uniquement"
//   - "Économiser au minimum X%"
// - Ajouter du tri:
//   - "Par réduction croissante/décroissante"
```

#### 📋 Champs dans Trip Response:

```typescript
// Réponse GET /api/trips/search actuellement:
{
  trip_id: "TRIP_001",
  operator_id: "AIR_CANADA",
  base_price: 8500,
  
  // ⚠️ CES CHAMPS SONT OPTIONNELS - backend peut ne pas les retourner:
  promotion?: {                        // Si promo active
    promotion_id: "PROMO_001",
    promotion_name: "Réduction 25%",
    discount_type: "PERCENTAGE",
    discount_value: 25,
    end_date: "2025-02-15"
  },
  promoted_price?: 6375,               // 8500 * (1 - 25/100) = 6375
  discount_percentage?: 25,
  
  // ... autres champs
}

// ❌ PROBLÈME: Si promoted_price est null, on affiche pas la promo
// Les composants doivent vérifier promoted_price !== null
```

#### 🔌 Endpoints Documentés (Non implémentés):

```javascript
// ✅ Documenté mais probablement pas implémenté:

GET /api/promotions
  Query: operator_id, is_active=true, trip_id
  Response: Promotion[]

GET /api/promotions/{promo_id}
  Response: Promotion

GET /api/trips?promo_id={promo_id}
  Response: Trip[] // Trajets qui ont cette promo
```

---

### 2️⃣ SOCIETE APP (Back-office opérateur) - État: **0% PRÊT**

#### ❌ Pas de Page de Gestion des Promotions

**Structure fichiers Societe:**
```
societe/src/pages/responsable/
├── TrafficPage.tsx          ✅ Gère les trajets
├── StationsPage.tsx         ✅ Gère les gares
├── StoriesPage.tsx          ✅ Gère les stories publicitaires (pas les promos)
└── ❌ PromotionsPage.tsx    ← N'EXISTE PAS ❌
```

#### ❌ Pas de Modèle de Données

```typescript
// Societe DataContext manque complètement de:
interface Promotion {
  // N'existe pas dans societe/src/contexts/DataContext.tsx
}

const [promotions, setPromotions] = useState([]);
// ❌ PAS DE CONTEXTE POUR LES PROMOS
```

#### ⚠️ Prix dans Trip (Societe):

```typescript
// societe/src/contexts/DataContext.tsx

export interface Trip {
  id: string;
  routeId: string;
  departureTime: string;
  busNumber: string;
  availableSeats: number;
  totalSeats: number;
  price: number;                       // ❌ Pas de promotion fields
  status: 'scheduled' | 'boarding' | ...
  serviceClass: 'standard' | 'vip' | 'express';
  // ❌ Manquent:
  // - promotion_id
  // - discounted_price
  // - discount_percentage
}
```

#### 🎯 Workflow Espéré (Societe):

```
Responsable se connecte à Societe
  └─ Va à "Promotions" (n'existe pas)
    ├─ Voit liste de ses trajets
    └─ Pour chaque trajet:
      ├─ [+ Ajouter promotion]
      └─ Crée une promo:
        ├─ Type: % ou montant fixe
        ├─ Valeur: 20 ou 5000
        ├─ Date début/fin
        ├─ Max utilisations (optionnel)
        └─ [Confirmer]
        
      └─ Promo appliquée au trajet
        └─ Envoyée à users = visible dans Mobile
```

---

### 3️⃣ BACKEND - État: **70% PRÊT**

#### ✅ Migration SQL 013 existe:
- [x] Table promotions créée avec schema complet
- [x] Colonnes promotion_id, promoted_price, discount_percentage dans trips
- [x] Fonctions SQL pour calculer prix réduit
- [x] Vues pour requêtes faciles
- [x] Triggers pour auto-update des champs promotion

#### ❌ APIs Endpoints - Probablement pas implémentés:

```javascript
// ❌ À IMPLÉMENTER:

// CRUD Promotions
POST   /api/admin/promotions           // Créer promo
GET    /api/admin/promotions           // Lister promos
GET    /api/admin/promotions/{id}      // Détails promo
PUT    /api/admin/promotions/{id}      // Modifier promo
DELETE /api/admin/promotions/{id}      // Supprimer promo

// Opérateur crée ses promos
POST   /api/operators/me/promotions    // Créer promo pour ma compagnie
GET    /api/operators/me/promotions    // Mes promos
PUT    /api/operators/me/promotions/{id}

// Publier promos mineures
PATCH  /api/promotions/{id}/activate
PATCH  /api/promotions/{id}/deactivate

// Récupérer trajets avec promo
GET    /api/trips?promo_id={id}        // Trajets avec cette promo
GET    /api/trips/search?include_promos=true  // Inclure promos dans résultats
```

---

## 📋 COMPARAISON: CE QUI EXISTE vs CE QUI MANQUE

| Composant | État | Détails |
|-----------|------|---------|
| **Models/Types Promotion** | ✅ OK | Bien défini dans Mobile `models.ts` |
| **SQL Schema** | ✅ OK | Migration 013 complète |
| **PriceDisplay Component** | ✅ OK | Affiche prix + badge % |
| **TripCard - Affichage promo** | ❌ MANQUE | Utilise `base_price` seulement |
| **SearchResults - Affichage promo** | ❌ MANQUE | Filtre/tri par promo |
| **Stories - Redirection vers promo** | ❌ MANQUE | link_url vs deeplink |
| **Societe - Page Promotion** | ❌ MANQUE | Pas d'interface CRUD |
| **Backend APIs** | ❌ MANQUE | Endpoints pour CRUD promo |
| **Redirection deeplink** | ❌ MANQUE | `transportbf://search?promo_id=X` |

---

## ✅ CE QUI FONCTIONNE ACTUELLEMENT

### Sur Mobile:

```typescript
// 1. ✅ Interface Promotion complète
const promo: Promotion = {
  promotion_id: "PROMO_001",
  operator_id: "AIR_CANADA",
  promotion_name: "Réduction 25%",
  discount_type: "PERCENTAGE",
  discount_value: 25,
  start_date: "2025-02-01",
  end_date: "2025-02-15",
  max_uses: 1000,
  is_active: true
};

// 2. ✅ Trip avec promo fields
const trip: Trip = {
  trip_id: "TRIP_001",
  operator_id: "AIR_CANADA",
  base_price: 8500,
  promotion: promo,                    // ✅ Objet promo complet
  promoted_price: 6375,                // ✅ 8500 * (1 - 25/100)
  discount_percentage: 25,             // ✅ Pour affichage
};

// 3. ✅ Affichage du prix:
<PriceDisplay 
  basePrice={8500}
  promotedPrice={6375}
  discountPercentage={25}
/>
// Rendu: "8 500 FCFA" (barré) | "6 375 FCFA" | [-25%]
```

---

## ❌ CE QUI NE FONCTIONNE PAS / EST MANQUANT

### Frontend Mobile:

**a) TripCard n'affiche pas les promos**
```tsx
// ACTUELLEMENT (❌):
<div>Price: {trip.base_price} FCFA</div>

// DEVRAIT ÊTRE (✅):
{trip.promoted_price && trip.promoted_price < trip.base_price ? (
  <PriceDisplay 
    basePrice={trip.base_price}
    promotedPrice={trip.promoted_price}
    discountPercentage={trip.discount_percentage}
  />
) : (
  <p>{trip.base_price.toLocaleString()} FCFA</p>
)}
```

**b) SearchResultsPage pas d'affichage promo**
```tsx
// Manque dans SearchResultsPage:

// 1. Pas d'option "Afficher que les promos"
// 2. Pas de tri par remise
// 3. Pas d'économie totale affichée

// Devrait ajouter:
{showPromoOnly && (
  <Checkbox>
    <label>Trajets en promotion uniquement</label>
  </Checkbox>
)}

{sortBy === 'discount' && (
  <span>Économie: jusqu'à {maxDiscount}%</span>
)}
```

**c) StoriesCircle - Pas de deeplink vers promo**
```tsx
// ACTUELLEMENT (❌):
{selectedStory.link_url ? (
  <a href={selectedStory.link_url}>En savoir plus</a>  // URL externe
) : null}

// DEVRAIT ÊTRE (✅):
// Pour une story de promo, ajouter:
{selectedStory.promo_id ? (
  <Button onClick={() => navigateToPromo(selectedStory.promo_id)}>
    Voir les offres
  </Button>
) : selectedStory.link_url ? (
  <a href={selectedStory.link_url}>En savoir plus</a>
) : null}

// Ajouter en Story interface:
export interface Story {
  // ... fields existants
  promo_id?: string;  // Link vers promotion_id si c'est une promo story
  search_filters?: {
    route?: string;  // ou géo filters
  }
}
```

### Backend:

**a) Pas d'endpoints pour créer/modifier promos**
```javascript
// ❌ Ces endpoints n'existent probablement pas:
POST /api/operators/me/promotions
PUT /api/operators/me/promotions/{id}
GET /api/operators/me/promotions

// ❌ Ces endpoints n'existent probablement pas:
GET /api/trips/search?include_active_promos=true
```

**b) Pas de logique de validation**
```javascript
// ❌ Manque:
// - Vérifier que promotion_id existe avant de l'assigner à trip
// - Vérifier que la promo est is_active
// - Vérifier que on est dans la date start/end
// - Vérifier max_uses pas dépassé
// - Incrémenter uses_count à chaque booking
```

### Societe App:

**Complètement manquant:**
- Page PromotionsPage.tsx (n'existe pas)
- DataContext pour promotions
- Formulaire CRUD promo
- Affichage du prix avec promo pour chaque trajet

---

## 🎯 PLAN D'ACTION REQUIS

### Phase 1: Mobile - AFFICHAGE DES PROMOS (1-2 jours)

**Priorité:** HAUTE - Sans ça, les promos existent mais sont invisibles

1. ✅ [Mobile] Modifier `TripCard.tsx` pour afficher price avec promo
2. ✅ [Mobile] Modifier `SearchResultsPage.tsx` pour show promos
3. ✅ [Mobile] Ajouter Story interface `promo_id` field
4. ✅ [Mobile] Modifier `StoriesCircle.tsx` pour deeplink vers promo
5. ✅ [Mobile] Ajouter logique `navigateToPromo(promo_id)` →SearchPage

### Phase 2: Societe - CRÉER LES PROMOS (2-3 jours)

**Priorité:** HAUTE - Les compagnies ont besoin de créer

1. ✅ [Societe] Créer `PromotionsPage.tsx` - interface CRUD
2. ✅ [Societe] Ajouter `promotions` à DataContext
3. ✅ [Societe] Formulaire: nom, type (% ou montant), valeur, dates
4. ✅ [Societe] Affichage: liste des promos par trajet
5. ✅ [Societe] Actions: créer, modifier, supprimer, activer/désactiver

### Phase 3: Backend - APIs (2-3 jours)

**Priorité:** CRITIQUE

1. ✅ [Backend] POST `/api/operators/me/promotions` - Créer
2. ✅ [Backend] GET `/api/operators/me/promotions` - Lister
3. ✅ [Backend] PUT `/api/operators/me/promotions/{id}` - Modifier
4. ✅ [Backend] DELETE `/api/operators/me/promotions/{id}` - Supprimer
5. ✅ [Backend] PATCH `/api/promotions/{id}/activate` - Activer
6. ✅ [Backend] PATCH `/api/promotions/{id}/deactivate` - Désactiver
7. ✅ [Backend] Modifier GET `/api/trips/search` pour inclure promoted_price
8. ✅ [Backend] Ajouter validations (dates, max_uses, etc.)

### Phase 4: Admin App - GÉRER LES PROMOS (Futur)

Pour l'Admin, on voudra:
- Vue globale de TOUTES les promos (tous opérateurs)
- Pouvoir approuver/rejeter les promos
- Analytics: combien d'utilisations, économies générées
- Tools: dupliquer promo, créer template

---

## 💡 ARCHITECTURE COMPLÈTE POUR PROMOS

### Scénario Complet: Créer et Afficher une Promo

```
1. SOCIETE (Compagnie)
   Responsable → PromotionsPage
     ├─ [+ Créer promo]
     └─ Formulaire:
       ├─ Nom: "Réduction Hiver 25%"
       ├─ Type: ◉ Pourcentage ○ Montant fixe
       ├─ Valeur: 25
       ├─ Trajet: ◉ Tous ○ OUAGA-BOBO seulement
       ├─ Début: 2025-02-01
       ├─ Fin: 2025-02-15
       ├─ Max usages: [2000]
       └─ [Créer]
       
     └─ POST /api/operators/me/promotions
       {
         promotion_name: "Réduction Hiver 25%",
         discount_type: "PERCENTAGE",
         discount_value: 25,
         trip_id: null,  // Tous les trajets
         start_date: "2025-02-01",
         end_date: "2025-02-15",
         max_uses: 2000
       }
       
     └─ Base de données:
       INSERT INTO promotions (...) VALUES (
         PROMO_001, AIR_CANADA, null, "Réduction...", ...
       )
       
       UPDATE trips SET
         promotion_id = 'PROMO_001',
         promoted_price = floor(base_price * 0.75),
         discount_percentage = 25
       WHERE operator_id = 'AIR_CANADA'

2. ADMIN (Optional - Modération)
   Admin voit la nouvelle promo
     ├─ État: PENDING APPROVAL
     └─ Actions: [Approuver] [Rejeter]

3. MOBILE (Utilisateurs)
   User ouvre app
     ├─ HomePage → StoriesCircle
     │   └─ ✅ NOUVELLES: Story "Réduction 25%"
     │     ├─ Au clic: Modal avec promo details
     │     ├─ Bouton: "Voir les offres"
     │     └─ Au clic: navigueToPromo('PROMO_001')
     │
     └─ SearchPage
       ├─ User cherche: Ouaga → Bobo, 15 feb
       │   └─ GET /api/trips/search?... → Response:
       │     [
       │       {
       │         trip_id: "TRIP_001",
       │         base_price: 8500,
       │         promotion: { promotion_id: "PROMO_001", ... },
       │         promoted_price: 6375,
       │         discount_percentage: 25
       │       },
       │       ...
       │     ]
       │
       └─ Affichage SearchResults:
         ├─ Air Canada Ouaga-Bobo 09:00
         ├─ Prix: 8 500 FCFA (barré) | 6 375 FCFA | [-25%]
         └─ User voit clairement le prix réduit
```

---

## 🚨 POINTS CRITIQUES À RÉSOUDRE

### 1. Comment décider qu'une promo s'affiche dans Mobile?

**Option A: Backend décide** ✅ Recommandé
```
Backend fait la logique:
- Si trip.promotion_id existe
- Et promo.is_active = true
- Et NOW() BETWEEN start_date AND end_date
- Et uses_count < max_uses
- Alors: promoted_price = prix réduit

Frontend: Affiche promoted_price s'il existe et < base_price
```

**Option B: Full Backend calculation**
```
Backend retourne toujours:
{
  base_price: 8500,
  effective_price: 6375,  // ← calcul du backend
  discount_info: { ... }
}

Frontend: Simple affichage effective_price vs base_price
```

### 2. Tracking des utilisations

```typescript
// Quand user achète un ticket avec promo:
POST /api/bookings
{
  trip_id: "TRIP_001",
  promotion_id: "PROMO_001",  // ← Add this
  // ...
}

// Backend:
const booking = await createBooking(data);

// Incrémenter uses_count:
UPDATE promotions SET uses_count = uses_count + 1 
WHERE promotion_id = 'PROMO_001'
AND uses_count < max_uses;

// Vérifier si limit atteint:
IF uses_count >= max_uses THEN:
  UPDATE promotions SET is_active = FALSE;
  // Promo expire automatiquement
```

### 3. Stories + Promos

**Distinction importante:**
```
STORIES = Contenu marketing general (annonces)
├─ Créées par Admin avec StoriesPage
├─ Peuvent avoir un link_url vers n'importe où
└─ Ou un promo_id si c'est une promo story

PROMOTIONS = Réductions de prix
├─ Créées par Opérateur avec PromotionsPage
├─ Appliquées automatiquement aux trajets
└─ Peuvent être "storytellisées" (mises en story)

RELATION:
- Une Promo peut avoir une Story associée (promo_id dans Story)
- Une Story peut référencer une Promo (pour redirection)
- Ou une Story est juste du contenu sans lien commercial
```

---

## 📝 NOTES IMPORTANTES

### Pour Societe:

```
Responsable peut créer PROMO en indiquant:
✅ Trajet spécifique (ex: OUAGA-BOBO) OU tous les trajets
✅ % OU montant fixe
✅ Dates début/fin (expiration auto)
✅ Max utilisations (pour éviter l'abus)
✅ Peuvent modifier/désactiver avant expiration

⚠️ Pas de: A/B testing, ciblage géographique,
  scheduling avancé (c'est pour Admin)
```

### Pour Mobile:

```
User voit les PROMOS:
✅ Dans les résultats de recherche (prix réduit affiché)
✅ Dans les stories "Réduction 25%"
✅ Peut filtrer "Afficher que les promos"
✅ Peut trier par économie

⚠️ Pas de: Codes promo à entrer, coupons digitaux
  La promo s'applique automatiquement au trajet
```

### Pour Backend:

```
VALIDATION CRITIQUE:
- promotion_id doit exister
- is_active MUST be true
- NOW() doit être entre start_date et end_date
- uses_count < max_uses (ou max_uses NULL = illimitée)
- Incrémenter uses_count uniquement ON SUCCESSFUL booking
- Désactiver automatiquement si max_uses atteint

PERFORMANCE:
- Cacher les promos expirées dans les requêtes
- Indexer sur (trip_id, is_active, end_date)
- Cache Redis des promos actives (TTL 1h)
```

---

## ✍️ RÉSUMÉ FINAL

| Aspect | Statut | Notes |
|--------|--------|-------|
| **Models/Types** | ✅ BON | Interface Promotion complète |
| **SQL Schema** | ✅ BON | Migration 013 prête |
| **Mobile Affichage** | ⚠️ PARTIEL | PriceDisplay OK, mais TripCard/SearchResults n'utilisent pas |
| **Mobile Navigation** | ❌ MANQUE | Pas de deeplink story → SearchPage |
| **Societe CRUD** | ❌ MANQUE | Page PromotionsPage.tsx n'existe pas |
| **Backend APIs** | ❌ MANQUE | Endpoints pas implémentés |
| **Validation** | ❌ MANQUE | Logique backend pour actif/expiration |
| **Tracking** | ❌ MANQUE | Incrémenter uses_count |

**Effort pour compléter: 4-5 jours de dev**
- Phase 1 (Mobile): 1-2 jours
- Phase 2 (Societe): 2-3 jours
- Phase 3 (Backend): 2-3 jours
- Overlap possible: Total ~5 jours

---

**Prêt pour les détails d'implémentation?**

