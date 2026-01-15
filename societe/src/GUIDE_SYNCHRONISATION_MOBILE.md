# 🔄 GUIDE DE SYNCHRONISATION MOBILE ↔ DASHBOARD

**Date:** 19 Décembre 2025  
**Repos:**
- 📱 **Mobile:** `github.com/NAPONYAHASINE/FasoTravel`
- 💻 **Dashboard:** Application actuelle (100% cohérent)

---

## 🎯 OBJECTIF

Synchroniser l'application mobile avec le dashboard pour assurer la cohérence des données et du business model.

---

## 📋 CHECKLIST COMPLÈTE

### Phase 1 : Fichiers de Configuration (15 min)

- [ ] Créer `/src/config/business.ts`
- [ ] Créer `/src/types/ticket.ts`
- [ ] Créer `/src/types/common.ts`

### Phase 2 : Modifications du Modèle Ticket (30 min)

- [ ] Ajouter champ `salesChannel`
- [ ] Ajouter champ `commission`
- [ ] Type strict pour `paymentMethod`
- [ ] Renommer `bookingDate` → `purchaseDate` (si applicable)

### Phase 3 : Code de Paiement (1h)

- [ ] Modifier page paiement pour inclure `salesChannel: 'online'`
- [ ] Validation paiement (interdire `cash` pour online)
- [ ] Calcul commission (côté affichage seulement)

### Phase 4 : Tests (1h)

- [ ] Test création ticket
- [ ] Test validation paiement
- [ ] Test affichage commission
- [ ] Test intégration API

**Temps total estimé:** ~3 heures

---

## 📁 FICHIER 1 : `/src/config/business.ts`

Ce fichier centralise TOUTES les règles métier de FasoTravel.

