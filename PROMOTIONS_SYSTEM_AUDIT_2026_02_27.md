# 🔍 AUDIT SYSTÈME PROMOTIONS - BACKEND READY CHECK
**Date:** 27 février 2026  
**Status:** ⚠️ ALIGNEMENT PROBLÉMATIQUE  
**Priority:** HAUTE - À corriger avant intégration backend

---

## 📋 RÉSUMÉ EXÉCUTIF

Le système de promotions a été implémenté sur Mobile et Societe, MAIS **il existe des divergences critiques** entre les deux structures qui empêchent une véritable intégrité "backend-ready".

### Problèmes Identifiés:
1. ❌ **Nommage incohérent** (snake_case vs camelCase)
2. ❌ **Champs manquants** dans les deux implémentations
3. ❌ **Systèmes de statut différents** (boolean vs enum)
4. ⚠️ **Drift potentiel** si le backend n'est pas encore défini

---

## 🔧 STRUCTURE COMPARATIVE

### Mobile (models.ts) - Promotion Interface

```typescript
export interface Promotion {
  promotion_id: string;              ← snake_case
  operator_id: string;
  trip_id?: string;
  promotion_name: string;            ← MANQUANT: description?
  description?: string;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discount_value: number;
  start_date: string;                ← ISO 8601
  end_date: string;
  max_uses?: number;
  uses_count?: number;
  is_active: boolean;                ← BOOLEAN STATUS
  created_at: string;
  updated_at: string;                ← PRÉSENT ✓
}

// 14 champs total
```

### Societe (DataContext.tsx) - Promotion Interface

```typescript
export interface Promotion {
  id: string;                        ← camelCase
  title: string;                     ← DIFFÉRENT: promotion_name
  description?: string;
  discountType: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discountValue: number;
  tripId?: string;                   ← camelCase
  startDate: string;                 ← camelCase ISO 8601
  endDate: string;
  maxUses?: number;
  currentUses: number;               ← DIFFÉRENT: uses_count
  status: 'draft' | 'active' | 'paused' | 'expired'; ← ENUM STATUS
  createdAt: string;
  createdBy?: string;                ← PRÉSENT ✓
}

// 13 champs total
```

---

## ⚠️ DIVERGENCES CRITIQUES

### 1️⃣ Nommage des Champs
| Champ | Mobile | Societe | Backend? |
|-------|--------|---------|----------|
| ID principal | `promotion_id` | `id` | ❓ |
| Titre | `promotion_name` | `title` | ❓ |
| Type réduction | `discount_type` | `discountType` | ❓ |
| Valeur réduction | `discount_value` | `discountValue` | ❓ |
| ID voyage | `trip_id` | `tripId` | ❓ |
| Date début | `start_date` | `startDate` | ❓ |
| Date fin | `end_date` | `endDate` | ❓ |
| Usages max | `max_uses` | `maxUses` | ❓ |
| Usages courant | `uses_count` | `currentUses` | ❓ |
| Créé le | `created_at` | `createdAt` | ❓ |
| Créé par | ❌ MANQUANT | `createdBy?` | ❓ |
| Modifié le | `updated_at` | ❌ MANQUANT | ❓ |

### 2️⃣ Système de Statut
**Mobile:** `is_active: boolean`
- Valeurs: true/false seulement
- Limitation: Impossible de représenter "paused" ou "draft"
- **IMPACT:** Ne peut pas gérer tous les états nécessaires

**Societe:** `status: 'draft' | 'active' | 'paused' | 'expired'`
- Valeurs: 4 états possibles
- Avantage: Plus granulaire
- **IMPACT:** Mobile DOIT être mis à jour

### 3️⃣ Champs Manquants

**Mobile manque:**
- `created_by` (qui a créé la promotion?)
- Impossible de filtrer par créateur dans admin

**Societe manque:**
- `updated_at` (dernière modification?)
- Impossible de trier par "récemment modifié"

### 4️⃣ Convention de Nommage
- **Mobile:** `snake_case` (promotion_id, discount_type)
- **Societe:** `camelCase` (id, discountType)
- **Norme REST API:** Généralement `snake_case`
- **TypeScript common:** Généralement `camelCase` dans le code

