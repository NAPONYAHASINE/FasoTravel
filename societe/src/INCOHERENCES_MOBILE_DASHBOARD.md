# 🔄 INCOHÉRENCES Mobile ↔ Dashboard

**Date:** 19 Décembre 2025  
**Repos concernés:**
- 📱 Mobile: `github.com/NAPONYAHASINE/FasoTravel`
- 💻 Dashboard: Application actuelle

---

## ⚠️ RÉSUMÉ EXÉCUTIF

| Incohérence | Mobile | Dashboard | Priorité | Impact |
|-------------|--------|-----------|----------|--------|
| `Ticket.salesChannel` | ❌ Absent | ✅ Présent | 🔴 P0 | BLOQUANT |
| `Ticket.commission` | ❌ Absent | ✅ Présent | 🔴 P0 | BLOQUANT |
| `/config/business.ts` | ❌ Absent | ✅ Présent | 🔴 P0 | IMPORTANT |
| `calculateCommission()` | ❌ Absent | ✅ Présent | 🔴 P0 | IMPORTANT |
| `Ticket.paymentMethod` | String? | Union type | 🟡 P1 | Validation |
| `Ticket.purchaseDate` vs `bookingDate` | `bookingDate?` | `purchaseDate` | 🟡 P2 | Confusion |

**VERDICT:** 🔴 **4-6 incohérences bloquantes** entre Mobile et Dashboard

---

## 🔴 INCOHÉRENCE #1 : Champ `salesChannel` MANQUANT

### État Actuel

**Dashboard** ✅
```typescript
// /contexts/DataContext.tsx ligne 104
export interface Ticket {
  // ... autres champs
  salesChannel: 'online' | 'counter'; // ✅ CRITIQUE: online = app mobile, counter = guichet
  // ... autres champs
}
```

**Mobile** ❌
```typescript
// src/data/models.ts (probable)
export interface Ticket {
  // ... autres champs
  // ❌ salesChannel n'existe PAS
  // ... autres champs
}
```

### Problème

**Sans `salesChannel`, l'app mobile NE PEUT PAS :**
- Indiquer que la vente vient de l'app
- Déclencher le calcul de commission
- Se différencier des ventes guichet
- Tracker l'origine de la vente

### Solution Mobile

```typescript
// src/data/models.ts - AJOUTER
export interface Ticket {
  id: string;
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  seatNumber: string;
  price: number;
  
  // 🆕 AJOUTER CE CHAMP
  salesChannel: 'online' | 'counter';  // TOUJOURS 'online' pour app mobile
  
  commission?: number;  // Sera calculé par le backend
  paymentMethod: 'cash' | 'mobile_money' | 'card';
  status: 'valid' | 'used' | 'refunded' | 'cancelled';
  purchaseDate: string;
  // ... autres champs
}
```

```typescript
// src/pages/PaymentPage.tsx - UTILISATION
const handlePayment = async () => {
  const ticketData = {
    passengerName: form.name,
    passengerPhone: form.phone,
    seatNumber: selectedSeat,
    price: tripPrice,
    
    // 🆕 TOUJOURS 'online' pour l'app mobile
    salesChannel: 'online',
    
    // Commission sera calculée par le backend
    commission: undefined,
    
    paymentMethod: selectedPaymentMethod,
    status: 'valid',
    purchaseDate: new Date().toISOString(),
    // ... autres champs
  };
  
  await api.createTicket(ticketData);
};
```

---

## 🔴 INCOHÉRENCE #2 : Champ `commission` MANQUANT

### État Actuel

**Dashboard** ✅
```typescript
// /contexts/DataContext.tsx ligne 102
export interface Ticket {
  // ... autres champs
  commission?: number; // Commission prélevée si vente en ligne
  // ... autres champs
}
```

**Mobile** ❌
```typescript
// src/data/models.ts (probable)
export interface Ticket {
  // ... autres champs
  // ❌ commission n'existe PAS
  // ... autres champs
}
```

### Problème

**Sans `commission` :**
- ❌ Impossible de tracker les revenus FasoTravel
- ❌ Pas de transparence sur les frais
- ❌ Impossible de générer des rapports financiers
- ❌ Business model non fonctionnel

### Solution Mobile

```typescript
// src/data/models.ts - AJOUTER
export interface Ticket {
  // ... autres champs
  
  // 🆕 AJOUTER CE CHAMP
  commission?: number;  // Commission FasoTravel (calculée par backend)
  
  // ... autres champs
}
```

**Important:** La commission sera calculée **par le backend**, pas par le mobile.

