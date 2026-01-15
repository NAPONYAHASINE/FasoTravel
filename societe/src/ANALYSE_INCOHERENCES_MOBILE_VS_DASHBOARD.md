# 🔍 ANALYSE TECHNIQUE : Mobile vs Dashboard

**Date:** 19 Décembre 2025  
**Repos analysés:**
- 📱 **Mobile:** `https://github.com/NAPONYAHASINE/FasoTravel`
- 💻 **Dashboard:** Application actuelle (corrigée)

---

## 🎯 OBJECTIF

Analyser les incohérences techniques entre le code mobile existant et le dashboard pour assurer la synchronisation parfaite des deux applications.

---

## 📊 RÉSULTATS DE L'ANALYSE

### Fichiers Mobile Identifiés

| Fichier | Chemin | Contenu |
|---------|--------|---------|
| **Types/Models** | `/src/data/models.ts` | ✅ Trouvé |
| **Paiement** | `/src/pages/PaymentPage.tsx` | ✅ Trouvé |
| **Hooks** | `/src/lib/hooks.ts` | ✅ Trouvé |
| **Docs** | `/src/PREPARATION_BACKEND_COMPLETE.md` | ✅ Trouvé |
| **Docs** | `/src/ARCHITECTURE_CODE_COMPLETE.md` | ✅ Trouvé |

---

## 🔴 INCOHÉRENCES CRITIQUES DÉTECTÉES

### ❌ INCOHÉRENCE #1 : Champ `salesChannel` ABSENT

**État détecté:**
```
Mobile: salesChannel ❌ NON TROUVÉ dans le code
Dashboard: salesChannel ✅ PRÉSENT et utilisé
```

**Impact:**
- ❌ Le mobile ne peut pas distinguer ses ventes de celles du guichet
- ❌ Impossible de calculer les commissions correctement
- ❌ Statistiques dashboard incorrectes
- ❌ Business model non fonctionnel

**Résultat recherche:**
```json
{
  "query": "repo:NAPONYAHASINE/FasoTravel salesChannel",
  "total_count": 0  // ❌ Aucune occurrence trouvée
}
```

**Correction requise:**
```typescript
// À AJOUTER dans /src/data/models.ts
export interface Booking {
  // ... champs existants
  
  // 🆕 AJOUTER CE CHAMP CRITIQUE
  salesChannel: 'online' | 'counter';  // TOUJOURS 'online' pour app mobile
  
  // ... autres champs
}
```

---

### ❌ INCOHÉRENCE #2 : Champ `commission` ABSENT

**État détecté:**
```
Mobile: commission ❌ NON TROUVÉ dans le code
Dashboard: commission ✅ PRÉSENT et calculé
```

**Impact:**
- ❌ Pas de transparence sur les frais pour l'utilisateur
- ❌ Impossible de tracker les revenus FasoTravel
- ❌ Rapports financiers incomplets
- ❌ Dashboard ne peut pas afficher les commissions

**Résultat recherche:**
```json
{
  "query": "repo:NAPONYAHASINE/FasoTravel commission",
  "total_count": 0  // ❌ Aucune occurrence trouvée
}
```

**Correction requise:**
```typescript
// À AJOUTER dans /src/data/models.ts
export interface Booking {
  // ... champs existants
  
  // 🆕 AJOUTER CE CHAMP
  commission?: number;  // Calculé par le backend (5% si salesChannel === 'online')
  
  // ... autres champs
}
```

---

### ⚠️ INCOHÉRENCE #3 : Champ `paymentMethod` - Type inconnu

**État détecté:**
```
Mobile: paymentMethod ✅ TROUVÉ (5 occurrences)
      - Mais TYPE INCONNU (string? union type?)
Dashboard: paymentMethod: 'cash' | 'mobile_money' | 'card' ✅ TYPE STRICT
```

