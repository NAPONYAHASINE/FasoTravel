# 🚌 Architecture Correcte: Segments, Escales, et Progression du Car

**Date:** 2025-11-13  
**Correction:** Analyse réalignée sur la vraie logique  

---

## 📍 La Vraie Logique (comme tu l'as expliqué)

### Étape 1: Recherche (Frontend)
```
Utilisateur entre:
  - Départ: "Ouagadougou"
  - Arrivée: "Bobo-Dioulasso"
  - Date: 2025-11-04

Système retourne:
  - Trip_001 (Air Canada):
    - 07:00 Ouaga → 13:00 Bobo (direct? ou avec escales?)
    - 12 places disponibles
    - Segments:
      * Seg_1: 07:00-09:15 Ouaga→Kou (12 dispo / 45 total)
      * Seg_2: 09:30-13:00 Kou→Bobo (18 dispo / 45 total)
```

**IMPORTANT:** À ce stade, l'utilisateur **SAIT DÉJÀ**:
- Point de montée: Ouagadougou (Segment 1)
- Point de descente: Bobo-Dioulasso (Segment 2)
- Segments concernés: Segments 1 + 2

### Étape 2: Sélection de Sièges (Frontend)
```
Utilisateur sélectionne ses sièges:
  - Segment 1 (Ouaga→Kou): Siège A1
  - Segment 2 (Kou→Bobo): Siège A1 (même siège!)
  
ou

  - Segment 1: Siège A1
  - Segment 2: Siège B2 (changement de siège à Koudougou)
```

### Étape 3: Réservation (Backend doit faire)
```
1. Vérifier disponibilité sur TOUS les segments concernés
   - Segment 1: Place A1 disponible? OUI
   - Segment 2: Place A1 disponible? OUI
   → Réservation OK

2. Créer booking avec:
   - from_segment_id = Seg_1
   - to_segment_id = Seg_2
   - boarding_station_id = OUAGA_CENTRE
   - alighting_station_id = BOBO_CENTRE

3. Créer sièges avec:
   - seats pour Segment 1: A1 (status='HOLD')
   - seats pour Segment 2: A1 (status='HOLD')
   - LIEN: Ces deux sièges appartiennent à la MÊME reservation

4. Décrémenter available_seats:
   - Segment 1: 12 → 11
   - Segment 2: 18 → 17
   - Trip: 12 → 11 (MIN des segments)
```

### Étape 4: Progression du Car (Backend, temps réel)
```
Car quitte Ouagadougou à 07:00
  - Status: EN_ROUTE segment 1
  - Passagers à bord: [User_A (siège A1), ...]

Car arrive à Koudougou à 09:15
  - Status: STATION (escale 15 min)
  - User_A descend-il? NON (alighting_station = BOBO)
  
Car repart Koudougou à 09:30
  - Status: EN_ROUTE segment 2
  - Passagers à bord: [User_A (siège A1), User_B (nouveau, monte ici), ...]

Car arrive à Bobo-Dioulasso à 13:00
  - Status: ARRIVED
  - User_A descend-il? OUI (alighting_station = BOBO)
  - User_A quitte le car
```

---

## 🗄️ Structure DB Correcte (Ce qu'il faut)

### Table `trips`
```sql
trip_id VARCHAR(50) PRIMARY KEY,
operator_id VARCHAR(50),
vehicle_id VARCHAR(50),    -- MÊME car pour tout le trajet
from_stop_id VARCHAR(50),  -- Départ du trajet (Ouaga)
to_stop_id VARCHAR(50),    -- Arrivée du trajet (Bobo)
departure_time TIMESTAMP,
arrival_time TIMESTAMP,
available_seats INTEGER,   -- = MIN(segments.available_seats)
status VARCHAR(50),        -- SCHEDULED, IN_PROGRESS, ARRIVED, CANCELLED
current_segment_id VARCHAR(50),  -- ← IMPORTANT: Quel segment en cours?
current_station_id VARCHAR(50),  -- ← Quelle station actuellement?
```

### Table `segments`
```sql
segment_id VARCHAR(50) PRIMARY KEY,
trip_id VARCHAR(50),           -- FOREIGN KEY trips
sequence_number INTEGER,        -- 1, 2, 3, ... (ordre)
from_stop_id VARCHAR(50),
to_stop_id VARCHAR(50),
from_stop_name VARCHAR(255),
to_stop_name VARCHAR(255),
departure_time TIMESTAMP,
arrival_time TIMESTAMP,
available_seats INTEGER,        -- Places dispo SUR CE SEGMENT
total_seats INTEGER,
status VARCHAR(50),             -- SCHEDULED, IN_PROGRESS, COMPLETED, CANCELLED
```