---

## ✅ CE QUI FONCTIONNE BIEN

### Mobile (Côté Utilisateur - Affichage)
```
✅ TripCard affiche correctement:
   - Prix barré + prix réduit
   - Badge de réduction (%)
   
✅ StoriesCircle navigue vers SearchResults:
   - Button "Voir les offres"
   - Passe promo_id correctement
   
✅ SearchResultsPage:
   - Filtre "🎁 Promos"
   - Filtre par promo_id depuis StoriesCircle
   - Tri par réduction
```

### Societe (Côté Admin - Gestion)
```
✅ PromotionsPage UI/UX:
   - Form complète (titre, description, type, valeur)
   - Filtres (statut, recherche)
   - Stats (count actif, montant total)
   - CRUD (create, update, delete)
   
✅ DataContext:
   - CRUD functions implémentées
   - État Redux-like
   - Export dans Provider
   
✅ Navigation:
   - Route /responsable/promotions
   - Menu sidebar avec Gift icon
```

### Données de Test
```
✅ MOCK_PROMOTIONS cohérents:
   - PROMO_001: 25% (global)
   - PROMO_002: 15% (trip-specific)
   
✅ MOCK_TRIPS intégrés:
   - TRIP_001: promotion appliquée
   - promoted_price calculé
   - discount_percentage affiché
```

---

## 🚀 RECOMMANDATIONS POUR BACKEND READY

### Phase 1: Normalisation Immédiate (CRITIQUE)

**1. Choisir une convention:**
```typescript
// ✅ RECOMMANDÉ pour API REST:
interface PromotionDTO {
  promotion_id: string;
  operator_id: string;
  trip_id?: string;
  title: string;                    // Pas "promotion_name"
  description?: string;
  discount_type: 'PERCENTAGE' | 'FIXED_AMOUNT';
  discount_value: number;
  start_date: string;               // ISO 8601
  end_date: string;
  max_uses?: number;
  current_uses: number;             // Pas "uses_count"
  created_by?: string;              // AJOUTER partout
  updated_at: string;               // AJOUTER à Societe
  status: 'draft' | 'active' | 'paused' | 'expired'; // Remplacer is_active
  created_at: string;
}
```

**2. Mettre à jour Mobile:**
```typescript
// models.ts - Promotion interface
- Renommer: promotion_name → title
- Renommer: uses_count → current_uses
- Remplacer: is_active (boolean) → status (enum: 'active' | 'draft' | 'paused' | 'expired')
- Ajouter: created_by?: string
- Garder: updated_at ✓
```

**3. Mettre à jour Societe:**
```typescript
// DataContext.tsx - Promotion interface
- Renommer: discountType → discount_type
- Renommer: discountValue → discount_value
- Renommer: tripId → trip_id
- Renommer: startDate → start_date
- Renommer: endDate → end_date
- Renommer: maxUses → max_uses
- Renommer: currentUses → current_uses
- Renommer: createdAt → created_at
- Renommer: createdBy → created_by
- Ajouter: updated_at: string
- Remplacer: status enum (déjà correct ✓)
```

### Phase 2: Validation de Cohérence

**Dans DataContext - AJOUTER validation:**
```typescript
// Validation avant création/mise à jour
const validatePromotion = (promo: Promotion) => {
  // 1. end_date > start_date
  if (new Date(promo.end_date) <= new Date(promo.start_date)) {
    throw new Error('end_date doit être après start_date');
  }
  
  // 2. discount_value > 0
  if (promo.discount_value <= 0) {
    throw new Error('discount_value doit être > 0');
  }
  
  // 3. PERCENTAGE: value entre 1 et 100
  if (promo.discount_type === 'PERCENTAGE' && (promo.discount_value > 100)) {
    throw new Error('PERCENTAGE discount doit être entre 1-100%');
  }
  
  // 4. current_uses <= max_uses
  if (promo.max_uses && promo.current_uses > promo.max_uses) {
    throw new Error('current_uses ne peut pas dépasser max_uses');
  }
};
```

### Phase 3: Intégration Backend

