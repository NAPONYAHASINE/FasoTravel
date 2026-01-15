# 📋 Modélisation BD Required - Services & Extras

## 🎯 Problème Identifié

Le prix du bagage est hardcodé à 1500 FCFA dans TripDetailPage.tsx, mais:
- ✗ Les bagages doivent être configurés par l'opérateur
- ✗ Il n'y a pas de modèle BD pour les services/extras
- ✗ Le calcul du prix ne prend pas en compte les bagages correctement

## 📊 Modèles à Ajouter

### Table: `operator_services`

**Objectif:** Stocker les services/extras proposés par chaque opérateur (bagage, repas, etc.)

```sql
CREATE TABLE operator_services (
  service_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operator_id UUID NOT NULL REFERENCES operators(operator_id),
  service_name VARCHAR(255) NOT NULL,
  description TEXT,
  service_type ENUM('BAGGAGE', 'MEAL', 'SEAT_UPGRADE', 'OTHER'),
  price_per_unit DECIMAL(10, 2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'XOF',
  is_active BOOLEAN DEFAULT true,
  max_quantity_per_booking INTEGER,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(operator_id, service_name)
);

-- Index
CREATE INDEX idx_operator_services_operator ON operator_services(operator_id);
```

**Exemple données:**
```sql
INSERT INTO operator_services (operator_id, service_name, service_type, price_per_unit) VALUES
('op_001', 'Bagage supplémentaire', 'BAGGAGE', 1500),
('op_001', 'Repas inclus', 'MEAL', 2000),
('op_002', 'Bagage supplémentaire', 'BAGGAGE', 2000),
('op_002', 'Meilleur siège', 'SEAT_UPGRADE', 5000);
```

---

### Table: `booking_services` (Réservations services)

**Objectif:** Associer les services achetés à chaque réservation/ticket

```sql
CREATE TABLE booking_services (
  booking_service_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id UUID NOT NULL REFERENCES bookings(booking_id),
  ticket_id UUID REFERENCES tickets(ticket_id),
  service_id UUID NOT NULL REFERENCES operator_services(service_id),
  quantity INTEGER DEFAULT 1,
  unit_price DECIMAL(10, 2) NOT NULL,
  total_price DECIMAL(10, 2) NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  FOREIGN KEY (booking_id, ticket_id) REFERENCES booking_passengers(booking_id, ticket_id)
);

-- Index
CREATE INDEX idx_booking_services_booking ON booking_services(booking_id);
CREATE INDEX idx_booking_services_ticket ON booking_services(ticket_id);
```

---

### Modification: `bookings` table

**Ajouter colonne pour total des services:**

```sql
ALTER TABLE bookings ADD COLUMN services_total DECIMAL(10, 2) DEFAULT 0;

-- Vue utile pour totaliser les prix
ALTER TABLE bookings ADD COLUMN price_breakdown JSONB DEFAULT '{
  "base_price": 0,
  "services_price": 0,
  "taxes": 0,
  "total": 0
}'::jsonb;
```

---

## 📱 Types TypeScript à Ajouter

```typescript
// /data/models.ts

export enum ServiceType {
  BAGGAGE = 'BAGGAGE',
  MEAL = 'MEAL',
  SEAT_UPGRADE = 'SEAT_UPGRADE',
  OTHER = 'OTHER'
}

export interface OperatorService {
  service_id: string;
  operator_id: string;
  service_name: string;
  description?: string;
  service_type: ServiceType;
  price_per_unit: number;
  currency: string;
  is_active: boolean;
  max_quantity_per_booking?: number;
  created_at: string;
  updated_at: string;
}

export interface BookingService {
  booking_service_id: string;
  booking_id: string;
  ticket_id?: string;
  service_id: string;
  service_name: string;  // Pour affichage facile
  quantity: number;
  unit_price: number;
  total_price: number;
  created_at: string;
}

// Modifier Trip interface
export interface Trip {
  // ... existing fields ...
  available_services?: OperatorService[];  // Services disponibles pour ce trajet
  base_price: number;
}

// Modifier Booking interface
export interface Booking {
  // ... existing fields ...
  booking_services?: BookingService[];
  services_total: number;  // Somme des prix des services
  price_breakdown: {
    base_price: number;
    services_price: number;
    taxes: number;
    total: number;
  };
}
```

---

## 🔄 Flux de Données Proposé

### Frontend: TripDetailPage.tsx

```typescript
// 1. Récupérer les services disponibles pour ce trajet/opérateur
const availableServices = trip.available_services || [];

// 2. Trouver le service "Bagage" pour afficher le prix dynamique
const baggageService = availableServices.find(s => s.service_type === 'BAGGAGE');
const baggagePrice = baggageService?.price_per_unit || 0;

// 3. Calculer le prix total (base + services)
const servicesPrice = selectedBaggage ? baggagePrice : 0;
const totalPrice = (trip.base_price * passengers) + servicesPrice;

// 4. À la création de la réservation, envoyer:
{
  trip_id: tripId,
  passengers: passengers,
  selected_services: selectedBaggage ? [{
    service_id: baggageService.service_id,
    quantity: passengers,  // 1 bagage par passager
    total_price: baggagePrice * passengers
  }] : [],
  total_price: totalPrice
}
```

