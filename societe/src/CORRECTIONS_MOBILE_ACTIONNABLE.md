# ✏️ CORRECTIONS MOBILE - GUIDE ACTIONNABLE

**Date:** 19 Décembre 2025  
**Repo:** `https://github.com/NAPONYAHASINE/FasoTravel`  
**Temps estimé:** 3-4 heures

---

## 🎯 OBJECTIF

Modifier le code mobile existant pour le synchroniser avec le dashboard.

---

## 📋 CHECKLIST RAPIDE

- [ ] **Étape 1:** Modifier `/src/data/models.ts` (30 min)
- [ ] **Étape 2:** Créer `/src/config/business.ts` (15 min)
- [ ] **Étape 3:** Modifier `/src/pages/PaymentPage.tsx` (1h)
- [ ] **Étape 4:** Tests (1h)
- [ ] **Étape 5:** PR et merge (30 min)

---

## 🔧 ÉTAPE 1 : Modifier `/src/data/models.ts`

### Action 1.1 : Ajouter les types stricts EN HAUT du fichier

```typescript
// 🆕 AJOUTER ces lignes APRÈS les imports

/**
 * Types stricts FasoTravel
 * ⚠️ SYNC avec dashboard /contexts/DataContext.tsx
 */

/** Méthode de paiement */
export type PaymentMethod = 'cash' | 'mobile_money' | 'card';

/** Canal de vente (CRITIQUE pour business model) */
export type SalesChannel = 'online' | 'counter';

/** Statut d'un billet */
export type BookingStatus = 'valid' | 'used' | 'refunded' | 'cancelled';
```

### Action 1.2 : Trouver l'interface Booking (ou Ticket)

**Recherchez dans le fichier:**
```typescript
export interface Booking {
  // OU
export interface Ticket {
```

### Action 1.3 : Modifier l'interface existante

**REMPLACER l'interface actuelle par:**

```typescript
/**
 * Interface d'un billet de transport
 * ⚠️ SYNC avec dashboard Ticket interface
 */
export interface Booking {
  /** ID unique du billet */
  id: string;
  
  /** ID du trajet */
  tripId: string;
  
  /** Nom complet du passager */
  passengerName: string;
  
  /** Téléphone du passager (+226 XX XX XX XX) */
  passengerPhone: string;
  
  /** Numéro de siège (ex: A1, B2) */
  seatNumber: string;
  
  /** Prix du billet en FCFA (SANS commission) */
  price: number;
  
  /** 
   * Commission FasoTravel en FCFA
   * Présent uniquement si salesChannel === 'online'
   * Calculé par le backend
   */
  commission?: number;
  
  /** 
   * Moyen de paiement
   * ⚠️ App mobile: 'mobile_money' ou 'card' UNIQUEMENT (jamais 'cash')
   */
  paymentMethod: PaymentMethod;
  
  /** 
   * Canal de vente (CRITIQUE)
   * 🚨 TOUJOURS 'online' pour l'app mobile
   * - 'online' = App mobile FasoTravel (avec commission)
   * - 'counter' = Guichet en gare (sans commission)
   */
  salesChannel: SalesChannel;
  
  /** Statut du billet */
  status: BookingStatus;
  
  /** 
   * Date d'achat du billet
   * Format ISO: '2025-12-19T14:30:00Z'
   */
  purchaseDate: string;
  
  /** 
   * ID du caissier
   * - App mobile: 'online_system'
   * - Guichet: ID réel du caissier
   */
  cashierId: string;
  
  /** 
   * Nom du caissier
   * - App mobile: 'Vente en ligne'
   * - Guichet: Nom réel du caissier
   */
  cashierName: string;
  
  /** ID de la gare de départ */
  gareId: string;
  
  /** Ville de départ */
  departure: string;
  
  /** Ville d'arrivée */
  arrival: string;
  
  /** Heure de départ (ISO) */
  departureTime: string;
}
```