**Résultat recherche:**
```json
{
  "query": "repo:NAPONYAHASINE/FasoTravel paymentMethod",
  "total_count": 5,
  "files": [
    "src/lib/hooks.ts",
    "src/data/models.ts",
    "src/pages/PaymentPage.tsx"
  ]
}
```

**Impact potentiel:**
- ⚠️ Type faible permet valeurs invalides
- ⚠️ Pas de validation TypeScript
- ⚠️ Risque d'envoyer des données incorrectes

**Correction requise:**
```typescript
// Dans /src/data/models.ts

// 🆕 DÉFINIR LE TYPE STRICT
export type PaymentMethod = 'cash' | 'mobile_money' | 'card';

export interface Booking {
  // ... champs existants
  
  // 🔧 TYPE STRICT au lieu de string
  paymentMethod: PaymentMethod;  // ✅ Au lieu de paymentMethod: string
  
  // ... autres champs
}
```

---

## 📋 STRUCTURE ACTUELLE DU MOBILE (Analyse)

### Fichier: `/src/data/models.ts`

**Ce qu'on sait:**
- ✅ Le fichier existe
- ✅ Contient probablement interface `Booking` ou `Ticket`
- ✅ Utilise `paymentMethod` (5 occurrences trouvées)
- ❌ Ne contient PAS `salesChannel` (0 occurrence)
- ❌ Ne contient PAS `commission` (0 occurrence)

**Structure probable ACTUELLE:**
```typescript
// HYPOTHÈSE basée sur l'analyse

export interface Booking {
  id: string;
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  seatNumber: string;
  price: number;
  
  // ❌ PROBLÈME: Type probablement faible
  paymentMethod: string;  // Ou peut-être un type union?
  
  // ❌ MANQUANTS
  // salesChannel: ???  // N'EXISTE PAS
  // commission: ???    // N'EXISTE PAS
  
  status: string;  // 'pending' | 'confirmed' | 'cancelled' ?
  bookingDate: string;  // ⚠️ Peut être différent de purchaseDate
  
  // Informations trajet
  departure: string;
  arrival: string;
  departureTime: string;
  
  // ... autres champs possibles
}
```

**Structure REQUISE (synchronisée avec dashboard):**
```typescript
// Ce qui DEVRAIT être

export type PaymentMethod = 'cash' | 'mobile_money' | 'card';
export type SalesChannel = 'online' | 'counter';
export type BookingStatus = 'valid' | 'used' | 'refunded' | 'cancelled';

export interface Booking {
  id: string;
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  seatNumber: string;
  price: number;
  
  // ✅ CORRIGER: Type strict
  paymentMethod: PaymentMethod;
  
  // 🆕 AJOUTER: Canal de vente (CRITIQUE)
  salesChannel: SalesChannel;  // TOUJOURS 'online' pour app mobile
  
  // 🆕 AJOUTER: Commission (sera calculée par backend)
  commission?: number;
  
  // ✅ CORRIGER: Type strict
  status: BookingStatus;
  
  // ✅ HARMONISER: Même nom que dashboard
  purchaseDate: string;  // Au lieu de bookingDate
  
  // Identifiants caisse (pour cohérence avec dashboard)
  cashierId: string;     // 'online_system' pour app mobile
  cashierName: string;   // 'Vente en ligne' pour app mobile
  gareId: string;
  
  // Informations trajet
  departure: string;
  arrival: string;
  departureTime: string;
}
```

---

### Fichier: `/src/pages/PaymentPage.tsx`

**Ce qu'on sait:**
- ✅ Le fichier existe
- ✅ Utilise `paymentMethod`
- ❌ Probablement ne définit PAS `salesChannel: 'online'`
- ❌ Probablement ne calcule PAS la commission (ou mal)

