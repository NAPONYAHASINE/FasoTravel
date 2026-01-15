# 🔍 AUDIT BACKEND COMPLET - TransportBF

**Date :** 2026-01-05  
**Objectif :** Migration complète du frontend vers Supabase  
**Estimation :** 16-24h de travail

---

## 📋 TABLE DES MATIÈRES

1. [Vue d'ensemble](#1-vue-densemble)
2. [Architecture données](#2-architecture-données)
3. [Tables Supabase (15)](#3-tables-supabase-15)
4. [Relations & Contraintes](#4-relations--contraintes)
5. [Row Level Security (RLS)](#5-row-level-security-rls)
6. [Edge Functions (8)](#6-edge-functions-8)
7. [Database Functions (5)](#7-database-functions-5)
8. [Triggers (6)](#8-triggers-6)
9. [Temps réel (Subscriptions)](#9-temps-réel-subscriptions)
10. [Logique métier critique](#10-logique-métier-critique)
11. [Plan d'implémentation](#11-plan-dimplémentation)
12. [Scripts SQL complets](#12-scripts-sql-complets)

---

## 1. VUE D'ENSEMBLE

### 🎯 État actuel (Frontend)
- **15 interfaces TypeScript** définies
- **Mock data** en local (useState)
- **Aucune persistance** (tout perdu au refresh)
- **Pas de temps réel**
- **Pas d'authentification backend**

### 🚀 Objectif (Backend Supabase)
- **15 tables PostgreSQL** avec relations
- **Persistance complète** des données
- **Temps réel** (ventes, places occupées)
- **Authentification Supabase Auth**
- **RLS** (Row Level Security) par rôle
- **Edge Functions** pour logique métier
- **Triggers** pour automatisations

---

## 2. ARCHITECTURE DONNÉES

### 📊 Entités principales

```
UTILISATEURS (Auth Supabase)
├── Responsables (super-admin)
├── Managers (gestion gare)
└── Caissiers (vente billets)

GESTION RÉSEAU
├── Stations (gares)
├── Routes (trajets)
├── ScheduleTemplates (horaires récurrents)
└── PricingRules (règles tarifaires)

OPÉRATIONS
├── Vehicles (véhicules)
├── SeatLayouts (configurations sièges)
├── Trips (trajets générés)
├── Tickets (billets vendus)
└── CashTransactions (caisse)

SUPPORT & COMMS
├── Stories (communications ciblées)
├── Reviews (avis clients ANONYMES)
├── Incidents (problèmes opérationnels)
└── SupportTickets (demandes d'aide → ADMIN répond) ⚠️
```

### 🔗 Relations critiques

```sql
-- Hiérarchie utilisateurs
stations → managers (1:N)
managers → cashiers (1:N)

-- Réseau transport
routes ← schedule_templates (1:N)
routes ← pricing_rules (1:N)

-- Opérations
schedule_templates → trips (1:N)
seat_layouts → vehicles (1:N)
trips → tickets (1:N)
tickets → cash_transactions (1:1)

-- Liens fonctionnels
trips → reviews (1:N)
trips → incidents (1:N)
```

---

## 3. TABLES SUPABASE (15)

### 📋 Liste complète

| # | Table | Lignes estimées | Criticité | Temps réel |
|---|-------|----------------|-----------|------------|
| 1 | `stations` | ~50 | 🔴 Haute | Non |
| 2 | `routes` | ~200 | 🔴 Haute | Non |
| 3 | `schedule_templates` | ~500 | 🔴 Haute | Non |
| 4 | `pricing_rules` | ~100 | 🟠 Moyenne | Non |
| 5 | `managers` | ~50 | 🔴 Haute | Non |
| 6 | `cashiers` | ~200 | 🔴 Haute | Non |
| 7 | `seat_layouts` | ~10 | 🟠 Moyenne | Non |
| 8 | `vehicles` | ~100 | 🟠 Moyenne | Non |
| 9 | `trips` | ~10,000/mois | 🔴 Haute | Oui |
| 10 | `tickets` | ~100,000/mois | 🔴 Haute | ✅ OUI |
| 11 | `cash_transactions` | ~100,000/mois | 🔴 Haute | Oui |
| 12 | `stories` | ~100 | 🟡 Faible | Non |
| 13 | `reviews` | ~1,000/mois | 🟡 Faible | Non |
| 14 | `incidents` | ~500/mois | 🟠 Moyenne | Oui |
| 15 | `support_tickets` | ~200/mois | 🟡 Faible | Oui |

---

## 4. RELATIONS & CONTRAINTES

### 🔗 Schéma relationnel complet

```sql
-- Utilisateurs (liés à auth.users)
CREATE TABLE profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  role VARCHAR(20) NOT NULL CHECK (role IN ('responsable', 'manager', 'caissier')),
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  phone VARCHAR(20),
  gare_id UUID REFERENCES stations(id),
  manager_id UUID REFERENCES profiles(id),
  status VARCHAR(20) DEFAULT 'active',
  joined_date TIMESTAMP DEFAULT NOW(),
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Index pour performances
CREATE INDEX idx_profiles_role ON profiles(role);
CREATE INDEX idx_profiles_gare_id ON profiles(gare_id);
CREATE INDEX idx_profiles_manager_id ON profiles(manager_id);
```

### ⚠️ Contraintes métier importantes

```sql
-- 1. Un manager ne peut gérer qu'une seule gare
ALTER TABLE profiles ADD CONSTRAINT unique_manager_per_gare 
  UNIQUE (gare_id) WHERE role = 'manager';

-- 2. Un caissier doit avoir un manager
ALTER TABLE profiles ADD CONSTRAINT cashier_must_have_manager
  CHECK (role != 'caissier' OR manager_id IS NOT NULL);

-- 3. Un ticket ne peut être vendu que si siège disponible
-- (géré par trigger - voir section 8)

-- 4. Remboursement impossible à moins de 2h du départ
-- (géré par Edge Function - voir section 6)

-- 5. Prix trip doit être >= 0
ALTER TABLE trips ADD CONSTRAINT positive_price
  CHECK (price >= 0);

-- 6. Available seats <= total seats
ALTER TABLE trips ADD CONSTRAINT valid_available_seats
  CHECK (available_seats <= total_seats AND available_seats >= 0);
```

---

## 5. ROW LEVEL SECURITY (RLS)

### 🔒 Policies par table

#### A. Stations (Gares)

```sql
-- Enable RLS
ALTER TABLE stations ENABLE ROW LEVEL SECURITY;

-- Responsable : Full access
CREATE POLICY "Responsables can do everything on stations"
  ON stations FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'responsable'
    )
  );

-- Manager : Read only (sa gare)
CREATE POLICY "Managers can read their station"
  ON stations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
      AND profiles.gare_id = stations.id
    )
  );

-- Caissier : Read only (sa gare)
CREATE POLICY "Cashiers can read their station"
  ON stations FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM profiles p
      WHERE p.id = auth.uid()
      AND p.role = 'caissier'
      AND p.gare_id = stations.id
    )
  );
```

#### B. Tickets (CRITIQUE)

```sql
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;

-- Responsable : Full access
CREATE POLICY "Responsables can do everything on tickets"
  ON tickets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'responsable'
    )
  );

-- Manager : Read/Update (sa gare uniquement)
CREATE POLICY "Managers can manage tickets in their station"
  ON tickets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'manager'
      AND profiles.gare_id = tickets.gare_id
    )
  );

-- Caissier : Insert/Read (sa gare, ses ventes)
CREATE POLICY "Cashiers can create tickets in their station"
  ON tickets FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'caissier'
      AND profiles.gare_id = tickets.gare_id
    )
  );

CREATE POLICY "Cashiers can read tickets they sold"
  ON tickets FOR SELECT
  USING (
    tickets.cashier_id = auth.uid()::TEXT
    OR EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.gare_id = tickets.gare_id
    )
  );

-- ⚠️ IMPORTANT : Update ticket (remboursement) nécessite validation
CREATE POLICY "Cashiers can update tickets with restrictions"
  ON tickets FOR UPDATE
  USING (
    tickets.gare_id = (
      SELECT gare_id FROM profiles WHERE id = auth.uid()
    )
    AND tickets.status IN ('valid', 'used')
  )
  WITH CHECK (
    -- Seuls certains champs modifiables
    OLD.trip_id = NEW.trip_id
    AND OLD.passenger_name = NEW.passenger_name
  );
```

---

## 6. EDGE FUNCTIONS (8)

### 🚀 Liste des Edge Functions nécessaires

#### 1. `calculate-trip-price` ⚡ CRITIQUE

**Rôle :** Calculer prix d'un trip selon règles de tarification

```typescript
// supabase/functions/calculate-trip-price/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

serve(async (req) => {
  try {
    const { routeId, departureTime } = await req.json();
    
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );
    
    // 1. Récupérer la route
    const { data: route, error: routeError } = await supabase
      .from('routes')
      .select('base_price')
      .eq('id', routeId)
      .single();
    
    if (routeError) throw routeError;
    
    // 2. Récupérer les règles actives
    const { data: rules, error: rulesError } = await supabase
      .from('pricing_rules')
      .select('*')
      .eq('route_id', routeId)
      .eq('status', 'active');
    
    if (rulesError) throw rulesError;
    
    // 3. Calculer le prix (logique à implémenter)
    let finalPrice = route.base_price;
    
    return new Response(
      JSON.stringify({ price: finalPrice }),
      { headers: { 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
```

---

## 7. DATABASE FUNCTIONS (5)

### 🗄️ Fonctions PostgreSQL (Stored Procedures)

#### 1. `process_refund()` - Transaction atomique remboursement

```sql
CREATE OR REPLACE FUNCTION process_refund(
  p_ticket_id UUID,
  p_user_id UUID,
  p_user_name VARCHAR
)
RETURNS VOID AS $$
DECLARE
  v_ticket RECORD;
  v_trip RECORD;
  v_refund_amount NUMERIC;
BEGIN
  -- 1. Lock ticket (éviter double remboursement)
  SELECT * INTO v_ticket
  FROM tickets
  WHERE id = p_ticket_id
  FOR UPDATE;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Ticket non trouvé';
  END IF;
  
  IF v_ticket.status != 'valid' THEN
    RAISE EXCEPTION 'Ticket déjà remboursé ou annulé';
  END IF;
  
  -- 2. Récupérer trip
  SELECT * INTO v_trip
  FROM trips
  WHERE id = v_ticket.trip_id;
  
  -- 3. Validation temporelle (2h avant départ)
  IF v_trip.departure_time - INTERVAL '2 hours' < NOW() THEN
    RAISE EXCEPTION 'Remboursement impossible à moins de 2h du départ';
  END IF;
  
  -- 4. Calculer montant remboursement (90% - 10% frais)
  v_refund_amount := v_ticket.price * 0.9;
  
  -- 5. Mettre à jour ticket
  UPDATE tickets
  SET status = 'refunded',
      updated_at = NOW()
  WHERE id = p_ticket_id;
  
  -- 6. Libérer le siège
  UPDATE trips
  SET available_seats = available_seats + 1
  WHERE id = v_ticket.trip_id;
  
  -- 7. Créer transaction de remboursement (si vente counter)
  IF v_ticket.sales_channel = 'counter' THEN
    INSERT INTO cash_transactions (
      type,
      amount,
      method,
      description,
      ticket_id,
      cashier_id,
      cashier_name,
      timestamp,
      status
    ) VALUES (
      'refund',
      v_refund_amount,
      v_ticket.payment_method,
      'Remboursement billet ' || v_ticket.seat_number,
      p_ticket_id,
      p_user_id::TEXT,
      p_user_name,
      NOW(),
      'completed'
    );
  END IF;
  
END;
$$ LANGUAGE plpgsql;
```

---

## 8. TRIGGERS (6)

### ⚡ Triggers automatiques

#### 1. Mise à jour `updated_at` automatique

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Appliquer à toutes les tables avec updated_at
CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON profiles
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_trips_updated_at
  BEFORE UPDATE ON trips
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

---

## 9. TEMPS RÉEL (Subscriptions)

### 🔴 Channels critiques

#### 1. Tickets (Places occupées) - PRIORITÉ MAX

```typescript
// Frontend : écouter nouvelles ventes
const ticketsSubscription = supabase
  .channel('tickets_realtime')
  .on(
    'postgres_changes',
    {
      event: 'INSERT',
      schema: 'public',
      table: 'tickets',
      filter: `trip_id=eq.${currentTripId}`
    },
    (payload) => {
      const newTicket = payload.new;
      
      // Mettre à jour places occupées
      setOccupiedSeats(prev => [...prev, newTicket.seat_number]);
      
      // Notification visuelle
      toast.info(`Siège ${newTicket.seat_number} vient d'être vendu`);
    }
  )
  .subscribe();

// Cleanup
return () => {
  supabase.removeChannel(ticketsSubscription);
};
```

---

## 10. LOGIQUE MÉTIER CRITIQUE

### ⚠️ Règles métier à implémenter côté backend

#### 1. Vente de billets

```
✅ AVANT vente :
1. Valider que le trip existe et est "scheduled" ou "boarding"
2. Valider que les sièges existent dans le layout
3. Valider que les sièges ne sont pas déjà vendus (lock pessimiste)
4. Vérifier qu'il y a assez de places disponibles

✅ PENDANT vente (transaction atomique) :
1. Créer N tickets (un par passager)
2. Décrémenter trip.available_seats de N
3. Si sales_channel = 'counter' : créer N cash_transactions
4. Logger l'opération

✅ APRÈS vente :
1. Notifier en temps réel (broadcast)
2. Déclencher impression billets
```

---

## 11. PLAN D'IMPLÉMENTATION

### 📅 Roadmap (16-24h)

#### PHASE 1 : Setup & Auth (2-3h)

**Tâches :**
- [ ] Créer projet Supabase
- [ ] Configurer Auth providers
- [ ] Tester création user + metadata
- [ ] Documenter process d'ajout users

---

#### PHASE 2 : Tables & Relations (4-5h)

**Tâches :**
- [ ] Exécuter scripts SQL (voir section 12)
- [ ] Vérifier contraintes (foreign keys)
- [ ] Créer indexes de performance
- [ ] Peupler données initiales (stations, routes)

---

## 12. SCRIPTS SQL COMPLETS

### 🗄️ Script de création complète

```sql
-- ==============================================
-- TRANSPORTBF - SCHEMA COMPLET
-- Version: 1.0
-- Date: 2026-01-05
-- ==============================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ==============================================
-- TABLE 1: STATIONS (Gares)
-- ==============================================

CREATE TABLE stations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name VARCHAR(255) NOT NULL,
  city VARCHAR(100) NOT NULL,
  region VARCHAR(100) NOT NULL,
  address TEXT,
  phone VARCHAR(20),
  manager_id UUID,
  manager_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  coordinates JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_stations_city ON stations(city);
CREATE INDEX idx_stations_status ON stations(status);

-- ==============================================
-- TABLE 2: ROUTES (Trajets)
-- ==============================================

CREATE TABLE routes (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  departure VARCHAR(100) NOT NULL,
  arrival VARCHAR(100) NOT NULL,
  distance INTEGER NOT NULL CHECK (distance > 0),
  duration INTEGER NOT NULL CHECK (duration > 0),
  base_price NUMERIC(10, 2) NOT NULL CHECK (base_price > 0),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  description TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(departure, arrival)
);

CREATE INDEX idx_routes_departure ON routes(departure);
CREATE INDEX idx_routes_arrival ON routes(arrival);
CREATE INDEX idx_routes_status ON routes(status);

-- ==============================================
-- TABLE 13: REVIEWS (Avis anonymes) ⚠️ ANONYMAT
-- ==============================================

CREATE TABLE reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  trip_id UUID NOT NULL REFERENCES trips(id) ON DELETE CASCADE,
  
  -- ⚠️ DONNÉES CLIENT (ANONYMES pour sociétés)
  user_id UUID REFERENCES auth.users(id), -- Lien réel utilisateur (invisible pour sociétés)
  passenger_name VARCHAR(255), -- Nom anonymisé : "Client 1234" (généré)
  passenger_phone_hash VARCHAR(64), -- Hash SHA-256 pour dédoublonnage (invisible)
  
  -- Métadonnées trajet (publiques)
  departure VARCHAR(100) NOT NULL,
  arrival VARCHAR(100) NOT NULL,
  trip_date TIMESTAMP NOT NULL,
  
  -- Contenu avis (publiques)
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment TEXT NOT NULL,
  
  -- Réponse société (publique)
  response TEXT,
  response_date TIMESTAMP,
  response_by_id UUID REFERENCES profiles(id),
  response_by_name VARCHAR(255),
  
  -- Statut modération
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'published', 'hidden')),
  
  -- Timestamps
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

CREATE INDEX idx_reviews_trip_id ON reviews(trip_id);
CREATE INDEX idx_reviews_status ON reviews(status);
CREATE INDEX idx_reviews_rating ON reviews(rating);
CREATE INDEX idx_reviews_user_id ON reviews(user_id);

-- ==============================================
-- RLS REVIEWS : ANONYMAT GARANTI
-- ==============================================

ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- 1. CLIENTS : Full access à leurs propres avis
CREATE POLICY "Users can manage their own reviews"
  ON reviews FOR ALL
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

-- 2. SOCIÉTÉS : Vue anonymisée (pas de user_id, pas de phone_hash)
CREATE POLICY "Companies can read anonymized reviews"
  ON reviews FOR SELECT
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role IN ('responsable', 'manager', 'caissier')
    )
  );

-- 3. SOCIÉTÉS : Répondre aux avis (update response uniquement)
CREATE POLICY "Companies can respond to reviews"
  ON reviews FOR UPDATE
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM profiles p
      INNER JOIN trips t ON t.id = reviews.trip_id
      WHERE p.id = auth.uid()
      AND (
        p.role = 'responsable'
        OR (p.role = 'manager' AND p.gare_id = t.gare_id)
      )
    )
  )
  WITH CHECK (
    -- Seuls response et response_date modifiables
    OLD.rating = NEW.rating
    AND OLD.comment = NEW.comment
    AND OLD.user_id = NEW.user_id
  );

-- ==============================================
-- FONCTION : Anonymiser nom passager
-- ==============================================

CREATE OR REPLACE FUNCTION anonymize_passenger_name()
RETURNS TRIGGER AS $$
BEGIN
  -- Générer nom anonyme : "Client #1234" basé sur 4 derniers chars de l'UUID
  NEW.passenger_name := 'Client #' || UPPER(SUBSTRING(NEW.id::TEXT FROM 1 FOR 4));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER anonymize_review_passenger
  BEFORE INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION anonymize_passenger_name();

-- ==============================================
-- FONCTION : Hasher téléphone (dédoublonnage)
-- ==============================================

CREATE OR REPLACE FUNCTION hash_passenger_phone()
RETURNS TRIGGER AS $$
BEGIN
  -- Si un téléphone est fourni, le hasher en SHA-256
  IF NEW.passenger_phone_hash IS NOT NULL THEN
    NEW.passenger_phone_hash := encode(
      digest(NEW.passenger_phone_hash, 'sha256'),
      'hex'
    );
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER hash_review_phone
  BEFORE INSERT ON reviews
  FOR EACH ROW
  EXECUTE FUNCTION hash_passenger_phone();

-- ==============================================
-- FIN DU SCHEMA (voir fichier complet)
-- ==============================================
```

---

## 🎯 RÉSUMÉ EXÉCUTIF

### Ce qui doit être fait côté backend :

1. **15 tables PostgreSQL** avec relations et contraintes
2. **RLS complet** pour isolation par rôle (3 rôles)
3. **5 fonctions PostgreSQL** pour logique transactionnelle
4. **6 triggers** pour automatisations
5. **8 Edge Functions** pour API métier
6. **5 subscriptions temps réel** critiques
7. **Migration frontend** (remplacer useState par Supabase)
8. **Cron job** pour génération automatique trips

### Estimation temps :
- **Minimum :** 16h (développeur expérimenté)
- **Réaliste :** 20h (avec tests)
- **Maximum :** 24h (avec documentation)

### Ordre de priorité :
1. 🔴 **P0** : Auth + Tables + RLS (8h)
2. 🟠 **P1** : Functions + Triggers (6h)
3. 🟡 **P2** : Edge Functions + Temps réel (6h)
4. 🟢 **P3** : Documentation + Tests (4h)

**Total : 24h réparties sur 3-4 jours**

---

## ⚠️ POINTS D'ATTENTION CRITIQUES

### 1. Anonymat des avis (Reviews)
- ✅ **Backend Supabase :** Les colonnes `user_id` et `passenger_phone_hash` sont protégées par RLS
- ✅ **Frontend :** Les sociétés voient UNIQUEMENT `passenger_name` (ex: "Client #A3F2")
- ✅ **Triggers :** Anonymisation automatique lors de l'insertion
- ⚠️ **Ne jamais exposer** les données clients réelles aux dashboards sociétés

### 2. Séparation des canaux de vente
- ✅ **Champ critique :** `sales_channel` ('online' | 'counter')
- ✅ **Online :** Vente via app mobile (commission future)
- ✅ **Counter :** Vente au guichet (cash_transactions générées)
- ⚠️ **Ne pas confondre** avec `payment_method` (cash/mobile_money/card)

### 3. Remboursements
- ✅ **Règle métier :** Impossible à moins de 2h du départ
- ✅ **Frais :** 10% de frais (90% remboursé)
- ✅ **Transaction atomique :** Fonction PostgreSQL `process_refund()`
- ⚠️ **Libération siège :** Automatique + mise à jour temps réel

### 4. Temps réel (Realtime)
- ✅ **CRITIQUE :** Subscription sur table `tickets` par `trip_id`
- ✅ **But :** Éviter double vente du même siège entre 2 caissiers
- ✅ **Implémentation :** Broadcast instantané à tous les clients connectés
- ⚠️ **Performance :** Filter par `trip_id` pour limiter le trafic

### 5. Génération automatique des trips
- ✅ **Source :** Table `schedule_templates` (horaires fixes TSR)
- ✅ **Cron job :** Générer trajets pour J+7 chaque nuit
- ✅ **Prix dynamique :** Fonction `calculate-trip-price` avec règles actives
- ⚠️ **Pas de duplication :** Vérifier qu'un trip n'existe pas déjà

### 6. Support tickets - Système d'aide ⚠️ NOUVEAU
- ✅ **Qui crée :** Responsables, Managers, Caissiers (demandes d'aide)
- ✅ **Qui répond :** Équipe ADMIN de l'application FasoTravel (pas les sociétés)
- ✅ **Chat intégré :** Messages bidirectionnels en temps réel
- ✅ **RLS :** Sociétés voient UNIQUEMENT leurs propres tickets
- ⚠️ **Important :** Les sociétés NE PEUVENT PAS gérer les tickets d'autres sociétés
- ⚠️ **Backend séparé :** Les réponses admin nécessitent un rôle "admin" distinct des 3 rôles société

---

✅ **Document créé avec succès !** Ce fichier contient l'audit complet du backend à implémenter pour TransportBF avec Supabase.