**⚠️ ATTENTION:**
- Si l'interface s'appelle `Ticket` au lieu de `Booking`, gardez `Ticket`
- Si vous avez un champ `bookingDate`, RENOMMEZ-LE en `purchaseDate`
- Si certains champs existent déjà, modifiez juste leur type

---

## 🔧 ÉTAPE 2 : Créer `/src/config/business.ts`

### Action 2.1 : Créer le fichier

```bash
# Dans le terminal
touch src/config/business.ts
```

### Action 2.2 : Copier ce code complet

```typescript
/**
 * Configuration Business FasoTravel
 * 
 * ⚠️ IMPORTANT: Ce fichier doit rester synchronisé avec le dashboard
 * Ne modifiez pas sans coordination avec l'équipe dashboard.
 * 
 * @see Dashboard: /config/business.ts
 */

import type { PaymentMethod, SalesChannel } from '../data/models';

/**
 * Configuration globale
 */
export const BUSINESS_CONFIG = {
  /**
   * Commission FasoTravel
   * Appliquée uniquement sur salesChannel: 'online'
   */
  COMMISSION: {
    RATE: 0.05,           // 5% de commission
    MIN_AMOUNT: 100,      // Minimum 100 FCFA
    ENABLED: false,       // ⚠️ Désactivé pendant phase de test
    DESCRIPTION: 'Frais de service FasoTravel',
  },
  
  /**
   * Politique d'annulation
   */
  CANCELLATION: {
    FULL_REFUND_HOURS: 24,        // Remboursement intégral si >24h
    PARTIAL_REFUND_HOURS: 12,     // Remboursement partiel si >12h
    PARTIAL_REFUND_PERCENT: 50,   // 50% remboursé
    ADMIN_FEE: 500,               // Frais admin (FCFA)
  },
  
  /**
   * Capacité véhicules
   */
  VEHICLE_CAPACITY: {
    STANDARD: 45,
    VIP: 35,
    MINIBUS: 25,
  },
  
  /**
   * Méthodes de paiement disponibles
   */
  PAYMENT_METHODS: {
    MOBILE: ['mobile_money', 'card'],          // App mobile uniquement
    COUNTER: ['cash', 'mobile_money', 'card'], // Guichet tous moyens
  },
};

/**
 * Calcule la commission sur un montant
 * @param price Prix du billet en FCFA
 * @returns Commission en FCFA
 */
export function calculateCommission(price: number): number {
  if (!BUSINESS_CONFIG.COMMISSION.ENABLED) return 0;
  const commission = price * BUSINESS_CONFIG.COMMISSION.RATE;
  return Math.max(commission, BUSINESS_CONFIG.COMMISSION.MIN_AMOUNT);
}

/**
 * Calcule le remboursement selon le délai
 * @param price Prix du billet
 * @param hoursBeforeDeparture Heures avant le départ
 * @returns Montant remboursé en FCFA
 */
export function calculateRefund(
  price: number,
  hoursBeforeDeparture: number
): number {
  const { FULL_REFUND_HOURS, PARTIAL_REFUND_HOURS, PARTIAL_REFUND_PERCENT, ADMIN_FEE } = 
    BUSINESS_CONFIG.CANCELLATION;
  
  if (hoursBeforeDeparture >= FULL_REFUND_HOURS) {
    return Math.max(0, price - ADMIN_FEE);
  }
  
  if (hoursBeforeDeparture >= PARTIAL_REFUND_HOURS) {
    const partialAmount = (price * PARTIAL_REFUND_PERCENT) / 100;
    return Math.max(0, partialAmount - ADMIN_FEE);
  }
  
  return 0;
}

/**
 * Valide qu'un paiement est autorisé pour un canal
 * @param paymentMethod Méthode de paiement
 * @param salesChannel Canal de vente
 * @returns true si autorisé
 */
export function isPaymentMethodAllowed(
  paymentMethod: PaymentMethod,
  salesChannel: SalesChannel
): boolean {
  const allowedMethods = salesChannel === 'online'
    ? BUSINESS_CONFIG.PAYMENT_METHODS.MOBILE
    : BUSINESS_CONFIG.PAYMENT_METHODS.COUNTER;
  
  return allowedMethods.includes(paymentMethod);
}

/**
 * Calcule le prix total avec commission
 * @param basePrice Prix de base
 * @param salesChannel Canal de vente
 * @returns Prix total
 */
export function calculateTotalPrice(
  basePrice: number,
  salesChannel: SalesChannel
): number {
  if (salesChannel === 'online') {
    return basePrice + calculateCommission(basePrice);
  }
  return basePrice;
}

/**
 * Formate un montant en FCFA
 * @param amount Montant
 * @returns Chaîne formatée
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}
```