**Endpoints requis:**
```
GET    /api/promotions                 // List all
GET    /api/promotions/:id             // Get one
POST   /api/promotions                 // Create
PATCH  /api/promotions/:id             // Update
DELETE /api/promotions/:id             // Delete
GET    /api/trips/:trip_id?promotions  // Get applicable promos for trip
```

**Pagination côté backend:**
```typescript
// Mobile: limit list affichage 
GET /api/promotions?status=active&limit=10

// Societe: afficher toutes pour gestion
GET /api/promotions?limit=50&offset=0
```

---

## 🔄 MAPPING DE CONVERSION

**Quand le backend retourne snake_case:**
```typescript
// Backend → Mobile
const mapBackendPromotion = (backendData): Promotion => ({
  promotion_id: backendData.promotion_id,
  operator_id: backendData.operator_id,
  trip_id: backendData.trip_id,
  promotion_name: backendData.title,      // ← rename
  description: backendData.description,
  discount_type: backendData.discount_type,
  discount_value: backendData.discount_value,
  start_date: backendData.start_date,
  end_date: backendData.end_date,
  max_uses: backendData.max_uses,
  uses_count: backendData.current_uses,   // ← rename
  is_active: backendData.status === 'active', // ← convert
  created_at: backendData.created_at,
  updated_at: backendData.updated_at
});
```

**Quand Mobile envoie au backend:**
```typescript
const mapMobileToBackend = (mobile: Promotion) => ({
  promotion_id: mobile.promotion_id,
  operator_id: mobile.operator_id,
  trip_id: mobile.trip_id,
  title: mobile.promotion_name,           // ← rename
  description: mobile.description,
  discount_type: mobile.discount_type,
  discount_value: mobile.discount_value,
  start_date: mobile.start_date,
  end_date: mobile.end_date,
  max_uses: mobile.max_uses,
  current_uses: mobile.uses_count || 0,   // ← rename
  status: mobile.is_active ? 'active' : 'draft', // ← convert
  created_at: mobile.created_at,
  updated_at: mobile.updated_at
});
```

---

## 🧪 CHECKLIST DE VALIDATION

### Avant Livraison au Backend

- [ ] Décider convention finale (snake_case recommandé)
- [ ] Mettre à jour Mobile interfaces
- [ ] Mettre à jour Societe interfaces  
- [ ] Ajouter validation dans DataContext
- [ ] Tester MOCK_PROMOTIONS avec nouvelles interfaces
- [ ] Mettre à jour TripCard si needed
- [ ] Mettre à jour PromotionsPage si needed
- [ ] Vérifier tous imports/exports

### Avant Intégration API

- [ ] Créer mapping functions (BE → FE)
- [ ] Créer validation côté client
- [ ] Ajouter error handling
- [ ] Tester avec vraies données backend
- [ ] Vérifier timezone handling (dates ISO)
- [ ] Tester édition & suppression cascades

### Documentation Backend

- [ ] Documenter format snake_case
- [ ] Documenter enum status values
- [ ] Documenter validation rules
- [ ] Documenter rate limits
- [ ] Documenter cascade delete behavior

---

## 📊 ÉTAT ACTUEL vs BACKEND READY

### Actuellement ✅
- UI/UX fonctionnelle
- CRUD opérationnel
- Affichage des réductions OK
- Navigation entre apps OK

### Avant Backend ⚠️
- **CRITIQUE:** Normaliser interfaces
- **IMPORTANT:** Ajouter created_by partout
- **IMPORTANT:** Ajouter updated_at à Societe
- **UTILE:** Ajouter validation stricte
- **UTILE:** Documenter mappings de conversion

---

## 🎯 CONCLUSION

**Le système fonctionne FONCTIONNELLEMENT, mais n'est pas encore "backend-ready".**

**Score d'alignement:** 6/10
- ✅ Fonctionnalité: 8/10
- ❌ Cohérence: 4/10
- ⚠️ Documentation: 5/10
- ❌ Scalabilité: 5/10

**Action immédiate requise:** Normaliser les structures de données avant de commencer l'intégration backend, sinon risque de refonte importante.

---

*Audit réalisé le 27 février 2026*  
*Assistant: GitHub Copilot*  
*Modèle: Claude Haiku 4.5*