```typescript
// Backend (futur)
app.post('/api/tickets', async (req, res) => {
  const ticketData = req.body;
  
  // Calculer la commission si vente online
  if (ticketData.salesChannel === 'online') {
    ticketData.commission = ticketData.price * BUSINESS_CONFIG.COMMISSION.RATE;
  }
  
  const ticket = await db.tickets.create(ticketData);
  res.json(ticket);
});
```

---

## 🔴 INCOHÉRENCE #3 : Fichier `/config/business.ts` MANQUANT

### État Actuel

**Dashboard** ✅
```typescript
// /config/business.ts - EXISTE
export const BUSINESS_CONFIG = {
  COMMISSION: {
    RATE: 0.05,           // 5% de commission
    MIN_AMOUNT: 100,      // Minimum 100 FCFA
    ENABLED: true,
    DESCRIPTION: 'Commission FasoTravel sur ventes app mobile',
  },
  
  CANCELLATION: {
    FULL_REFUND_HOURS: 24,
    PARTIAL_REFUND_HOURS: 12,
    PARTIAL_REFUND_PERCENT: 50,
    ADMIN_FEE: 500,
  },
  
  VEHICLE_CAPACITY: {
    STANDARD: 45,
    VIP: 35,
    MINIBUS: 25,
  },
};

export function calculateCommission(price: number): number {
  if (!BUSINESS_CONFIG.COMMISSION.ENABLED) return 0;
  
  const commission = price * BUSINESS_CONFIG.COMMISSION.RATE;
  return Math.max(commission, BUSINESS_CONFIG.COMMISSION.MIN_AMOUNT);
}
```

**Mobile** ❌
```typescript
// src/config/business.ts - N'EXISTE PAS
```

### Problème

**Sans config centralisée :**
- ❌ Règles métier éparpillées dans le code
- ❌ Difficile de maintenir la cohérence
- ❌ Impossible de changer les règles facilement
- ❌ Duplication de code

### Solution Mobile

```typescript
// 🆕 src/config/business.ts - CRÉER CE FICHIER
/**
 * Configuration Business FasoTravel
 * 
 * ⚠️ IMPORTANT: Ce fichier doit rester synchronisé avec le dashboard
 * Toute modification ici doit être répliquée côté dashboard et vice-versa.
 */

export const BUSINESS_CONFIG = {
  /**
   * Commission FasoTravel
   * Appliquée uniquement sur les ventes via l'app mobile (salesChannel: 'online')
   */
  COMMISSION: {
    RATE: 0.05,           // 5% de commission (à ajuster selon décision business)
    MIN_AMOUNT: 100,      // Minimum 100 FCFA
    ENABLED: false,       // ⚠️ Désactivé pour l'instant (phase de test)
    DESCRIPTION: 'Commission FasoTravel sur ventes app mobile',
  },
  
  /**
   * Politique d'annulation
   * Remboursement selon le délai avant le départ
   */
  CANCELLATION: {
    FULL_REFUND_HOURS: 24,        // Remboursement intégral si >24h avant départ
    PARTIAL_REFUND_HOURS: 12,     // Remboursement partiel si >12h avant départ
    PARTIAL_REFUND_PERCENT: 50,   // 50% du prix remboursé
    ADMIN_FEE: 500,               // Frais administratifs (FCFA)
  },
  
  /**
   * Capacité des véhicules
   * Nombre de sièges par type de bus
   */
  VEHICLE_CAPACITY: {
    STANDARD: 45,   // Bus standard
    VIP: 35,        // Bus VIP (plus confortable)
    MINIBUS: 25,    // Minibus
  },
  
  /**
   * Méthodes de paiement disponibles
   */
  PAYMENT_METHODS: {
    MOBILE: ['mobile_money', 'card'],  // Paiements disponibles sur l'app
    COUNTER: ['cash', 'mobile_money', 'card'],  // Paiements disponibles au guichet
  },
};

/**
 * Calcule la commission FasoTravel
 * @param price Prix du billet en FCFA
 * @returns Montant de la commission en FCFA
 */
export function calculateCommission(price: number): number {
  // Si les commissions sont désactivées
  if (!BUSINESS_CONFIG.COMMISSION.ENABLED) {
    return 0;
  }
  
  // Calculer la commission
  const commission = price * BUSINESS_CONFIG.COMMISSION.RATE;
  
  // Appliquer le montant minimum
  return Math.max(commission, BUSINESS_CONFIG.COMMISSION.MIN_AMOUNT);
}

/**
 * Calcule le montant du remboursement selon le délai
 * @param price Prix du billet
 * @param hoursBeforeDeparture Nombre d'heures avant le départ
 * @returns Montant remboursé en FCFA
 */
export function calculateRefund(price: number, hoursBeforeDeparture: number): number {
  const { FULL_REFUND_HOURS, PARTIAL_REFUND_HOURS, PARTIAL_REFUND_PERCENT, ADMIN_FEE } = 
    BUSINESS_CONFIG.CANCELLATION;
  
  // Remboursement intégral
  if (hoursBeforeDeparture >= FULL_REFUND_HOURS) {
    return price - ADMIN_FEE;
  }
  
  // Remboursement partiel
  if (hoursBeforeDeparture >= PARTIAL_REFUND_HOURS) {
    return (price * PARTIAL_REFUND_PERCENT / 100) - ADMIN_FEE;
  }
  
  // Pas de remboursement
  return 0;
}

/**
 * Valide qu'un moyen de paiement est disponible pour un canal de vente
 * @param paymentMethod Moyen de paiement
 * @param salesChannel Canal de vente
 * @returns true si le paiement est autorisé
 */
export function isPaymentMethodAllowed(
  paymentMethod: string,
  salesChannel: 'online' | 'counter'
): boolean {
  if (salesChannel === 'online') {
    return BUSINESS_CONFIG.PAYMENT_METHODS.MOBILE.includes(paymentMethod);
  } else {
    return BUSINESS_CONFIG.PAYMENT_METHODS.COUNTER.includes(paymentMethod);
  }
}
```