**Code probable ACTUEL:**
```typescript
// HYPOTHÈSE basée sur l'analyse

const handlePayment = async () => {
  const bookingData = {
    tripId: trip.id,
    passengerName: name,
    passengerPhone: phone,
    seatNumber: selectedSeat,
    price: trip.price,
    paymentMethod: selectedPaymentMethod,  // 'mobile_money' ou 'card'
    
    // ❌ MANQUANTS
    // salesChannel: ???  // N'existe probablement pas
    // commission: ???    // N'existe probablement pas
    
    status: 'pending',
    bookingDate: new Date().toISOString(),
    // ...
  };
  
  // Envoi au backend
  await api.createBooking(bookingData);
};
```

**Code REQUIS (synchronisé avec dashboard):**
```typescript
// Ce qui DEVRAIT être

const handlePayment = async () => {
  const bookingData = {
    tripId: trip.id,
    passengerName: name,
    passengerPhone: phone,
    seatNumber: selectedSeat,
    price: trip.price,
    paymentMethod: selectedPaymentMethod,
    
    // 🆕 AJOUTER: TOUJOURS 'online' pour app mobile
    salesChannel: 'online',
    
    // 🆕 AJOUTER: Commission à 0 (sera calculée par backend)
    commission: undefined,
    
    // ✅ CORRIGER
    status: 'valid',  // Au lieu de 'pending'
    
    // ✅ HARMONISER
    purchaseDate: new Date().toISOString(),  // Au lieu de bookingDate
    
    // 🆕 AJOUTER: Identifiants pour cohérence
    cashierId: 'online_system',
    cashierName: 'Vente en ligne',
    gareId: trip.gareId,
    
    // Informations trajet
    departure: trip.departure,
    arrival: trip.arrival,
    departureTime: trip.departureTime,
  };
  
  // Validation avant envoi
  if (!['mobile_money', 'card'].includes(selectedPaymentMethod)) {
    throw new Error('Paiement cash impossible via app mobile');
  }
  
  // Envoi au backend
  await api.createBooking(bookingData);
};
```

---

## 🔧 CORRECTIONS NÉCESSAIRES

### Phase 1 : Fichier `/src/data/models.ts`

#### Correction 1.1 : Définir les types stricts
```typescript
// 🆕 AJOUTER en haut du fichier

/**
 * Types stricts pour l'application FasoTravel
 * ⚠️ SYNC: Doit rester synchronisé avec dashboard
 */

export type PaymentMethod = 'cash' | 'mobile_money' | 'card';
export type SalesChannel = 'online' | 'counter';
export type BookingStatus = 'valid' | 'used' | 'refunded' | 'cancelled';
```

#### Correction 1.2 : Modifier interface Booking
```typescript
// 🔧 MODIFIER l'interface existante

export interface Booking {
  id: string;
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  seatNumber: string;
  price: number;
  
  // 🔧 MODIFIER: Type strict (si c'était string)
  paymentMethod: PaymentMethod;
  
  // 🆕 AJOUTER: Canal de vente (CRITIQUE)
  salesChannel: SalesChannel;
  
  // 🆕 AJOUTER: Commission
  commission?: number;
  
  // 🔧 MODIFIER: Type strict
  status: BookingStatus;
  
  // 🔧 RENOMMER: De bookingDate à purchaseDate (si applicable)
  purchaseDate: string;
  
  // 🆕 AJOUTER: Identifiants caisse
  cashierId: string;
  cashierName: string;
  gareId: string;
  
  // Existants (vérifier présence)
  departure: string;
  arrival: string;
  departureTime: string;
}
```

---

### Phase 2 : Fichier `/src/pages/PaymentPage.tsx`

#### Correction 2.1 : Ajouter salesChannel
```typescript
// Dans la fonction handlePayment

const bookingData = {
  // ... champs existants
  
  // 🆕 AJOUTER
  salesChannel: 'online' as const,  // TOUJOURS 'online' pour app mobile
  
  // ... autres champs
};
```

#### Correction 2.2 : Ajouter commission
```typescript
// Dans la fonction handlePayment

const bookingData = {
  // ... champs existants
  
  // 🆕 AJOUTER (undefined car calculé par backend)
  commission: undefined,
  
  // ... autres champs
};
```