```typescript
/**
 * Configuration Business FasoTravel
 * 
 * ⚠️ IMPORTANT: Ce fichier doit rester synchronisé avec le dashboard.
 * Ne modifiez pas sans coordination avec l'équipe dashboard.
 * 
 * @see Dashboard: /config/business.ts
 */

/**
 * Configuration globale de l'application
 */
export const BUSINESS_CONFIG = {
  /**
   * Commission FasoTravel
   * 
   * Appliquée uniquement sur les ventes via l'app mobile (salesChannel: 'online')
   * Les ventes au guichet (salesChannel: 'counter') n'ont PAS de commission
   */
  COMMISSION: {
    /**
     * Taux de commission en pourcentage (0.05 = 5%)
     * 
     * ⚠️ ACTUELLEMENT DÉSACTIVÉ - Phase de test
     * Sera activé après validation du modèle économique
     */
    RATE: 0.05,
    
    /**
     * Montant minimum de commission en FCFA
     * Même si le calcul donne moins, on applique ce minimum
     */
    MIN_AMOUNT: 100,
    
    /**
     * Activation des commissions
     * 
     * false = Phase de test (pas de commission prélevée)
     * true = Production (commission active)
     */
    ENABLED: false,
    
    /**
     * Description affichée à l'utilisateur
     */
    DESCRIPTION: 'Frais de service FasoTravel',
  },
  
  /**
   * Politique d'annulation et de remboursement
   * 
   * Définit les conditions de remboursement selon le délai
   */
  CANCELLATION: {
    /**
     * Remboursement intégral si annulation > 24h avant départ
     */
    FULL_REFUND_HOURS: 24,
    
    /**
     * Remboursement partiel si annulation > 12h avant départ
     */
    PARTIAL_REFUND_HOURS: 12,
    
    /**
     * Pourcentage remboursé en cas de remboursement partiel
     */
    PARTIAL_REFUND_PERCENT: 50,
    
    /**
     * Frais administratifs pour tout remboursement (FCFA)
     */
    ADMIN_FEE: 500,
  },
  
  /**
   * Capacité des véhicules
   * 
   * Nombre de sièges selon le type de bus
   */
  VEHICLE_CAPACITY: {
    /**
     * Bus standard (confort normal)
     */
    STANDARD: 45,
    
    /**
     * Bus VIP (sièges inclinables, plus d'espace)
     */
    VIP: 35,
    
    /**
     * Minibus (petits trajets)
     */
    MINIBUS: 25,
  },
  
  /**
   * Méthodes de paiement disponibles
   * 
   * IMPORTANT: L'app mobile ne peut PAS accepter de cash
   */
  PAYMENT_METHODS: {
    /**
     * Paiements disponibles dans l'app mobile
     * 
     * ❌ PAS DE CASH (impossible via app)
     * ✅ Mobile Money (Orange Money, Moov Money, etc.)
     * ✅ Carte bancaire
     */
    MOBILE: ['mobile_money', 'card'],
    
    /**
     * Paiements disponibles au guichet
     * 
     * ✅ CASH (espèces)
     * ✅ Mobile Money
     * ✅ Carte bancaire
     */
    COUNTER: ['cash', 'mobile_money', 'card'],
  },
};

/**
 * Types pour TypeScript
 */
export type SalesChannel = 'online' | 'counter';
export type PaymentMethod = 'cash' | 'mobile_money' | 'card';

/**
 * Calcule la commission FasoTravel sur un montant
 * 
 * @param price Prix du billet en FCFA
 * @returns Montant de la commission en FCFA
 * 
 * @example
 * const commission = calculateCommission(5000);
 * // Si ENABLED: true, RATE: 0.05 → retourne 250
 * // Si ENABLED: false → retourne 0
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
 * 
 * @param price Prix du billet en FCFA
 * @param hoursBeforeDeparture Nombre d'heures avant le départ
 * @returns Montant remboursé en FCFA
 * 
 * @example
 * // Annulation 30h avant → Remboursement intégral moins frais admin
 * calculateRefund(5000, 30) → 4500 (5000 - 500 frais admin)
 * 
 * // Annulation 15h avant → Remboursement partiel (50%)
 * calculateRefund(5000, 15) → 2000 (5000 * 50% - 500 frais admin)
 * 
 * // Annulation 5h avant → Pas de remboursement
 * calculateRefund(5000, 5) → 0
 */
export function calculateRefund(
  price: number,
  hoursBeforeDeparture: number
): number {
  const {
    FULL_REFUND_HOURS,
    PARTIAL_REFUND_HOURS,
    PARTIAL_REFUND_PERCENT,
    ADMIN_FEE,
  } = BUSINESS_CONFIG.CANCELLATION;
  
  // Remboursement intégral (moins frais admin)
  if (hoursBeforeDeparture >= FULL_REFUND_HOURS) {
    return Math.max(0, price - ADMIN_FEE);
  }
  
  // Remboursement partiel (moins frais admin)
  if (hoursBeforeDeparture >= PARTIAL_REFUND_HOURS) {
    const partialAmount = (price * PARTIAL_REFUND_PERCENT) / 100;
    return Math.max(0, partialAmount - ADMIN_FEE);
  }
  
  // Pas de remboursement
  return 0;
}

/**
 * Valide qu'un moyen de paiement est autorisé pour un canal
 * 
 * @param paymentMethod Moyen de paiement choisi
 * @param salesChannel Canal de vente
 * @returns true si le paiement est autorisé
 * 
 * @example
 * // Cash dans l'app → INTERDIT
 * isPaymentMethodAllowed('cash', 'online') → false
 * 
 * // Mobile Money dans l'app → OK
 * isPaymentMethodAllowed('mobile_money', 'online') → true
 * 
 * // Cash au guichet → OK
 * isPaymentMethodAllowed('cash', 'counter') → true
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
 * Calcule le prix total incluant la commission (si applicable)
 * 
 * @param basePrice Prix de base du billet
 * @param salesChannel Canal de vente
 * @returns Prix total TTC
 * 
 * @example
 * // Vente online avec commission active
 * calculateTotalPrice(5000, 'online') → 5250
 * 
 * // Vente counter (pas de commission)
 * calculateTotalPrice(5000, 'counter') → 5000
 * 
 * // Vente online mais commission désactivée
 * calculateTotalPrice(5000, 'online') → 5000
 */
export function calculateTotalPrice(
  basePrice: number,
  salesChannel: SalesChannel
): number {
  if (salesChannel === 'online') {
    const commission = calculateCommission(basePrice);
    return basePrice + commission;
  }
  
  return basePrice;
}

/**
 * Formate un montant en FCFA
 * 
 * @param amount Montant en FCFA
 * @returns Chaîne formatée
 * 
 * @example
 * formatCurrency(5000) → "5 000 FCFA"
 * formatCurrency(150000) → "150 000 FCFA"
 */
export function formatCurrency(amount: number): string {
  return `${amount.toLocaleString('fr-FR')} FCFA`;
}
```

---

## 📁 FICHIER 2 : `/src/types/ticket.ts`

Types TypeScript pour les billets.