---

## 🔧 ÉTAPE 3 : Modifier `/src/pages/PaymentPage.tsx`

### Action 3.1 : Ajouter l'import en haut du fichier

```typescript
// 🆕 AJOUTER cet import
import { isPaymentMethodAllowed, calculateCommission } from '../config/business';
import type { PaymentMethod } from '../data/models';
```

### Action 3.2 : Trouver la fonction de paiement

**Recherchez dans le fichier:**
```typescript
const handlePayment = async () => {
  // OU
const handleBooking = async () => {
  // OU
const onSubmit = async () => {
```

### Action 3.3 : Modifier la création de bookingData

**AVANT (exemple probable):**
```typescript
const handlePayment = async () => {
  const bookingData = {
    tripId: trip.id,
    passengerName: name,
    passengerPhone: phone,
    seatNumber: selectedSeat,
    price: trip.price,
    paymentMethod: selectedPaymentMethod,
    status: 'pending',
    bookingDate: new Date().toISOString(),
    departure: trip.departure,
    arrival: trip.arrival,
    departureTime: trip.departureTime,
  };
  
  await api.createBooking(bookingData);
};
```

**APRÈS (modifié):**
```typescript
const handlePayment = async () => {
  // 🆕 AJOUTER: Validation paiement cash
  if (selectedPaymentMethod === 'cash') {
    Alert.alert(
      'Paiement non disponible',
      'Le paiement en espèces n\'est pas disponible via l\'application. ' +
      'Veuillez utiliser Mobile Money ou une carte bancaire.',
      [{ text: 'OK' }]
    );
    return;
  }
  
  // 🆕 AJOUTER: Validation méthode de paiement
  if (!isPaymentMethodAllowed(selectedPaymentMethod as PaymentMethod, 'online')) {
    Alert.alert('Erreur', 'Méthode de paiement non valide');
    return;
  }
  
  const bookingData = {
    tripId: trip.id,
    passengerName: name,
    passengerPhone: phone,
    seatNumber: selectedSeat,
    price: trip.price,
    paymentMethod: selectedPaymentMethod,
    
    // 🆕 AJOUTER: salesChannel (CRITIQUE)
    salesChannel: 'online' as const,
    
    // 🆕 AJOUTER: commission (sera calculée par backend)
    commission: undefined,
    
    // 🔧 MODIFIER: 'valid' au lieu de 'pending'
    status: 'valid' as const,
    
    // 🔧 MODIFIER: purchaseDate au lieu de bookingDate
    purchaseDate: new Date().toISOString(),
    
    // 🆕 AJOUTER: Identifiants caisse
    cashierId: 'online_system',
    cashierName: 'Vente en ligne',
    gareId: trip.gareId,
    
    // Existants
    departure: trip.departure,
    arrival: trip.arrival,
    departureTime: trip.departureTime,
  };
  
  // Log pour debug (à retirer en production)
  console.log('📤 Envoi booking:', {
    salesChannel: bookingData.salesChannel,  // Doit être 'online'
    paymentMethod: bookingData.paymentMethod,
    commission: bookingData.commission,
  });
  
  try {
    await api.createBooking(bookingData);
    // Success handling...
  } catch (error) {
    console.error('❌ Erreur création booking:', error);
    Alert.alert('Erreur', 'Impossible de créer la réservation');
  }
};
```