### Table `bookings`
```sql
booking_id UUID PRIMARY KEY,
user_id UUID,
trip_id VARCHAR(50),
operator_id VARCHAR(50),
from_segment_id VARCHAR(50),    -- ← Segment où utilisateur MONTE
to_segment_id VARCHAR(50),      -- ← Segment où utilisateur DESCEND
boarding_station_id VARCHAR(50),
alighting_station_id VARCHAR(50),
status VARCHAR(50),
num_passengers INTEGER,
total_amount INTEGER,
```

### Table `seats` (Critique!)
```sql
seat_id UUID PRIMARY KEY,
trip_id VARCHAR(50),
segment_id VARCHAR(50),         -- ← IMPORTANT: Lier au segment!
seat_number VARCHAR(10),        -- A1, B2, etc.
status VARCHAR(50),             -- available, hold, paid
booked_by_booking_id UUID,      -- ← Lier à la réservation!
booked_by_user_id UUID,
hold_expires_at TIMESTAMP,
```

---

## ⚡ Ce Qui Doit Être Fait dans la DB

### 1. ✅ ID Unique par Trajet
**État:** ✅ Déjà fait (trip_id)

### 2. ⏳ Diviser les Trajets en Segments  
**État:** ✅ Déjà fait (segments table)
**À améliorer:** Ajouter `sequence_number`, `status`

### 3. ⏳ Tracker la Progression du Car (CRITIQUE!)
**État:** ❌ MANQUANT
**À ajouter:**
```sql
-- Colonnes à ajouter à TABLE trips:
ALTER TABLE trips ADD COLUMN current_segment_id VARCHAR(50);
ALTER TABLE trips ADD COLUMN current_station_id VARCHAR(50);
ALTER TABLE trips ADD COLUMN status VARCHAR(50) DEFAULT 'SCHEDULED';
ALTER TABLE trips ADD COLUMN last_location_update TIMESTAMP;
ALTER TABLE trips ADD COLUMN gps_latitude NUMERIC(10, 8);
ALTER TABLE trips ADD COLUMN gps_longitude NUMERIC(11, 8);

-- Colonnes à ajouter à TABLE segments:
ALTER TABLE segments ADD COLUMN status VARCHAR(50) DEFAULT 'SCHEDULED';
```

**Logique:**
```
Quand le car arrive à Koudougou:
  - UPDATE trips SET current_segment_id = 'SEG_002', current_station_id = 'KOUDOUGOU'
  - UPDATE segments SET status = 'COMPLETED' WHERE segment_id = 'SEG_001'
  - UPDATE segments SET status = 'IN_PROGRESS' WHERE segment_id = 'SEG_002'
```

### 4. ⏳ Éviter le Surbooking par Segment (CRITIQUE!)
**État:** ✅ Partiellement (available_seats par segment existe)
**À améliorer:**
```sql
-- Ajouter trigger qui vérifie:
-- Quand on crée une réservation avec from/to segments:
--   - Vérifier que TOUS les segments concernés ont des places

CREATE OR REPLACE FUNCTION validate_booking_segments_availability()
RETURNS TRIGGER AS $$
DECLARE
  seg RECORD;
BEGIN
  -- Pour chaque segment entre from et to
  FOR seg IN SELECT * FROM segments 
    WHERE trip_id = NEW.trip_id
    AND sequence_number >= (SELECT sequence_number FROM segments 
                           WHERE segment_id = NEW.from_segment_id)
    AND sequence_number <= (SELECT sequence_number FROM segments 
                           WHERE segment_id = NEW.to_segment_id)
  LOOP
    IF seg.available_seats < NEW.num_passengers THEN
      RAISE EXCEPTION 'Not enough seats on segment % (need %, have %)',
        seg.segment_id, NEW.num_passengers, seg.available_seats;
    END IF;
  END LOOP;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;
```

### 5. ⏳ Décroître Automatiquement les Places (CRITIQUE!)
**État:** ❌ MANQUANT
**À ajouter:**
```sql
-- Quand une réservation est créée (HOLD ou CONFIRMED):
CREATE OR REPLACE FUNCTION decrement_segment_available_seats()
RETURNS TRIGGER AS $$
DECLARE
  seg RECORD;
BEGIN
  -- Pour chaque segment concerné, décrémenter de num_passengers
  FOR seg IN SELECT * FROM segments 
    WHERE trip_id = NEW.trip_id
    AND sequence_number >= (SELECT sequence_number FROM segments 
                           WHERE segment_id = NEW.from_segment_id)
    AND sequence_number <= (SELECT sequence_number FROM segments 
                           WHERE segment_id = NEW.to_segment_id)
  LOOP
    UPDATE segments 
    SET available_seats = available_seats - NEW.num_passengers
    WHERE segment_id = seg.segment_id;
  END LOOP;
  
  -- Recalculer trip.available_seats = MIN
  UPDATE trips
  SET available_seats = (SELECT MIN(available_seats) FROM segments 
                        WHERE trip_id = NEW.trip_id)
  WHERE trip_id = NEW.trip_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrement_on_booking
  AFTER INSERT ON bookings
  FOR EACH ROW
  WHEN (NEW.status IN ('HOLD', 'CONFIRMED'))
  EXECUTE FUNCTION decrement_segment_available_seats();
```