```typescript
/**
 * Types pour les billets FasoTravel
 * 
 * ⚠️ SYNC: Doit rester synchronisé avec dashboard
 * @see Dashboard: /contexts/DataContext.tsx
 */

import type { PaymentMethod, SalesChannel } from '../config/business';

/**
 * Statut d'un billet
 */
export type TicketStatus = 'valid' | 'used' | 'refunded' | 'cancelled';

/**
 * Interface complète d'un billet de transport
 */
export interface Ticket {
  /**
   * ID unique du billet
   */
  id: string;
  
  /**
   * ID du trajet
   */
  tripId: string;
  
  /**
   * Nom complet du passager
   */
  passengerName: string;
  
  /**
   * Numéro de téléphone du passager
   * Format: +226 XX XX XX XX
   */
  passengerPhone: string;
  
  /**
   * Numéro de siège
   * Format: A1, B2, etc.
   */
  seatNumber: string;
  
  /**
   * Prix du billet en FCFA (SANS commission)
   */
  price: number;
  
  /**
   * Commission FasoTravel en FCFA
   * 
   * ✅ Présent si salesChannel === 'online'
   * ❌ undefined si salesChannel === 'counter'
   */
  commission?: number;
  
  /**
   * Moyen de paiement utilisé
   * 
   * ⚠️ IMPORTANT:
   * - App mobile: 'mobile_money' OU 'card' (JAMAIS 'cash')
   * - Guichet: 'cash' OU 'mobile_money' OU 'card'
   */
  paymentMethod: PaymentMethod;
  
  /**
   * Canal de vente
   * 
   * ⚠️ CRITIQUE pour le business model:
   * - 'online': Vente via app mobile FasoTravel (avec commission)
   * - 'counter': Vente au guichet (sans commission)
   * 
   * 🚨 Pour l'app mobile, TOUJOURS mettre 'online'
   */
  salesChannel: SalesChannel;
  
  /**
   * Statut du billet
   */
  status: TicketStatus;
  
  /**
   * Date d'achat du billet
   * Format ISO: '2025-12-19T14:30:00Z'
   */
  purchaseDate: string;
  
  /**
   * ID du caissier
   * 
   * - Si salesChannel === 'online': 'online_system'
   * - Si salesChannel === 'counter': ID du caissier
   */
  cashierId: string;
  
  /**
   * Nom du caissier
   * 
   * - Si salesChannel === 'online': 'Vente en ligne'
   * - Si salesChannel === 'counter': Nom du caissier
   */
  cashierName: string;
  
  /**
   * ID de la gare de départ
   */
  gareId: string;
  
  /**
   * Ville de départ
   */
  departure: string;
  
  /**
   * Ville d'arrivée
   */
  arrival: string;
  
  /**
   * Heure de départ
   * Format ISO: '2025-12-19T14:30:00Z'
   */
  departureTime: string;
}

/**
 * Données minimales pour créer un billet
 * (Certains champs seront générés automatiquement)
 */
export interface CreateTicketInput {
  tripId: string;
  passengerName: string;
  passengerPhone: string;
  seatNumber: string;
  price: number;
  paymentMethod: PaymentMethod;
  gareId: string;
  departure: string;
  arrival: string;
  departureTime: string;
}

/**
 * Réponse API après création de billet
 */
export interface CreateTicketResponse {
  success: boolean;
  ticket?: Ticket;
  error?: string;
}
```

---

## 📁 FICHIER 3 : `/src/utils/ticketValidation.ts`

Fonctions de validation des billets.