### Backend: Booking Creation

```typescript
// 1. Valider que les services existent et sont actifs
// 2. Calculer les prix réels depuis la DB (pas du frontend)
// 3. Créer les entrées booking_services
// 4. Mettre à jour bookings.services_total
// 5. Mettre à jour bookings.price_breakdown
```

---

## 🎯 Impact sur le Code Frontend

### Fichiers à Modifier:

1. **`/data/models.ts`**
   - ✅ Ajouter `OperatorService` interface
   - ✅ Ajouter `BookingService` interface
   - ✅ Modifier `Trip` pour inclure `available_services`
   - ✅ Modifier `Booking` pour inclure services

2. **`/pages/TripDetailPage.tsx`**
   - ✅ Récupérer les services depuis `trip.available_services`
   - ✅ Afficher le prix dynamique du bagage (pas hardcodé 1500)
   - ✅ Calculer le total correctement: `base_price + services`
   - ✅ Passer les services à la création de réservation

3. **`/pages/PaymentPage.tsx`** (si existe)
   - ✅ Afficher le breakdown des prix
   - ✅ Montrer base_price, services_price, total

4. **`/lib/api.ts`**
   - ✅ `getOperatorServices(operatorId)` - Récupérer les services
   - ✅ `getTripServices(tripId)` - Récupérer services du trajet
   - ✅ Passer services_id dans `createBooking()`

---

## ⏱️ Timeline Implémentation

### Phase 1: BD (Backend)
```
1. Migration SQL: Créer tables operator_services et booking_services
2. Modifier booking pour ajouter services_total et price_breakdown
3. Tester avec données exemple
→ Temps estimé: 2-3 heures
```

### Phase 2: API Backend
```
1. GET /operators/:id/services - Lister les services d'un opérateur
2. GET /trips/:id/services - Lister les services pour un trajet
3. POST /bookings - Ajouter validation services
4. POST /bookings/:id/services - Ajouter un service à une réservation
→ Temps estimé: 3-4 heures
```

### Phase 3: Frontend
```
1. Mettre à jour models TypeScript
2. Refactoriser TripDetailPage avec services dynamiques
3. Afficher prix correct (base + services)
4. Tester calcul des prix
→ Temps estimé: 2-3 heures
```

---

## 📝 Checklist Complète

### BD (SQLAlchemy/Alembic)
- [ ] Créer migration pour operator_services
- [ ] Créer migration pour booking_services
- [ ] Ajouter colonnes à bookings
- [ ] Ajouter indexes
- [ ] Tester migrations
- [ ] Insérer données exemple

### Backend API
- [ ] Créer modèle SQLAlchemy OperatorService
- [ ] Créer modèle SQLAlchemy BookingService
- [ ] Créer route GET /operators/:id/services
- [ ] Créer route GET /trips/:id/services
- [ ] Modifier POST /bookings pour valider services
- [ ] Tester endpoints avec Postman

### Frontend
- [ ] Ajouter types TypeScript
- [ ] Modifier TripDetailPage pour services dynamiques
- [ ] Corriger calcul du prix total
- [ ] Afficher prix du bagage dynamiquement
- [ ] Tester avec différents opérateurs
- [ ] Valider calcul du total

---

## 🚀 QUICK FIX (Avant d'implémenter la BD complète)

Pour corriger immédiatement le problème dans TripDetailPage:

```typescript
// 1. Passer le prix du bagage depuis l'Operator ou Trip
const baggagePrice = trip.baggage_price || 1500;  // Fallback pour dev

// 2. Corriger le calcul du prix
const totalPrice = (trip.base_price * passengers) + (selectedBaggage ? baggagePrice : 0);

// 3. Afficher le breakdown
<div>
  <p>Prix base: {(trip.base_price * passengers).toLocaleString()} FCFA</p>
  {selectedBaggage && (
    <p>Bagages: {(baggagePrice * passengers).toLocaleString()} FCFA</p>
  )}
  <p className="font-bold">Total: {totalPrice.toLocaleString()} FCFA</p>
</div>
```

---

## 📌 Conclusion

**Il faut modéliser:**
1. `operator_services` - Les services proposés par l'opérateur
2. `booking_services` - Les services achetés avec une réservation
3. Ajouter breakdown des prix dans `bookings`

**Cela garantit:**
- ✅ Prix du bagage géré par l'opérateur (pas hardcodé)
- ✅ Plusieurs types de services (pas juste bagage)
- ✅ Calcul des prix correct et transparent
- ✅ Historique des services achetés