### 6. ⏳ Afficher et Lier les Segments en Ordre
**État:** ⏳ Partiellement (segments existent mais pas de view pour affichage)
**À ajouter:**
```sql
-- View pour afficher le parcours complet d'un trajet
CREATE OR REPLACE VIEW vw_trip_full_route AS
SELECT 
  t.trip_id,
  t.operator_id,
  t.from_stop_id as start_station_id,
  t.to_stop_id as end_station_id,
  ARRAY_AGG(
    JSON_BUILD_OBJECT(
      'segment_id', s.segment_id,
      'sequence', s.sequence_number,
      'from_station', s.from_stop_name,
      'to_station', s.to_stop_name,
      'departure', s.departure_time,
      'arrival', s.arrival_time,
      'available_seats', s.available_seats,
      'status', s.status
    ) ORDER BY s.sequence_number
  ) as segments_route,
  t.available_seats,
  t.status as trip_status,
  t.current_segment_id
FROM trips t
LEFT JOIN segments s ON t.trip_id = s.trip_id
GROUP BY t.trip_id, t.operator_id, t.from_stop_id, t.to_stop_id, 
         t.available_seats, t.status, t.current_segment_id;

-- Query: Afficher un trajet avec tous ses segments dans l'ordre
SELECT * FROM vw_trip_full_route WHERE trip_id = 'TRIP_001';

-- Résultat:
{
  trip_id: 'TRIP_001',
  operator_id: 'AIR_CANADA',
  start_station_id: 'OUAGA_CENTRE',
  end_station_id: 'BOBO_CENTRE',
  segments_route: [
    {
      segment_id: 'SEG_001',
      sequence: 1,
      from_station: 'Ouagadougou',
      to_station: 'Koudougou',
      departure: '2025-11-04 07:00',
      arrival: '2025-11-04 09:15',
      available_seats: 11,  -- (après 1 réservation)
      status: 'SCHEDULED'
    },
    {
      segment_id: 'SEG_002',
      sequence: 2,
      from_station: 'Koudougou',
      to_station: 'Bobo-Dioulasso',
      departure: '2025-11-04 09:30',
      arrival: '2025-11-04 13:00',
      available_seats: 17,  -- (après 1 réservation)
      status: 'SCHEDULED'
    }
  ],
  trip_status: 'SCHEDULED',
  current_segment_id: null
}
```

---

## ✅ Checklist: Ce Qui Existe vs Ce Qui Manque

| Élément | Status | Notes |
|---------|--------|-------|
| **ID unique par trajet** | ✅ | `trip_id` |
| **Diviser en segments** | ✅ | Table `segments` existe |
| **Segments ordonnés** | ⏳ | `sequence_number` ajouté dans 009 |
| **Tracker progression du car** | ❌ | À ajouter: `current_segment_id`, `status` |
| **Éviter surbooking par segment** | ⏳ | Besoin trigger spécifique |
| **Décrémenter places par segment** | ❌ | À ajouter: Trigger `decrement_segment_available_seats` |
| **View route complète** | ❌ | À ajouter: `vw_trip_full_route` |
| **Sièges liés aux segments** | ⏳ | `segment_id` dans Migration 009 |
| **Sièges liés aux bookings** | ❌ | À ajouter: `booked_by_booking_id` dans table seats |

---

## 📋 Migration 010: Progression du Car et Décrémentation des Places

Nouvelle migration nécessaire pour compléter la logique:

**À créer:**
1. Ajouter colonnes à `trips`: `current_segment_id`, `current_station_id`, `status`, `gps_*`
2. Ajouter colonne à `segments`: `status`
3. Ajouter colonne à `seats`: `booked_by_booking_id`
4. Trigger: `validate_booking_segments_availability()` — Vérifier places sur tous segments
5. Trigger: `decrement_segment_available_seats()` — Décrémenter automatiquement
6. Trigger: `increment_segment_available_seats_on_cancel()` — Réincrémenter si annulation
7. View: `vw_trip_full_route` — Afficher route complète avec segments ordonnés

---

## 🎯 Résumé de Ta Compréhension (Correcte!)

✅ **ID unique par trajet** → Permet de tracker le même car  
✅ **Segments = escales** → Divise le trajet en portions  
✅ **Mise à jour progression** → Sait où est le car en temps réel  
✅ **Vérification dispo par segment** → Évite surbooking  
✅ **Reconstruction du parcours** → Peut afficher route complète  

**Tu as raison:** BEAUCOUP de travail DB est nécessaire, c'est l'épine dorsale du système.

Le frontend ne doit PAS implémenter cette logique complexe — c'est 100% du backend/DB.