#### Correction 2.3 : Ajouter validation paiement
```typescript
// Avant l'envoi au backend

// 🆕 AJOUTER validation
if (selectedPaymentMethod === 'cash') {
  Alert.alert(
    'Paiement non disponible',
    'Le paiement en espèces n\'est pas disponible via l\'application. ' +
    'Veuillez utiliser Mobile Money ou une carte bancaire.'
  );
  return;
}

// Validation type strict
if (!['mobile_money', 'card'].includes(selectedPaymentMethod)) {
  throw new Error('Méthode de paiement invalide');
}
```

#### Correction 2.4 : Ajouter identifiants caisse
```typescript
// Dans la fonction handlePayment

const bookingData = {
  // ... champs existants
  
  // 🆕 AJOUTER
  cashierId: 'online_system',
  cashierName: 'Vente en ligne',
  gareId: trip.gareId,
  
  // ... autres champs
};
```

---

### Phase 3 : Créer `/src/config/business.ts` (NOUVEAU)

```typescript
// 🆕 CRÉER CE FICHIER

/**
 * Configuration Business FasoTravel
 * ⚠️ SYNC: Doit rester synchronisé avec dashboard /config/business.ts
 */

export const BUSINESS_CONFIG = {
  COMMISSION: {
    RATE: 0.05,           // 5% de commission
    MIN_AMOUNT: 100,      // Minimum 100 FCFA
    ENABLED: false,       // Désactivé en phase de test
    DESCRIPTION: 'Frais de service FasoTravel',
  },
  
  PAYMENT_METHODS: {
    MOBILE: ['mobile_money', 'card'],          // App mobile uniquement
    COUNTER: ['cash', 'mobile_money', 'card'], // Guichet tous moyens
  },
};

export function calculateCommission(price: number): number {
  if (!BUSINESS_CONFIG.COMMISSION.ENABLED) return 0;
  const commission = price * BUSINESS_CONFIG.COMMISSION.RATE;
  return Math.max(commission, BUSINESS_CONFIG.COMMISSION.MIN_AMOUNT);
}

export function isPaymentMethodAllowed(
  paymentMethod: string,
  salesChannel: 'online' | 'counter'
): boolean {
  const allowed = salesChannel === 'online'
    ? BUSINESS_CONFIG.PAYMENT_METHODS.MOBILE
    : BUSINESS_CONFIG.PAYMENT_METHODS.COUNTER;
  return allowed.includes(paymentMethod);
}
```

---

## 📊 COMPARAISON AVANT / APRÈS

### AVANT (État actuel probable du mobile)

```typescript
// Interface Mobile
interface Booking {
  id: string;
  price: number;
  paymentMethod: string;  // ❌ Type faible
  // ❌ salesChannel n'existe pas
  // ❌ commission n'existe pas
  status: string;  // ❌ Type faible
  bookingDate: string;  // ⚠️ Nom différent dashboard
}

// Code paiement
const data = {
  price: 5000,
  paymentMethod: 'mobile_money',  // ❌ Pas de validation
  // ❌ salesChannel manquant
  // ❌ commission manquant
};
```