---

## 🟡 INCOHÉRENCE #4 : Type `paymentMethod` faible

### État Actuel

**Dashboard** ✅
```typescript
paymentMethod: 'cash' | 'mobile_money' | 'card';  // Type strict
```

**Mobile** ❌
```typescript
paymentMethod: string;  // Type faible, accepte n'importe quoi
```

### Problème

```typescript
// Mobile pourrait envoyer :
paymentMethod: 'orange_money'   // ❌ Invalide
paymentMethod: 'paypal'         // ❌ Invalide
paymentMethod: 'bitcoin'        // ❌ Invalide

// Dashboard attend :
paymentMethod: 'cash' | 'mobile_money' | 'card'  // ✅ Valide
```

### Solution Mobile

```typescript
// src/data/models.ts
export type PaymentMethod = 'cash' | 'mobile_money' | 'card';

export interface Ticket {
  // ...
  paymentMethod: PaymentMethod;  // ✅ Type strict
  // ...
}
```

---

## 🟡 INCOHÉRENCE #5 : Nom du champ date

### État Actuel

**Dashboard** ✅
```typescript
purchaseDate: string;  // Date d'achat
```

**Mobile** ❌
```typescript
bookingDate: string;  // Date de réservation (nom différent)
```

### Problème

```typescript
// Mobile envoie
{
  bookingDate: '2025-12-19T10:30:00Z'
}

// Dashboard attend
{
  purchaseDate: '2025-12-19T10:30:00Z'
}

// Résultat : purchaseDate = undefined ❌
```

### Solution

**Décider d'un seul nom et l'utiliser partout :**

```typescript
// Option recommandée : purchaseDate (plus précis)
export interface Ticket {
  purchaseDate: string;  // ✅ Utiliser partout
}
```

---

## 📋 PLAN DE SYNCHRONISATION

### Phase 1 : Mobile → Dashboard (À faire en priorité)

#### 1.1 Créer `/config/business.ts` dans mobile

```bash
# Dans le repo mobile
touch src/config/business.ts
```

Copier le contenu du fichier dashboard avec commission désactivée.

#### 1.2 Ajouter les champs dans `Ticket`

```typescript
// src/data/models.ts
export interface Ticket {
  // ... champs existants
  
  // 🆕 AJOUTER
  salesChannel: 'online' | 'counter';
  commission?: number;
  
  // 🔧 MODIFIER si nécessaire
  paymentMethod: 'cash' | 'mobile_money' | 'card';  // Type strict
  purchaseDate: string;  // Au lieu de bookingDate
  
  // ... autres champs
}
```

#### 1.3 Mettre à jour le code de paiement

```typescript
// src/pages/PaymentPage.tsx
const handlePayment = async () => {
  const ticketData = {
    // ... autres champs
    
    // 🆕 AJOUTER
    salesChannel: 'online',  // TOUJOURS 'online' pour app mobile
    commission: 0,  // Sera calculé par le backend
    
    // 🔧 S'ASSURER que paymentMethod est valide
    paymentMethod: selectedPaymentMethod,  // 'mobile_money' ou 'card' seulement
    
    // 🔧 RENOMMER si nécessaire
    purchaseDate: new Date().toISOString(),  // Au lieu de bookingDate
    
    // ... autres champs
  };
  
  // Validation avant envoi
  if (!['mobile_money', 'card'].includes(ticketData.paymentMethod)) {
    throw new Error('Méthode de paiement invalide pour vente online');
  }
  
  await api.createTicket(ticketData);
};
```

