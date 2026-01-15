# ✅ Vérification: Relations Operators ↔ Stations

**Date:** 2025-11-13  
**Statut:** Vérifié et amélioré

---

## Résumé

✅ **OUI** — Les tables `operators` et `stations` sont correctement liées via une **foreign key**.

---

## Détails Techniques

### 1. Architecture de la Relation

```
operators (1)
    ↓ (1:N relationship)
stations (N)
```

**Table `operators` (003_create_core_schema.sql, ligne 64-83)**
- PK: `operator_id VARCHAR(50)`
- N'a PAS de colonne qui référence `stations` (correct — évite dénormalisation)
- Les opérateurs sont des entités indépendantes

**Table `stations` (003_create_core_schema.sql, ligne 93-114)**
- PK: `station_id VARCHAR(50)`
- FK: `operator_id VARCHAR(50)` → NULLABLE
- Constraint: `FOREIGN KEY (operator_id) REFERENCES operators(operator_id) ON DELETE SET NULL`
- Cela signifie : une station **peut optionnellement être liée à un opérateur**

### 2. Index (Performance)

**Avant (Migration 003):**
```sql
CREATE INDEX idx_stations_city ON stations(city);
CREATE INDEX idx_stations_location ON stations(latitude, longitude);
CREATE INDEX idx_stations_active ON stations(is_active) WHERE is_active = true;
```

**Améliorations apportées:**
- ✅ **AJOUTÉ** : `CREATE INDEX idx_stations_operator ON stations(operator_id);`
  - Permet des requêtes rapides : "Quelles stations gère l'opérateur X ?"
  - Exemple : `SELECT * FROM stations WHERE operator_id = 'AIR_CANADA'` sera très rapide

### 3. Seed Data (Migration 005)

**État actuel:**
```sql
INSERT INTO stations (station_id, name, city, latitude, longitude, is_active, created_at, updated_at)
VALUES 
  ('OUAGA_CENTRE', 'Gare Routière Centrale', 'Ouagadougou', 12.3714, -1.5197, true, NOW(), NOW()),
  ('BOBO_CENTRE', 'Gare Routière Bobo-Dioulasso', 'Bobo-Dioulasso', 11.1773, -4.2972, true, NOW(), NOW()),
  -- ... (7 stations au total)
```

**Observation:** Les stations sont créées **sans `operator_id`** (NULL pour tous) → toutes sont des stations **publiques/neutres**.

**Décision:** C'est une approche valide si les stations sont partagées par tous les opérateurs. Mais pour un système multi-opérateur réaliste, il faudrait lier les stations à des opérateurs via `operator_branches` (voir ci-dessous).

---

## Deux Approches Possibles

### Approche A: Stations Publiques (Actuellement implémentée)

Toutes les stations sont des points de passage publics, aucun opérateur n'en est "propriétaire":

```sql
-- Stations (publiques)
OUAGA_CENTRE → operator_id = NULL
BOBO_CENTRE → operator_id = NULL
KOUDOUGOU → operator_id = NULL

-- Trajets (utilisent les stations publiques)
TRIP_001: OUAGA_CENTRE → BOBO_CENTRE (Air Canada)
TRIP_002: OUAGA_CENTRE → BOBO_CENTRE (Scoot)
```

✅ **Avantage:** Simple, flexible, stations neutres  
❌ **Inconvénient:** Impossible de savoir où "basé" l'opérateur, pas de concept de "bureau/branche"

### Approche B: Opérateurs avec Branches/Stations (Migration 008)

Chaque opérateur a ses propres bureaux/stations via la table `operator_branches`:

```sql
-- Stations (peuvent avoir des opérateurs)
OUAGA_CENTRE → operator_id = NULL (public)
BOBO_CENTRE → operator_id = NULL (public)

-- Branches d'opérateurs
operator_branches:
  - Air Canada → Branch "Ouagadougou" (station_id = OUAGA_CENTRE, manager = user_X)
  - Air Canada → Branch "Bobo" (station_id = BOBO_CENTRE, manager = user_Y)
  - Scoot → Branch "Ouagadougou" (station_id = OUAGA_CENTRE, manager = user_Z)

-- Avantage: Chaque opérateur peut avoir plusieurs branches à la même station
```

✅ **Avantage:** Réaliste (ex: 2 agences Air Canada à Ouagadougou, une à Bobo)  
✅ **Avantage:** Support pour "manager par branche"  
❌ **Inconvénient:** Plus de complexity (table `operator_branches` requise)

---

## Recommandation

**Migration 008 ajoutée (`operator_branches`)** résout ce problème — c'est l'Approche B, qui est plus réaliste et scalable.

**Plan d'action:**

1. ✅ Exécuter Migration 008 (`008_additional_tables.sql`) pour créer la table `operator_branches`
2. ✅ Index sur `stations.operator_id` ajouté à Migration 003
3. ⏳ Ajouter du seed data pour `operator_branches` dans une future migration (Migration 009 ou nouvelle migration de seed)

---

## Requêtes SQL Utiles

**Obtenir les stations d'un opérateur (via branches):**
```sql
SELECT DISTINCT s.* 
FROM stations s
INNER JOIN operator_branches ob ON s.station_id = ob.station_id
WHERE ob.operator_id = 'AIR_CANADA' AND ob.is_active = true;
```

**Obtenir les branches d'un opérateur:**
```sql
SELECT ob.*, s.name as station_name, s.city
FROM operator_branches ob
LEFT JOIN stations s ON ob.station_id = s.station_id
WHERE ob.operator_id = 'AIR_CANADA' AND ob.is_active = true;
```

**Obtenir le nombre de trajets par opérateur ET par branche:**
```sql
SELECT 
  ob.operator_id, 
  ob.branch_id,
  s.city,
  COUNT(t.trip_id) as trip_count
FROM operator_branches ob
LEFT JOIN stations s ON ob.station_id = s.station_id
LEFT JOIN trips t ON t.operator_id = ob.operator_id
  AND t.from_stop_id = s.station_id
WHERE ob.is_active = true
GROUP BY ob.operator_id, ob.branch_id, s.city;
```

---

## Checklist

- ✅ Table `stations` existe avec `operator_id` FK nullable
- ✅ Constraint `FOREIGN KEY (operator_id) REFERENCES operators(operator_id)` implémentée
- ✅ Index `idx_stations_operator` ajouté à Migration 003
- ✅ Table `operator_branches` créée dans Migration 008
- ⏳ Seed data pour `operator_branches` (planifié pour Migration 009 ou future)
- ⏳ Endpoints backend pour CRUD `operator_branches`
- ⏳ UI frontend pour créer/gérer les branches lors de la création d'opérateur

---

## Conclusion

✅ **La relation operators ↔ stations est correctement implémentée.**

Le système supporte actuellement:
1. **Stations publiques** (operator_id = NULL) — partagées par tous
2. **Stations liées à des opérateurs** (operator_id = 'X') — si remplies ultérieurement

Pour un système multi-opérateur complet:
- Migration 008 ajoute `operator_branches` pour représenter les bureaux/agences d'un opérateur
- Cela permet à chaque opérateur d'avoir N branches à N stations
- Un index sur `stations.operator_id` optimise les recherches

✅ **Prêt à avancer vers l'implémentation des endpoints backend et du frontend.**