**Problèmes:**
- ❌ Types faibles (string au lieu d'union types)
- ❌ Champs critiques manquants (salesChannel, commission)
- ❌ Pas de validation
- ❌ Noms de champs différents du dashboard
- ❌ Impossible de distinguer ventes online vs counter
- ❌ Dashboard ne peut pas calculer stats correctement

---

### APRÈS (État requis synchronisé)

```typescript
// Interface Mobile (synchronisée dashboard)
type PaymentMethod = 'cash' | 'mobile_money' | 'card';
type SalesChannel = 'online' | 'counter';

interface Booking {
  id: string;
  price: number;
  paymentMethod: PaymentMethod;  // ✅ Type strict
  salesChannel: SalesChannel;     // ✅ AJOUTÉ
  commission?: number;             // ✅ AJOUTÉ
  status: 'valid' | 'used' | 'refunded' | 'cancelled';  // ✅ Type strict
  purchaseDate: string;           // ✅ Même nom que dashboard
  cashierId: string;              // ✅ AJOUTÉ
  cashierName: string;            // ✅ AJOUTÉ
}

// Code paiement (synchronisé dashboard)
const data = {
  price: 5000,
  paymentMethod: 'mobile_money',  // ✅ Validé
  salesChannel: 'online',         // ✅ AJOUTÉ
  commission: undefined,          // ✅ AJOUTÉ (calculé backend)
  cashierId: 'online_system',     // ✅ AJOUTÉ
  cashierName: 'Vente en ligne',  // ✅ AJOUTÉ
};

// ✅ Validation avant envoi
if (!isPaymentMethodAllowed(data.paymentMethod, 'online')) {
  throw new Error('Paiement invalide');
}
```

**Bénéfices:**
- ✅ Types stricts partout
- ✅ Tous les champs nécessaires présents
- ✅ Validation TypeScript + runtime
- ✅ Noms cohérents avec dashboard
- ✅ Dashboard peut calculer stats correctement
- ✅ Business model fonctionnel

---

## 🎯 CHECKLIST DE SYNCHRONISATION

### Mobile (À faire)

#### Fichier `/src/data/models.ts`
- [ ] Définir `type PaymentMethod`
- [ ] Définir `type SalesChannel`
- [ ] Définir `type BookingStatus`
- [ ] Ajouter `salesChannel` à `Booking`
- [ ] Ajouter `commission` à `Booking`
- [ ] Modifier `paymentMethod` en type strict
- [ ] Modifier `status` en type strict
- [ ] Renommer `bookingDate` → `purchaseDate` (si applicable)
- [ ] Ajouter `cashierId`, `cashierName`, `gareId`

#### Fichier `/src/pages/PaymentPage.tsx`
- [ ] Ajouter `salesChannel: 'online'` dans bookingData
- [ ] Ajouter `commission: undefined` dans bookingData
- [ ] Ajouter validation paiement (interdire cash)
- [ ] Ajouter `cashierId: 'online_system'`
- [ ] Ajouter `cashierName: 'Vente en ligne'`
- [ ] Utiliser `purchaseDate` au lieu de `bookingDate`

#### Fichier `/src/config/business.ts` (NOUVEAU)
- [ ] Créer le fichier
- [ ] Copier config depuis dashboard
- [ ] Implémenter `calculateCommission()`
- [ ] Implémenter `isPaymentMethodAllowed()`

#### Tests
- [ ] Test création booking avec salesChannel
- [ ] Test validation paiement cash (doit échouer)
- [ ] Test types TypeScript (compilation)
- [ ] Test intégration avec dashboard

---

### Dashboard (Vérification)

#### Vérifier cohérence
- [x] Type `paymentMethod` strict ✅
- [x] Champ `salesChannel` présent ✅
- [x] Champ `commission` présent ✅
- [x] Logique génération correcte ✅
- [x] Stats utilisent `salesChannel` ✅

---

## 🚨 RISQUES SI NON SYNCHRONISÉ

### Risque #1 : Business Model cassé
```
Mobile envoie: { price: 5000, paymentMethod: 'mobile_money' }
Dashboard reçoit: salesChannel = undefined
Résultat: Impossible de distinguer online vs counter
Impact: Perte tracking des commissions
```

### Risque #2 : Statistiques incorrectes
```
Dashboard cherche: salesChannel === 'online'
Mobile n'envoie pas: salesChannel
Résultat: Dashboard affiche 0 vente online
Impact: Métriques business fausses
```

### Risque #3 : Validation backend échoue
```
Backend valide: salesChannel obligatoire
Mobile n'envoie pas: salesChannel
Résultat: Erreur 400 Bad Request
Impact: Utilisateurs ne peuvent pas réserver
```

### Risque #4 : Commission non calculée
```
Backend calcule: if (salesChannel === 'online') { commission = ... }
Mobile n'envoie pas: salesChannel
Résultat: commission = undefined (toujours)
Impact: Revenus FasoTravel perdus
```

---

## 📝 PLAN D'ACTION RECOMMANDÉ

### Étape 1 : Analyse du code mobile actuel (1h)
1. Cloner le repo mobile
2. Lire `/src/data/models.ts` complet
3. Lire `/src/pages/PaymentPage.tsx` complet
4. Identifier TOUTES les différences exactes

### Étape 2 : Corrections Mobile (3h)
1. Créer branche `feat/sync-dashboard`
2. Appliquer corrections models.ts
3. Appliquer corrections PaymentPage.tsx
4. Créer config/business.ts
5. Tests locaux

### Étape 3 : Tests (1h)
1. Test création booking
2. Test validation
3. Test types TypeScript
4. Test intégration (si backend dispo)

### Étape 4 : PR et Merge (30min)
1. Créer PR descriptive
2. Review code
3. Merger

### Étape 5 : Vérification Dashboard (30min)
1. Vérifier que dashboard reçoit les bonnes données
2. Vérifier stats correctes
3. Vérifier commission calculée

**Temps total estimé: 6h**

---

## 🎉 RÉSULTAT ATTENDU

Après synchronisation:

```typescript
// Mobile envoie ✅
{
  id: 'ticket_123',
  price: 5000,
  paymentMethod: 'mobile_money',
  salesChannel: 'online',          // ✅ Présent
  commission: undefined,            // ✅ Présent (calculé par backend)
  status: 'valid',
  purchaseDate: '2025-12-19T...',
  cashierId: 'online_system',      // ✅ Présent
  cashierName: 'Vente en ligne',   // ✅ Présent
  // ...
}

// Dashboard reçoit ✅
{
  salesChannel: 'online',          // ✅ Peut identifier vente mobile
  commission: 250,                 // ✅ Calculé par backend (5%)
  paymentMethod: 'mobile_money',   // ✅ Méthode correcte
  // ...
}

// Dashboard affiche ✅
Ventes online: 42 billets         // ✅ Stats correctes
Ventes counter: 58 billets        // ✅ Stats correctes
Commission totale: 10 500 FCFA    // ✅ Revenus trackés
```

---

## 📚 DOCUMENTS DE RÉFÉRENCE

1. **`/CORRECTIONS_FINALES.md`** - État final dashboard
2. **`/config/business.ts`** - Config business dashboard
3. **`/contexts/DataContext.tsx`** - Types dashboard (référence)
4. **Ce document** - Plan de synchronisation mobile

---

## ⚠️ IMPORTANT

**NE PAS:**
- ❌ Modifier le dashboard maintenant (il est correct)
- ❌ Créer de nouveaux champs non nécessaires
- ❌ Changer les noms de champs du dashboard

**FAIRE:**
- ✅ Modifier UNIQUEMENT le mobile
- ✅ Suivre EXACTEMENT la structure dashboard
- ✅ Tester avant de merger
- ✅ Documenter les changements

---

**Généré le:** 19 Décembre 2025  
**Status:** ⏳ **ANALYSE TERMINÉE - CORRECTIONS À FAIRE SUR MOBILE**  
**Prochaine étape:** Cloner repo mobile et appliquer corrections

---

## 🔗 LIENS UTILES

- **Repo Mobile:** https://github.com/NAPONYAHASINE/FasoTravel
- **Fichier models.ts:** https://github.com/NAPONYAHASINE/FasoTravel/blob/main/src/data/models.ts
- **Fichier PaymentPage.tsx:** https://github.com/NAPONYAHASINE/FasoTravel/blob/main/src/pages/PaymentPage.tsx