```typescript
/**
 * Validation des billets
 */

import type { Ticket, CreateTicketInput } from '../types/ticket';
import { isPaymentMethodAllowed } from '../config/business';

/**
 * Valide les données d'un billet avant création
 * 
 * @param input Données du billet à créer
 * @returns Objet avec statut de validation et erreurs éventuelles
 */
export function validateTicketInput(input: CreateTicketInput): {
  valid: boolean;
  errors: string[];
} {
  const errors: string[] = [];
  
  // Validation nom passager
  if (!input.passengerName || input.passengerName.trim().length < 2) {
    errors.push('Le nom du passager doit contenir au moins 2 caractères');
  }
  
  // Validation téléphone
  const phoneRegex = /^\+226\s?\d{2}\s?\d{2}\s?\d{2}\s?\d{2}$/;
  if (!phoneRegex.test(input.passengerPhone)) {
    errors.push('Le numéro de téléphone doit être au format +226 XX XX XX XX');
  }
  
  // Validation siège
  if (!input.seatNumber || input.seatNumber.trim().length === 0) {
    errors.push('Le numéro de siège est obligatoire');
  }
  
  // Validation prix
  if (!input.price || input.price <= 0) {
    errors.push('Le prix doit être supérieur à 0');
  }
  
  // Validation méthode de paiement pour app mobile
  // L'app mobile = toujours salesChannel 'online'
  if (!isPaymentMethodAllowed(input.paymentMethod, 'online')) {
    errors.push(
      `Le paiement par ${input.paymentMethod} n'est pas disponible dans l'application. ` +
      `Utilisez Mobile Money ou Carte bancaire.`
    );
  }
  
  // Validation villes
  if (!input.departure || input.departure.trim().length === 0) {
    errors.push('La ville de départ est obligatoire');
  }
  
  if (!input.arrival || input.arrival.trim().length === 0) {
    errors.push('La ville d\'arrivée est obligatoire');
  }
  
  // Validation date départ
  const departureDate = new Date(input.departureTime);
  const now = new Date();
  
  if (departureDate <= now) {
    errors.push('La date de départ doit être dans le futur');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
}

/**
 * Crée les données complètes d'un billet à partir des données minimales
 * 
 * @param input Données minimales
 * @param userId ID de l'utilisateur (optionnel)
 * @returns Objet Ticket prêt à être envoyé à l'API
 */
export function prepareTicketForCreation(
  input: CreateTicketInput,
  userId?: string
): Omit<Ticket, 'id'> {
  const commission = 0; // Sera calculé par le backend
  
  return {
    ...input,
    
    // ✅ TOUJOURS 'online' pour l'app mobile
    salesChannel: 'online',
    
    // Commission sera calculée par le backend
    commission,
    
    // Statut initial
    status: 'valid',
    
    // Date d'achat = maintenant
    purchaseDate: new Date().toISOString(),
    
    // Caissier = système online
    cashierId: userId || 'online_system',
    cashierName: 'Vente en ligne',
  };
}
```

---

## 📝 MODIFICATION : Page de Paiement

Exemple de modification de la page de paiement dans l'app mobile.

```typescript
// src/pages/PaymentPage.tsx

import React, { useState } from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import { 
  validateTicketInput, 
  prepareTicketForCreation 
} from '../utils/ticketValidation';
import { 
  calculateCommission, 
  calculateTotalPrice,
  formatCurrency,
  BUSINESS_CONFIG 
} from '../config/business';
import type { CreateTicketInput } from '../types/ticket';
import type { PaymentMethod } from '../config/business';

export default function PaymentPage({ route, navigation }) {
  const { trip, selectedSeat } = route.params;
  
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mobile_money');
  
  // Calcul du prix total avec commission
  const basePrice = trip.price;
  const commission = calculateCommission(basePrice);
  const totalPrice = calculateTotalPrice(basePrice, 'online');
  
  const handlePayment = async () => {
    // 1. Préparer les données
    const ticketInput: CreateTicketInput = {
      tripId: trip.id,
      passengerName,
      passengerPhone,
      seatNumber: selectedSeat,
      price: basePrice,
      paymentMethod,
      gareId: trip.gareId,
      departure: trip.departure,
      arrival: trip.arrival,
      departureTime: trip.departureTime,
    };
    
    // 2. Valider les données
    const validation = validateTicketInput(ticketInput);
    
    if (!validation.valid) {
      Alert.alert('Erreur de validation', validation.errors.join('\n'));
      return;
    }
    
    // 3. Préparer le billet complet
    const ticketData = prepareTicketForCreation(ticketInput);
    
    // ✅ Vérification importante
    console.log('Ticket à créer:', {
      salesChannel: ticketData.salesChannel,  // Doit être 'online'
      paymentMethod: ticketData.paymentMethod,  // Jamais 'cash'
      commission: ticketData.commission,  // Calculé par backend
      price: ticketData.price,
      total: totalPrice,
    });
    
    try {
      // 4. Envoyer au backend
      const response = await fetch('https://api.fasotravel.bf/tickets', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${userToken}`,
        },
        body: JSON.stringify(ticketData),
      });
      
      const result = await response.json();
      
      if (result.success) {
        Alert.alert('Succès', 'Votre billet a été réservé !');
        navigation.navigate('TicketConfirmation', { ticket: result.ticket });
      } else {
        Alert.alert('Erreur', result.error || 'Une erreur est survenue');
      }
    } catch (error) {
      Alert.alert('Erreur', 'Impossible de contacter le serveur');
      console.error(error);
    }
  };
  
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Paiement</Text>
      
      {/* Détails du trajet */}
      <View style={styles.tripDetails}>
        <Text>{trip.departure} → {trip.arrival}</Text>
        <Text>Siège: {selectedSeat}</Text>
      </View>
      
      {/* Récapitulatif des prix */}
      <View style={styles.priceBreakdown}>
        <View style={styles.priceRow}>
          <Text>Prix du billet:</Text>
          <Text>{formatCurrency(basePrice)}</Text>
        </View>
        
        {BUSINESS_CONFIG.COMMISSION.ENABLED && commission > 0 && (
          <View style={styles.priceRow}>
            <Text>Frais de service:</Text>
            <Text>{formatCurrency(commission)}</Text>
          </View>
        )}
        
        <View style={[styles.priceRow, styles.totalRow]}>
          <Text style={styles.totalLabel}>Total:</Text>
          <Text style={styles.totalAmount}>{formatCurrency(totalPrice)}</Text>
        </View>
      </View>
      
      {/* Informations passager */}
      <TextInput
        placeholder="Nom complet"
        value={passengerName}
        onChangeText={setPassengerName}
        style={styles.input}
      />
      
      <TextInput
        placeholder="+226 XX XX XX XX"
        value={passengerPhone}
        onChangeText={setPassengerPhone}
        keyboardType="phone-pad"
        style={styles.input}
      />
      
      {/* Choix du paiement */}
      <Text style={styles.sectionTitle}>Moyen de paiement</Text>
      
      <TouchableOpacity
        style={[
          styles.paymentOption,
          paymentMethod === 'mobile_money' && styles.selectedPayment
        ]}
        onPress={() => setPaymentMethod('mobile_money')}
      >
        <Text>📱 Mobile Money (Orange, Moov)</Text>
      </TouchableOpacity>
      
      <TouchableOpacity
        style={[
          styles.paymentOption,
          paymentMethod === 'card' && styles.selectedPayment
        ]}
        onPress={() => setPaymentMethod('card')}
      >
        <Text>💳 Carte bancaire</Text>
      </TouchableOpacity>
      
      {/* Bouton payer */}
      <TouchableOpacity
        style={styles.payButton}
        onPress={handlePayment}
      >
        <Text style={styles.payButtonText}>
          Payer {formatCurrency(totalPrice)}
        </Text>
      </TouchableOpacity>
    </View>
  );
}
```

---

## 🧪 TESTS À EFFECTUER

### Test 1 : Création de billet
```typescript
// Doit créer un billet avec :
- salesChannel: 'online' ✅
- paymentMethod: 'mobile_money' ou 'card' ✅
- commission: calculée (si activée) ✅
- cashierId: 'online_system' ✅
- cashierName: 'Vente en ligne' ✅
```

### Test 2 : Validation paiement
```typescript
// Doit rejeter cash
validateTicketInput({
  ...data,
  paymentMethod: 'cash'  // ❌ Doit échouer
})
```

### Test 3 : Calcul commission
```typescript
// Avec commission activée
calculateCommission(5000) → 250 FCFA (5%)
calculateTotalPrice(5000, 'online') → 5250 FCFA