### Action 3.4 : Masquer l'option "Cash" si présente

**Si vous avez une liste de méthodes de paiement affichée:**

```typescript
// 🔧 MODIFIER la liste des méthodes
const paymentMethods = [
  // ❌ RETIRER 'cash' de la liste pour app mobile
  // { id: 'cash', name: 'Espèces', icon: '💵' },  // Commenté
  { id: 'mobile_money', name: 'Mobile Money', icon: '📱' },
  { id: 'card', name: 'Carte bancaire', icon: '💳' },
];
```

---

## 🧪 ÉTAPE 4 : Tests

### Test 1 : Compilation TypeScript

```bash
# Vérifier que tout compile
npm run tsc
# OU
yarn tsc
```

**Attendu:** ✅ 0 erreur

### Test 2 : Test manuel création booking

1. Lancer l'app
2. Sélectionner un trajet
3. Choisir un siège
4. Essayer de payer en **Mobile Money**

**Vérifier dans la console:**
```
📤 Envoi booking: {
  salesChannel: 'online',  // ✅ Doit être 'online'
  paymentMethod: 'mobile_money',  // ✅ OK
  commission: undefined  // ✅ OK (calculé par backend)
}
```

### Test 3 : Test validation cash (si option visible)

1. Essayer de sélectionner "Cash"

**Attendu:** ❌ Alert "Paiement non disponible"

### Test 4 : Vérifier données envoyées

**Ajouter un breakpoint ou log avant `api.createBooking`:**
```typescript
console.log('Données complètes:', JSON.stringify(bookingData, null, 2));
```

**Vérifier que toutes ces clés sont présentes:**
- ✅ `salesChannel: 'online'`
- ✅ `commission: undefined`
- ✅ `cashierId: 'online_system'`
- ✅ `cashierName: 'Vente en ligne'`
- ✅ `gareId: '...'`
- ✅ `purchaseDate: '2025-12-19T...'`

---

## 📝 ÉTAPE 5 : Créer PR

### Action 5.1 : Créer branche

```bash
git checkout -b feat/sync-dashboard-business-model
```

### Action 5.2 : Commiter les changements

```bash
git add src/data/models.ts
git add src/config/business.ts
git add src/pages/PaymentPage.tsx
git commit -m "feat: Synchronisation avec dashboard - Ajout salesChannel et commission

- Ajout champs salesChannel et commission dans Booking
- Création config/business.ts (sync dashboard)
- Modification PaymentPage pour inclure salesChannel: 'online'
- Validation paiement cash (interdit via app)
- Types stricts PaymentMethod, SalesChannel, BookingStatus

BREAKING CHANGE: Ajout champs obligatoires salesChannel
"
```

### Action 5.3 : Pousser et créer PR

```bash
git push origin feat/sync-dashboard-business-model
```

Créer PR sur GitHub avec cette description:

```markdown
## 🎯 Objectif

Synchroniser l'app mobile avec le dashboard pour assurer la cohérence des données et du business model.

## ✨ Changements

### Fichiers modifiés
- `src/data/models.ts` - Ajout types stricts + champs salesChannel/commission
- `src/pages/PaymentPage.tsx` - Intégration salesChannel et validation
- `src/config/business.ts` (nouveau) - Configuration business centralisée

### Nouveautés
- ✅ Ajout `salesChannel: 'online'` (CRITIQUE pour business model)
- ✅ Ajout `commission` (calculée par backend)
- ✅ Types stricts `PaymentMethod`, `SalesChannel`, `BookingStatus`
- ✅ Validation paiement (interdiction cash via app)
- ✅ Configuration centralisée dans `config/business.ts`

## 🔴 Breaking Changes

Ajout de champs obligatoires:
- `salesChannel` (toujours 'online' pour app mobile)
- `commission` (undefined côté mobile, calculé par backend)
- `cashierId`, `cashierName`, `gareId`

## ✅ Tests effectués

- [x] Compilation TypeScript sans erreur
- [x] Test création booking avec salesChannel
- [x] Test validation paiement cash (rejeté)
- [x] Vérification données envoyées au backend

## 📚 Documentation

Voir `/ANALYSE_INCOHERENCES_MOBILE_VS_DASHBOARD.md` dans dashboard

## 🔗 Lien

Synchronisation avec dashboard web (déjà à jour)

## 📸 Screenshots

[Ajouter screenshots si possible]
```

---

## ⚠️ POINTS D'ATTENTION

### 1. Noms de champs différents

Si votre code actuel utilise des noms différents:

| Actuel | Requis | Action |
|--------|--------|--------|
| `bookingDate` | `purchaseDate` | Renommer |
| `ticketId` | `id` | Renommer |
| `passenger` | `passengerName` | Renommer |
| `phone` | `passengerPhone` | Renommer |

### 2. Backend pas encore prêt

Si le backend n'est pas encore mis à jour:

**Option A:** Créer backend mock local
```typescript
// src/api/mock.ts
export async function createBooking(data: Booking) {
  console.log('📤 Mock API - Booking créé:', data);
  return { success: true, booking: { ...data, id: Date.now().toString() } };
}
```

**Option B:** Attendre backend
- Merger le code mobile
- Attendre que backend soit prêt
- Tester l'intégration

### 3. Tests unitaires

Si vous avez des tests:

```typescript
// __tests__/payment.test.ts

describe('PaymentPage', () => {
  it('devrait inclure salesChannel: online', () => {
    const booking = createBooking(mockData);
    expect(booking.salesChannel).toBe('online');
  });
  
  it('devrait rejeter paiement cash', () => {
    expect(() => {
      validatePayment('cash', 'online');
    }).toThrow('Paiement cash impossible');
  });
});
```

---

## 🎉 RÉSULTAT FINAL

Après merge, l'app mobile enverra:

```json
{
  "id": "booking_123",
  "tripId": "trip_456",
  "passengerName": "Jean Kaboré",
  "passengerPhone": "+226 70 12 34 56",
  "seatNumber": "A1",
  "price": 5000,
  "commission": null,
  "paymentMethod": "mobile_money",
  "salesChannel": "online",
  "status": "valid",
  "purchaseDate": "2025-12-19T14:30:00Z",
  "cashierId": "online_system",
  "cashierName": "Vente en ligne",
  "gareId": "gare_ouaga_central",
  "departure": "Ouagadougou",
  "arrival": "Bobo-Dioulasso",
  "departureTime": "2025-12-20T08:00:00Z"
}
```

Le dashboard pourra alors:
- ✅ Identifier que c'est une vente online
- ✅ Calculer la commission (backend)
- ✅ Afficher les stats correctement
- ✅ Tracker les revenus FasoTravel

---

## 📞 AIDE

### Erreur TypeScript

```
Property 'salesChannel' does not exist on type 'Booking'
```

**Solution:** Vérifier que vous avez bien modifié `/src/data/models.ts`

### Erreur lors de l'envoi

```
400 Bad Request: salesChannel is required
```

**Solution:** Vérifier que `salesChannel: 'online'` est bien dans `bookingData`

### App ne compile pas

```
Cannot find module '../config/business'
```

**Solution:** Vérifier que vous avez bien créé `/src/config/business.ts`

---

**Généré le:** 19 Décembre 2025  
**Status:** ✅ **PRÊT À APPLIQUER**  
**Temps estimé:** 3-4 heures

Bonne chance ! 🚀
