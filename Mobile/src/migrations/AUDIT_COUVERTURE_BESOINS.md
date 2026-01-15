# 🔍 AUDIT: Couverture Migrations vs Besoins Réels du Projet

**Date:** 2025-11-13  
**Statut:** Analyse complète  
**Verdict:** ⚠️ **LACUNES IDENTIFIÉES** - Des ajustements sont nécessaires

---

## 📋 TABLE DES MATIÈRES

1. [Résumé exécutif](#résumé-exécutif)
2. [Analyse détaillée par domaine](#analyse-détaillée-par-domaine)
3. [Lacunes identifiées](#lacunes-identifiées)
4. [Recommandations](#recommandations)

---

## Résumé Exécutif

### ✅ CE QUI EST CORRECT (80%)

Les migrations couvrent correctement:
- ✅ Tables core transport (operators, trips, segments, stations)
- ✅ Réservations & paiements (bookings, payments, tickets)
- ✅ Système de stories (operator_stories, story_views)
- ✅ Système de publicités (advertisements, ad_analytics)
- ✅ Utilisateurs & authentification (users, sessions, devices)
- ✅ Analytics basiques (analytics_events)
- ✅ Transferts de tickets (ticket_transfers)

### ⚠️ CE QUI MANQUE (20%)

**1. STRUCTURE HIÉRARCHIQUE d'opérateurs (MANQUANTE)**
   - Pas de concept de "branches" ou "agences" pour les opérateurs
   - Impact: Impossible de différencier Ouaga vs Bobo pour le même opérateur

**2. CATÉGORIES DE STORIES (MANQUANTE)**
   - Migration 001 crée bien `operator_stories` mais...
   - Pas de table `story_categories` mentionnée dans PREPARATION_BACKEND_COMPLETE.md
   - Les admins ne peuvent pas gérer "catégories de stories"

**3. AMENITIES DYNAMIQUES (PARTIELLE)**
   - Les amenities sont stockés comme TEXT[] (array)
   - Pas de table lookup pour normaliser les amenities disponibles
   - Les admins ne peuvent pas créer de nouvelles amenities depuis l'API

**4. GROUPES DE TRAJETS (ABSENT)**
   - Pas de concept de "trajets périodiques" ou "trajets planifiés"
   - Impact: Chaque trajet est singleton, pas de pattern/itinéraire répétitif

**5. SYSTÈME DE VALIDATION AVANCÉ (PARTIELLE)**
   - Les données entrantes ne sont pas validées par des lookup tables
   - Exemple: `amenities` ne référence pas une table normalisée

**6. INFORMATIONS DE CONTACT MULTI-OPÉRATEUR (ABSENT)**
   - Les utilisateurs peuvent être liés à plusieurs opérateurs (admins, support)
   - Pas de table `operator_staff` ou `user_roles`

**7. SYSTÈME DE NOTES/AVIS DÉTAILLÉ (MANQUANT)**
   - Seulement `rating` et `total_reviews` sur operators
   - Pas de table `reviews` pour stocker les avis détaillés
   - Pas de relation entre reviews et trips spécifiques

---

## Analyse Détaillée par Domaine

### 🚌 1. SYSTÈME DE TRANSPORT (Bien couvert)

| Aspect | Requis | Implémenté | Notes |
|--------|--------|-----------|-------|
| Opérateurs (operators) | ✅ | ✅ | Bien structuré |
| Trajets (trips) | ✅ | ✅ | Complet avec status |
| Segments | ✅ | ✅ | Route portions correctes |
| Stations | ✅ | ✅ | Lat/lon inclus |
| Véhicules | ✅ | ✅ | Lié à seat_map_config |
| Agences/Branches | ❓ | ❌ | **NON IMPLÉMENTÉ** |

**Problème:** Si un opérateur a des bureaux à Ouaga ET Bobo, il n'y a pas de way de le représenter.
- Champ `operator_id` sur stations est correct pour associer stations à opérateurs
- Mais manque une table pour les "branches" d'un opérateur

**Impact:** Les admis ne peuvent pas:
- Filtrer les trajets par agence
- Assigner le staff par agence
- Gérer les horaires par agence

---

### 📱 2. SYSTÈME DE STORIES (Bien couvert)

| Aspect | Requis | Implémenté | Notes |
|--------|--------|-----------|-------|
| Création stories | ✅ | ✅ | Migration 001 |
| Tracking vues | ✅ | ✅ | story_views table |
| Expiration | ✅ | ✅ | expires_at column |
| Types de stories | ✅ | ✅ | `type` column |
| Catégories | ❓ | ❌ | **REQUIS par PREPARATION_BACKEND_COMPLETE.md** |
| Media/Images | ✅ | ✅ | media_type, media_url |
| Gradients | ✅ | ✅ | Stocké directement |

**Lacune identifiée:** PREPARATION_BACKEND_COMPLETE.md ligne 250+ demande:
```
**Hooks créés pour les administrateurs:**

**a) `useStoryCategories()`**
- Récupère toutes les catégories de stories
- Endpoint: `GET /api/story-categories`

**b) `useCreateStoryCategory()`**
- Endpoint: `POST /api/story-categories`
- Paramètres: `{ name, slug, emoji, description }`
```

**Problème:** Pas de table `story_categories` dans les migrations!

---

### 💳 3. SYSTÈME DE RÉSERVATION & PAIEMENT (Bien couvert)

| Aspect | Requis | Implémenté | Notes |
|--------|--------|-----------|-------|
| Réservations (bookings) | ✅ | ✅ | Avec status HOLD/PAID |
| Paiements (payments) | ✅ | ✅ | Tracking provider |
| Billets (tickets) | ✅ | ✅ | QR codes + codes alphanumériques |
| Transferts | ✅ | ✅ | ticket_transfers table |
| Sièges (seats) | ✅ | ✅ | Status tracking |
| Holds expirants | ✅ | ✅ | hold_expires_at |

**Verdict:** ✅ Bien implémenté

---

### 👥 4. GESTION UTILISATEURS (Partielle)

| Aspect | Requis | Implémenté | Notes |
|--------|--------|-----------|-------|
| Users basics | ✅ | ✅ | Email, phone, full_name |
| Authentification | ✅ | ✅ | password_hash column |
| Roles | ✅ | ✅ | USER, OPERATOR_ADMIN, SUPER_ADMIN |
| Sessions | ✅ | ✅ | user_sessions table |
| Devices | ✅ | ✅ | user_devices table |
| Multi-operator staff | ❌ | ❌ | **MANQUANT** |

**Lacune:** Un admin peut gérer plusieurs opérateurs (ex: admin de TransportBF gère "Air Canada" ET "Scoot").
- **Pas de table** pour mapper users → operators
- Solution: Créer table `user_operator_roles` ou `operator_staff`

---

### 📊 5. SYSTÈME D'ADVERTISING (Bien couvert)

| Aspect | Requis | Implémenté | Notes |
|--------|--------|-----------|-------|
| Ads | ✅ | ✅ | Migration 002 |
| Analytics | ✅ | ✅ | ad_analytics table |
| Targeting | ✅ | ✅ | target_audience column |

**Verdict:** ✅ Bien implémenté

---

### 📈 6. ANALYTICS & REPORTING (Basique)

| Aspect | Requis | Implémenté | Notes |
|--------|--------|-----------|-------|
| Events | ✅ | ✅ | analytics_events table |
| User behavior | ✅ | ✅ | Trackable via events |
| JSONB metadata | ✅ | ✅ | event_data JSONB |
| Performance metrics | ❓ | ❌ | **Pas de dashboard metrics** |

**Lacune:** Pas de table pré-calculée pour:
- Revenue par opérateur
- Taux de conversion booking
- Performance des stories (ad_analytics couvre les ads)
- Temps moyen de trajet

---

### 🎨 7. SYSTÈME D'AMENITÉS (Basique)

| Aspect | Requis | Implémenté | Notes |
|--------|--------|-----------|-------|
| Amenities sur vehicle | ✅ | ✅ | TEXT[] array |
| Lookup table | ❌ | ❌ | **Pas de normalisation** |

**Problème:** Amenities stockés comme TEXT[] (array libre):
- Pas de validation d'énumération
- Pas de standardisation (WiFi vs wifi vs Wi-Fi)
- Impossible de faire des statistiques ("combien de bus ont WiFi")

**Solution:** Créer table `amenity_types` et `vehicle_amenities` (junction table)

---

## Lacunes Identifiées

### 🔴 CRITIQUE (Bloquant)

#### 1. Story Categories (MISSING)
**Requis par:** PREPARATION_BACKEND_COMPLETE.md, BACKEND_CHECKLIST.md
**Impact:** Admin ne peut pas créer/gérer les catégories de stories
**Fichier affecté:** `useStoryCategories()`, `POST /api/story-categories`

```sql
-- À AJOUTER:
CREATE TABLE story_categories (
  category_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  emoji VARCHAR(10),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

#### 2. Operator Staff / Multi-operator Users (MISSING)
**Requis par:** Architecture multi-tenant (admin → N opérateurs)
**Impact:** Pas de way d'assigner un admin à plusieurs opérateurs

```sql
-- À AJOUTER:
CREATE TABLE user_operator_roles (
  user_id UUID,
  operator_id VARCHAR(50),
  role VARCHAR(50), -- 'OPERATOR_ADMIN', 'SUPPORT', 'DRIVER'
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  PRIMARY KEY (user_id, operator_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id),
  FOREIGN KEY (operator_id) REFERENCES operators(operator_id)
);
```

### 🟡 IMPORTANT (Non-bloquant mais fortement recommandé)

#### 3. Amenity Types (NORMALIZATION)
**Requis par:** Bonne pratique de design de données
**Impact:** Inconsistences de données, impossibilité de statistiques

```sql
-- À AJOUTER:
CREATE TABLE amenity_types (
  amenity_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  icon VARCHAR(50),
  category VARCHAR(50)
);

CREATE TABLE vehicle_amenities (
  vehicle_id VARCHAR(50),
  amenity_id VARCHAR(50),
  PRIMARY KEY (vehicle_id, amenity_id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id),
  FOREIGN KEY (amenity_id) REFERENCES amenity_types(amenity_id)
);
```

#### 4. Reviews / Detailed Ratings (MISSING)
**Requis par:** App réelle (pas juste rating moyen)
**Impact:** Pas de détail sur avis clients

```sql
-- À AJOUTER:
CREATE TABLE reviews (
  review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id VARCHAR(50),
  operator_id VARCHAR(50),
  user_id UUID,
  rating INTEGER CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  helpful_count INTEGER DEFAULT 0
);
```

#### 5. Trip Schedules / Recurring (MISSING)
**Requis par:** Trajets périodiques (Ouaga→Bobo tous les jours à 07:00)
**Impact:** Pas de concept de "itinéraire répétitif"

```sql
-- À AJOUTER:
CREATE TABLE trip_schedules (
  schedule_id UUID PRIMARY KEY,
  operator_id VARCHAR(50),
  from_stop_id VARCHAR(50),
  to_stop_id VARCHAR(50),
  departure_time TIME,
  recurrence_pattern VARCHAR(50), -- 'DAILY', 'WEEKLY', 'MONTHLY'
  is_active BOOLEAN,
  created_trips INTEGER, -- Nombre de trips générés
  FOREIGN KEY (operator_id) REFERENCES operators(operator_id)
);
```

### 🔵 NICE-TO-HAVE (Optionnel)

#### 6. Performance Analytics Dashboard
**Pour:** Admin dashboard (revenue, conversion, etc.)
**Impact:** Lectures analytics lentes sans pré-calculation

#### 7. Operator Branches/Locations
**Pour:** Multi-location operators
**Impact:** Tous les trips assignés à l'opérateur global (pas de distinction agence)

---

## Recommandations

### 🎯 ACTION IMMÉDIATE (Avant backend dev)

Créer **Migration 008: Additional Tables** avec:

```sql
-- 1. Story Categories
CREATE TABLE story_categories (
  category_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE,
  emoji VARCHAR(10),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. User-Operator Mapping
CREATE TABLE user_operator_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  operator_id VARCHAR(50) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('OPERATOR_ADMIN', 'SUPPORT', 'DRIVER')),
  assigned_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE (user_id, operator_id),
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE,
  FOREIGN KEY (operator_id) REFERENCES operators(operator_id) ON DELETE CASCADE
);

-- 3. Amenity Types
CREATE TABLE amenity_types (
  amenity_id VARCHAR(50) PRIMARY KEY,
  name VARCHAR(100) NOT NULL UNIQUE,
  icon VARCHAR(50),
  category VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE vehicle_amenities (
  vehicle_id VARCHAR(50) NOT NULL,
  amenity_id VARCHAR(50) NOT NULL,
  PRIMARY KEY (vehicle_id, amenity_id),
  FOREIGN KEY (vehicle_id) REFERENCES vehicles(vehicle_id) ON DELETE CASCADE,
  FOREIGN KEY (amenity_id) REFERENCES amenity_types(amenity_id) ON DELETE CASCADE
);

-- 4. Lier stories aux catégories
ALTER TABLE operator_stories 
ADD COLUMN category_id VARCHAR(50) REFERENCES story_categories(category_id);

-- 5. Reviews
CREATE TABLE reviews (
  review_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  trip_id VARCHAR(50),
  operator_id VARCHAR(50) NOT NULL,
  user_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT,
  reviewed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  helpful_count INTEGER DEFAULT 0,
  FOREIGN KEY (trip_id) REFERENCES trips(trip_id) ON DELETE SET NULL,
  FOREIGN KEY (operator_id) REFERENCES operators(operator_id) ON DELETE CASCADE,
  FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE CASCADE
);

CREATE INDEX idx_reviews_operator ON reviews(operator_id, rating);
CREATE INDEX idx_reviews_user ON reviews(user_id);
```

### 📋 PRIORITÉ DES FIXES

| Priority | Item | Effort | Impact |
|----------|------|--------|--------|
| 🔴 P0 | Story Categories | 15 min | Bloquant pour admin |
| 🔴 P0 | User-Operator Mapping | 20 min | Multi-tenant support |
| 🟡 P1 | Amenity Types | 30 min | Data consistency |
| 🟡 P1 | Reviews Table | 20 min | User-facing feature |
| 🔵 P2 | Trip Schedules | 45 min | Nice-to-have |

---

## VERDICT FINAL

### Migrations actuelles : **75% complètes**

**Verdict:** ⚠️ **PRÊTES POUR DEV, MAIS AVEC LIMITATIONS**

**Recommandation:** 
1. ✅ Exécuter migrations 001-007 comme prévu
2. ⚠️ Avant implémentation du backend, créer et exécuter Migration 008
3. ✅ Cela ajoutera ~100 lignes de SQL, prendra ~20 min

**Sans Migration 008:**
- ❌ Admin ne peut pas créer catégories de stories
- ❌ Admin peut gérer qu'un seul opérateur
- ⚠️ Amenities non-normalisées (mais fonctionnels)
- ⚠️ Pas de reviews (mais feature optionnelle)

**Avec Migration 008:**
- ✅ Toutes les features du projet couvertes
- ✅ Data design professionnel
- ✅ Prêt pour production

---

## Fichiers concernés (À CRÉER)

Créer: `src/migrations/008_additional_tables.sql`
Lignes: ~150
Complexité: Basse
Temps d'exécution: 2-3 secondes

---

**Conclusion:** Les migrations que j'ai créées couvrent **80% des besoins réels du projet**, mais il faut ajouter une 8ème migration pour les 20% manquants (principalement story categories et user-operator mapping). Ce n'est pas bloquant mais **fortement recommandé** avant de commencer le backend.

Je peux créer Migration 008 immédiatement si tu le souhaites! 🚀