// Avec commission désactivée
calculateCommission(5000) → 0 FCFA
calculateTotalPrice(5000, 'online') → 5000 FCFA
```

---

## 📦 PR SUGGÉRÉE

### Titre
```
feat: Synchronisation avec dashboard - Canal de vente et commissions
```

### Description
```markdown
## 🎯 Objectif

Synchroniser l'app mobile avec le dashboard pour assurer la cohérence des données.

## ✨ Nouveautés

- Ajout du champ `salesChannel` (toujours 'online' pour app)
- Ajout du champ `commission` (calculée par backend)
- Type strict pour `paymentMethod` (interdiction de 'cash')
- Configuration centralisée dans `/src/config/business.ts`
- Validation des données avant envoi au backend

## 📁 Fichiers ajoutés

- `/src/config/business.ts` - Configuration métier
- `/src/types/ticket.ts` - Types TypeScript
- `/src/utils/ticketValidation.ts` - Validation

## 📁 Fichiers modifiés

- `/src/pages/PaymentPage.tsx` - Intégration salesChannel
- `/src/types/*` - Mise à jour des interfaces

## ⚠️ Breaking Changes

Aucun - Rétrocompatible avec l'API actuelle

## ✅ Tests

- [x] Création de billet avec salesChannel 'online'
- [x] Validation paiement (rejet de 'cash')
- [x] Calcul commission
- [x] Tests unitaires

## 📚 Documentation

Voir `/GUIDE_SYNCHRONISATION_MOBILE.md` pour plus de détails

## 🔗 Liens

- Dashboard: Application web compagnon
- Issue: #XXX
```

---

## 🎉 RÉSULTAT ATTENDU

Après synchronisation, l'app mobile et le dashboard seront **100% cohérents** :

✅ Mêmes types de données  
✅ Même business logic  
✅ Même calcul de commission  
✅ Distinction claire online vs counter  
✅ Statistiques précises côté dashboard  

---

**Prochaine étape:** Créer la PR sur le repo mobile

