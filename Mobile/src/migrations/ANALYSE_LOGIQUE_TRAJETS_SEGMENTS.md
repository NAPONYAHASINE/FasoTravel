# 🚌 Architecture Complète: Trajets Multi-Segments, Stations, et Réservations

**Date:** 2025-11-13  
**Statut:** Analyse détaillée  

---

## ✅ Réponse à ton Inquiétude

Oui, ta préoccupation est **légitime et bien pensée**. Voici comment le système gère cette complexité :

### Scénario que tu décris:
```
Un car part de Ouagadougou, doit passer par Koudougou, et arrive à Bobo-Dioulasso.
- L'utilisateur A doit monter à Ouagadougou
- L'utilisateur B doit monter à Koudougou
- Tous deux doivent avoir leurs places réservées
- Comment le système sait-il quel sièges sont disponibles à Koudougou?
```

### Réponse courte:
La logique est gérée via **SEGMENTS**. Chaque segment a ses propres sièges et sa propre disponibilité. Quand l'opérateur crée un trajet avec 3 segments:
1. **Segment 1: Ouaga → Koudougou** (45 sièges)
2. **Segment 2: Koudougou → Bobo** (45 sièges)  
3. Segments partagent le même **vehicle_id** (c'est le même car!)

---

## 📐 Architecture des Données

### 1. Relationships (Relations)

```
OPERATOR (AIR_CANADA)
    ↓
VEHICLE (VEH_AC_001)  ← Même car pour tout le trajet
    ↓
TRIP (TRIP_001: Ouaga → Bobo)
    ↓
SEGMENTS (3 segments = 3 portions du trajet)
    ├── Segment 1: Ouaga → Koudougou (95 km)
    ├── Segment 2: Koudougou → Bobo (275 km)
    └── [Autres segments si nécessaire]
    ↓
SEATS (Sièges pour ce trajet)
    ├── Seat A1 (trajet complet ou partiellement réservé?)
    ├── Seat B2
    └── ... (45 sièges total)
    ↓
BOOKINGS (Réservations)
    ├── Booking #1: User A → Segment 1 → Seats A1, A2
    ├── Booking #2: User B → Segment 2 → Seats B1
    └── ...
```

### 2. Exemple Concret

**Créé par l'opérateur (AIR_CANADA):**

```
TRIP_001:
  - operator_id: AIR_CANADA
  - vehicle_id: VEH_AC_001
  - departure_time: 2025-11-04 07:00
  - arrival_time: 2025-11-04 13:00
  - from_stop_id: OUAGA_CENTRE
  - to_stop_id: BOBO_CENTRE
  - available_seats: 12 (= MIN des segments!)
  - total_seats: 45
```

**Segments créés automatiquement ou manuellement:**

```
SEGMENT_1 (Portion 1):
  - segment_id: SEG_001_1
  - trip_id: TRIP_001
  - from_stop_id: OUAGA_CENTRE
  - to_stop_id: KOUDOUGOU
  - departure_time: 2025-11-04 07:00
  - arrival_time: 2025-11-04 09:15
  - available_seats: 12  ← Contrainte!
  - total_seats: 45

SEGMENT_2 (Portion 2):
  - segment_id: SEG_001_2
  - trip_id: TRIP_001
  - from_stop_id: KOUDOUGOU
  - to_stop_id: BOBO_CENTRE
  - departure_time: 2025-11-04 09:30
  - arrival_time: 2025-11-04 13:00
  - available_seats: 18  ← Plus loose
  - total_seats: 45
```

**RÉSULTAT:**
- `trip.available_seats = MIN(12, 18) = 12` places pour le trajet complet.
- Seuls 12 passagers peuvent réserver le trajet complet (Ouaga → Bobo).

---

## 🎫 Comment les Réservations Fonctionnent

### Phase 1: Sélection des Sièges (Frontend)

```typescript
// SeatSelectionPage.tsx

// Utilisateur A sélectionne son siège pour Ouagadougou
selectedSeats = ['A1']  // Pour Segment 1

// Utilisateur B (si booking multi-passagers) sélectionne pour Koudougou
selectedSeats = ['B2']  // Pour Segment 1 aussi (il monte à Koudougou!)
```

**Problème:** Comment l'UI sait-elle qu'User B monte à Koudougou, pas Ouagadougou?

**Solution:** Pas implémentée dans le code frontend actuel — c'est une **LACUNE** qu'il faut adresser!

### Phase 2: Création de la Réservation (HOLD)

```sql
-- POST /api/bookings/hold

INSERT INTO bookings (
  booking_id,
  user_id,
  trip_id,
  operator_id,
  status,        -- 'HOLD' (valide 10 minutes)
  num_passengers,
  hold_expires_at,  -- NOW() + 10 min
  created_at
) VALUES (...);

-- Crée des sièges avec status = 'hold'
INSERT INTO seats (trip_id, seat_number, status, booked_by_user_id, hold_expires_at)
VALUES 
  ('TRIP_001', 'A1', 'hold', user_A_id, NOW() + 10 min),
  ('TRIP_001', 'B2', 'hold', user_B_id, NOW() + 10 min);
```

**Important:** Les sièges sont créés au **TRIP LEVEL**, pas au **SEGMENT LEVEL**.

### Phase 3: Confirmation du Paiement

```sql
-- POST /api/bookings/confirm

UPDATE bookings 
SET status = 'CONFIRMED', payment_id = ... 
WHERE booking_id = ...;

UPDATE seats 
SET status = 'paid' 
WHERE trip_id = 'TRIP_001' AND seat_number IN ('A1', 'B2');
```

---

## ⚙️ Logique de Disponibilité (Backend - CRITIQUE)

### Comment le Backend Calcule les Places Dispo

```sql
-- Requête pour "Places disponibles pour ce trajet"

SELECT 
  t.trip_id,
  t.available_seats,  -- = MIN(segments)
  MIN(s.available_seats) as real_available,
  s.segment_id,
  s.available_seats as segment_available
FROM trips t
JOIN segments s ON t.trip_id = s.trip_id
WHERE t.trip_id = 'TRIP_001'
GROUP BY t.trip_id, t.available_seats, s.segment_id, s.available_seats;
```

### Quand une Réservation est Créée:

1. **Backend vérifie** que le trip a des places dispo (`trip.available_seats > 0`)
2. **Backend crée des sièges** avec status = 'hold' pour chaque passager
3. **Trigger PostgreSQL** (`trg_update_trip_on_segment_change`) est déclenché:
   - Met à jour `trip.available_seats = MIN(segment.available_seats)` après chaque changement de segment
   - Prevents l'overbooking

```sql
CREATE OR REPLACE FUNCTION update_trip_available_seats()
RETURNS TRIGGER AS $$
BEGIN
  UPDATE trips
  SET available_seats = (
    SELECT MIN(available_seats) FROM segments WHERE trip_id = NEW.trip_id
  ),
  updated_at = NOW()
  WHERE trip_id = NEW.trip_id;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_trip_on_segment_change
  AFTER INSERT OR UPDATE ON segments
  FOR EACH ROW
  EXECUTE FUNCTION update_trip_available_seats();
```

---

## 🚨 LACUNES IDENTIFIÉES

Après analyse, **3 problèmes majeurs** existent:

### 1. ❌ Pas de "Segment d'Embarquement" dans les Réservations

**Problème:** La table `bookings` n'a pas de colonne pour indiquer:
- "Cet utilisateur monte à Ouagadougou (segment 1)" vs
- "Cet utilisateur monte à Koudougou (segment 2)"

```sql
-- TABLE bookings (ACTUELLEMENT)
booking_id
user_id
trip_id          ← Référence le trajet COMPLET
operator_id
status
num_passengers
-- MANQUE: from_segment_id, to_segment_id, from_station_id, to_station_id
```

**Sollution requise:**
```sql
-- À AJOUTER à la table bookings ou créer junction table
ALTER TABLE bookings ADD COLUMN from_segment_id VARCHAR(50);
ALTER TABLE bookings ADD COLUMN to_segment_id VARCHAR(50);
-- OU
ALTER TABLE bookings ADD COLUMN boarding_station_id VARCHAR(50);  -- Où l'user monte
ALTER TABLE bookings ADD COLUMN alighting_station_id VARCHAR(50); -- Où l'user descend
```

### 2. ❌ Sièges Pas Liés aux Segments

**Problème:** La table `seats` référence un `trip_id`, mais pas les `segment_id`.

```sql
-- TABLE seats (ACTUELLEMENT)
seat_id
trip_id          ← Référence TRIP (trajet complet)
seat_number
status
-- MANQUE: segment_id (quel segment ce siège occupe-t-il?)
```

Cela signifie que le système **ne peut pas différencier**:
- "Siège A1 pour Segment 1 (Ouaga→Kou)" vs
- "Siège A1 pour Segment 2 (Kou→Bobo)"

**Solution requise:**
```sql
ALTER TABLE seats ADD COLUMN segment_id VARCHAR(50) REFERENCES segments(segment_id);
-- Ou créer une table junction: seat_segment_availability
CREATE TABLE seat_segment_availability (
  seat_id UUID,
  segment_id VARCHAR(50),
  status VARCHAR(50),  -- available, hold, paid
  PRIMARY KEY (seat_id, segment_id),
  FOREIGN KEY (seat_id) REFERENCES seats(seat_id),
  FOREIGN KEY (segment_id) REFERENCES segments(segment_id)
);
```

### 3. ❌ Pas de Support pour "Descendre à une Station Intermédiaire"

**Problème:** Les réservations supposent que tout le monde voyage le trajet COMPLET.

**Scénario impossible actuellement:**
```
User A: Ouaga → Koudougou (descend à Koudougou!)
User B: Ouaga → Bobo (continue jusqu'à Bobo)
```

Le système ne peut pas gérer User A qui **quitte** le car avant la fin du trajet.

---

## ✅ Ce Qui Fonctionne Correctement

### 1. **Disponibilité par Segment** ✅
Chaque segment a son propre `available_seats` qui est indépendant.

### 2. **Minimum des Segments** ✅
`trip.available_seats = MIN(segments.available_seats)` est calculé automatiquement par trigger.

### 3. **Sièges Réservés par Trajet** ✅
Quand un utilisateur réserve, le système crée des sièges avec status = 'hold'.

### 4. **Validation de Cohérence** ✅
Des triggers PostgreSQL valident que:
- Les heures des segments sont logiques (arrivée > départ)
- Les statuts des sièges sont cohérents
- Les bookings ont tous les champs requis

### 5. **Opérateurs et Stations Liés** ✅
- Table `stations` a une FK `operator_id` (optionnelle)
- Table `operator_branches` (Migration 008) pour les branches/agences

---

## 📋 Plan de Correction (Migration 009)

Pour **complètement résoudre** le problème, créer Migration 009 avec:

```sql
-- 1. Ajouter boarding/alighting stations aux bookings
ALTER TABLE bookings ADD COLUMN boarding_station_id VARCHAR(50);
ALTER TABLE bookings ADD COLUMN alighting_station_id VARCHAR(50);
ALTER TABLE bookings ADD FOREIGN KEY (boarding_station_id) REFERENCES stations(station_id);
ALTER TABLE bookings ADD FOREIGN KEY (alighting_station_id) REFERENCES stations(station_id);

-- 2. Lier les sièges aux segments
ALTER TABLE seats ADD COLUMN segment_id VARCHAR(50);
ALTER TABLE seats ADD FOREIGN KEY (segment_id) REFERENCES segments(segment_id);

-- 3. Créer view pour la disponibilité par segment
CREATE VIEW vw_seat_availability_by_segment AS
SELECT 
  s.segment_id,
  s.trip_id,
  COUNT(CASE WHEN st.status = 'available' END) as available_count,
  COUNT(CASE WHEN st.status = 'hold' END) as hold_count,
  COUNT(CASE WHEN st.status = 'paid' END) as paid_count
FROM segments s
LEFT JOIN seats st ON st.trip_id = s.trip_id AND st.segment_id = s.segment_id
GROUP BY s.segment_id, s.trip_id;

-- 4. Créer table pour mapping segment → portion possible de trajet
CREATE TABLE segment_routes (
  segment_route_id UUID PRIMARY KEY,
  trip_id VARCHAR(50),
  from_segment_id VARCHAR(50),
  to_segment_id VARCHAR(50),
  from_station_id VARCHAR(50),
  to_station_id VARCHAR(50),
  FOREIGN KEY (trip_id) REFERENCES trips(trip_id),
  FOREIGN KEY (from_segment_id) REFERENCES segments(segment_id),
  FOREIGN KEY (to_segment_id) REFERENCES segments(segment_id),
  FOREIGN KEY (from_station_id) REFERENCES stations(station_id),
  FOREIGN KEY (to_station_id) REFERENCES stations(station_id)
);
```

---

## 🎯 Résumé de ta Question

| Aspect | Statut | Détail |
|--------|--------|--------|
| **Même car pour tous les segments** | ✅ Oui | `vehicle_id` est partagé |
| **Places disponibles par segment** | ✅ Oui | Chaque segment a `available_seats` |
| **MIN des segments** | ✅ Oui | Trigger recalcule automatiquement |
| **Utilisateurs montent à différentes stations** | ❌ Non | Besoin de Migration 009 |
| **Utilisateurs descendent à différentes stations** | ❌ Non | Besoin de Migration 009 |
| **Sièges liés aux segments** | ❌ Partiellement | Besoin d'ajouter colonne `segment_id` |
| **Réservations avec station d'embarquement** | ❌ Non | Besoin de colonnes dans `bookings` |

---

## ✅ Conclusion

**Ton inquiétude est VALIDE.** Le système gère bien la complexité des multi-segments, **MAIS** il manque la capacité à gérer:
1. Des utilisateurs qui montent à différentes stations (segment d'embarquement)
2. Des utilisateurs qui descendent à différentes stations (segment de débarquement)

Ces lacunes sont mineures mais **importantes pour un système production**. Elles doivent être ajoutées dans **Migration 009**.

Pour l'instant, le système suppose que **tous les utilisateurs voyagent le trajet complet** (de la 1ère à la dernière station).