---

### Phase 2 : Backend (Quand créé)

Le backend devra :

1. **Valider les données**
```typescript
// Validation schema (Zod, Joi, etc.)
const ticketSchema = z.object({
  salesChannel: z.enum(['online', 'counter']),
  paymentMethod: z.enum(['cash', 'mobile_money', 'card']),
  // ... autres champs
});

// Règle métier
if (data.salesChannel === 'online' && data.paymentMethod === 'cash') {
  throw new Error('Vente online ne peut pas être payée en cash');
}
```

2. **Calculer la commission**
```typescript
import { calculateCommission, BUSINESS_CONFIG } from './config/business';

if (ticketData.salesChannel === 'online') {
  ticketData.commission = calculateCommission(ticketData.price);
}
```

3. **Utiliser la même config**
```typescript
// Backend doit importer le même /config/business.ts
// Option : Package npm partagé @fasotravel/business-config
```

---

## 🧪 CHECKLIST DE SYNCHRONISATION

### Mobile ✅

- [ ] Créer `/config/business.ts` identique au dashboard
- [ ] Ajouter `salesChannel` à interface `Ticket`
- [ ] Ajouter `commission` à interface `Ticket`
- [ ] Type strict pour `paymentMethod`
- [ ] Utiliser `purchaseDate` (pas `bookingDate`)
- [ ] Toujours envoyer `salesChannel: 'online'`
- [ ] Interdire `paymentMethod: 'cash'` pour app
- [ ] Validation avant envoi au backend

### Dashboard ✅ (Déjà fait)

- [x] `/config/business.ts` existe
- [x] `salesChannel` présent
- [x] `commission` présent
- [x] Type strict `paymentMethod`
- [x] Utilise `salesChannel` pour stats
- [x] Logique correcte

### Backend ⏳ (À faire)

- [ ] Importer `/config/business.ts`
- [ ] Valider `salesChannel` obligatoire
- [ ] Valider `paymentMethod` selon `salesChannel`
- [ ] Calculer `commission` automatiquement
- [ ] Créer transaction caisse seulement si `counter`
- [ ] Tests unitaires des règles métier

---

## 🎯 PRIORITÉS

### 🔴 URGENT (Cette semaine)

1. **Créer `/config/business.ts` dans mobile**
   - Temps: 15 min
   - Impact: Critique

2. **Ajouter `salesChannel` et `commission` à `Ticket` mobile**
   - Temps: 30 min
   - Impact: Bloquant

3. **Mettre à jour code paiement mobile**
   - Temps: 1h
   - Impact: Critique

### 🟡 IMPORTANT (2 semaines)

4. **Synchroniser types stricts**
   - Temps: 1h
   - Impact: Qualité

5. **Harmoniser noms de champs**
   - Temps: 2h
   - Impact: Cohérence

6. **Tests de cohérence**
   - Temps: 3h
   - Impact: Stabilité

---

## 💡 RECOMMANDATION : Package Partagé

Pour éviter les désynchronisations futures :

```bash
# Créer un package npm partagé
npm init @fasotravel/types

# Structure
@fasotravel/types/
├── src/
│   ├── models/
│   │   ├── ticket.ts
│   │   ├── trip.ts
│   │   └── index.ts
│   ├── config/
│   │   ├── business.ts
│   │   └── index.ts
│   └── index.ts
├── package.json
└── tsconfig.json
```

**Utilisation:**
```typescript
// Mobile
import { Ticket, BUSINESS_CONFIG } from '@fasotravel/types';

// Dashboard
import { Ticket, BUSINESS_CONFIG } from '@fasotravel/types';

// Backend
import { Ticket, BUSINESS_CONFIG } from '@fasotravel/types';
```

**Avantages:**
- ✅ Un seul endroit pour les types
- ✅ Garantie de cohérence
- ✅ Facile à maintenir
- ✅ Versioning (npm)

---

## 🎉 CONCLUSION

**État actuel:** 🔴 Mobile et Dashboard PAS synchronisés

**Travail nécessaire:** ~5h pour synchroniser complètement

**Impact si non fait:** 
- ❌ Business model non fonctionnel
- ❌ Commissions perdues
- ❌ Statistiques incorrectes
- ❌ Bugs à l'intégration backend

**Prochaine étape:** Créer PR sur repo mobile avec les modifications

---

**Généré le:** 19 Décembre 2025  
**Prochaine révision:** Après sync mobile
